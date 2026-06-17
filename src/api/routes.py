"""
ATLAS FRAMEWORK 2026 - ROUTES
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from datetime import datetime, timezone
from api.models import (
    db, Empresa, Usuario, ConfiguracionFaseEmpresa,
    Formulario, PreguntaFormulario, AsignacionFormulario, RespuestaFormulario,
    ProgresoFase, RetoPlantilla, AsignacionReto, RetoTransformar,
    PromptLiderar, RetoLiderar, SeguimientoDirectivo,
    AsegurarDocente, AsegurarDirectivoPanorama, AsegurarDirectivoDiagnostico, AsegurarDirectivoPlan,
    SostenerDocente, SostenerInstitucional,
    ProgresoMicromodulo, HuellaCompassHistory, InventarioIA
)
from api.compass import calcular_y_guardar_huella
import uuid

api = Blueprint('api', __name__)
CORS(api)


# ══════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════

def get_usuario_actual():
    uid = get_jwt_identity()
    return db.session.get(Usuario, uid)

def solo_admin(u):    return u and u.rol == "ADMIN"
def solo_docente(u):  return u and u.rol == "DOCENTE"
def solo_directivo(u):return u and u.rol == "DIRECTIVO"
def doc_o_dir(u):     return u and u.rol in ("DOCENTE", "DIRECTIVO")

def fase_abierta(empresa_id, fase):
    if not empresa_id:
        return False
    cfg = ConfiguracionFaseEmpresa.query.filter_by(empresa_id=empresa_id, fase=fase).first()
    return cfg.esta_abierta if cfg else False

def gen_id(prefix=""):
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"


# ══════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════

@api.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "Email y contraseña requeridos"}), 400
    usuario = Usuario.query.filter_by(email=email).first()
    if not usuario or not check_password_hash(usuario.password_hash, password):
        return jsonify({"error": "Credenciales inválidas"}), 401
    if not usuario.is_active:
        return jsonify({"error": "Usuario inactivo"}), 403
    usuario.fecha_ultimo_login = datetime.now(timezone.utc)
    db.session.commit()
    token = create_access_token(identity=usuario.id)
    return jsonify({"token": token, "usuario": usuario.serialize()}), 200


@api.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    u = get_usuario_actual()
    if not u:
        return jsonify({"error": "No encontrado"}), 404
    return jsonify(u.serialize()), 200


# ══════════════════════════════════════════════════════════════════════
# EMPRESAS
# ══════════════════════════════════════════════════════════════════════

@api.route('/empresas', methods=['GET'])
@jwt_required()
def get_empresas():
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    return jsonify([e.serialize() for e in Empresa.query.all()]), 200


@api.route('/empresas', methods=['POST'])
@jwt_required()
def crear_empresa():
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    data = request.get_json()
    if not data.get("nombre"): return jsonify({"error": "nombre requerido"}), 400
    e = Empresa(
        nombre=data["nombre"], nit=data.get("nit"),
        ciudad=data.get("ciudad"), pais=data.get("pais", "Colombia"),
        logo_url=data.get("logo_url"),
        fecha_inicio_atlas=datetime.fromisoformat(data["fecha_inicio_atlas"]) if data.get("fecha_inicio_atlas") else None
    )
    db.session.add(e); db.session.commit()
    return jsonify(e.serialize()), 201


@api.route('/empresas/<int:eid>', methods=['PUT'])
@jwt_required()
def actualizar_empresa(eid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    e = Empresa.query.get_or_404(eid)
    data = request.get_json()
    for c in ["nombre","nit","ciudad","pais","logo_url","is_active"]:
        if c in data: setattr(e, c, data[c])
    if "fecha_inicio_atlas" in data:
        e.fecha_inicio_atlas = datetime.fromisoformat(data["fecha_inicio_atlas"]) if data["fecha_inicio_atlas"] else None
    db.session.commit()
    return jsonify(e.serialize()), 200


@api.route('/empresas/<int:eid>', methods=['DELETE'])
@jwt_required()
def eliminar_empresa(eid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    e = Empresa.query.get_or_404(eid)
    db.session.delete(e); db.session.commit()
    return jsonify({"message": "Empresa eliminada"}), 200


@api.route('/empresas/<int:eid>/analisis', methods=['GET'])
@jwt_required()
def analisis_empresa(eid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    empresa = Empresa.query.get_or_404(eid)
    usuarios = Usuario.query.filter_by(empresa_id=eid, is_active=True).all()
    ids = [x.id for x in usuarios]
    total = len(ids) or 1
    huella_prom = round(sum(x.huella_compass_total for x in usuarios) / total, 2)

    respondieron = db.session.query(RespuestaFormulario.usuario_id)\
        .filter(RespuestaFormulario.usuario_id.in_(ids)).distinct().count()
    completaron_t = db.session.query(RetoTransformar.usuario_id)\
        .filter(RetoTransformar.usuario_id.in_(ids), RetoTransformar.status_reto=="COMPLETADO").distinct().count()
    completaron_l = db.session.query(PromptLiderar.usuario_id)\
        .filter(PromptLiderar.usuario_id.in_(ids)).distinct().count()
    asegurar_ok = AsegurarDocente.query.filter(
        AsegurarDocente.usuario_id.in_(ids), AsegurarDocente.status=="COMPLETADO").count()

    sostener = SostenerDocente.query.filter(SostenerDocente.usuario_id.in_(ids)).all()
    niveles = {"N1":0,"N2":0,"N3":0,"N4":0}
    for s in sostener:
        if s.nivel_calculado in niveles: niveles[s.nivel_calculado] += 1

    return jsonify({
        "empresa": empresa.serialize(), "total_usuarios": total,
        "huella_promedio": huella_prom,
        "cumplimiento_fases": {
            "AUDITAR":     {"completados": respondieron,   "pct": round(respondieron/total*100,1)},
            "TRANSFORMAR": {"completados": completaron_t,  "pct": round(completaron_t/total*100,1)},
            "LIDERAR":     {"completados": completaron_l,  "pct": round(completaron_l/total*100,1)},
            "ASEGURAR":    {"completados": asegurar_ok,    "pct": round(asegurar_ok/total*100,1)},
        },
        "sostener_niveles": niveles,
    }), 200


# ══════════════════════════════════════════════════════════════════════
# USUARIOS
# ══════════════════════════════════════════════════════════════════════

@api.route('/usuarios', methods=['GET'])
@jwt_required()
def get_usuarios():
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    eid = request.args.get("empresa_id", type=int)
    rol = request.args.get("rol")
    q = Usuario.query
    if eid: q = q.filter_by(empresa_id=eid)
    if rol: q = q.filter_by(rol=rol)
    return jsonify([x.serialize() for x in q.all()]), 200


@api.route('/usuarios', methods=['POST'])
@jwt_required()
def crear_usuario():
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    data = request.get_json()
    for c in ["nombre_completo","email","password","rol"]:
        if not data.get(c): return jsonify({"error": f"{c} requerido"}), 400
    if data["rol"] not in ("ADMIN","DOCENTE","DIRECTIVO"):
        return jsonify({"error": "Rol inválido"}), 400
    if Usuario.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"error": "Email ya existe"}), 409
    nuevo = Usuario(
        teacher_key=f"TK-{gen_id()}",
        nombre_completo=data["nombre_completo"],
        email=data["email"].strip().lower(),
        password_hash=generate_password_hash(data["password"]),
        rol=data["rol"], empresa_id=data.get("empresa_id"), is_active=True
    )
    db.session.add(nuevo); db.session.commit()
    return jsonify(nuevo.serialize()), 201


@api.route('/usuarios/<int:uid>', methods=['PUT'])
@jwt_required()
def actualizar_usuario(uid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    usuario = Usuario.query.get_or_404(uid)
    data = request.get_json()
    for c in ["nombre_completo","rol","empresa_id","is_active"]:
        if c in data: setattr(usuario, c, data[c])
    if "password" in data:
        usuario.password_hash = generate_password_hash(data["password"])
    db.session.commit()
    return jsonify(usuario.serialize()), 200


@api.route('/usuarios/<int:uid>', methods=['DELETE'])
@jwt_required()
def eliminar_usuario(uid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    usuario = Usuario.query.get_or_404(uid)
    db.session.delete(usuario); db.session.commit()
    return jsonify({"message": "Eliminado"}), 200


# ══════════════════════════════════════════════════════════════════════
# FASES (apertura/cierre por empresa)
# ══════════════════════════════════════════════════════════════════════

@api.route('/empresas/<int:eid>/fases', methods=['GET'])
@jwt_required()
def get_fases_empresa(eid):
    fases = ConfiguracionFaseEmpresa.query.filter_by(empresa_id=eid).all()
    return jsonify([f.serialize() for f in fases]), 200


@api.route('/empresas/<int:eid>/fases', methods=['POST'])
@jwt_required()
def configurar_fase(eid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    data = request.get_json()
    fase = data.get("fase")
    if fase not in ["AUDITAR","TRANSFORMAR","LIDERAR","ASEGURAR","SOSTENER"]:
        return jsonify({"error": "Fase inválida"}), 400
    cfg = ConfiguracionFaseEmpresa.query.filter_by(empresa_id=eid, fase=fase).first()
    if not cfg:
        cfg = ConfiguracionFaseEmpresa(empresa_id=eid, fase=fase, creado_por_admin_id=u.id)
        db.session.add(cfg)
    if "fecha_apertura" in data:
        cfg.fecha_apertura = datetime.fromisoformat(data["fecha_apertura"]) if data["fecha_apertura"] else None
    if "fecha_cierre" in data:
        cfg.fecha_cierre = datetime.fromisoformat(data["fecha_cierre"]) if data["fecha_cierre"] else None
    if "is_activa" in data: cfg.is_activa = data["is_activa"]
    if "descripcion_admin" in data: cfg.descripcion_admin = data["descripcion_admin"]
    db.session.commit()
    return jsonify(cfg.serialize()), 200


@api.route('/fases/<int:fid>', methods=['PUT'])
@jwt_required()
def actualizar_fase(fid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    cfg = ConfiguracionFaseEmpresa.query.get_or_404(fid)
    data = request.get_json()
    if "fecha_apertura" in data:
        cfg.fecha_apertura = datetime.fromisoformat(data["fecha_apertura"]) if data["fecha_apertura"] else None
    if "fecha_cierre" in data:
        cfg.fecha_cierre = datetime.fromisoformat(data["fecha_cierre"]) if data["fecha_cierre"] else None
    if "is_activa" in data: cfg.is_activa = data["is_activa"]
    if "descripcion_admin" in data: cfg.descripcion_admin = data["descripcion_admin"]
    db.session.commit()
    return jsonify(cfg.serialize()), 200


@api.route('/mi-empresa/fases', methods=['GET'])
@jwt_required()
def mis_fases():
    u = get_usuario_actual()
    if not u.empresa_id: return jsonify({"error": "Sin empresa"}), 400
    fases = ConfiguracionFaseEmpresa.query.filter_by(empresa_id=u.empresa_id).all()
    return jsonify([f.serialize() for f in fases]), 200


# ══════════════════════════════════════════════════════════════════════
# FORMULARIOS - FASE AUDITAR
# ══════════════════════════════════════════════════════════════════════

@api.route('/formularios', methods=['GET'])
@jwt_required()
def get_formularios():
    u = get_usuario_actual()
    if solo_admin(u):
        return jsonify([f.serialize() for f in Formulario.query.all()]), 200
    if not u.empresa_id: return jsonify({"error": "Sin empresa"}), 400
    asigs = AsignacionFormulario.query.filter_by(empresa_id=u.empresa_id).all()
    ids = [a.formulario_id for a in asigs]
    forms = Formulario.query.filter(
        Formulario.id.in_(ids),
        Formulario.rol_destino.in_([u.rol, "TODOS"])
    ).all()
    return jsonify([f.serialize() for f in forms]), 200


@api.route('/formularios', methods=['POST'])
@jwt_required()
def crear_formulario():
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    data = request.get_json()
    if not data.get("titulo"): return jsonify({"error": "titulo requerido"}), 400
    f = Formulario(
        id_form=f"FORM-{gen_id()}",
        titulo=data["titulo"], descripcion=data.get("descripcion"),
        fase_atlas=data.get("fase_atlas","AUDITAR"),
        puntos_maximos=data.get("puntos_maximos", 100.0),
        rol_destino=data.get("rol_destino","TODOS"),
        creado_por_admin_id=u.id
    )
    db.session.add(f); db.session.commit()
    return jsonify(f.serialize()), 201


@api.route('/formularios/<int:fid>', methods=['PUT'])
@jwt_required()
def actualizar_formulario(fid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    f = Formulario.query.get_or_404(fid)
    data = request.get_json()
    for c in ["titulo","descripcion","fase_atlas","puntos_maximos","rol_destino","is_active"]:
        if c in data: setattr(f, c, data[c])
    db.session.commit()
    return jsonify(f.serialize()), 200


@api.route('/formularios/<int:fid>', methods=['DELETE'])
@jwt_required()
def eliminar_formulario(fid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    f = Formulario.query.get_or_404(fid)
    db.session.delete(f); db.session.commit()
    return jsonify({"message": "Eliminado"}), 200


@api.route('/formularios/<int:fid>/preguntas', methods=['GET'])
@jwt_required()
def get_preguntas(fid):
    pregs = PreguntaFormulario.query.filter_by(formulario_id=fid)\
        .order_by(PreguntaFormulario.orden_pregunta).all()
    return jsonify([p.serialize() for p in pregs]), 200


@api.route('/formularios/<int:fid>/preguntas', methods=['POST'])
@jwt_required()
def crear_pregunta(fid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    Formulario.query.get_or_404(fid)
    data = request.get_json()
    if not data.get("texto_pregunta"): return jsonify({"error": "texto_pregunta requerido"}), 400
    p = PreguntaFormulario(
        formulario_id=fid,
        texto_pregunta=data["texto_pregunta"],
        tipo_respuesta=data.get("tipo_respuesta","ESCALA"),
        opciones_seleccion=data.get("opciones_seleccion"),
        puntaje_asociado=data.get("puntaje_asociado", 0),
        orden_pregunta=data.get("orden_pregunta", 1)
    )
    db.session.add(p); db.session.commit()
    return jsonify(p.serialize()), 201


@api.route('/preguntas/<int:pid>', methods=['PUT'])
@jwt_required()
def actualizar_pregunta(pid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    p = PreguntaFormulario.query.get_or_404(pid)
    data = request.get_json()
    for c in ["texto_pregunta","tipo_respuesta","opciones_seleccion","puntaje_asociado","orden_pregunta"]:
        if c in data: setattr(p, c, data[c])
    db.session.commit()
    return jsonify(p.serialize()), 200


@api.route('/preguntas/<int:pid>', methods=['DELETE'])
@jwt_required()
def eliminar_pregunta(pid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    p = PreguntaFormulario.query.get_or_404(pid)
    db.session.delete(p); db.session.commit()
    return jsonify({"message": "Eliminada"}), 200


@api.route('/empresas/<int:eid>/formularios/<int:fid>', methods=['POST'])
@jwt_required()
def asignar_formulario(eid, fid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    Empresa.query.get_or_404(eid); Formulario.query.get_or_404(fid)
    if AsignacionFormulario.query.filter_by(empresa_id=eid, formulario_id=fid).first():
        return jsonify({"message": "Ya asignado"}), 200
    a = AsignacionFormulario(empresa_id=eid, formulario_id=fid)
    db.session.add(a); db.session.commit()
    return jsonify(a.serialize()), 201


@api.route('/empresas/<int:eid>/formularios/<int:fid>', methods=['DELETE'])
@jwt_required()
def desasignar_formulario(eid, fid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    a = AsignacionFormulario.query.filter_by(empresa_id=eid, formulario_id=fid).first_or_404()
    db.session.delete(a); db.session.commit()
    return jsonify({"message": "Desasignado"}), 200


@api.route('/respuestas', methods=['POST'])
@jwt_required()
def enviar_respuestas():
    u = get_usuario_actual()
    if not doc_o_dir(u): return jsonify({"error": "Solo DOCENTE o DIRECTIVO"}), 403
    if not fase_abierta(u.empresa_id, "AUDITAR"):
        return jsonify({"error": "Fase AUDITAR no activa"}), 403
    data = request.get_json()
    form_id = data.get("formulario_id")
    resps = data.get("respuestas", [])
    if not form_id or not resps: return jsonify({"error": "Faltan datos"}), 400
    if RespuestaFormulario.query.filter_by(usuario_id=u.id, formulario_id=form_id).first():
        return jsonify({"error": "Ya respondiste este formulario"}), 409
    for r in resps:
        db.session.add(RespuestaFormulario(
            usuario_id=u.id, formulario_id=form_id,
            pregunta_id=r.get("pregunta_id"),
            valor_respondido=str(r.get("valor","")),
            puntos_ganados=float(r.get("puntos",0))
        ))
    db.session.commit()
    calcular_y_guardar_huella(u.id, "AUDITAR_FORMULARIO")
    return jsonify({"message": "Respuestas guardadas", "total": len(resps)}), 201


@api.route('/mis-respuestas', methods=['GET'])
@jwt_required()
def mis_respuestas():
    u = get_usuario_actual()
    fid = request.args.get("formulario_id", type=int)
    q = RespuestaFormulario.query.filter_by(usuario_id=u.id)
    if fid: q = q.filter_by(formulario_id=fid)
    return jsonify([r.serialize() for r in q.all()]), 200


@api.route('/respuestas', methods=['GET'])
@jwt_required()
def get_respuestas_admin():
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    eid = request.args.get("empresa_id", type=int)
    fid = request.args.get("formulario_id", type=int)
    q = RespuestaFormulario.query
    if fid: q = q.filter_by(formulario_id=fid)
    if eid:
        ids = [x.id for x in Usuario.query.filter_by(empresa_id=eid).all()]
        q = q.filter(RespuestaFormulario.usuario_id.in_(ids))
    return jsonify([r.serialize() for r in q.all()]), 200


# ══════════════════════════════════════════════════════════════════════
# RETOS PLANTILLA
# ══════════════════════════════════════════════════════════════════════

@api.route('/retos-plantilla', methods=['GET'])
@jwt_required()
def get_retos_plantilla():
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    fase = request.args.get("fase")
    q = RetoPlantilla.query
    if fase: q = q.filter_by(fase=fase)
    return jsonify([r.serialize() for r in q.all()]), 200


@api.route('/retos-plantilla', methods=['POST'])
@jwt_required()
def crear_reto_plantilla():
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    data = request.get_json()
    if not data.get("nombre_reto") or not data.get("fase"):
        return jsonify({"error": "nombre_reto y fase requeridos"}), 400
    r = RetoPlantilla(
        id_reto=f"RETO-{gen_id()}",
        nombre_reto=data["nombre_reto"],
        descripcion=data.get("descripcion"),
        fase=data["fase"],
        nivel_unesco=data.get("nivel_unesco"),
        numero_reto=data.get("numero_reto"),
        rol_destino=data.get("rol_destino","DOCENTE"),
        peso_huella=data.get("peso_huella", 10.0),
        config_json=data.get("config_json"),
        creado_por_id=u.id
    )
    db.session.add(r); db.session.commit()
    return jsonify(r.serialize()), 201


@api.route('/retos-plantilla/<int:rid>', methods=['PUT'])
@jwt_required()
def actualizar_reto_plantilla(rid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    r = RetoPlantilla.query.get_or_404(rid)
    data = request.get_json()
    for c in ["nombre_reto","descripcion","fase","nivel_unesco","numero_reto","rol_destino","peso_huella","config_json","is_active"]:
        if c in data: setattr(r, c, data[c])
    db.session.commit()
    return jsonify(r.serialize()), 200


@api.route('/retos-plantilla/<int:rid>', methods=['DELETE'])
@jwt_required()
def eliminar_reto_plantilla(rid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    r = RetoPlantilla.query.get_or_404(rid)
    db.session.delete(r); db.session.commit()
    return jsonify({"message": "Eliminado"}), 200


@api.route('/empresas/<int:eid>/retos/<int:rid>', methods=['POST'])
@jwt_required()
def asignar_reto(eid, rid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    Empresa.query.get_or_404(eid); RetoPlantilla.query.get_or_404(rid)
    if AsignacionReto.query.filter_by(empresa_id=eid, reto_plantilla_id=rid).first():
        return jsonify({"message": "Ya asignado"}), 200
    data = request.get_json() or {}
    a = AsignacionReto(empresa_id=eid, reto_plantilla_id=rid,
                       numero_orden=data.get("numero_orden",1))
    db.session.add(a); db.session.commit()
    return jsonify(a.serialize()), 201


@api.route('/empresas/<int:eid>/retos/<int:rid>', methods=['DELETE'])
@jwt_required()
def desasignar_reto(eid, rid):
    u = get_usuario_actual()
    if not solo_admin(u): return jsonify({"error": "Solo ADMIN"}), 403
    a = AsignacionReto.query.filter_by(empresa_id=eid, reto_plantilla_id=rid).first_or_404()
    db.session.delete(a); db.session.commit()
    return jsonify({"message": "Desasignado"}), 200


@api.route('/mis-retos', methods=['GET'])
@jwt_required()
def mis_retos():
    u = get_usuario_actual()
    if not u.empresa_id: return jsonify({"error": "Sin empresa"}), 400
    fase = request.args.get("fase")
    asigs = AsignacionReto.query.filter_by(empresa_id=u.empresa_id)\
        .order_by(AsignacionReto.numero_orden).all()
    result = []
    for a in asigs:
        rp = a.reto_plantilla
        if not rp or not rp.is_active: continue
        if fase and rp.fase != fase: continue
        if rp.rol_destino not in (u.rol, "TODOS"): continue
        result.append({**rp.serialize(), "numero_orden": a.numero_orden})
    return jsonify(result), 200


# ══════════════════════════════════════════════════════════════════════
# TRANSFORMAR
# ══════════════════════════════════════════════════════════════════════

@api.route('/transformar', methods=['GET'])
@jwt_required()
def get_retos_transformar():
    u = get_usuario_actual()
    status = request.args.get("status")
    q = RetoTransformar.query.filter_by(usuario_id=u.id)
    if status: q = q.filter_by(status_reto=status)
    return jsonify([r.serialize() for r in q.order_by(RetoTransformar.numero_reto).all()]), 200


@api.route('/transformar', methods=['POST'])
@jwt_required()
def guardar_reto_transformar():
    u = get_usuario_actual()
    if not solo_docente(u): return jsonify({"error": "Solo DOCENTE"}), 403
    if not fase_abierta(u.empresa_id, "TRANSFORMAR"):
        return jsonify({"error": "Fase TRANSFORMAR no activa"}), 403
    data = request.get_json()
    numero = data.get("numero_reto")
    if not numero: return jsonify({"error": "numero_reto requerido"}), 400
    status = data.get("status_reto","BORRADOR")
    reto = RetoTransformar.query.filter_by(
        usuario_id=u.id, numero_reto=numero, status_reto="BORRADOR").first()
    if not reto:
        reto = RetoTransformar(
            id_registro=f"RT-{gen_id()}",
            usuario_id=u.id, numero_reto=numero,
            reto_plantilla_id=data.get("reto_plantilla_id"),
            nombre_reto=data.get("nombre_reto",""),
            nivel_unesco=data.get("nivel_unesco","")
        )
        db.session.add(reto)
    for c in ["datos_json","reflexion_1","reflexion_2","decision_final","autoevaluacion_status"]:
        if c in data: setattr(reto, c, data[c])
    reto.status_reto = status
    db.session.commit()
    if status == "COMPLETADO":
        calcular_y_guardar_huella(u.id, "TRANSFORMAR_RETO")
    return jsonify(reto.serialize()), 200


@api.route('/transformar/<int:rid>/feedback', methods=['PUT'])
@jwt_required()
def feedback_transformar(rid):
    u = get_usuario_actual()
    if not solo_directivo(u): return jsonify({"error": "Solo DIRECTIVO"}), 403
    reto = RetoTransformar.query.get_or_404(rid)
    data = request.get_json()
    reto.feedback_directivo = data.get("feedback_directivo")
    reto.estado_revision_directivo = data.get("estado_revision_directivo","REVISADO")
    if reto.estado_revision_directivo == "REVISADO": reto.status_reto = "REVISADO"
    db.session.commit()
    return jsonify(reto.serialize()), 200


@api.route('/transformar/empresa/<int:eid>', methods=['GET'])
@jwt_required()
def transformar_empresa(eid):
    u = get_usuario_actual()
    if not (solo_admin(u) or (solo_directivo(u) and u.empresa_id == eid)):
        return jsonify({"error": "No autorizado"}), 403
    ids = [x.id for x in Usuario.query.filter_by(empresa_id=eid).all()]
    retos = RetoTransformar.query.filter(RetoTransformar.usuario_id.in_(ids)).all()
    return jsonify([r.serialize() for r in retos]), 200


# ══════════════════════════════════════════════════════════════════════
# LIDERAR
# ══════════════════════════════════════════════════════════════════════

@api.route('/prompts', methods=['GET'])
@jwt_required()
def get_prompts():
    u = get_usuario_actual()
    return jsonify([p.serialize() for p in PromptLiderar.query.filter_by(usuario_id=u.id).all()]), 200


@api.route('/prompts', methods=['POST'])
@jwt_required()
def crear_prompt():
    u = get_usuario_actual()
    if not doc_o_dir(u): return jsonify({"error": "Solo DOCENTE o DIRECTIVO"}), 403
    if not fase_abierta(u.empresa_id, "LIDERAR"):
        return jsonify({"error": "Fase LIDERAR no activa"}), 403
    data = request.get_json()
    if not data.get("prompt_original"): return jsonify({"error": "prompt_original requerido"}), 400
    pe = float(data.get("puntaje_etica",0))
    pp = float(data.get("puntaje_privacidad",0))
    pa = float(data.get("puntaje_agencia",0))
    pd = float(data.get("puntaje_dependencia",0))
    sim = round((pe+pp+pa+pd)/4, 2)
    prompt = PromptLiderar(
        id_prompt=f"PROM-{gen_id()}",
        usuario_id=u.id,
        prompt_original=data["prompt_original"],
        categoria_uso=data.get("categoria_uso"),
        puntaje_etica=pe, puntaje_privacidad=pp,
        puntaje_agencia=pa, puntaje_dependencia=pd,
        simulador_puntaje=sim,
        clasificacion_riesgo=data.get("clasificacion_riesgo"),
        sugerencia_mejora=data.get("sugerencia_mejora"),
        prompt_mejorado=data.get("prompt_mejorado"),
        es_publico=data.get("es_publico", False),
        status=data.get("status","completed")
    )
    db.session.add(prompt); db.session.commit()
    calcular_y_guardar_huella(u.id, "LIDERAR_PROMPT")
    return jsonify(prompt.serialize()), 201


@api.route('/prompts/<int:pid>', methods=['PUT'])
@jwt_required()
def actualizar_prompt(pid):
    u = get_usuario_actual()
    p = PromptLiderar.query.get_or_404(pid)
    if p.usuario_id != u.id and not solo_admin(u): return jsonify({"error": "No autorizado"}), 403
    data = request.get_json()
    for c in ["prompt_original","categoria_uso","puntaje_etica","puntaje_privacidad",
              "puntaje_agencia","puntaje_dependencia","clasificacion_riesgo",
              "sugerencia_mejora","prompt_mejorado","es_publico","status"]:
        if c in data: setattr(p, c, data[c])
    p.simulador_puntaje = round((p.puntaje_etica+p.puntaje_privacidad+p.puntaje_agencia+p.puntaje_dependencia)/4, 2)
    db.session.commit()
    return jsonify(p.serialize()), 200


@api.route('/prompts/empresa/<int:eid>', methods=['GET'])
@jwt_required()
def prompts_empresa(eid):
    u = get_usuario_actual()
    if not (solo_admin(u) or (solo_directivo(u) and u.empresa_id == eid)):
        return jsonify({"error": "No autorizado"}), 403
    ids = [x.id for x in Usuario.query.filter_by(empresa_id=eid).all()]
    return jsonify([p.serialize() for p in PromptLiderar.query.filter(PromptLiderar.usuario_id.in_(ids)).all()]), 200


@api.route('/retos-liderar', methods=['GET'])
@jwt_required()
def get_retos_liderar():
    u = get_usuario_actual()
    return jsonify([r.serialize() for r in RetoLiderar.query.filter_by(usuario_id=u.id).all()]), 200


@api.route('/retos-liderar', methods=['POST'])
@jwt_required()
def crear_reto_liderar():
    u = get_usuario_actual()
    if not doc_o_dir(u): return jsonify({"error": "Solo DOCENTE o DIRECTIVO"}), 403
    if not fase_abierta(u.empresa_id, "LIDERAR"):
        return jsonify({"error": "Fase LIDERAR no activa"}), 403
    data = request.get_json()
    r = RetoLiderar(
        id_reto_ejec=f"RL-{gen_id()}",
        usuario_id=u.id,
        reto_plantilla_id=data.get("reto_plantilla_id"),
        datos_json=data.get("datos_json"),
        status=data.get("status","completed"),
        puntos_obtenidos=data.get("puntos_obtenidos", 0)
    )
    db.session.add(r); db.session.commit()
    if r.status == "completed": calcular_y_guardar_huella(u.id, "LIDERAR_RETO")
    return jsonify(r.serialize()), 201


@api.route('/retos-liderar/<int:rid>', methods=['PUT'])
@jwt_required()
def actualizar_reto_liderar(rid):
    u = get_usuario_actual()
    r = RetoLiderar.query.get_or_404(rid)
    if r.usuario_id != u.id: return jsonify({"error": "No autorizado"}), 403
    data = request.get_json()
    for c in ["datos_json","status","puntos_obtenidos"]:
        if c in data: setattr(r, c, data[c])
    db.session.commit()
    if r.status == "completed": calcular_y_guardar_huella(u.id, "LIDERAR_RETO")
    return jsonify(r.serialize()), 200


# ══════════════════════════════════════════════════════════════════════
# SEGUIMIENTO DIRECTIVO
# ══════════════════════════════════════════════════════════════════════

@api.route('/seguimiento', methods=['GET'])
@jwt_required()
def get_seguimiento():
    u = get_usuario_actual()
    if not solo_directivo(u): return jsonify({"error": "Solo DIRECTIVO"}), 403
    return jsonify([s.serialize() for s in SeguimientoDirectivo.query.filter_by(usuario_id=u.id).all()]), 200


@api.route('/seguimiento', methods=['POST'])
@jwt_required()
def crear_seguimiento():
    u = get_usuario_actual()
    if not solo_directivo(u): return jsonify({"error": "Solo DIRECTIVO"}), 403
    data = request.get_json()
    s = SeguimientoDirectivo(
        id_seguimiento=f"SEG-{gen_id()}",
        usuario_id=u.id,
        accion_activada=data.get("accion_activada"),
        dimension_priorizada=data.get("dimension_priorizada"),
        docente_mentor_key=data.get("docente_mentor_key"),
        cumplimiento_validado=data.get("cumplimiento_validado"),
        riesgo_alto_actual=data.get("riesgo_alto_actual"),
        fase_asegurar_status=data.get("fase_asegurar_status"),
        entendido_gobernanza=data.get("entendido_gobernanza", False)
    )
    db.session.add(s); db.session.commit()
    return jsonify(s.serialize()), 201


@api.route('/mis-notificaciones', methods=['GET'])
@jwt_required()
def mis_notificaciones():
    u = get_usuario_actual()
    notifs = SeguimientoDirectivo.query.filter_by(docente_mentor_key=u.teacher_key).all()
    return jsonify([n.serialize() for n in notifs]), 200


# ══════════════════════════════════════════════════════════════════════
# ASEGURAR - DOCENTE
# ══════════════════════════════════════════════════════════════════════

@api.route('/asegurar/docente', methods=['GET'])
@jwt_required()
def get_asegurar_docente():
    u = get_usuario_actual()
    t = AsegurarDocente.query.filter_by(usuario_id=u.id).first()
    if not t: return jsonify({"message": "Sin datos"}), 404
    return jsonify(t.serialize()), 200


@api.route('/asegurar/docente', methods=['POST', 'PUT'])
@jwt_required()
def guardar_asegurar_docente():
    u = get_usuario_actual()
    if not solo_docente(u): return jsonify({"error": "Solo DOCENTE"}), 403
    if not fase_abierta(u.empresa_id, "ASEGURAR"):
        return jsonify({"error": "Fase ASEGURAR no activa"}), 403
    data = request.get_json()
    t = AsegurarDocente.query.filter_by(usuario_id=u.id).first()
    if not t:
        t = AsegurarDocente(usuario_id=u.id)
        db.session.add(t)
    for c in ["prompt_original","alertas_detectadas","bloques_activados","prompt_mejorado",
              "riesgo_previo","riesgo_final","reflexion_1_cambios","reflexion_2_riesgos",
              "reflexion_3_supervision","reflexion_4_cognicion","estandar_seleccionado",
              "url_doc_exportable","status"]:
        if c in data: setattr(t, c, data[c])
    if data.get("status") == "COMPLETADO":
        t.fecha_finalizacion = datetime.now(timezone.utc)
    db.session.commit()
    if t.status == "COMPLETADO": calcular_y_guardar_huella(u.id, "ASEGURAR_DOCENTE")
    return jsonify(t.serialize()), 200


# ══════════════════════════════════════════════════════════════════════
# ASEGURAR - DIRECTIVO
# ══════════════════════════════════════════════════════════════════════

@api.route('/asegurar/directivo/panorama', methods=['GET'])
@jwt_required()
def get_panorama():
    u = get_usuario_actual()
    p = AsegurarDirectivoPanorama.query.filter_by(usuario_id=u.id).first()
    if not p: return jsonify({"message": "Sin datos"}), 404
    return jsonify(p.serialize()), 200


@api.route('/asegurar/directivo/panorama', methods=['POST', 'PUT'])
@jwt_required()
def guardar_panorama():
    u = get_usuario_actual()
    if not solo_directivo(u): return jsonify({"error": "Solo DIRECTIVO"}), 403
    if not fase_abierta(u.empresa_id, "ASEGURAR"):
        return jsonify({"error": "Fase ASEGURAR no activa"}), 403
    data = request.get_json()
    p = AsegurarDirectivoPanorama.query.filter_by(usuario_id=u.id).first()
    if not p:
        p = AsegurarDirectivoPanorama(usuario_id=u.id)
        db.session.add(p)
    for c in ["visto_bloque_1","visto_bloque_2","visto_bloque_3","visto_bloque_4",
              "feedback_opcional","status"]:
        if c in data: setattr(p, c, data[c])
    db.session.commit()
    return jsonify(p.serialize()), 200


@api.route('/asegurar/directivo/diagnostico', methods=['GET'])
@jwt_required()
def get_diagnostico():
    u = get_usuario_actual()
    d = AsegurarDirectivoDiagnostico.query.filter_by(usuario_id=u.id).first()
    if not d: return jsonify({"message": "Sin datos"}), 404
    return jsonify(d.serialize()), 200


@api.route('/asegurar/directivo/diagnostico', methods=['POST', 'PUT'])
@jwt_required()
def guardar_diagnostico():
    u = get_usuario_actual()
    if not solo_directivo(u): return jsonify({"error": "Solo DIRECTIVO"}), 403
    if not fase_abierta(u.empresa_id, "ASEGURAR"):
        return jsonify({"error": "Fase ASEGURAR no activa"}), 403
    data = request.get_json()
    d = AsegurarDirectivoDiagnostico.query.filter_by(usuario_id=u.id).first()
    if not d:
        d = AsegurarDirectivoDiagnostico(usuario_id=u.id)
        db.session.add(d)
    campos = [
        "gobernanza_1","gobernanza_2","gobernanza_3","gobernanza_4",
        "competencia_1","competencia_2","competencia_3","competencia_4",
        "datos_1","datos_2","datos_3","datos_4",
        "supervision_1","supervision_2","supervision_3","supervision_4",
        "transparencia_1","transparencia_2","transparencia_3","transparencia_4","status"
    ]
    for c in campos:
        if c in data: setattr(d, c, data[c])
    # Calcular puntaje total y clasificación
    vals = [getattr(d, c) or 0 for c in campos if c != "status"]
    d.puntaje_total_radar = sum(vals)
    t = d.puntaje_total_radar
    d.clasificacion_final = "INICIAL" if t < 40 else "EN_DESARROLLO" if t < 60 else "AVANZADO" if t < 80 else "LIDER"
    db.session.commit()
    return jsonify(d.serialize()), 200


@api.route('/asegurar/directivo/plan', methods=['GET'])
@jwt_required()
def get_plan():
    u = get_usuario_actual()
    p = AsegurarDirectivoPlan.query.filter_by(usuario_id=u.id).first()
    if not p: return jsonify({"message": "Sin datos"}), 404
    return jsonify(p.serialize()), 200


@api.route('/asegurar/directivo/plan', methods=['POST', 'PUT'])
@jwt_required()
def guardar_plan():
    u = get_usuario_actual()
    if not solo_directivo(u): return jsonify({"error": "Solo DIRECTIVO"}), 403
    if not fase_abierta(u.empresa_id, "ASEGURAR"):
        return jsonify({"error": "Fase ASEGURAR no activa"}), 403
    data = request.get_json()
    p = AsegurarDirectivoPlan.query.filter_by(usuario_id=u.id).first()
    if not p:
        p = AsegurarDirectivoPlan(usuario_id=u.id)
        db.session.add(p)
    for c in ["dimension_prioridad_1","dimension_prioridad_2","objetivo_estrategico",
              "acciones_seleccionadas","responsables_asignados","cronograma_estimado",
              "indicadores_exito","status"]:
        if c in data: setattr(p, c, data[c])
    db.session.commit()
    if p.status == "COMPLETADO": calcular_y_guardar_huella(u.id, "ASEGURAR_DIRECTIVO_PLAN")
    return jsonify(p.serialize()), 200


@api.route('/asegurar/empresa/<int:eid>', methods=['GET'])
@jwt_required()
def asegurar_empresa(eid):
    u = get_usuario_actual()
    if not (solo_admin(u) or (solo_directivo(u) and u.empresa_id == eid)):
        return jsonify({"error": "No autorizado"}), 403
    ids = [x.id for x in Usuario.query.filter_by(empresa_id=eid).all()]
    return jsonify({
        "talleres_docentes": [d.serialize() for d in AsegurarDocente.query.filter(AsegurarDocente.usuario_id.in_(ids)).all()],
        "panoramas": [p.serialize() for p in AsegurarDirectivoPanorama.query.filter(AsegurarDirectivoPanorama.usuario_id.in_(ids)).all()],
        "diagnosticos": [d.serialize() for d in AsegurarDirectivoDiagnostico.query.filter(AsegurarDirectivoDiagnostico.usuario_id.in_(ids)).all()],
        "planes": [p.serialize() for p in AsegurarDirectivoPlan.query.filter(AsegurarDirectivoPlan.usuario_id.in_(ids)).all()],
    }), 200


# ══════════════════════════════════════════════════════════════════════
# SOSTENER - DOCENTE
# ══════════════════════════════════════════════════════════════════════

@api.route('/sostener/docente', methods=['GET'])
@jwt_required()
def get_sostener_docente():
    u = get_usuario_actual()
    registros = SostenerDocente.query.filter_by(usuario_id=u.id)\
        .order_by(SostenerDocente.fecha_evaluacion).all()
    return jsonify([r.serialize() for r in registros]), 200


@api.route('/sostener/docente', methods=['POST'])
@jwt_required()
def crear_sostener_docente():
    u = get_usuario_actual()
    if not solo_docente(u): return jsonify({"error": "Solo DOCENTE"}), 403
    if not fase_abierta(u.empresa_id, "SOSTENER"):
        return jsonify({"error": "Fase SOSTENER no activa"}), 403
    data = request.get_json()
    nuevo = SostenerDocente(
        id_sostener=f"SOS-{gen_id()}",
        usuario_id=u.id, empresa_id=u.empresa_id,
        periodo=data.get("periodo")
    )
    for i in range(1,7):   setattr(nuevo, f"d1_p{i}", data.get(f"d1_p{i}", 0))
    for i in range(7,13):  setattr(nuevo, f"d2_p{i}", data.get(f"d2_p{i}", 0))
    for i in range(13,19): setattr(nuevo, f"d3_p{i}", data.get(f"d3_p{i}", 0))
    for i in range(19,25): setattr(nuevo, f"d4_p{i}", data.get(f"d4_p{i}", 0))

    d1 = round(sum(getattr(nuevo, f"d1_p{i}") or 0 for i in range(1,7))/6, 2)
    d2 = round(sum(getattr(nuevo, f"d2_p{i}") or 0 for i in range(7,13))/6, 2)
    d3 = round(sum(getattr(nuevo, f"d3_p{i}") or 0 for i in range(13,19))/6, 2)
    d4 = round(sum(getattr(nuevo, f"d4_p{i}") or 0 for i in range(19,25))/6, 2)
    nuevo.promedio_d1, nuevo.promedio_d2 = d1, d2
    nuevo.promedio_d3, nuevo.promedio_d4 = d3, d4
    nuevo.promedio_global = round((d1+d2+d3+d4)/4, 2)
    pg = nuevo.promedio_global
    nuevo.nivel_calculado = "N1" if pg < 2.0 else "N2" if pg < 2.8 else "N3" if pg < 3.5 else "N4"
    nuevo.alertas_activas = str(sum(1 for p in [d1,d2,d3,d4] if p < 2.0))

    anterior = SostenerDocente.query.filter_by(usuario_id=u.id)\
        .order_by(SostenerDocente.fecha_evaluacion.desc()).first()
    if anterior and anterior.promedio_global and anterior.promedio_global > 0:
        nuevo.porcentaje_crecimiento = round(
            ((nuevo.promedio_global - anterior.promedio_global) / anterior.promedio_global) * 100, 2)
    else:
        nuevo.porcentaje_crecimiento = 0.0

    for c in ["reflexion_antes","reflexion_despues","aprendizaje_clave",
              "prioridad_sostener","compromiso_accion","evidencia_mejora"]:
        if c in data: setattr(nuevo, c, data[c])
    if data.get("fecha_revision_plan"):
        nuevo.fecha_revision_plan = datetime.fromisoformat(data["fecha_revision_plan"])

    db.session.add(nuevo); db.session.commit()
    calcular_y_guardar_huella(u.id, "SOSTENER_DOCENTE")
    return jsonify(nuevo.serialize()), 201


@api.route('/sostener/docente/<int:sid>', methods=['PUT'])
@jwt_required()
def actualizar_sostener_docente(sid):
    u = get_usuario_actual()
    r = SostenerDocente.query.get_or_404(sid)
    if r.usuario_id != u.id: return jsonify({"error": "No autorizado"}), 403
    data = request.get_json()
    for c in ["reflexion_antes","reflexion_despues","aprendizaje_clave",
              "prioridad_sostener","compromiso_accion","evidencia_mejora"]:
        if c in data: setattr(r, c, data[c])
    db.session.commit()
    return jsonify(r.serialize()), 200


# ══════════════════════════════════════════════════════════════════════
# SOSTENER - INSTITUCIONAL
# ══════════════════════════════════════════════════════════════════════

@api.route('/sostener/institucional', methods=['GET'])
@jwt_required()
def get_sostener_institucional():
    u = get_usuario_actual()
    r = SostenerInstitucional.query.filter_by(usuario_id=u.id).first()
    if not r: return jsonify({"message": "Sin datos"}), 404
    return jsonify(r.serialize()), 200


@api.route('/sostener/institucional', methods=['POST', 'PUT'])
@jwt_required()
def guardar_sostener_institucional():
    u = get_usuario_actual()
    if not solo_directivo(u): return jsonify({"error": "Solo DIRECTIVO"}), 403
    if not fase_abierta(u.empresa_id, "SOSTENER"):
        return jsonify({"error": "Fase SOSTENER no activa"}), 403
    data = request.get_json()
    r = SostenerInstitucional.query.filter_by(usuario_id=u.id).first()
    if not r:
        r = SostenerInstitucional(
            id_sostener_inst=f"SINST-{gen_id()}",
            usuario_id=u.id, empresa_id=u.empresa_id
        )
        db.session.add(r)
    for c in ["reflexion_punto_partida","estado_cumplimiento_asegurar","analisis_implementacion",
              "nivel_institucional_actual","docentes_n1","porcentaje_reduccion_alertas",
              "ruta_elegida","prioridad_estrategica_anual","accion_gobernanza",
              "indicador_medible","estrategia_comunicacion"]:
        if c in data: setattr(r, c, data[c])
    if data.get("fecha_revision_institucional"):
        r.fecha_revision_institucional = datetime.fromisoformat(data["fecha_revision_institucional"])
    db.session.commit()
    calcular_y_guardar_huella(u.id, "SOSTENER_INSTITUCIONAL")
    return jsonify(r.serialize()), 200


@api.route('/sostener/empresa/<int:eid>', methods=['GET'])
@jwt_required()
def sostener_empresa(eid):
    u = get_usuario_actual()
    if not (solo_admin(u) or (solo_directivo(u) and u.empresa_id == eid)):
        return jsonify({"error": "No autorizado"}), 403
    ids = [x.id for x in Usuario.query.filter_by(empresa_id=eid).all()]
    registros = SostenerDocente.query.filter(SostenerDocente.usuario_id.in_(ids)).all()
    ultimos = {}
    for r in registros:
        if r.usuario_id not in ultimos or r.fecha_evaluacion > ultimos[r.usuario_id].fecha_evaluacion:
            ultimos[r.usuario_id] = r
    lista = list(ultimos.values())
    total = len(lista) or 1
    niveles = {"N1":0,"N2":0,"N3":0,"N4":0}
    d1=d2=d3=d4=0
    for r in lista:
        if r.nivel_calculado in niveles: niveles[r.nivel_calculado] += 1
        d1 += r.promedio_d1 or 0; d2 += r.promedio_d2 or 0
        d3 += r.promedio_d3 or 0; d4 += r.promedio_d4 or 0
    cierre = SostenerInstitucional.query.filter_by(empresa_id=eid).first()
    return jsonify({
        "empresa_id": eid, "total_evaluados": total,
        "distribucion_niveles": niveles,
        "promedios_dimensiones": {
            "D1": round(d1/total,2), "D2": round(d2/total,2),
            "D3": round(d3/total,2), "D4": round(d4/total,2),
        },
        "cierre_institucional": cierre.serialize() if cierre else None,
    }), 200


# ══════════════════════════════════════════════════════════════════════
# MICROMÓDULOS
# ══════════════════════════════════════════════════════════════════════

@api.route('/micromodulos', methods=['GET'])
@jwt_required()
def get_micromodulos():
    u = get_usuario_actual()
    return jsonify([m.serialize() for m in ProgresoMicromodulo.query.filter_by(usuario_id=u.id).all()]), 200


@api.route('/micromodulos', methods=['POST'])
@jwt_required()
def crear_micromodulo():
    u = get_usuario_actual()
    data = request.get_json()
    mid = data.get("modulo_id")
    if not mid: return jsonify({"error": "modulo_id requerido"}), 400
    m = ProgresoMicromodulo.query.filter_by(usuario_id=u.id, modulo_id=mid).first()
    if not m:
        m = ProgresoMicromodulo(usuario_id=u.id, modulo_id=mid)
        db.session.add(m)
    for c in ["status_lectura","nota_quiz","actividad_texto","foro_aporte"]:
        if c in data: setattr(m, c, data[c])
    if data.get("status_lectura") == "COMPLETADO":
        m.fecha_finalizacion = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(m.serialize()), 200


@api.route('/micromodulos/<int:mid>', methods=['PUT'])
@jwt_required()
def actualizar_micromodulo(mid):
    u = get_usuario_actual()
    m = ProgresoMicromodulo.query.get_or_404(mid)
    if m.usuario_id != u.id: return jsonify({"error": "No autorizado"}), 403
    data = request.get_json()
    for c in ["status_lectura","nota_quiz","actividad_texto","foro_aporte"]:
        if c in data: setattr(m, c, data[c])
    if data.get("status_lectura") == "COMPLETADO":
        m.fecha_finalizacion = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(m.serialize()), 200


# ══════════════════════════════════════════════════════════════════════
# INVENTARIO IA
# ══════════════════════════════════════════════════════════════════════

@api.route('/inventario-ia', methods=['GET'])
@jwt_required()
def get_inventario_ia():
    u = get_usuario_actual()
    eid = request.args.get("empresa_id", type=int)
    if eid and solo_admin(u):
        ids = [x.id for x in Usuario.query.filter_by(empresa_id=eid).all()]
        items = InventarioIA.query.filter(InventarioIA.usuario_id.in_(ids)).all()
    else:
        items = InventarioIA.query.filter_by(usuario_id=u.id).all()
    return jsonify([i.serialize() for i in items]), 200


@api.route('/inventario-ia', methods=['POST'])
@jwt_required()
def crear_inventario_ia():
    u = get_usuario_actual()
    data = request.get_json()
    if not data.get("nombre_ia"): return jsonify({"error": "nombre_ia requerido"}), 400
    item = InventarioIA(
        usuario_id=u.id, nombre_ia=data["nombre_ia"],
        uso_principal=data.get("uso_principal"),
        riesgo_detectado=data.get("riesgo_detectado")
    )
    db.session.add(item); db.session.commit()
    return jsonify(item.serialize()), 201


@api.route('/inventario-ia/<int:iid>', methods=['DELETE'])
@jwt_required()
def eliminar_inventario_ia(iid):
    u = get_usuario_actual()
    item = InventarioIA.query.get_or_404(iid)
    if item.usuario_id != u.id and not solo_admin(u): return jsonify({"error": "No autorizado"}), 403
    db.session.delete(item); db.session.commit()
    return jsonify({"message": "Eliminado"}), 200


# ══════════════════════════════════════════════════════════════════════
# PROGRESO FASES
# ══════════════════════════════════════════════════════════════════════

@api.route('/progreso-fases', methods=['GET'])
@jwt_required()
def get_progreso_fases():
    u = get_usuario_actual()
    return jsonify([p.serialize() for p in ProgresoFase.query.filter_by(usuario_id=u.id).all()]), 200


@api.route('/progreso-fases', methods=['POST'])
@jwt_required()
def upsert_progreso_fase():
    u = get_usuario_actual()
    data = request.get_json()
    fase = data.get("fase")
    if not fase: return jsonify({"error": "fase requerida"}), 400
    p = ProgresoFase.query.filter_by(usuario_id=u.id, fase=fase).first()
    if not p:
        p = ProgresoFase(usuario_id=u.id, fase=fase)
        db.session.add(p)
    if "capa_1_sentido" in data: p.capa_1_sentido = data["capa_1_sentido"]
    if "capa_3_hito_texto" in data: p.capa_3_hito_texto = data["capa_3_hito_texto"]
    p.fecha_actualizacion = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(p.serialize()), 200


# ══════════════════════════════════════════════════════════════════════
# HUELLA COMPASS
# ══════════════════════════════════════════════════════════════════════

@api.route('/huella', methods=['GET'])
@jwt_required()
def get_huella():
    u = get_usuario_actual()
    ultimo = HuellaCompassHistory.query.filter_by(usuario_id=u.id)\
        .order_by(HuellaCompassHistory.fecha_calculo.desc()).first()
    return jsonify({
        "usuario_id": u.id, "nombre": u.nombre_completo,
        "huella_total": u.huella_compass_total,
        "ultimo_calculo": ultimo.serialize() if ultimo else None
    }), 200


@api.route('/huella/historial', methods=['GET'])
@jwt_required()
def historial_huella():
    u = get_usuario_actual()
    h = HuellaCompassHistory.query.filter_by(usuario_id=u.id)\
        .order_by(HuellaCompassHistory.fecha_calculo).all()
    return jsonify([x.serialize() for x in h]), 200


@api.route('/huella/recalcular', methods=['POST'])
@jwt_required()
def recalcular_huella():
    u = get_usuario_actual()
    total = calcular_y_guardar_huella(u.id, "RECALCULO_MANUAL")
    return jsonify({"message": "Recalculado", "huella_total": total}), 200
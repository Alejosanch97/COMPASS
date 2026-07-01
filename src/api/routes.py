"""
ATLAS FRAMEWORK 2026 - ROUTES (PASO 1)
Solo: AUTH, EMPRESAS, USUARIOS, RETOS-PLANTILLA, FORMULARIOS
El resto de fases (Transformar, Liderar, Asegurar, Sostener, etc.)
se agregan después sin tocar este bloque base.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
from api.models import (
    db, Empresa, Usuario, ConfiguracionFaseEmpresa,
    Formulario, PreguntaFormulario, AsignacionFormulario,
    RetoPlantilla, AsignacionReto,
    ProgresoFase, RespuestaFormulario, RetoTransformar
)
import uuid

api = Blueprint('api', __name__)


# ══════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════

def get_usuario_actual():
    """IMPORTANTE: get_jwt_identity() devuelve un STRING (porque el token
    se creó con identity=str(usuario.id)). Hay que convertirlo a int
    para que SQLAlchemy lo pueda usar como primary key."""
    uid = get_jwt_identity()
    if not uid:
        return None
    return db.session.get(Usuario, int(uid))

def solo_admin(u):
    return u is not None and u.rol == "ADMIN"

def gen_id(prefix=""):
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"


# ══════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════

@api.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    teacher_key = (data.get("teacher_key") or "").strip().upper()
    password = data.get("password") or ""

    if not teacher_key or not password:
        return jsonify({"error": "Clave de usuario y contraseña requeridos"}), 400

    usuario = Usuario.query.filter_by(teacher_key=teacher_key).first()
    if not usuario or not check_password_hash(usuario.password_hash, password):
        return jsonify({"error": "Credenciales inválidas"}), 401
    if not usuario.is_active:
        return jsonify({"error": "Usuario inactivo"}), 403

    usuario.fecha_ultimo_login = datetime.now(timezone.utc)
    db.session.commit()

    # CRÍTICO: identity debe ser STRING, flask-jwt-extended moderno lo exige
    token = create_access_token(identity=str(usuario.id))

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
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403
    return jsonify([e.serialize() for e in Empresa.query.all()]), 200


@api.route('/empresas', methods=['POST'])
@jwt_required()
def crear_empresa():
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    data = request.get_json()
    if not data.get("nombre"):
        return jsonify({"error": "nombre requerido"}), 400

    fecha_inicio = None
    if data.get("fecha_inicio_atlas"):
        try:
            fecha_inicio = datetime.fromisoformat(data["fecha_inicio_atlas"])
        except (ValueError, TypeError):
            fecha_inicio = None

    e = Empresa(
        nombre=data["nombre"],
        nit=data.get("nit"),
        ciudad=data.get("ciudad"),
        pais=data.get("pais", "Colombia"),
        logo_url=data.get("logo_url"),
        fecha_inicio_atlas=fecha_inicio,
        is_active=data.get("is_active", True)
    )
    db.session.add(e)
    db.session.commit()
    return jsonify(e.serialize()), 201


@api.route('/empresas/<int:eid>', methods=['PUT'])
@jwt_required()
def actualizar_empresa(eid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    e = Empresa.query.get_or_404(eid)
    data = request.get_json()

    for c in ["nombre", "nit", "ciudad", "pais", "logo_url", "is_active"]:
        if c in data:
            setattr(e, c, data[c])

    if "fecha_inicio_atlas" in data:
        try:
            e.fecha_inicio_atlas = datetime.fromisoformat(data["fecha_inicio_atlas"]) if data["fecha_inicio_atlas"] else None
        except (ValueError, TypeError):
            pass

    db.session.commit()
    return jsonify(e.serialize()), 200


@api.route('/empresas/<int:eid>', methods=['DELETE'])
@jwt_required()
def eliminar_empresa(eid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    e = Empresa.query.get_or_404(eid)
    db.session.delete(e)
    db.session.commit()
    return jsonify({"message": "Empresa eliminada"}), 200


# ══════════════════════════════════════════════════════════════════════
# USUARIOS
# ══════════════════════════════════════════════════════════════════════

@api.route('/usuarios', methods=['GET'])
@jwt_required()
def get_usuarios():
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    eid = request.args.get("empresa_id", type=int)
    rol = request.args.get("rol")

    q = Usuario.query
    if eid:
        q = q.filter_by(empresa_id=eid)
    if rol:
        q = q.filter_by(rol=rol)

    return jsonify([x.serialize() for x in q.all()]), 200


@api.route('/usuarios', methods=['POST'])
@jwt_required()
def crear_usuario():
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    data = request.get_json()

    for c in ["nombre_completo", "email", "password", "rol"]:
        if not data.get(c):
            return jsonify({"error": f"{c} requerido"}), 400

    if data["rol"] not in ("ADMIN", "DOCENTE", "DIRECTIVO"):
        return jsonify({"error": "Rol inválido"}), 400

    if Usuario.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"error": "Email ya existe"}), 409

    nuevo = Usuario(
        teacher_key=f"TK-{gen_id()}",
        nombre_completo=data["nombre_completo"],
        email=data["email"].strip().lower(),
        password_hash=generate_password_hash(data["password"]),
        rol=data["rol"],
        empresa_id=data.get("empresa_id"),
        is_active=data.get("is_active", True)
    )
    db.session.add(nuevo)
    db.session.commit()
    return jsonify(nuevo.serialize()), 201


@api.route('/usuarios/<int:uid>', methods=['PUT'])
@jwt_required()
def actualizar_usuario(uid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    usuario = Usuario.query.get_or_404(uid)
    data = request.get_json()

    for c in ["nombre_completo", "rol", "empresa_id", "is_active"]:
        if c in data:
            setattr(usuario, c, data[c])

    if data.get("password"):
        usuario.password_hash = generate_password_hash(data["password"])

    db.session.commit()
    return jsonify(usuario.serialize()), 200


@api.route('/usuarios/<int:uid>', methods=['DELETE'])
@jwt_required()
def eliminar_usuario(uid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    usuario = Usuario.query.get_or_404(uid)
    db.session.delete(usuario)
    db.session.commit()
    return jsonify({"message": "Eliminado"}), 200


# ══════════════════════════════════════════════════════════════════════
# FASES (apertura/cierre por empresa) — necesarias para mi-empresa/fases
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
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    data = request.get_json()
    fase = data.get("fase")
    if fase not in ["AUDITAR", "TRANSFORMAR", "LIDERAR", "ASEGURAR", "SOSTENER"]:
        return jsonify({"error": "Fase inválida"}), 400

    cfg = ConfiguracionFaseEmpresa.query.filter_by(empresa_id=eid, fase=fase).first()
    if not cfg:
        cfg = ConfiguracionFaseEmpresa(empresa_id=eid, fase=fase, creado_por_admin_id=u.id)
        db.session.add(cfg)

    if "fecha_apertura" in data:
        cfg.fecha_apertura = datetime.fromisoformat(data["fecha_apertura"]) if data["fecha_apertura"] else None
    if "fecha_cierre" in data:
        cfg.fecha_cierre = datetime.fromisoformat(data["fecha_cierre"]) if data["fecha_cierre"] else None
    if "is_activa" in data:
        cfg.is_activa = data["is_activa"]
    if "descripcion_admin" in data:
        cfg.descripcion_admin = data["descripcion_admin"]

    db.session.commit()
    return jsonify(cfg.serialize()), 200


@api.route('/mi-empresa/fases', methods=['GET'])
@jwt_required()
def mis_fases():
    u = get_usuario_actual()
    if not u.empresa_id:
        return jsonify([]), 200
    fases = ConfiguracionFaseEmpresa.query.filter_by(empresa_id=u.empresa_id).all()
    return jsonify([f.serialize() for f in fases]), 200


# ══════════════════════════════════════════════════════════════════════
# FORMULARIOS (FASE AUDITAR)
# ══════════════════════════════════════════════════════════════════════

@api.route('/formularios', methods=['GET'])
@jwt_required()
def get_formularios():
    u = get_usuario_actual()
    if solo_admin(u):
        return jsonify([f.serialize() for f in Formulario.query.all()]), 200

    if not u.empresa_id:
        return jsonify([]), 200

    asigs = AsignacionFormulario.query.filter_by(empresa_id=u.empresa_id).all()
    ids = [a.formulario_id for a in asigs]
    forms = Formulario.query.filter(
        Formulario.id.in_(ids),
        Formulario.rol_destino.in_([u.rol, "TODOS"])
    ).all()
    return jsonify([f.serialize() for f in forms]), 200


@api.route('/formularios/completo', methods=['POST'])
@jwt_required()
def crear_formulario_completo():
    """
    Admin crea un formulario y todas sus preguntas en una sola llamada.
    Body: {
        "titulo": "...", "descripcion": "...", "fase_atlas": "AUDITAR",
        "rol_destino": "DOCENTE", "puntos_maximos": 100, "empresa_id": 1,
        "preguntas": [{ "texto_pregunta": "...", "tipo_respuesta": "ESCALA",
                         "opciones_seleccion": [...], "puntaje_asociado": 10 }, ...]
    }
    """
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    data = request.get_json()
    if not data.get("titulo") or not data.get("preguntas"):
        return jsonify({"error": "titulo y preguntas son requeridos"}), 400

    formulario = Formulario(
        id_form=f"FORM-{gen_id()}",
        titulo=data["titulo"],
        descripcion=data.get("descripcion"),
        fase_atlas=data.get("fase_atlas", "AUDITAR"),
        puntos_maximos=data.get("puntos_maximos", 100.0),
        rol_destino=data.get("rol_destino", "TODOS"),
        creado_por_admin_id=u.id
    )
    db.session.add(formulario)
    db.session.flush()  # para obtener formulario.id antes del commit

    for i, p in enumerate(data["preguntas"]):
        pregunta = PreguntaFormulario(
            formulario_id=formulario.id,
            texto_pregunta=p.get("texto_pregunta", ""),
            tipo_respuesta=p.get("tipo_respuesta", "ESCALA"),
            opciones_seleccion=p.get("opciones_seleccion"),
            puntaje_asociado=p.get("puntaje_asociado", 0),
            orden_pregunta=p.get("orden_pregunta", i + 1)
        )
        db.session.add(pregunta)

    db.session.commit()

    if data.get("empresa_id"):
        asignacion = AsignacionFormulario(empresa_id=data["empresa_id"], formulario_id=formulario.id)
        db.session.add(asignacion)
        db.session.commit()

    return jsonify(formulario.serialize()), 201


@api.route('/formularios/<int:fid>', methods=['PUT'])
@jwt_required()
def actualizar_formulario(fid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    f = Formulario.query.get_or_404(fid)
    data = request.get_json()
    for c in ["titulo", "descripcion", "fase_atlas", "puntos_maximos", "rol_destino", "is_active"]:
        if c in data:
            setattr(f, c, data[c])
    db.session.commit()
    return jsonify(f.serialize()), 200


@api.route('/formularios/<int:fid>', methods=['DELETE'])
@jwt_required()
def eliminar_formulario(fid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    f = Formulario.query.get_or_404(fid)
    db.session.delete(f)
    db.session.commit()
    return jsonify({"message": "Eliminado"}), 200


# ══════════════════════════════════════════════════════════════════════
# RETOS PLANTILLA (Transformar, Liderar, Asegurar, Sostener)
# ══════════════════════════════════════════════════════════════════════

@api.route('/retos-plantilla', methods=['GET'])
@jwt_required()
def get_retos_plantilla():
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    fase = request.args.get("fase")
    q = RetoPlantilla.query
    if fase:
        q = q.filter_by(fase=fase)
    return jsonify([r.serialize() for r in q.all()]), 200


@api.route('/retos-plantilla/completo', methods=['POST'])
@jwt_required()
def crear_reto_plantilla_completo():
    """
    Admin crea un reto plantilla con su banco de preguntas guardado en config_json.
    Body: {
        "nombre_reto": "...", "descripcion": "...", "fase": "TRANSFORMAR",
        "nivel_unesco": "ACQUIRE", "numero_reto": 1, "rol_destino": "DOCENTE",
        "peso_huella": 10, "empresa_id": 1, "numero_orden": 1,
        "preguntas": [{ "texto_pregunta": "...", "tipo_respuesta": "MULTIPLE",
                         "opciones_seleccion": [...], "puntaje_asociado": 5 }, ...]
    }
    """
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    data = request.get_json()
    if not data.get("nombre_reto") or not data.get("fase"):
        return jsonify({"error": "nombre_reto y fase son requeridos"}), 400

    config = {"preguntas": data.get("preguntas", [])}

    reto = RetoPlantilla(
        nombre=data["nombre_reto"],
        descripcion=data.get("descripcion"),
        fase=data["fase"],
        nivel_unesco=data.get("nivel_unesco"),
        rol_destino=data.get("rol_destino", "DOCENTE"),
        peso_huella=data.get("peso_huella", 10.0),
        config_json=config,
        creado_por_admin_id=u.id,
        contexto_narrativo=data.get("contexto_narrativo"),
        mision_texto=data.get("mision_texto"),
        objetivos_aprendizaje=data.get("objetivos_aprendizaje", []),
        preguntas_orientadoras=data.get("preguntas_orientadoras", []),
        conceptos_clave=data.get("conceptos_clave", []),
        autoevaluacion_items=data.get("autoevaluacion_items", []),
        lectura_previa=data.get("lectura_previa"),
    )
    db.session.add(reto)
    db.session.commit()

    if data.get("empresa_id"):
        asignacion = AsignacionReto(
            empresa_id=data["empresa_id"],
            reto_plantilla_id=reto.id,
            numero_orden=data.get("numero_orden", 1)
        )
        db.session.add(asignacion)
        db.session.commit()

    return jsonify(reto.serialize()), 201


@api.route('/retos-plantilla/<int:rid>', methods=['PUT'])
@jwt_required()
def actualizar_reto_plantilla(rid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    r = RetoPlantilla.query.get_or_404(rid)
    data = request.get_json()

    if "nombre_reto" in data:
        r.nombre = data["nombre_reto"]
    for c in ["descripcion", "fase", "nivel_unesco", "rol_destino", "peso_huella", "config_json", "is_active", "contexto_narrativo", "mision_texto", "objetivos_aprendizaje", "preguntas_orientadoras", "conceptos_clave", "autoevaluacion_items"]:
        if c in data:
            setattr(r, c, data[c])

    db.session.commit()
    return jsonify(r.serialize()), 200


@api.route('/retos-plantilla/<int:rid>', methods=['DELETE'])
@jwt_required()
def eliminar_reto_plantilla(rid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    r = RetoPlantilla.query.get_or_404(rid)
    db.session.delete(r)
    db.session.commit()
    return jsonify({"message": "Eliminado"}), 200


@api.route('/mis-retos', methods=['GET'])
@jwt_required()
def mis_retos():
    u = get_usuario_actual()
    if not u.empresa_id:
        return jsonify([]), 200

    fase = request.args.get("fase")
    asigs = AsignacionReto.query.filter_by(empresa_id=u.empresa_id)\
        .order_by(AsignacionReto.numero_orden).all()

    result = []
    for a in asigs:
        rp = a.reto_plantilla
        if not rp or not rp.is_active:
            continue
        if fase and rp.fase != fase:
            continue
        if rp.rol_destino not in (u.rol, "TODOS"):
            continue
        result.append({**rp.serialize(), "numero_orden": a.numero_orden})
    return jsonify(result), 200


# ══════════════════════════════════════════════════════════════════════
# EDICIÓN COMPLETA — Formulario (con sus preguntas) y Reto Plantilla
# Agregar esto a routes_PASO1.py, justo después de las rutas existentes
# de /formularios y /retos-plantilla respectivamente.
# ══════════════════════════════════════════════════════════════════════

@api.route('/formularios/<int:fid>/detalle', methods=['GET'])
@jwt_required()
def get_formulario_detalle(fid):
    """
    Devuelve el formulario junto con todas sus preguntas, en el mismo
    formato que espera el editor del front (CreadorRetos.jsx).
    """
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    f = Formulario.query.get_or_404(fid)
    preguntas = PreguntaFormulario.query.filter_by(formulario_id=fid)\
        .order_by(PreguntaFormulario.orden_pregunta).all()

    data = f.serialize()
    data["preguntas"] = [p.serialize() for p in preguntas]
    return jsonify(data), 200


@api.route('/formularios/<int:fid>/completo', methods=['PUT'])
@jwt_required()
def actualizar_formulario_completo(fid):
    """
    Reemplaza los datos generales del formulario Y todas sus preguntas.
    Body: igual que el POST de creación (titulo, descripcion, fase_atlas,
    rol_destino, puntos_maximos, preguntas: [...]).
    Estrategia: borra las preguntas viejas y crea las nuevas — más simple
    y seguro que intentar hacer match pregunta por pregunta.
    """
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    f = Formulario.query.get_or_404(fid)
    data = request.get_json()

    if not data.get("titulo") or not data.get("preguntas"):
        return jsonify({"error": "titulo y preguntas son requeridos"}), 400

    f.titulo = data["titulo"]
    f.descripcion = data.get("descripcion")
    f.fase_atlas = data.get("fase_atlas", f.fase_atlas)
    f.puntos_maximos = data.get("puntos_maximos", f.puntos_maximos)
    f.rol_destino = data.get("rol_destino", f.rol_destino)

    # Borra preguntas anteriores y crea las nuevas
    PreguntaFormulario.query.filter_by(formulario_id=fid).delete()

    for i, p in enumerate(data["preguntas"]):
        pregunta = PreguntaFormulario(
            formulario_id=f.id,
            texto_pregunta=p.get("texto_pregunta", ""),
            tipo_respuesta=p.get("tipo_respuesta", "ESCALA"),
            opciones_seleccion=p.get("opciones_seleccion"),
            puntaje_asociado=p.get("puntaje_asociado", 0),
            orden_pregunta=p.get("orden_pregunta", i + 1)
        )
        db.session.add(pregunta)

    db.session.commit()
    return jsonify(f.serialize()), 200


@api.route('/retos-plantilla/<int:rid>/completo', methods=['PUT'])
@jwt_required()
def actualizar_reto_plantilla_completo(rid):
    """
    Reemplaza los datos generales del reto Y su banco de preguntas
    (guardado dentro de config_json.preguntas).
    Body: igual que el POST de creación (nombre_reto, descripcion, fase,
    nivel_unesco, numero_reto, rol_destino, peso_huella, preguntas: [...]).
    """
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    r = RetoPlantilla.query.get_or_404(rid)
    data = request.get_json()

    if not data.get("nombre_reto") or not data.get("fase"):
        return jsonify({"error": "nombre_reto y fase son requeridos"}), 400

    
    r.nombre = data["nombre_reto"]
    r.descripcion = data.get("descripcion")
    r.fase = data["fase"]
    r.nivel_unesco = data.get("nivel_unesco")
    r.rol_destino = data.get("rol_destino", "DOCENTE")
    r.peso_huella = data.get("peso_huella", r.peso_huella)
    r.config_json = {"preguntas": data.get("preguntas", [])}
    r.contexto_narrativo = data.get("contexto_narrativo", r.contexto_narrativo)
    r.mision_texto = data.get("mision_texto", r.mision_texto)
    r.objetivos_aprendizaje = data.get("objetivos_aprendizaje", r.objetivos_aprendizaje)
    r.preguntas_orientadoras = data.get("preguntas_orientadoras", r.preguntas_orientadoras)
    r.conceptos_clave = data.get("conceptos_clave", r.conceptos_clave)
    r.autoevaluacion_items = data.get("autoevaluacion_items", r.autoevaluacion_items)
    r.lectura_previa = data.get("lectura_previa", r.lectura_previa)

    db.session.commit()
    return jsonify(r.serialize()), 200


# ══════════════════════════════════════════════════════════════════════
# HUELLA (placeholders mínimos para que el Dashboard no truene)
# ══════════════════════════════════════════════════════════════════════

@api.route('/huella', methods=['GET'])
@jwt_required()
def get_huella():
    u = get_usuario_actual()
    return jsonify({
        "usuario_id": u.id,
        "nombre": u.nombre_completo,
        "huella_total": u.huella_compass_total or 0,
        "ultimo_calculo": None
    }), 200


@api.route('/huella/historial', methods=['GET'])
@jwt_required()
def historial_huella():
    return jsonify([]), 200


@api.route('/mis-notificaciones', methods=['GET'])
@jwt_required()
def mis_notificaciones():
    return jsonify([]), 200


# ══════════════════════════════════════════════════════════════════════
# ASIGNACIÓN DE FORMULARIOS Y RETOS A EMPRESAS
# Agregar esto a routes.py, después de las rutas de retos-plantilla.
#
# PESOS POR FASE (cuánto vale cada fase en la Huella COMPASS, 100 pts total):
#   AUDITAR     → 20 pts
#   TRANSFORMAR → 30 pts
#   LIDERAR     → 15 pts
#   ASEGURAR    → 20 pts
#   SOSTENER    → 15 pts
#
# Lógica de progreso por empresa:
#   - AUDITAR: completo si tiene al menos 1 formulario asignado para DOCENTE
#     y 1 para DIRECTIVO (los dos roles que auditan).
#   - Las otras 4 fases: completo si tiene AL MENOS 1 reto asignado.
#     (No exigimos un número fijo de retos por fase — el admin decide
#     cuántos y cuáles asignar; "completo" = la fase tiene contenido.)
# ══════════════════════════════════════════════════════════════════════

PESOS_FASE = {
    "AUDITAR": 20,
    "TRANSFORMAR": 30,
    "LIDERAR": 15,
    "ASEGURAR": 20,
    "SOSTENER": 15,
}


# ── ASIGNAR / DESASIGNAR formularios y retos existentes ─────────────────

@api.route('/empresas/<int:eid>/formularios/<int:fid>/asignar', methods=['POST'])
@jwt_required()
def asignar_formulario_a_empresa(eid, fid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    Empresa.query.get_or_404(eid)
    Formulario.query.get_or_404(fid)

    existente = AsignacionFormulario.query.filter_by(empresa_id=eid, formulario_id=fid).first()
    if existente:
        return jsonify({"message": "Ya estaba asignado", "asignacion": existente.serialize()}), 200

    a = AsignacionFormulario(empresa_id=eid, formulario_id=fid)
    db.session.add(a)
    db.session.commit()
    return jsonify(a.serialize()), 201


@api.route('/empresas/<int:eid>/formularios/<int:fid>/asignar', methods=['DELETE'])
@jwt_required()
def desasignar_formulario_de_empresa(eid, fid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    a = AsignacionFormulario.query.filter_by(empresa_id=eid, formulario_id=fid).first_or_404()
    db.session.delete(a)
    db.session.commit()
    return jsonify({"message": "Formulario desasignado"}), 200


@api.route('/empresas/<int:eid>/retos/<int:rid>/asignar', methods=['POST'])
@jwt_required()
def asignar_reto_a_empresa(eid, rid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    Empresa.query.get_or_404(eid)
    reto = RetoPlantilla.query.get_or_404(rid)

    existente = AsignacionReto.query.filter_by(empresa_id=eid, reto_plantilla_id=rid).first()
    if existente:
        return jsonify({"message": "Ya estaba asignado", "asignacion": existente.serialize()}), 200

    data = request.get_json() or {}
    siguiente_orden = data.get("numero_orden")
    if siguiente_orden is None:
        existentes_misma_fase = db.session.query(AsignacionReto).join(RetoPlantilla)\
            .filter(AsignacionReto.empresa_id == eid, RetoPlantilla.fase == reto.fase).count()
        siguiente_orden = existentes_misma_fase + 1

    a = AsignacionReto(empresa_id=eid, reto_plantilla_id=rid, numero_orden=siguiente_orden)
    db.session.add(a)
    db.session.commit()
    return jsonify(a.serialize()), 201


@api.route('/empresas/<int:eid>/retos/<int:rid>/asignar', methods=['DELETE'])
@jwt_required()
def desasignar_reto_de_empresa(eid, rid):
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    a = AsignacionReto.query.filter_by(empresa_id=eid, reto_plantilla_id=rid).first_or_404()
    db.session.delete(a)
    db.session.commit()
    return jsonify({"message": "Reto desasignado"}), 200


@api.route('/empresas/<int:eid>/asignaciones', methods=['GET'])
@jwt_required()
def get_asignaciones_empresa(eid):
    """
    Devuelve TODO el panorama de asignación de una empresa:
    - Formularios asignados (Auditar)
    - Retos asignados, agrupados por fase
    - Porcentaje de progreso por fase y total general
    """
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    Empresa.query.get_or_404(eid)

    # ── Formularios (Auditar) ────────────────────────────────────────────
    asigs_form = AsignacionFormulario.query.filter_by(empresa_id=eid).all()
    formularios_asignados = []
    roles_auditar_cubiertos = set()
    for a in asigs_form:
        f = a.formulario
        if not f:
            continue
        formularios_asignados.append({
            "asignacion_id": a.id,
            "formulario_id": f.id,
            "titulo": f.titulo,
            "rol_destino": f.rol_destino,
            "puntos_maximos": f.puntos_maximos,
            "fase_atlas": f.fase_atlas,
        })
        if f.rol_destino in ("DOCENTE", "TODOS"):
            roles_auditar_cubiertos.add("DOCENTE")
        if f.rol_destino in ("DIRECTIVO", "TODOS"):
            roles_auditar_cubiertos.add("DIRECTIVO")

    auditar_completo = "DOCENTE" in roles_auditar_cubiertos and "DIRECTIVO" in roles_auditar_cubiertos

    # ── Retos (Transformar, Liderar, Asegurar, Sostener) ────────────────
    asigs_reto = AsignacionReto.query.filter_by(empresa_id=eid)\
        .order_by(AsignacionReto.numero_orden).all()

    retos_por_fase = {"TRANSFORMAR": [], "LIDERAR": [], "ASEGURAR": [], "SOSTENER": []}
    for a in asigs_reto:
        rp = a.reto_plantilla
        if not rp or rp.fase not in retos_por_fase:
            continue
        retos_por_fase[rp.fase].append({
            "asignacion_id": a.id,
            "reto_plantilla_id": rp.id,
            "nombre_reto": rp.nombre,
            "rol_destino": rp.rol_destino,
            "peso_huella": rp.peso_huella,
            "numero_orden": a.numero_orden,
            "nivel_unesco": rp.nivel_unesco,
        })

    # ── Cálculo de progreso por fase ─────────────────────────────────────
    progreso_fases = {}
    progreso_fases["AUDITAR"] = {
        "completo": auditar_completo,
        "porcentaje": 100 if auditar_completo else (50 if len(roles_auditar_cubiertos) == 1 else 0),
        "items_asignados": len(formularios_asignados),
        "peso_fase": PESOS_FASE["AUDITAR"],
    }
    for fase in ["TRANSFORMAR", "LIDERAR", "ASEGURAR", "SOSTENER"]:
        tiene_retos = len(retos_por_fase[fase]) > 0
        progreso_fases[fase] = {
            "completo": tiene_retos,
            "porcentaje": 100 if tiene_retos else 0,
            "items_asignados": len(retos_por_fase[fase]),
            "peso_fase": PESOS_FASE[fase],
        }

    # ── Porcentaje total ponderado por peso de cada fase ────────────────
    total_peso = sum(PESOS_FASE.values())
    avance_ponderado = sum(
        (progreso_fases[fase]["porcentaje"] / 100) * PESOS_FASE[fase]
        for fase in PESOS_FASE
    )
    porcentaje_total = round((avance_ponderado / total_peso) * 100, 1)

    return jsonify({
        "empresa_id": eid,
        "formularios_asignados": formularios_asignados,
        "retos_por_fase": retos_por_fase,
        "progreso_fases": progreso_fases,
        "porcentaje_total": porcentaje_total,
    }), 200


@api.route('/asignaciones/resumen-todas', methods=['GET'])
@jwt_required()
def get_resumen_todas_empresas():
    """
    Devuelve, para cada empresa, su porcentaje_total de asignación.
    Pensado para pintar una barra de progreso junto a cada empresa
    en la lista principal de Gestión de Empresas o en esta nueva page.
    """
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    empresas = Empresa.query.all()
    resultado = []

    for emp in empresas:
        asigs_form = AsignacionFormulario.query.filter_by(empresa_id=emp.id).all()
        roles_cubiertos = set()
        for a in asigs_form:
            f = a.formulario
            if not f:
                continue
            if f.rol_destino in ("DOCENTE", "TODOS"):
                roles_cubiertos.add("DOCENTE")
            if f.rol_destino in ("DIRECTIVO", "TODOS"):
                roles_cubiertos.add("DIRECTIVO")
        auditar_pct = 100 if len(roles_cubiertos) == 2 else (50 if len(roles_cubiertos) == 1 else 0)

        asigs_reto = AsignacionReto.query.filter_by(empresa_id=emp.id).all()
        fases_con_retos = set()
        for a in asigs_reto:
            rp = a.reto_plantilla
            if rp:
                fases_con_retos.add(rp.fase)

        porcentajes_fase = {"AUDITAR": auditar_pct}
        for fase in ["TRANSFORMAR", "LIDERAR", "ASEGURAR", "SOSTENER"]:
            porcentajes_fase[fase] = 100 if fase in fases_con_retos else 0

        total_peso = sum(PESOS_FASE.values())
        avance_ponderado = sum(
            (porcentajes_fase[fase] / 100) * PESOS_FASE[fase]
            for fase in PESOS_FASE
        )
        porcentaje_total = round((avance_ponderado / total_peso) * 100, 1)

        resultado.append({
            "empresa_id": emp.id,
            "empresa_nombre": emp.nombre,
            "porcentaje_total": porcentaje_total,
            "porcentajes_fase": porcentajes_fase,
        })

    return jsonify(resultado), 200


@api.route('/empresas/<int:eid>/asignaciones/reto/<int:rid>', methods=['PUT'])
@jwt_required()
def actualizar_orden_asignacion_reto(eid, rid):
    """
    Permite cambiar el numero_orden de un reto ya asignado a una empresa
    (ej: que el reto 3 pase a ser el primero en mostrarse).
    rid = id de RetoPlantilla (no de la asignación).
    """
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    a = AsignacionReto.query.filter_by(empresa_id=eid, reto_plantilla_id=rid).first_or_404()
    data = request.get_json()
    if "numero_orden" in data:
        a.numero_orden = data["numero_orden"]
    db.session.commit()
    return jsonify(a.serialize()), 200


@api.route('/empresas/<int:eid>/asignaciones/reto/<int:rid>/reemplazar', methods=['PUT'])
@jwt_required()
def reemplazar_reto_asignado(eid, rid):
    """
    Reemplaza un reto asignado por otro distinto (ej: la empresa ya no
    quiere el Reto 3, ahora quiere el Reto 4 en su lugar).
    rid = id de RetoPlantilla actualmente asignado (el que se va a quitar).
    Body: { "nuevo_reto_plantilla_id": 8 }
    """
    u = get_usuario_actual()
    if not solo_admin(u):
        return jsonify({"error": "Solo ADMIN"}), 403

    data = request.get_json()
    nuevo_id = data.get("nuevo_reto_plantilla_id")
    if not nuevo_id:
        return jsonify({"error": "nuevo_reto_plantilla_id requerido"}), 400

    RetoPlantilla.query.get_or_404(nuevo_id)

    a = AsignacionReto.query.filter_by(empresa_id=eid, reto_plantilla_id=rid).first_or_404()

    # Evita duplicar si el nuevo reto ya estaba asignado a esta empresa
    ya_existe = AsignacionReto.query.filter_by(empresa_id=eid, reto_plantilla_id=nuevo_id).first()
    if ya_existe and ya_existe.id != a.id:
        return jsonify({"error": "Ese reto ya está asignado a esta empresa"}), 409

    a.reto_plantilla_id = nuevo_id
    db.session.commit()
    return jsonify(a.serialize()), 200

# ══════════════════════════════════════════════════════════════════════
# FASE AUDITAR — Progreso de fase + Preguntas + Respuestas del usuario
# Agregar esto a routes.py, después de las rutas de /retos-plantilla.
# Usa los modelos: ProgresoFase, PreguntaFormulario, RespuestaFormulario
# ══════════════════════════════════════════════════════════════════════

@api.route('/progreso-fases', methods=['GET'])
@jwt_required()
def get_progreso_fases():
    """Devuelve todos los registros de progreso (Capa 1 / Capa 3) del usuario actual."""
    u = get_usuario_actual()
    registros = ProgresoFase.query.filter_by(usuario_id=u.id).all()
    return jsonify([r.serialize() for r in registros]), 200


@api.route('/progreso-fases', methods=['POST'])
@jwt_required()
def upsert_progreso_fase():
    """
    Crea o actualiza el registro de progreso de una fase para el usuario actual.
    Body: { "fase": "AUDITAR", "capa_1_sentido": "COMPLETADO", "capa_3_hito_texto": "..." }
    Si ya existe un registro para esa fase y ese usuario, lo actualiza; si no, lo crea.
    """
    u = get_usuario_actual()
    data = request.get_json()
    fase = data.get("fase")
    if not fase:
        return jsonify({"error": "fase requerida"}), 400

    registro = ProgresoFase.query.filter_by(usuario_id=u.id, fase=fase).first()
    if not registro:
        registro = ProgresoFase(usuario_id=u.id, fase=fase)
        db.session.add(registro)

    if "capa_1_sentido" in data:
        registro.capa_1_sentido = data["capa_1_sentido"]
    if "capa_3_hito_texto" in data:
        registro.capa_3_hito_texto = data["capa_3_hito_texto"]

    registro.fecha_actualizacion = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(registro.serialize()), 200


@api.route('/formularios/<int:fid>/preguntas', methods=['GET'])
@jwt_required()
def get_preguntas_formulario(fid):
    """Devuelve las preguntas de un formulario (para abrir el modal de responder)."""
    preguntas = PreguntaFormulario.query.filter_by(formulario_id=fid)\
        .order_by(PreguntaFormulario.orden_pregunta).all()
    return jsonify([p.serialize() for p in preguntas]), 200


@api.route('/mis-respuestas', methods=['GET'])
@jwt_required()
def get_mis_respuestas():
    """
    Devuelve todas las respuestas que el usuario actual ya envió,
    para saber qué formularios están pendientes vs completados.
    """
    u = get_usuario_actual()
    respuestas = RespuestaFormulario.query.filter_by(usuario_id=u.id).all()
    return jsonify([r.serialize() for r in respuestas]), 200


@api.route('/respuestas', methods=['POST'])
@jwt_required()
def crear_respuestas_batch():
    """
    Guarda en batch todas las respuestas de un formulario completo.
    Body: {
        "formulario_id": 3,
        "respuestas": [
            { "pregunta_id": 12, "valor_respondido": "Opción X", "puntos_ganados": 4 },
            ...
        ]
    }
    Si el usuario ya había respondido este formulario antes, se SOBRESCRIBEN
    las respuestas anteriores (permite reintentos), igual que el sistema viejo
    permitía recalcular el mejor puntaje por lote.
    """
    u = get_usuario_actual()
    data = request.get_json()
    formulario_id = data.get("formulario_id")
    respuestas = data.get("respuestas", [])

    if not formulario_id or not respuestas:
        return jsonify({"error": "formulario_id y respuestas son requeridos"}), 400

    Formulario.query.get_or_404(formulario_id)

    # Borra respuestas previas de este usuario para este formulario (permite reintentar)
    RespuestaFormulario.query.filter_by(usuario_id=u.id, formulario_id=formulario_id).delete()

    for r in respuestas:
        nueva = RespuestaFormulario(
            usuario_id=u.id,
            formulario_id=formulario_id,
            pregunta_id=r.get("pregunta_id"),
            valor_respondido=r.get("valor_respondido", ""),
            puntos_ganados=r.get("puntos_ganados", 0)
        )
        db.session.add(nueva)

    db.session.commit()

    total_puntos = sum(r.get("puntos_ganados", 0) for r in respuestas)
    return jsonify({
        "message": "Respuestas guardadas",
        "formulario_id": formulario_id,
        "total_puntos": total_puntos
    }), 201


@api.route('/mi-empresa/formularios', methods=['GET'])
@jwt_required()
def get_formularios_mi_empresa():
    """
    Devuelve SOLO los formularios que fueron asignados a la empresa del
    usuario actual y que aplican a su rol (DOCENTE/DIRECTIVO/TODOS).
    Si el usuario no tiene empresa, o la empresa no tiene formularios
    asignados, devuelve lista vacía (el front debe mostrar el mensaje
    "aún no te han asignado formularios en esta fase").
    """
    u = get_usuario_actual()
    if not u.empresa_id:
        return jsonify([]), 200

    fase = request.args.get("fase", "AUDITAR")

    asigs = AsignacionFormulario.query.filter_by(empresa_id=u.empresa_id).all()
    ids = [a.formulario_id for a in asigs]

    if not ids:
        return jsonify([]), 200

    forms = Formulario.query.filter(
        Formulario.id.in_(ids),
        Formulario.fase_atlas == fase,
        Formulario.rol_destino.in_([u.rol, "TODOS"]),
        Formulario.is_active == True
    ).all()

    return jsonify([f.serialize() for f in forms]), 200


# ══════════════════════════════════════════════════════════════════════
# FASE TRANSFORMAR — Progreso de fase + Retos asignados + Guardar avance
# ══════════════════════════════════════════════════════════════════════


@api.route('/mi-empresa/retos', methods=['GET'])
@jwt_required()
def get_retos_mi_empresa():
    """
    Devuelve SOLO los retos plantilla que fueron asignados a la empresa
    del usuario actual, filtrados por fase y por su rol.
    Si no hay ninguno asignado, devuelve lista vacía.
    """
    u = get_usuario_actual()
    if not u.empresa_id:
        return jsonify([]), 200

    fase = request.args.get("fase", "TRANSFORMAR")

    asigs = AsignacionReto.query.filter_by(empresa_id=u.empresa_id)\
        .order_by(AsignacionReto.numero_orden).all()

    result = []
    for a in asigs:
        rp = a.reto_plantilla
        if not rp or not rp.is_active:
            continue
        if rp.fase != fase:
            continue
        if rp.rol_destino not in (u.rol, "TODOS"):
            continue
        result.append({**rp.serialize(), "numero_orden": a.numero_orden})
    return jsonify(result), 200


@api.route('/mis-retos-transformar', methods=['GET'])
@jwt_required()
def get_mis_retos_transformar():
    """
    Devuelve los registros de avance (borrador o completado) del usuario
    actual en la fase Transformar, para saber qué retos ya completó.
    """
    u = get_usuario_actual()
    registros = RetoTransformar.query.filter_by(usuario_id=u.id).all()
    return jsonify([r.serialize() for r in registros]), 200


@api.route('/retos-transformar/<int:reto_plantilla_id>', methods=['GET'])
@jwt_required()
def get_mi_avance_reto_transformar(reto_plantilla_id):
    """
    Devuelve el registro de avance del usuario actual para un reto
    plantilla específico (si existe). Prioriza COMPLETADO sobre BORRADOR,
    igual que el sistema viejo.
    """
    u = get_usuario_actual()
    registros = RetoTransformar.query.filter_by(
        usuario_id=u.id, reto_plantilla_id=reto_plantilla_id
    ).all()

    if not registros:
        return jsonify(None), 200

    completado = next((r for r in reversed(registros) if r.status_reto == "COMPLETADO"), None)
    if completado:
        return jsonify(completado.serialize()), 200

    borrador = next((r for r in reversed(registros) if r.status_reto == "BORRADOR"), None)
    return jsonify(borrador.serialize() if borrador else None), 200


@api.route('/retos-transformar', methods=['POST'])
@jwt_required()
def guardar_reto_transformar():
    """
    Crea o actualiza el avance del usuario en un reto de Transformar.
    Body: {
        "reto_plantilla_id": 5,
        "numero_reto": 1,
        "nombre_reto": "Reto 1: Evaluación Ética...",
        "nivel_unesco": "ACQUIRE",
        "datos_json": { "respuestas": {...} },
        "status_reto": "BORRADOR" | "COMPLETADO"
    }
    Si ya existe un registro de este usuario para ese reto_plantilla_id,
    lo actualiza en vez de crear uno nuevo (evita duplicados).
    """
    u = get_usuario_actual()
    data = request.get_json()

    reto_plantilla_id = data.get("reto_plantilla_id")
    if not reto_plantilla_id:
        return jsonify({"error": "reto_plantilla_id requerido"}), 400

    registro = RetoTransformar.query.filter_by(
        usuario_id=u.id, reto_plantilla_id=reto_plantilla_id
    ).first()

    if not registro:
        registro = RetoTransformar(
            usuario_id=u.id,
            reto_plantilla_id=reto_plantilla_id,
            numero_reto=data.get("numero_reto", 1)
        )
        db.session.add(registro)

    registro.nombre_reto = data.get("nombre_reto", registro.nombre_reto)
    registro.nivel_unesco = data.get("nivel_unesco", registro.nivel_unesco)
    registro.datos_json = data.get("datos_json", {})
    registro.status_reto = data.get("status_reto", "BORRADOR")

    db.session.commit()
    return jsonify(registro.serialize()), 200

@api.route('/empresa/retos-transformar', methods=['GET'])
@jwt_required()
def get_retos_transformar_empresa():
    """Solo DIRECTIVO puede ver todos los registros de su empresa."""
    u = get_usuario_actual()
    if u.rol not in ("DIRECTIVO", "ADMIN"):
        return jsonify({"error": "No autorizado"}), 403
    if not u.empresa_id:
        return jsonify([]), 200

    # Trae todos los usuarios de la empresa y sus retos
    usuarios_empresa = Usuario.query.filter_by(empresa_id=u.empresa_id, rol="DOCENTE").all()
    ids = [usr.id for usr in usuarios_empresa]
    registros = RetoTransformar.query.filter(RetoTransformar.usuario_id.in_(ids)).all()
    return jsonify([r.serialize() for r in registros]), 200
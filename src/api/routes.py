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
    RetoPlantilla, AsignacionReto
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
        id_reto=f"RETO-{gen_id()}",
        nombre_reto=data["nombre_reto"],
        descripcion=data.get("descripcion"),
        fase=data["fase"],
        nivel_unesco=data.get("nivel_unesco"),
        numero_reto=data.get("numero_reto"),
        rol_destino=data.get("rol_destino", "DOCENTE"),
        peso_huella=data.get("peso_huella", 10.0),
        config_json=config,
        creado_por_id=u.id
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
    for c in ["nombre_reto", "descripcion", "fase", "nivel_unesco", "numero_reto",
              "rol_destino", "peso_huella", "config_json", "is_active"]:
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
"""
ATLAS FRAMEWORK 2026 - MODELS
El db se define aqui directamente, igual que el boilerplate original.
app.py importa db desde aqui: from api.models import db  (sin cambios)
"""
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Integer, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone

db = SQLAlchemy()

def now_utc():
    return datetime.now(timezone.utc)

# ─────────────────────────────────────────────
# 1. EMPRESA
# ─────────────────────────────────────────────
class Empresa(db.Model):
    __tablename__ = "empresas"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    nit: Mapped[str] = mapped_column(String(50), unique=True, nullable=True)
    ciudad: Mapped[str] = mapped_column(String(100), nullable=True)
    pais: Mapped[str] = mapped_column(String(100), nullable=True, default="Colombia")
    logo_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    fecha_inicio_atlas: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    usuarios = relationship("Usuario", back_populates="empresa", cascade="all, delete-orphan")
    asignaciones_retos = relationship("AsignacionReto", back_populates="empresa", cascade="all, delete-orphan")
    asignaciones_formularios = relationship("AsignacionFormulario", back_populates="empresa", cascade="all, delete-orphan")
    configuracion_fases = relationship("ConfiguracionFaseEmpresa", back_populates="empresa", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id, "nombre": self.nombre, "nit": self.nit,
            "ciudad": self.ciudad, "pais": self.pais, "logo_url": self.logo_url,
            "is_active": self.is_active,
            "fecha_creacion": self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            "fecha_inicio_atlas": self.fecha_inicio_atlas.isoformat() if self.fecha_inicio_atlas else None,
        }


# ─────────────────────────────────────────────
# 2. USUARIO
# ─────────────────────────────────────────────
class Usuario(db.Model):
    __tablename__ = "usuarios"
    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    nombre_completo: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(300), nullable=False)
    rol: Mapped[str] = mapped_column(String(20), nullable=False)  # ADMIN, DOCENTE, DIRECTIVO
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    huella_compass_total: Mapped[float] = mapped_column(Float, default=0.0)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    fecha_ultimo_login: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=True)

    empresa = relationship("Empresa", back_populates="usuarios")
    respuestas = relationship("RespuestaFormulario", back_populates="usuario", cascade="all, delete-orphan")
    progreso_fases = relationship("ProgresoFase", back_populates="usuario", cascade="all, delete-orphan")
    retos_transformar = relationship("RetoTransformar", back_populates="usuario", cascade="all, delete-orphan")
    prompts_liderar = relationship("PromptLiderar", back_populates="usuario", cascade="all, delete-orphan")
    retos_liderar = relationship("RetoLiderar", back_populates="usuario", cascade="all, delete-orphan")
    seguimiento_directivo = relationship("SeguimientoDirectivo", back_populates="usuario", cascade="all, delete-orphan")
    asegurar_docente = relationship("AsegurarDocente", back_populates="usuario", cascade="all, delete-orphan")
    asegurar_directivo_panorama = relationship("AsegurarDirectivoPanorama", back_populates="usuario", cascade="all, delete-orphan")
    asegurar_directivo_diagnostico = relationship("AsegurarDirectivoDiagnostico", back_populates="usuario", cascade="all, delete-orphan")
    asegurar_directivo_plan = relationship("AsegurarDirectivoPlan", back_populates="usuario", cascade="all, delete-orphan")
    sostener_docentes = relationship("SostenerDocente", back_populates="usuario", cascade="all, delete-orphan")
    sostener_institucional = relationship("SostenerInstitucional", back_populates="usuario", cascade="all, delete-orphan")
    progreso_micromodulos = relationship("ProgresoMicromodulo", back_populates="usuario", cascade="all, delete-orphan")
    huella_history = relationship("HuellaCompassHistory", back_populates="usuario", cascade="all, delete-orphan")
    inventario_ia = relationship("InventarioIA", back_populates="usuario", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id, "teacher_key": self.teacher_key,
            "nombre_completo": self.nombre_completo, "email": self.email,
            "rol": self.rol, "is_active": self.is_active,
            "huella_compass_total": self.huella_compass_total,
            "empresa_id": self.empresa_id,
            "empresa_nombre": self.empresa.nombre if self.empresa else None,
            "fecha_creacion": self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            "fecha_ultimo_login": self.fecha_ultimo_login.isoformat() if self.fecha_ultimo_login else None,
        }


# ─────────────────────────────────────────────
# 3. CONFIGURACIÓN DE FASES POR EMPRESA
# ─────────────────────────────────────────────
class ConfiguracionFaseEmpresa(db.Model):
    __tablename__ = "configuracion_fases_empresa"
    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    fase: Mapped[str] = mapped_column(String(20), nullable=False)
    fecha_apertura: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_cierre: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    is_activa: Mapped[bool] = mapped_column(Boolean, default=False)
    descripcion_admin: Mapped[str] = mapped_column(Text, nullable=True)
    creado_por_admin_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=True)

    empresa = relationship("Empresa", back_populates="configuracion_fases")

    @property
    def esta_abierta(self):
        ahora = now_utc()
        if not self.is_activa:
            return False
        if self.fecha_apertura and ahora < self.fecha_apertura:
            return False
        if self.fecha_cierre and ahora > self.fecha_cierre:
            return False
        return True

    def serialize(self):
        return {
            "id": self.id, "empresa_id": self.empresa_id, "fase": self.fase,
            "fecha_apertura": self.fecha_apertura.isoformat() if self.fecha_apertura else None,
            "fecha_cierre": self.fecha_cierre.isoformat() if self.fecha_cierre else None,
            "is_activa": self.is_activa, "esta_abierta": self.esta_abierta,
            "descripcion_admin": self.descripcion_admin,
        }


# ─────────────────────────────────────────────
# 4. FORMULARIOS (FASE AUDITAR)
# ─────────────────────────────────────────────
class Formulario(db.Model):
    __tablename__ = "formularios"
    id: Mapped[int] = mapped_column(primary_key=True)
    id_form: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    titulo: Mapped[str] = mapped_column(String(300), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=True)
    fase_atlas: Mapped[str] = mapped_column(String(20), default="AUDITAR")
    puntos_maximos: Mapped[float] = mapped_column(Float, default=100.0)
    rol_destino: Mapped[str] = mapped_column(String(20), default="TODOS")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    creado_por_admin_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    preguntas = relationship("PreguntaFormulario", back_populates="formulario", cascade="all, delete-orphan")
    asignaciones = relationship("AsignacionFormulario", back_populates="formulario", cascade="all, delete-orphan")
    respuestas = relationship("RespuestaFormulario", back_populates="formulario", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id, "id_form": self.id_form, "titulo": self.titulo,
            "descripcion": self.descripcion, "fase_atlas": self.fase_atlas,
            "puntos_maximos": self.puntos_maximos, "rol_destino": self.rol_destino,
            "is_active": self.is_active,
            "fecha_creacion": self.fecha_creacion.isoformat() if self.fecha_creacion else None,
        }


# ─────────────────────────────────────────────
# 5. PREGUNTAS DE FORMULARIO
# ─────────────────────────────────────────────
class PreguntaFormulario(db.Model):
    __tablename__ = "preguntas_formulario"
    id: Mapped[int] = mapped_column(primary_key=True)
    formulario_id: Mapped[int] = mapped_column(ForeignKey("formularios.id"), nullable=False)
    texto_pregunta: Mapped[str] = mapped_column(Text, nullable=False)
    tipo_respuesta: Mapped[str] = mapped_column(String(30), default="ESCALA")
    opciones_seleccion: Mapped[dict] = mapped_column(JSON, nullable=True)
    puntaje_asociado: Mapped[float] = mapped_column(Float, default=0.0)
    orden_pregunta: Mapped[int] = mapped_column(Integer, default=1)

    formulario = relationship("Formulario", back_populates="preguntas")

    def serialize(self):
        return {
            "id": self.id, "formulario_id": self.formulario_id,
            "texto_pregunta": self.texto_pregunta, "tipo_respuesta": self.tipo_respuesta,
            "opciones_seleccion": self.opciones_seleccion,
            "puntaje_asociado": self.puntaje_asociado, "orden_pregunta": self.orden_pregunta,
        }


# ─────────────────────────────────────────────
# 6. ASIGNACIÓN FORMULARIO ↔ EMPRESA
# ─────────────────────────────────────────────
class AsignacionFormulario(db.Model):
    __tablename__ = "asignaciones_formularios"
    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    formulario_id: Mapped[int] = mapped_column(ForeignKey("formularios.id"), nullable=False)
    fecha_asignacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    empresa = relationship("Empresa", back_populates="asignaciones_formularios")
    formulario = relationship("Formulario", back_populates="asignaciones")

    def serialize(self):
        return {
            "id": self.id, "empresa_id": self.empresa_id, "formulario_id": self.formulario_id,
            "fecha_asignacion": self.fecha_asignacion.isoformat() if self.fecha_asignacion else None,
        }


# ─────────────────────────────────────────────
# 7. RESPUESTAS A FORMULARIOS
# ─────────────────────────────────────────────
class RespuestaFormulario(db.Model):
    __tablename__ = "respuestas_formulario"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    formulario_id: Mapped[int] = mapped_column(ForeignKey("formularios.id"), nullable=False)
    pregunta_id: Mapped[int] = mapped_column(ForeignKey("preguntas_formulario.id"), nullable=True)
    valor_respondido: Mapped[str] = mapped_column(Text, nullable=True)
    puntos_ganados: Mapped[float] = mapped_column(Float, default=0.0)
    fecha_respuesta: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    usuario = relationship("Usuario", back_populates="respuestas")
    formulario = relationship("Formulario", back_populates="respuestas")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id,
            "formulario_id": self.formulario_id, "pregunta_id": self.pregunta_id,
            "valor_respondido": self.valor_respondido, "puntos_ganados": self.puntos_ganados,
            "fecha_respuesta": self.fecha_respuesta.isoformat() if self.fecha_respuesta else None,
        }


# ─────────────────────────────────────────────
# 8. PROGRESO DE FASES
# ─────────────────────────────────────────────
class ProgresoFase(db.Model):
    __tablename__ = "progreso_fases"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    fase: Mapped[str] = mapped_column(String(20), nullable=False)
    capa_1_sentido: Mapped[str] = mapped_column(Text, nullable=True)
    capa_3_hito_texto: Mapped[str] = mapped_column(Text, nullable=True)
    fecha_actualizacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    usuario = relationship("Usuario", back_populates="progreso_fases")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id, "fase": self.fase,
            "capa_1_sentido": self.capa_1_sentido, "capa_3_hito_texto": self.capa_3_hito_texto,
            "fecha_actualizacion": self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None,
        }


# ─────────────────────────────────────────────
# 9. RETO PLANTILLA (catálogo global)
# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
# 9. RETO PLANTILLA (catálogo global)
# ─────────────────────────────────────────────
class RetoPlantilla(db.Model):
    __tablename__ = "retos_plantilla"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(300), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=True)
    fase: Mapped[str] = mapped_column(String(20), nullable=False)
    nivel_unesco: Mapped[str] = mapped_column(String(20), nullable=True)
    rol_destino: Mapped[str] = mapped_column(String(20), default="TODOS")
    peso_huella: Mapped[float] = mapped_column(Float, default=10.0)
    config_json: Mapped[dict] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    creado_por_admin_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    # ── NUEVOS: contenido narrativo del reto (Contexto / Misión / Preguntas) ──
    contexto_narrativo: Mapped[str] = mapped_column(Text, nullable=True)
    mision_texto: Mapped[str] = mapped_column(Text, nullable=True)
    objetivos_aprendizaje: Mapped[dict] = mapped_column(JSON, nullable=True)  # lista de strings
    preguntas_orientadoras: Mapped[dict] = mapped_column(JSON, nullable=True)  # lista de strings
    conceptos_clave: Mapped[dict] = mapped_column(JSON, nullable=True)  # lista de strings (tags)
    autoevaluacion_items: Mapped[dict] = mapped_column(JSON, nullable=True)
    lectura_previa: Mapped[dict] = mapped_column(JSON, nullable=True)

    asignaciones = relationship("AsignacionReto", back_populates="reto_plantilla", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id, "nombre": self.nombre, "nombre_reto": self.nombre, "descripcion": self.descripcion,
            "fase": self.fase, "nivel_unesco": self.nivel_unesco,
            "rol_destino": self.rol_destino, "peso_huella": self.peso_huella,
            "config_json": self.config_json, "is_active": self.is_active,
            "contexto_narrativo": self.contexto_narrativo,
            "mision_texto": self.mision_texto,
            "objetivos_aprendizaje": self.objetivos_aprendizaje or [],
            "preguntas_orientadoras": self.preguntas_orientadoras or [],
            "conceptos_clave": self.conceptos_clave or [],
            "autoevaluacion_items": self.autoevaluacion_items or [],
            "lectura_previa": self.lectura_previa or None,
        }


# ─────────────────────────────────────────────
# 10. ASIGNACIÓN RETO ↔ EMPRESA
# ─────────────────────────────────────────────
class AsignacionReto(db.Model):
    __tablename__ = "asignaciones_retos"
    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    reto_plantilla_id: Mapped[int] = mapped_column(ForeignKey("retos_plantilla.id"), nullable=False)
    numero_orden: Mapped[int] = mapped_column(Integer, default=1)
    fecha_asignacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    empresa = relationship("Empresa", back_populates="asignaciones_retos")
    reto_plantilla = relationship("RetoPlantilla", back_populates="asignaciones")

    def serialize(self):
        return {
            "id": self.id, "empresa_id": self.empresa_id,
            "reto_plantilla_id": self.reto_plantilla_id, "numero_orden": self.numero_orden,
        }


# ─────────────────────────────────────────────
# 11. RETO TRANSFORMAR
# ─────────────────────────────────────────────
class RetoTransformar(db.Model):
    __tablename__ = "retos_transformar"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    reto_plantilla_id: Mapped[int] = mapped_column(ForeignKey("retos_plantilla.id"), nullable=True)
    numero_reto: Mapped[int] = mapped_column(Integer, nullable=False)
    nombre_reto: Mapped[str] = mapped_column(String(300), nullable=True)
    nivel_unesco: Mapped[str] = mapped_column(String(20), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    datos_json: Mapped[dict] = mapped_column(JSON, nullable=True)
    reflexion_1: Mapped[str] = mapped_column(Text, nullable=True)
    reflexion_2: Mapped[str] = mapped_column(Text, nullable=True)
    decision_final: Mapped[str] = mapped_column(Text, nullable=True)
    autoevaluacion_status: Mapped[str] = mapped_column(String(50), nullable=True)
    estado_revision_directivo: Mapped[str] = mapped_column(String(50), nullable=True)
    feedback_directivo: Mapped[str] = mapped_column(Text, nullable=True)
    status_reto: Mapped[str] = mapped_column(String(20), default="BORRADOR")

    usuario = relationship("Usuario", back_populates="retos_transformar")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id,
            "reto_plantilla_id": self.reto_plantilla_id,
            "numero_reto": self.numero_reto, "nombre_reto": self.nombre_reto,
            "nivel_unesco": self.nivel_unesco, "datos_json": self.datos_json,
            "reflexion_1": self.reflexion_1, "reflexion_2": self.reflexion_2,
            "decision_final": self.decision_final,
            "autoevaluacion_status": self.autoevaluacion_status,
            "estado_revision_directivo": self.estado_revision_directivo,
            "feedback_directivo": self.feedback_directivo,
            "status_reto": self.status_reto,
            "fecha_creacion": self.fecha_creacion.isoformat() if self.fecha_creacion else None,
        }


# ─────────────────────────────────────────────
# 12. PROMPT LIDERAR
# ─────────────────────────────────────────────
class PromptLiderar(db.Model):
    __tablename__ = "prompts_liderar"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    prompt_original: Mapped[str] = mapped_column(Text, nullable=False)
    categoria_uso: Mapped[str] = mapped_column(String(100), nullable=True)
    puntaje_etica: Mapped[float] = mapped_column(Float, default=0.0)
    puntaje_privacidad: Mapped[float] = mapped_column(Float, default=0.0)
    puntaje_agencia: Mapped[float] = mapped_column(Float, default=0.0)
    puntaje_dependencia: Mapped[float] = mapped_column(Float, default=0.0)
    simulador_puntaje: Mapped[float] = mapped_column(Float, default=0.0)
    clasificacion_riesgo: Mapped[str] = mapped_column(String(50), nullable=True)
    sugerencia_mejora: Mapped[str] = mapped_column(Text, nullable=True)
    detalle_respuestas: Mapped[dict] = mapped_column(JSON, nullable=True)
    dimension_mas_baja: Mapped[str] = mapped_column(String(50), nullable=True)
    fecha_registro: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    es_publico: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="COMPLETADO")

    usuario = relationship("Usuario", back_populates="prompts_liderar")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id,
            "prompt_original": self.prompt_original, "categoria_uso": self.categoria_uso,
            "puntaje_etica": self.puntaje_etica, "puntaje_privacidad": self.puntaje_privacidad,
            "puntaje_agencia": self.puntaje_agencia, "puntaje_dependencia": self.puntaje_dependencia,
            "simulador_puntaje": self.simulador_puntaje,
            "clasificacion_riesgo": self.clasificacion_riesgo,
            "sugerencia_mejora": self.sugerencia_mejora,
            "detalle_respuestas": self.detalle_respuestas or {}, 
            "dimension_mas_baja": self.dimension_mas_baja, 
            "es_publico": self.es_publico, "status": self.status,
            "fecha_registro": self.fecha_registro.isoformat() if self.fecha_registro else None,
        }


# ─────────────────────────────────────────────
# 13. RETO LIDERAR
# ─────────────────────────────────────────────
class RetoLiderar(db.Model):
    __tablename__ = "retos_liderar"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    reto_plantilla_id: Mapped[int] = mapped_column(ForeignKey("retos_plantilla.id"), nullable=True)
    respuesta_json: Mapped[dict] = mapped_column(JSON, nullable=True)
    reflexion: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="COMPLETADO")
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    usuario = relationship("Usuario", back_populates="retos_liderar")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id,
            "reto_plantilla_id": self.reto_plantilla_id,
            "respuesta_json": self.respuesta_json, "reflexion": self.reflexion,
            "status": self.status,
            "fecha_creacion": self.fecha_creacion.isoformat() if self.fecha_creacion else None,
        }


# ─────────────────────────────────────────────
# 14. SEGUIMIENTO DIRECTIVO
# ─────────────────────────────────────────────
class SeguimientoDirectivo(db.Model):
    __tablename__ = "seguimiento_directivo"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    accion_activada: Mapped[str] = mapped_column(String(100), nullable=True)
    dimension_priorizada: Mapped[str] = mapped_column(String(100), nullable=True)
    docente_mentor_key: Mapped[str] = mapped_column(String(100), nullable=True)
    cumplimiento_validado: Mapped[bool] = mapped_column(Boolean, default=False)
    riesgo_alto_actual: Mapped[str] = mapped_column(String(100), nullable=True)
    fase_asegurar_status: Mapped[str] = mapped_column(String(50), nullable=True)
    entendido_gobernanza: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_accion: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    usuario = relationship("Usuario", back_populates="seguimiento_directivo")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id,
            "accion_activada": self.accion_activada,
            "dimension_priorizada": self.dimension_priorizada,
            "docente_mentor_key": self.docente_mentor_key,
            "cumplimiento_validado": self.cumplimiento_validado,
            "riesgo_alto_actual": self.riesgo_alto_actual,
            "fase_asegurar_status": self.fase_asegurar_status,
            "entendido_gobernanza": self.entendido_gobernanza,
            "fecha_accion": self.fecha_accion.isoformat() if self.fecha_accion else None,
        }


# ─────────────────────────────────────────────
# 15. ASEGURAR - DOCENTE
# ─────────────────────────────────────────────
class AsegurarDocente(db.Model):
    __tablename__ = "asegurar_docentes"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(20), default="BORRADOR")
    fecha_finalizacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    prompt_original: Mapped[str] = mapped_column(Text, nullable=True)
    alertas_detectadas: Mapped[dict] = mapped_column(JSON, nullable=True)
    bloques_activados: Mapped[dict] = mapped_column(JSON, nullable=True)
    prompt_mejorado: Mapped[str] = mapped_column(Text, nullable=True)
    riesgo_previo: Mapped[str] = mapped_column(Text, nullable=True)
    riesgo_final: Mapped[str] = mapped_column(Text, nullable=True)
    reflexion_1_cambios: Mapped[str] = mapped_column(Text, nullable=True)
    reflexion_2_riesgos: Mapped[str] = mapped_column(Text, nullable=True)
    reflexion_3_supervision: Mapped[str] = mapped_column(Text, nullable=True)
    reflexion_4_cognicion: Mapped[str] = mapped_column(Text, nullable=True)
    estandar_seleccionado: Mapped[str] = mapped_column(Text, nullable=True)
    url_doc_exportable: Mapped[str] = mapped_column(String(500), nullable=True)
    # ── NUEVOS: taller significativo ──
    constructor_prompt: Mapped[dict] = mapped_column(JSON, nullable=True)         # {rol, contexto, tarea, restricciones, formato, supervision}
    reescrituras_aplicadas: Mapped[dict] = mapped_column(JSON, nullable=True)     # lista de ids
    lecciones_vistas: Mapped[dict] = mapped_column(JSON, nullable=True)           # lista de dimensiones
    puntaje_rector: Mapped[int] = mapped_column(Integer, nullable=True)           # 0-6 componentes de la fórmula
    reduccion_riesgo_pct: Mapped[float] = mapped_column(Float, nullable=True)     # % de mejora calculado
    compromiso_datos: Mapped[bool] = mapped_column(Boolean, default=False)        # firmó el pacto anti-datos-sensibles
    

    usuario = relationship("Usuario", back_populates="asegurar_docente")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id, "status": self.status,
            "fecha_finalizacion": self.fecha_finalizacion.isoformat() if self.fecha_finalizacion else None,
            "prompt_original": self.prompt_original,
            "alertas_detectadas": self.alertas_detectadas,
            "bloques_activados": self.bloques_activados,
            "prompt_mejorado": self.prompt_mejorado,
            "riesgo_previo": self.riesgo_previo, "riesgo_final": self.riesgo_final,
            "reflexion_1_cambios": self.reflexion_1_cambios,
            "reflexion_2_riesgos": self.reflexion_2_riesgos,
            "reflexion_3_supervision": self.reflexion_3_supervision,
            "reflexion_4_cognicion": self.reflexion_4_cognicion,
            "estandar_seleccionado": self.estandar_seleccionado,
            "url_doc_exportable": self.url_doc_exportable,
            "constructor_prompt": self.constructor_prompt or {},
            "reescrituras_aplicadas": self.reescrituras_aplicadas or [],
            "lecciones_vistas": self.lecciones_vistas or [],
            "puntaje_rector": self.puntaje_rector,
            "reduccion_riesgo_pct": self.reduccion_riesgo_pct,
            "compromiso_datos": self.compromiso_datos,
        }


# ─────────────────────────────────────────────
# 16. ASEGURAR - DIRECTIVO PANORAMA
# ─────────────────────────────────────────────
class AsegurarDirectivoPanorama(db.Model):
    __tablename__ = "asegurar_directivo_panorama"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(20), default="EN_PROGRESO")
    visto_bloque_1_regulatorio: Mapped[bool] = mapped_column(Boolean, default=False)
    visto_bloque_2_competencias: Mapped[bool] = mapped_column(Boolean, default=False)
    visto_bloque_3_etica: Mapped[bool] = mapped_column(Boolean, default=False)
    visto_bloque_4_cultura: Mapped[bool] = mapped_column(Boolean, default=False)
    feedback_opcional_panorama: Mapped[str] = mapped_column(Text, nullable=True)

    usuario = relationship("Usuario", back_populates="asegurar_directivo_panorama")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id, "status": self.status,
            "visto_bloque_1_regulatorio": self.visto_bloque_1_regulatorio,
            "visto_bloque_2_competencias": self.visto_bloque_2_competencias,
            "visto_bloque_3_etica": self.visto_bloque_3_etica,
            "visto_bloque_4_cultura": self.visto_bloque_4_cultura,
            "feedback_opcional_panorama": self.feedback_opcional_panorama,
        }


# ─────────────────────────────────────────────
# 17. ASEGURAR - DIRECTIVO DIAGNÓSTICO RADAR
# ─────────────────────────────────────────────
class AsegurarDirectivoDiagnostico(db.Model):
    __tablename__ = "asegurar_directivo_diagnostico"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(20), default="BORRADOR")
    gobernanza_1_politica: Mapped[int] = mapped_column(Integer, nullable=True)
    gobernanza_2_responsable: Mapped[int] = mapped_column(Integer, nullable=True)
    gobernanza_3_evaluacion_htas: Mapped[int] = mapped_column(Integer, nullable=True)
    gobernanza_4_protocolo_incidentes: Mapped[int] = mapped_column(Integer, nullable=True)
    competencia_1_etica: Mapped[int] = mapped_column(Integer, nullable=True)
    competencia_2_unesco_levels: Mapped[int] = mapped_column(Integer, nullable=True)
    competencia_3_plan_progresivo: Mapped[int] = mapped_column(Integer, nullable=True)
    competencia_4_reflexion_critica: Mapped[int] = mapped_column(Integer, nullable=True)
    datos_1_protocolo_estudiantes: Mapped[int] = mapped_column(Integer, nullable=True)
    datos_2_anonimizacion: Mapped[int] = mapped_column(Integer, nullable=True)
    datos_3_terminos_htas: Mapped[int] = mapped_column(Integer, nullable=True)
    datos_4_almacenamiento: Mapped[int] = mapped_column(Integer, nullable=True)
    supervision_1_decision_humana: Mapped[int] = mapped_column(Integer, nullable=True)
    supervision_2_no_automatizada: Mapped[int] = mapped_column(Integer, nullable=True)
    supervision_3_monitoreo_ia: Mapped[int] = mapped_column(Integer, nullable=True)
    supervision_4_revision_practicas: Mapped[int] = mapped_column(Integer, nullable=True)
    transparencia_1_informa_estud: Mapped[int] = mapped_column(Integer, nullable=True)
    transparencia_2_lineamientos_uso: Mapped[int] = mapped_column(Integer, nullable=True)
    transparencia_3_alfabetizacion: Mapped[int] = mapped_column(Integer, nullable=True)
    transparencia_4_declaracion_pub: Mapped[int] = mapped_column(Integer, nullable=True)
    puntaje_total_radar: Mapped[int] = mapped_column(Integer, nullable=True)
    clasificacion_final: Mapped[str] = mapped_column(String(50), nullable=True)

    usuario = relationship("Usuario", back_populates="asegurar_directivo_diagnostico")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id, "status": self.status,
            "gobernanza_1_politica": self.gobernanza_1_politica,
            "gobernanza_2_responsable": self.gobernanza_2_responsable,
            "gobernanza_3_evaluacion_htas": self.gobernanza_3_evaluacion_htas,
            "gobernanza_4_protocolo_incidentes": self.gobernanza_4_protocolo_incidentes,
            "competencia_1_etica": self.competencia_1_etica,
            "competencia_2_unesco_levels": self.competencia_2_unesco_levels,
            "competencia_3_plan_progresivo": self.competencia_3_plan_progresivo,
            "competencia_4_reflexion_critica": self.competencia_4_reflexion_critica,
            "datos_1_protocolo_estudiantes": self.datos_1_protocolo_estudiantes,
            "datos_2_anonimizacion": self.datos_2_anonimizacion,
            "datos_3_terminos_htas": self.datos_3_terminos_htas,
            "datos_4_almacenamiento": self.datos_4_almacenamiento,
            "supervision_1_decision_humana": self.supervision_1_decision_humana,
            "supervision_2_no_automatizada": self.supervision_2_no_automatizada,
            "supervision_3_monitoreo_ia": self.supervision_3_monitoreo_ia,
            "supervision_4_revision_practicas": self.supervision_4_revision_practicas,
            "transparencia_1_informa_estud": self.transparencia_1_informa_estud,
            "transparencia_2_lineamientos_uso": self.transparencia_2_lineamientos_uso,
            "transparencia_3_alfabetizacion": self.transparencia_3_alfabetizacion,
            "transparencia_4_declaracion_pub": self.transparencia_4_declaracion_pub,
            "puntaje_total_radar": self.puntaje_total_radar,
            "clasificacion_final": self.clasificacion_final,
        }


# ─────────────────────────────────────────────
# 18. ASEGURAR - DIRECTIVO PLAN DE ACCIÓN
# ─────────────────────────────────────────────
class AsegurarDirectivoPlan(db.Model):
    __tablename__ = "asegurar_directivo_plan"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(20), default="BORRADOR")
    dimension_prioridad_1: Mapped[str] = mapped_column(String(100), nullable=True)
    dimension_prioridad_2: Mapped[str] = mapped_column(String(100), nullable=True)
    objetivo_estrategico: Mapped[str] = mapped_column(Text, nullable=True)
    acciones_seleccionadas: Mapped[dict] = mapped_column(JSON, nullable=True)
    responsables_asignados: Mapped[dict] = mapped_column(JSON, nullable=True)
    cronograma_estimado: Mapped[str] = mapped_column(String(200), nullable=True)
    indicadores_exito: Mapped[str] = mapped_column(Text, nullable=True)

    usuario = relationship("Usuario", back_populates="asegurar_directivo_plan")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id, "status": self.status,
            "dimension_prioridad_1": self.dimension_prioridad_1,
            "dimension_prioridad_2": self.dimension_prioridad_2,
            "objetivo_estrategico": self.objetivo_estrategico,
            "acciones_seleccionadas": self.acciones_seleccionadas,
            "responsables_asignados": self.responsables_asignados,
            "cronograma_estimado": self.cronograma_estimado,
            "indicadores_exito": self.indicadores_exito,
        }


# ─────────────────────────────────────────────
# 19. SOSTENER - DOCENTE (radar 4D × 6 = 24 preguntas)
# ─────────────────────────────────────────────

class SostenerDocente(db.Model):
    __tablename__ = "sostener_docentes"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=True)
    periodo: Mapped[str] = mapped_column(String(20), nullable=True)  # "2026-1"
    fecha_evaluacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    # Las 24 respuestas del radar como JSON: {"1": 4, "2": 3, ..., "24": 5}
    respuestas: Mapped[dict] = mapped_column(JSON, nullable=True)

    # Campos calculados
    promedio_global: Mapped[float] = mapped_column(Float, default=0.0)
    promedio_d1: Mapped[float] = mapped_column(Float, default=0.0)
    promedio_d2: Mapped[float] = mapped_column(Float, default=0.0)
    promedio_d3: Mapped[float] = mapped_column(Float, default=0.0)
    promedio_d4: Mapped[float] = mapped_column(Float, default=0.0)
    nivel_calculado: Mapped[str] = mapped_column(String(80), nullable=True)
    alertas_activas: Mapped[str] = mapped_column(Text, nullable=True)
    porcentaje_crecimiento: Mapped[str] = mapped_column(String(20), nullable=True)

    # Cierre reflexivo (etapa 5)
    reflexion_antes: Mapped[str] = mapped_column(Text, nullable=True)
    reflexion_despues: Mapped[str] = mapped_column(Text, nullable=True)
    aprendizaje_clave: Mapped[str] = mapped_column(Text, nullable=True)
    prioridad_sostener: Mapped[str] = mapped_column(String(50), nullable=True)
    compromiso_accion: Mapped[str] = mapped_column(Text, nullable=True)
    evidencia_mejora: Mapped[str] = mapped_column(Text, nullable=True)
    fecha_revision_plan: Mapped[str] = mapped_column(String(50), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="COMPLETADO")

    usuario = relationship("Usuario", back_populates="sostener_docentes")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id, "empresa_id": self.empresa_id,
            "periodo": self.periodo,
            "fecha_evaluacion": self.fecha_evaluacion.isoformat() if self.fecha_evaluacion else None,
            "respuestas": self.respuestas or {},
            "promedio_global": self.promedio_global,
            "promedio_d1": self.promedio_d1, "promedio_d2": self.promedio_d2,
            "promedio_d3": self.promedio_d3, "promedio_d4": self.promedio_d4,
            "nivel_calculado": self.nivel_calculado,
            "alertas_activas": self.alertas_activas,
            "porcentaje_crecimiento": self.porcentaje_crecimiento,
            "reflexion_antes": self.reflexion_antes, "reflexion_despues": self.reflexion_despues,
            "aprendizaje_clave": self.aprendizaje_clave, "prioridad_sostener": self.prioridad_sostener,
            "compromiso_accion": self.compromiso_accion, "evidencia_mejora": self.evidencia_mejora,
            "fecha_revision_plan": self.fecha_revision_plan,
            "status": self.status,
        }


# ─────────────────────────────────────────────
# 20. SOSTENER - INSTITUCIONAL
# ─────────────────────────────────────────────
class SostenerInstitucional(db.Model):
    __tablename__ = "sostener_institucional"
    id: Mapped[int] = mapped_column(primary_key=True)
    id_sostener_inst: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id"), nullable=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    fecha_cierre: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    reflexion_punto_partida: Mapped[str] = mapped_column(Text, nullable=True)
    estado_cumplimiento_asegurar: Mapped[str] = mapped_column(String(50), nullable=True)
    analisis_implementacion: Mapped[str] = mapped_column(Text, nullable=True)
    nivel_institucional_actual: Mapped[str] = mapped_column(String(50), nullable=True)
    docentes_n1: Mapped[int] = mapped_column(Integer, nullable=True)
    porcentaje_reduccion_alertas: Mapped[float] = mapped_column(Float, nullable=True)
    ruta_elegida: Mapped[str] = mapped_column(String(200), nullable=True)
    prioridad_estrategica_anual: Mapped[str] = mapped_column(Text, nullable=True)
    accion_gobernanza: Mapped[str] = mapped_column(Text, nullable=True)
    indicador_medible: Mapped[str] = mapped_column(Text, nullable=True)
    fecha_revision_institucional: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    estrategia_comunicacion: Mapped[str] = mapped_column(Text, nullable=True)

    usuario = relationship("Usuario", back_populates="sostener_institucional")

    def serialize(self):
        return {
            "id": self.id, "id_sostener_inst": self.id_sostener_inst,
            "empresa_id": self.empresa_id, "usuario_id": self.usuario_id,
            "fecha_cierre": self.fecha_cierre.isoformat() if self.fecha_cierre else None,
            "reflexion_punto_partida": self.reflexion_punto_partida,
            "estado_cumplimiento_asegurar": self.estado_cumplimiento_asegurar,
            "analisis_implementacion": self.analisis_implementacion,
            "nivel_institucional_actual": self.nivel_institucional_actual,
            "docentes_n1": self.docentes_n1,
            "porcentaje_reduccion_alertas": self.porcentaje_reduccion_alertas,
            "ruta_elegida": self.ruta_elegida,
            "prioridad_estrategica_anual": self.prioridad_estrategica_anual,
            "accion_gobernanza": self.accion_gobernanza,
            "indicador_medible": self.indicador_medible,
            "estrategia_comunicacion": self.estrategia_comunicacion,
        }


# ─────────────────────────────────────────────
# 21. PROGRESO MICROMÓDULOS
# ─────────────────────────────────────────────
class ProgresoMicromodulo(db.Model):
    __tablename__ = "progreso_micromodulos"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    modulo_id: Mapped[str] = mapped_column(String(100), nullable=False)
    status_lectura: Mapped[str] = mapped_column(String(20), default="PENDIENTE")
    nota_quiz: Mapped[float] = mapped_column(Float, nullable=True)
    actividad_texto: Mapped[str] = mapped_column(Text, nullable=True)
    foro_aporte: Mapped[str] = mapped_column(Text, nullable=True)
    fecha_finalizacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    usuario = relationship("Usuario", back_populates="progreso_micromodulos")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id, "modulo_id": self.modulo_id,
            "status_lectura": self.status_lectura, "nota_quiz": self.nota_quiz,
            "actividad_texto": self.actividad_texto,
            "fecha_finalizacion": self.fecha_finalizacion.isoformat() if self.fecha_finalizacion else None,
        }


# ─────────────────────────────────────────────
# 22. HUELLA COMPASS HISTÓRICO
# ─────────────────────────────────────────────
class HuellaCompassHistory(db.Model):
    __tablename__ = "huella_compass_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    fecha_calculo: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    pts_auditar: Mapped[float] = mapped_column(Float, default=0.0)
    pts_transformar: Mapped[float] = mapped_column(Float, default=0.0)
    pts_liderar: Mapped[float] = mapped_column(Float, default=0.0)
    pts_asegurar: Mapped[float] = mapped_column(Float, default=0.0)
    pts_sostener: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float, default=0.0)
    evento_trigger: Mapped[str] = mapped_column(String(100), nullable=True)

    usuario = relationship("Usuario", back_populates="huella_history")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id,
            "fecha_calculo": self.fecha_calculo.isoformat() if self.fecha_calculo else None,
            "pts_auditar": self.pts_auditar, "pts_transformar": self.pts_transformar,
            "pts_liderar": self.pts_liderar, "pts_asegurar": self.pts_asegurar,
            "pts_sostener": self.pts_sostener, "total": self.total,
            "evento_trigger": self.evento_trigger,
        }


# ─────────────────────────────────────────────
# 23. INVENTARIO IA
# ─────────────────────────────────────────────
class InventarioIA(db.Model):
    __tablename__ = "inventario_ia"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    nombre_ia: Mapped[str] = mapped_column(String(200), nullable=False)
    uso_principal: Mapped[str] = mapped_column(String(300), nullable=True)
    riesgo_detectado: Mapped[str] = mapped_column(String(100), nullable=True)
    fecha_registro: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    usuario = relationship("Usuario", back_populates="inventario_ia")

    def serialize(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id,
            "nombre_ia": self.nombre_ia, "uso_principal": self.uso_principal,
            "riesgo_detectado": self.riesgo_detectado,
            "fecha_registro": self.fecha_registro.isoformat() if self.fecha_registro else None,
        }
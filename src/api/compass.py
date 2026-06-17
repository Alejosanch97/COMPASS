"""
ATLAS FRAMEWORK 2026 - MOTOR DE CÁLCULO HUELLA COMPASS
Se dispara automáticamente al completar cada fase.

PESOS (total 100 pts):
  AUDITAR     → 20 pts
  TRANSFORMAR → 30 pts
  LIDERAR     → 15 pts
  ASEGURAR    → 20 pts
  SOSTENER    → 15 pts
"""
from api.models import (
    db, Usuario, RespuestaFormulario, AsignacionFormulario,
    RetoTransformar, AsignacionReto,
    PromptLiderar, RetoLiderar,
    AsegurarDocente, AsegurarDirectivoPlan,
    SostenerDocente, SostenerInstitucional,
    HuellaCompassHistory
)


def calcular_y_guardar_huella(usuario_id, evento_trigger="MANUAL"):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return 0.0

    rol = usuario.rol
    empresa_id = usuario.empresa_id

    # ── AUDITAR (20 pts) ─────────────────────────────────────────────
    pts_auditar = 0.0
    if empresa_id:
        # Formularios asignados a su empresa
        asignaciones = AsignacionFormulario.query.filter_by(empresa_id=empresa_id).all()
        form_ids = [a.formulario_id for a in asignaciones]
        if form_ids:
            # Formularios que el usuario respondió
            respondidos = db.session.query(RespuestaFormulario.formulario_id).filter(
                RespuestaFormulario.usuario_id == usuario_id,
                RespuestaFormulario.formulario_id.in_(form_ids)
            ).distinct().count()
            total_forms = len(form_ids)
            if total_forms > 0:
                pts_auditar = round((respondidos / total_forms) * 20, 2)

    # ── TRANSFORMAR (30 pts) ─────────────────────────────────────────
    pts_transformar = 0.0
    if rol == "DOCENTE" and empresa_id:
        retos_completados = RetoTransformar.query.filter_by(
            usuario_id=usuario_id, status_reto="COMPLETADO"
        ).all()
        suma_pesos = 0.0
        for reto in retos_completados:
            if reto.reto_plantilla_id:
                asig = AsignacionReto.query.filter_by(
                    empresa_id=empresa_id,
                    reto_plantilla_id=reto.reto_plantilla_id
                ).first()
                if asig and asig.reto_plantilla:
                    suma_pesos += asig.reto_plantilla.peso_huella
        pts_transformar = min(suma_pesos, 30.0)

    # ── LIDERAR (15 pts) ─────────────────────────────────────────────
    pts_liderar = 0.0
    prompts = PromptLiderar.query.filter_by(usuario_id=usuario_id).count()
    retos_lid = RetoLiderar.query.filter_by(usuario_id=usuario_id, status="COMPLETADO").count()
    if prompts > 0:
        pts_liderar += 10.0
    pts_liderar += min(retos_lid * 2.5, 5.0)
    pts_liderar = min(pts_liderar, 15.0)

    # ── ASEGURAR (20 pts) ────────────────────────────────────────────
    pts_asegurar = 0.0
    if rol == "DOCENTE":
        taller = AsegurarDocente.query.filter_by(
            usuario_id=usuario_id, status="COMPLETADO"
        ).first()
        if taller:
            pts_asegurar = 20.0
    elif rol == "DIRECTIVO":
        plan = AsegurarDirectivoPlan.query.filter_by(
            usuario_id=usuario_id, status="COMPLETADO"
        ).first()
        if plan:
            pts_asegurar = 20.0

    # ── SOSTENER (15 pts) ────────────────────────────────────────────
    pts_sostener = 0.0
    if rol == "DOCENTE":
        ultimo = SostenerDocente.query.filter_by(usuario_id=usuario_id)\
            .order_by(SostenerDocente.fecha_evaluacion.desc()).first()
        if ultimo:
            pts_sostener = 10.0
            if ultimo.porcentaje_crecimiento and ultimo.porcentaje_crecimiento > 0:
                pts_sostener += 5.0
    elif rol == "DIRECTIVO":
        cierre = SostenerInstitucional.query.filter_by(usuario_id=usuario_id).first()
        if cierre:
            pts_sostener = 15.0

    # ── TOTAL ────────────────────────────────────────────────────────
    total = round(pts_auditar + pts_transformar + pts_liderar + pts_asegurar + pts_sostener, 2)
    total = min(total, 100.0)

    # Guardar snapshot en histórico
    snapshot = HuellaCompassHistory(
        usuario_id=usuario_id,
        pts_auditar=pts_auditar,
        pts_transformar=pts_transformar,
        pts_liderar=pts_liderar,
        pts_asegurar=pts_asegurar,
        pts_sostener=pts_sostener,
        total=total,
        evento_trigger=evento_trigger
    )
    db.session.add(snapshot)

    # Actualizar total en el usuario
    usuario.huella_compass_total = total
    db.session.commit()

    return total
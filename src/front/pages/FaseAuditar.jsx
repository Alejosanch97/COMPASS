import React, { useState, useEffect } from "react";

import "../Styles/faseAuditar.css";
import Swal from "sweetalert2";

/**
 * FaseAuditar
 * Mantiene el mismo diseño, textos e interpretaciones COMPASS del código
 * original (Google Sheets), pero conectado al backend Flask nuevo.
 *
 * Flujo: Capa 1 (Declarar Marco Ético) -> Capa 2 (Responder formulario
 * asignado a la empresa) -> Capa 3 (Resultado COMPASS con interpretación).
 *
 * Si la empresa del usuario no tiene ningún formulario asignado para su
 * rol en AUDITAR, se muestra un aviso en vez del diagnóstico.
 */
export const FaseAuditar = ({ userData, apiFetch, onNavigate }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reflexion, setReflexion] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [formulariosFase, setFormulariosFase] = useState([]);
    const [respuestasUsuario, setRespuestasUsuario] = useState([]);

    const [modalRespuestas, setModalRespuestas] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        if (!progreso) setLoading(true);
        try {
            const [progresoData, formsData, respuestasData] = await Promise.all([
                apiFetch("/api/progreso-fases").catch(() => []),
                apiFetch("/api/mi-empresa/formularios?fase=AUDITAR").catch(() => []),
                apiFetch("/api/mis-respuestas").catch(() => []),
            ]);

            const registroFase = Array.isArray(progresoData)
                ? progresoData.find(item => item.fase === "AUDITAR")
                : null;
            if (registroFase) {
                setProgreso(registroFase);
                setReflexion(registroFase.capa_3_hito_texto || "");
            }

            setFormulariosFase(Array.isArray(formsData) ? formsData : []);
            setRespuestasUsuario(Array.isArray(respuestasData) ? respuestasData : []);
        } catch (e) {
            console.error("Error crítico en sincronización ATLAS:", e);
        } finally {
            setLoading(false);
        }
    };

    // ── PUNTAJE: suma de puntos_ganados de todas las respuestas del formulario relevante ──
    const obtenerPuntajeDirecto = () => {
        if (formulariosFase.length === 0) return 0;
        const formularioRelevante = formulariosFase[0]; // un solo formulario por rol en AUDITAR
        const respuestasDelFormulario = respuestasUsuario.filter(r => r.formulario_id === formularioRelevante.id);
        if (respuestasDelFormulario.length === 0) return 0;
        return respuestasDelFormulario.reduce((acc, r) => acc + parseFloat(r.puntos_ganados || 0), 0);
    };

    const puntajeFinal = React.useMemo(() => obtenerPuntajeDirecto(), [respuestasUsuario, formulariosFase]);

    // ── INTERPRETACIONES COMPASS — DOCENTE (texto original sin modificar) ──
    const getCompassData = (score) => {
        if (score >= 90) return {
            nivel: "Gobernanza madura",
            rango: "90–100",
            desc: `Tu integración de IA va más allá del aula.
            
Estás aplicando supervisión humana significativa, documentando decisiones, evaluando impacto y contribuyendo a lineamientos institucionales.

Tu práctica está alineada con principios internacionales de IA confiable, ética y gobernanza educativa. No solo usas IA con intención pedagógica. Participas en la construcción de una cultura institucional responsable.

El desafío en este nivel no es usar más IA, sino sostener calidad, coherencia y liderazgo. Puedes avanzar las demás fases y convertirte en un gran referente en el ecosistema ATLAS.`
        };

        if (score >= 75) return {
            nivel: "Integración estratégica",
            rango: "75–89",
            desc: `La IA está integrada de manera coherente y estratégica en tu práctica.
            
No solo la utilizas con intención curricular, sino que también incorporas criterios de uso responsable, supervisión humana explícita y evaluación ajustada. Existe conciencia institucional en tu práctica. Posiblemente ya influyes en otros colegas y contribuyes a conversaciones sobre lineamientos.

Tu resto ahora es avanzar hacia gobernanza:
• Documentar procesos.
• Escalar dilemas éticos cuando sea necesario.
• Contribuir activamente a la construcción de criterios institucionales.

Tu práctica es consistente y replicable.`
        };

        if (score >= 60) return {
            nivel: "Integración pedagógica",
            rango: "60–74",
            desc: `La IA ya forma parte de tu diseño pedagógico con intención clara.
            
Estás vinculando su uso con objetivos curriculares específicos y realizando ajustes en evaluación. Además, demuestras conciencia sobre riesgos éticos y aplicas supervisión humana en tus decisiones. Tu práctica refleja alineación con estándares internacionales de integración pedagógica responsable.

Sin embargo, aún puedes fortalecer:
• La documentación de tus decisiones.
• La articulación con lineamientos institucionales.
• La evaluación del impacto real del uso de IA en el aprendizaje.

Ya no estás experimentando. Estás integrando.`
        };

        if (score >= 40) return {
            nivel: "Uso incipiente",
            rango: "40–59",
            desc: `Ya estás utilizando IA en tu práctica, pero principalmente de forma instrumental u ocasional.
            
Tu uso muestra intención, aunque aún no es completamente sistemático en términos de evaluación, documentación o criterios éticos explícitos. Probablemente ya reconoces algunos riesgos y tienes nociones básicas de supervisión humana, pero todavía no hay una integración estructurada con lineamientos institucionales o impacto medible.

Tu siguiente paso es avanzar de la eficiencia a la coherencia pedagógica. Pregúntate:
• ¿Estoy ajustando mis criterios de evaluación cuando uso IA?
• ¿Estoy comunicando claramente límites y riesgos a mis estudiantes?
• ¿Estoy documentando mis decisiones?

Estás construyendo bases importantes.`
        };

        return {
            nivel: "Exploración",
            rango: "0–39",
            desc: `Hoy te encuentras en una etapa inicial de aproximación a la inteligencia artificial en educación.
            
Esto significa que el uso de IA en tu práctica es limitado o aún no está integrado de manera estructurada al currículo, la evaluación o los principios éticos. Puede que exista interés o curiosidad, pero todavía no se evidencia una integración pedagógica planificada ni una comprensión sólida de los riesgos y responsabilidades asociados.

Este resultado no es una debilidad. Es tu punto de partida. El siguiente paso no es usar más herramientas, sino fortalecer tu comprensión sobre:
• Cómo vincular la IA con objetivos curriculares concretos.
• Cómo mantener supervisión humana significativa.
• Cómo identificar riesgos éticos básicos.

Estás en el inicio del camino ATLAS.`
        };
    };

    // ── INTERPRETACIONES COMPASS — DIRECTIVO (texto original sin modificar) ──
    const getCompassDataDirectivo = (score) => {
        if (score >= 90) return {
            nivel: "Gobernanza alineada internacionalmente",
            rango: "90–100",
            desc: `Tu puntaje refleja el nivel actual de madurez institucional en gobernanza de IA educativa.

No mide adopción tecnológica.
Mide coherencia, supervisión, gestión de riesgo y alineación con estándares internacionales.

En este nivel la institución demuestra una madurez alta en gobernanza de IA, alineada con principios internacionales de ética, supervisión humana, protección de datos y rendición de cuentas.

Evidencias:
• Existen políticas formales y monitoreo sistemático.
• Se realizan evaluaciones de riesgo antes de implementar.
• Se documenta impacto y decisiones automatizadas.
• Hay mecanismos claros de reclamación y revisión.
• La cultura institucional incorpora criterios éticos y pedagógicos explícitos.

La IA no es solo una herramienta.
Es un componente regulado dentro de la arquitectura institucional.

El desafío en este nivel no es crecer, sino sostener coherencia y liderazgo.

Te invitamos a avanzar en el modelo ATLAS y consolidar la gobernanza de IA responsable en tu institución.

Este diagnóstico es una fotografía del momento actual.
La meta no es alcanzar 100 por cumplimiento.
La meta es asegurar que la adopción de IA ocurra con coherencia pedagógica, responsabilidad ética y solidez institucional.`
        };

        if (score >= 75) return {
            nivel: "Gobernanza consolidada",
            rango: "75–89",
            desc: `Tu puntaje refleja el nivel actual de madurez institucional en gobernanza de IA educativa.

La IA estaría integrada dentro de una arquitectura institucional coherente.

En este nivel existen protocolos formales, responsabilidades definidas, supervisión humana obligatoria y evaluación de impacto periódica.

Evidencias de gobernanza:
• Hay comité o instancia de seguimiento.
• Se documentan decisiones relevantes.
• Se gestionan riesgos de manera preventiva.
• Hay transparencia hacia la comunidad educativa.

La institución no solo regula el uso de IA: lo gobierna.

El siguiente paso es asegurar sostenibilidad y mejora continua.

Recuerda:
Este diagnóstico es una fotografía del momento actual.
La meta es fortalecer coherencia, responsabilidad ética y solidez institucional.`
        };

        if (score >= 60) return {
            nivel: "Gobernanza estructurada",
            rango: "60–74",
            desc: `Tu puntaje refleja el nivel actual de madurez institucional en gobernanza de IA educativa.

Según tu diagnóstico como directivo, la institución parece contar con política formal y criterios explícitos sobre el uso de IA.

Recuerda que en este nivel:
• Hay lineamientos escritos.
• Se consideran riesgos éticos y de datos.
• Existe revisión antes de escalar implementación.
• Hay formación docente estructurada.

Se deberían poder evidenciar prácticas de supervisión humana significativa, revisión de riesgos y documentación de procesos.

Sin embargo, el monitoreo aún puede no ser sistemático o la evaluación de impacto no estar completamente integrada.

A este punto la institución ya no improvisa: organiza.

Este diagnóstico es una fotografía del momento actual.
El desafío ahora es avanzar hacia monitoreo sistemático y mejora continua.`
        };

        if (score >= 40) return {
            nivel: "Gobernanza emergente",
            rango: "40–59",
            desc: `Tu puntaje refleja el nivel actual de madurez institucional en gobernanza de IA educativa.

La institución parece haber iniciado conversaciones y posiblemente tiene lineamientos preliminares sobre el uso de IA, pero estos no parecen estar completamente formalizados ni monitoreados.

En este nivel:
• Podría existir política escrita, pero sin seguimiento estructurado.
• La supervisión humana no parece ser consistente.
• La gestión de riesgo sería parcial.
• No habría evaluación sistemática de impacto.

Existe intención estratégica, pero aún no parece evidenciarse arquitectura consolidada.

El desafío ahora es pasar de intención a institucionalización.

Recuerda:
La meta no es adoptar más herramientas, sino construir coherencia institucional, responsabilidad ética y estructuras claras de gobernanza.`
        };

        return {
            nivel: "Gobernanza inexistente",
            rango: "0–39",
            desc: `Tu puntaje refleja el nivel actual de madurez institucional en gobernanza de IA educativa.

Actualmente la institución parece no contar con una estructura formal de gobernanza para el uso de IA.

Puede haber uso aislado de herramientas, pero no se detectan lineamientos institucionales claros, supervisión estructurada ni protocolos de gestión de riesgo documentados.

En este nivel:
• No parece haber política formal.
• No habría evaluación sistemática de riesgos.
• No se encontrarían mecanismos claros de rendición de cuentas.
• El uso dependería de decisiones individuales.

El principal riesgo no es tecnológico, sino institucional: desarticulación y exposición jurídica.

El siguiente paso no es prohibir ni adoptar más herramientas, sino establecer principios básicos, responsabilidades explícitas y criterios institucionales claros.

Este diagnóstico es una fotografía del momento actual.
Es el punto de partida para construir una gobernanza sólida y responsable.`
        };
    };

    const compass = React.useMemo(() => {
        return userData.rol === "DIRECTIVO"
            ? getCompassDataDirectivo(puntajeFinal)
            : getCompassData(puntajeFinal);
    }, [puntajeFinal, userData.rol]);

    const checkFormulariosCompletos = () => {
        if (formulariosFase.length === 0) return false;
        return formulariosFase.every(form =>
            respuestasUsuario.some(resp => resp.formulario_id === form.id)
        );
    };

    const formsCompletos = checkFormulariosCompletos();
    const isProcessComplete = progreso?.capa_1_sentido === 'COMPLETADO' && formsCompletos;
    const sinFormulariosAsignados = formulariosFase.length === 0;

    useEffect(() => {
        if (isProcessComplete && !loading) {
            Swal.fire({
                title: `Nivel: ${compass.nivel}`,
                text: userData.rol === "DIRECTIVO"
                    ? "Se ha completado el diagnóstico de gobernanza institucional."
                    : "Has completado con éxito la primera etapa de Auditoría ATLAS.",
                icon: "success",
                confirmButtonColor: "#c5a059",
                timer: 5000,
                timerProgressBar: true,
                backdrop: `rgba(197, 160, 89, 0.2)`
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isProcessComplete, loading]);

    const handleAceptarMarco = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const actualizado = await apiFetch("/api/progreso-fases", {
                method: "POST",
                body: JSON.stringify({ fase: "AUDITAR", capa_1_sentido: "COMPLETADO" }),
            });
            setProgreso(actualizado);
            Swal.fire({
                title: "Compromiso Registrado",
                text: "Ha formalizado su adhesión al Marco Ético ATLAS. El diagnóstico ha sido habilitado.",
                icon: "success",
                confirmButtonColor: "#c5a059",
                timer: 2000
            });
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "No se pudo guardar el compromiso. Intenta de nuevo.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGuardarReto = async () => {
        if (reflexion.length < 100) {
            Swal.fire("Rigor Académico", "La evidencia requiere una profundidad analítica mayor (mínimo 100 caracteres).", "warning");
            return;
        }
        setIsSaving(true);
        try {
            const actualizado = await apiFetch("/api/progreso-fases", {
                method: "POST",
                body: JSON.stringify({ fase: "AUDITAR", capa_3_hito_texto: reflexion }),
            });
            setProgreso(actualizado);
            Swal.fire({ title: "Hito Sincronizado", icon: "success", confirmButtonColor: "#c5a059" });
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="auditar-container animate-fade-in">
            <div className="nav-back-container" style={{ marginBottom: '20px' }}>
                <button className="btn-back-minimal" onClick={() => onNavigate('overview')}
                    style={{ padding: '10px 15px', backgroundColor: '#fff', border: '1px solid #c5a059', borderRadius: '8px', color: '#c5a059', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⬅ Volver al Panel
                </button>
            </div>

            <div className="atlas-roadmap-container">
                <h2 className="roadmap-title">📍 Ruta de finalización de Auditoria ATLAS</h2>
                <div className="roadmap-steps">
                    <div className={`step-item ${progreso?.capa_1_sentido === 'COMPLETADO' ? 'done' : 'active'}`}>
                        <span className="step-num">{progreso?.capa_1_sentido === 'COMPLETADO' ? "✓" : "1"}</span>
                        <p>Marco Ético</p>
                    </div>
                    <div className={`step-item ${formsCompletos ? 'done' : (progreso?.capa_1_sentido === 'COMPLETADO' ? 'active' : '')}`}>
                        <span className="step-num">{formsCompletos ? "✓" : "2"}</span>
                        <p>Diagnóstico</p>
                    </div>
                    <div className={`step-item ${isProcessComplete ? 'done' : (formsCompletos ? 'active' : '')}`}>
                        <span className="step-num">{isProcessComplete ? "✓" : "3"}</span>
                        <p>{userData.rol === "DIRECTIVO" ? "Gobernanza" : "Resultado"}</p>
                    </div>
                </div>
            </div>

            <div className="auditar-layers-grid">
                <div className={`layer-card main-entry ${progreso?.capa_1_sentido === 'COMPLETADO' ? 'completed' : 'pending'}`}>
                    <div className="layer-badge">A1</div>
                    <div className="layer-content">
                        <h3>Capa 1: El Sentido (Gobernanza)</h3>
                        <p className="intro-p">ATLAS no es una capacitación técnica sobre herramientas de IA. Es un proceso de <strong>Auditoría Pedagógica y Gobernanza Institucional</strong>. Declarar este compromiso significa asumir la responsabilidad de integrar la inteligencia artificial con criterio ético, intención pedagógica y evidencia documentada. Este es el punto de partida para una implementación consciente, regulada y estratégica en tu práctica educativa.</p>
                        <button onClick={handleAceptarMarco} disabled={progreso?.capa_1_sentido === 'COMPLETADO' || isSaving} className={`btn-formal-action ${progreso?.capa_1_sentido === 'COMPLETADO' ? 'btn-done' : ''}`}>
                            {isSaving ? "Guardando..." : progreso?.capa_1_sentido === 'COMPLETADO' ? "✓ Compromiso Declarado" : "Declaro Compromiso ATLAS"}
                        </button>
                    </div>
                </div>

                <div className={`layer-card side-entry ${progreso?.capa_1_sentido !== 'COMPLETADO' ? 'locked' : ''}`}>
                    <div className="layer-badge">A2</div>
                    <div className="layer-content">
                        <h3>Capa 2: El Diagnóstico (Data-Driven)</h3>

                        {sinFormulariosAsignados ? (
                            <div className="status-indicator-box">
                                <span className="status-tag locked">⏳ Aún no te han asignado un formulario en esta fase. Contacta a tu administrador.</span>
                            </div>
                        ) : (
                            <>
                                <div className="forms-status-list">
                                    {formulariosFase.map(f => {
                                        const completado = respuestasUsuario.some(r => r.formulario_id === f.id);
                                        return (
                                            <div key={f.id} className={`form-mini-status ${completado ? 'is-ok' : 'is-pending'}`}>
                                                <span className="f-title">{f.titulo}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className="f-check">{completado ? "" : "⏳"}</span>
                                                    {completado && (
                                                        <button
                                                            onClick={() => setModalRespuestas(f)}
                                                            style={{
                                                                fontSize: '0.72rem', padding: '3px 10px',
                                                                borderRadius: '6px', border: '1px solid #c5a059',
                                                                background: 'white', color: '#c5a059',
                                                                cursor: 'pointer', fontWeight: '700'
                                                            }}
                                                        >
                                                            Ver respuestas
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="status-indicator-box">
                                    {progreso?.capa_1_sentido === 'COMPLETADO' ? (
                                        formsCompletos ? <span className="status-tag success">✅ Completo</span> :
                                            <button className="btn-go-diagnostic" onClick={() => onNavigate('responder_fase', 'AUDITAR')}>Ir a Bitácora</button>
                                    ) : <span className="status-tag locked">🔒 Bloqueado</span>}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- CAPA 3: RESULTADOS COMPASS --- */}
            {isProcessComplete && (
                <div className="layer-card-result-full animate-slide-up">
                    <div className="layer-badge-gold">A3</div>

                    <div className="result-main-content">
                        <header className="result-header">
                            <div className="result-title-group">
                                <h3 className="result-subtitle">Resultado COMPASS – Tu nivel de uso responsable de IA:</h3>
                                <h2 className="result-level-name">{compass.nivel}</h2>
                                <span className="result-range-tag">Rango ATLAS: {compass.rango}</span>
                            </div>
                            <div className="result-score-card">
                                <div className="score-number">{puntajeFinal}</div>
                                <div className="score-label">PUNTOS TOTALES</div>
                            </div>
                        </header>

                        <div className="result-details-grid">
                            <article className="interpretation-column">
                                <h4 className="detail-title">Interpretación de Resultados</h4>
                                <p className="description-text" style={{ whiteSpace: 'pre-line' }}>
                                    {compass.desc}
                                </p>
                                <aside className="disclaimer-note">
                                    <strong>Nota:</strong> Este diagnóstico no mide cuánto usas IA. Mide cómo la integras, supervisas y articulas con principios pedagógicos y éticos bajo estándares internacionales (UNESCO, OCDE).
                                </aside>
                            </article>

                            <article className="next-steps-column">
                                <h4 className="next-steps-title">¿Qué sigue ahora?</h4>
                                <p className="next-steps-text">
                                    Has finalizado con éxito la fase de <strong>Auditoría</strong>. Tu fotografía actual nos permite trazar una ruta personalizada para la fase de <strong>Transformación</strong>.
                                </p>
                                <button className="btn-finish-fase" onClick={() => onNavigate('overview')}>
                                    Finalizar Fase
                                </button>
                                <footer className="ready-footer">¿Estás preparad@?</footer>
                            </article>
                        </div>
                    </div>
                </div>
            )}

            {modalRespuestas && (
                <div
                    onClick={() => setModalRespuestas(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white', borderRadius: '20px', padding: '30px',
                            maxWidth: '640px', width: '100%', maxHeight: '80vh',
                            overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>{modalRespuestas.titulo}</h3>
                            <button
                                onClick={() => setModalRespuestas(null)}
                                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
                            >×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {respuestasUsuario
                                .filter(r => r.formulario_id === modalRespuestas.id)
                                .map((r, i) => (
                                    <div key={i} style={{
                                        padding: '14px 18px', background: '#f8fafc',
                                        borderRadius: '12px', border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            Pregunta {i + 1}
                                        </div>
                                        <div style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: '600', marginBottom: '4px' }}>
                                            {r.pregunta_texto || `Pregunta ${i + 1}`}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                                            → {r.valor_respondido}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#c5a059', fontWeight: '700', marginTop: '4px' }}>
                                            {r.puntos_ganados} pts
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
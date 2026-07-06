import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Radar } from "react-chartjs-2";
import "../Styles/ModuloDirectivoEstrategico.css";
import "../Styles/analisis.css";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const ModuloDirectivoEstrategico = ({ userData, apiFetch, onNavigate }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [viewModeReal, setViewModeReal] = useState('stats'); // 'stats' | 'survey' | 'questions'

    // ── Evidencia institucional (Liderar prompts) ──
    const [statsPrompt, setStatsPrompt] = useState({
        totalDocentes: 0,
        distribucionRiesgo: { alto: 0, moderado: 0, responsable: 0 },
        distribucionPorcentaje: { alto: 0, moderado: 0, responsable: 0 },
        riesgosPromedio: { etica: 0, privacidad: 0, agencia: 0, cognitiva: 0 },
    });

    // ── Evidencia Auditar (respuestas de formularios) ──
    const [selectedFormReal, setSelectedFormReal] = useState(null);

    // ── Panorama (4 bloques) ──
    const [panoramaVistos, setPanoramaVistos] = useState({ b1: false, b2: false, b3: false, b4: false });

    // ── Diagnóstico (20 preguntas q1..q20) ──
    const [respuestasDiag, setRespuestasDiag] = useState({
        q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1, q8: 1, q9: 1, q10: 1,
        q11: 1, q12: 1, q13: 1, q14: 1, q15: 1, q16: 1, q17: 1, q18: 1, q19: 1, q20: 1
    });

    // ── Plan de acción ──
    const [planAccion, setPlanAccion] = useState({
        objetivo: "", acciones: "", responsables: "", cronograma: "", indicadores: "", prioridad: "Alta"
    });

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
    }, []);

    // Mapeo q1..q20 -> campos snake_case del backend (diagnóstico)
    const mapDiagToBackend = (d) => ({
        gobernanza_1_politica: d.q1, gobernanza_2_responsable: d.q2,
        gobernanza_3_evaluacion_htas: d.q3, gobernanza_4_protocolo_incidentes: d.q4,
        competencia_1_etica: d.q5, competencia_2_unesco_levels: d.q6,
        competencia_3_plan_progresivo: d.q7, competencia_4_reflexion_critica: d.q8,
        datos_1_protocolo_estudiantes: d.q9, datos_2_anonimizacion: d.q10,
        datos_3_terminos_htas: d.q11, datos_4_almacenamiento: d.q12,
        supervision_1_decision_humana: d.q13, supervision_2_no_automatizada: d.q14,
        supervision_3_monitoreo_ia: d.q15, supervision_4_revision_practicas: d.q16,
        transparencia_1_informa_estud: d.q17, transparencia_2_lineamientos_uso: d.q18,
        transparencia_3_alfabetizacion: d.q19, transparencia_4_declaracion_pub: d.q20,
    });

    const mapBackendToDiag = (b) => ({
        q1: b.gobernanza_1_politica || 1, q2: b.gobernanza_2_responsable || 1,
        q3: b.gobernanza_3_evaluacion_htas || 1, q4: b.gobernanza_4_protocolo_incidentes || 1,
        q5: b.competencia_1_etica || 1, q6: b.competencia_2_unesco_levels || 1,
        q7: b.competencia_3_plan_progresivo || 1, q8: b.competencia_4_reflexion_critica || 1,
        q9: b.datos_1_protocolo_estudiantes || 1, q10: b.datos_2_anonimizacion || 1,
        q11: b.datos_3_terminos_htas || 1, q12: b.datos_4_almacenamiento || 1,
        q13: b.supervision_1_decision_humana || 1, q14: b.supervision_2_no_automatizada || 1,
        q15: b.supervision_3_monitoreo_ia || 1, q16: b.supervision_4_revision_practicas || 1,
        q17: b.transparencia_1_informa_estud || 1, q18: b.transparencia_2_lineamientos_uso || 1,
        q19: b.transparencia_3_alfabetizacion || 1, q20: b.transparencia_4_declaracion_pub || 1,
    });

    const fetchData = async () => {
        try {
            const [evidencia, auditar, prevPano, prevDiag, prevPlan] = await Promise.all([
                apiFetch("/api/asegurar/directivo/evidencia").catch(() => null),
                apiFetch("/api/asegurar/directivo/evidencia-auditar").catch(() => null),
                apiFetch("/api/asegurar/directivo/panorama").catch(() => null),
                apiFetch("/api/asegurar/directivo/diagnostico").catch(() => null),
                apiFetch("/api/asegurar/directivo/plan").catch(() => null),
            ]);

            if (evidencia) setStatsPrompt(evidencia);

            if (auditar && auditar.n > 0) {
                setSelectedFormReal({
                    promedio: auditar.promedio,
                    modaValue: auditar.moda,
                    desviacion: auditar.desviacion,
                    n: auditar.n,
                    analisis: { nivel: auditar.nivel, color: auditar.color, parrafo: auditar.parrafo },
                    preguntas: auditar.preguntas || [],
                });
            }

            if (prevPano) {
                setPanoramaVistos({
                    b1: !!prevPano.visto_bloque_1_regulatorio,
                    b2: !!prevPano.visto_bloque_2_competencias,
                    b3: !!prevPano.visto_bloque_3_etica,
                    b4: !!prevPano.visto_bloque_4_cultura,
                });
            }

            if (prevDiag) setRespuestasDiag(mapBackendToDiag(prevDiag));

            if (prevPlan) {
                setPlanAccion({
                    objetivo: prevPlan.objetivo_estrategico || "",
                    acciones: Array.isArray(prevPlan.acciones_seleccionadas)
                        ? prevPlan.acciones_seleccionadas.join("\n")
                        : (prevPlan.acciones_seleccionadas || ""),
                    responsables: prevPlan.responsables_asignados || "",
                    cronograma: prevPlan.cronograma_estimado || "",
                    indicadores: prevPlan.indicadores_exito || "",
                    prioridad: prevPlan.dimension_prioridad_1 || "Alta",
                });
            }
        } catch (e) {
            console.error("Error cargando datos", e);
        } finally {
            setLoading(false);
        }
    };

    // ── Guardados ──
    const guardarPanorama = async () => {
        setIsSaving(true);
        try {
            await apiFetch("/api/asegurar/directivo/panorama", {
                method: "POST",
                body: JSON.stringify({
                    visto_bloque_1_regulatorio: panoramaVistos.b1,
                    visto_bloque_2_competencias: panoramaVistos.b2,
                    visto_bloque_3_etica: panoramaVistos.b3,
                    visto_bloque_4_cultura: panoramaVistos.b4,
                    feedback_opcional_panorama: "Completado desde Módulo ATLAS",
                }),
            });
            setStep(2);
            window.scrollTo(0, 0);
        } catch (e) {
            Swal.fire("Error", "No se pudo guardar el panorama.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const guardarDiagnostico = async () => {
        const total = (Object.values(respuestasDiag).reduce((a, b) => a + b, 0) / 5).toFixed(2);
        setIsSaving(true);
        try {
            await apiFetch("/api/asegurar/directivo/diagnostico", {
                method: "POST",
                body: JSON.stringify({
                    ...mapDiagToBackend(respuestasDiag),
                    puntaje_total_radar: total,
                    clasificacion_final: getClasificacionFinal().nivel,
                }),
            });
            setStep(3);
            window.scrollTo(0, 0);
        } catch (e) {
            Swal.fire("Error", "No se pudo guardar el diagnóstico.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const guardarPlan = async () => {
        if (!planAccion.objetivo) {
            return Swal.fire("Atención", "Define un objetivo estratégico.", "warning");
        }
        setIsSaving(true);
        try {
            await apiFetch("/api/asegurar/directivo/plan", {
                method: "POST",
                body: JSON.stringify({
                    objetivo_estrategico: planAccion.objetivo,
                    acciones_seleccionadas: planAccion.acciones.split("\n").filter(Boolean),
                    responsables_asignados: planAccion.responsables,
                    cronograma_estimado: planAccion.cronograma,
                    indicadores_exito: planAccion.indicadores,
                    dimension_prioridad_1: planAccion.prioridad,
                    dimension_prioridad_2: "",
                }),
            });
            Swal.fire("Plan Guardado", "Tu Plan Estratégico ATLAS ha sido registrado.", "success");
            onNavigate('fase_asegurar');
        } catch (e) {
            Swal.fire("Error", "No se pudo guardar el plan.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Radar / clasificación ──
    const calcEje = (start, end) => {
        let suma = 0;
        for (let i = start; i <= end; i++) suma += respuestasDiag[`q${i}`] || 1;
        return (suma / 4);
    };

    const radarData = {
        labels: ["Gobernanza", "Competencia Docente", "Gestión de Datos", "Supervisión Humana", "Transparencia"],
        datasets: [
            {
                label: "Autoevaluación Directiva",
                data: [calcEje(1, 4), calcEje(5, 8), calcEje(9, 12), calcEje(13, 16), calcEje(17, 20)],
                backgroundColor: "rgba(197, 160, 89, 0.2)",
                borderColor: "#c5a059",
                borderWidth: 2,
            },
            {
                label: "Realidad Docente (Prompting)",
                data: [
                    (selectedFormReal?.promedio / 25) || 0,
                    statsPrompt.riesgosPromedio.agencia,
                    statsPrompt.riesgosPromedio.privacidad,
                    statsPrompt.riesgosPromedio.etica,
                    statsPrompt.riesgosPromedio.cognitiva
                ],
                backgroundColor: "rgba(26, 35, 126, 0.1)",
                borderColor: "#1a237e",
                borderDash: [5, 5],
            }
        ]
    };

    const getClasificacionFinal = () => {
        const ejes = [calcEje(1, 4), calcEje(5, 8), calcEje(9, 12), calcEje(13, 16), calcEje(17, 20)];
        const avg = ejes.reduce((a, b) => a + b, 0) / 5;
        if (avg >= 3.6) return { nivel: "REFERENTE", color: "#d69e2e" };
        if (avg >= 3.0) return { nivel: "ESTRATÉGICO", color: "#3182ce" };
        if (avg >= 2.0) return { nivel: "EN DESARROLLO", color: "#38a169" };
        return { nivel: "EMERGENTE", color: "#e53e3e" };
    };

    if (loading) return (
        <div className="dash-lider-2026-loader">
            <div className="dash-lider-2026-spinner"></div>
            <p>SINCRONIZANDO INTELIGENCIA INSTITUCIONAL...</p>
        </div>
    );

    return (
        <div className="directivo-wrapper">
            {isSaving && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px',
                    background: '#1a237e', color: 'white', padding: '10px 20px',
                    borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '0.8rem', animation: 'slideIn 0.3s ease-out'
                }}>
                    <div className="spinner-mini"></div>
                    <span>Sincronizando con ATLAS...</span>
                </div>
            )}

            <header className="directivo-header-main">
                <div className="brand">
                    <h2>Módulo de Gobernanza ATLAS</h2>
                    <span>Fase: ASEGURAR | Directivo: {userData.nombre_completo}</span>
                </div>
                <div className="progress-bar-dir">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Panorama</div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Diagnóstico</div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Plan</div>
                </div>
            </header>

            <main className="directivo-content">

                {/* --- ETAPA 1: PANORAMA --- */}
                {step === 1 && (
                    <div className="section-fade">
                        <div className="panorama-cards">
                            <BloqueReflexion
                                title="RIESGOS REGULATORIOS" icon="⚖️" check={panoramaVistos.b1}
                                onClick={() => setPanoramaVistos({ ...panoramaVistos, b1: !panoramaVistos.b1 })}
                                fundamento="El AI Act establece un enfoque basado en riesgo y supervisión humana. Las instituciones son responsables (deployers)."
                                preguntas={["¿Hay decisiones automatizadas sin supervisión humana?", "¿Existe protocolo de datos estudiantiles?", "¿Se evalúan herramientas antes de adoptarlas?"]}
                                alertas={["Sin política formal de IA", "Uso de herramientas sin revisión técnica"]}
                            />
                            <BloqueReflexion
                                title="COMPETENCIAS DOCENTES" icon="🎓" check={panoramaVistos.b2}
                                onClick={() => setPanoramaVistos({ ...panoramaVistos, b2: !panoramaVistos.b2 })}
                                fundamento="UNESCO 2024 define niveles Acquire (Básico), Deepen (Integración) y Create (Innovación)."
                                preguntas={["¿Hay formación estructurada en ética y pedagogía?", "¿Existe evaluación de nivel competencial?", "¿Se fomenta la reflexión crítica?"]}
                                alertas={["Formación solo técnica sin ética", "No hay diferenciación de niveles"]}
                            />
                            <BloqueReflexion
                                title="ÉTICA Y AGENCIA HUMANA" icon="🧠" check={panoramaVistos.b3}
                                onClick={() => setPanoramaVistos({ ...panoramaVistos, b3: !panoramaVistos.b3 })}
                                fundamento="Enfoque humanocéntrico de la UNESCO. El AI Act exige supervisión humana significativa."
                                preguntas={["¿La decisión final es siempre humana?", "¿Se informa el uso de IA en procesos académicos?", "¿Hay transparencia en evaluación asistida?"]}
                                alertas={["Evaluación IA sin declaración explícita", "Sin lineamientos de supervisión"]}
                            />
                            <BloqueReflexion
                                title="CULTURA INSTITUCIONAL" icon="🌐" check={panoramaVistos.b4}
                                onClick={() => setPanoramaVistos({ ...panoramaVistos, b4: !panoramaVistos.b4 })}
                                fundamento="La transformación es cultural. Requiere aprendizaje continuo y experimentación segura."
                                preguntas={["¿Hay narrativa clara del propósito de la IA?", "¿Se promueve experimentación (sandbox)?", "¿Existe un comité de gobernanza IA?"]}
                                alertas={["Adopción reactiva, no estratégica", "Sin responsables institucionales claros"]}
                            />
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button className="btn-next" disabled={!Object.values(panoramaVistos).every(Boolean)} onClick={guardarPanorama}>
                                {isSaving ? "Guardando..." : "Guardar y Continuar →"}
                            </button>
                            {!Object.values(panoramaVistos).every(Boolean) && (
                                <p style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '10px' }}>
                                    * Por favor valide los 4 bloques para continuar
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* --- ETAPA 2: DIAGNÓSTICO --- */}
                {step === 2 && (
                    <div className="section-fade">
                        <div className="grid-diagnostico-full">

                            {/* IZQUIERDA: EVIDENCIAS */}
                            <div className="panel-realidad-docente">
                                <div className="atl-an-modal-head">
                                    <h3>Evidencia Institucional Real</h3>
                                    <div className="modal-tabs">
                                        <button className={viewModeReal === 'stats' ? 'active' : ''} onClick={() => setViewModeReal('stats')}>📊 Adopción</button>
                                        <button className={viewModeReal === 'survey' ? 'active' : ''} onClick={() => setViewModeReal('survey')}>📝 Riesgos Prompts</button>
                                        <button className={viewModeReal === 'questions' ? 'active' : ''} onClick={() => setViewModeReal('questions')}>🔍 Respuestas Auditar</button>
                                    </div>
                                </div>

                                <div className="scroll-evidencias-directivo">
                                    {selectedFormReal && viewModeReal === 'stats' && (
                                        <div className="stats-view animate-fade-in">
                                            <div className="atl-an-metrics-grid">
                                                <div className="atl-an-mini-box dark"><span className="atl-an-val blue">{selectedFormReal.promedio}%</span><span className="atl-an-lbl">MEDIA</span></div>
                                                <div className="atl-an-mini-box dark"><span className="atl-an-val green">{selectedFormReal.modaValue}%</span><span className="atl-an-lbl">MODA</span></div>
                                                <div className="atl-an-mini-box dark"><span className="atl-an-val gold">{selectedFormReal.desviacion}</span><span className="atl-an-lbl">DESV.</span></div>
                                            </div>
                                            <div className="atl-an-insight-card" style={{ marginTop: '15px' }}>
                                                <p style={{ color: selectedFormReal.analisis.color, fontWeight: 'bold' }}>{selectedFormReal.analisis.nivel}</p>
                                                <p className="atl-an-desc" style={{ fontSize: '0.9rem' }}>{selectedFormReal.analisis.parrafo}</p>
                                            </div>
                                        </div>
                                    )}
                                    {!selectedFormReal && viewModeReal === 'stats' && (
                                        <p style={{ padding: '20px', fontSize: '0.85rem', color: '#64748b' }}>Aún no hay respuestas de la fase Auditar registradas por tus docentes.</p>
                                    )}

                                    {viewModeReal === 'survey' && (
                                        <div className="survey-view animate-fade-in">
                                            <div className="riesgo-dist-container">
                                                <h6>Distribución de Riesgo Real:</h6>
                                                <div className="riesgo-bar-global" style={{ display: 'flex', height: '22px', borderRadius: '12px', overflow: 'hidden', margin: '20px 0', background: '#f1f5f9', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                                                    <div style={{ width: `${statsPrompt.distribucionPorcentaje.alto}%`, background: '#ef4444', transition: 'width 0.8s ease' }}></div>
                                                    <div style={{ width: `${statsPrompt.distribucionPorcentaje.moderado}%`, background: '#f59e0b', transition: 'width 0.8s ease' }}></div>
                                                    <div style={{ width: `${statsPrompt.distribucionPorcentaje.responsable}%`, background: '#10b981', transition: 'width 0.8s ease' }}></div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '25px' }}>
                                                    <div className="item-riesgo-detalle" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff5f5', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>🔴 Riesgo Alto (Crítico)</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{statsPrompt.distribucionPorcentaje.alto}% ({statsPrompt.distribucionRiesgo.alto} Docentes)</strong>
                                                    </div>
                                                    <div className="item-riesgo-detalle" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fffbeb', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>🟡 Riesgo Moderado</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{statsPrompt.distribucionPorcentaje.moderado}% ({statsPrompt.distribucionRiesgo.moderado} Docentes)</strong>
                                                    </div>
                                                    <div className="item-riesgo-detalle" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>🟢 Uso Responsable</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{statsPrompt.distribucionPorcentaje.responsable}% ({statsPrompt.distribucionRiesgo.responsable} Docentes)</strong>
                                                    </div>
                                                </div>
                                                <h6 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                                    Promedios por Dimensión (Escala 1-5):
                                                </h6>
                                                <ul className="prompt-list-metrics">
                                                    <li><span>⚖️ Ética:</span> <strong>{statsPrompt.riesgosPromedio.etica}</strong></li>
                                                    <li><span>🔒 Privacidad:</span> <strong>{statsPrompt.riesgosPromedio.privacidad}</strong></li>
                                                    <li><span>👤 Agencia:</span> <strong>{statsPrompt.riesgosPromedio.agencia}</strong></li>
                                                    <li><span>🧠 Andamiaje:</span> <strong>{statsPrompt.riesgosPromedio.cognitiva}</strong></li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {viewModeReal === 'questions' && selectedFormReal && (
                                        <div className="survey-view animate-fade-in">
                                            {selectedFormReal.preguntas.map((q) => (
                                                <div key={q.id} className="pregunta-detalle-card">
                                                    <h6>{q.texto}</h6>
                                                    {q.opciones.map((op) => (
                                                        <div key={op.opcion} className="atl-an-bar-container">
                                                            <div className="atl-an-bar-label-row"><span>{op.opcion}</span><span>{op.pct}%</span></div>
                                                            <div className="atl-an-bar-bg"><div className="atl-an-bar-fill" style={{ width: `${op.pct}%` }}></div></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {viewModeReal === 'questions' && !selectedFormReal && (
                                        <p style={{ padding: '20px', fontSize: '0.85rem', color: '#64748b' }}>Sin respuestas de Auditar para desglosar.</p>
                                    )}
                                </div>
                            </div>

                            {/* DERECHA: RADAR + 20 ITEMS */}
                            <div className="panel-comparativo-directivo">
                                <div className="radar-box">
                                    <div className="clasificacion-pill" style={{ backgroundColor: getClasificacionFinal().color, padding: '5px 15px', borderRadius: '20px', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '10px', display: 'inline-block' }}>
                                        SISTEMA: {getClasificacionFinal().nivel}
                                    </div>
                                    <Radar data={radarData} options={{ scales: { r: { min: 0, max: 4, ticks: { display: false } } } }} />
                                </div>

                                <div className="form-directivo-likert-scroll" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '10px' }}>
                                    <SeccionLikertGroup titulo="1. GOBERNANZA" items={[
                                        { id: 1, txt: "Existe política institucional formal sobre IA." },
                                        { id: 2, txt: "Hay responsable/comité designado para gobernanza IA." },
                                        { id: 3, txt: "Se evalúan herramientas antes de su adopción oficial." },
                                        { id: 4, txt: "Existe protocolo de revisión ante incidentes de IA." }
                                    ]} values={respuestasDiag} onChange={setRespuestasDiag} />
                                    <SeccionLikertGroup titulo="2. COMPETENCIA DOCENTE" items={[
                                        { id: 5, txt: "Docentes formados en ética y uso pedagógico de IA." },
                                        { id: 6, txt: "Se evalúa el nivel (Acquire–Deepen–Create) del staff." },
                                        { id: 7, txt: "Existe un plan de capacitación docente progresivo." },
                                        { id: 8, txt: "Se promueve la reflexión crítica institucionalmente." }
                                    ]} values={respuestasDiag} onChange={setRespuestasDiag} />
                                    <SeccionLikertGroup titulo="3. GESTIÓN DE DATOS" items={[
                                        { id: 9, txt: "Protocolo formal para datos estudiantiles en IA." },
                                        { id: 10, txt: "Se exige anonimización de datos en prompts." },
                                        { id: 11, txt: "Se revisan términos legales de herramientas externas." },
                                        { id: 12, txt: "Hay lineamientos sobre almacenamiento de outputs." }
                                    ]} values={respuestasDiag} onChange={setRespuestasDiag} />
                                    <SeccionLikertGroup titulo="4. SUPERVISIÓN HUMANA" items={[
                                        { id: 13, txt: "Decisión final académica es siempre de un humano." },
                                        { id: 14, txt: "No hay decisiones automatizadas sin revisión." },
                                        { id: 15, txt: "Se monitorea la evaluación asistida por IA periódicamente." },
                                        { id: 16, txt: "Hay auditoría de prácticas docentes con IA." }
                                    ]} values={respuestasDiag} onChange={setRespuestasDiag} />
                                    <SeccionLikertGroup titulo="5. TRANSPARENCIA" items={[
                                        { id: 17, txt: "Se informa a estudiantes sobre el uso de IA en clase." },
                                        { id: 18, txt: "Existen lineamientos de uso ético para estudiantes." },
                                        { id: 19, txt: "Se promueve la alfabetización en IA institucional." },
                                        { id: 20, txt: "Existe declaración pública de uso responsable IA." }
                                    ]} values={respuestasDiag} onChange={setRespuestasDiag} />
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn-save-draft" onClick={() => { setStep(1); window.scrollTo(0, 0); }}>← Panorama</button>
                                    <button className="btn-next w-100" onClick={guardarDiagnostico} disabled={isSaving}>
                                        {isSaving ? "Guardando..." : "Finalizar y Crear Plan →"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ETAPA 3: PLAN --- */}
                {step === 3 && (
                    <div className="section-fade">
                        <div className="canvas-plan" style={{ maxWidth: '900px', margin: '0 auto' }}>
                            <div className="canvas-header" style={{ borderBottom: '2px solid var(--gold-atlas)', marginBottom: '20px', paddingBottom: '10px' }}>
                                <h3 style={{ color: 'var(--primary-atlas)', margin: 0 }}>🏗️ Constructor de Plan Estratégico IA (6 meses)</h3>
                                <p style={{ fontSize: '0.85rem', color: '#666' }}>Fase: Asegurar | Horizonte: Semestral</p>
                            </div>

                            <div className="canvas-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="canvas-col">
                                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>🎯 Objetivo Estratégico</label>
                                    <textarea className="canvas-input" placeholder="Ej: Formalizar política de uso de IA en evaluación académica..." style={{ width: '100%', height: '80px', marginBottom: '15px' }} value={planAccion.objetivo} onChange={(e) => setPlanAccion({ ...planAccion, objetivo: e.target.value })} />
                                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>🛠️ Acciones Prediseñadas / Seleccionadas</label>
                                    <textarea className="canvas-input" placeholder="□ Crear comité IA&#10;□ Capacitación nivel Acquire&#10;□ Protocolo de crisis..." style={{ width: '100%', height: '120px' }} value={planAccion.acciones} onChange={(e) => setPlanAccion({ ...planAccion, acciones: e.target.value })} />
                                </div>

                                <div className="canvas-col">
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>👤 Responsables Asignados</label>
                                        <input type="text" className="canvas-input" placeholder="Ej: Coordinación Académica, TI" style={{ width: '100%', padding: '10px' }} value={planAccion.responsables} onChange={(e) => setPlanAccion({ ...planAccion, responsables: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>📅 Cronograma</label>
                                            <input type="text" placeholder="Ene - Jun 2026" style={{ width: '100%', padding: '10px' }} value={planAccion.cronograma} onChange={(e) => setPlanAccion({ ...planAccion, cronograma: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>⚡ Prioridad</label>
                                            <select style={{ width: '100%', padding: '10px' }} value={planAccion.prioridad} onChange={(e) => setPlanAccion({ ...planAccion, prioridad: e.target.value })}>
                                                <option value="Alta">Alta</option>
                                                <option value="Media">Media</option>
                                                <option value="Baja">Baja</option>
                                            </select>
                                        </div>
                                    </div>
                                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>📈 Indicadores de Éxito</label>
                                    <textarea className="canvas-input" placeholder="Ej: 100% de docentes capacitados, Política aprobada por consejo..." style={{ width: '100%', height: '70px' }} value={planAccion.indicadores} onChange={(e) => setPlanAccion({ ...planAccion, indicadores: e.target.value })} />
                                </div>
                            </div>

                            <div className="canvas-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <button className="btn-draft" onClick={() => { setStep(2); window.scrollTo(0, 0); }}>← Diagnóstico</button>
                                <button className="btn-save-final" onClick={guardarPlan} disabled={isSaving}>
                                    {isSaving ? "Guardando..." : "💾 Guardar Plan Estratégico ATLAS"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- SUBCOMPONENTES ---

const BloqueReflexion = ({ title, icon, check, onClick, fundamento, preguntas, alertas }) => (
    <div className={`card-reflexion ${check ? 'active' : ''}`} onClick={onClick} style={{ textAlign: 'left', padding: '20px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>{icon}</span>
            <span style={{ background: check ? '#38a169' : '#cbd5e0', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                {check ? 'VALIDADO' : 'PENDIENTE'}
            </span>
        </div>
        <h4 style={{ margin: '15px 0 10px 0', color: '#1a237e', fontSize: '1rem' }}>{title}</h4>
        <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '10px' }}>
            Fundamento: <span style={{ fontWeight: 'normal' }}>{fundamento}</span>
        </p>
        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
            <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '0.75rem' }}>
                {preguntas.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
        </div>
        <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
            {alertas.map((a, i) => (
                <div key={i} style={{ fontSize: '0.7rem', color: '#e53e3e', display: 'flex', gap: '5px' }}>
                    <span>⚠️</span> {a}
                </div>
            ))}
        </div>
    </div>
);

const SeccionLikertGroup = ({ titulo, items, values, onChange }) => (
    <div style={{ marginBottom: '20px', background: '#f8f9fa', padding: '10px', borderRadius: '8px' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#c5a059', marginBottom: '10px' }}>{titulo}</p>
        {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', flex: 1, paddingRight: '10px' }}>{item.txt}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4].map(v => (
                        <button key={v} style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.7rem', cursor: 'pointer', background: values[`q${item.id}`] === v ? '#c5a059' : 'white', color: values[`q${item.id}`] === v ? 'white' : '#333' }} onClick={() => onChange(prev => ({ ...prev, [`q${item.id}`]: v }))}>{v}</button>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export default ModuloDirectivoEstrategico;
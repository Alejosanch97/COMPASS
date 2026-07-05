import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/ModuloDirectivoEstrategico.css";

const ModuloDirectivoEstrategico = ({ userData, apiFetch, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [etapa, setEtapa] = useState(1); // 1: Panorama, 2: Diagnóstico, 3: Plan

    // Evidencia institucional (radar de prompts de la empresa)
    const [evidencia, setEvidencia] = useState({
        totalDocentes: 0,
        distribucionRiesgo: { alto: 0, moderado: 0, responsable: 0 },
        distribucionPorcentaje: { alto: 0, moderado: 0, responsable: 0 },
        riesgosPromedio: { etica: 0, privacidad: 0, agencia: 0, cognitiva: 0 },
    });

    // Etapa 1 — Panorama (4 bloques vistos)
    const [panorama, setPanorama] = useState({
        visto_bloque_1_regulatorio: false,
        visto_bloque_2_competencias: false,
        visto_bloque_3_etica: false,
        visto_bloque_4_cultura: false,
        feedback_opcional_panorama: "",
    });

    // Etapa 2 — Diagnóstico (20 preguntas)
    const preguntasDiagnostico = [
        { dim: "Gobernanza", campo: "gobernanza_1_politica", texto: "¿Existe una política institucional formal sobre uso de IA?" },
        { dim: "Gobernanza", campo: "gobernanza_2_responsable", texto: "¿Hay un responsable/comité designado para IA?" },
        { dim: "Gobernanza", campo: "gobernanza_3_evaluacion_htas", texto: "¿Se evalúan las herramientas de IA antes de adoptarlas?" },
        { dim: "Gobernanza", campo: "gobernanza_4_protocolo_incidentes", texto: "¿Existe un protocolo ante incidentes o mal uso de IA?" },
        { dim: "Competencia", campo: "competencia_1_etica", texto: "¿El personal recibe formación en ética de IA?" },
        { dim: "Competencia", campo: "competencia_2_unesco_levels", texto: "¿Se trabajan los niveles UNESCO (Acquire/Deepen/Create)?" },
        { dim: "Competencia", campo: "competencia_3_plan_progresivo", texto: "¿Existe un plan de desarrollo progresivo de competencias?" },
        { dim: "Competencia", campo: "competencia_4_reflexion_critica", texto: "¿Se promueve la reflexión crítica sobre el uso de IA?" },
        { dim: "Datos", campo: "datos_1_protocolo_estudiantes", texto: "¿Hay protocolo de protección de datos de estudiantes?" },
        { dim: "Datos", campo: "datos_2_anonimizacion", texto: "¿Se anonimizan los datos antes de usarlos con IA?" },
        { dim: "Datos", campo: "datos_3_terminos_htas", texto: "¿Se revisan los términos de las herramientas usadas?" },
        { dim: "Datos", campo: "datos_4_almacenamiento", texto: "¿El almacenamiento de datos cumple normativa vigente?" },
        { dim: "Supervisión", campo: "supervision_1_decision_humana", texto: "¿La decisión final siempre recae en un humano?" },
        { dim: "Supervisión", campo: "supervision_2_no_automatizada", texto: "¿Se evitan las decisiones evaluativas automatizadas?" },
        { dim: "Supervisión", campo: "supervision_3_monitoreo_ia", texto: "¿Se monitorea el uso de IA en la institución?" },
        { dim: "Supervisión", campo: "supervision_4_revision_practicas", texto: "¿Se revisan periódicamente las prácticas con IA?" },
        { dim: "Transparencia", campo: "transparencia_1_informa_estud", texto: "¿Se informa a los estudiantes cuando se usa IA?" },
        { dim: "Transparencia", campo: "transparencia_2_lineamientos_uso", texto: "¿Existen lineamientos públicos de uso de IA?" },
        { dim: "Transparencia", campo: "transparencia_3_alfabetizacion", texto: "¿Se promueve la alfabetización en IA de la comunidad?" },
        { dim: "Transparencia", campo: "transparencia_4_declaracion_pub", texto: "¿Hay una declaración pública de uso responsable de IA?" },
    ];

    const estadoInicialDiagnostico = preguntasDiagnostico.reduce((acc, p) => {
        acc[p.campo] = 0;
        return acc;
    }, {});
    const [diagnostico, setDiagnostico] = useState(estadoInicialDiagnostico);

    // Etapa 3 — Plan de acción
    const [plan, setPlan] = useState({
        objetivo_estrategico: "",
        acciones_seleccionadas: [],
        responsables_asignados: "",
        cronograma_estimado: "",
        indicadores_exito: "",
        dimension_prioridad_1: "",
        dimension_prioridad_2: "",
    });

    useEffect(() => {
        window.scrollTo(0, 0);
        cargarTodo();
    }, []);

    const cargarTodo = async () => {
        setLoading(true);
        try {
            const [ev, pan, diag, pl] = await Promise.all([
                apiFetch("/api/asegurar/directivo/evidencia").catch(() => null),
                apiFetch("/api/asegurar/directivo/panorama").catch(() => null),
                apiFetch("/api/asegurar/directivo/diagnostico").catch(() => null),
                apiFetch("/api/asegurar/directivo/plan").catch(() => null),
            ]);

            if (ev) setEvidencia(ev);
            if (pan) setPanorama(prev => ({ ...prev, ...pan }));
            if (diag) setDiagnostico(prev => ({ ...prev, ...diag }));
            if (pl) {
                setPlan(prev => ({
                    ...prev,
                    ...pl,
                    acciones_seleccionadas: Array.isArray(pl.acciones_seleccionadas) ? pl.acciones_seleccionadas : [],
                }));
            }
        } catch (e) {
            console.error("Error cargando módulo directivo:", e);
        } finally {
            setLoading(false);
        }
    };

    // ── Guardado por etapa ──
    const guardarPanorama = async () => {
        setIsSaving(true);
        try {
            await apiFetch("/api/asegurar/directivo/panorama", {
                method: "POST",
                body: JSON.stringify(panorama),
            });
            setEtapa(2);
            window.scrollTo(0, 0);
        } catch (e) {
            Swal.fire("Error", "No se pudo guardar el panorama.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const calcularDiagnostico = () => {
        const valores = Object.values(diagnostico);
        const total = valores.reduce((a, b) => a + Number(b || 0), 0);
        const maximo = preguntasDiagnostico.length * 3; // asumiendo escala 0-3
        const pct = Math.round((total / maximo) * 100);
        let clasificacion;
        if (pct >= 80) clasificacion = "🟢 GOBERNANZA MADURA";
        else if (pct >= 50) clasificacion = "🟡 EN CONSOLIDACIÓN";
        else clasificacion = "🔴 ETAPA INICIAL";
        return { total, pct, clasificacion };
    };

    const guardarDiagnostico = async () => {
        const { total, clasificacion } = calcularDiagnostico();
        setIsSaving(true);
        try {
            await apiFetch("/api/asegurar/directivo/diagnostico", {
                method: "POST",
                body: JSON.stringify({
                    ...diagnostico,
                    puntaje_total_radar: total,
                    clasificacion_final: clasificacion,
                }),
            });
            setEtapa(3);
            window.scrollTo(0, 0);
        } catch (e) {
            Swal.fire("Error", "No se pudo guardar el diagnóstico.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const guardarPlan = async () => {
        if (!plan.objetivo_estrategico || plan.acciones_seleccionadas.length === 0) {
            return Swal.fire("Atención", "Define un objetivo y selecciona al menos una acción.", "warning");
        }
        setIsSaving(true);
        try {
            await apiFetch("/api/asegurar/directivo/plan", {
                method: "POST",
                body: JSON.stringify(plan),
            });
            Swal.fire("Plan Institucional Guardado", "Tu Plan de Acción IA v1.0 ha sido registrado.", "success");
            onNavigate('fase_asegurar');
        } catch (e) {
            Swal.fire("Error", "No se pudo guardar el plan.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const bloquesPanorama = [
        { campo: "visto_bloque_1_regulatorio", icon: "⚖️", titulo: "1. Riesgos Regulatorios", desc: "Cumplimiento del AI Act y protección de datos. La institución es 'deployer' y asume responsabilidad legal sobre el uso de sistemas de IA." },
        { campo: "visto_bloque_2_competencias", icon: "🎓", titulo: "2. Competencias Docentes", desc: "Marco UNESCO: niveles Acquire (adquirir), Deepen (profundizar) y Create (crear). El desarrollo debe ser progresivo y evaluable." },
        { campo: "visto_bloque_3_etica", icon: "🧭", titulo: "3. Dimensión Ética", desc: "Equidad, no discriminación, transparencia y agencia humana. La IA no debe reemplazar el juicio pedagógico ni generar sesgos." },
        { campo: "visto_bloque_4_cultura", icon: "🏛️", titulo: "4. Cultura Institucional", desc: "Adopción sostenible: políticas formales, responsables designados y protocolos de incidentes que sostengan la práctica en el tiempo." },
    ];

    const accionesPlan = [
        "Redactar y publicar política institucional de uso de IA",
        "Designar comité o responsable de gobernanza de IA",
        "Implementar protocolo de anonimización de datos estudiantiles",
        "Programa de formación docente en ética de IA (niveles UNESCO)",
        "Establecer protocolo de supervisión humana obligatoria",
        "Crear declaración pública de uso responsable de IA",
        "Auditoría periódica de herramientas y prácticas con IA",
    ];

    const diag = calcularDiagnostico();

    if (loading) return (
        <div className="mod-dir-loader">
            <div className="mod-dir-spinner"></div>
            <p>SINCRONIZANDO EVIDENCIA INSTITUCIONAL...</p>
        </div>
    );

    return (
        <div className="mod-dir-container">
            <header className="mod-dir-header">
                <div className="mod-dir-header-left">
                    <button className="mod-dir-btn-back" onClick={() => onNavigate('fase_asegurar')}>← Volver</button>
                    <h1>Módulo Estratégico de Gobernanza IA</h1>
                </div>
                <div className="mod-dir-header-right">
                    <div className="mod-dir-user-pill">
                        <span className="mod-dir-role-tag">DIRECTIVO</span>
                        <strong>{userData.nombre_completo}</strong>
                    </div>
                </div>
            </header>

            <div className="mod-dir-stepper">
                <div className={`mod-dir-step ${etapa >= 1 ? 'active' : ''} ${etapa > 1 ? 'done' : ''}`}>
                    <span className="mod-dir-step-num">1</span>
                    <span className="mod-dir-step-label">Panorama</span>
                </div>
                <div className="mod-dir-step-line"></div>
                <div className={`mod-dir-step ${etapa >= 2 ? 'active' : ''} ${etapa > 2 ? 'done' : ''}`}>
                    <span className="mod-dir-step-num">2</span>
                    <span className="mod-dir-step-label">Diagnóstico</span>
                </div>
                <div className="mod-dir-step-line"></div>
                <div className={`mod-dir-step ${etapa >= 3 ? 'active' : ''}`}>
                    <span className="mod-dir-step-num">3</span>
                    <span className="mod-dir-step-label">Plan de Acción</span>
                </div>
            </div>

            <main className="mod-dir-main">

                {/* ── ETAPA 1: PANORAMA ── */}
                {etapa === 1 && (
                    <div className="mod-dir-etapa animate-fade-in">
                        <section className="mod-dir-card">
                            <div className="mod-dir-card-head">
                                <span className="mod-dir-panel-id">Evidencia</span>
                                <h3>Panorama de tu Equipo Docente</h3>
                            </div>
                            <div className="mod-dir-evidencia-row">
                                <div className="mod-dir-evidencia-stat">
                                    <h2>{evidencia.totalDocentes}</h2>
                                    <p>Docentes evaluados</p>
                                </div>
                                <div className="mod-dir-evidencia-stat" style={{ color: '#ef4444' }}>
                                    <h2>{evidencia.distribucionPorcentaje.alto}%</h2>
                                    <p>Riesgo Alto</p>
                                </div>
                                <div className="mod-dir-evidencia-stat" style={{ color: '#f59e0b' }}>
                                    <h2>{evidencia.distribucionPorcentaje.moderado}%</h2>
                                    <p>Riesgo Moderado</p>
                                </div>
                                <div className="mod-dir-evidencia-stat" style={{ color: '#22c55e' }}>
                                    <h2>{evidencia.distribucionPorcentaje.responsable}%</h2>
                                    <p>Responsable</p>
                                </div>
                            </div>
                            <div className="mod-dir-bars-stack">
                                {[
                                    { label: 'Ética y Equidad', val: evidencia.riesgosPromedio.etica, color: '#8b5cf6' },
                                    { label: 'Privacidad de Datos', val: evidencia.riesgosPromedio.privacidad, color: '#06b6d4' },
                                    { label: 'Agencia del Docente', val: evidencia.riesgosPromedio.agencia, color: '#f59e0b' },
                                    { label: 'Andamiaje Cognitivo', val: evidencia.riesgosPromedio.cognitiva, color: '#ec4899' }
                                ].map(dim => (
                                    <div key={dim.label} className="mod-dir-bar-group">
                                        <div className="mod-dir-bar-label">
                                            <span>{dim.label}</span>
                                            <strong>{dim.val} / 5.0</strong>
                                        </div>
                                        <div className="mod-dir-bar-bg">
                                            <div className="mod-dir-bar-fill" style={{ width: `${(dim.val / 5) * 100}%`, backgroundColor: dim.color }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="mod-dir-card">
                            <div className="mod-dir-card-head">
                                <span className="mod-dir-panel-id">Panel 1</span>
                                <h3>Panorama Estratégico (4 Dimensiones)</h3>
                            </div>
                            <p className="mod-dir-intro-text">Revisa cada bloque para comprender el marco de gobernanza antes de diagnosticar tu institución.</p>
                            <div className="mod-dir-panorama-grid">
                                {bloquesPanorama.map(b => (
                                    <div
                                        key={b.campo}
                                        className={`mod-dir-panorama-block ${panorama[b.campo] ? 'visto' : ''}`}
                                        onClick={() => setPanorama({ ...panorama, [b.campo]: !panorama[b.campo] })}
                                    >
                                        <div className="mod-dir-block-icon">{b.icon}</div>
                                        <h4>{b.titulo}</h4>
                                        <p>{b.desc}</p>
                                        <span className="mod-dir-block-check">{panorama[b.campo] ? "✅ Revisado" : "Marcar como leído"}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mod-dir-feedback-box">
                                <label>Reflexión opcional sobre el panorama institucional:</label>
                                <textarea
                                    value={panorama.feedback_opcional_panorama}
                                    onChange={(e) => setPanorama({ ...panorama, feedback_opcional_panorama: e.target.value })}
                                    placeholder="Notas del directivo..."
                                />
                            </div>
                        </section>

                        <div className="mod-dir-nav-actions">
                            <button className="mod-dir-btn-next" onClick={guardarPanorama} disabled={isSaving}>
                                {isSaving ? "Guardando..." : "Continuar al Diagnóstico →"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── ETAPA 2: DIAGNÓSTICO ── */}
                {etapa === 2 && (
                    <div className="mod-dir-etapa animate-fade-in">
                        <section className="mod-dir-card">
                            <div className="mod-dir-card-head">
                                <span className="mod-dir-panel-id">Panel 2</span>
                                <h3>Diagnóstico de Gobernanza (20 Indicadores)</h3>
                            </div>
                            <p className="mod-dir-intro-text">Evalúa el nivel de madurez de cada indicador: 0 = Inexistente, 1 = Incipiente, 2 = En proceso, 3 = Consolidado.</p>

                            <div className="mod-dir-diag-stack">
                                {preguntasDiagnostico.map((p, idx) => (
                                    <div key={p.campo} className="mod-dir-diag-item">
                                        <div className="mod-dir-diag-info">
                                            <span className="mod-dir-diag-dim">{p.dim}</span>
                                            <label>{idx + 1}. {p.texto}</label>
                                        </div>
                                        <div className="mod-dir-diag-scale">
                                            {[0, 1, 2, 3].map(v => (
                                                <button
                                                    key={v}
                                                    className={`mod-dir-scale-btn ${Number(diagnostico[p.campo]) === v ? 'active' : ''}`}
                                                    onClick={() => setDiagnostico({ ...diagnostico, [p.campo]: v })}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mod-dir-diag-result" style={{
                                borderColor: diag.pct >= 80 ? '#22c55e' : (diag.pct >= 50 ? '#f59e0b' : '#ef4444')
                            }}>
                                <div className="mod-dir-diag-score">
                                    <span>Madurez Institucional</span>
                                    <h2>{diag.pct}%</h2>
                                </div>
                                <div className="mod-dir-diag-class">{diag.clasificacion}</div>
                            </div>
                        </section>

                        <div className="mod-dir-nav-actions">
                            <button className="mod-dir-btn-back-step" onClick={() => { setEtapa(1); window.scrollTo(0, 0); }}>← Panorama</button>
                            <button className="mod-dir-btn-next" onClick={guardarDiagnostico} disabled={isSaving}>
                                {isSaving ? "Guardando..." : "Continuar al Plan →"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── ETAPA 3: PLAN DE ACCIÓN ── */}
                {etapa === 3 && (
                    <div className="mod-dir-etapa animate-fade-in">
                        <section className="mod-dir-card">
                            <div className="mod-dir-card-head">
                                <span className="mod-dir-panel-id">Panel 3</span>
                                <h3>Constructor de Plan de Acción IA v1.0</h3>
                            </div>

                            <div className="mod-dir-plan-group">
                                <label>Objetivo Estratégico Principal</label>
                                <textarea
                                    value={plan.objetivo_estrategico}
                                    onChange={(e) => setPlan({ ...plan, objetivo_estrategico: e.target.value })}
                                    placeholder="Ej: Consolidar una cultura institucional de uso ético y supervisado de IA en 12 meses."
                                />
                            </div>

                            <div className="mod-dir-plan-group">
                                <label>Acciones Prioritarias (selecciona las que aplicarás)</label>
                                <div className="mod-dir-acciones-list">
                                    {accionesPlan.map(a => (
                                        <label key={a} className="mod-dir-accion-row">
                                            <input
                                                type="checkbox"
                                                checked={plan.acciones_seleccionadas.includes(a)}
                                                onChange={(e) => {
                                                    const items = e.target.checked
                                                        ? [...plan.acciones_seleccionadas, a]
                                                        : plan.acciones_seleccionadas.filter(i => i !== a);
                                                    setPlan({ ...plan, acciones_seleccionadas: items });
                                                }}
                                            />
                                            <span>{a}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mod-dir-plan-row-split">
                                <div className="mod-dir-plan-group">
                                    <label>Dimensión Prioridad 1</label>
                                    <select value={plan.dimension_prioridad_1} onChange={(e) => setPlan({ ...plan, dimension_prioridad_1: e.target.value })}>
                                        <option value="">Selecciona...</option>
                                        <option value="Gobernanza">Gobernanza</option>
                                        <option value="Competencia">Competencia</option>
                                        <option value="Datos">Datos y Privacidad</option>
                                        <option value="Supervisión">Supervisión</option>
                                        <option value="Transparencia">Transparencia</option>
                                    </select>
                                </div>
                                <div className="mod-dir-plan-group">
                                    <label>Dimensión Prioridad 2</label>
                                    <select value={plan.dimension_prioridad_2} onChange={(e) => setPlan({ ...plan, dimension_prioridad_2: e.target.value })}>
                                        <option value="">Selecciona...</option>
                                        <option value="Gobernanza">Gobernanza</option>
                                        <option value="Competencia">Competencia</option>
                                        <option value="Datos">Datos y Privacidad</option>
                                        <option value="Supervisión">Supervisión</option>
                                        <option value="Transparencia">Transparencia</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mod-dir-plan-group">
                                <label>Responsables Asignados</label>
                                <input
                                    type="text"
                                    value={plan.responsables_asignados}
                                    onChange={(e) => setPlan({ ...plan, responsables_asignados: e.target.value })}
                                    placeholder="Ej: Coordinación académica, Comité de IA"
                                />
                            </div>

                            <div className="mod-dir-plan-row-split">
                                <div className="mod-dir-plan-group">
                                    <label>Cronograma Estimado</label>
                                    <input
                                        type="text"
                                        value={plan.cronograma_estimado}
                                        onChange={(e) => setPlan({ ...plan, cronograma_estimado: e.target.value })}
                                        placeholder="Ej: 6-12 meses"
                                    />
                                </div>
                                <div className="mod-dir-plan-group">
                                    <label>Indicadores de Éxito</label>
                                    <input
                                        type="text"
                                        value={plan.indicadores_exito}
                                        onChange={(e) => setPlan({ ...plan, indicadores_exito: e.target.value })}
                                        placeholder="Ej: 80% docentes formados, 0 incidentes"
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="mod-dir-nav-actions">
                            <button className="mod-dir-btn-back-step" onClick={() => { setEtapa(2); window.scrollTo(0, 0); }}>← Diagnóstico</button>
                            <button className="mod-dir-btn-finish" onClick={guardarPlan} disabled={isSaving}>
                                {isSaving ? "Guardando..." : "✓ Guardar Plan Institucional"}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ModuloDirectivoEstrategico;
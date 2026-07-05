import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseTransformar.css";

const FaseLiderar = ({ userData, apiFetch, onNavigate, onRefreshProgreso }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retosCompletados, setRetosCompletados] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);

    const [verReporte, setVerReporte] = useState(false);
    const [datosPrompt, setDatosPrompt] = useState(null);

    const isDirectivo = userData.rol === "DIRECTIVO";

    const [faseActivada, setFaseActivada] = useState(null);


    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dataProgreso, dataPrompt, dataFases] = await Promise.all([
                apiFetch("/api/liderar/mi-progreso").catch(() => null),
                apiFetch("/api/liderar/mi-prompt").catch(() => null),
                apiFetch("/api/mi-empresa/fases").catch(() => []),
            ]);

            if (dataProgreso) setProgreso(dataProgreso);

            if (dataPrompt && dataPrompt.status === "COMPLETADO") {
                setRetosCompletados([1, 2]);
                setDatosPrompt(dataPrompt);
            }

            // ── NUEVO: decidir si la fase está activada ──
            if (userData.rol === "ADMIN") {
                // el ADMIN no pertenece a una empresa, siempre puede ver
                setFaseActivada(true);
            } else {
                const cfg = Array.isArray(dataFases)
                    ? dataFases.find(f => f.fase === "LIDERAR")
                    : null;
                setFaseActivada(cfg?.is_activa === true);
            }
        } catch (e) {
            console.error("Error cargando Liderar:", e);
            setFaseActivada(false);
        } finally {
            setLoading(false);
        }
    };

    const handleAceptarFase = async () => {
        if (progreso?.capa_1_sentido === 'COMPLETADO') {
            setShowIntro(false);
            return;
        }

        setIsSaving(true);
        try {
            const nuevo = await apiFetch("/api/liderar/aceptar", { method: "POST", body: JSON.stringify({}) });
            setProgreso(nuevo);
            setShowIntro(false);

            if (onRefreshProgreso) await onRefreshProgreso();

            Swal.fire({
                title: "Protocolo Activado",
                text: "Has ingresado oficialmente al Laboratorio Ético de Liderazgo.",
                icon: "success",
                confirmButtonColor: "#c5a059"
            });
        } catch (e) {
            console.error("Error:", e);
            Swal.fire("Error", "No se pudo sincronizar el inicio de fase. Intenta de nuevo.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const getSemaforoColor = (nivel) => {
        const n = Number(nivel);
        if (n >= 4.5) return "#22c55e";
        if (n >= 3.5) return "#84cc16";
        if (n >= 2.5) return "#eab308";
        return "#ef4444";
    };

    const getTextoIndiceATLAS = () => {
        if (!datosPrompt) return "No evaluado";
        const promedio = (Number(datosPrompt.puntaje_etica) +
            Number(datosPrompt.puntaje_privacidad) +
            Number(datosPrompt.puntaje_agencia) +
            Number(datosPrompt.puntaje_dependencia)) / 4;

        if (promedio >= 4.5) return "Liderazgo Responsable";
        if (promedio >= 3.5) return "Uso Seguro con Mejora";
        if (promedio >= 2.5) return "Riesgo Moderado (Requiere ajuste)";
        return "Riesgo Alto / No Aprobado";
    };

    const getInterpretacionDinamica = (dimension, valor) => {
        const v = Number(valor);
        const textos = {
            etica: {
                bajo: "Riesgo Ético Detectado: El prompt parece inducir juicios de valor, etiquetas sociales o clasificaciones que podrían generar sesgos de exclusión.",
                medio: "Cumplimiento Ético Parcial: Aunque el lenguaje es profesional, faltan instrucciones explícitas para evitar alucinaciones o prejuicios algorítmicos.",
                alto: "Liderazgo Ético: Tu instrucción garantiza un trato equitativo y protege la integridad moral de los sujetos involucrados."
            },
            privacidad: {
                bajo: "Alerta de Seguridad: Se detectó el uso de datos sensibles (nombres, correos o IDs). Esto viola los marcos de protección de datos internacionales.",
                medio: "Privacidad Estándar: No hay datos críticos, pero se recomienda el uso de datos sintéticos o anonimización total para evitar re-identificación.",
                alto: "Protocolo Seguro: Gestión impecable de la información. Cero exposición de datos sensibles conforme a la AI Act."
            },
            agencia: {
                bajo: "Delegación Crítica: Estás permitiendo que la IA tome decisiones pedagógicas definitivas (calificar/decidir) sin supervisión humana obligatoria.",
                medio: "Agencia Compartida: La IA propone y tú supervisas, pero los límites de la autoridad docente podrían ser más estrictos.",
                alto: "Soberanía Docente: La IA se mantiene estrictamente como asistente. La decisión pedagógica final reside 100% en tu criterio experto."
            },
            dependencia: {
                bajo: "Alta Dependencia: El prompt automatiza procesos cognitivos que el estudiante debería realizar por sí mismo, limitando su esfuerzo mental.",
                medio: "Uso Instrumental: La IA agiliza la tarea, pero podría integrarse mejor para fomentar el pensamiento crítico en lugar de solo entregar resultados.",
                alto: "Andamiaje Cognitivo: La IA se utiliza para potenciar el análisis y la creatividad, no para sustituir el pensamiento del alumno."
            }
        };

        if (v <= 2) return textos[dimension].bajo;
        if (v <= 3.9) return textos[dimension].medio;
        return textos[dimension].alto;
    };

    const handleNavegacionSegura = (destino, id) => {
        setIsNavigating(true);
        const verificarCarga = setInterval(() => {
            if (!loading) {
                clearInterval(verificarCarga);
                setTimeout(() => {
                    setIsNavigating(false);
                    onNavigate(destino, id);
                    window.scrollTo(0, 0);
                }, 500);
            }
        }, 100);
    };

    return (
        <div className="transformar-master-container">
            {loading && (progreso || datosPrompt) && (
                <div className="atlas-sync-float">
                    <div className="atlas-sync-pill">
                        <span className="sync-icon">🔄</span>
                        <span className="sync-text">Sincronizando Liderazgo...</span>
                    </div>
                </div>
            )}

            {faseActivada === false ? (
                <div className="transformar-intro-container animate-fade-in">
                    <header className="intro-hero">
                        <div className="top-nav-intro">
                            <button className="btn-back-atlas-minimal" onClick={() => onNavigate('overview')}>⬅ Volver al Mapa</button>
                        </div>
                        <span className="badge-fase-pill">Fase: Liderar</span>
                        <h1>Esta fase aún no está disponible</h1>
                        <p className="hero-subtitle">
                            Tu institución todavía no ha habilitado la fase <strong>LIDERAR</strong>.
                            Cuando el administrador la active, podrás acceder al {isDirectivo ? "Panel de Seguimiento Pedagógico" : "Laboratorio de Prompt Ético"} desde aquí.
                        </p>
                    </header>
                    <section className="final-action-section">
                        <div className="action-button-wrapper">
                            <div className="liderar-protocols-card-canvas" style={{ textAlign: 'center', padding: '30px' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔒</div>
                                <h4>Fase bloqueada temporalmente</h4>
                                <p className="text-muted-liderar">
                                    Vuelve más adelante o comunícate con tu coordinador ATLAS para saber cuándo se abrirá.
                                </p>
                                <button className="btn-back-atlas" style={{ marginTop: '16px' }} onClick={() => onNavigate('overview')}>
                                    Volver al Mapa de Fases
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            ) : faseActivada === null ? (
                <div className="atlas-sync-float">
                    <div className="atlas-sync-pill">
                        <span className="sync-icon">🔄</span>
                        <span className="sync-text">Verificando disponibilidad...</span>
                    </div>
                </div>
            ) : showIntro ? (
                <div className="transformar-intro-container animate-fade-in">
                    <header className="intro-hero">
                        <div className="top-nav-intro">
                            <button className="btn-back-atlas-minimal" onClick={() => onNavigate('overview')}>⬅ Volver al Mapa</button>
                        </div>
                        <span className="badge-fase-pill">Fase: Liderar</span>

                        <h1>{isDirectivo ? "Seguimiento Pedagógico Institucional" : "Laboratorio de Prompt Ético"}</h1>

                        <p className="hero-subtitle">
                            {isDirectivo ? (
                                <>Propósito: Garantizar que el equipo docente: 1. Complete AUDITAR. 2. Complete TRANSFORMAR. 3. Reduzca riesgos identificados. 4. Mejore su práctica de manera medible.</>
                            ) : (
                                <>Propósito: Desarrollar competencia en uso responsable de IA generativa alineado con el <strong> enfoque humano-céntrico y ética aplicada</strong>. Basado en marcos globales de gobernanza <span className="highlight-text">(UNESCO 2024 & AI Act)</span>.</>
                            )}
                        </p>
                    </header>

                    <section className="narrative-grid">
                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">01</span>
                                <h3>Propósito Estratégico</h3>
                            </div>
                            {isDirectivo ? (
                                <p>Priorice en su plan de seguimiento aquellas áreas que superen el 20% de aspectos pendientes. La transición a la fase ASEGURAR debe realizarse únicamente cuando se alcance un mínimo del 80% de cumplimiento. <strong>"Un liderazgo sólido se fundamenta en la coherencia pedagógica, la responsabilidad y la acción basada en evidencia."</strong></p>
                            ) : (
                                <p>Reflexionar sobre el impacto ético, pedagógico y profesional de tu interacción con la IA antes de llevarla al aula. <strong> Este laboratorio no evalúa tu creatividad</strong>, sino tu capacidad de supervisión humana.</p>
                            )}
                            <div className="unesco-stack">
                                <div className="u-item">AI for teachers – UNESCO 2024</div>
                                <div className="u-item">Enfoque basado en riesgo – AI Act</div>
                            </div>
                        </div>

                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">02</span>
                                <h3>{isDirectivo ? "Protocolo de Seguimiento" : "Nivel de Responsabilidad"}</h3>
                            </div>
                            {isDirectivo ? (
                                <p>Observe si el riesgo alto disminuyó tras TRANSFORMAR. Si no disminuyó al menos 30%, programe intervención formativa. Identifique la dimensión más débil: Ética, Privacidad, Agencia o Dependencia Cognitiva.</p>
                            ) : (
                                <>
                                    <p>Cada instrucción que delegas a la IA debe ser auditada bajo cuatro dimensiones de control irrenunciables:</p>
                                    <ul className="bullet-list-minimal">
                                        <li>• <strong>Agencia Humana:</strong> El docente mantiene el control y la decisión final.</li>
                                        <li>• <strong>Transparencia:</strong> Declaración explícita del uso de algoritmos.</li>
                                        <li>• <strong>Privacidad:</strong> Protección absoluta de datos sensibles de menores.</li>
                                        <li>• <strong>Equidad:</strong> Vigilancia activa contra sesgos y alucinaciones.</li>
                                    </ul>
                                </>
                            )}
                        </div>
                    </section>

                    <section className="video-full-section">
                        <div className="section-title-box">
                            <span className="icon-badge">{isDirectivo ? "📊" : "🔬"}</span>
                            <div>
                                <h3>{isDirectivo ? "Dashboard de Gobernanza" : "Laboratorio de Prompts"}</h3>
                                <p className="text-muted-liderar">
                                    {isDirectivo
                                        ? "Monitoreo del 90% del equipo completando el ciclo y reducción del 40% en riesgo alto."
                                        : "Evalúa el nivel de responsabilidad y riesgo del uso de IA en tu práctica docente. Pasar de ser un \"usuario de herramientas\" a ser un \"líder de tecnología\"."}
                                </p>
                            </div>
                        </div>

                        <div className="liderar-full-width-container">
                            <div className="liderar-protocols-card-canvas">
                                <h4>{isDirectivo ? "Metas de Liderazgo Efectivo:" : "Protocolos de Validación Humana:"}</h4>
                                <div className="liderar-commitments">
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Cumplimiento General" : "Seguridad y Privacidad"}</p>
                                            <small>{isDirectivo ? "Verificación de áreas rezagadas y activación de recordatorios." : "Cero exposición de identidades estudiantiles en modelos externos."}</small>
                                        </div>
                                    </div>
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Verificación de Mejora" : "Verificación Crítica"}</p>
                                            <small>{isDirectivo ? "Comparar indicadores antes y después para validar reducción de riesgo." : "Validación sistemática de fuentes y detección de sesgos."}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="final-action-section">
                        <div className="action-button-wrapper">
                            <button
                                className={`btn-start-transformar-large ${progreso?.capa_1_sentido === 'COMPLETADO' ? 'btn-already-accepted' : ''}`}
                                onClick={handleAceptarFase}
                                disabled={isSaving || (loading && !progreso)}
                            >
                                {isSaving ? "Registrando..." : (
                                    (loading && !progreso) ? "Sincronizando..." :
                                        (progreso?.capa_1_sentido === 'COMPLETADO'
                                            ? (isDirectivo ? "Ver Panel de Control" : "Ver Misiones de Liderazgo")
                                            : (isDirectivo ? "Activar Seguimiento Pedagógico" : "Activar Protocolo LIDERAR"))
                                )}
                            </button>
                            {!loading && progreso?.capa_1_sentido !== 'COMPLETADO' && (
                                <p className="helper-text">
                                    {isDirectivo
                                        ? "Al activar, habilitas la vista de dashboard institucional."
                                        : "Al activar, habilitas el Laboratorio de Prompt Ético."}
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            ) : (
                <div className="transformar-dashboard animate-fade-in">
                    <div className="dashboard-header-flex">
                        <div className="title-area">
                            <button className="btn-back-atlas" onClick={() => { setVerReporte(false); setShowIntro(true); }}>⬅ Volver al Contexto</button>
                            <h2>{isDirectivo ? "Consola de Liderazgo Institucional" : "Centro de Auditoría y Liderazgo"}</h2>
                        </div>
                        <div className="level-badge-status">
                            {isDirectivo ? "Gobernanza" : (datosPrompt?.clasificacion_riesgo?.split('|')[0] || "Auditor en Formación")}
                        </div>
                    </div>

                    {verReporte ? (
                        <div className="liderar-report-canvas animate-slide-up">
                            <div className="report-narrative-section">
                                <div className="narrative-step-header">
                                    <span className="step-circle">1</span>
                                    <h3>Análisis de tu interacción</h3>
                                </div>
                                <div className="narrative-content-box">
                                    <p className="narrative-label">Tu prompt original fue:</p>
                                    <blockquote className="prompt-blockquote">"{datosPrompt?.prompt_original}"</blockquote>
                                </div>
                            </div>

                            <div className="report-narrative-section">
                                <div className="narrative-step-header">
                                    <span className="step-circle">2</span>
                                    <h3>Tu Autoevaluación Ética</h3>
                                </div>
                                <div className="narrative-content-box">
                                    <div className="resultado-indice-global">
                                        <p className="indice-at-label">Índice Global ATLAS:</p>
                                        <h4 className="indice-at-value">{getTextoIndiceATLAS()}</h4>
                                    </div>
                                    <p className="interpreta-text">
                                        Este resultado refleja tu nivel de consciencia sobre la integridad pedagógica y técnica de tu interacción. {Number(datosPrompt?.puntaje_etica) > 4 ? "Demuestras una alta sensibilidad hacia la equidad y la transparencia." : "Existen dimensiones donde la supervisión humana debe fortalecerse."}
                                    </p>
                                </div>
                            </div>

                            <div className="report-narrative-section">
                                <div className="narrative-step-header">
                                    <span className="step-circle">3</span>
                                    <h3>Dictamen del Semáforo de Riesgo</h3>
                                </div>
                                <div className="narrative-content-box">
                                    <div className="resultado-semaforo-badge" style={{
                                        backgroundColor: datosPrompt?.clasificacion_riesgo?.includes('ALTO') ? '#ef4444' : (datosPrompt?.clasificacion_riesgo?.includes('MODERADO') ? '#f59e0b' : '#22c55e')
                                    }}>
                                        {datosPrompt?.clasificacion_riesgo?.split('|')[0]}
                                    </div>
                                    <p className="dictamen-desc-text">El sistema valida que tu proceso respeta la <strong>Gobernanza de Decisión Docente</strong> y establece un marco de transparencia adecuado para la implementación en el aula.</p>
                                </div>
                            </div>

                            <div className="analisis-final-master">
                                <div className="dictamen-header">
                                    <span className="badge-atlas-audit">DICTAMEN FINAL LIDERAR</span>
                                    <h3>Análisis de Liderazgo Pedagógico</h3>
                                </div>
                                <div className="parrafo-analisis-format">
                                    <p>
                                        Tras completar el Laboratorio de Prompt Ético, el análisis integral concluye que tu interacción con la IA presenta un <strong>{datosPrompt?.clasificacion_riesgo?.split('|')[0]} ({datosPrompt?.simulador_puntaje || "0"}/14)</strong>.
                                        Alineado con los marcos de la <strong>UNESCO 2024 (AI for Teachers)</strong> y la <strong>AI Act</strong>, tu prompt ("{datosPrompt?.prompt_original}")
                                        ha sido auditado bajo la premisa de que la IA debe fortalecer, no reemplazar, la agencia humana.
                                        En la dimensión de Privacidad, se observa que {Number(datosPrompt?.puntaje_privacidad) < 3 ? "existe un riesgo crítico por uso de datos identificables que requiere anonimización inmediata." : "has mantenido un protocolo seguro de minimización de datos."}
                                        Respecto a la Dependencia Cognitiva, el sistema detecta que tu enfoque {Number(datosPrompt?.puntaje_dependencia) > 3 ? "promueve el aprendizaje profundo y el pensamiento crítico," : "podría estar delegando procesos de pensamiento esenciales del estudiante,"} lo cual es vital para el desarrollo de la autonomía intelectual.
                                        Tu rol como docente líder no es evitar la tecnología, sino supervisar que cada salida algorítmica pase por tu filtro profesional.
                                    </p>
                                </div>
                                <div className="reporte-actions-footer">
                                    <button className="btn-launch-mission" onClick={() => setVerReporte(false)}>Finalizar Auditoría</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="retos-roadmap-v2">
                            {isDirectivo ? (
                                <>
                                    <div className={`reto-card-premium active`} style={{ gridColumn: "1 / -1" }}>
                                        <div className="reto-icon-box">📊</div>
                                        <span className="reto-label">Misión de Liderazgo</span>
                                        <h3>Interfaz de Seguimiento Pedagógico</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>Acceda a los Paneles de: Estado de Cumplimiento, Panorama de Riesgo, Brechas por Dimensión y Acciones de Seguimiento.</p>
                                        <button onClick={() => onNavigate('analisis_liderazgo')} className="btn-launch-mission">
                                            Abrir Panel de Control
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={`reto-card-premium ${retosCompletados.includes(1) ? 'completed' : 'active'}`}>
                                        <div className="reto-icon-box">🧪</div>
                                        <span className="reto-label">Misión 1</span>
                                        <h3>Laboratorio de Prompts</h3>
                                        <button
                                            onClick={() => handleNavegacionSegura('retos_liderar', 1)}
                                            className="btn-launch-mission"
                                            disabled={loading || isNavigating}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                cursor: (loading || isNavigating) ? 'wait' : 'pointer',
                                                opacity: (loading || isNavigating) ? 0.8 : 1
                                            }}
                                        >
                                            {(loading || isNavigating) ? (
                                                <>
                                                    <span className="spinner-mini" style={{ animation: 'spin 1s linear infinite' }}></span>
                                                    <span>Cargando datos...</span>
                                                </>
                                            ) : (
                                                retosCompletados.includes(1) ? "Revisar Prompt" : "Abrir Laboratorio"
                                            )}
                                        </button>
                                        {retosCompletados.includes(1) && <div className="badge-done">Completado</div>}
                                    </div>

                                    <div className={`reto-card-premium ${retosCompletados.includes(2) ? 'completed' : (retosCompletados.includes(1) ? 'active' : 'locked')}`}>
                                        <div className="reto-icon-box">🚦</div>
                                        <span className="reto-label">Misión 2</span>
                                        <h3>Semáforo de Riesgo IA</h3>
                                        {!retosCompletados.includes(1) ? (
                                            <div className="lock-indicator">🔒 Pendiente Misión 1</div>
                                        ) : (
                                            <button
                                                onClick={() => setVerReporte(true)}
                                                className="btn-launch-mission"
                                            >
                                                {retosCompletados.includes(2) ? "Ver Resultado" : "Ejecutar Semáforo"}
                                            </button>
                                        )}
                                        {retosCompletados.includes(2) && <div className="badge-done">Completado</div>}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FaseLiderar;
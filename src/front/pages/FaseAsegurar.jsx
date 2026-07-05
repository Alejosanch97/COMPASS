import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseTransformar.css";

const FaseAsegurar = ({ userData, apiFetch, onNavigate, onRefreshProgreso }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [statusAsegurar, setStatusAsegurar] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const isDirectivo = userData.rol === "DIRECTIVO";

    const [faseActivada, setFaseActivada] = useState(null); // null = cargando, true/false = resuelto

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dataProgreso, dataTaller, dataFases] = await Promise.all([
                apiFetch("/api/asegurar/mi-progreso").catch(() => null),
                isDirectivo
                    ? apiFetch("/api/asegurar/directivo/plan").catch(() => null)
                    : apiFetch("/api/asegurar/mi-taller").catch(() => null),
                apiFetch("/api/mi-empresa/fases").catch(() => []),
            ]);

            if (dataProgreso) setProgreso(dataProgreso);
            if (dataTaller && dataTaller.status === "COMPLETADO") {
                setStatusAsegurar(dataTaller);
            }

            // ADMIN no tiene empresa: siempre habilitado. Docente/Directivo dependen del toggle.
            if (userData.rol === "ADMIN") {
                setFaseActivada(true);
            } else {
                const cfg = Array.isArray(dataFases)
                    ? dataFases.find(f => f.fase === "ASEGURAR")
                    : null;
                setFaseActivada(cfg?.is_activa === true);
            }
        } catch (e) {
            console.error("Error cargando Asegurar:", e);
            setFaseActivada(false);
        } finally {
            setLoading(false);
        }
    };

    const handleAceptarFase = async () => {
        if (progreso?.capa_1_sentido === 'COMPLETADO' || statusAsegurar) {
            setShowIntro(false);
            return;
        }

        setIsSaving(true);
        try {
            const nuevo = await apiFetch("/api/asegurar/aceptar", { method: "POST", body: JSON.stringify({}) });
            setProgreso(nuevo);
            setShowIntro(false);

            if (onRefreshProgreso) await onRefreshProgreso();

            Swal.fire({
                title: isDirectivo ? "Estrategia Activada" : "Taller de Mejora Activado",
                text: "Has iniciado la fase de consolidación y estandarización ética.",
                icon: "success",
                confirmButtonColor: "#c5a059"
            });
        } catch (e) {
            Swal.fire("Error", "No se pudo sincronizar el inicio.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleNavegacionSegura = (destino, id = null) => {
        setIsNavigating(true);
        const verificarCarga = setInterval(() => {
            if (!loading) {
                clearInterval(verificarCarga);
                setTimeout(() => {
                    setIsNavigating(false);
                    onNavigate(destino, id);
                    window.scrollTo(0, 0);
                }, 600);
            }
        }, 100);
    };

    return (
        <div className="transformar-master-container">
            {/* Fase no activada por la institución */}
        {faseActivada === false ? (
            <div className="transformar-intro-container animate-fade-in">
                <header className="intro-hero">
                    <div className="top-nav-intro">
                        <button className="btn-back-atlas-minimal" onClick={() => onNavigate('overview')}>⬅ Volver al Mapa</button>
                    </div>
                    <span className="badge-fase-pill">Fase: Asegurar</span>
                    <h1>Esta fase aún no está disponible</h1>
                    <p className="hero-subtitle">
                        Tu institución todavía no ha habilitado la fase <strong>ASEGURAR</strong>. 
                        Cuando el administrador la active, podrás acceder al {isDirectivo ? "Módulo de Gobernanza" : "Taller de Mejora Guiada"} desde aquí.
                    </p>
                </header>
                <section className="final-action-section">
                    <div className="action-button-wrapper">
                        <div className="liderar-protocols-card-canvas" style={{ textAlign: 'center', padding: '30px' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔒</div>
                            <h4>Fase bloqueada temporalmente</h4>
                            <p className="text-muted-liderar">
                                Vuelve más adelante o comunícate con tu coordinador ATLAS para conocer cuándo se abrirá.
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
                        <span className="badge-fase-pill">Fase: Asegurar</span>
                        <h1>{isDirectivo ? "Gobernanza y Sostenibilidad IA" : "Taller de Mejora Guiada"}</h1>
                        <p className="hero-subtitle">
                            {isDirectivo ?
                                "Evaluar el nivel de preparación estratégica y asegurar un plan de acción institucional bajo marcos regulatorios." :
                                "Pasar de un uso funcional de la IA a un uso estructurado, ético y sostenible de tu práctica docente."}
                        </p>
                    </header>

                    <section className="narrative-grid">
                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">01</span>
                                <h3>Propósito Principal</h3>
                            </div>
                            <p>
                                {isDirectivo ?
                                    "Este ejercicio no evalúa innovación tecnológica. Evalúa la calidad de la gobernanza, el nivel de responsabilidad y la sostenibilidad institucional en la gestión del riesgo." :
                                    "Reducir riesgos, estandarizar buenas prácticas y garantizar que el estudiante mantenga un rol cognitivo activo."}
                            </p>
                            <div className="unesco-stack">
                                <div className="u-item">AI Act - Deployer Responsibility</div>
                                <div className="u-item">UNESCO - Professional Learning</div>
                            </div>
                        </div>

                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">02</span>
                                <h3>Factores Críticos</h3>
                            </div>
                            <ul className="bullet-list-minimal">
                                <li>• <strong>Supervisión Humana:</strong> Decisión final siempre docente.</li>
                                <li>• <strong>Transparencia:</strong> Declaración explícita de uso.</li>
                                <li>• <strong>Agencia:</strong> Evitar la dependencia cognitiva.</li>
                                {isDirectivo && <li>• <strong>Gobernanza:</strong> Políticas y protocolos formales.</li>}
                            </ul>
                        </div>
                    </section>

                    <section className="video-full-section">
                        <div className="section-title-box">
                            <span className="icon-badge">✅</span>
                            <div>
                                <h3>{isDirectivo ? "Panorama Estratégico" : "Upgrade de Prácticas con IA"}</h3>
                                <p className="text-muted-liderar">
                                    {isDirectivo ?
                                        "Analice los riesgos regulatorios, el desarrollo de competencias docentes, la dimensión ética y la cultura institucional frente al uso de IA." :
                                        "No vas a crear algo nuevo. Vas a mejorar y consolidar lo que ya estás usando para hacerlo infalible."}
                                </p>
                            </div>
                        </div>

                        <div className="liderar-full-width-container">
                            <div className="liderar-protocols-card-canvas">
                                <h4>{isDirectivo ? "Dimensiones del Radar Directivo:" : "Resultados del Taller:"}</h4>
                                <div className="liderar-commitments">
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Riesgos Regulatorios" : "Reducción de Riesgo"}</p>
                                            <small>{isDirectivo ? "Cumplimiento de protección de datos y AI Act." : "Disminución medible de la dependencia cognitiva."}</small>
                                        </div>
                                    </div>
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Competencias Docentes" : "Estándar Personal"}</p>
                                            <small>{isDirectivo ? "Niveles Acquire, Deepen y Create (UNESCO)." : "Compromiso formal de uso ético y responsable."}</small>
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
                                {isSaving ? "Sincronizando..." : (
                                    (loading && !progreso) ? "Cargando..." :
                                        (progreso?.capa_1_sentido === 'COMPLETADO' || statusAsegurar
                                            ? (isDirectivo ? "Ir al Diagnóstico Directivo" : "Ir al Taller de Mejora")
                                            : "Activar Fase ASEGURAR")
                                )}
                            </button>
                            <p className="helper-text">
                                {isDirectivo ? "Accederá al radar institucional y al constructor de plan estratégico." : "Accederá a la interfaz de comparativa y refactor de prompts éticos."}
                            </p>
                        </div>
                    </section>
                </div>
            ) : (
                <div className="transformar-dashboard animate-fade-in">
                    <div className="dashboard-header-flex">
                        <div className="title-area">
                            <button className="btn-back-atlas" onClick={() => setShowIntro(true)}>⬅ Volver al Contexto</button>
                            <h2>{isDirectivo ? "Módulo Estratégico de Sostenibilidad" : "Consolidación de Práctica Ética"}</h2>
                        </div>
                        <div className="level-badge-status">
                            {statusAsegurar?.status === 'COMPLETADO' ? "Certificado" : "Fase Activa"}
                        </div>
                    </div>

                    <div className="retos-roadmap-v2">
                        {isDirectivo ? (
                            <>
                                <div className={`reto-card-premium active`} style={{ gridColumn: "1 / -1" }}>
                                    <div className="reto-icon-box">🏢</div>
                                    <span className="reto-label">Directivo</span>
                                    <h3>Diagnóstico y Plan Institucional</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                                        Visualice el panorama docente, realice el cuestionario de gobernanza y genere su Plan de Acción IA v1.0.
                                    </p>
                                    <button onClick={() => onNavigate('diagnostico_directivo')} className="btn-launch-mission">
                                        {statusAsegurar ? "Revisar Plan Institucional" : "Iniciar Diagnóstico"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={`reto-card-premium ${statusAsegurar ? 'completed' : 'active'}`}>
                                    <div className="reto-icon-box">🛠️</div>
                                    <span className="reto-label">Misión 1</span>
                                    <h3>Taller de Mejora Guiada</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#666', margin: '10px 0' }}>
                                        Refactoriza tu prompt previo para eliminar riesgos de agencia y privacidad.
                                    </p>
                                    <button
                                        onClick={() => handleNavegacionSegura('taller_asegurar')}
                                        className="btn-launch-mission"
                                        disabled={loading || isNavigating}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            minWidth: '200px',
                                            cursor: (loading || isNavigating) ? 'wait' : 'pointer',
                                            opacity: (loading || isNavigating) ? 0.8 : 1,
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {(loading || isNavigating) ? (
                                            <>
                                                <span className="spinner-mini" style={{
                                                    animation: 'spin 1s linear infinite',
                                                    border: '2px solid rgba(255,255,255,0.3)',
                                                    borderTop: '2px solid #fff',
                                                    borderRadius: '50%',
                                                    width: '14px',
                                                    height: '14px'
                                                }}></span>
                                                <span>Cargando datos...</span>
                                            </>
                                        ) : (
                                            statusAsegurar ? "Ver Mejora Realizada" : "Realizar Upgrade"
                                        )}
                                    </button>
                                    {statusAsegurar && <div className="badge-done">Completado</div>}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaseAsegurar;
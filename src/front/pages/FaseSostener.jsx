import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseTransformar.css";

const FaseSostener = ({ userData, apiFetch, onNavigate, onRefreshProgreso }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [statusSostener, setStatusSostener] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const isDirectivo = userData.rol === "DIRECTIVO";

    const [faseActivada, setFaseActivada] = useState(null); // null = cargando, true/false = resuelto

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dataProgreso, dataStatus, dataFases] = await Promise.all([
                apiFetch("/api/sostener/mi-progreso").catch(() => null),
                isDirectivo
                    ? apiFetch("/api/sostener/directivo/cierre").catch(() => null)
                    : apiFetch("/api/sostener/mis-evaluaciones").catch(() => []),
                apiFetch("/api/mi-empresa/fases").catch(() => []),
            ]);

            if (dataProgreso) {
                setProgreso(dataProgreso);
                if (dataProgreso.capa_1_sentido === "COMPLETADO") setShowIntro(false);
            }

            if (isDirectivo) {
                if (dataStatus) setStatusSostener(dataStatus);
            } else {
                if (Array.isArray(dataStatus) && dataStatus.length > 0) {
                    setStatusSostener(dataStatus[0]);
                }
            }

            // ADMIN no tiene empresa: siempre habilitado. Docente/Directivo dependen del toggle.
            if (userData.rol === "ADMIN") {
                setFaseActivada(true);
            } else {
                const cfg = Array.isArray(dataFases)
                    ? dataFases.find(f => f.fase === "SOSTENER")
                    : null;
                setFaseActivada(cfg?.is_activa === true);
            }
        } catch (e) {
            console.error("Error cargando Sostener:", e);
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
            const nuevo = await apiFetch("/api/sostener/aceptar", { method: "POST", body: JSON.stringify({}) });
            setProgreso(nuevo);
            setShowIntro(false);

            if (onRefreshProgreso) await onRefreshProgreso();

            Swal.fire({
                title: isDirectivo ? "Estrategia de Sostenibilidad" : "Radar de Desarrollo Activo",
                text: isDirectivo ? "Iniciando proceso de consolidación institucional." : "Has iniciado tu proceso de autoevaluación y cierre de ciclo.",
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
        setTimeout(() => {
            setIsNavigating(false);
            onNavigate(destino, id);
            window.scrollTo(0, 0);
        }, 500);
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
                        <span className="badge-fase-pill">Fase: Sostener</span>
                        <h1>Esta fase aún no está disponible</h1>
                        <p className="hero-subtitle">
                            Tu institución todavía no ha habilitado la fase <strong>SOSTENER</strong>.
                            Cuando el administrador la active, podrás acceder al {isDirectivo ? "Cierre Institucional" : "Radar de Desarrollo"} desde aquí.
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
                        <span className="badge-fase-pill">Fase: Sostener</span>
                        <h1>{isDirectivo ? "Cierre Institucional ATLAS" : "Autoevaluación Docente IA"}</h1>
                        <p className="hero-subtitle">
                            {isDirectivo ?
                                "Institucionalice la gobernanza de la IA y consolide la arquitectura estratégica que permitirá la sostenibilidad y escalabilidad de su proyecto educativo." :
                                "Un espacio de reflexión para acompañarte en el desarrollo consciente, ético y estratégico de tu práctica."}
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
                                "Consolidar la gobernanza institucional de IA, cerrando el ciclo ATLAS con una hoja de ruta anual basada en evidencia longitudinal." :
                                "Reflexionar sobre tu evolución en el uso de IA, cerrando el ciclo con un plan de mejora personal sostenible."}
                            </p>
                            <div className="unesco-stack">
                                <div className="u-item">AI Competency - UNESCO 2024</div>
                                <div className="u-item">Sostenibilidad y Gobernanza</div>
                            </div>
                        </div>

                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">02</span>
                                <h3>Componentes Clave</h3>
                            </div>
                            <ul className="bullet-list-minimal">
                                <li>• <strong>Radar:</strong> Autoevaluación en 4 dimensiones.</li>
                                <li>• <strong>Historial:</strong> Visualización de progreso semestral.</li>
                                <li>• <strong>Acción:</strong> De la reflexión al compromiso real de mejora.</li>
                                {isDirectivo && <li>• <strong>Gobernanza:</strong> Institucionalización de buenas prácticas.</li>}
                            </ul>
                        </div>
                    </section>

                    <section className="video-full-section">
                        <div className="section-title-box">
                            <span className="icon-badge">📊</span>
                            <div>
                                <h3>{isDirectivo ? "Proyección de Madurez" : "Radar de Crecimiento Profesional"}</h3>
                                <p className="text-muted-liderar">
                                    {isDirectivo ?
                                    "Analice la distribución de niveles docentes, reduzca alertas institucionales y genere su hoja de ruta anual." :
                                    "Obtén un análisis por dimensiones (Pedagogía, Ética, Impacto y Desarrollo) y recomendaciones personalizadas."}
                                </p>
                            </div>
                        </div>

                        <div className="liderar-full-width-container">
                            <div className="liderar-protocols-card-canvas">
                                <h4>{isDirectivo ? "Indicadores de Sostenimiento:" : "Beneficios de la Evaluación:"}</h4>
                                <div className="liderar-commitments">
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Radar Longitudinal" : "Nivel de Integración"}</p>
                                            <small>{isDirectivo ? "Comparativa semestre actual vs anterior." : "Identificación automática de tu perfil docente IA."}</small>
                                        </div>
                                    </div>
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Alertas de Riesgo" : "Plan de Mejora"}</p>
                                            <small>{isDirectivo ? "Detección de patrones críticos en la institución." : "Hoja de ruta clara para avanzar al siguiente nivel."}</small>
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
                                        (progreso?.capa_1_sentido === 'COMPLETADO'
                                            ? (isDirectivo ? "Ir al Dashboard Estratégico" : "Ir al Radar de Desarrollo")
                                            : "Activar Fase SOSTENER")
                                )}
                            </button>
                            <p className="helper-text">
                                {isDirectivo ? "Accederá al radar longitudinal y proyecciones institucionales." : "Accederá al sistema de autoevaluación y diario reflexivo."}
                            </p>
                        </div>
                    </section>
                </div>
            ) : (
                <div className="transformar-dashboard animate-fade-in">
                    <div className="dashboard-header-flex">
                        <div className="title-area">
                            <button className="btn-back-atlas" onClick={() => setShowIntro(true)}>⬅ Volver al Contexto</button>
                            <h2>{isDirectivo ? "Gestión de Sostenibilidad Institucional" : "Desarrollo y Mejora Continua"}</h2>
                        </div>
                        <div className="level-badge-status">
                            {statusSostener ? "Ciclo Cerrado" : "Fase Activa"}
                        </div>
                    </div>

                    <div className="retos-roadmap-v2">
                        {isDirectivo ? (
                            <>
                                <div className={`reto-card-premium active`} style={{ gridColumn: "1 / -1" }}>
                                    <div className="reto-icon-box">🏛️</div>
                                    <span className="reto-label">Directivo</span>
                                    <h3>Cierre Institucional COMPASS</h3>
                                    <p style={{fontSize: '0.9rem', color: '#666', marginTop: '10px'}}>
                                        Gestione el radar longitudinal, analice riesgos estructurales y defina la ruta hacia la certificación ATLAS.
                                    </p>
                                    <button
                                        onClick={() => handleNavegacionSegura('modulo_sostener_directivo')}
                                        className="btn-launch-mission"
                                        disabled={loading || isNavigating}
                                    >
                                        {isNavigating ? "Cargando..." : (statusSostener ? "Revisar Hoja de Ruta" : "Construir Hoja de Mejora")}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={`reto-card-premium ${statusSostener ? 'completed' : 'active'}`}>
                                    <div className="reto-icon-box">📈</div>
                                    <span className="reto-label">Reto Final</span>
                                    <h3>Radar Docente y Autoevaluación</h3>
                                    <p style={{fontSize: '0.85rem', color: '#666', margin: '10px 0'}}>
                                        Realice su evaluación semestral de dimensiones y visualice su evolución histórica.
                                    </p>
                                    <button
                                        onClick={() => handleNavegacionSegura('modulo_sostener')}
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
                                                <span>Cargando...</span>
                                            </>
                                        ) : (
                                            statusSostener ? "Ver Mi Evolución" : "Iniciar Autoevaluación"
                                        )}
                                    </button>
                                    {statusSostener && <div className="badge-done">Completado</div>}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaseSostener;
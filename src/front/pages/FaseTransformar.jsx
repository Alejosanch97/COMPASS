import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseTransformar.css";

/**
 * FaseTransformar
 * Mantiene el mismo diseño y textos del código original, pero conectado
 * al backend Flask nuevo. Los retos ya no son estáticos: se leen de
 * /api/mi-empresa/retos?fase=TRANSFORMAR (lo que el admin asignó).
 *
 * Si la empresa no tiene retos asignados en esta fase, se muestra un
 * aviso en vez del roadmap de misiones.
 */
export const FaseTransformar = ({ userData, apiFetch, onNavigate }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retosAsignados, setRetosAsignados] = useState([]);
    const [retosCompletados, setRetosCompletados] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const [showIntro, setShowIntro] = useState(true);

    const isDirectivo = userData.rol === "DIRECTIVO";

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading && progreso?.capa_1_sentido === 'COMPLETADO') {
            setShowIntro(false);
        }
    }, [loading, progreso]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [progresoData, retosData, misAvancesData] = await Promise.all([
                apiFetch("/api/progreso-fases").catch(() => []),
                apiFetch("/api/mi-empresa/retos?fase=TRANSFORMAR").catch(() => []),
                apiFetch("/api/mis-retos-transformar").catch(() => []),
            ]);

            const registro = Array.isArray(progresoData)
                ? progresoData.find(item => item.fase === "TRANSFORMAR")
                : null;
            setProgreso(registro);

            const retosOrdenados = Array.isArray(retosData)
                ? [...retosData].sort((a, b) => (a.numero_orden || 0) - (b.numero_orden || 0))
                : [];
            setRetosAsignados(retosOrdenados);

            if (Array.isArray(misAvancesData)) {
                const completados = misAvancesData
                    .filter(r => r.status_reto === 'COMPLETADO')
                    .map(r => r.reto_plantilla_id);
                setRetosCompletados(completados);
            } else {
                setRetosCompletados([]);
            }
        } catch (e) {
            console.error("Error cargando datos de Transformar:", e);
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
            const actualizado = await apiFetch("/api/progreso-fases", {
                method: "POST",
                body: JSON.stringify({ fase: "TRANSFORMAR", capa_1_sentido: "COMPLETADO" }),
            });
            setProgreso(actualizado);

            await Swal.fire({
                title: isDirectivo ? "¡Liderazgo Activado!" : "¡Marco Activado!",
                text: isDirectivo
                    ? "Has formalizado tu inicio en las decisiones de gobernanza responsable."
                    : "Has formalizado tu inicio en la fase TRANSFORMAR. Los retos están listos.",
                icon: "success",
                confirmButtonColor: "#c5a059",
                timer: 3000,
                timerProgressBar: true
            });

            setShowIntro(false);
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "No se pudo sincronizar el inicio de fase.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const sinRetosAsignados = retosAsignados.length === 0;
    const renderIntro = showIntro;

    return (
        <div className="transformar-master-container">

            {renderIntro ? (
                // --- VISTA 1: BIENVENIDA Y CONTEXTO EXTENDIDO ---
                <div className="transformar-intro-container animate-fade-in">
                    <header className="intro-hero">
                        <div className="top-nav-intro">
                            <button
                                className="btn-back-atlas-minimal"
                                onClick={() => onNavigate('overview')}
                            >
                                ⬅ Volver
                            </button>
                        </div>
                        <span className="badge-fase-pill">Fase 2: Transformar</span>
                        <h1>Te damos la bienvenida a la fase TRANSFORMAR</h1>

                        {isDirectivo ? (
                            <p className="hero-subtitle">
                                En la fase anterior analizaste escenarios, identificaste riesgos institucionales y reflexionaste sobre el impacto ético y regulatorio del uso de la IA en educación. Ahora comienza el paso más importante: <strong>convertir ese análisis en decisiones de gobernanza responsables.</strong>
                            </p>
                        ) : (
                            <p className="hero-subtitle">
                                En la fase anterior analizaste herramientas e identificaste riesgos.
                                Ahora comienza el paso más importante: <strong>convertir ese análisis en acción pedagógica responsable.</strong>
                            </p>
                        )}
                    </header>

                    <section className="narrative-grid">
                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">01</span>
                                <h3>¿Qué significa TRANSFORMAR?</h3>
                            </div>

                            {isDirectivo ? (
                                <>
                                    <p>Significa pasar de comprender el riesgo… a <strong>liderar con criterio.</strong> En esta etapa empezarás a desarrollar los retos directivos que te permitirán:</p>
                                    <ul className="bullet-list-minimal">
                                        <li>• Clasificar y gestionar riesgos institucionales asociados al uso de IA.</li>
                                        <li>• Proteger derechos fundamentales de estudiantes y comunidad educativa.</li>
                                        <li>• Fortalecer mecanismos de supervisión humana y rendición de cuentas.</li>
                                        <li>• Diseñar estructuras de gobernanza responsables y sostenibles.</li>
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <p>Significa pasar de evaluar la IA… a <strong>diseñar con criterio.</strong> En esta etapa desarrollarás misiones que te permitirán:</p>
                                    <ul className="bullet-list-minimal">
                                        <li>• Integrar IA con intención pedagógica clara.</li>
                                        <li>• Proteger la agencia y dignidad estudiantil.</li>
                                        <li>• Evitar dependencia tecnológica.</li>
                                        <li>• Diseñar experiencias centradas en lo humano.</li>
                                    </ul>
                                </>
                            )}
                        </div>

                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">02</span>
                                <h3>{isDirectivo ? "Marcos de Liderazgo" : "Marco UNESCO (2024)"}</h3>
                            </div>

                            {isDirectivo ? (
                                <>
                                    <p>Esta fase está alineada con los marcos internacionales que orientan el liderazgo en IA en educación:</p>
                                    <div className="unesco-stack">
                                        <div className="u-item"><strong>EU AI Act 2024:</strong> Enfoque basado en riesgo.</div>
                                        <div className="u-item"><strong>OCDE:</strong> Responsabilidad, robustez y transparencia.</div>
                                        <div className="u-item"><strong>UNESCO:</strong> Dignidad, equidad y protección de derechos.</div>
                                    </div>
                                    <p className="small-context">Para el rol directivo, esta fase implica identificar riesgos estructurales y diseñar protocolos institucionales.</p>
                                </>
                            ) : (
                                <>
                                    <p>Esta fase está alineada con el <em>AI Competency Framework for Teachers</em>, que propone una progresión clara:</p>
                                    <div className="unesco-stack">
                                        <div className="u-item"><strong>Adquirir:</strong> Comprender riesgos y fundamentos.</div>
                                        <div className="u-item"><strong>Profundizar:</strong> Integrar de manera crítica.</div>
                                        <div className="u-item"><strong>Crear:</strong> Diseñar prácticas innovadoras.</div>
                                    </div>
                                    <p className="small-context">Ahora iniciarás el recorrido por estos niveles a través de las misiones.</p>
                                </>
                            )}
                        </div>
                    </section>

                    <section className="video-full-section">
                        <div className="section-title-box">
                            <span className="icon-badge">📺</span>
                            <div>
                                <h3>Antes de comenzar</h3>
                                {isDirectivo ? (
                                    <p>Debes visualizar el video explicativo sobre el <strong>marco regulatorio y de gobernanza en IA</strong> aplicado a educación.</p>
                                ) : (
                                    <p>Debes visualizar el video explicativo del <strong>AI Competency Framework for Teachers – UNESCO (2024)</strong>. Este video es la base conceptual de tus misiones.</p>
                                )}
                            </div>
                        </div>

                        <div className="video-grid-content">
                            <iframe
                                src={isDirectivo
                                    ? "https://player.cloudinary.com/embed/?cloud_name=deafueoco&public_id=La_Ley_de_IA_de_la_Unio%CC%81n_Europea_qfj6aw&profile=cld-looping"
                                    : "https://player.cloudinary.com/embed/?cloud_name=deafueoco&public_id=UNESCO_VIDEO_xt1z8v&profile=cld-looping"
                                }
                                width="100%"
                                height="100%"
                                style={{ border: "none", backgroundColor: "#000" }}
                                allow="fullscreen; encrypted-media"
                                title="Framework Video"
                            ></iframe>
                            <div className="video-points-card">
                                <h4>En este video encontrarás:</h4>
                                {isDirectivo ? (
                                    <ul>
                                        <li>✔ El enfoque basado en riesgo del EU AI Act.</li>
                                        <li>✔ Qué significa un sistema de alto riesgo en educación.</li>
                                        <li>✔ Las obligaciones de supervisión humana y accountability.</li>
                                        <li>✔ La importancia de la gobernanza de datos.</li>
                                        <li>✔ El rol estratégico del liderazgo directivo en la era de la IA.</li>
                                    </ul>
                                ) : (
                                    <ul>
                                        <li>✔ Las dimensiones del marco.</li>
                                        <li>✔ El enfoque human-centred.</li>
                                        <li>✔ La importancia de la agencia.</li>
                                        <li>✔ El rol de la supervisión humana.</li>
                                        <li>✔ La progresión competencial.</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="final-action-section">
                        <div className="expectations-header">
                            <h3>¿Qué se espera en esta fase?</h3>
                            {isDirectivo ? (
                                <p>No se trata de implementar más tecnología. Se trata de <strong>gobernarla con criterio estratégico.</strong></p>
                            ) : (
                                <p>No se trata de usar más IA. Se trata de usarla con <strong>criterio profesional.</strong></p>
                            )}
                        </div>

                        <div className="expectations-grid-styled">
                            {isDirectivo ? (
                                <>
                                    <div className="exp-card">✔ Tomes decisiones basadas en análisis de riesgo y no en presión tecnológica.</div>
                                    <div className="exp-card">✔ Establezcas criterios claros de aprobación y supervisión de herramientas IA.</div>
                                    <div className="exp-card">✔ Protejas derechos fundamentales y privacidad estudiantil.</div>
                                    <div className="exp-card">✔ Diseñes protocolos ante errores, incidentes y vulneraciones.</div>
                                </>
                            ) : (
                                <>
                                    <div className="exp-card">✔ Diseñar con intención, no por moda.</div>
                                    <div className="exp-card">✔ Justificar pedagógicamente el uso de IA.</div>
                                    <div className="exp-card">✔ Mantener expectativas altas para todos.</div>
                                    <div className="exp-card">✔ Integrar principios de equidad.</div>
                                </>
                            )}
                        </div>

                        <div className="action-button-wrapper">
                            <button
                                className={`btn-start-transformar-large ${progreso?.capa_1_sentido === 'COMPLETADO' ? 'btn-already-accepted' : ''}`}
                                onClick={handleAceptarFase}
                                disabled={isSaving || loading}
                            >
                                {isSaving ? "Registrando..." : (
                                    loading ? "Sincronizando estado..." :
                                        (progreso?.capa_1_sentido === 'COMPLETADO' ? "Ver Misiones" : "Aceptar Marco y Comenzar Retos")
                                )}
                            </button>

                            {progreso?.capa_1_sentido !== 'COMPLETADO' && !loading && (
                                <p className="helper-text">Al aceptar, certificas que has comprendido la base ética y conceptual de la fase.</p>
                            )}
                        </div>
                    </section>
                </div>
            ) : (
                // --- VISTA 2: DASHBOARD DE RETOS ---
                <div className="transformar-dashboard animate-fade-in">
                    <div className="dashboard-header-flex">
                        <div className="title-area">
                            <button
                                className="btn-back-atlas"
                                onClick={() => setShowIntro(true)}
                            >
                                ⬅ Volver
                            </button>
                            <h2>{isDirectivo ? "Misiones de Liderazgo y Gobernanza" : "Misiones de Transformación Pedagógica"}</h2>
                        </div>
                        {!sinRetosAsignados && (
                            <div className="level-badge-status">
                                {isDirectivo ? "Estatus: " : "Nivel: "}
                                {retosCompletados.length === retosAsignados.length && retosAsignados.length > 0
                                    ? " Experto"
                                    : retosCompletados.length === 2 ? (isDirectivo ? " Estratega" : " Deepen")
                                    : retosCompletados.length === 1 ? (isDirectivo ? " Gestor" : " Adquirir")
                                    : "🌱 Iniciando"}
                            </div>
                        )}
                    </div>

                    {sinRetosAsignados ? (
                        <div className="reto-card-premium active" style={{ textAlign: "center", padding: "40px" }}>
                            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                                ⏳ Aún no te han asignado retos en la Fase Transformar. Contacta a tu administrador institucional.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="retos-roadmap-v2">
                                {retosAsignados.map((reto) => {
                                    const isCompleted = retosCompletados.includes(reto.id);
                                    const icon = isDirectivo
                                        ? (reto.nivel_unesco === "ACQUIRE" ? "⚖️" : reto.nivel_unesco === "DEEPEN" ? "🔐" : "🚨")
                                        : (reto.nivel_unesco === "ACQUIRE" ? "⚖️" : reto.nivel_unesco === "DEEPEN" ? "🧠" : "🌍");

                                    return (
                                        <div key={reto.id} className={`reto-card-premium ${isCompleted ? 'completed' : ''} active`}>
                                            <div className="reto-icon-box">{icon}</div>
                                            <span className="reto-label">{reto.nivel_unesco || "—"}</span>
                                            <h3>{reto.nombre_reto || reto.nombre}</h3>
                                            <p className="reto-desc-short">{reto.descripcion}</p>

                                            <button
                                                onClick={() => onNavigate('ejecutar_reto', reto.id)}
                                                className="btn-launch-mission"
                                            >
                                                {isCompleted ? "Ver Evidencia" : "Aceptar Misión"}
                                            </button>
                                            {isCompleted && <div className="badge-done">Evidencia Enviada</div>}
                                        </div>
                                    );
                                })}
                            </div>

                            {retosCompletados.length === retosAsignados.length && retosAsignados.length > 0 && (
                                <div className="congrats-final-atlas">
                                    <div className="congrats-content">
                                        <h3>{isDirectivo ? "Gobernanza Fortalecida" : "Fase Transformar Completada"}</h3>
                                        <p>{isDirectivo
                                            ? "Has demostrado competencia liderando la IA con criterio estratégico. Tus protocolos están listos."
                                            : "Has demostrado competencia en los tres niveles UNESCO. Tus evidencias están listas para la validación final."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
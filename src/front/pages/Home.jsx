import React, { useState, useEffect } from "react";
import "../Styles/home.css"; 
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export const Home = ({ onLoginSuccess }) => {
    const [view, setView] = useState("landing"); 
    const [credentials, setCredentials] = useState({ user_key: '', pass: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeFaq, setActiveFaq] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [view]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleInputChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError("");
    };

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacher_key: credentials.user_key,
                    password: credentials.pass,
                })
            });

            const result = await response.json();

            if (response.ok && result.token) {
                localStorage.setItem("token", result.token);
                localStorage.setItem("userATLAS", JSON.stringify(result.usuario));
                if (onLoginSuccess) onLoginSuccess(result.usuario);
                navigate("/dashboard");
            } else {
                setError(result.error || "Credenciales inválidas.");
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError("Error de conexión con el servidor ATLAS.");
        } finally {
            setLoading(false);
        }
    };

    const faqData = [
        {
            q: "¿COMPASS es una plataforma o software?",
            a: "No. COMPASS es un marco estratégico, no una herramienta tecnológica. Proporciona un proceso estructurado para guiar la adopción responsable de la IA, sin depender de software específico."
        },
        {
            q: "¿Se puede adaptar a mi institución?",
            a: "Sí. COMPASS está diseñado para adaptarse a diferentes contextos: colegios, universidades, instituciones públicas o privadas, de distintos tamaños y niveles de madurez tecnológica."
        },
        {
            q: "¿Necesitamos expertos en IA?",
            a: "No. COMPASS no requiere expertise técnico previo. El marco está pensado para líderes educativos y equipos pedagógicos, proporcionando orientación accesible y práctica."
        },
        {
            q: "¿Reemplaza políticas existentes?",
            a: "No necesariamente. COMPASS puede integrarse con políticas y procesos existentes, fortaleciéndolos con un enfoque específico para la adopción responsable de la IA."
        },
        {
            q: "¿Cuánto dura un proceso COMPASS?",
            a: "COMPASS está diseñado para desarrollarse a lo largo de ciclos institucionales, generalmente alineados con el año académico. Un primer ciclo de implementación suele abarcar entre 9 y 12 meses, lo que permite diagnosticar, formar, integrar lineamientos y acompañar la adopción de la inteligencia artificial de manera coherente y sostenible."
        },
        {
            q: "¿COMPASS apoya los procesos de acreditación y calidad institucional?",
            a: "Sí. COMPASS contribuye a los procesos de calidad y acreditación al ofrecer un marco estructurado para la adopción responsable de la IA, alineado con la gobernanza institucional, la formación docente y la mejora continua."
        }
    ];

    if (view === "login") {
        return (
            <div className="atlas-main-container">
                <button className="btn-back-landing" onClick={() => setView("landing")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Volver al Inicio</span>
                </button>
                <div className="atlas-card-glass">
                    <div className="atlas-side-visual">
                        <div className="visual-overlay"></div>
                        <div className="branding-content">
                            <h1 className="logo-typography">COMPASS</h1>
                            <div className="accent-line"></div>
                            <p className="tagline">IA RESPONSABLE EN EDUCACIÓN</p>
                        </div>
                        <div className="phase-footer">
                            <span>Auditar • Transformar • Liderar • Asegurar • Sostener</span>
                        </div>
                    </div>
                    <div className="atlas-auth-panel">
                        <div className="form-wrapper">
                            <div className="brand-header">
                                <img
                                    src={"./logo7.png"}
                                    alt="Logo ATLAS"
                                    className="institute-logo"
                                />
                                <h2>Iniciar Sesión</h2>
                                <p>Gestión Estratégica Institucional</p>
                            </div>
                            <form onSubmit={handleSubmit} className="atlas-form">
                                <div className="input-field">
                                    <label>Clave de Usuario</label>
                                    <input
                                        type="text"
                                        name="user_key"
                                        value={credentials.user_key}
                                        placeholder="Ingresa tu usuario"
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="input-field">
                                    <label>Contraseña</label>
                                    <input
                                        type="password"
                                        name="pass"
                                        placeholder="••••••••"
                                        value={credentials.pass}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                {error && (
                                    <div className="error-badge">
                                        <span className="error-icon">⚠️</span> {error}
                                    </div>
                                )}
                                <button type="submit" className={`btn-atlas-grad ${loading ? 'loading' : ''}`} disabled={loading}>
                                    {loading ? "Verificando..." : "Acceder al Portal"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-wrapper">
            <nav className={`atlas-navbar landing-nav ${isScrolled ? 'scrolled' : 'transparent'}`}>
                <div className="nav-container">
                    <div className="nav-logo-large">
                        <img
                            src={isScrolled ? "./logo1.png" : "./logo6.png"}
                            alt="Logo ATLAS"
                        />
                    </div>
                    <div className="nav-links-centered">
                        <a href="#porque">¿Por qué COMPASS?</a>
                        <a href="#que-es">El Marco</a>
                        <a href="#quienes">¿Para quién?</a>
                        <a href="#certificacion">Certificación</a>
                    </div>
                    <div className="nav-auth-trigger">
                        <button className="btn-nav-login" onClick={() => setView("login")}>Login</button>
                    </div>
                </div>
            </nav>

            <header className="hero-section hero-original-dark">
                <video autoPlay muted loop playsInline className="hero-video-bg">
                    <source src="https://res.cloudinary.com/deafueoco/video/upload/e_accelerate:100/v1/12336965-hd_1920_1028_60fps_pxhxm0" type="video/mp4" />
                    Tu navegador no soporta videos.
                </video>

                <div className="hero-overlay-dark"></div>

                <div className="hero-content">
                    <p className="hero-overline">Marco de gobernanza para el uso responsable de la IA en educación</p>
                    <img
                        src={"./logo3.png"}
                        alt="ATLAS Logo"
                        className="hero-logo"
                    />
                    <div className="hero-description-block">
                        <p className="hero-subtitle">
                            Un marco estructurado que orienta a las instituciones en la integración responsable, ética y sostenible de la inteligencia artificial.
                        </p>
                        <p className="hero-tagline">
                            Acompañamos a instituciones educativas y equipos directivos en la adopción de la IA con claridad, ética y visión de largo plazo.
                        </p>
                    </div>
                    <div className="hero-actions-layout">
                        <button className="btn-primary-large" onClick={() => document.getElementById('porque').scrollIntoView({ behavior: 'smooth' })}>
                            Explorar COMPASS
                        </button>
                        <button className="btn-secondary-large" onClick={() => document.getElementById('que-es').scrollIntoView({ behavior: 'smooth' })}>
                            Conocer el marco
                        </button>
                    </div>
                </div>

                <div className="hero-discover-more-fixed" onClick={() => document.getElementById('porque')?.scrollIntoView({ behavior: 'smooth' })}>
                    <p>Descubre más</p>
                    <span className="arrow-down-anim">↓</span>
                </div>
            </header>

            <section className="section-white section-spacious" id="porque">
                <div className="container">
                    <div className="section-header-content">
                        <p className="section-tag-gold">¿Por qué COMPASS?</p>
                        <h2 className="section-title-large">La educación necesita un marco que asegure la innovación</h2>
                        <div className="section-intro-group">
                            <div className="intro-full-width">
                                <p>
                                    Sin criterios institucionales claros, el uso de la inteligencia artificial pierde coherencia y aumenta riesgos institucionales.
                                </p>
                            </div>
                            <div className="intro-columns-equidistant">
                                <div className="column-item">
                                    <p>
                                        COMPASS articula la adopción de la IA con los sistemas de calidad,
                                        fortaleciendo la gobernanza, la ética y la sostenibilidad institucional.
                                    </p>
                                </div>
                                <div className="column-item">
                                    <p className="intro-text-compliance-refined">
                                        Se fundamenta en los principios internacionales de la <strong>UNESCO, la OCDE y la Unión Europea</strong>,
                                        traduciendo lineamientos globales en un modelo operativo real.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid-features-animated">
                        <div className="feature-card-premium">
                            <div className="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="feature-card-content">
                                <h3>Cambio acelerado</h3>
                                <p>La IA transforma la educación más rápido de lo que las instituciones pueden responder.</p>
                            </div>
                            <div className="card-corner-accent"></div>
                        </div>

                        <div className="feature-card-premium">
                            <div className="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="feature-card-content">
                                <h3>Uso fragmentado</h3>
                                <p>Decisiones dispersas sin lineamientos claros ni estrategia institucional.</p>
                            </div>
                            <div className="card-corner-accent"></div>
                        </div>

                        <div className="feature-card-premium">
                            <div className="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110-8 4 4 0 010 8zm14 14v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="feature-card-content">
                                <h3>Incertidumbre docente</h3>
                                <p>Profesores y directivos sienten presión sin orientación clara.</p>
                            </div>
                            <div className="card-corner-accent"></div>
                        </div>

                        <div className="feature-card-premium">
                            <div className="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="feature-card-content">
                                <h3>Riesgos crecientes</h3>
                                <p>Amenazas éticas, pedagógicas y legales sin protocolos definidos.</p>
                            </div>
                            <div className="card-corner-accent"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="atlas-diff-section">
                <div className="diff-background-overlay"></div>
                <div className="container diff-container">
                    <div className="diff-flex-layout">
                        <div className="diff-text-content">
                            <span className="diff-tag">Propósito</span>
                            <h2 className="diff-main-title">COMPASS surge para aportar coherencia, responsabilidad y propósito</h2>
                            <div className="diff-accent-line"></div>
                            <p className="diff-description">
                                COMPASS no es una plataforma tecnológica, es un modelo de gobernanza institucional diseñado para asegurar que la adopción de la IA responda a criterios pedagógicos, éticos y estratégicos consistentes con estándares internacionales.</p>
                        </div>
                        <div className="diff-highlight-card">
                            <div className="diff-card-inner">
                                <h3>¿Qué hace diferente a COMPASS?</h3>
                                <p className="diff-card-subtitle">De lo reactivo a lo estratégico</p>
                                <p className="diff-card-text">Pasamos de la improvisación a una estrategia institucional clara y compartida fundamentada en los lineamientos internacionales que han establecido principios claros en materia de:</p>
                                <div className="diff-pills-container">
                                    <div className="diff-pill">Etica <span>↔</span> Responsabilidad</div>
                                    <div className="diff-pill">Transparencia <span>↔</span> Explicabilidad</div>
                                    <div className="diff-pill">Protección de datos <span>↔</span> Rendición de cuentas</div>
                                    <div className="diff-pill">Sostenibilidad <span>↔</span> Supervisión humana</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="diff-pillars-grid">
                        {[
                            { t: "Marco estratégico", d: "Proceso de transformación institucional." },
                            { t: "Centrado en personas", d: "Empodera y acompaña a los docentes." },
                            { t: "Visión institucional", d: "Decisiones colectivas estratégicas." },
                            { t: "Base pedagógica", d: "Fundamentado en ética y gobernanza." },
                            { t: "Contextual", d: "Diseñado para realidades diversas." },
                            { t: "Calidad", d: "Alineación con procesos de acreditación." }
                        ].map((pillar, idx) => (
                            <div className="diff-pillar-card" key={idx}>
                                <h4>{pillar.t}</h4>
                                <p>{pillar.d}</p>
                                <div className="pillar-hover-line"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="stk-wrapper-section" id="que-es">
                <div className="stk-main-grid">
                    <aside className="stk-left-column">
                        <div className="stk-sticky-box">
                            <span className="stk-tag">El Modelo</span>
                            <h2 className="stk-title">Un marco estructurado y adaptable</h2>
                            <div className="stk-gold-line"></div>
                            <p className="stk-text-main">
                                El marco COMPASS de IA responsable se basa en el modelo ATLAS. Este se organiza en cinco fases interdependientes que conforman un ciclo continuo de madurez institucional.
                            </p>
                            <div className="stk-badge-info">
                                Estas fases no constituyen servicios independientes, sino dimensiones articuladas de un mismo sistema de gobernanza.
                            </div>
                        </div>
                    </aside>
                    <div className="stk-right-scroll-area">
                        {[
                            { l: 'A', t: 'Auditar', d: 'Evaluación estructurada del estado actual, prácticas existentes y riesgos asociados al uso de la IA, en coherencia con estándares internacionales.' },
                            { l: 'T', t: 'Transformar', d: 'Rediseño intencional de prácticas pedagógicas y procesos académicos para integrar la IA de manera alineada con el proyecto educativo institucional.' },
                            { l: 'L', t: 'Liderar', d: 'Fortalecimiento del liderazgo académico y definición de responsabilidades institucionales para la toma de decisiones informadas y éticamente fundamentadas.' },
                            { l: 'A', t: 'Asegurar', d: 'Establecimiento de criterios, estándares y mecanismos de evaluación que permitan verificar impacto, calidad y cumplimiento de principios éticos.' },
                            { l: 'S', t: 'Sostener', d: 'Integración del modelo como práctica institucional permanente mediante monitoreo, evidencia y mejora continua.' }
                        ].map((step, i) => (
                            <div className="stk-step-card" key={i}>
                                <div className="stk-letter-box">
                                    <span className="stk-letter-ghost">{step.l}</span>
                                    <span className="stk-step-num">0{i + 1}</span>
                                </div>
                                <div className="stk-card-body">
                                    <h3>{step.t}</h3>
                                    <p>{step.d}</p>
                                </div>
                                {i < 4 && <div className="stk-vertical-line"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="atlas-audience-section" id="quienes">
                <div className="container">
                    <div className="audience-wrapper">
                        <div className="audience-header">
                            <span className="diff-tag">Perfiles</span>
                            <h2 className="audience-main-title">Diseñado para comunidades educativas</h2>
                            <div className="audience-tags-cloud">
                                <span className="tag-item">Directivos Escolares</span>
                                <span className="tag-item">Rectores Universitarios</span>
                                <span className="tag-item">Equipos de Calidad</span>
                                <span className="tag-item">Consultores</span>
                                <span className="tag-item">Docentes Innovadores</span>
                            </div>
                        </div>
                        <div className="audience-grid-layout">
                            <div className="audience-card">
                                <div className="audience-icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="audience-info">
                                    <h4>Instituciones que inician</h4>
                                    <p>Colegios y universidades dando sus primeros pasos con IA y buscando orientación clara.</p>
                                </div>
                            </div>
                            <div className="audience-card">
                                <div className="audience-icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="audience-info">
                                    <h4>Centros Educativos escalando</h4>
                                    <p>Instituciones que buscan escalar prácticas responsables a nivel organizacional con estándares globales.</p>
                                </div>
                            </div>
                            <div className="audience-card">
                                <div className="audience-icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="audience-info">
                                    <h4>Equipos de innovación</h4>
                                    <p>Equipos que necesitan orden, visión estratégica y gobernanza para sus iniciativas tecnológicas con IA.</p>
                                </div>
                            </div>
                            <div className="audience-card">
                                <div className="audience-icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="audience-info">
                                    <h4>Educadores estratégicos</h4>
                                    <p>Directivos y docentes que prefieren la estrategia antes que las herramientas, y la visión antes que las tendencias.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="atlas-routes-section" id="rutas">
                <div className="container">
                    <div className="routes-header">
                        <span className="diff-tag">Instrumentos Operativos</span>
                        <h2 className="routes-main-title">Rutas de navegación institucional</h2>
                        <div className="routes-intro-box">
                            <p>
                                Las rutas no son cursos independientes, sino <strong>recorridos estructurados</strong> que permiten
                                implementar el modelo ATLAS según el rol institucional.
                            </p>
                        </div>
                    </div>
                    <div className="routes-grid">
                        <div className="route-card">
                            <div className="route-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                </svg>
                            </div>
                            <h3>Ruta Docente</h3>
                            <p>Orientada a la integración pedagógica de la IA con criterios institucionales claros y aplicables al aula.</p>
                            <div className="route-footer-line"></div>
                        </div>
                        <div className="route-card">
                            <div className="route-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3>Ruta Directiva</h3>
                            <p>Orientada a liderazgo, gobernanza, toma de decisiones estratégica y diseño de políticas internas.</p>
                            <div className="route-footer-line"></div>
                        </div>
                    </div>
                    <div className="maturity-levels-footer">
                        <div className="maturity-info">
                            <h4>Niveles progresivos de madurez en IA</h4>
                            <div className="levels-pills">
                                <span>Foundation</span>
                                <span className="arrow-sep">→</span>
                                <span>Pro</span>
                                <span className="arrow-sep">→</span>
                                <span>Advanced</span>
                            </div>
                        </div>
                        <p className="maturity-disclaimer">
                            El avance se fundamenta en <strong>evidencia verificable</strong> y cumplimiento de criterios,
                            no en la simple asistencia a sesiones formativas.
                        </p>
                    </div>
                </div>
            </section>

            <section className="atlas-cert-section" id="certificacion">
                <div className="container">
                    <div className="cert-grid-layout">
                        <div className="cert-intro">
                            <span className="diff-tag">Certificaciones para:</span>
                            <h2 className="cert-title">Docentes, directivos e instituciones</h2>
                            <p className="cert-lead">Reconocemos el nivel de madurez alcanzado en la adopción responsable de la IA bajo estándares institucionales.</p>
                            <div className="cert-badge-note">
                                <strong>Nota:</strong> Evalúa procesos evidenciables, no herramientas de IA.
                            </div>
                        </div>
                        <div className="cert-cards-container">
                            {[
                                { lvl: '1', name: 'Foundation', desc: 'Bases para la adopción responsable.', points: ['Diagnóstico inicial', 'Sensibilización', 'Plan de acción institucional'] },
                                { lvl: '2', name: 'Pro', desc: 'Integración en procesos académicos.', points: ['Enfoque pedagógico', 'Gobernanza IA', 'Principios éticos'] },
                                { lvl: '3', name: 'Advanced', desc: 'Consolidación y sostenibilidad.', points: ['Planeación estratégica', 'Mejora continua', 'Gestión de riesgos'] }
                            ].map((cert, i) => (
                                <div className={`cert-card-tier tier-${cert.lvl}`} key={i}>
                                    <div className="cert-tier-header">
                                        <span className="lvl-tag">Nivel {cert.lvl}</span>
                                        <h3>{cert.name}</h3>
                                    </div>
                                    <p className="cert-tier-desc">{cert.desc}</p>
                                    <ul className="cert-points-list">
                                        {cert.points.map((point, j) => (
                                            <li key={j}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="cert-tier-footer">COMPASS Certified</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="atlas-faq-section">
                <div className="container narrow-container">
                    <div className="faq-header">
                        <span className="diff-tag">Soporte</span>
                        <h2 className="faq-title">Resolviendo tus dudas sobre COMPASS</h2>
                        <div className="faq-accent-line"></div>
                    </div>
                    <div className="faq-accordion-group">
                        {faqData.map((item, index) => (
                            <div
                                className={`faq-item-premium ${activeFaq === index ? 'faq-open' : ''}`}
                                key={index}
                            >
                                <button
                                    className="faq-trigger"
                                    onClick={() => toggleFaq(index)}
                                    aria-expanded={activeFaq === index}
                                >
                                    <span className="faq-question-text">{item.q}</span>
                                    <div className="faq-icon-status">
                                        <span className="line-h"></span>
                                        <span className={`line-v ${activeFaq === index ? 'rotated' : ''}`}></span>
                                    </div>
                                </button>
                                <div className="faq-response-wrapper">
                                    <div className="faq-response-content">
                                        <p>{item.a}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="faq-footer-help">
                        <p>¿Tienes más preguntas? <a href="mailto:atlasframework.ai@gmail.com">Contáctanos directamente</a></p>
                    </div>
                </div>
            </section>

            <section className="atlas-contact-section">
                <div className="contact-bg-decoration"></div>
                <div className="container">
                    <div className="contact-flex-layout">
                        <div className="contact-text-panel">
                            <span className="diff-tag">Contacto</span>
                            <h2 className="contact-main-title">Comienza tu camino en COMPASS</h2>
                            <p className="contact-subtitle">
                                Tanto si das tus primeros pasos como si buscas ordenar prácticas existentes,
                                nuestro equipo te ayudará a avanzar con visión de largo plazo.
                            </p>
                            <div className="contact-cards-info">
                                <div className="contact-mini-card">
                                    <div className="mini-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span>Escríbenos</span>
                                        <p>atlasframework.ai@gmail.com</p>
                                    </div>
                                </div>
                                <div className="contact-mini-card">
                                    <div className="mini-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="2" y1="12" x2="22" y2="12" />
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span>Enfoque</span>
                                        <p>Estrategia institucional global</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="contact-form-container">
                            <form className="atlas-premium-form">
                                <div className="form-row">
                                    <div className="input-group">
                                        <input type="text" placeholder="Nombre completo" required />
                                    </div>
                                    <div className="input-group">
                                        <input type="email" placeholder="Email corporativo" required />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <input type="text" placeholder="Institución Educativa" required />
                                </div>
                                <div className="input-group">
                                    <textarea placeholder="¿En qué fase de adopción de IA se encuentran?" rows="4"></textarea>
                                </div>
                                <button type="submit" className="btn-form-submit">
                                    Solicitar Consultoría Inicial
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
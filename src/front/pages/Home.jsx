import React, { useState, useEffect } from "react";
import "../Styles/home.css";
import { useNavigate } from "react-router-dom";
import { ModalPoliticas } from "./ModalPoliticas";
import { CORREO_DATOS } from "./politicas";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export const Home = ({ onLoginSuccess }) => {
    const [view, setView] = useState("landing");
    const [credentials, setCredentials] = useState({ user_key: '', pass: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeFaq, setActiveFaq] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [verPoliticas, setVerPoliticas] = useState(false);
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
        { q: "¿COMPASS es una plataforma o software?", a: "COMPASS es un sistema de gobernanza para la inteligencia artificial responsable en educación. La plataforma digital es uno de sus componentes, pero su propósito principal es ayudar a las instituciones a implementar, medir y sostener prácticas responsables de IA mediante el modelo ATLAS." },
        { q: "¿En qué se diferencia COMPASS de los marcos internacionales como UNESCO, OCDE o el AI Act?", a: "Los marcos internacionales establecen principios, recomendaciones y orientaciones sobre el uso responsable de la IA. COMPASS ayuda a las instituciones a convertir esas orientaciones en procesos, capacidades, evidencias y acciones concretas mediante el modelo ATLAS." },
        { q: "¿Se puede adaptar a mi institución?", a: "Sí. COMPASS ha sido diseñado para adaptarse a distintos contextos educativos, niveles de enseñanza y grados de madurez institucional. El sistema permite construir una ruta de implementación alineada con las necesidades, capacidades y objetivos de cada institución." },
        { q: "¿Necesitamos expertos en IA para implementarlo?", a: "No. COMPASS está diseñado para acompañar a instituciones que se encuentran en diferentes etapas de adopción. Su enfoque se centra en desarrollar capacidades institucionales progresivamente, sin requerir conocimientos técnicos avanzados en inteligencia artificial." },
        { q: "¿Reemplaza políticas o lineamientos existentes?", a: "No. COMPASS complementa y fortalece las políticas, procesos y sistemas de calidad ya existentes. Su función es ayudar a traducir principios y orientaciones sobre IA en prácticas institucionales coherentes y sostenibles." },
        { q: "¿Cuánto dura un proceso COMPASS?", a: "La duración depende del contexto y de los objetivos institucionales. A través del modelo ATLAS, las instituciones avanzan progresivamente por fases de diagnóstico, transformación, liderazgo, aseguramiento y sostenibilidad, construyendo capacidades a su propio ritmo." },
        { q: "¿COMPASS evalúa únicamente a los docentes?", a: "No. COMPASS integra una ruta docente y una ruta directiva para obtener una visión completa de la madurez institucional. Esto permite conectar las decisiones de gobernanza con las prácticas reales de enseñanza y aprendizaje." },
        { q: "¿Por qué es importante evaluar tanto a docentes como a directivos?", a: "La gobernanza efectiva de la IA requiere una responsabilidad compartida. Mientras los directivos definen criterios, políticas y mecanismos de supervisión, los docentes materializan esas decisiones en la práctica educativa. COMPASS permite comprender ambas perspectivas para fortalecer la capacidad institucional de manera integral." },
        { q: "¿COMPASS apoya los procesos de acreditación y calidad institucional?", a: "Sí. COMPASS genera evidencia, documentación y mecanismos de seguimiento que pueden contribuir a procesos de calidad, mejora continua, transformación digital, innovación educativa y fortalecimiento institucional." }
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
                        <a href="#que-es">Modelo ATLAS</a>
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
                    <p className="hero-overline">Alineado con los principales marcos internacionales de IA en educación</p>
                    <img src={"./logover.png"} alt="COMPASS Logo" className="hero-logo" />
                    <p className="hero-system-name">
                        Sistema de Gobernanza para la Inteligencia Artificial Responsable en Educación
                    </p>
                    <div className="hero-description-block">
                        <p className="hero-subtitle">
                            COMPASS ayuda a las instituciones educativas a traducir principios, recomendaciones y estándares internacionales sobre inteligencia artificial en acciones concretas, medibles y sostenibles.
                        </p>
                        <p className="hero-tagline">
                            A través del modelo ATLAS, las instituciones pueden diagnosticar, implementar, fortalecer y asegurar prácticas responsables de IA alineadas con sus objetivos pedagógicos, éticos y estratégicos.
                        </p>
                        <p className="hero-secondary">
                            De la orientación internacional a la práctica institucional.<br />
                            De la adopción de herramientas a la gobernanza basada en evidencia.
                        </p>
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
                        <h2 className="section-title-large">La educación necesita transformar principios en capacidad institucional</h2>
                        <div className="section-intro-group">
                            <div className="intro-full-width">
                                <p>La inteligencia artificial avanza más rápido que la capacidad de muchas instituciones para integrarla de forma coherente, segura y alineada con sus objetivos educativos.</p>
                                <p>Los principales marcos internacionales ofrecen principios y orientaciones valiosas. Sin embargo, las instituciones necesitan sistemas que les permitan convertir esas orientaciones en decisiones, procesos, evidencias y capacidades sostenibles.</p>
                                <p><strong>COMPASS responde a ese desafío.</strong></p>
                            </div>
                            <div className="intro-columns-equidistant">
                                <div className="column-item">
                                    <h4 className="intro-col-title">De la orientación a la acción</h4>
                                    <p>COMPASS traduce referentes internacionales como la <strong>UNESCO, la OCDE y la Unión Europea</strong> en un sistema práctico de gobernanza para instituciones educativas.</p>
                                </div>
                                <div className="column-item">
                                    <h4 className="intro-col-title">Implementación basada en evidencia</h4>
                                    <p className="intro-text-compliance-refined">A través del modelo ATLAS, las instituciones pueden diagnosticar su situación actual, fortalecer capacidades, gestionar riesgos y construir una estrategia sostenible para la adopción responsable de la IA.</p>
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
                                <h3>Capacidad institucional</h3>
                                <p>Las instituciones necesitan desarrollar capacidades para integrar la IA de forma pedagógica, ética y sostenible.</p>
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
                                <h3>Gobernanza basada en evidencia</h3>
                                <p>Las decisiones sobre IA requieren criterios claros, responsabilidades definidas y mecanismos de seguimiento.</p>
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
                                <h3>Supervisión humana</h3>
                                <p>La IA debe fortalecer el juicio profesional, no reemplazar la responsabilidad de docentes y directivos.</p>
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
                                <h3>Gestión de riesgos</h3>
                                <p>La innovación requiere mecanismos para abordar riesgos relacionados con datos, sesgos, transparencia y uso responsable.</p>
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
                            <h2 className="diff-main-title">COMPASS surge para transformar principios en capacidad institucional</h2>
                            <div className="diff-accent-line"></div>
                            <p className="diff-description">
                                COMPASS es un sistema de gobernanza para la inteligencia artificial responsable en educación. Ayuda a las instituciones a convertir orientaciones internacionales en decisiones, procesos, evidencias y capacidades sostenibles.
                            </p>
                            <p className="diff-description">
                                A través del modelo ATLAS, las instituciones pueden diagnosticar, implementar, fortalecer y asegurar prácticas de IA alineadas con objetivos pedagógicos, éticos y estratégicos.
                            </p>
                        </div>
                        <div className="diff-highlight-card">
                            <div className="diff-card-inner">
                                <h3>¿Qué hace diferente a COMPASS?</h3>
                                <p className="diff-card-subtitle">De los principios a la implementación</p>
                                <p className="diff-card-text">Los marcos internacionales ofrecen orientación sobre cómo debería utilizarse la inteligencia artificial. COMPASS ayuda a las instituciones a llevar esos principios a la práctica mediante procesos, herramientas y evidencia institucional.</p>
                                <p className="diff-card-text"><strong>Fundamentado en referentes internacionales como:</strong></p>
                                <div className="diff-pills-container">
                                    <div className="diff-pill">Ética <span>↔</span> Responsabilidad</div>
                                    <div className="diff-pill">Transparencia <span>↔</span> Explicabilidad</div>
                                    <div className="diff-pill">Protección de datos <span>↔</span> Rendición de cuentas</div>
                                    <div className="diff-pill">Equidad <span>↔</span> Supervisión humana</div>
                                    <div className="diff-pill">Gestión de riesgos <span>↔</span> Mejora continua</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="diff-pillars-grid">
                        {[
                            { t: "Diagnóstico", d: "Identifica el nivel de madurez institucional y docente frente al uso responsable de la IA." },
                            { t: "Gobernanza", d: "Fortalece políticas, roles, responsabilidades y mecanismos de supervisión." },
                            { t: "Desarrollo de capacidades", d: "Impulsa el crecimiento progresivo de docentes y líderes educativos." },
                            { t: "Gestión de riesgos", d: "Integra criterios para abordar riesgos éticos, pedagógicos y relacionados con datos." },
                            { t: "Evidencia", d: "Genera información para la toma de decisiones basada en datos y mejora continua." },
                            { t: "Sostenibilidad", d: "Construye capacidades institucionales que trascienden proyectos o herramientas específicas." }
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
                            <span className="stk-tag">El modelo ATLAS</span>
                            <h2 className="stk-title">El motor de implementación de COMPASS</h2>
                            <div className="stk-gold-line"></div>
                            <p className="stk-text-main">
                                ATLAS es el modelo operativo que guía la implementación de COMPASS dentro de las instituciones educativas. Organiza el proceso de adopción, gobernanza, aseguramiento y mejora continua de la inteligencia artificial mediante cinco fases progresivas e interconectadas.
                            </p>
                            <div className="stk-badge-info">
                                Cada fase genera evidencia, capacidades y decisiones que fortalecen progresivamente la gobernanza institucional de la IA.
                            </div>
                        </div>
                    </aside>
                    <div className="stk-right-scroll-area">
                        {[
                            { l: 'A', t: 'Auditar', d: 'Comprender la realidad institucional mediante diagnósticos, evidencia y análisis de madurez.' },
                            { l: 'T', t: 'Transformar', d: 'Convertir los hallazgos en capacidades, prácticas y acciones de mejora alineadas con los objetivos educativos.' },
                            { l: 'L', t: 'Liderar', d: 'Fortalecer el liderazgo institucional para orientar decisiones responsables sobre el uso de la IA.' },
                            { l: 'A', t: 'Asegurar', d: 'Establecer mecanismos de supervisión, gestión de riesgos y aseguramiento de calidad.' },
                            { l: 'S', t: 'Sostener', d: 'Consolidar capacidades institucionales mediante seguimiento, evidencia y mejora continua.' }
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

            <section className="atlas-cert-section" id="certificacion">
                <div className="container">
                    <div className="cert-grid-layout">
                        <div className="cert-intro">
                            <span className="diff-tag">Certificación</span>
                            <h2 className="cert-title">Credencial verificable en LinkedIn</h2>
                            <p className="cert-lead">
                                Cada certificación incluye un ID único y un enlace público de verificación. Puedes agregarla a tu perfil de LinkedIn en un clic, en la sección "Licencias y certificaciones".
                            </p>
                            <div className="cert-linkedin-note">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="cert-linkedin-icon" aria-hidden="true">
                                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                                </svg>
                                <div>
                                    <strong>Verificación pública</strong>
                                    <p>Cualquier institución o reclutador puede confirmar la validez de la credencial con su ID, sin necesidad de registrarse.</p>
                                </div>
                            </div>
                        </div>
                        <div className="cert-cards-container">
                            {[
                                {
                                    paso: '1',
                                    name: 'Completa tu proceso',
                                    desc: 'Avanza por las fases del modelo ATLAS documentando tu evidencia.',
                                    points: ['Evidencia en las cinco fases', 'Seguimiento en la plataforma']
                                },
                                {
                                    paso: '2',
                                    name: 'Recibe tu credencial',
                                    desc: 'Se emite automáticamente al completar el proceso.',
                                    points: ['ID único', 'Enlace público de verificación']
                                },
                                {
                                    paso: '3',
                                    name: 'Compártela',
                                    desc: 'Agrégala a tu perfil profesional en un clic.',
                                    points: ['Directo a LinkedIn', 'Licencias y certificaciones']
                                }
                            ].map((item, i) => (
                                <div className={`cert-card-tier tier-${item.paso}`} key={i}>
                                    <div className="cert-tier-header">
                                        <span className="lvl-tag">Paso {item.paso}</span>
                                        <h3>{item.name}</h3>
                                    </div>
                                    <p className="cert-tier-desc">{item.desc}</p>
                                    <ul className="cert-points-list">
                                        {item.points.map((point, j) => (
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
                                <label className="contact-consent">
                                    <input type="checkbox" required />
                                    <span>
                                        He leído y acepto la{" "}
                                        <button type="button" className="link-inline" onClick={() => setVerPoliticas(true)}>
                                            Política de Privacidad
                                        </button>{" "}
                                        y autorizo el tratamiento de mis datos personales para los fines descritos.
                                    </span>
                                </label>
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

            <footer className="atlas-legal-footer">
                <div className="container legal-footer-inner">
                    <p>
                        © {new Date().getFullYear()} COMPASS IA Responsable ·{" "}
                        <a href="https://www.compassgovernance.org/" target="_blank" rel="noreferrer">compassgovernance.org</a>
                    </p>
                    <div className="legal-links">
                        <button type="button" onClick={() => setVerPoliticas(true)}>Privacidad y tratamiento de datos</button>
                        <a href={`mailto:${CORREO_DATOS}?subject=${encodeURIComponent("Solicitud de eliminación de datos")}`}>
                            Solicitar eliminación de datos
                        </a>
                    </div>
                </div>
            </footer>

            <ModalPoliticas abierta={verPoliticas} onClose={() => setVerPoliticas(false)} />
        </div>
    );
};
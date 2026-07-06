import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GestionEmpresasUsuarios } from "./GestionEmpresasUsuarios";
import { CreadorRetos } from "./CreadorRetos";
import { AsignacionRetos } from "./AsignacionRetos";
import { FaseAuditar } from "./FaseAuditar";
import { ResponderFormularios } from "./ResponderFormularios";
import { EjecutarReto } from "./EjecutarReto"; // <-- Nueva página para la ejecución de retos
import { FaseTransformar } from "./FaseTransformar"; // <-- Nueva página para responder instrumentos

import FaseLiderar from "./FaseLiderar";
import RetosLiderar from "./RetosLiderar";
import AnalisisLiderazgo from "./AnalisisLiderazgo";

import FaseAsegurar from "./FaseAsegurar";
import TallerMejoraAsegurar from "./TallerMejoraAsegurar";
import ModuloDirectivoEstrategico from "./ModuloDirectivoEstrategico";

import FaseSostener from "./FaseSostener";
import ModuloSostener from "./ModuloSostener";
import ModuloSostenerDirectivo from "./ModuloSostenerDirectivo";

import "../Styles/dashboard.css";

// ─── URL del backend ──────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// ─── Helper: llama a la API con el token JWT guardado ────────────────────────
const apiFetch = async (path, options = {}) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("Detalle del error del backend:", errBody);
        throw new Error(errBody.error || errBody.message || `Error ${res.status}`);
    }
    return res.json();
};

export const Dashboard = ({ onLogout }) => {
    const navigate = useNavigate();

    // ── Estado principal ──────────────────────────────────────────────────────
    const [userData, setUserData] = useState(null);   // usuario del localStorage
    const [huella, setHuella] = useState(null);   // GET /api/huella
    const [isCompassInfoExpanded, setIsCompassInfoExpanded] = useState(false);
    const [infoSeccion, setInfoSeccion] = useState('evalua');
    const [showImprovement, setShowImprovement] = useState(false);
    const [historial, setHistorial] = useState([]);     // GET /api/huella/historial
    const [fases, setFases] = useState([]);     // GET /api/mi-empresa/fases
    const [misRetos, setMisRetos] = useState([]);     // GET /api/mis-retos
    const [misFormularios, setMisFormularios] = useState([]); // GET /api/formularios
    const [notificaciones, setNotificaciones] = useState([]); // GET /api/mis-notificaciones

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState("consola");
    const [faseRespondiendo, setFaseRespondiendo] = useState("AUDITAR");
    const [retoEjecutando, setRetoEjecutando] = useState(null);
    const [retoLiderarId, setRetoLiderarId] = useState(null);

    const [fasesEstado, setFasesEstado] = useState([]);

    const [modoResponder, setModoResponder] = useState(null); // 'auditar2' | null

    const handleNavigateFase = (tab, fase) => {
        if (fase) setFaseRespondiendo(fase);
        switchTab(tab);
    };

    const handleNavigateTransformar = (tab, retoId) => {
        if (retoId) setRetoEjecutando(retoId);
        switchTab(tab);
    };

    const handleNavigateLiderar = (tab, id) => {
        if (id) setRetoLiderarId(id);
        switchTab(tab);
    };

    const handleNavigateAsegurar = (tab) => {
        switchTab(tab);
    };

    const handleNavigateSostener = (tab, id) => {
        if (tab === "responder_auditar2") {
            setModoResponder("auditar2");
            switchTab("responder_fase");   // reusa el tab de ResponderFormularios
            return;
        }
        if (tab === "modulo_sostener") setModoResponder(null); // reset al volver
        switchTab(tab);
    };

    // ── Carga inicial ─────────────────────────────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem("userATLAS");
        const token = localStorage.getItem("token");

        if (!saved || !token) {
            navigate("/");
            return;
        }

        const user = JSON.parse(saved);
        setUserData(user);
        loadDashboardData(user);
    }, [navigate]);

    const loadDashboardData = async (user) => {
        setIsLoading(true);
        setError(null);
        try {
            // Lanzamos todo en paralelo — solo fallamos lo que necesitamos
            const [huellaData, histData] = await Promise.all([
                apiFetch("/api/huella").catch(() => null),
                apiFetch("/api/huella/historial").catch(() => []),
            ]);

            setHuella(huellaData);
            setHistorial(Array.isArray(histData) ? histData : []);

            // Fases y retos solo si tiene empresa asignada
            if (user.empresa_id) {
                const [fasesData, retosData, formsData, fasesEstadoData] = await Promise.all([
                    apiFetch("/api/mi-empresa/fases").catch(() => []),
                    apiFetch("/api/mis-retos").catch(() => []),
                    apiFetch("/api/formularios").catch(() => []),
                    apiFetch("/api/mi-empresa/fases-estado").catch(() => []),
                ]);
                setFases(Array.isArray(fasesData) ? fasesData : []);
                setMisRetos(Array.isArray(retosData) ? retosData : []);
                setMisFormularios(Array.isArray(formsData) ? formsData : []);
                setFasesEstado(Array.isArray(fasesEstadoData) ? fasesEstadoData : []);
            }
            // Notificaciones solo para docentes
            if (user.rol === "DOCENTE") {
                const notifData = await apiFetch("/api/mis-notificaciones").catch(() => []);
                setNotificaciones(Array.isArray(notifData) ? notifData : []);
            }

        } catch (e) {
            console.error("Error cargando dashboard:", e);
            setError("Error al cargar los datos. Verifica tu sesión.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userATLAS");
        if (onLogout) onLogout();
        navigate("/", { replace: true });
    };

    // ── Toggle menú ───────────────────────────────────────────────────────────
    const toggleMenu = (name) => setOpenMenu(prev => prev === name ? null : name);
    const switchTab = (tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); };

    // ── Helpers de UI ─────────────────────────────────────────────────────────
    const getCompassLevel = (pct) => {
        if (pct >= 90) return { label: "Capacidad ATLAS demostrada", color: "#c5a059" };
        if (pct >= 75) return { label: "Práctica alineada", color: "#3b82f6" };
        if (pct >= 60) return { label: "Práctica consciente", color: "#10b981" };
        if (pct >= 40) return { label: "Uso emergente", color: "#f59e0b" };
        return { label: "Exploración inicial", color: "#94a3b8" };
    };

    // Índice de nivel según porcentaje (0=Exploración ... 4=Certificación)
    const getCompassIndex = (pct) => {
        if (pct >= 90) return 4;
        if (pct >= 75) return 3;
        if (pct >= 60) return 2;
        if (pct >= 40) return 1;
        return 0;
    };

    const getCompassData = (pct) => {
        const info = [
            {
                range: "0–39%",
                title: "Exploración inicial",
                subtitle: "Nivel actual basado en evidencia documentada en la plataforma.",
                body: `Tu COMPASS de IA muestra el nivel de evidencia que has documentado sobre el uso pedagógico de la inteligencia artificial. Actualmente estás en una etapa inicial de exploración, lo que indica que aún no has registrado suficiente evidencia sobre cómo la integras o regulas en el aula. ATLAS no mide entusiasmo ni formación, sino decisiones pedagógicas demostradas. A medida que documentes diagnósticos, planeaciones o reflexiones, tu nivel avanzará.`,
                footer: "El objetivo no es usar más IA. Es usarla con criterio, ética y coherencia pedagógica. ATLAS está aquí para acompañarte paso a paso.",
                howToImprove: [
                    "Completa tu diagnóstico inicial + declara tu postura y criterios de uso responsable de IA. (AUDITAR).",
                    "Realiza retos pedagógicos (TRANSFORMAR).",
                    "Diseña experiencia de aprendizaje con IA responsable (ASEGURAR).",
                    "Comparte evidencias pedagógicas reales (SOSTENER)."
                ],
                extraNote: "Tu compass está alineado con marcos internacionales de uso responsable de IA en educación y evalúa evidencia en las cinco fases del Marco ATLAS."
            },
            {
                range: "40–59%",
                title: "Uso emergente",
                subtitle: "Nivel basado en evidencia pedagógica documentada.",
                body: `Tu COMPASS de IA indica que has comenzado a integrar la inteligencia artificial en tu práctica de manera más consciente. 
            Ya no se trata solo de exploración: has documentado decisiones pedagógicas, planeaciones o evidencias donde la IA cumple un propósito educativo claro. Esto muestra criterio en construcción. 
            En esta etapa, el desafío no es usar más herramientas, sino profundizar en la coherencia pedagógica.`,
                footer: "Tu práctica muestra intención. Ahora el siguiente paso es consolidar consistencia.",
                howToImprove: [
                    "Fortalece la evidencia en evaluación y retroalimentación (ASEGURAR).",
                    "Documenta explícitamente tus criterios éticos y pedagógicos de uso de IA.",
                    "Asegura que tus decisiones estén alineadas con marcos de referencia institucionales.",
                    "Reflexiona sobre riesgos, sesgos y supervisión humana en tus actividades."
                ],
                extraNote: "Estás pasando de un uso ocasional a una práctica con criterio. La madurez no está en la frecuencia de uso, sino en la claridad de tus decisiones."
            },
            {
                range: "60–74%",
                title: "Práctica consciente",
                subtitle: "Nivel basado en evidencia pedagógica validada en el Marco ATLAS.",
                body: `Tu COMPASS de IA muestra que has desarrollado una práctica intencional y documentada en el uso pedagógico de la inteligencia artificial. 
            La IA en tu aula ya no es intuitiva ni ocasional. Has demostrado planeaciones con propósito, criterios explícitos y evidencias de evaluación mediadas con supervisión docente. 
            En esta etapa, la clave es coherencia y profundidad.`,
                footer: "Tu práctica es consistente. El siguiente paso es integrarla de manera transversal y sostenible.",
                howToImprove: [
                    "Asegura evidencia en las cinco fases ATLAS (incluyendo LIDERAR y SOSTENER).",
                    "Documenta cómo tus decisiones se alínean con marcos y lineamientos institucionales.",
                    "Incorpora análisis de riesgos o sesgos cuando la IA interviene en evaluación.",
                    "Demuestra impacto observable en el aprendizaje."
                ],
                extraNote: "Has pasado de experimentar con IA a gobernarla en tu práctica. Ahora el reto es consolidar coherencia sistémica y liderazgo pedagógico."
            },
            {
                range: "75–89%",
                title: "Práctica alineada",
                subtitle: "Nivel avanzado de coherencia pedagógica en el uso de IA.",
                body: `Tu COMPASS de IA indica que has alcanzado un nivel de práctica alineada y consistente. 
            La integración de la inteligencia artificial en tu aula demuestra coherencia entre objetivos, actividades y evaluación bajo supervisión humana explícita. 
            En esta etapa, tu práctica no solo es consciente, sino estructurada. La IA actúa como herramienta mediada por criterio profesional.`,
                footer: "El siguiente paso es integrar de manera transversal las cinco fases ATLAS y consolidar evidencia sólida.",
                howToImprove: [
                    "Evidencia validada en las cinco fases ATLAS.",
                    "Documentación consistente de impacto en aprendizaje.",
                    "Integración de criterios éticos y de privacidad en tus decisiones.",
                    "Claridad institucional o de liderazgo frente al uso de IA."
                ],
                extraNote: "Tu práctica muestra madurez profesional frente a la IA. El reto ahora no es hacer más, sino demostrar consistencia y profundidad."
            },
            {
                range: "90–100%",
                title: "Capacidad ATLAS demostrada",
                subtitle: "Elegible para proceso de certificación ATLAS.",
                body: `Tu COMPASS de IA indica que has alcanzado un nivel de integración pedagógica avanzada y coherente. 
            Has demostrado evidencia sólida en las cinco fases: AUDITAR, TRANSFORMAR, LEDERAR, ASEGURAR y SOSTENER. 
            La inteligencia artificial en tu práctica está mediada por criterio profesional, alineada con estándares de calidad y documentada.`,
                /*
footer: "Eres elegible para solicitar la Auditoría ATLAS en aula, un proceso de validación de coherencia e impacto.",
*/
                howToImprove: [
                    "Evidencia transversal en las cinco fases.",
                    "Coherencia entre práctica declarada y práctica observada.",
                    "Supervisión humana efectiva.",
                    "Impacto pedagógico verificable."
                ],
                extraNote: "La certificación ATLAS reconoce competencia profesional demostrada, no trayectoria recorrida."
            }
        ];;
        return info[getCompassIndex(pct)] || info[0];
    };


    const getFaseIcon = (fase) => {
        const m = { AUDITAR: "🔍", TRANSFORMAR: "⚡", LIDERAR: "🧭", ASEGURAR: "🛡️", SOSTENER: "🌱" };
        return m[fase] || "📋";
    };

    // ── Pantallas de carga / error ────────────────────────────────────────────
    if (!userData) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "16px" }}>
                <div className="atlas-loader"></div>
                <p>Sincronizando credenciales...</p>
            </div>
        );
    }

    const huellaTotal = huella?.huella_total ?? 0;
    const compass = getCompassLevel(huellaTotal);

    const getHeaderContent = () => {
        switch (activeTab) {
            case "talentos": return { title: "Gestión de Talentos", subtitle: "L - Liderar: Administración de Usuarios" };
            case "formularios": return { title: "Arquitecto de Instrumentos", subtitle: "A - Auditar: Gestión de Formularios" };
            case "explorador": return { title: "Explorador de Evidencias", subtitle: "Centro de Respuesta" };
            case "analisis": return { title: "Análisis Estratégico", subtitle: "Data e Insights" };
            case "retos": return { title: "Mis Retos Estratégicos", subtitle: "L - Liderar: Seguimiento de Objetivos" };
            case "fase_transformar": return { title: "Fase: Transformar", subtitle: "Estrategia Pedagógica UNESCO" };
            case "ejecutar_reto": return { title: `Mision ${activeRetoId}`, subtitle: "Consignación de Evidencia Pedagógica" };
            case "fase_auditar": return { title: "Fase: Auditar", subtitle: "Gobernanza y Sentido Crítico de la IA" };
            case "responder_fase": 
            case "fase_liderar": return { title: "Fase: Liderar", subtitle: "Gobernanza y Ética de la IA" };
            case "retos_liderar": return { title: `Misión`, subtitle: "Auditoría de Responsabilidad Pedagógica" };
            case "fase_asegurar":
                return { title: "Fase: Asegurar", subtitle: "Gobernanza y Sostenibilidad de la IA" };
            case "taller_asegurar":
                return { title: "Taller de Mejora Guiada", subtitle: "Refactorización Ética de Prácticas" };
            case "fase_sostener":
                return { title: "Fase: Sostener", subtitle: "S - Sostener: Radar de Madurez y Diario Reflexivo" };
            case "modulo_sostener_directivo":
                return { title: "Panel de Impacto", subtitle: "S - Sostener: Proyección y Sostenibilidad Institucional" };
            case "analisis_liderazgo":
                return {
                    title: "Dashboard de Gobernanza",
                    subtitle: "Monitoreo Institucional de Riesgo Ético"
                };
            case "diagnostico_directivo":
                return {
                    title: "Diagnóstico de Gobernanza IA",
                    subtitle: "A - Asegurar: Radar de Sostenibilidad Institucional"
                };
            case "fase_asegurar":
                return { title: "Fase: Asegurar", subtitle: "Gobernanza y Sostenibilidad de la IA" };
                const faseTxt = filterPhase === "A" ? "AUDITAR" : filterPhase === "T" ? "TRANSFORMAR" : "LIDERAR";
                return { title: `Fase ${faseTxt}`, subtitle: `Instrumentos de la Etapa ${filterPhase}` };
            default: return { title: "Bienvenido al Marco COMPASS", subtitle: "Modelo de Madurez y Gobernanza en IA Educativa" };
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={`atlas-dashboard-layout ${isMobileMenuOpen ? "mobile-nav-open" : ""}`}>

            {/* Toggle móvil */}
            <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? "✕" : "☰"}
            </button>
            {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

            {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
            <aside className={`atlas-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
                <div className="sidebar-brand" onClick={() => switchTab("overview")} style={{ cursor: "pointer" }}>
                    <img src="./logo3.png" alt="Logo ATLAS" className="sidebar-logo-main" />
                </div>

                <div className="sidebar-user-top">
                    <div className="user-avatar-initial">
                        {userData.nombre_completo?.charAt(0) || "U"}
                    </div>
                    <div className="user-text">
                        <h3 className="user-name">{userData.nombre_completo}</h3>
                        <p className="user-role-badge">{userData.rol}</p>
                    </div>
                </div>

                <div className="sidebar-divider" />

                <nav className="sidebar-nav">
                    {/* CONSOLA */}
                    <div className="atlas-nav-group">
                        <div
                            className={`atlas-group-header clickable ${openMenu === "consola" ? "active-group" : ""}`}
                            onClick={() => toggleMenu("consola")}
                        >
                            <span>CONSOLA ESTRATÉGICA</span>
                            <span className="menu-arrow">{openMenu === "consola" ? "▾" : "▸"}</span>
                        </div>
                        {openMenu === "consola" && (
                            <div className="nav-submenu">
                                <button className={activeTab === "overview" ? "active" : ""} onClick={() => switchTab("overview")}>
                                    Compass de IA
                                </button>
                                {userData.rol === "ADMIN" && (
                                    <>
                                        <button
                                            className={activeTab === "gestion_empresas" ? "active" : ""}
                                            onClick={() => switchTab("gestion_empresas")}
                                        >
                                            Gestión de Empresas
                                        </button>

                                        <button
                                            className={activeTab === "creador_retos" ? "active" : ""}
                                            onClick={() => switchTab("creador_retos")}
                                        >
                                            Creador de Retos
                                        </button>

                                        <button
                                            className={activeTab === "asignacion_retos" ? "active" : ""}
                                            onClick={() => switchTab("asignacion_retos")}
                                        >
                                            Asignación de Retos
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="nav-section">MARCO ATLAS</div>

                    {/* AUDITAR */}
                    <div className="atlas-nav-group">
                        <div
                            className={`atlas-group-header clickable ${openMenu === "auditar" ? "active-group" : ""}`}
                            onClick={() => toggleMenu("auditar")}
                        >
                            <div><span className="marco-letter">A</span> AUDITAR</div>
                            <span className="menu-arrow">{openMenu === "auditar" ? "▾" : "▸"}</span>
                        </div>
                        {openMenu === "auditar" && (
                            <div className="nav-submenu">
                                <button className={activeTab === "fase_auditar" ? "active-phase" : "phase-btn"} onClick={() => switchTab("fase_auditar")}>
                                    {userData.rol === "DIRECTIVO" ? "Diagnóstico Institucional" : "Diagnóstico"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* TRANSFORMAR */}
                    <div className="atlas-nav-group">
                        <div
                            className={`atlas-group-header clickable ${openMenu === "transformar" ? "active-group" : ""}`}
                            onClick={() => toggleMenu("transformar")}
                        >
                            <div><span className="marco-letter">T</span> TRANSFORMAR</div>
                            <span className="menu-arrow">{openMenu === "transformar" ? "▾" : "▸"}</span>
                        </div>
                        {openMenu === "transformar" && (
                            <div className="nav-submenu">
                                <button className={activeTab === "fase_transformar" ? "active-phase" : "phase-btn"} onClick={() => switchTab("fase_transformar")}>
                                    Misiones de Transformación
                                </button>
                            </div>
                        )}
                    </div>

                    {/* LIDERAR */}
                    <div className="atlas-nav-group">
                        <div
                            className={`atlas-group-header clickable ${openMenu === "liderar" ? "active-group" : ""}`}
                            onClick={() => toggleMenu("liderar")}
                        >
                            <div><span className="marco-letter">L</span> LIDERAR</div>
                            <span className="menu-arrow">{openMenu === "liderar" ? "▾" : "▸"}</span>
                        </div>
                        {openMenu === "liderar" && (
                            <div className="nav-submenu">
                                <button className={activeTab === "fase_liderar" ? "active-phase" : "phase-btn"} onClick={() => switchTab("fase_liderar")}>
                                    {userData.rol === "DIRECTIVO" ? "Dashboard de Gobernanza" : "Laboratorio Ético"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ASEGURAR */}
                    <div className="atlas-nav-group">
                        <div
                            className={`atlas-group-header clickable ${openMenu === "asegurar" ? "active-group" : ""}`}
                            onClick={() => toggleMenu("asegurar")}
                        >
                            <div><span className="marco-letter">A</span> ASEGURAR</div>
                            <span className="menu-arrow">{openMenu === "asegurar" ? "▾" : "▸"}</span>
                        </div>
                        {openMenu === "asegurar" && (
                            <div className="nav-submenu">
                                <button className={activeTab === "fase_asegurar" ? "active-phase" : "phase-btn"} onClick={() => switchTab("fase_asegurar")}>
                                    {userData.rol === "DIRECTIVO" ? "Panorama Estratégico" : "Protocolos y Mejora"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* SOSTENER */}
                    <div className="atlas-nav-group">
                        <div
                            className={`atlas-group-header clickable ${openMenu === "sostener" ? "active-group" : ""}`}
                            onClick={() => toggleMenu("sostener")}
                        >
                            <div><span className="marco-letter">S</span> SOSTENER</div>
                            <span className="menu-arrow">{openMenu === "sostener" ? "▾" : "▸"}</span>
                        </div>
                        {openMenu === "sostener" && (
                            <div className="nav-submenu">
                                <button className={activeTab === "fase_sostener" ? "active-phase" : "phase-btn"} onClick={() => switchTab("fase_sostener")}>
                                    {userData.rol === "DIRECTIVO" ? "Impacto Institucional" : "Radar y Huella"}
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                <div className="sidebar-bottom">
                    <button className="btn-logout-minimal" onClick={handleLogout}>
                        <span>Cerrar Sesión</span> <i className="icon-exit">🚪</i>
                    </button>
                </div>
            </aside>

            {/* ── MAIN ──────────────────────────────────────────────────────── */}
            <main className="atlas-main-content">
                <header className="main-header">
                    <div className="header-title-group">
                        <h1>
                            {activeTab === "overview" && "Bienvenido al Marco COMPASS"}
                            {activeTab === "fase_auditar" && "Fase: Auditar"}
                            {activeTab === "fase_transformar" && "Fase: Transformar"}
                            {activeTab === "fase_liderar" && "Fase: Liderar"}
                            {activeTab === "fase_asegurar" && "Fase: Asegurar"}
                            {activeTab === "fase_sostener" && "Fase: Sostener"}
                            {activeTab === "talentos" && "Gestión de Talentos"}
                            {activeTab === "formularios" && "Arquitecto de Instrumentos"}
                            {activeTab === "analisis" && "Análisis Estratégico"}
                            {activeTab === "asignacion_retos" && "Asignación de Retos"}
                            {activeTab === "responder_fase" && "Responder Instrumento"}
                            {activeTab === "ejecutar_reto" && "Ejecutando Misión"}
                            {activeTab === "retos_liderar" && "Laboratorio de Prompt Ético"}
                            {activeTab === "analisis_liderazgo" && "Panel de Gobernanza"}
                            {activeTab === "fase_asegurar" && ""}
                            {activeTab === "taller_asegurar" && "Taller de Mejora ASEGURAR"}
                            {activeTab === "diagnostico_directivo" && "Módulo de Gobernanza"}
                            {activeTab === "modulo_sostener" && "Radar y Autoevaluación"}
                            {activeTab === "modulo_sostener_directivo" && "Cierre Institucional COMPASS"}
                        </h1>
                        <p className="header-subtitle">{getHeaderContent().subtitle}</p>
                    </div>

                </header>

                {/* ── OVERVIEW ─────────────────────────────────────────────── */}
                {activeTab === "overview" && (
                    <section className="dashboard-grid">

                        {/* CARD 2: ¿QUÉ ES EL COMPASS DE IA? (explicativo colapsable) */}
                        <div className={`info-card wide-card compass-explainer-card ${!isCompassInfoExpanded ? 'collapsed' : ''}`}>
                            <div className="compass-header-unique" onClick={() => setIsCompassInfoExpanded(!isCompassInfoExpanded)}>
                                <div className="compass-title-group-unique">
                                    <div className="compass-text-stack-unique">
                                        <h2 className="compass-h2-unique">
                                            {userData.rol === "DIRECTIVO" ? "¿Qué es el COMPASS institucional de IA?" : "¿Qué es el COMPASS de IA?"}
                                        </h2>
                                        {!isCompassInfoExpanded && <p className="compass-tap-unique">Instrumento de madurez pedagógica basado en el modelo ATLAS</p>}
                                    </div>
                                </div>
                                <div className={`compass-toggle-unique ${isCompassInfoExpanded ? 'active' : ''}`}>
                                    {isCompassInfoExpanded ? "▲" : "▼"}
                                </div>
                            </div>
                            {isCompassInfoExpanded && (
                                <div className="compass-body-interactive">
                                    <div className="compass-full-intro">
                                        {userData.rol === "DIRECTIVO" ? (
                                            <>
                                                <h3>Panorama Estratégico</h3>
                                                <p>El <strong>COMPASS Institucional</strong> es el sistema integral de medición del modelo ATLAS. No mide herramientas; mide cultura, gobernanza y sostenibilidad del uso de la IA en toda la organización.</p>
                                                <p>Evalúa cinco dimensiones clave: gobernanza, competencia docente, gestión de datos, supervisión humana y transparencia. Su propósito es determinar si la institución ha pasado de iniciativas individuales a una arquitectura formal y sostenible.</p>
                                                <p><em>No certifica innovación aislada. Demuestra madurez organizacional.</em></p>
                                            </>
                                        ) : (
                                            <>
                                                <h3>Protocolos y Mejora</h3>
                                                <p>El <strong>COMPASS de IA</strong> es el instrumento de madurez pedagógica basado en el modelo ATLAS. No mide cuánto usas la inteligencia artificial; mide cómo la <strong>integras, la regulas y la documentas</strong> en tu práctica educativa.</p>
                                                <p>Funciona como una brújula profesional: cada avance se basa en <strong>evidencia demostrada</strong>, no en tiempo invertido ni en cantidad de herramientas. Alineado con estándares internacionales de IA confiable y gobernanza educativa.</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="compass-nav-pills">
                                        <button type="button" className={infoSeccion === 'evalua' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); setInfoSeccion('evalua'); }}>¿Qué evalúa?</button>
                                        <button type="button" className={infoSeccion === 'no-es' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); setInfoSeccion('no-es'); }}>¿Qué NO es?</button>
                                        <button type="button" className={infoSeccion === 'sirve' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); setInfoSeccion('sirve'); }}>¿Para qué sirve?</button>
                                    </div>
                                    <div className="compass-dynamic-content fade-in">
                                        {infoSeccion === 'evalua' && (
                                            <div className="section-content">
                                                <p className="section-intro-text">El COMPASS analiza tu práctica en cinco dimensiones del modelo ATLAS:</p>
                                                <ul className="compass-list-clean">
                                                    <li><strong>• AUDITAR</strong> – Diagnóstico y conciencia crítica.</li>
                                                    <li><strong>• TRANSFORMAR</strong> – Rediseño pedagógico intencional.</li>
                                                    <li><strong>• LIDERAR</strong> – Gobernanza y toma de decisiones explícitas.</li>
                                                    <li><strong>• ASEGURAR</strong> – Evaluación y evidencia de impacto.</li>
                                                    <li><strong>• SOSTENER</strong> – Sostenibilidad, ética y mejora continua.</li>
                                                </ul>
                                                <div className="highlight-note-box">Tu porcentaje refleja el nivel de evidencia documentada en estas dimensiones.</div>
                                            </div>
                                        )}
                                        {infoSeccion === 'no-es' && (
                                            <div className="section-content">
                                                <ul className="compass-list-clean">
                                                    <li>• No es una calificación.</li>
                                                    <li>• No es una evaluación de desempeño laboral.</li>
                                                    <li>• No mide entusiasmo tecnológico.</li>
                                                    <li>• No premia el uso frecuente de herramientas.</li>
                                                </ul>
                                                <div className="highlight-note-box gold">Mide criterio, evidencia y coherencia pedagógica.</div>
                                            </div>
                                        )}
                                        {infoSeccion === 'sirve' && (
                                            <div className="section-content">
                                                <p className="section-intro-text">El COMPASS te permite:</p>
                                                <ul className="compass-list-clean">
                                                    <li>• Visualizar tu madurez pedagógica en el uso de IA.</li>
                                                    <li>• Documentar evidencia real de tus decisiones.</li>
                                                    <li>• Orientar tu crecimiento profesional con criterio.</li>
                                                    <li>• Alinear tu práctica con marcos internacionales.</li>
                                                </ul>
                                                <div className="highlight-note-box">Una brújula, no una nota: te orienta hacia dónde crecer.</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CARD: COMPASS VISUAL */}
                        <div className="info-card huella-card">
                            <h3>Compass de IA</h3>
                            {(
                                <>
                                    <div className="atlas-a-container">
                                        <svg viewBox="0 0 100 100" className="atlas-svg-shape">
                                            <defs>
                                                <mask id="maskA">
                                                    <path d="M50 0 L100 100 H80 L70 75 H30 L20 100 H0 Z" fill="white" />
                                                </mask>
                                                <linearGradient id="liquidGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#1e293b" />
                                                    <stop offset="100%" stopColor="#0f172a" />
                                                </linearGradient>
                                            </defs>
                                            <g mask="url(#maskA)">
                                                <rect x="0" y="0" width="100" height="100" fill="rgba(15,23,42,0.05)" />
                                                <g className="liquid-group" style={{
                                                    transform: `translateY(${100 - huellaTotal}%)`,
                                                    transition: "transform 1.5s cubic-bezier(0.4,0,0.2,1)"
                                                }}>
                                                    <path className="wave-logic back" d="M0,0 C20,-10 80,10 100,0 L100,100 L0,100 Z" fill="rgba(15,23,42,0.0001)" />
                                                    <path className="wave-logic front" d="M0,0 C25,-15 75,15 100,0 L100,100 L0,100 Z" fill="url(#liquidGradient)" />
                                                </g>
                                            </g>
                                        </svg>
                                        <div className="huella-data">
                                            <span className="huella-number">{Math.round(huellaTotal)}%</span>
                                            <span className="huella-label">NIVEL ATLAS</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "center", marginTop: "12px" }}>
                                        <span style={{ fontSize: "0.8rem", fontWeight: "700", color: compass.color, padding: "4px 12px", borderRadius: "20px", background: `${compass.color}20` }}>
                                            {compass.label}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* CARD 1: NIVEL COMPASS ACTUAL (Exploración inicial 0-39%, etc.) */}
                        <div className="info-card prompt-card professional-upgrade">
                            <div className="card-header-flex">
                                <div className="title-group-main">
                                    <h3>COMPASS: {getCompassData(huellaTotal).title} ({getCompassData(huellaTotal).range})</h3>
                                    <p className="subtitle-compass-mini">{getCompassData(huellaTotal).subtitle}</p>
                                </div>
                            </div>
                            <div className="prompt-content-rich">
                                <div className="main-compass-text-body">
                                    <p className="intro-text-dark">{getCompassData(huellaTotal).body}</p>
                                    <p className="footer-text-highlight">{getCompassData(huellaTotal).footer}</p>
                                </div>
                                <div className="improvement-action-container">
                                    <button
                                        className={`btn-how-to-improve ${showImprovement ? 'active' : ''}`}
                                        onClick={() => setShowImprovement(!showImprovement)}
                                    >
                                        {getCompassIndex(huellaTotal) === 4 ? "💎 ¿Qué te acerca a la certificación?" : "¿Cómo subir mi COMPASS?"}
                                        <span>{showImprovement ? "▲" : "▼"}</span>
                                    </button>
                                    {showImprovement && (
                                        <div className="improvement-dropdown fade-in">
                                            <h4>{getCompassIndex(huellaTotal) === 4 ? "Requisitos para Certificación:" : "¿Cómo aumentar tu nivel?"}</h4>
                                            <ul className="improvement-list">
                                                {getCompassData(huellaTotal).howToImprove.map((step, i) => (
                                                    <li key={i}><span>→</span> {step}</li>
                                                ))}
                                            </ul>
                                            <div className="improvement-note">
                                                {getCompassData(huellaTotal).extraNote}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CARD: DATOS DEL USUARIO */}
                        <div className="info-card">
                            <h3>Mi Perfil ATLAS</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div className="user-avatar-initial" style={{ width: "48px", height: "48px", fontSize: "1.4rem" }}>
                                        {userData.nombre_completo?.charAt(0) || "U"}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: "700", fontSize: "1rem", color: "#1e293b", margin: 0 }}>{userData.nombre_completo}</p>
                                        <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0 }}>{userData.email}</p>
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                                    {[
                                        { label: "Rol", value: userData.rol },
                                        { label: "Clave", value: userData.teacher_key },
                                        { label: "Empresa", value: userData.empresa_nombre || "—" },
                                        { label: "Huella", value: `${Math.round(huellaTotal)}%` },
                                    ].map((item, i) => (
                                        <div key={i} style={{ background: "#f8fafc", borderRadius: "8px", padding: "10px" }}>
                                            <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>{item.label}</p>
                                            <p style={{ margin: "4px 0 0", fontWeight: "700", color: "#1e293b", fontSize: "0.9rem" }}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* CARD: FASES DE LA EMPRESA */}
                        {userData.empresa_id && (
                            <div className="info-card wide-card">
                                <h3>Estado de Fases ATLAS</h3>
                                {isLoading ? (
                                    <div style={{ textAlign: "center", padding: "20px" }}><div className="atlas-loader" /></div>
                                ) : fases.length === 0 ? (
                                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>
                                        No hay fases configuradas aún. El administrador debe activarlas.
                                    </p>
                                ) : (() => {
                                    // Solo fases activas y NO completadas, en orden fijo
                                    const pendientes = fasesEstado.filter(f => f.activa && !f.completada);

                                    if (pendientes.length === 0) {
                                        return (
                                            <p style={{ color: "#22c55e", textAlign: "center", padding: "20px", fontWeight: 600 }}>
                                                🎉 ¡Has completado todas tus fases disponibles! No tienes fases pendientes.
                                            </p>
                                        );
                                    }

                                    return (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginTop: "16px" }}>
                                            {pendientes.map((f, i) => (
                                                <div key={i} style={{
                                                    background: "#f0fdf4",
                                                    border: "2px solid #22c55e",
                                                    borderRadius: "12px", padding: "16px", textAlign: "center"
                                                }}>
                                                    <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{getFaseIcon(f.fase)}</div>
                                                    <p style={{ fontWeight: "800", fontSize: "0.8rem", color: "#1e293b", margin: 0 }}>{f.fase}</p>
                                                    <span style={{
                                                        display: "inline-block", marginTop: "6px",
                                                        fontSize: "0.65rem", fontWeight: "700",
                                                        padding: "3px 8px", borderRadius: "20px",
                                                        background: "#f59e0b", color: "white"
                                                    }}>
                                                        PENDIENTE
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        

                        {/* CARD: HISTORIAL DE HUELLA */}
                        {historial.length > 0 && (
                            <div className="info-card wide-card">
                                <h3>Historial de Crecimiento COMPASS</h3>
                                <div className="user-scroll-list" style={{ maxHeight: "260px", overflowY: "auto" }}>
                                    <table className="atlas-table">
                                        <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 5 }}>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Auditar</th>
                                                <th>Transformar</th>
                                                <th>Liderar</th>
                                                <th>Asegurar</th>
                                                <th>Sostener</th>
                                                <th>Total</th>
                                                <th>Evento</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...historial].reverse().map((h, i) => (
                                                <tr key={i}>
                                                    <td>{new Date(h.fecha_calculo).toLocaleDateString()}</td>
                                                    <td>{h.pts_auditar}</td>
                                                    <td>{h.pts_transformar}</td>
                                                    <td>{h.pts_liderar}</td>
                                                    <td>{h.pts_asegurar}</td>
                                                    <td>{h.pts_sostener}</td>
                                                    <td>
                                                        <span className="user-key-tag" style={{ background: "#c5a059", color: "white" }}>
                                                            {Math.round(h.total)}%
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: "0.7rem", color: "#64748b" }}>{h.evento_trigger || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* CARD: RETOS DISPONIBLES */}
                        {misRetos.length > 0 && (
                            <div className="info-card wide-card">
                                <h3>Mis Retos Disponibles</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                                    {misRetos.slice(0, 5).map((r, i) => (
                                        <div key={i} style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "12px 16px", background: "#f8fafc", borderRadius: "10px",
                                            borderLeft: `4px solid #1e293b`
                                        }}>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: "700", fontSize: "0.85rem", color: "#1e293b" }}>
                                                    {r.nombre_reto || r.nombre || `Reto ${i + 1}`}
                                                </p>
                                                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#64748b" }}>
                                                    {r.fase} · {r.nivel_unesco || ""}
                                                </p>
                                            </div>
                                            <span style={{
                                                fontSize: "0.7rem", fontWeight: "700", padding: "4px 10px",
                                                borderRadius: "20px", background: "#1e293b20", color: "#1e293b"
                                            }}>
                                                {r.peso_huella} pts
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CARD: NOTIFICACIONES DOCENTE */}
                        {userData.rol === "DOCENTE" && (
                            <div className="info-card wide-card notifications-atlas-card">
                                <div className="card-header-flex">
                                    <div className="title-group-main">
                                        <h3>Centro de Notificaciones ATLAS</h3>
                                        <p className="subtitle-compass-mini">Avisos de seguimiento institucional</p>
                                    </div>
                                    <span className="notification-badge-count">
                                        {notificaciones.filter(n => {
                                            const a = String(n.accion_activada || "").toUpperCase();
                                            return !a.includes("EXPORTACIÓN") && !a.includes("EXPORTACION") && !a.includes("REPORTE");
                                        }).length} Mensajes
                                    </span>
                                </div>
                                <div className="notifications-container">
                                    {notificaciones.filter(n => {
                                        const a = String(n.accion_activada || "").toUpperCase();
                                        return !a.includes("EXPORTACIÓN") && !a.includes("EXPORTACION") && !a.includes("REPORTE");
                                    }).length === 0 ? (
                                        <p className="notif-empty">No tienes mensajes pendientes.</p>
                                    ) : notificaciones
                                        .filter(n => {
                                            const a = String(n.accion_activada || "").toUpperCase();
                                            return !a.includes("EXPORTACIÓN") && !a.includes("EXPORTACION") && !a.includes("REPORTE");
                                        })
                                        .map((n, i) => {
                                            const accion = String(n.accion_activada || "").toUpperCase();
                                            const esRezagado = accion.includes("REZAGADOS");
                                            const esAyuda = accion.includes("AYUDA") || accion.includes("MENTOR");
                                            return (
                                                <div key={i} className={`notification-item ${esRezagado ? 'alert' : esAyuda ? 'help' : ''}`}>
                                                    <div className="notif-icon">{esRezagado ? "⚠️" : esAyuda ? "🤝" : "🔔"}</div>
                                                    <div className="notif-content">
                                                        <p className="notif-text">
                                                            {esRezagado
                                                                ? "Atención: tienes tareas pendientes en tus fases. Es importante retomar el proceso."
                                                                : esAyuda
                                                                    ? "Tu directivo activó una sesión de mentoría / ayuda presencial para ti."
                                                                    : (n.accion_activada || "Notificación institucional")}
                                                        </p>
                                                        <div className="notif-footer-meta">
                                                            <span className="notif-tag-dim">{n.dimension_priorizada || "INSTITUCIONAL"}</span>
                                                            <span className="notif-date">
                                                                {n.fecha_accion ? new Date(n.fecha_accion).toLocaleDateString() : "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* CARD: FORMULARIOS DISPONIBLES */}
                        {misFormularios.length > 0 && (
                            <div className="info-card wide-card">
                                <h3>Formularios Disponibles — Fase Auditar</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                                    {misFormularios.map((f, i) => (
                                        <div key={i} style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "12px 16px", background: "#f8fafc", borderRadius: "10px",
                                            borderLeft: "4px solid #c5a059"
                                        }}>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: "700", fontSize: "0.85rem", color: "#1e293b" }}>{f.titulo}</p>
                                                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#64748b" }}>
                                                    {f.rol_destino} · {f.puntos_maximos} pts máx
                                                </p>
                                            </div>
                                            <span style={{
                                                fontSize: "0.7rem", fontWeight: "700", padding: "4px 10px",
                                                borderRadius: "20px", background: "#c5a05920", color: "#c5a059"
                                            }}>
                                                {f.fase_atlas}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error si hubo problema */}
                        {error && (
                            <div className="info-card wide-card" style={{ background: "#fef2f2", border: "2px solid #fca5a5" }}>
                                <p style={{ color: "#dc2626", fontWeight: "600", margin: 0 }}>⚠️ {error}</p>
                                <button
                                    style={{ marginTop: "12px", padding: "8px 16px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
                                    onClick={() => loadDashboardData(userData)}
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}

                    </section>
                )}

                {/* ── TABS DE FASES (placeholders — conectar tus componentes existentes) */}
                {activeTab !== "overview" && (
                    <>
                        {/* 1. Fases con su propio layout — SIN wrapper grid, ocupan el ancho completo */}
                        {activeTab === "fase_auditar" && <FaseAuditar userData={userData} apiFetch={apiFetch} onNavigate={handleNavigateFase} />}
                        {activeTab === "responder_fase" && (
                            <ResponderFormularios
                                userData={userData}
                                apiFetch={apiFetch}
                                filterPhase={modoResponder === "auditar2" ? "AUDITAR" : faseRespondiendo}
                                modoAuditar2={modoResponder === "auditar2"}
                                onNavigate={modoResponder === "auditar2" ? handleNavigateSostener : handleNavigateFase}
                            />
                        )}
                        {activeTab === "fase_transformar" && <FaseTransformar userData={userData} apiFetch={apiFetch} onNavigate={handleNavigateTransformar} />}
                        {activeTab === "ejecutar_reto" && <EjecutarReto userData={userData} apiFetch={apiFetch} retoId={retoEjecutando} onNavigate={handleNavigateTransformar} />}
                        {activeTab === "fase_liderar" && <FaseLiderar userData={userData} apiFetch={apiFetch} onNavigate={handleNavigateLiderar} />}
                        {activeTab === "retos_liderar" && <RetosLiderar userData={userData} apiFetch={apiFetch} retoId={retoLiderarId} onNavigate={handleNavigateLiderar} />}
                        {activeTab === "analisis_liderazgo" && <AnalisisLiderazgo userData={userData} apiFetch={apiFetch} onNavigate={handleNavigateLiderar} />}
                        {activeTab === "fase_asegurar" && <FaseAsegurar userData={userData} apiFetch={apiFetch} onNavigate={handleNavigateAsegurar} />}
                        {activeTab === "taller_asegurar" && <TallerMejoraAsegurar userData={userData} apiFetch={apiFetch} onNavigate={handleNavigateAsegurar} />}
                        {activeTab === "diagnostico_directivo" && <ModuloDirectivoEstrategico userData={userData} apiFetch={apiFetch} onNavigate={handleNavigateAsegurar} />}
                        {activeTab === "fase_sostener" && <FaseSostener userData={userData} apiFetch={apiFetch} onNavigate={handleNavigateSostener} onRefreshProgreso={() => loadDashboardData(userData)} />}
                        {activeTab === "modulo_sostener" && <ModuloSostener userData={userData} apiFetch={apiFetch} onNavigate={handleNavigateSostener} />}
                        {activeTab === "modulo_sostener_directivo" && <ModuloSostenerDirectivo userData={userData} apiFetch={apiFetch} onNavigate={handleNavigateSostener} />}

                        {/* 2. Páginas tipo panel/admin que sí usan el grid de cards de 2 columnas */}
                        {["creador_retos", "gestion_empresas", "asignacion_retos"].includes(activeTab) && (
                            <section className="dashboard-grid">
                                {activeTab === "creador_retos" && <CreadorRetos apiFetch={apiFetch} />}
                                {activeTab === "gestion_empresas" && <GestionEmpresasUsuarios apiFetch={apiFetch} API_URL={API_URL} />}
                                {activeTab === "asignacion_retos" && <AsignacionRetos apiFetch={apiFetch} />}
                            </section>
                        )}

                        {/* 3. Bloque genérico (placeholders restantes: talentos, formularios, analisis, etc.) */}
                        {!["creador_retos", "gestion_empresas", "asignacion_retos", "talentos", "formularios", "analisis", "fase_auditar", "responder_fase", "fase_transformar", "ejecutar_reto", "fase_liderar", "retos_liderar", "analisis_liderazgo", "fase_asegurar", "taller_asegurar", "diagnostico_directivo", "fase_sostener", "modulo_sostener", "modulo_sostener_directivo"].includes(activeTab) && (
                            <section className="dashboard-grid">
                                <div className="info-card wide-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
                                        {getFaseIcon(activeTab.replace("fase_", "").toUpperCase())}
                                    </div>
                                    <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>
                                        {activeTab.replace(/_/g, " ").toUpperCase()}
                                    </h2>
                                    <p style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto 24px" }}>
                                        Esta sección se conectará con los componentes de cada fase. El login y la carga de datos desde la nueva API ya funcionan correctamente.
                                    </p>
                                    <button
                                        onClick={() => switchTab("overview")}
                                        style={{ padding: "10px 24px", background: "#1e293b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}
                                    >
                                        ← Volver al Dashboard
                                    </button>
                                </div>
                            </section>
                        )}
                    </>
                )}

            </main>
        </div>
    );
};
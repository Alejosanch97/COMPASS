import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GestionEmpresasUsuarios } from "./GestionEmpresasUsuarios";
import { CreadorRetos } from "./CreadorRetos";
import { AsignacionRetos } from "./AsignacionRetos";
import { FaseAuditar } from "./FaseAuditar";
import { ResponderFormularios } from "./ResponderFormularios"; // <-- Nueva página para responder instrumentos
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

    const handleNavigateFase = (tab, fase) => {
        if (fase) setFaseRespondiendo(fase);
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
                const [fasesData, retosData, formsData] = await Promise.all([
                    apiFetch("/api/mi-empresa/fases").catch(() => []),
                    apiFetch("/api/mis-retos").catch(() => []),
                    apiFetch("/api/formularios").catch(() => []),
                ]);
                setFases(Array.isArray(fasesData) ? fasesData : []);
                setMisRetos(Array.isArray(retosData) ? retosData : []);
                setMisFormularios(Array.isArray(formsData) ? formsData : []);
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
        navigate("/");
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
                                <button className={activeTab === "gestion_empresas" ? "active" : ""} onClick={() => switchTab("gestion_empresas")}>
                                    Gestión de Empresas
                                </button>
                                {/* ── Nuevas Secciones para el ADMIN que redirigen a las rutas externas ── */}
                                <button className={activeTab === "creador_retos" ? "active" : ""} onClick={() => switchTab("creador_retos")}>
                                    Creador de Retos
                                </button>

                                <button
                                    className={activeTab === "asignacion_retos" ? "active" : ""}
                                    onClick={() => switchTab("asignacion_retos")}
                                >
                                    Asignación de Retos
                                </button>

                                {(userData.rol === "ADMIN" || userData.rol === "DIRECTIVO") && (
                                    <button className={activeTab === "analisis" ? "active" : ""} onClick={() => switchTab("analisis")}>
                                        Análisis
                                    </button>
                                )}
                                {userData.rol === "ADMIN" && (
                                    <>
                                        <button className={activeTab === "talentos" ? "active" : ""} onClick={() => switchTab("talentos")}>
                                            Gestión de Talentos
                                        </button>
                                        <button className={activeTab === "formularios" ? "active" : ""} onClick={() => switchTab("formularios")}>
                                            Arquitecto de Instrumentos
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
                        </h1>
                        <p className="header-subtitle">Modelo de Madurez y Gobernanza en IA Educativa</p>
                    </div>

                </header>

                {/* ── OVERVIEW ─────────────────────────────────────────────── */}
                {activeTab === "overview" && (
                    <section className="dashboard-grid">

                        {/* CARD: COMPASS VISUAL */}
                        <div className="info-card huella-card">
                            <h3>Compass de IA</h3>
                            {isLoading ? (
                                <div style={{ textAlign: "center", padding: "40px" }}>
                                    <div className="atlas-loader" />
                                </div>
                            ) : (
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
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginTop: "16px" }}>
                                        {fases.map((f, i) => (
                                            <div key={i} style={{
                                                background: f.esta_abierta ? "#f0fdf4" : "#f8fafc",
                                                border: `2px solid ${f.esta_abierta ? "#22c55e" : "#e2e8f0"}`,
                                                borderRadius: "12px", padding: "16px", textAlign: "center"
                                            }}>
                                                <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{getFaseIcon(f.fase)}</div>
                                                <p style={{ fontWeight: "800", fontSize: "0.8rem", color: "#1e293b", margin: 0 }}>{f.fase}</p>
                                                <span style={{
                                                    display: "inline-block", marginTop: "6px",
                                                    fontSize: "0.65rem", fontWeight: "700",
                                                    padding: "3px 8px", borderRadius: "20px",
                                                    background: f.esta_abierta ? "#22c55e" : "#94a3b8",
                                                    color: "white"
                                                }}>
                                                    {f.esta_abierta ? "ACTIVA" : "PENDIENTE"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                    <span className="notification-badge-count">{notificaciones.length} Mensajes</span>
                                </div>
                                <div className="notifications-container">
                                    {notificaciones.length === 0 ? (
                                        <p className="notif-empty">No tienes mensajes pendientes.</p>
                                    ) : notificaciones.map((n, i) => (
                                        <div key={i} className="notification-item">
                                            <div className="notif-icon">🔔</div>
                                            <div className="notif-content">
                                                <p className="notif-text">{n.accion_activada || "Notificación institucional"}</p>
                                                <div className="notif-footer-meta">
                                                    <span className="notif-tag-dim">{n.dimension_priorizada || "INSTITUCIONAL"}</span>
                                                    <span className="notif-date">
                                                        {n.fecha_accion ? new Date(n.fecha_accion).toLocaleDateString() : "—"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                    <section className="dashboard-grid">

                        {/* 1. Renderizado directo de tus nuevas vistas si están activas */}
                        {activeTab === "creador_retos" && <CreadorRetos apiFetch={apiFetch} />}
                        {activeTab === "gestion_empresas" && <GestionEmpresasUsuarios apiFetch={apiFetch} API_URL={API_URL} />}
                        {activeTab === "asignacion_retos" && <AsignacionRetos apiFetch={apiFetch} />}
                        {activeTab === "fase_auditar" && <FaseAuditar userData={userData} apiFetch={apiFetch} onNavigate={handleNavigateFase} />}
                        {activeTab === "responder_fase" && <ResponderFormularios userData={userData} apiFetch={apiFetch} filterPhase={faseRespondiendo} onNavigate={handleNavigateFase} />}

                        {/* 2. Bloque genérico (Solo se muestra para las fases que aún son placeholders) */}
                        {!["creador_retos", "gestion_empresas", "asignacion_retos", "talentos", "formularios", "analisis", "fase_auditar", "responder_fase"].includes(activeTab) && (
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
                        )}
                    </section>
                )}

            </main>
        </div>
    );
};
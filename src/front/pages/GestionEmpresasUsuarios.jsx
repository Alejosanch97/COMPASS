import React, { useState, useEffect } from "react";
import "../Styles/gestionEmpresasUsuarios.css";

/**
 * GestionEmpresasUsuarios
 * Page para que el ADMIN cree Empresas y luego Usuarios asignados a esas empresas.
 * Usa clases CSS únicas con prefijo "geu-" (sin estilos inline) para no chocar
 * nunca con .info-card / .dashboard-grid / .atlas-table globales del Dashboard.
 */
export const GestionEmpresasUsuarios = ({ API_URL, apiFetch }) => {
    const [vista, setVista] = useState("empresas"); // "empresas" | "usuarios"

    // ── Empresas ──────────────────────────────────────────────────────────
    const [empresas, setEmpresas] = useState([]);
    const [showEmpresaModal, setShowEmpresaModal] = useState(false);
    const [editingEmpresa, setEditingEmpresa] = useState(null);

    // ── Usuarios ──────────────────────────────────────────────────────────
    const [usuarios, setUsuarios] = useState([]);
    const [showUsuarioModal, setShowUsuarioModal] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState(null);
    const [filtroEmpresa, setFiltroEmpresa] = useState("");
    const [filtroRol, setFiltroRol] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        cargarTodo();
    }, []);

    const cargarTodo = async () => {
        setIsLoading(true);
        try {
            const [empresasData, usuariosData] = await Promise.all([
                apiFetch("/api/empresas").catch(() => []),
                apiFetch("/api/usuarios").catch(() => []),
            ]);
            setEmpresas(Array.isArray(empresasData) ? empresasData : []);
            setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
        } catch (e) {
            console.error("Error cargando empresas/usuarios:", e);
        } finally {
            setIsLoading(false);
        }
    };

    // ── CRUD Empresas ─────────────────────────────────────────────────────
    const handleSubmitEmpresa = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = {
            nombre: fd.get("nombre"),
            nit: fd.get("nit"),
            ciudad: fd.get("ciudad"),
            pais: fd.get("pais") || "Colombia",
            logo_url: fd.get("logo_url"),
            is_active: true,
        };

        setIsSyncing(true);
        try {
            if (editingEmpresa) {
                await apiFetch(`/api/empresas/${editingEmpresa.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
            } else {
                await apiFetch("/api/empresas", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }
            await cargarTodo();
            setShowEmpresaModal(false);
            setEditingEmpresa(null);
        } catch (err) {
            alert("Error al guardar la empresa.");
            console.error(err);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDeleteEmpresa = async (id) => {
        if (!window.confirm("¿Eliminar esta empresa? Se eliminarán también sus usuarios.")) return;
        setIsSyncing(true);
        try {
            await apiFetch(`/api/empresas/${id}`, { method: "DELETE" });
            await cargarTodo();
        } finally {
            setIsSyncing(false);
        }
    };

    // ── CRUD Usuarios ─────────────────────────────────────────────────────
    const handleSubmitUsuario = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const password = fd.get("password");

        const payload = {
            nombre_completo: fd.get("nombre_completo"),
            email: fd.get("email"),
            rol: fd.get("rol"),
            empresa_id: fd.get("empresa_id") ? parseInt(fd.get("empresa_id")) : null,
            is_active: fd.get("is_active") === "on",
        };
        if (password && password.trim() !== "") {
            payload.password = password;
        }

        setIsSyncing(true);
        try {
            if (editingUsuario) {
                await apiFetch(`/api/usuarios/${editingUsuario.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
            } else {
                if (!password) {
                    alert("La contraseña es obligatoria para usuarios nuevos.");
                    setIsSyncing(false);
                    return;
                }
                await apiFetch("/api/usuarios", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }
            await cargarTodo();
            setShowUsuarioModal(false);
            setEditingUsuario(null);
        } catch (err) {
            alert("Error al guardar el usuario. Verifica que el email no esté duplicado.");
            console.error(err);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDeleteUsuario = async (id) => {
        if (!window.confirm("¿Eliminar este usuario?")) return;
        setIsSyncing(true);
        try {
            await apiFetch(`/api/usuarios/${id}`, { method: "DELETE" });
            await cargarTodo();
        } finally {
            setIsSyncing(false);
        }
    };

    // ── Filtros ───────────────────────────────────────────────────────────
    const usuariosFiltrados = usuarios.filter(u => {
        const matchEmpresa = !filtroEmpresa || String(u.empresa_id) === String(filtroEmpresa);
        const matchRol = !filtroRol || u.rol === filtroRol;
        const matchSearch = !searchTerm ||
            u.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.teacher_key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchEmpresa && matchRol && matchSearch;
    });

    return (
        <div className="geu-page">

            {/* ── SUB-NAVEGACIÓN ─────────────────────────────────────────── */}
            <div className="geu-card">
                <div className="geu-subnav">
                    <button
                        onClick={() => setVista("empresas")}
                        className={`geu-subnav-btn ${vista === "empresas" ? "active" : ""}`}
                    >
                        🏢 Empresas ({empresas.length})
                    </button>
                    <button
                        onClick={() => setVista("usuarios")}
                        className={`geu-subnav-btn ${vista === "usuarios" ? "active" : ""}`}
                    >
                        👤 Usuarios ({usuarios.length})
                    </button>
                </div>
            </div>

            {/* ── VISTA EMPRESAS ──────────────────────────────────────────── */}
            {vista === "empresas" && (
                <div className="geu-card">
                    <div className="geu-card-header">
                        <h3>Empresas Registradas</h3>
                        <button className="geu-btn-primary" onClick={() => { setEditingEmpresa(null); setShowEmpresaModal(true); }}>
                            ➕ Nueva Empresa
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="geu-loader-wrap"><div className="geu-loader" /></div>
                    ) : (
                        <div className="geu-table-wrap">
                            <table className="geu-table geu-table-empresas">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>NIT</th>
                                        <th>Ciudad</th>
                                        <th>País</th>
                                        <th>Usuarios</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                        
                                    </tr>
                                </thead>
                                <tbody>
                                    {empresas.length === 0 ? (
                                        <tr className="geu-empty-row"><td colSpan="7">No hay empresas registradas.</td></tr>
                                    ) : empresas.map(emp => (
                                        <tr key={emp.id}>
                                            <td><strong>{emp.nombre}</strong></td>
                                            <td>{emp.nit || "—"}</td>
                                            <td>{emp.ciudad || "—"}</td>
                                            <td>{emp.pais}</td>
                                            <td>
                                                <span className="geu-tag">
                                                    {usuarios.filter(u => u.empresa_id === emp.id).length}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`geu-pill ${emp.is_active ? "activo" : "inactivo"}`}>
                                                    {emp.is_active ? "Activa" : "Inactiva"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="geu-actions">
                                                    <button className="geu-icon-btn edit" onClick={() => { setEditingEmpresa(emp); setShowEmpresaModal(true); }}>✏️</button>
                                                    <button className="geu-icon-btn delete" onClick={() => handleDeleteEmpresa(emp.id)}>🗑️</button>
                                                    <button
                                                        className="geu-icon-btn"
                                                        title="Ver usuarios de esta empresa"
                                                        onClick={() => { setFiltroEmpresa(String(emp.id)); setVista("usuarios"); }}
                                                    >
                                                        👥
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── VISTA USUARIOS ──────────────────────────────────────────── */}
            {vista === "usuarios" && (
                <div className="geu-card">
                    <div className="geu-card-header">
                        <h3>Usuarios del Sistema</h3>
                        <div className="geu-header-actions">
                            <input
                                type="text"
                                placeholder="Buscar por clave"
                                className="geu-search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                className="geu-select"
                                value={filtroEmpresa}
                                onChange={(e) => setFiltroEmpresa(e.target.value)}
                            >
                                <option value="">Todas las empresas</option>
                                {empresas.map(e => (
                                    <option key={e.id} value={e.id}>{e.nombre}</option>
                                ))}
                            </select>
                            <select
                                className="geu-select"
                                value={filtroRol}
                                onChange={(e) => setFiltroRol(e.target.value)}
                            >
                                <option value="">Todos los roles</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="DOCENTE">DOCENTE</option>
                                <option value="DIRECTIVO">DIRECTIVO</option>
                            </select>
                            <button className="geu-btn-primary geu-btn-right" onClick={() => { setEditingUsuario(null); setShowUsuarioModal(true); }}>
                                ➕ Nuevo Usuario
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="geu-loader-wrap"><div className="geu-loader" /></div>
                    ) : (
                        <div className="geu-table-wrap">
                            <table className="geu-table">
                                <thead>
                                    <tr>
                                        <th>Key</th>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        <th>Empresa</th>
                                        <th>Estado</th>
                                        <th>Huella</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuariosFiltrados.length === 0 ? (
                                        <tr className="geu-empty-row"><td colSpan="8">No hay usuarios que coincidan.</td></tr>
                                    ) : usuariosFiltrados.map(u => (
                                        <tr key={u.id}>
                                            <td><span className="geu-tag">{u.teacher_key}</span></td>
                                            <td>{u.nombre_completo}</td>
                                            <td className="geu-email-cell">{u.email}</td>
                                            <td><span className={`geu-pill ${u.rol.toLowerCase()}`}>{u.rol}</span></td>
                                            <td>{u.empresa_nombre || "—"}</td>
                                            <td>
                                                <span className={`geu-pill ${u.is_active ? "activo" : "inactivo"}`}>
                                                    {u.is_active ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td>{Math.round(u.huella_compass_total || 0)}%</td>
                                            <td>
                                                <div className="geu-actions">
                                                    <button className="geu-icon-btn edit" onClick={() => { setEditingUsuario(u); setShowUsuarioModal(true); }}>✏️</button>
                                                    <button className="geu-icon-btn delete" onClick={() => handleDeleteUsuario(u.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── MODAL EMPRESA ───────────────────────────────────────────── */}
            {showEmpresaModal && (
                <div className="geu-modal-overlay">
                    <div className="geu-modal">
                        <div className="geu-modal-header">
                            <div className="geu-modal-header-info">
                                <h2>{editingEmpresa ? "Editar Empresa" : "Nueva Empresa"}</h2>
                                <p className="geu-modal-subtitle">Gestión Institucional ATLAS</p>
                            </div>
                            <button className="geu-modal-close" onClick={() => setShowEmpresaModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmitEmpresa} className="geu-modal-body">
                            <div className="geu-form-group">
                                <div>
                                    <label className="geu-label">NOMBRE DE LA EMPRESA</label>
                                    <input type="text" name="nombre" className="geu-input"
                                        defaultValue={editingEmpresa?.nombre} required />
                                </div>
                                <div className="geu-form-row">
                                    <div>
                                        <label className="geu-label">NIT</label>
                                        <input type="text" name="nit" className="geu-input"
                                            defaultValue={editingEmpresa?.nit} />
                                    </div>
                                    <div>
                                        <label className="geu-label">CIUDAD</label>
                                        <input type="text" name="ciudad" className="geu-input"
                                            defaultValue={editingEmpresa?.ciudad} />
                                    </div>
                                </div>
                                <div>
                                    <label className="geu-label">PAÍS</label>
                                    <input type="text" name="pais" className="geu-input"
                                        defaultValue={editingEmpresa?.pais || "Colombia"} />
                                </div>
                                <div>
                                    <label className="geu-label">LOGO URL (opcional)</label>
                                    <input type="text" name="logo_url" className="geu-input"
                                        defaultValue={editingEmpresa?.logo_url} />
                                </div>
                                <button type="submit" className="geu-btn-submit" disabled={isSyncing}>
                                    {isSyncing ? "Guardando..." : editingEmpresa ? "Actualizar Empresa" : "Crear Empresa"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL USUARIO ───────────────────────────────────────────── */}
            {showUsuarioModal && (
                <div className="geu-modal-overlay">
                    <div className="geu-modal">
                        <div className="geu-modal-header">
                            <div className="geu-modal-header-info">
                                <h2>{editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}</h2>
                                <p className="geu-modal-subtitle">Gestión de Acceso ATLAS</p>
                            </div>
                            <button className="geu-modal-close" onClick={() => setShowUsuarioModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmitUsuario} className="geu-modal-body">
                            <div className="geu-form-group">
                                {editingUsuario && (
                                    <div>
                                        <label className="geu-label">CLAVE DE USUARIO (generada automáticamente)</label>
                                        <input type="text" className="geu-input geu-input-disabled"
                                            value={editingUsuario.teacher_key} disabled />
                                    </div>
                                )}
                                {!editingUsuario && (
                                    <div className="geu-hint-box">
                                        💡 La clave se generará automáticamente como <strong>1{"{PRIMERNOMBRE}"}</strong> según el nombre que escribas (Ej: Luis Alejandro → <strong>1LUIS</strong>).
                                    </div>
                                )}
                                <div>
                                    <label className="geu-label">NOMBRE COMPLETO</label>
                                    <input type="text" name="nombre_completo" className="geu-input"
                                        defaultValue={editingUsuario?.nombre_completo} required />
                                </div>
                                <div>
                                    <label className="geu-label">CORREO ELECTRÓNICO</label>
                                    <input type="email" name="email" className="geu-input"
                                        defaultValue={editingUsuario?.email} required />
                                </div>
                                <div className="geu-form-row">
                                    <div>
                                        <label className="geu-label">ROL</label>
                                        <select name="rol" className="geu-input" defaultValue={editingUsuario?.rol || "DOCENTE"}>
                                            <option value="DOCENTE">DOCENTE</option>
                                            <option value="DIRECTIVO">DIRECTIVO</option>
                                            <option value="ADMIN">ADMINISTRADOR</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="geu-label">EMPRESA</label>
                                        <select name="empresa_id" className="geu-input" defaultValue={editingUsuario?.empresa_id || ""}>
                                            <option value="">Sin empresa</option>
                                            {empresas.map(e => (
                                                <option key={e.id} value={e.id}>{e.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="geu-label">
                                        CONTRASEÑA {editingUsuario && "(dejar vacío para no cambiar)"}
                                    </label>
                                    <input type="password" name="password" className="geu-input"
                                        required={!editingUsuario} />
                                </div>
                                <label className="geu-checkbox-label">
                                    <input type="checkbox" name="is_active" defaultChecked={editingUsuario ? editingUsuario.is_active : true} />
                                    Usuario activo
                                </label>
                                <button type="submit" className="geu-btn-submit" disabled={isSyncing}>
                                    {isSyncing ? "Guardando..." : editingUsuario ? "Actualizar Usuario" : "Crear Usuario"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
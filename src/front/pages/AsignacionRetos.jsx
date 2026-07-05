import React, { useState, useEffect } from "react";
import "../Styles/asignacionRetos.css";

/**
 * AsignacionRetos
 * Page exclusiva del ADMIN para asignar formularios (Auditar) y retos
 * (Transformar, Liderar, Asegurar, Sostener) YA EXISTENTES a una empresa
 * específica, y ver el % de progreso de asignación por fase y total.
 *
 * NO crea contenido nuevo — eso vive en CreadorRetos. Aquí solo se
 * conecta el banco ya creado con cada empresa.
 *
 * Todas las clases usan el prefijo único "as-" para no chocar con el
 * resto del CSS del Dashboard ni de otras fases.
 */

const FASES_RETO = [
    { value: "TRANSFORMAR", label: "T · Transformar", icon: "⚡", peso: 30 },
    { value: "LIDERAR", label: "L · Liderar", icon: "🧭", peso: 15 },
    { value: "ASEGURAR", label: "A · Asegurar", icon: "🛡️", peso: 20 },
    { value: "SOSTENER", label: "S · Sostener", icon: "🌱", peso: 15 },
];

export const AsignacionRetos = ({ apiFetch }) => {
    const [empresas, setEmpresas] = useState([]);
    const [resumenTodas, setResumenTodas] = useState([]);
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

    const [formulariosDisponibles, setFormulariosDisponibles] = useState([]);
    const [retosDisponibles, setRetosDisponibles] = useState([]);
    const [detalleAsignacion, setDetalleAsignacion] = useState(null);

    const [faseActiva, setFaseActiva] = useState("TRANSFORMAR");
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Estado del modal de "reemplazar reto"
    const [reemplazando, setReemplazando] = useState(null); // { reto_plantilla_id, fase }
    const [liderarActiva, setLiderarActiva] = useState(false);
    const [asegurarActiva, setAsegurarActiva] = useState(false);
    const [sostenerActiva, setSostenerActiva] = useState(false);

    useEffect(() => {
        cargarInicial();
    }, []);

    const cargarInicial = async () => {
        setIsLoading(true);
        try {
            const [empresasData, resumenData, formsData, retosData] = await Promise.all([
                apiFetch("/api/empresas").catch(() => []),
                apiFetch("/api/asignaciones/resumen-todas").catch(() => []),
                apiFetch("/api/formularios").catch(() => []),
                apiFetch("/api/retos-plantilla").catch(() => []),
            ]);
            setEmpresas(Array.isArray(empresasData) ? empresasData : []);
            setResumenTodas(Array.isArray(resumenData) ? resumenData : []);
            setFormulariosDisponibles(Array.isArray(formsData) ? formsData.filter(f => f.fase_atlas === "AUDITAR") : []);
            setRetosDisponibles(Array.isArray(retosData) ? retosData : []);
        } catch (e) {
            console.error("Error cargando datos iniciales:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const cargarDetalleEmpresa = async (empresaId) => {
        setIsLoadingDetalle(true);
        try {
            const [detalle, fases] = await Promise.all([
                apiFetch(`/api/empresas/${empresaId}/asignaciones`),
                apiFetch(`/api/empresas/${empresaId}/fases`).catch(() => []),
            ]);
            setDetalleAsignacion(detalle);
            const liderar = Array.isArray(fases) ? fases.find(f => f.fase === "LIDERAR") : null;
            setLiderarActiva(liderar?.is_activa === true);
            const asegurar = Array.isArray(fases) ? fases.find(f => f.fase === "ASEGURAR") : null;
            setAsegurarActiva(asegurar?.is_activa === true);
             const sostener = Array.isArray(fases) ? fases.find(f => f.fase === "SOSTENER") : null;
            setSostenerActiva(sostener?.is_activa === true);
        } catch (e) {
            console.error("Error cargando detalle:", e);
            alert("No se pudo cargar el detalle de asignación de esta empresa.");
        } finally {
            setIsLoadingDetalle(false);
        }
    };

    const seleccionarEmpresa = (empresa) => {
        setEmpresaSeleccionada(empresa);
        cargarDetalleEmpresa(empresa.id);
    };

    const volverALista = () => {
        setEmpresaSeleccionada(null);
        setDetalleAsignacion(null);
        cargarInicial(); // refresca los porcentajes de la lista
    };

    // ── Formularios (Auditar) ────────────────────────────────────────────
    const formularioEstaAsignado = (formId) => {
        return detalleAsignacion?.formularios_asignados?.some(f => f.formulario_id === formId);
    };

    const toggleFormulario = async (form) => {
        if (!empresaSeleccionada) return;
        setIsSyncing(true);
        try {
            if (formularioEstaAsignado(form.id)) {
                await apiFetch(`/api/empresas/${empresaSeleccionada.id}/formularios/${form.id}/asignar`, { method: "DELETE" });
            } else {
                await apiFetch(`/api/empresas/${empresaSeleccionada.id}/formularios/${form.id}/asignar`, { method: "POST" });
            }
            await cargarDetalleEmpresa(empresaSeleccionada.id);
        } catch (e) {
            console.error("Error al asignar/desasignar formulario:", e);
            alert("Hubo un error. Revisa la consola.");
        } finally {
            setIsSyncing(false);
        }
    };

    // ── Retos (Transformar, Liderar, Asegurar, Sostener) ────────────────
    const retoEstaAsignado = (retoId) => {
        if (!detalleAsignacion) return false;
        const lista = detalleAsignacion.retos_por_fase[faseActiva] || [];
        return lista.some(r => r.reto_plantilla_id === retoId);
    };

    const toggleReto = async (reto) => {
        if (!empresaSeleccionada) return;
        setIsSyncing(true);
        try {
            if (retoEstaAsignado(reto.id)) {
                await apiFetch(`/api/empresas/${empresaSeleccionada.id}/retos/${reto.id}/asignar`, { method: "DELETE" });
            } else {
                await apiFetch(`/api/empresas/${empresaSeleccionada.id}/retos/${reto.id}/asignar`, { method: "POST", body: JSON.stringify({}) });
            }
            await cargarDetalleEmpresa(empresaSeleccionada.id);
        } catch (e) {
            console.error("Error al asignar/desasignar reto:", e);
            alert("Hubo un error. Revisa la consola.");
        } finally {
            setIsSyncing(false);
        }
    };

    // ── Reemplazar un reto asignado por otro ────────────────────────────
    const abrirReemplazo = (retoAsignado) => {
        setReemplazando(retoAsignado);
    };

    const confirmarReemplazo = async (nuevoRetoId) => {
        if (!empresaSeleccionada || !reemplazando) return;
        setIsSyncing(true);
        try {
            await apiFetch(
                `/api/empresas/${empresaSeleccionada.id}/retos/${reemplazando.reto_plantilla_id}/reemplazar`,
                { method: "PUT", body: JSON.stringify({ nuevo_reto_plantilla_id: nuevoRetoId }) }
            );
            await cargarDetalleEmpresa(empresaSeleccionada.id);
            setReemplazando(null);
        } catch (e) {
            console.error("Error reemplazando reto:", e);
            alert("Hubo un error al reemplazar. Puede que ese reto ya esté asignado.");
        } finally {
            setIsSyncing(false);
        }
    };

    // ── Activar / desactivar la fase LIDERAR (no asigna retos, solo la abre) ──
    const toggleLiderar = async () => {
        if (!empresaSeleccionada) return;
        setIsSyncing(true);
        try {
            await apiFetch(`/api/empresas/${empresaSeleccionada.id}/fases`, {
                method: "POST",
                body: JSON.stringify({ fase: "LIDERAR", is_activa: !liderarActiva }),
            });
            setLiderarActiva(!liderarActiva);
            await cargarDetalleEmpresa(empresaSeleccionada.id);
        } catch (e) {
            console.error("Error activando/desactivando LIDERAR:", e);
            alert("Hubo un error al cambiar el estado de LIDERAR.");
        } finally {
            setIsSyncing(false);
        }
    };

    // ── Activar / desactivar la fase ASEGURAR (no asigna retos, solo la abre) ──
    const toggleAsegurar = async () => {
        if (!empresaSeleccionada) return;
        setIsSyncing(true);
        try {
            await apiFetch(`/api/empresas/${empresaSeleccionada.id}/fases`, {
                method: "POST",
                body: JSON.stringify({ fase: "ASEGURAR", is_activa: !asegurarActiva }),
            });
            setAsegurarActiva(!asegurarActiva);
            await cargarDetalleEmpresa(empresaSeleccionada.id);
        } catch (e) {
            console.error("Error activando/desactivando ASEGURAR:", e);
            alert("Hubo un error al cambiar el estado de ASEGURAR.");
        } finally {
            setIsSyncing(false);
        }
    };

    const toggleSostener = async () => {
        if (!empresaSeleccionada) return;
        setIsSyncing(true);
        try {
            await apiFetch(`/api/empresas/${empresaSeleccionada.id}/fases`, {
                method: "POST",
                body: JSON.stringify({ fase: "SOSTENER", is_activa: !sostenerActiva }),
            });
            setSostenerActiva(!sostenerActiva);
            await cargarDetalleEmpresa(empresaSeleccionada.id);
        } catch (e) {
            console.error("Error activando/desactivando SOSTENER:", e);
            alert("Hubo un error al cambiar el estado de SOSTENER.");
        } finally {
            setIsSyncing(false);
        }
    };

    // ── Helpers de UI ─────────────────────────────────────────────────────
    const getResumenDe = (empresaId) => resumenTodas.find(r => r.empresa_id === empresaId);

    const formulariosDocente = formulariosDisponibles.filter(f => f.rol_destino === "DOCENTE" || f.rol_destino === "TODOS");
    const formulariosDirectivo = formulariosDisponibles.filter(f => f.rol_destino === "DIRECTIVO" || f.rol_destino === "TODOS");

    const retosDeFaseActiva = retosDisponibles.filter(r => r.fase === faseActiva);
    const retosAsignadosFaseActiva = detalleAsignacion?.retos_por_fase?.[faseActiva] || [];

    return (
        <div className="as-page">

            {/* ══════════════════ VISTA: LISTA DE EMPRESAS ══════════════════ */}
            {!empresaSeleccionada && (
                <div className="as-card">
                    <div className="as-card-header">
                        <h3>Asignación de Retos y Formularios por Empresa</h3>
                    </div>
                    <p className="as-intro-text">
                        Selecciona una empresa para asignarle el formulario de diagnóstico (Auditar) y los retos de cada fase. El porcentaje indica cuánto del Marco ATLAS tiene contenido asignado.
                    </p>

                    {isLoading ? (
                        <div className="as-loader-wrap"><div className="as-loader" /></div>
                    ) : empresas.length === 0 ? (
                        <p className="as-empty-state">No hay empresas registradas. Crea una primero en Gestión de Empresas.</p>
                    ) : (
                        <div className="as-empresa-grid">
                            {empresas.map(emp => {
                                const resumen = getResumenDe(emp.id);
                                const pct = resumen?.porcentaje_total ?? 0;
                                return (
                                    <button key={emp.id} className="as-empresa-card" onClick={() => seleccionarEmpresa(emp)}>
                                        <div className="as-empresa-card-top">
                                            <span className="as-empresa-nombre">{emp.nombre}</span>
                                            <span className={`as-pct-badge ${pct === 100 ? "completo" : pct === 0 ? "vacio" : "parcial"}`}>
                                                {pct}%
                                            </span>
                                        </div>
                                        <div className="as-progress-bar-track">
                                            <div className="as-progress-bar-fill" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="as-mini-fases-row">
                                            {["AUDITAR", "TRANSFORMAR", "LIDERAR", "ASEGURAR", "SOSTENER"].map(fase => {
                                                const fasePct = resumen?.porcentajes_fase?.[fase] ?? 0;
                                                return (
                                                    <span key={fase} className={`as-mini-fase-dot ${fasePct >= 100 ? "ok" : fasePct > 0 ? "parcial" : "vacio"}`} title={`${fase}: ${fasePct}%`}>
                                                        {fase.charAt(0)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════ VISTA: DETALLE DE EMPRESA ══════════════════ */}
            {empresaSeleccionada && (
                <>
                    <div className="as-card">
                        <div className="as-card-header">
                            <div className="as-detalle-header-info">
                                <button className="as-btn-volver" onClick={volverALista}>← Volver</button>
                                <h3>{empresaSeleccionada.nombre}</h3>
                            </div>
                            {detalleAsignacion && (
                                <span className={`as-pct-badge-lg ${detalleAsignacion.porcentaje_total === 100 ? "completo" : "parcial"}`}>
                                    {detalleAsignacion.porcentaje_total}% asignado
                                </span>
                            )}
                        </div>

                        {isLoadingDetalle ? (
                            <div className="as-loader-wrap"><div className="as-loader" /></div>
                        ) : detalleAsignacion && (
                            <div className="as-fases-resumen-grid">
                                {["AUDITAR", "TRANSFORMAR", "LIDERAR", "ASEGURAR", "SOSTENER"]
                                    .filter(fase => detalleAsignacion.progreso_fases[fase])
                                    .map(fase => {
                                        const info = detalleAsignacion.progreso_fases[fase];
                                        return (
                                            <div key={fase} className={`as-fase-resumen-card ${info.completo ? "completo" : "incompleto"}`}>
                                                <span className="as-fase-resumen-nombre">{fase}</span>
                                                <span className="as-fase-resumen-pct">{info.porcentaje}%</span>
                                                <span className="as-fase-resumen-items">{info.items_asignados} asignado(s)</span>
                                                <span className="as-fase-resumen-peso">{info.peso_fase} pts huella</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>

                    {/* ── BLOQUE AUDITAR (formularios) ───────────────────────── */}
                    <div className="as-card">
                        <div className="as-card-header">
                            <h3>🔍 AUDITAR — Formulario de Diagnóstico</h3>
                        </div>
                        <p className="as-intro-text">
                            Marca los formularios que esta empresa debe usar. Se necesita al menos uno para DOCENTE y uno para DIRECTIVO para que la fase quede completa.
                        </p>

                        <div className="as-form-roles-grid">
                            <div className="as-form-rol-col">
                                <p className="as-form-rol-label">Para Docentes</p>
                                {formulariosDocente.length === 0 ? (
                                    <p className="as-empty-state-sm">No hay formularios para DOCENTE creados aún.</p>
                                ) : formulariosDocente.map(form => (
                                    <label key={form.id} className="as-checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={formularioEstaAsignado(form.id)}
                                            onChange={() => toggleFormulario(form)}
                                            disabled={isSyncing}
                                        />
                                        <span>{form.titulo}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="as-form-rol-col">
                                <p className="as-form-rol-label">Para Directivos</p>
                                {formulariosDirectivo.length === 0 ? (
                                    <p className="as-empty-state-sm">No hay formularios para DIRECTIVO creados aún.</p>
                                ) : formulariosDirectivo.map(form => (
                                    <label key={form.id} className="as-checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={formularioEstaAsignado(form.id)}
                                            onChange={() => toggleFormulario(form)}
                                            disabled={isSyncing}
                                        />
                                        <span>{form.titulo}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── BLOQUE RETOS (Transformar/Liderar/Asegurar/Sostener) ── */}
                    <div className="as-card">
                        <div className="as-card-header">
                            <h3>Retos por Fase</h3>
                        </div>

                        <div className="as-fase-tabs">
                            {FASES_RETO.map(f => (
                                <button
                                    key={f.value}
                                    className={`as-fase-tab ${faseActiva === f.value ? "active" : ""}`}
                                    onClick={() => setFaseActiva(f.value)}
                                >
                                    {f.icon} {f.label}
                                    <span className="as-fase-tab-peso">{f.peso}pts</span>
                                </button>
                            ))}
                        </div>

                        {faseActiva === "LIDERAR" ? (
                            <div className="as-liderar-switch-box" style={{ padding: "20px", textAlign: "center" }}>
                                <p className="as-intro-text">
                                    La fase LIDERAR usa el Laboratorio de Prompt Ético con misiones ya integradas en la plataforma. No se asignan retos: solo actívala para que los docentes de esta empresa puedan usarla.
                                </p>
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", marginTop: "20px" }}>
                                    <span style={{ color: !liderarActiva ? "#1e293b" : "#94a3b8", fontWeight: 600 }}>Desactivada</span>
                                    <label className="atlas-switch">
                                        <input type="checkbox" checked={liderarActiva} onChange={toggleLiderar} disabled={isSyncing} />
                                        <span className="atlas-slider round"></span>
                                    </label>
                                    <span style={{ color: liderarActiva ? "#22c55e" : "#94a3b8", fontWeight: 700 }}>Activada</span>
                                </div>
                                <p style={{ marginTop: "16px", fontSize: "0.85rem", color: "#64748b" }}>
                                    {liderarActiva
                                        ? "✅ ya pueden entrar al Laboratorio de Prompt Ético."
                                        : "⚠️ La fase está oculta para los docentes de esta empresa."}
                                </p>
                            </div>
                        ) : faseActiva === "ASEGURAR" ? (
                            <div className="as-liderar-switch-box" style={{ padding: "20px", textAlign: "center" }}>
                                <p className="as-intro-text">
                                    La fase ASEGURAR usa el Taller de Mejora (docentes) y el Módulo de Gobernanza (directivos), ya integrados en la plataforma. No se asignan retos: solo actívala para esta empresa.
                                </p>
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", marginTop: "20px" }}>
                                    <span style={{ color: !asegurarActiva ? "#1e293b" : "#94a3b8", fontWeight: 600 }}>Desactivada</span>
                                    <label className="atlas-switch">
                                        <input type="checkbox" checked={asegurarActiva} onChange={toggleAsegurar} disabled={isSyncing} />
                                        <span className="atlas-slider round"></span>
                                    </label>
                                    <span style={{ color: asegurarActiva ? "#22c55e" : "#94a3b8", fontWeight: 700 }}>Activada</span>
                                </div>
                                <p style={{ marginTop: "16px", fontSize: "0.85rem", color: "#64748b" }}>
                                    {asegurarActiva
                                        ? "✅ Los docentes y directivos ya pueden entrar a la fase ASEGURAR."
                                        : "⚠️ La fase está oculta para esta empresa."}
                                </p>
                            </div>
                        ) : faseActiva === "SOSTENER" ? (
                            <div className="as-liderar-switch-box" style={{ padding: "20px", textAlign: "center" }}>
                                <p className="as-intro-text">
                                    La fase SOSTENER usa el Radar de Autoevaluación (docentes) y el Cierre Institucional (directivos), ya integrados. No se asignan retos: solo actívala para esta empresa.
                                </p>
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", marginTop: "20px" }}>
                                    <span style={{ color: !sostenerActiva ? "#1e293b" : "#94a3b8", fontWeight: 600 }}>Desactivada</span>
                                    <label className="atlas-switch">
                                        <input type="checkbox" checked={sostenerActiva} onChange={toggleSostener} disabled={isSyncing} />
                                        <span className="atlas-slider round"></span>
                                    </label>
                                    <span style={{ color: sostenerActiva ? "#22c55e" : "#94a3b8", fontWeight: 700 }}>Activada</span>
                                </div>
                                <p style={{ marginTop: "16px", fontSize: "0.85rem", color: "#64748b" }}>
                                    {sostenerActiva
                                        ? "✅ Los docentes y directivos ya pueden entrar a la fase SOSTENER."
                                        : "⚠️ La fase está oculta para esta empresa."}
                                </p>
                            </div>
                        ) : retosDeFaseActiva.length === 0 ? (
                            <p className="as-empty-state">No hay retos creados para {faseActiva} aún. Ve al Creador de Retos para crearlos.</p>
                        ) : (
                            <div className="as-retos-grid">
                                {retosDeFaseActiva.map(reto => {
                                    const asignado = retoEstaAsignado(reto.id);
                                    return (
                                        <div key={reto.id} className={`as-reto-card ${asignado ? "asignado" : ""}`}>
                                            <label className="as-checkbox-item as-reto-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={asignado}
                                                    onChange={() => toggleReto(reto)}
                                                    disabled={isSyncing}
                                                />
                                                <div className="as-reto-info">
                                                    <span className="as-reto-nombre">{reto.nombre_reto}</span>
                                                    <span className="as-reto-meta">{reto.rol_destino} · {reto.peso_huella} pts · {reto.nivel_unesco || "—"}</span>
                                                </div>
                                            </label>
                                            {asignado && (
                                                <button
                                                    className="as-btn-reemplazar"
                                                    onClick={() => abrirReemplazo({ reto_plantilla_id: reto.id, fase: faseActiva })}
                                                >
                                                    🔄 Cambiar
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {faseActiva !== "LIDERAR" && faseActiva !== "ASEGURAR" && faseActiva !== "SOSTENER" && retosAsignadosFaseActiva.length > 0 && (
                            <div className="as-asignados-resumen">
                                <p className="as-asignados-resumen-title">✅ Asignados en {faseActiva} ({retosAsignadosFaseActiva.length})</p>
                                <div className="as-asignados-chips">
                                    {retosAsignadosFaseActiva.map(r => (
                                        <span key={r.asignacion_id} className="as-chip">{r.nombre_reto}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ══════════════════ MODAL: REEMPLAZAR RETO ══════════════════ */}
            {reemplazando && (
                <div className="as-modal-overlay">
                    <div className="as-modal">
                        <div className="as-modal-header">
                            <h2>Cambiar reto asignado</h2>
                            <button className="as-modal-close" onClick={() => setReemplazando(null)}>✕</button>
                        </div>
                        <div className="as-modal-body">
                            <p className="as-intro-text">Elige el nuevo reto que reemplazará al actual en la fase {reemplazando.fase}:</p>
                            <div className="as-reemplazo-lista">
                                {retosDisponibles
                                    .filter(r => r.fase === reemplazando.fase && r.id !== reemplazando.reto_plantilla_id)
                                    .map(r => (
                                        <button key={r.id} className="as-reemplazo-item" onClick={() => confirmarReemplazo(r.id)} disabled={isSyncing}>
                                            <span className="as-reto-nombre">{r.nombre_reto}</span>
                                            <span className="as-reto-meta">{r.rol_destino} · {r.peso_huella} pts</span>
                                        </button>
                                    ))}
                                {retosDisponibles.filter(r => r.fase === reemplazando.fase && r.id !== reemplazando.reto_plantilla_id).length === 0 && (
                                    <p className="as-empty-state-sm">No hay otros retos disponibles en esta fase.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
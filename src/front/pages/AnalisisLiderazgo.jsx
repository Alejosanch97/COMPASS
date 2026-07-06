import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/AnalisisLiderazgo.css";

const AnalisisLiderazgo = ({ userData, apiFetch, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDocentes: 0,
        cumplimiento: { auditar: 0, transformar: 0, liderar: 0 },
        riesgos: { etica: 0, privacidad: 0, agencia: 0, cognitiva: 0, altoRiesgoTotal: 0 },
        pendientesPorFase: { auditar: 0, transformar: 0, auditarIds: [], transformarIds: [] },
        rankingCritico: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const data = await apiFetch("/api/liderar/dashboard-directivo");
                if (data) {
                    setStats({
                        totalDocentes: data.totalDocentes || 0,
                        cumplimiento: data.cumplimiento || { auditar: 0, transformar: 0, liderar: 0 },
                        riesgos: data.riesgos || { etica: 0, privacidad: 0, agencia: 0, cognitiva: 0, altoRiesgoTotal: 0 },
                        pendientesPorFase: data.pendientesPorFase || { auditar: 0, transformar: 0, auditarIds: [], transformarIds: [] },
                        rankingCritico: data.rankingCritico || []
                    });
                }
            } catch (error) {
                console.error("Error Dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const registrarAccionGobernanza = async (accion, targetKey = "INSTITUCIONAL", dimension = "GENERAL") => {
        try {
            await apiFetch("/api/liderar/seguimiento", {
                method: 'POST',
                body: JSON.stringify({
                    accion_activada: accion,
                    dimension_priorizada: dimension,
                    docente_mentor_key: targetKey,
                    riesgo_alto_actual: `${stats.riesgos.altoRiesgoTotal}%`
                })
            });
        } catch (e) { console.error("Error al registrar seguimiento", e); }
    };

    const handleAction = (tipo) => {
        if (tipo === 'Recordatorios') {
            const todosRezagados = [...new Set([...stats.pendientesPorFase.auditarIds, ...stats.pendientesPorFase.transformarIds])];
            const keysString = todosRezagados.join(", ");

            Swal.fire({
                title: 'Notificar Pendientes',
                text: `Se notificará a: ${keysString}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#c5a059',
                confirmButtonText: 'Sí, notificar'
            }).then((res) => {
                if(res.isConfirmed) {
                    registrarAccionGobernanza("NOTIFICACIÓN REZAGADOS", keysString, "CUMPLIMIENTO");
                    Swal.fire('Enviado', 'Los registros individuales han sido creados.', 'success');
                }
            });
        }

        if (tipo === 'Reporte') {
            generarReporteEstrategico();
        }

        if (tipo === 'Mentoría') {
            const keysRanking = stats.rankingCritico.map(p => p.id).join(", ");
            Swal.fire({
                title: 'Sesión de Mentoría',
                text: `Se activará protocolo para: ${keysRanking}`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonColor: '#c5a059',
                confirmButtonText: 'Activar Protocolo'
            }).then(res => {
                if(res.isConfirmed) {
                    registrarAccionGobernanza("AYUDA PRESENCIAL OFRECIDA", keysRanking, "PEDAGÓGICA");
                    Swal.fire('Activado', 'Protocolo registrado exitosamente.', 'success');
                }
            });
        }
    };

    const generarReporteEstrategico = () => {
        const { transformar, auditar } = stats.cumplimiento;
        const { altoRiesgoTotal, etica, privacidad, agencia, cognitiva } = stats.riesgos;

        const getBadge = (val, meta) => val >= meta
            ? `<span class="report-badge success">ESTABLE</span>`
            : `<span class="report-badge danger">CRÍTICO</span>`;

        const commonHeader = `
            <div class="report-container">
                <div class="report-section">
                    <div class="report-section-title">🧭 CONTEXTO ESTRATÉGICO</div>
                    <p>Auditoría automatizada de fuentes ATLAS 2026. Este informe analiza la brecha entre la adopción técnica y la integridad pedagógica institucional.</p>
                </div>

                <div class="report-grid">
                    <div class="report-mini-card">
                        <small>ADOPCIÓN</small>
                        <strong>${auditar}%</strong>
                    </div>
                    <div class="report-mini-card">
                        <small>MADUREZ</small>
                        <strong>${transformar}%</strong>
                    </div>
                    <div class="report-mini-card ${altoRiesgoTotal > 15 ? 'warning' : ''}">
                        <small>RIESGO I.A.</small>
                        <strong>${altoRiesgoTotal}%</strong>
                    </div>
                </div>

                <div class="report-section">
                    <div class="report-section-title">🧠 SALUD DEL PROMPTING ÉTICO</div>
                    <table class="report-table">
                        <tr><td>Ética y Equidad</td><td><strong>${etica}</strong></td><td>${getBadge(etica, 4)}</td></tr>
                        <tr><td>Privacidad de Datos</td><td><strong>${privacidad}</strong></td><td>${getBadge(privacidad, 4)}</td></tr>
                        <tr><td>Agencia Docente</td><td><strong>${agencia}</strong></td><td>${getBadge(agencia, 3.5)}</td></tr>
                        <tr><td>Andamiaje Cognitivo</td><td><strong>${cognitiva}</strong></td><td>${getBadge(cognitiva, 3.5)}</td></tr>
                    </table>
                </div>
        `;

        let statusContent = "";
        if (transformar >= 80 && altoRiesgoTotal < 10) {
            statusContent = `
                <div class="report-status-box success">
                    <h3>🟢 INFORME 3: Excelencia Alcanzada</h3>
                    <p><strong>🎯 Plan Estratégico:</strong> Se autoriza el despliegue de la Fase ASEGURAR. La institución demuestra una cultura de IA centrada en el humano con riesgos mínimos de sesgo y alucinación.</p>
                    <p><strong>✅ Acción:</strong> Documentar este periodo como 'Caso de Éxito' y habilitar certificaciones para el 100% del staff.</p>
                </div>`;
        } else if (transformar >= 70) {
            statusContent = `
                <div class="report-status-box warning">
                    <h3>🟡 INFORME 2: Madurez en Transición</h3>
                    <p><strong>🚨 Diagnóstico:</strong> Existe un avance técnico notable, pero la "Agencia Humana" fluctúa. Se detectan patrones de delegación excesiva en tareas evaluativas.</p>
                    <p><strong>🎯 Plan Estratégico:</strong> Implementar Círculos de Confianza para docentes con puntajes de Agencia < 3.0. No habilitar ASEGURAR hasta reducir el Riesgo IA al 10%.</p>
                </div>`;
        } else {
            statusContent = `
                <div class="report-status-box danger">
                    <h3>🔴 INFORME 1: Intervención Urgente</h3>
                    <p><strong>⚠️ Alerta Crítica:</strong> La brecha de cumplimiento es superior al 30%. Se evidencia una alta vulnerabilidad en Privacidad y una degradación del Andamiaje Cognitivo (Sustitución en lugar de Aumento).</p>
                    <p><strong>🎯 Plan de Choque:</strong> Suspender despliegue de nuevas herramientas. Iniciar auditoría obligatoria de prompts para Teacher Keys identificados en el Panel 4 y ejecutar micro-capacitación de remediación en 72 horas.</p>
                </div>`;
        }

        Swal.fire({
            title: 'Análisis Estratégico ATLAS 2026',
            html: commonHeader + statusContent + `</div>`,
            width: '580px',
            confirmButtonText: 'CONFIRMAR LECTURA',
            confirmButtonColor: '#c5a059'
        });
        registrarAccionGobernanza("EXPORTACIÓN REPORTE ESTRATÉGICO");
    };

    const verListaPendientes = (fase) => {
        const lista = fase === 'AUDITAR' ? stats.pendientesPorFase.auditarIds : stats.pendientesPorFase.transformarIds;
        Swal.fire({
            title: `Pendientes en ${fase}`,
            html: `<div style="max-height: 300px; overflow-y: auto; text-align: left;">
                    ${lista.map(id => `<div style="padding:5px; border-bottom:1px solid #eee;">• ${id}</div>`).join('')}
                   </div>`,
            confirmButtonColor: '#c5a059'
        });
    };

    const canUnlockAsegurar = stats.cumplimiento.transformar >= 80;

    if (loading) return (
        <div className="dash-lider-2026-loader">
            <div className="dash-lider-2026-spinner"></div>
            <p>SINCRONIZANDO INTELIGENCIA INSTITUCIONAL...</p>
        </div>
    );

    return (
        <div className="dash-lider-2026-container">
            <header className="dash-lider-2026-header">
                <div className="dash-lider-2026-header-left">
                    <button className="dash-lider-2026-btn-back" onClick={() => onNavigate('fase_liderar')}>
                        <span>←</span> Volver
                    </button>
                    <h1>Consola Pedagógica de Liderazgo</h1>
                </div>
                <div className="dash-lider-2026-header-right">
                    <div className="dash-lider-2026-user-pill">
                        <span className="dash-lider-2026-role-tag">DIRECTIVO</span>
                        <strong>{userData.nombre_completo}</strong>
                    </div>
                </div>
            </header>

            <div className="dash-lider-2026-main-grid">
                <section className="dash-lider-2026-card">
                    <div className="dash-lider-2026-card-head">
                        <span className="dash-lider-2026-panel-id">Panel 1</span>
                        <h3>Cumplimiento Institucional</h3>
                    </div>
                    <div className="dash-lider-2026-metrics-row">
                        <div className="dash-lider-2026-stat" onClick={() => verListaPendientes('AUDITAR')} style={{cursor:'pointer'}}>
                            <h2 style={{color: '#22c55e'}}>{stats.cumplimiento.auditar}%</h2>
                            <p>AUDITAR</p>
                            <small>{stats.pendientesPorFase.auditar} Pendientes 🔍</small>
                        </div>
                        <div className="dash-lider-2026-stat" onClick={() => verListaPendientes('TRANSFORMAR')} style={{cursor:'pointer'}}>
                            <h2 style={{color: '#3b82f6'}}>{stats.cumplimiento.transformar}%</h2>
                            <p>TRANSFORMAR</p>
                            <small>{stats.pendientesPorFase.transformar} Pendientes 🔍</small>
                        </div>
                        <div className="dash-lider-2026-stat">
                            <h2 style={{color: stats.riesgos.altoRiesgoTotal > 15 ? '#ef4444' : '#c5a059'}}>
                                {stats.riesgos.altoRiesgoTotal}%
                            </h2>
                            <p>RIESGO ALTO</p>
                            <small>Meta: &lt; 10%</small>
                        </div>
                    </div>
                    <div className={`dash-lider-2026-alert ${canUnlockAsegurar ? 'success' : 'warning'}`}>
                        <p>{canUnlockAsegurar
                            ? "✅ Metas cumplidas. Puede formalizar la gobernanza."
                            : "⚠️ Se requiere 80% en Transformar para habilitar ASEGURAR."}
                        </p>
                        <button
                            className={`dash-lider-2026-btn-unlock ${!canUnlockAsegurar ? 'disabled' : ''}`}
                            disabled={!canUnlockAsegurar}
                            onClick={() => onNavigate('fase_asegurar')}
                        >
                            {canUnlockAsegurar ? "ACTIVAR FASE ASEGURAR" : "FASE ASEGURAR BLOQUEADA"}
                        </button>
                    </div>
                </section>

                <section className="dash-lider-2026-card">
                    <div className="dash-lider-2026-card-head">
                        <span className="dash-lider-2026-panel-id">Panel 2</span>
                        <h3>Salud del Prompting Ético</h3>
                    </div>
                    <div className="dash-lider-2026-bars-stack">
                        {[
                            { label: 'Ética y Equidad', val: stats.riesgos.etica, color: '#8b5cf6' },
                            { label: 'Privacidad de Datos', val: stats.riesgos.privacidad, color: '#06b6d4' },
                            { label: 'Agencia del Docente', val: stats.riesgos.agencia, color: '#f59e0b' },
                            { label: 'Andamiaje Cognitivo', val: stats.riesgos.cognitiva, color: '#ec4899' }
                        ].map(dim => (
                            <div key={dim.label} className="dash-lider-2026-bar-group">
                                <div className="dash-lider-2026-bar-label">
                                    <span>{dim.label}</span>
                                    <strong>{dim.val} / 5.0</strong>
                                </div>
                                <div className="dash-lider-2026-bar-bg">
                                    <div
                                        className="dash-lider-2026-bar-fill"
                                        style={{ width: `${(dim.val / 5) * 100}%`, backgroundColor: dim.color }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="dash-lider-2026-card-pair full-width" style={{display:'flex', gap:'20px'}}>
                    <section className="dash-lider-2026-card" style={{flex: 1.2}}>
                        <div className="dash-lider-2026-card-head">
                            <span className="dash-lider-2026-panel-id">Panel 3</span>
                            <h3>Análisis de Gobernanza Institucional</h3>
                        </div>
                        <div className="dash-lider-2026-table-wrapper">
                            <table className="dash-lider-2026-table">
                                <thead>
                                    <tr>
                                        <th>Indicador Crítico</th>
                                        <th>¿Qué mide?</th>
                                        <th>Estado</th>
                                        <th>Decisión Sugerida</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Agencia Humana</strong></td>
                                        <td><small>Control docente vs delegación</small></td>
                                        <td>
                                            <span className={`dash-lider-2026-dot ${stats.riesgos.agencia < 3.5 ? 'red' : 'green'}`}></span>
                                        </td>
                                        <td><strong>{stats.riesgos.agencia < 3.5 ? 'Capacitación' : 'Estable'}</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Privacidad</strong></td>
                                        <td><small>Protección datos sensibles</small></td>
                                        <td>
                                            <span className={`dash-lider-2026-dot ${stats.riesgos.privacidad < 4 ? 'orange' : 'green'}`}></span>
                                        </td>
                                        <td><strong>{stats.riesgos.privacidad < 4 ? 'Auditoría' : 'Seguro'}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="dash-lider-2026-card" style={{flex: 1.3}}>
                        <div className="dash-lider-2026-card-head">
                            <span className="dash-lider-2026-panel-id">Panel 4</span>
                            <h3>Ranking de Intervención (Resultados Críticos)</h3>
                        </div>
                        <div className="dash-lider-2026-table-wrapper">
                            <table className="dash-lider-2026-table">
                                <thead>
                                    <tr>
                                        <th>Teacher Key</th>
                                        <th>Avg</th>
                                        <th>Falla Crítica</th>
                                        <th>Riesgo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.rankingCritico.map((prof, idx) => (
                                        <tr key={idx}>
                                            <td>{prof.id}</td>
                                            <td>{prof.promedio}</td>
                                            <td><small>{prof.falla}</small></td>
                                            <td><span className={`status-pill ${prof.riesgo.toLowerCase()}`}>{prof.riesgo}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <section className="dash-lider-2026-card full-width">
                    <div className="dash-lider-2026-card-head">
                        <span className="dash-lider-2026-panel-id">Panel 5</span>
                        <h3>Consola de Activación y Seguimiento</h3>
                    </div>
                    <div className="dash-lider-2026-actions-grid">
                        <button onClick={() => handleAction('Recordatorios')} className="dash-lider-2026-btn-action">
                            <div className="dash-lider-2026-btn-icon">🔔</div>
                            <div className="dash-lider-2026-btn-text">
                                <strong>Notificar Pendientes</strong>
                                <span>Recordatorio a docentes rezagados</span>
                            </div>
                        </button>
                        <button onClick={() => handleAction('Reporte')} className="dash-lider-2026-btn-action">
                            <div className="dash-lider-2026-btn-icon">📄</div>
                            <div className="dash-lider-2026-btn-text">
                                <strong>Exportar Reporte</strong>
                                <span>Análisis estratégico consolidado</span>
                            </div>
                        </button>
                        <button onClick={() => handleAction('Mentoría')} className="dash-lider-2026-btn-action">
                            <div className="dash-lider-2026-btn-icon">🤝</div>
                            <div className="dash-lider-2026-btn-text">
                                <strong>Sesión de Mentoría</strong>
                                <span>Activar ayuda presencial</span>
                            </div>
                        </button>
                    </div>
                </section>
            </div>

            <footer className="dash-lider-2026-footer">
                ATLAS 2026 — Inteligencia Institucional aplicada a la Educación
            </footer>
        </div>
    );
};

export default AnalisisLiderazgo;
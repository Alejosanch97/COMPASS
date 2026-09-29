import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../Styles/responderFormularios.css';
import '../Styles/ejecutarReto.css';
import '../Styles/responderAuditar.css';
import Swal from "sweetalert2";

/**
 * ResponderFormularios v3
 * - La lista de instrumentos (Pendientes / Completados) queda igual.
 * - Responder usa el MISMO diseño de las misiones de Transformar (ejecutarReto.css):
 *   cabecera con barra de recorrido, estaciones, tarjetas, navegación y aviso.
 * - Las estaciones se arman solas con los prefijos del enunciado
 *   ("DIMENSIÓN 1 — INTEGRACIÓN PEDAGÓGICA.", "REFLEXIÓN ABIERTA.", etc.).
 * - El avance se guarda en el dispositivo y se puede retomar.
 * - El cálculo de puntos y el envío al backend NO cambian.
 */

const TIEMPO_POR_TIPO = { MULTIPLE: 0.4, SELECT: 0.4, CHECKBOX: 0.6, ORDEN: 1, PARRAFO: 2.5, ABIERTA: 1, ESCALA: 0.3, SLIDER: 0.3 };
const RE_ETIQUETA = /^([A-ZÁÉÍÓÚÜÑ0-9][A-ZÁÉÍÓÚÜÑ0-9 \-—–:]{2,}?)\.\s+([\s\S]*)$/;
const RE_EXCLUSIVA = /^(ningun|no aplica|no identific|no se aplic|no lo he)/i;

const FASES_RECORRIDO = [
    { id: "comienza", label: "Comienza", flex: 0.8 },
    { id: "responde", label: "Responde", flex: 3 },
    { id: "envia", label: "Envía", flex: 0.8 },
];

// ── Iconos de línea (los mismos de EjecutarReto) ──
const TRAZOS = {
    guardar: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></>,
    atras: <><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></>,
    adelante: <><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></>,
    check: <path d="M20 6L9 17l-5-5" />,
};
const Icono = ({ nombre, size = 18, className = "" }) => (
    <svg className={`atlas-icon ${className}`} width={size} height={size} viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {TRAZOS[nombre]}
    </svg>
);

// ── Utilidades ──
const cleanOptionText = (text) => (text ? String(text).replace(/\s*\([^)]+\)$/, "").trim() : "");

const splitOptions = (opciones) => {
    if (!opciones) return [];
    if (Array.isArray(opciones)) return opciones;
    return String(opciones).split(/(?<!\d),/).map(opt => opt.trim());
};

const capitalizar = (t = "") => {
    const s = t.toLowerCase();
    return (s.charAt(0).toUpperCase() + s.slice(1)).replace(/\b(ia|ai)\b/gi, m => m.toUpperCase());
};

const partirEtiqueta = (texto = "") => {
    const m = String(texto).match(RE_ETIQUETA);
    return m ? { etiqueta: m[1].trim(), texto: m[2].trim() } : { etiqueta: null, texto: String(texto) };
};

const describirEtiqueta = (et) => {
    const m = et.match(/^DIMENSI[ÓO]N\s+(\d+)\s*[—–\-:]\s*(.+)$/i);
    if (m) return { eyebrow: `Dimensión ${m[1]}`, titulo: capitalizar(m[2]) };
    return { eyebrow: null, titulo: capitalizar(et) };
};

// Agrupa las preguntas en estaciones según sus etiquetas
const construirEstaciones = (preguntas = []) => {
    const bruto = [];
    let actual = null;
    preguntas.forEach((q) => {
        const { etiqueta, texto } = partirEtiqueta(q.texto_pregunta);
        const item = { ...q, _texto: texto };
        if (actual && etiqueta && actual.etiquetas.includes(etiqueta)) { actual.items.push(item); return; }
        if (etiqueta || !actual) {
            actual = { etiquetas: etiqueta ? [etiqueta] : [], items: [item] };
            bruto.push(actual);
        } else {
            actual.items.push(item);
        }
    });

    // Une estaciones consecutivas de una sola pregunta
    const unidas = [];
    bruto.forEach((e) => {
        const prev = unidas[unidas.length - 1];
        if (prev && prev._suelta && e.items.length === 1) {
            prev.items.push(...e.items);
            prev.etiquetas.push(...e.etiquetas);
            return;
        }
        unidas.push({ etiquetas: [...e.etiquetas], items: [...e.items], _suelta: e.items.length === 1 });
    });

    return unidas.map((e) => {
        if (!e.etiquetas.length) return { ...e, eyebrow: "Punto de partida", titulo: "Tu contexto" };
        const unicas = [...new Set(e.etiquetas)];
        if (unicas.length === 1) return { ...e, ...describirEtiqueta(unicas[0]) };
        return { ...e, eyebrow: unicas.map(u => describirEtiqueta(u).titulo).join(", "), titulo: "Complementos del diagnóstico" };
    });
};

// Mismo cálculo de puntos de siempre (la calificación no cambia)
const construirPayload = (preguntas, respuestas) => preguntas.map(q => {
    const rawValue = respuestas[q.id];
    let answerString = "";
    let totalPoints = 0;

    if (q.tipo_respuesta === "ORDEN") {
        answerString = (rawValue || []).map((v, i) => `${i + 1}. ${cleanOptionText(v)}`).join(", ");
        totalPoints = parseFloat(q.puntaje_asociado || 0);
    } else if (Array.isArray(rawValue)) {
        answerString = rawValue.map(v => cleanOptionText(v)).join(", ");
        rawValue.forEach(v => {
            const match = String(v).match(/\(([^)]+)\)$/);
            if (match) totalPoints += parseFloat(match[1].replace(',', '.'));
        });
    } else {
        answerString = q.tipo_respuesta === "ESCALA" ? `Nivel ${rawValue}` : cleanOptionText(rawValue);
        const match = String(rawValue).match(/\(([^)]+)\)$/);
        if (match) {
            totalPoints = parseFloat(match[1].replace(',', '.'));
        } else if (q.tipo_respuesta === "ESCALA") {
            totalPoints = parseFloat(rawValue || 0);
        } else {
            totalPoints = parseFloat(q.puntaje_asociado || 0);
        }
    }
    return { pregunta_id: q.id, valor_respondido: answerString, puntos_ganados: totalPoints };
});

// ══════════════════════════════════════════════════════════════════
// Recorrido de un formulario (diseño de misión)
// ══════════════════════════════════════════════════════════════════
const RecorridoFormulario = ({ form, borradorKey, enviando, onSalir, onEnviar }) => {
    const preguntas = useMemo(() => form.questions || [], [form.questions]);
    const estaciones = useMemo(() => construirEstaciones(preguntas), [preguntas]);

    // Pasos: inicio → una estación por paso → envío
    const pasos = useMemo(() => [
        { id: "inicio", fase: "comienza" },
        ...estaciones.map((e, i) => ({ id: `est_${i}`, fase: "responde", est: i })),
        { id: "envio", fase: "envia" },
    ], [estaciones]);

    const numero = useMemo(() => {
        const m = {};
        preguntas.forEach((q, i) => { m[q.id] = i + 1; });
        return m;
    }, [preguntas]);

    const pasoDePregunta = useMemo(() => {
        const m = {};
        estaciones.forEach((e, i) => e.items.forEach(q => { m[q.id] = i + 1; }));
        return m;
    }, [estaciones]);

    const [respuestas, setRespuestas] = useState({});
    const [paso, setPaso] = useState(0);
    const [aviso, setAviso] = useState(null);
    const [ultimoGuardado, setUltimoGuardado] = useState(null);

    const inicioRef = useRef(null);
    const avisoTimer = useRef(null);
    const celebradas = useRef(new Set());
    const restaurado = useRef(false);

    useEffect(() => () => clearTimeout(avisoTimer.current), []);

    // ¿Hay un avance guardado en este dispositivo?
    useEffect(() => {
        if (restaurado.current) return;
        restaurado.current = true;
        let guardado = null;
        try { guardado = JSON.parse(localStorage.getItem(borradorKey) || "null"); } catch (e) { guardado = null; }
        const ids = new Set(preguntas.map(q => String(q.id)));
        const previas = guardado?.respuestas
            ? Object.fromEntries(Object.entries(guardado.respuestas).filter(([k]) => ids.has(String(k))))
            : {};
        if (!Object.keys(previas).length) return;
        Swal.fire({
            title: "Tienes un avance guardado",
            text: `Respondiste ${Object.keys(previas).length} de ${preguntas.length} preguntas la última vez.`,
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Continuar donde quedé",
            cancelButtonText: "Empezar de nuevo",
            confirmButtonColor: "#c5a059",
        }).then(r => {
            if (r.isConfirmed) {
                setRespuestas(previas);
                setPaso(Math.min(Math.max(1, guardado.paso || 1), pasos.length - 1));
            } else {
                try { localStorage.removeItem(borradorKey); } catch (e) { /* sin almacenamiento */ }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Guarda el avance en cada cambio
    useEffect(() => {
        if (!Object.keys(respuestas).length) return;
        try {
            localStorage.setItem(borradorKey, JSON.stringify({ respuestas, paso, t: Date.now() }));
            setUltimoGuardado(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
        } catch (e) { /* sin almacenamiento */ }
    }, [respuestas, paso, borradorKey]);

    // Subir al inicio en cada cambio de paso
    useEffect(() => {
        const el = inicioRef.current;
        if (!el) return;
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }, [paso]);

    const respondida = (q) => {
        const v = respuestas[q.id];
        if (q.tipo_respuesta === "ORDEN") return Array.isArray(v) && v.length === splitOptions(q.opciones_seleccion).length;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "string") return v.trim() !== "";
        return v !== undefined && v !== null && v !== "";
    };

    const totalRespondidas = preguntas.filter(respondida).length;
    const pct = preguntas.length ? Math.round((totalRespondidas / preguntas.length) * 100) : 0;
    const pendientes = preguntas.filter(q => !respondida(q));
    const minutosTotal = Math.max(1, Math.round(preguntas.reduce((a, q) => a + (TIEMPO_POR_TIPO[q.tipo_respuesta] ?? 0.6), 0)));
    const primerPasoPendiente = pendientes.length ? pasoDePregunta[pendientes[0].id] : -1;

    const pasoInfo = pasos[paso] || {};
    const estacion = pasoInfo.est !== undefined ? estaciones[pasoInfo.est] : null;

    const estadoFase = (faseId) => {
        const idxs = pasos.map((p, i) => (p.fase === faseId ? i : -1)).filter(i => i >= 0);
        const activa = pasoInfo.fase === faseId;
        let pctFase = 0;
        let detalle = "";
        if (faseId === "comienza") {
            pctFase = paso > 0 ? 100 : 0;
            if (activa) detalle = "Presentación";
        } else if (faseId === "responde") {
            pctFase = pct;
            if (activa) detalle = `Estación ${pasoInfo.est + 1} de ${estaciones.length}`;
        } else {
            pctFase = activa ? 50 : 0;
            if (activa) detalle = "Revisión y envío";
        }
        const primerPaso = faseId === "responde" && primerPasoPendiente > 0 ? primerPasoPendiente : idxs[0];
        return { pct: pctFase, activa, detalle, primerPaso };
    };

    const mostrarAviso = (titulo) => {
        clearTimeout(avisoTimer.current);
        setAviso({ id: Date.now(), titulo, detalle: `Llevas ${pct}% del diagnóstico` });
        avisoTimer.current = setTimeout(() => setAviso(null), 2400);
    };

    const irAPaso = (destino) => {
        const i = Math.max(0, Math.min(pasos.length - 1, destino));
        if (i > paso && estacion && estacion.items.every(respondida) && !celebradas.current.has(paso)) {
            celebradas.current.add(paso);
            mostrarAviso(estacion.titulo);
        }
        setPaso(i);
    };

    // ── Acciones de respuesta ──
    const elegir = (q, valor) => setRespuestas(prev => ({ ...prev, [q.id]: valor }));

    const alternarCasilla = (q, opt) => {
        setRespuestas(prev => {
            const actual = prev[q.id] || [];
            let nuevo;
            if (actual.includes(opt)) nuevo = actual.filter(v => v !== opt);
            else if (RE_EXCLUSIVA.test(cleanOptionText(opt))) nuevo = [opt];
            else nuevo = [...actual.filter(v => !RE_EXCLUSIVA.test(cleanOptionText(v))), opt];
            return { ...prev, [q.id]: nuevo };
        });
    };

    const alternarOrden = (q, opt) => {
        setRespuestas(prev => {
            const actual = prev[q.id] || [];
            const nuevo = actual.includes(opt) ? actual.filter(v => v !== opt) : [...actual, opt];
            return { ...prev, [q.id]: nuevo };
        });
    };

    const guardarAhora = () => {
        try {
            localStorage.setItem(borradorKey, JSON.stringify({ respuestas, paso, t: Date.now() }));
            setUltimoGuardado(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
        } catch (e) { /* sin almacenamiento */ }
    };

    // ── Render de cada tipo de respuesta ──
    const renderRespuesta = (q) => {
        const ops = splitOptions(q.opciones_seleccion);
        const valor = respuestas[q.id];

        if (q.tipo_respuesta === "ESCALA") {
            return (
                <div className="rf-escala">
                    <div className="pills-container">
                        {[1, 2, 3, 4, 5].map(n => (
                            <label key={n} className={`pill-option ${Number(valor) === n ? "selected" : ""}`}>
                                <input type="radio" name={`q_${q.id}`} checked={Number(valor) === n} onChange={() => elegir(q, n)} />
                                <span>{n}</span>
                            </label>
                        ))}
                    </div>
                    <div className="rf-escala-etiquetas"><span>Totalmente en desacuerdo</span><span>Totalmente de acuerdo</span></div>
                </div>
            );
        }

        if (q.tipo_respuesta === "SLIDER") {
            const min = Number(q.opciones_seleccion?.min ?? 1);
            const max = Number(q.opciones_seleccion?.max ?? 5);
            return (
                <div className="rf-slider">
                    <input type="range" min={min} max={max} value={valor ?? min} onChange={(e) => elegir(q, e.target.value)} />
                    <div className="rf-escala-etiquetas"><span>{min}</span><strong>{valor ?? "Mueve el control"}</strong><span>{max}</span></div>
                </div>
            );
        }

        if (["PARRAFO", "ABIERTA"].includes(q.tipo_respuesta)) {
            const texto = valor || "";
            return (
                <div className="textarea-group-premium">
                    <textarea
                        value={texto}
                        onChange={(e) => elegir(q, e.target.value)}
                        placeholder={q.tipo_respuesta === "PARRAFO"
                            ? "Cuéntalo con un caso real: qué hiciste, con quién y qué pasó."
                            : "Escribe tu respuesta"}
                    />
                    <div className="rf-contador">
                        <span>
                            {q.tipo_respuesta === "PARRAFO" && texto.trim().length < 60
                                ? "Entre más concreto, más útil será tu informe."
                                : "Tu respuesta aparecerá en tu informe tal como la escribes."}
                        </span>
                        <span>{texto.trim().length} caracteres</span>
                    </div>
                </div>
            );
        }

        if (q.tipo_respuesta === "ORDEN") {
            const orden = valor || [];
            return (
                <div className="options-vertical-premium">
                    <p className="rf-ayuda">Toca las opciones en orden, empezando por la más importante para ti.</p>
                    {ops.map(opt => {
                        const lugar = orden.indexOf(opt);
                        return (
                            <button key={opt} type="button"
                                className={`check-label-row rf-orden-fila ${lugar !== -1 ? "is-sel" : ""}`}
                                onClick={() => alternarOrden(q, opt)}>
                                <span className="label-text">{cleanOptionText(opt)}</span>
                                {lugar !== -1 && <span className="rf-orden-badge">{lugar + 1}</span>}
                            </button>
                        );
                    })}
                    {orden.length > 0 && (
                        <button type="button" className="rf-link" onClick={() => elegir(q, [])}>Reiniciar el orden</button>
                    )}
                </div>
            );
        }

        if (q.tipo_respuesta === "CHECKBOX") {
            const sel = valor || [];
            return (
                <>
                    <p className="rf-ayuda">Puedes marcar varias.</p>
                    <div className="rf-opciones-grid">
                        {ops.map(opt => (
                            <label key={opt} className="check-label-row">
                                <input type="checkbox" checked={sel.includes(opt)} onChange={() => alternarCasilla(q, opt)} />
                                <span className="label-text">{cleanOptionText(opt)}</span>
                            </label>
                        ))}
                    </div>
                </>
            );
        }

        // MULTIPLE / SELECT / otros con opciones
        return (
            <div className="rf-opciones-grid">
                {ops.map(opt => (
                    <label key={opt} className="check-label-row">
                        <input type="radio" name={`q_${q.id}`} checked={valor === opt} onChange={() => elegir(q, opt)} />
                        <span className="label-text">{cleanOptionText(opt)}</span>
                    </label>
                ))}
            </div>
        );
    };

    const siguientePaso = pasos[paso + 1];
    const textoSiguiente = paso === 0 ? "Comenzar"
        : siguientePaso?.id === "envio" ? "Ir al envío"
            : "Siguiente estación";
    const minutosEstacion = estacion
        ? Math.max(1, Math.round(estacion.items.reduce((a, q) => a + (TIEMPO_POR_TIPO[q.tipo_respuesta] ?? 0.6), 0)))
        : 0;

    return (
        <div className="atlas-unique-page-wrapper">
            <main className="atlas-unique-main-content" ref={inicioRef}>

                {aviso && (
                    <div className="atlas-toast" key={aviso.id} role="status" aria-live="polite">
                        <span className="atlas-toast-check"><Icono nombre="check" size={16} /></span>
                        <div className="atlas-toast-text">
                            <strong>{aviso.titulo}: estación completa</strong>
                            <span>{aviso.detalle}</span>
                        </div>
                        <span className="atlas-toast-bar" />
                    </div>
                )}

                {/* CABECERA + RECORRIDO */}
                <div className="atlas-unique-header-container atlas-header-card">
                    <header className="atlas-header-row">
                        <div className="header-left">
                            <button className="btn-back-minimal" onClick={onSalir}>
                                <Icono nombre="atras" size={16} /> Salir
                            </button>
                            <div className="badge-reto-id">Fase {form.fase_atlas || "AUDITAR"}</div>
                        </div>
                        <div className="atlas-unique-title-box">
                            <h2>{form.titulo}</h2>
                            <div className={`atlas-save-state ${ultimoGuardado ? "ok" : ""}`}>
                                {ultimoGuardado
                                    ? `Guardado en este dispositivo a las ${ultimoGuardado}`
                                    : "Tu avance se guarda automáticamente"}
                            </div>
                        </div>
                        <button className="btn-save-draft-premium atlas-btn-icon" onClick={guardarAhora}>
                            <Icono nombre="guardar" size={17} /> Guardar
                        </button>
                    </header>

                    <nav className="atlas-journey" aria-label="Progreso del diagnóstico">
                        {FASES_RECORRIDO.map((f, n) => {
                            const e = estadoFase(f.id);
                            return (
                                <button
                                    key={f.id}
                                    type="button"
                                    className={`atlas-phase ${e.activa ? "is-active" : ""} ${e.pct >= 100 ? "is-done" : ""}`}
                                    style={{ flexGrow: f.flex }}
                                    onClick={() => irAPaso(e.primerPaso)}
                                >
                                    <span className="atlas-phase-track">
                                        <span className="atlas-phase-fill" style={{ width: `${e.pct}%` }} />
                                    </span>
                                    <span className="atlas-phase-label">
                                        <span className="atlas-phase-index">
                                            {e.pct >= 100 ? <Icono nombre="check" size={11} /> : n + 1}
                                        </span>
                                        {f.label}
                                        {e.activa && e.detalle && <em>{e.detalle}</em>}
                                    </span>
                                </button>
                            );
                        })}
                        <div className="atlas-journey-pct">
                            <strong>{pct}%</strong>
                            <span>{totalRespondidas} de {preguntas.length} respuestas</span>
                        </div>
                    </nav>
                </div>

                {/* INICIO */}
                {pasoInfo.id === "inicio" && (
                    <div className="atlas-unique-section-narrative atlas-step-anim" key="inicio">
                        <div className="atlas-step-intro">
                            <h3>Antes de empezar</h3>
                        </div>
                        <section className="narrative-hero-section">
                            <div className="narrative-card context-card">
                                <h3>Sobre este diagnóstico</h3>
                                <div className="unesco-text">
                                    {(form.descripcion || "").split(/\n+/).filter(p => p.trim()).map((p, i) => <p key={i}>{p}</p>)}
                                </div>
                                <div className="tags-container">
                                    <span className="tag">{preguntas.length} preguntas</span>
                                    <span className="tag">{estaciones.length} estaciones</span>
                                    <span className="tag">Unos {minutosTotal} min</span>
                                </div>
                            </div>
                            <div className="narrative-card info-card">
                                <h3>Tu recorrido</h3>
                                <ul className="narrative-list">
                                    {estaciones.map((e, i) => (
                                        <li key={i}>{e.titulo}: {e.items.length === 1 ? "1 pregunta" : `${e.items.length} preguntas`}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="narrative-card mission-card">
                                <h3>Cómo responder</h3>
                                <p>
                                    Responde según lo que haces hoy, no según lo que crees que deberías hacer.
                                    Cada opción describe una práctica real: no hay respuestas correctas o incorrectas.
                                </p>
                            </div>
                        </section>
                    </div>
                )}

                {/* ESTACIÓN */}
                {estacion && (
                    <div className="atlas-unique-form-wrapper">
                        <div className="atlas-station-head atlas-step-anim" key={pasoInfo.id}>
                            <div className="atlas-station-num" aria-label={`Estación ${pasoInfo.est + 1} de ${estaciones.length}`}>
                                <span>{String(pasoInfo.est + 1).padStart(2, "0")}</span>
                                <small>de {String(estaciones.length).padStart(2, "0")}</small>
                            </div>
                            <div className="atlas-station-text">
                                <h3>{estacion.titulo}</h3>
                                <p>
                                    {estacion.eyebrow ? `${estacion.eyebrow}. ` : ""}
                                    {estacion.items.length === 1 ? "1 pregunta" : `${estacion.items.length} preguntas`}, unos {minutosEstacion} min
                                </p>
                            </div>
                        </div>

                        {estacion.items.map(q => (
                            <section key={q.id} className={`form-card rf-pregunta atlas-step-anim ${respondida(q) ? "is-answered" : ""}`}>
                                <div className="form-section-title">
                                    <span className="rf-num">{numero[q.id]}.</span>
                                    <span>{q._texto}</span>
                                </div>
                                {q.descripcion_pregunta && <p className="rf-descripcion">{q.descripcion_pregunta}</p>}
                                {renderRespuesta(q)}
                            </section>
                        ))}
                    </div>
                )}

                {/* NAVEGACIÓN */}
                {pasoInfo.id !== "envio" && (
                    <div className="atlas-step-nav">
                        <button className="atlas-nav-btn ghost" disabled={paso === 0} onClick={() => irAPaso(paso - 1)}>
                            <Icono nombre="atras" size={18} /> Anterior
                        </button>
                        {paso === 0 && totalRespondidas > 0 && primerPasoPendiente > 0 && (
                            <button className="atlas-nav-btn ghost" onClick={() => irAPaso(primerPasoPendiente)}>
                                Continuar donde quedé
                            </button>
                        )}
                        <button className="atlas-nav-btn" onClick={() => irAPaso(paso + 1)}>
                            {textoSiguiente} <Icono nombre="adelante" size={18} />
                        </button>
                    </div>
                )}

                {/* ENVÍO */}
                {pasoInfo.id === "envio" && (
                    <div className="atlas-unique-footer-section atlas-step-anim">
                        {pendientes.length > 0 ? (
                            <div className="atlas-pending-box">
                                <strong>
                                    Te {pendientes.length === 1 ? "falta 1 respuesta" : `faltan ${pendientes.length} respuestas`} antes de enviar:
                                </strong>
                                <div className="atlas-pending-list">
                                    {pendientes.map(q => (
                                        <button key={q.id} type="button" onClick={() => irAPaso(pasoDePregunta[q.id])}>
                                            Pregunta {numero[q.id]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="atlas-pending-box completo">
                                <Icono nombre="check" size={18} /> Respondiste todo el diagnóstico.
                            </div>
                        )}

                        <section className="autoevaluacion-final-section">
                            <div className="autoeval-card">
                                <h3>ENVÍO DEL DIAGNÓSTICO</h3>
                                <p className="autoeval-desc">
                                    Al enviarlo se genera tu informe COMPASS: tu nivel por dimensión, tus próximos pasos
                                    y tu ruta en la fase Transformar.
                                </p>
                                <button
                                    className="btn-finalizar-mision"
                                    disabled={pendientes.length > 0 || enviando}
                                    onClick={() => onEnviar(respuestas)}
                                >
                                    {enviando ? "Enviando..." : "ENVIAR DIAGNÓSTICO"}
                                </button>
                            </div>
                        </section>

                        <div className="atlas-step-nav">
                            <button className="atlas-nav-btn ghost" onClick={() => irAPaso(paso - 1)}>
                                <Icono nombre="atras" size={18} /> Anterior
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════
// Lista de instrumentos + recorrido
// ══════════════════════════════════════════════════════════════════
export const ResponderFormularios = ({
    userData,
    apiFetch,
    filterPhase,
    onNavigate,
    modoAuditar2 = false,
}) => {
    const [availableForms, setAvailableForms] = useState([]);
    const [userAnswers, setUserAnswers] = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [isSyncing, setIsSyncing] = useState(false);
    const [cargado, setCargado] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const auditar2Abierto = useRef(false);

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterPhase]);

    // MODO AUDITAR2: abrir directo el formulario AUDITAR ya respondido (una sola vez)
    useEffect(() => {
        if (!modoAuditar2 || !cargado || auditar2Abierto.current) return;
        auditar2Abierto.current = true;
        (async () => {
            try {
                const { formulario_id } = await apiFetch("/api/sostener/auditar-dos/formulario");
                if (!formulario_id) return;
                const form = availableForms.find(f => f.id === formulario_id)
                    || { id: formulario_id, titulo: "Segundo Diagnóstico AUDITAR", fase_atlas: "AUDITAR", puntos_maximos: 100 };
                await handleOpenForm(form);
            } catch (e) {
                console.error("No se pudo cargar formulario auditar2:", e);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modoAuditar2, cargado]);

    const fetchInitialData = async () => {
        setIsSyncing(true);
        try {
            const [formsData, answersData] = await Promise.all([
                apiFetch(`/api/mi-empresa/formularios?fase=${filterPhase || "AUDITAR"}`).catch(() => []),
                apiFetch("/api/mis-respuestas").catch(() => []),
            ]);
            setAvailableForms(Array.isArray(formsData) ? formsData : []);
            setUserAnswers(Array.isArray(answersData) ? answersData : []);
        } catch (e) {
            console.error("Error cargando formularios:", e);
        } finally {
            setIsSyncing(false);
            setCargado(true);
        }
    };

    const isFormAnswered = (formId) => userAnswers.some(ans => ans.formulario_id === formId);
    const pendingForms = availableForms.filter(f => !isFormAnswered(f.id));
    const completedForms = availableForms.filter(f => isFormAnswered(f.id));

    const claveBorrador = (form) =>
        `compass_borrador_${userData?.id ?? userData?.teacher_key ?? "u"}_${form.id}_${modoAuditar2 ? "a2" : "a1"}`;

    const handleOpenForm = async (form) => {
        setSelectedForm({ ...form, questions: null });
        try {
            const preguntas = await apiFetch(`/api/formularios/${form.id}/preguntas`);
            setSelectedForm({ ...form, questions: Array.isArray(preguntas) ? preguntas : [] });
        } catch (e) {
            console.error(e);
            setSelectedForm(null);
            Swal.fire("Error", "No se pudieron cargar las preguntas.", "error");
        }
    };

    const handleSalir = () => {
        setSelectedForm(null);
        if (modoAuditar2) onNavigate('modulo_sostener');
    };

    const handleEnviar = async (respuestas) => {
        const form = selectedForm;
        setEnviando(true);
        try {
            const endpoint = modoAuditar2 ? "/api/sostener/auditar-dos" : "/api/respuestas";
            await apiFetch(endpoint, {
                method: "POST",
                body: JSON.stringify({
                    formulario_id: form.id,
                    respuestas: construirPayload(form.questions, respuestas),
                }),
            });
            try { localStorage.removeItem(claveBorrador(form)); } catch (e) { /* sin almacenamiento */ }

            await Swal.fire({
                icon: 'success',
                iconColor: '#c5a059',
                title: modoAuditar2 ? 'Segundo diagnóstico enviado' : 'Diagnóstico enviado',
                text: modoAuditar2
                    ? 'Volvamos a tu análisis para ver tu progreso.'
                    : 'Estamos preparando tu informe COMPASS.',
                timer: 2000,
                showConfirmButton: false,
            });

            setSelectedForm(null);
            if (modoAuditar2) onNavigate('modulo_sostener');
            else if (filterPhase === 'AUDITAR') onNavigate('fase_auditar');
            else { await fetchInitialData(); onNavigate('overview'); }
        } catch (err) {
            console.error("Error:", err);
            Swal.fire({
                icon: 'error',
                title: 'No se pudo enviar',
                text: 'Tus respuestas siguen guardadas en este dispositivo. Revisa tu conexión e inténtalo de nuevo.',
                confirmButtonColor: '#c5a059',
            });
        } finally {
            setEnviando(false);
        }
    };

    // ── Recorrido activo ──
    if (selectedForm) {
        if (selectedForm.questions === null || selectedForm.questions.length === 0) {
            return (
                <div className="atlas-unique-page-wrapper">
                    <main className="atlas-unique-main-content">
                        <section className="form-card rf-cargando">
                            {selectedForm.questions === null ? (
                                <>
                                    <div className="rf-spinner" />
                                    <p>Preparando tu diagnóstico...</p>
                                </>
                            ) : (
                                <>
                                    <p>Este instrumento todavía no tiene preguntas configuradas.</p>
                                    <button className="atlas-nav-btn ghost" onClick={handleSalir}>Volver</button>
                                </>
                            )}
                        </section>
                    </main>
                </div>
            );
        }
        return (
            <RecorridoFormulario
                form={selectedForm}
                borradorKey={claveBorrador(selectedForm)}
                enviando={enviando}
                onSalir={handleSalir}
                onEnviar={handleEnviar}
            />
        );
    }

    // ── Lista de instrumentos (mismo diseño de siempre) ──
    return (
        <div className="atlas-responder-container animate-fade-in">
            <div className="nav-back-container" style={{ marginBottom: '20px' }}>
                <button
                    className="btn-back-minimal"
                    onClick={() => onNavigate(filterPhase === 'AUDITAR' ? 'fase_auditar' : 'overview')}
                    style={{
                        padding: '10px 15px', backgroundColor: '#fff', border: '1px solid #c5a059',
                        borderRadius: '8px', color: '#c5a059', cursor: 'pointer', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    ⬅ Volver
                </button>
            </div>

            <div className="responder-controls-row">
                <div className="tab-container-modern">
                    <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                        Pendientes <span className="tab-count">{pendingForms.length}</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
                        Completados <span className="tab-count">{completedForms.length}</span>
                    </button>
                </div>
            </div>

            <div className="forms-grid-responder">
                {isSyncing && availableForms.length === 0 ? (
                    <div className="loading-state-placeholder"><p>Buscando instrumentos...</p></div>
                ) : (activeTab === 'pending' ? pendingForms : completedForms).length === 0 ? (
                    <div className="no-forms-message">
                        <p>
                            {availableForms.length === 0
                                ? `Aún no te han asignado instrumentos en la Fase ${filterPhase || ''}. Contacta a tu administrador institucional.`
                                : `No hay instrumentos ${activeTab === 'pending' ? 'pendientes' : 'completados'} en la Fase ${filterPhase || ''} por ahora.`}
                        </p>
                    </div>
                ) : (
                    (activeTab === 'pending' ? pendingForms : completedForms).map(form => (
                        <div key={form.id} className={`form-card-answerable ${activeTab === 'completed' ? 'card-done' : 'card-pending'}`}>
                            <div className="card-accent" />
                            <span className="phase-badge">{form.fase_atlas}</span>
                            <h3>{form.titulo}</h3>
                            <p>{form.descripcion}</p>
                            <div className="card-footer">
                                <span className="pts-tag">⏱ 10-15 min</span>
                                {activeTab === 'pending' ? (
                                    <button className="btn-respond" onClick={() => handleOpenForm(form)}>Iniciar diagnóstico</button>
                                ) : (
                                    <span className="status-done-pill">✅ Completado</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
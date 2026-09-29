import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../Styles/responderFormularios.css';
import '../Styles/ejecutarReto.css';
import '../Styles/responderAuditar.css';
import '../Styles/responderAuditarV2.css';
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
    const opcion = (key, activa, onClick, tipo, texto, orden) => (
        <button key={key} type="button"
            role={tipo === "radio" ? "radio" : "checkbox"} aria-checked={activa}
            className={`rq-opt ${activa ? "is-sel" : ""}`} onClick={onClick}>
            <span className={`rq-mark ${tipo}`}>
                {activa && (tipo === "orden" ? orden : <Icono nombre="check" size={12} />)}
            </span>
            <span className="rq-opt-txt">{texto}</span>
        </button>
    );

    const renderRespuesta = (q) => {
        const ops = splitOptions(q.opciones_seleccion);
        const valor = respuestas[q.id];

        if (q.tipo_respuesta === "ESCALA") {
            return (
                <div className="rq-escala">
                    <div className="rq-escala-fila" role="radiogroup">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} type="button" role="radio" aria-checked={Number(valor) === n}
                                className={`rq-escala-btn ${Number(valor) === n ? "is-sel" : ""}`}
                                onClick={() => elegir(q, n)}>{n}</button>
                        ))}
                    </div>
                    <div className="rq-escala-ext"><span>Totalmente en desacuerdo</span><span>Totalmente de acuerdo</span></div>
                </div>
            );
        }

        if (q.tipo_respuesta === "SLIDER") {
            const min = Number(q.opciones_seleccion?.min ?? 1);
            const max = Number(q.opciones_seleccion?.max ?? 5);
            return (
                <div className="rq-slider">
                    <input type="range" min={min} max={max} value={valor ?? min} onChange={(e) => elegir(q, e.target.value)} />
                    <div className="rq-escala-ext"><span>{min}</span><strong>{valor ?? "Mueve el control"}</strong><span>{max}</span></div>
                </div>
            );
        }

        if (["PARRAFO", "ABIERTA"].includes(q.tipo_respuesta)) {
            const texto = valor || "";
            return (
                <div className="rq-texto">
                    <textarea
                        value={texto}
                        onChange={(e) => elegir(q, e.target.value)}
                        placeholder={q.tipo_respuesta === "PARRAFO"
                            ? "Cuéntalo con un caso real: qué hiciste, con quién y qué pasó."
                            : "Escribe tu respuesta"}
                    />
                    <div className="rq-texto-pie">
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
                <div className="rq-opciones">
                    <p className="rq-ayuda">Toca las opciones en orden, empezando por la más importante para ti.</p>
                    {ops.map(opt => {
                        const lugar = orden.indexOf(opt);
                        return opcion(opt, lugar !== -1, () => alternarOrden(q, opt), "orden", cleanOptionText(opt), lugar + 1);
                    })}
                    {orden.length > 0 && (
                        <button type="button" className="rq-link" onClick={() => elegir(q, [])}>Reiniciar el orden</button>
                    )}
                </div>
            );
        }

        if (q.tipo_respuesta === "CHECKBOX") {
            const sel = valor || [];
            return (
                <div className="rq-opciones">
                    <p className="rq-ayuda">Puedes marcar varias.</p>
                    {ops.map(opt => opcion(opt, sel.includes(opt), () => alternarCasilla(q, opt), "check", cleanOptionText(opt)))}
                </div>
            );
        }

        return (
            <div className="rq-opciones" role="radiogroup">
                {ops.map(opt => opcion(opt, valor === opt, () => elegir(q, opt), "radio", cleanOptionText(opt)))}
            </div>
        );
    };

       // ── Datos para el render ──
    const estacionCompleta = (e) => e.items.every(respondida);
    const siguientePaso = pasos[paso + 1];
    const textoSiguiente = paso === 0 ? "Comenzar"
        : siguientePaso?.id === "envio" ? "Ir al envío"
            : "Siguiente";
    const minutosEstacion = estacion
        ? Math.max(1, Math.round(estacion.items.reduce((a, q) => a + (TIEMPO_POR_TIPO[q.tipo_respuesta] ?? 0.6), 0)))
        : 0;
    const nombreDe = (p) => p.id === "inicio" ? "Inicio"
        : p.id === "envio" ? "Revisión y envío"
            : estaciones[p.est].titulo;
    const pasoHecho = (p) => p.id === "inicio" ? paso > 0
        : p.id === "envio" ? false
            : estacionCompleta(estaciones[p.est]);

    return (
        <div className="rq-page" ref={inicioRef}>
            {aviso && (
                <div className="rq-toast" key={aviso.id} role="status" aria-live="polite">
                    <span className="rq-toast-ico"><Icono nombre="check" size={15} /></span>
                    <div><strong>{aviso.titulo}: estación completa</strong><span>{aviso.detalle}</span></div>
                </div>
            )}

            {/* CABECERA: barra + pasos */}
            <header className="rq-top">
                <div className="rq-top-row">
                    <button className="rq-salir" onClick={onSalir}><Icono nombre="atras" size={16} /> Salir</button>
                    <div className="rq-top-title">
                        <strong>{form.titulo}</strong>
                        <span>{ultimoGuardado ? `Guardado a las ${ultimoGuardado}` : "Tu avance se guarda automáticamente"}</span>
                    </div>
                    <button className="rq-guardar" onClick={guardarAhora} aria-label="Guardar avance">
                        <Icono nombre="guardar" size={16} /> Guardar
                    </button>
                </div>

                <div className="rq-stepper">
                    <div className="rq-stepper-info">
                        <div>
                            <span className="rq-stepper-kicker">Paso {paso + 1} de {pasos.length}</span>
                            <strong className="rq-stepper-name">{nombreDe(pasoInfo)}</strong>
                        </div>
                        <div className="rq-stepper-pct">{pct}%<small>{totalRespondidas} de {preguntas.length} respuestas</small></div>
                    </div>
                    <ol className="rq-segs" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                        {pasos.map((p, i) => (
                            <li key={p.id}>
                                <button
                                    type="button"
                                    className={`rq-seg ${i === paso ? "is-cur" : ""} ${pasoHecho(p) ? "is-done" : ""}`}
                                    onClick={() => irAPaso(i)}
                                    title={nombreDe(p)}
                                    aria-label={nombreDe(p)}
                                    aria-current={i === paso ? "step" : undefined}
                                />
                            </li>
                        ))}
                    </ol>
                </div>
            </header>

            <main className="rq-main">
                {/* INICIO */}
                {pasoInfo.id === "inicio" && (
                    <div className="rq-fade" key="inicio">
                        <p className="rq-eyebrow">Diagnóstico COMPASS</p>
                        <h1 className="rq-h1">Vamos a ver dónde estás hoy</h1>
                        <p className="rq-lead">
                            No es un examen: es una fotografía honesta de tu práctica. Con ella construimos tu informe y tu ruta.
                        </p>
                        <div className="rq-facts">
                            <div><strong>{preguntas.length}</strong><span>preguntas</span></div>
                            <div><strong>{estaciones.length}</strong><span>estaciones</span></div>
                            <div><strong>~{minutosTotal}</strong><span>minutos</span></div>
                        </div>
                        <div className="rq-info-grid">
                            <div className="rq-info">
                                <h3>Cómo responder</h3>
                                <p>Responde según lo que haces hoy, no según lo que crees que deberías hacer. Cada opción describe una práctica real: no hay respuestas correctas o incorrectas.</p>
                            </div>
                            <div className="rq-info">
                                <h3>Lo que recibirás</h3>
                                <ul>
                                    <li>Tu nivel de madurez por dimensión</li>
                                    <li>Tres próximos pasos concretos</li>
                                    <li>Tus retos para la fase Transformar</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* ESTACIÓN */}
                {estacion && (
                    <div className="rq-fade" key={pasoInfo.id}>
                        <div className="rq-station-head">
                            <h2>{estacion.titulo}</h2>
                            <p>
                                {estacion.eyebrow ? `${estacion.eyebrow} · ` : ""}
                                {estacion.items.length === 1 ? "1 pregunta" : `${estacion.items.length} preguntas`} · unos {minutosEstacion} min
                            </p>
                        </div>

                        <div className="rq-preguntas">
                            {estacion.items.map(q => (
                                <section key={q.id} className={`rq-q ${respondida(q) ? "is-ok" : ""}`}>
                                    <div className="rq-q-head">
                                        <span className="rq-q-num">{numero[q.id]}</span>
                                        <h3>{q._texto}</h3>
                                    </div>
                                    {q.descripcion_pregunta && <p className="rq-q-desc">{q.descripcion_pregunta}</p>}
                                    <div className="rq-q-body">{renderRespuesta(q)}</div>
                                </section>
                            ))}
                        </div>
                    </div>
                )}

                {/* ENVÍO */}
                {pasoInfo.id === "envio" && (
                    <div className="rq-fade" key="envio">
                        <p className="rq-eyebrow">Último paso</p>
                        <h1 className="rq-h1">Revisa y envía</h1>

                        <div className="rq-resumen">
                            {estaciones.map((e, i) => (
                                <button key={i} type="button" className={`rq-res-item ${estacionCompleta(e) ? "is-ok" : ""}`} onClick={() => irAPaso(i + 1)}>
                                    <span>{e.titulo}</span>
                                    <small>{e.items.filter(respondida).length}/{e.items.length}</small>
                                </button>
                            ))}
                        </div>

                        {pendientes.length > 0 ? (
                            <div className="rq-pendientes">
                                <strong>{pendientes.length === 1 ? "Te falta 1 respuesta" : `Te faltan ${pendientes.length} respuestas`} antes de enviar</strong>
                                <div>
                                    {pendientes.map(q => (
                                        <button key={q.id} type="button" onClick={() => irAPaso(pasoDePregunta[q.id])}>Pregunta {numero[q.id]}</button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rq-pendientes ok"><Icono nombre="check" size={18} /> Respondiste todo el diagnóstico.</div>
                        )}

                        <div className="rq-enviar">
                            <div>
                                <h3>Enviar diagnóstico</h3>
                                <p>Al enviarlo se genera tu informe COMPASS con tu nivel por dimensión, tus próximos pasos y tus retos en Transformar.</p>
                            </div>
                            <button className="rq-btn-enviar" disabled={pendientes.length > 0 || enviando} onClick={() => onEnviar(respuestas)}>
                                {enviando ? "Enviando..." : "Enviar diagnóstico"}
                            </button>
                        </div>
                    </div>
                )}

                {/* NAVEGACIÓN */}
                <div className="rq-nav">
                    <button className="rq-nav-btn ghost" disabled={paso === 0} onClick={() => irAPaso(paso - 1)}>
                        <Icono nombre="atras" size={18} /> Anterior
                    </button>
                    {paso === 0 && totalRespondidas > 0 && primerPasoPendiente > 0 && (
                        <button className="rq-nav-btn ghost" onClick={() => irAPaso(primerPasoPendiente)}>Continuar donde quedé</button>
                    )}
                    {pasoInfo.id !== "envio" && (
                        <button className="rq-nav-btn" onClick={() => irAPaso(paso + 1)}>
                            {textoSiguiente} <Icono nombre="adelante" size={18} />
                        </button>
                    )}
                </div>
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
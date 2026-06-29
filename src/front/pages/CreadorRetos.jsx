import React, { useState, useEffect } from "react";
import "../Styles/creadorRetos.css";



const TIPOS_PREGUNTA = [
    { value: "ESCALA",   label: "Escala (1-5)",          icon: "📊", desc: "El usuario elige un valor del 1 al 5" },
    { value: "MULTIPLE", label: "Opción Múltiple",        icon: "🔘", desc: "Una sola respuesta correcta entre varias opciones" },
    { value: "CHECKBOX", label: "Casillas (varias)",      icon: "☑️", desc: "El usuario puede marcar varias opciones" },
    { value: "ABIERTA",  label: "Texto Corto",            icon: "✏️", desc: "Respuesta breve en una línea" },
    { value: "PARRAFO",  label: "Párrafo / Texto largo",  icon: "📝", desc: "Respuesta extensa tipo reflexión" },
    { value: "ORDEN",    label: "Ordenar por prioridad",  icon: "🔢", desc: "El usuario numera las opciones de más a menos importante" },
    { value: "SLIDER",   label: "Slider deslizante",      icon: "🎛️", desc: "El usuario desliza un control entre un valor mínimo y máximo" },
    { value: "SELECT",   label: "Lista desplegable",      icon: "📋", desc: "El usuario elige una opción de un select" },
];

const TIPOS_CON_OPCIONES = ["MULTIPLE", "CHECKBOX", "SELECT", "ORDEN"];

const FASES = [
    { value: "AUDITAR",     label: "A · Auditar",     icon: "🔍", tipo: "formulario", pesoMax: 20 },
    { value: "TRANSFORMAR", label: "T · Transformar", icon: "⚡", tipo: "reto",        pesoMax: 30 },
    { value: "LIDERAR",     label: "L · Liderar",     icon: "🧭", tipo: "reto",        pesoMax: 15 },
    { value: "ASEGURAR",    label: "A · Asegurar",    icon: "🛡️", tipo: "reto",        pesoMax: 20 },
    { value: "SOSTENER",    label: "S · Sostener",    icon: "🌱", tipo: "reto",        pesoMax: 15 },
];

const MODOS = [
    { value: "formulario", label: "Formulario guiado", icon: "📝", desc: "Construye pregunta por pregunta, paso a paso" },
    { value: "tabla",      label: "Vista tabla",        icon: "📊", desc: "Llena una hoja tipo Excel, fila por fila" },
    { value: "json",       label: "Importar JSON",      icon: "📁", desc: "Sube un archivo .json con todas las preguntas" },
];

const nuevaPregunta = () => ({
    _localId: Date.now() + Math.random(),
    texto_pregunta: "",
    tipo_respuesta: "ESCALA",
    opciones_seleccion: [],
    slider_min: 1,
    slider_max: 5,
    puntaje_asociado: 10,
});

const EJEMPLO_JSON = {
    titulo: "Ejemplo: Diagnóstico Inicial",
    descripcion: "Plantilla de ejemplo para importar",
    rol_destino: "DOCENTE",
    puntos_maximos: 100,
    nivel_unesco: "ACQUIRE",
    peso_huella: 10,
    preguntas: [
        {
            texto_pregunta: "¿Con qué frecuencia usas IA en tus clases?",
            tipo_respuesta: "MULTIPLE",
            opciones_seleccion: ["Nunca", "Ocasionalmente", "Frecuentemente"],
            puntaje_asociado: 10
        },
        {
            texto_pregunta: "Describe brevemente tu experiencia con IA.",
            tipo_respuesta: "PARRAFO",
            opciones_seleccion: null,
            puntaje_asociado: 5
        },
        {
            texto_pregunta: "Nivel de confianza en el uso de IA (1 a 10)",
            tipo_respuesta: "SLIDER",
            opciones_seleccion: { min: 1, max: 10 },
            puntaje_asociado: 10
        }
    ]
};

export const CreadorRetos = ({ apiFetch }) => {
    const [faseSeleccionada, setFaseSeleccionada] = useState("AUDITAR");
    const [retosExistentes, setRetosExistentes] = useState([]);
    const [formulariosExistentes, setFormulariosExistentes] = useState([]);

    const [vista, setVista] = useState("lista"); // "lista" | "crear"
    const [modo, setModo] = useState("formulario"); // "formulario" | "tabla" | "json"
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // ── Datos del formulario/reto en construcción ─────────────────────────
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [nivelUnesco, setNivelUnesco] = useState("ACQUIRE");
    const [numeroOrden, setNumeroOrden] = useState(1);
    const [rolDestino, setRolDestino] = useState("DOCENTE");
    const [pesoHuella, setPesoHuella] = useState(10);
    const [puntosMaximos, setPuntosMaximos] = useState(100);
    const [preguntas, setPreguntas] = useState([nuevaPregunta()]);

    // ── Estado del modo JSON ───────────────────────────────────────────────
    const [jsonTexto, setJsonTexto] = useState("");
    const [jsonError, setJsonError] = useState("");

    const esFormulario = FASES.find(f => f.value === faseSeleccionada)?.tipo === "formulario";
    const faseActual = FASES.find(f => f.value === faseSeleccionada);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setIsLoading(true);
        try {
            const [retosData, formsData] = await Promise.all([
                apiFetch("/api/retos-plantilla").catch(() => []),
                apiFetch("/api/formularios").catch(() => []),
            ]);
            setRetosExistentes(Array.isArray(retosData) ? retosData : []);
            setFormulariosExistentes(Array.isArray(formsData) ? formsData : []);
        } catch (e) {
            console.error("Error cargando datos del creador:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setTitulo("");
        setDescripcion("");
        setNivelUnesco("ACQUIRE");
        setNumeroOrden(1);
        setRolDestino("DOCENTE");
        setPesoHuella(10);
        setPuntosMaximos(100);
        setPreguntas([nuevaPregunta()]);
        setJsonTexto("");
        setJsonError("");
        setModo("formulario");
    };

    // ── Manejo de preguntas (compartido por modo formulario y tabla) ──────
    const agregarPregunta = () => setPreguntas(prev => [...prev, nuevaPregunta()]);

    const eliminarPregunta = (localId) => setPreguntas(prev => prev.filter(p => p._localId !== localId));

    const actualizarPregunta = (localId, campo, valor) => {
        setPreguntas(prev => prev.map(p => p._localId === localId ? { ...p, [campo]: valor } : p));
    };

    const agregarOpcion = (localId) => {
        setPreguntas(prev => prev.map(p => {
            if (p._localId !== localId) return p;
            return { ...p, opciones_seleccion: [...(p.opciones_seleccion || []), ""] };
        }));
    };

    const actualizarOpcion = (localId, idx, valor) => {
        setPreguntas(prev => prev.map(p => {
            if (p._localId !== localId) return p;
            const nuevasOpciones = [...(p.opciones_seleccion || [])];
            nuevasOpciones[idx] = valor;
            return { ...p, opciones_seleccion: nuevasOpciones };
        }));
    };

    const eliminarOpcion = (localId, idx) => {
        setPreguntas(prev => prev.map(p => {
            if (p._localId !== localId) return p;
            const nuevasOpciones = (p.opciones_seleccion || []).filter((_, i) => i !== idx);
            return { ...p, opciones_seleccion: nuevasOpciones };
        }));
    };

    // ── Construye el payload final de preguntas, normalizando SLIDER ─────
    const construirPreguntasPayload = (listaPreguntas) => {
        return listaPreguntas.map((p, i) => {
            let opciones = null;
            if (TIPOS_CON_OPCIONES.includes(p.tipo_respuesta)) {
                opciones = (p.opciones_seleccion || []).filter(o => String(o).trim() !== "");
            } else if (p.tipo_respuesta === "SLIDER") {
                opciones = { min: Number(p.slider_min ?? 1), max: Number(p.slider_max ?? 5) };
            }
            return {
                texto_pregunta: p.texto_pregunta,
                tipo_respuesta: p.tipo_respuesta,
                opciones_seleccion: opciones,
                puntaje_asociado: parseFloat(p.puntaje_asociado) || 0,
                orden_pregunta: i + 1,
            };
        });
    };

    // ── Guardar (modos formulario y tabla comparten esta función) ────────
    const handleGuardar = async () => {
        if (!titulo.trim()) {
            alert("El título / nombre es obligatorio.");
            return;
        }
        if (preguntas.length === 0 || preguntas.some(p => !p.texto_pregunta.trim())) {
            alert("Todas las preguntas deben tener texto.");
            return;
        }

        setIsSaving(true);
        try {
            const preguntasLimpias = construirPreguntasPayload(preguntas);
            await guardarEnAPI(preguntasLimpias);
            await cargarDatos();
            resetForm();
            setVista("lista");
            alert("¡Guardado exitosamente!");
        } catch (e) {
            console.error("Error guardando:", e);
            alert("Hubo un error al guardar. Revisa la consola.");
        } finally {
            setIsSaving(false);
        }
    };

    const guardarEnAPI = async (preguntasLimpias) => {
        if (esFormulario) {
            await apiFetch("/api/formularios/completo", {
                method: "POST",
                body: JSON.stringify({
                    titulo,
                    descripcion,
                    fase_atlas: faseSeleccionada,
                    rol_destino: rolDestino,
                    puntos_maximos: parseFloat(puntosMaximos),
                    preguntas: preguntasLimpias,
                }),
            });
        } else {
            await apiFetch("/api/retos-plantilla/completo", {
                method: "POST",
                body: JSON.stringify({
                    nombre_reto: titulo,
                    descripcion,
                    fase: faseSeleccionada,
                    nivel_unesco: nivelUnesco,
                    numero_reto: parseInt(numeroOrden),
                    rol_destino: rolDestino,
                    peso_huella: parseFloat(pesoHuella),
                    numero_orden: parseInt(numeroOrden),
                    preguntas: preguntasLimpias,
                }),
            });
        }
    };

    // ── Modo JSON: cargar archivo ──────────────────────────────────────────
    const handleArchivoJson = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            setJsonTexto(evt.target.result);
            setJsonError("");
        };
        reader.readAsText(file);
    };

    const aplicarJsonAlFormulario = () => {
        try {
            const parsed = JSON.parse(jsonTexto);
            if (!parsed.titulo && !parsed.nombre_reto) throw new Error("Falta 'titulo' o 'nombre_reto'");
            if (!Array.isArray(parsed.preguntas)) throw new Error("Falta el array 'preguntas'");

            setTitulo(parsed.titulo || parsed.nombre_reto || "");
            setDescripcion(parsed.descripcion || "");
            setRolDestino(parsed.rol_destino || "DOCENTE");
            setPuntosMaximos(parsed.puntos_maximos ?? 100);
            setNivelUnesco(parsed.nivel_unesco || "ACQUIRE");
            setPesoHuella(parsed.peso_huella ?? 10);
            setNumeroOrden(parsed.numero_reto ?? 1);

            const preguntasNormalizadas = parsed.preguntas.map(p => {
                const base = nuevaPregunta();
                const esSlider = p.tipo_respuesta === "SLIDER";
                return {
                    ...base,
                    texto_pregunta: p.texto_pregunta || "",
                    tipo_respuesta: p.tipo_respuesta || "ESCALA",
                    opciones_seleccion: TIPOS_CON_OPCIONES.includes(p.tipo_respuesta)
                        ? (p.opciones_seleccion || [])
                        : [],
                    slider_min: esSlider ? (p.opciones_seleccion?.min ?? 1) : 1,
                    slider_max: esSlider ? (p.opciones_seleccion?.max ?? 5) : 5,
                    puntaje_asociado: p.puntaje_asociado ?? 10,
                };
            });

            setPreguntas(preguntasNormalizadas.length > 0 ? preguntasNormalizadas : [nuevaPregunta()]);
            setJsonError("");
            alert(`JSON cargado: ${preguntasNormalizadas.length} preguntas. Revisa y guarda cuando estés listo.`);
            setModo("tabla"); // tras importar, mostramos la vista tabla para revisar/editar
        } catch (err) {
            setJsonError(`JSON inválido: ${err.message}`);
        }
    };

    const descargarEjemploJson = () => {
        const blob = new Blob([JSON.stringify(EJEMPLO_JSON, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ejemplo_reto_atlas.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Lista filtrada por fase ──────────────────────────────────────────
    const listaActual = esFormulario
        ? formulariosExistentes.filter(f => f.fase_atlas === faseSeleccionada)
        : retosExistentes.filter(r => r.fase === faseSeleccionada);

    return (
        <div className="cr-page">

            {/* ── SELECTOR DE FASE ─────────────────────────────────────────── */}
            <div className="cr-card">
                <h3>Banco de Instrumentos ATLAS</h3>
                <p className="cr-intro-text">
                    Crea formularios (Auditar) o retos plantilla (Transformar, Liderar, Asegurar, Sostener). Aquí solo construyes el banco — la asignación a empresas se hace en otra sección.
                </p>
                <div className="cr-fase-grid">
                    {FASES.map(f => (
                        <button
                            key={f.value}
                            onClick={() => { setFaseSeleccionada(f.value); setVista("lista"); }}
                            className={`cr-fase-btn ${faseSeleccionada === f.value ? "active" : ""}`}
                        >
                            <div className="cr-fase-icon">{f.icon}</div>
                            <div className="cr-fase-label">{f.label}</div>
                            <div className="cr-fase-peso">máx {f.pesoMax} pts huella</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── VISTA LISTA ──────────────────────────────────────────────── */}
            {vista === "lista" && (
                <div className="cr-card">
                    <div className="cr-card-header">
                        <h3>{esFormulario ? "Formularios" : "Retos Plantilla"} — {faseSeleccionada}</h3>
                        <button className="cr-btn-primary" onClick={() => setVista("crear")}>
                            ➕ {esFormulario ? "Nuevo Formulario" : "Nuevo Reto"}
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="cr-loader-wrap"><div className="cr-loader" /></div>
                    ) : listaActual.length === 0 ? (
                        <p className="cr-empty-state">
                            No hay {esFormulario ? "formularios" : "retos"} creados para esta fase aún.
                        </p>
                    ) : (
                        <div className="cr-item-list">
                            {listaActual.map((item, i) => (
                                <div key={i} className="cr-item-row">
                                    <div>
                                        <p className="cr-item-title">{item.titulo || item.nombre_reto}</p>
                                        <p className="cr-item-meta">
                                            {item.rol_destino} · {esFormulario ? `${item.puntos_maximos} pts máx` : `${item.peso_huella} pts huella`}
                                        </p>
                                    </div>
                                    <span className={`cr-status-badge ${item.is_active ? "activo" : "inactivo"}`}>
                                        {item.is_active ? "ACTIVO" : "INACTIVO"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── VISTA CREAR ──────────────────────────────────────────────── */}
            {vista === "crear" && (
                <>
                    {/* SELECTOR DE MODO */}
                    <div className="cr-card">
                        <div className="cr-card-header">
                            <h3>¿Cómo quieres crear este {esFormulario ? "formulario" : "reto"}?</h3>
                            <button className="cr-icon-btn" onClick={() => { resetForm(); setVista("lista"); }}>✖ Cancelar</button>
                        </div>
                        <div className="cr-modo-grid">
                            {MODOS.map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => setModo(m.value)}
                                    className={`cr-modo-btn ${modo === m.value ? "active" : ""}`}
                                >
                                    <div className="cr-modo-icon">{m.icon}</div>
                                    <div className="cr-modo-label">{m.label}</div>
                                    <div className="cr-modo-desc">{m.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DATOS GENERALES — comunes a los 3 modos */}
                    {modo !== "json" && (
                        <div className="cr-card">
                            <h3>Datos Generales — {esFormulario ? "Formulario" : "Reto"} de {faseSeleccionada}</h3>
                            <div className="cr-form-grid">
                                <div className="cr-form-field full-width">
                                    <label className="cr-field-label">
                                        {esFormulario ? "TÍTULO DEL FORMULARIO" : "NOMBRE DEL RETO"}
                                    </label>
                                    <input
                                        type="text" className="cr-input"
                                        value={titulo} onChange={(e) => setTitulo(e.target.value)}
                                        placeholder={esFormulario ? "Ej: Diagnóstico Inicial Docente" : "Ej: Reto 1 — Rediseño de actividad con IA"}
                                    />
                                </div>

                                <div className="cr-form-field full-width">
                                    <label className="cr-field-label">DESCRIPCIÓN</label>
                                    <textarea
                                        className="cr-input cr-textarea"
                                        value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                                        placeholder="Describe el propósito de este instrumento..."
                                    />
                                </div>

                                <div className="cr-form-field">
                                    <label className="cr-field-label">ROL DESTINO</label>
                                    <select className="cr-input" value={rolDestino} onChange={(e) => setRolDestino(e.target.value)}>
                                        <option value="DOCENTE">DOCENTE</option>
                                        <option value="DIRECTIVO">DIRECTIVO</option>
                                        <option value="TODOS">TODOS</option>
                                    </select>
                                </div>

                                {esFormulario ? (
                                    <div className="cr-form-field">
                                        <label className="cr-field-label">PUNTOS MÁXIMOS</label>
                                        <input type="number" className="cr-input"
                                            value={puntosMaximos} onChange={(e) => setPuntosMaximos(e.target.value)} />
                                    </div>
                                ) : (
                                    <>
                                        <div className="cr-form-field">
                                            <label className="cr-field-label">NIVEL UNESCO</label>
                                            <select className="cr-input" value={nivelUnesco} onChange={(e) => setNivelUnesco(e.target.value)}>
                                                <option value="ACQUIRE">Acquire</option>
                                                <option value="DEEPEN">Deepen</option>
                                                <option value="CREATE">Create</option>
                                            </select>
                                        </div>
                                        <div className="cr-form-field">
                                            <label className="cr-field-label">NÚMERO / ORDEN DEL RETO</label>
                                            <input type="number" className="cr-input"
                                                value={numeroOrden} onChange={(e) => setNumeroOrden(e.target.value)} />
                                        </div>
                                        <div className="cr-form-field">
                                            <label className="cr-field-label">
                                                PESO EN LA HUELLA COMPASS (máx {faseActual?.pesoMax} pts en {faseSeleccionada})
                                            </label>
                                            <input type="number" className="cr-input"
                                                value={pesoHuella} onChange={(e) => setPesoHuella(e.target.value)} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── MODO: FORMULARIO GUIADO ─────────────────────────────── */}
                    {modo === "formulario" && (
                        <div className="cr-card">
                            <div className="cr-card-header">
                                <h3>Preguntas ({preguntas.length})</h3>
                                <button className="cr-btn-primary" onClick={agregarPregunta}>➕ Agregar Pregunta</button>
                            </div>

                            <div className="cr-preguntas-list">
                                {preguntas.map((p, idx) => (
                                    <div key={p._localId} className="cr-pregunta-block">
                                        <div className="cr-pregunta-header">
                                            <span className="cr-pregunta-numero">Pregunta {idx + 1}</span>
                                            <button className="cr-icon-btn delete" onClick={() => eliminarPregunta(p._localId)}>🗑️</button>
                                        </div>

                                        <div className="cr-pregunta-fields">
                                            <div className="cr-form-field">
                                                <label className="cr-field-label">TEXTO DE LA PREGUNTA</label>
                                                <input
                                                    type="text" className="cr-input"
                                                    value={p.texto_pregunta}
                                                    onChange={(e) => actualizarPregunta(p._localId, "texto_pregunta", e.target.value)}
                                                    placeholder="Ej: ¿Con qué frecuencia revisas los resultados generados por IA?"
                                                />
                                            </div>
                                            <div className="cr-form-field">
                                                <label className="cr-field-label">TIPO DE RESPUESTA</label>
                                                <select
                                                    className="cr-input"
                                                    value={p.tipo_respuesta}
                                                    onChange={(e) => actualizarPregunta(p._localId, "tipo_respuesta", e.target.value)}
                                                >
                                                    {TIPOS_PREGUNTA.map(t => (
                                                        <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="cr-form-field">
                                                <label className="cr-field-label">PUNTAJE</label>
                                                <input
                                                    type="number" className="cr-input"
                                                    value={p.puntaje_asociado}
                                                    onChange={(e) => actualizarPregunta(p._localId, "puntaje_asociado", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <p className="cr-tipo-desc">
                                            {TIPOS_PREGUNTA.find(t => t.value === p.tipo_respuesta)?.desc}
                                        </p>

                                        {/* Editor de opciones para MULTIPLE / CHECKBOX / SELECT / ORDEN */}
                                        {TIPOS_CON_OPCIONES.includes(p.tipo_respuesta) && (
                                            <div className="cr-opciones-box">
                                                <p className="cr-opciones-label">
                                                    OPCIONES {p.tipo_respuesta === "ORDEN" && "(el usuario las numerará de 1 a N)"}
                                                </p>
                                                {(p.opciones_seleccion || []).map((opt, oi) => (
                                                    <div key={oi} className="cr-opcion-row">
                                                        <input
                                                            type="text" className="cr-input"
                                                            value={opt}
                                                            onChange={(e) => actualizarOpcion(p._localId, oi, e.target.value)}
                                                            placeholder={`Opción ${oi + 1}`}
                                                        />
                                                        <button className="cr-icon-btn delete" onClick={() => eliminarOpcion(p._localId, oi)}>✖</button>
                                                    </div>
                                                ))}
                                                <button className="cr-btn-add-opcion" onClick={() => agregarOpcion(p._localId)}>
                                                    + Agregar opción
                                                </button>
                                            </div>
                                        )}

                                        {/* SLIDER: rango configurable min/max */}
                                        {p.tipo_respuesta === "SLIDER" && (
                                            <div className="cr-slider-box">
                                                <p className="cr-opciones-label">RANGO DEL SLIDER</p>
                                                <div className="cr-slider-range-fields">
                                                    <div className="cr-form-field">
                                                        <label className="cr-field-label-sm">Valor mínimo</label>
                                                        <input
                                                            type="number" className="cr-input"
                                                            value={p.slider_min}
                                                            onChange={(e) => actualizarPregunta(p._localId, "slider_min", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="cr-form-field">
                                                        <label className="cr-field-label-sm">Valor máximo</label>
                                                        <input
                                                            type="number" className="cr-input"
                                                            value={p.slider_max}
                                                            onChange={(e) => actualizarPregunta(p._localId, "slider_max", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="cr-preview-label">Vista previa:</p>
                                                <input type="range" className="cr-slider-preview" min={p.slider_min || 1} max={p.slider_max || 5} defaultValue={p.slider_min || 1} disabled />
                                                <div className="cr-slider-range-labels">
                                                    <span>{p.slider_min}</span>
                                                    <span>{p.slider_max}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Preview del tipo ESCALA */}
                                        {p.tipo_respuesta === "ESCALA" && (
                                            <div className="cr-preview-box">
                                                <p className="cr-preview-label">Vista previa:</p>
                                                <div className="cr-escala-preview">
                                                    {[1, 2, 3, 4, 5].map(v => (
                                                        <div key={v} className="cr-escala-circle">{v}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="cr-footer-actions">
                                <button className="cr-btn-cancelar" onClick={() => { resetForm(); setVista("lista"); }}>
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleGuardar}
                                    disabled={isSaving}
                                    className="cr-btn-guardar"
                                >
                                    {isSaving ? "Guardando..." : `Guardar ${esFormulario ? "Formulario" : "Reto"}`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── MODO: VISTA TABLA (estilo Excel) ────────────────────── */}
                    {modo === "tabla" && (
                        <div className="cr-card">
                            <div className="cr-card-header">
                                <h3>Vista Tabla — {preguntas.length} preguntas</h3>
                                <button className="cr-btn-primary" onClick={agregarPregunta}>➕ Agregar Fila</button>
                            </div>

                            <div className="cr-table-wrap">
                                <table className="cr-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Texto pregunta</th>
                                            <th>Tipo</th>
                                            <th>Opciones / Rango</th>
                                            <th>Puntaje</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preguntas.map((p, idx) => (
                                            <tr key={p._localId}>
                                                <td className="cr-table-idx">{idx + 1}</td>
                                                <td className="cr-table-cell-wide">
                                                    <input
                                                        type="text"
                                                        className="cr-table-input"
                                                        value={p.texto_pregunta}
                                                        onChange={(e) => actualizarPregunta(p._localId, "texto_pregunta", e.target.value)}
                                                        placeholder="Escribe la pregunta..."
                                                    />
                                                </td>
                                                <td className="cr-table-cell">
                                                    <select
                                                        className="cr-table-input"
                                                        value={p.tipo_respuesta}
                                                        onChange={(e) => actualizarPregunta(p._localId, "tipo_respuesta", e.target.value)}
                                                    >
                                                        {TIPOS_PREGUNTA.map(t => (
                                                            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="cr-table-cell-wide">
                                                    {TIPOS_CON_OPCIONES.includes(p.tipo_respuesta) ? (
                                                        <div className="cr-table-opciones-col">
                                                            {(p.opciones_seleccion || []).map((opt, oi) => (
                                                                <div key={oi} className="cr-table-opcion-row">
                                                                    <input
                                                                        type="text"
                                                                        className="cr-table-input-sm"
                                                                        value={opt}
                                                                        onChange={(e) => actualizarOpcion(p._localId, oi, e.target.value)}
                                                                        placeholder={`Opción ${oi + 1}`}
                                                                    />
                                                                    <button className="cr-table-x-btn" onClick={() => eliminarOpcion(p._localId, oi)}>✖</button>
                                                                </div>
                                                            ))}
                                                            <button className="cr-btn-add-opcion-sm" onClick={() => agregarOpcion(p._localId)}>
                                                                + opción
                                                            </button>
                                                        </div>
                                                    ) : p.tipo_respuesta === "SLIDER" ? (
                                                        <div className="cr-table-slider-range">
                                                            <input
                                                                type="number"
                                                                className="cr-table-input-xs"
                                                                value={p.slider_min}
                                                                onChange={(e) => actualizarPregunta(p._localId, "slider_min", e.target.value)}
                                                            />
                                                            <span className="cr-table-range-sep">a</span>
                                                            <input
                                                                type="number"
                                                                className="cr-table-input-xs"
                                                                value={p.slider_max}
                                                                onChange={(e) => actualizarPregunta(p._localId, "slider_max", e.target.value)}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="cr-table-no-aplica">— no aplica —</span>
                                                    )}
                                                </td>
                                                <td className="cr-table-cell-sm">
                                                    <input
                                                        type="number"
                                                        className="cr-table-input"
                                                        value={p.puntaje_asociado}
                                                        onChange={(e) => actualizarPregunta(p._localId, "puntaje_asociado", e.target.value)}
                                                    />
                                                </td>
                                                <td className="cr-table-cell-action">
                                                    <button
                                                        className="cr-table-delete-btn"
                                                        onClick={() => eliminarPregunta(p._localId)}
                                                        title="Eliminar fila"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="cr-footer-actions">
                                <button className="cr-btn-cancelar" onClick={() => { resetForm(); setVista("lista"); }}>
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleGuardar}
                                    disabled={isSaving}
                                    className="cr-btn-guardar"
                                >
                                    {isSaving ? "Guardando..." : `Guardar ${esFormulario ? "Formulario" : "Reto"}`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── MODO: IMPORTAR JSON ─────────────────────────────────── */}
                    {modo === "json" && (
                        <div className="cr-card">
                            <div className="cr-card-header">
                                <h3>Importar desde JSON</h3>
                                <button className="cr-icon-btn" onClick={descargarEjemploJson}>📥 Descargar ejemplo</button>
                            </div>

                            <p className="cr-json-instructions">
                                Sube un archivo <code>.json</code> con la estructura: <code>titulo</code> (o <code>nombre_reto</code>), <code>descripcion</code>, <code>rol_destino</code>, y un array <code>preguntas</code> con <code>texto_pregunta</code>, <code>tipo_respuesta</code>, <code>opciones_seleccion</code> y <code>puntaje_asociado</code>. Para SLIDER usa <code>opciones_seleccion: {"{min, max}"}</code>.
                            </p>

                            <input
                                type="file"
                                accept=".json,application/json"
                                onChange={handleArchivoJson}
                                className="cr-file-input"
                            />

                            <textarea
                                className="cr-input cr-json-textarea"
                                value={jsonTexto}
                                onChange={(e) => setJsonTexto(e.target.value)}
                                placeholder="O pega aquí directamente el contenido JSON..."
                            />

                            {jsonError && (
                                <p className="cr-json-error">{jsonError}</p>
                            )}

                            <div className="cr-footer-actions">
                                <button className="cr-btn-cancelar" onClick={() => { resetForm(); setVista("lista"); }}>
                                    Cancelar
                                </button>
                                <button
                                    onClick={aplicarJsonAlFormulario}
                                    disabled={!jsonTexto.trim()}
                                    className="cr-btn-guardar"
                                >
                                    Cargar JSON y revisar
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

        </div>
    );
};
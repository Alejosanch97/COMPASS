import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/ejecutarReto.css";

/**
 * EjecutarReto
 * Usa exactamente los mismos divs/clases que el formulario original
 * (form-card, options-vertical-premium, check-label-row, label-text,
 * textarea-group-premium) para que el CSS se aplique igual y se vea
 * idéntico, sin importar que las preguntas ahora sean dinámicas.
 */
export const EjecutarReto = ({ userData, apiFetch, retoId, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [reto, setReto] = useState(null);
    const [respuestas, setRespuestas] = useState({});
    const [statusActual, setStatusActual] = useState(null);
    const [cumplimiento, setCumplimiento] = useState([]);
    const [registrosTransformar, setRegistrosTransformar] = useState([]);
    const [puntosMatriz, setPuntosMatriz] = useState({
        transparency: 0, privacy: 0, bias: 0, agency: 0, supervision: 0
    });

    const isDirectivo = userData.rol === "DIRECTIVO";
    const [secuenciaDeepen, setSecuenciaDeepen] = useState({
        inicioIA: null, inicioDocente: null, inicioEstudiante: null,
        desarrolloIA: null, desarrolloDocente: null, desarrolloEstudiante: null,
        cierreSinIA: null, cierreReflexion: null, cierreIA: null
    });
    const descriptoresUNESCO = {
        transparency: [
            "No conozco cómo funciona la herramienta ni sus limitaciones. Caja negra.",
            "Sé que es IA, pero no puedo explicar cómo genera respuestas ni sus límites.",
            "Entiendo de manera general su lógica (generativa/predictiva), pero no explico límites.",
            "Puedo explicar su funcionamiento y límites. Informo a estudiantes cuando la uso.",
            "Integro explicación de funcionamiento, sesgos y trazabilidad como parte del aprendizaje."
        ],
        privacy: [
            "No he revisado políticas de datos. Se ingresan datos personales sin criterio.",
            "Sé que existen términos de uso, pero no los he analizado ni adaptado.",
            "Evito compartir datos sensibles, pero no tengo claridad total sobre el almacenamiento.",
            "Reviso términos, evito datos personales y explico a estudiantes qué se comparte.",
            "Protección estructurada: consentimiento informado y análisis previo de riesgos."
        ],
        bias: [
            "No considero la posibilidad de sesgos ni reviso resultados críticamente.",
            "Reconozco que podría haber sesgos, pero no los evalúo activamente.",
            "Reviso algunos resultados buscando posibles sesgos evidentes.",
            "Evalúo respuestas considerando diversidad cultural, género y contexto local.",
            "Diseño inclusivo: incorporo el análisis crítico de sesgos en el proceso pedagógico."
        ],
        agency: [
            "Riesgo alto: La herramienta reemplaza procesos cognitivos centrales sin mediación.",
            "Uso instrumental: Se utiliza principalmente para producir respuestas rápidas.",
            "Apoyo parcial: La herramienta apoya tareas, pero no siempre hay reflexión crítica.",
            "Mediación pedagógica: La IA es apoyo y el docente mantiene preguntas críticas.",
            "Agencia fortalecida: La IA amplifica el pensamiento y promueve metacognición."
        ],
        supervision: [
            "Riesgo alto: Las decisiones de la herramienta se aceptan sin revisión.",
            "Supervisión ocasional: Reviso resultados solo cuando parecen problemáticos.",
            "Supervisión regular: Reviso resultados antes de validarlos sin protocolo definido.",
            "Control estructurado: Existe revisión sistemática antes de influir en decisiones.",
            "Supervisión significativa: Control total, límites claros y justificación pedagógica."
        ]
    };

    const TOOLTIPS_INTERVENCION = {
        "Andamiaje temporal": {
            breve: "La IA actúa como apoyo provisional para ayudar al estudiante a avanzar en una tarea que aún no puede realizar solo. El control y la responsabilidad final permanecen en el estudiante.",
            ampliado: "En este tipo de intervención, la IA cumple una función de apoyo gradual: ofrece ejemplos, preguntas guía, pistas o retroalimentación inicial. Su propósito es facilitar comprensión o desbloquear dificultades, pero no sustituye el proceso cognitivo. Desde el marco UNESCO 2024, este uso es coherente cuando fortalece autonomía progresiva y no genera dependencia permanente.",
            pregunta: "¿La IA puede retirarse sin que el estudiante pierda capacidad de resolver la tarea?",
            alerta: null
        },
        "Apoyo conceptual": {
            breve: "La IA ayuda a clarificar conceptos, ofrecer explicaciones alternativas o ejemplos adicionales para fortalecer comprensión.",
            ampliado: "Aquí la IA cumple una función explicativa o de ampliación conceptual. Puede reformular ideas, proporcionar analogías o presentar perspectivas adicionales. Debe utilizarse con supervisión docente para evitar simplificaciones incorrectas o información inexacta. Según UNESCO, este uso es pertinente cuando mejora comprensión sin sustituir el análisis crítico del estudiante.",
            pregunta: "¿El estudiante analiza y contrasta la explicación de la IA con otras fuentes?",
            alerta: null
        },
        "Simulación exploratoria": {
            breve: "La IA permite explorar escenarios, casos o situaciones hipotéticas para promover pensamiento crítico y toma de decisiones.",
            ampliado: "En este caso, la IA actúa como entorno interactivo para experimentar ideas, escenarios o problemas complejos. No produce el resultado final del estudiante, sino que amplía posibilidades de análisis y discusión. Este tipo de uso es altamente alineado con DEEPEN cuando promueve reflexión, argumentación y evaluación crítica.",
            pregunta: "¿La simulación genera debate, análisis o toma de decisiones fundamentadas?",
            alerta: null
        },
        "Producción final": {
            breve: "La IA interviene directamente en la elaboración del producto final evaluado. Este uso requiere justificar cómo se mantiene la autoría y el juicio humano.",
            ampliado: "Aquí la IA participa en la generación directa del producto que será evaluado. Este es el tipo de intervención de mayor riesgo en términos de agencia, autoría y pensamiento profundo. Desde el enfoque UNESCO 2024, solo es pedagógicamente justificable si: Existe supervisión docente clara, se evalúa el proceso no solo el resultado, se mantiene evidencia de pensamiento propio del estudiante y hay instancia sin IA que demuestre comprensión.",
            pregunta: "Justifique cómo esta decisión preserva agencia estudiantil y supervisión humana significativa.",
            alerta: "Según el enfoque UNESCO 2024, la IA no debe sustituir la autoría ni el juicio profesional. Justifica por qué esta decisión mantiene agencia humana."
        }
    };

    const calcularPatronUNESCO = (seq) => {
        const I_IA = seq.inicioIA === 'Sí';
        const I_DOC = seq.inicioDocente === 'Sí';
        const I_EST = seq.inicioEstudiante === 'Sí';
        const D_IA = seq.desarrolloIA === 'Sí';
        const D_DOC = seq.desarrolloDocente === 'Sí';
        const D_EST = seq.desarrolloEstudiante === 'Sí';
        const C_SINIA = seq.cierreSinIA === 'Sí';
        const META = seq.cierreReflexion === 'Sí';
        const C_IA = seq.cierreIA === 'Sí';

        let indice = 0;
        indice += I_IA ? 5 : 8;
        indice += I_DOC ? 5 : -5;
        indice += I_EST ? 10 : 0;
        indice += D_IA ? 10 : 0;
        indice += D_DOC ? 5 : -5;
        indice += D_EST ? 15 : -10;
        indice += C_SINIA ? 15 : -15;
        indice += META ? 15 : -10;
        indice += C_IA ? 5 : 10;
        const conteoIA = [I_IA, D_IA, C_IA].filter(Boolean).length;
        if (conteoIA === 3 && !C_SINIA) indice -= 10;
        indice = Math.max(0, Math.min(100, indice));

        if (indice >= 85) return { color: "#16a34a", titulo: "🟢 Integración Human-Centred Sólida", resultado: "La arquitectura pedagógica evidencia un equilibrio estructural robusto entre inteligencia artificial, mediación docente y autonomía estudiantil. La IA cumple una función estratégica claramente delimitada, potenciando procesos cognitivos específicos sin sustituir el juicio humano ni el pensamiento crítico.", recomendacion: "Para sostener este nivel de madurez, continúa explicitando los criterios de uso de IA y fortaleciendo la comparación entre producción humana y producción asistida. Este diseño se alinea de forma consistente con el nivel DEEPEN del marco UNESCO 2024, al demostrar integración crítica, ética y pedagógicamente fundamentada." };
        if (indice >= 70) return { color: "#2563eb", titulo: "🔵 Uso Estratégico Consolidado", resultado: "La secuencia presenta una integración intencional de la IA con predominio de agencia humana. Existen momentos claros de mediación docente y espacios de validación cognitiva que reducen el riesgo de dependencia.", recomendacion: "Podrías fortalecer aún más la metacognición estructurada para avanzar hacia un modelo plenamente human-centred. El diseño refleja coherencia con principios de andamiaje progresivo promovidos por UNESCO." };
        if (indice >= 50) return { color: "#eab308", titulo: "🟡 Integración Funcional con Riesgos Moderados", resultado: "La IA cumple un rol operativo relevante dentro de la secuencia, pero el equilibrio estructural aún no es completamente estable. Algunos momentos pueden favorecer dependencia si no se explicita la reflexión crítica.", recomendacion: "Se recomienda consolidar instancias obligatorias sin IA y reforzar análisis metacognitivo del proceso y del output generado. La competencia en IA implica comprensión crítica, no únicamente uso técnico." };
        if (indice >= 30) return { color: "#f97316", titulo: "🟠 Dependencia Parcial en Desarrollo", resultado: "La herramienta tecnológica comienza a estructurar decisiones cognitivas clave sin suficiente validación autónoma. La agencia estudiantil y la mediación docente requieren mayor presencia para equilibrar el ecosistema.", recomendacion: "Prioriza rediseñar el cierre incorporando evaluación sin IA y defensa argumentativa del proceso. Sin estos elementos, el diseño podría debilitar la autenticidad del aprendizaje." };
        return { color: "#dc2626", titulo: "🔴 Alta Dependencia Estructural", resultado: "La IA organiza de manera predominante el flujo didáctico sin evidencias claras de autonomía cognitiva ni supervisión pedagógica suficiente. El riesgo de sustitución del pensamiento humano es elevado.", recomendacion: "Es imprescindible rediseñar la secuencia incorporando momentos sin IA, reflexión metacognitiva explícita y mayor intervención docente. Este escenario representa el nivel de mayor alerta dentro del marco UNESCO 2024." };
    };

    useEffect(() => {
        setRespuestas({});
        fetchRetoData();
        window.scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [retoId]);

    const fetchRetoData = async () => {
        setLoading(true);
        try {
            const [retosAsignados, avance] = await Promise.all([
                apiFetch(`/api/mi-empresa/retos?fase=TRANSFORMAR`).catch(() => []),
                apiFetch(`/api/retos-transformar/${retoId}`).catch(() => null),
            ]);

            if (userData.rol === "DIRECTIVO") {
                const todosLosRetos = await apiFetch(`/api/empresa/retos-transformar`).catch(() => []);
                setRegistrosTransformar(Array.isArray(todosLosRetos) ? todosLosRetos : []);
            }

            const retoEncontrado = Array.isArray(retosAsignados)
                ? retosAsignados.find(r => r.id === parseInt(retoId))
                : null;
            setReto(retoEncontrado);

            if (avance && avance.datos_json?.respuestas) {
                setRespuestas(avance.datos_json.respuestas);
                setStatusActual(avance.status_reto);
                setCumplimiento(avance.datos_json.cumplimiento || []);
                if (avance.datos_json.puntosMatriz) {
                    setPuntosMatriz(avance.datos_json.puntosMatriz);
                }
                if (avance.datos_json.secuenciaDeepen) {
                    setSecuenciaDeepen(avance.datos_json.secuenciaDeepen);
                }
            } else {
                setStatusActual(null);
            }
        } catch (e) {
            console.error("Error al cargar datos del reto:", e);
        } finally {
            setLoading(false);
        }
    };

    const preguntas = reto?.config_json?.preguntas || [];

    const handleInputChange = (idx, value) => {
        setRespuestas(prev => ({ ...prev, [idx]: value }));
    };

    const handleCheckbox = (idx, value) => {
        setRespuestas(prev => {
            const actual = prev[idx] || [];
            const nuevo = actual.includes(value)
                ? actual.filter(v => v !== value)
                : [...actual, value];
            return { ...prev, [idx]: nuevo };
        });
    };

    const toggleCumplimiento = (item) => {
        setCumplimiento(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const handleOrden = (idx, value) => {
        setRespuestas(prev => {
            const actual = prev[idx] || [];
            const nuevo = actual.includes(value)
                ? actual.filter(v => v !== value)
                : [...actual, value];
            return { ...prev, [idx]: nuevo };
        });
    };

    const cleanOptionText = (text) => {
        if (!text) return "";
        return String(text).replace(/\s*\([^)]+\)$/, "").trim();
    };

    const calcularPuntajeTotal = () => {
        let total = 0;
        preguntas.forEach((p, idx) => {
            const val = respuestas[idx];
            if (val === undefined || val === null) return;

            if (p.tipo_respuesta === "ORDEN") {
                total += parseFloat(p.puntaje_asociado || 0);
            } else if (Array.isArray(val)) {
                val.forEach(v => {
                    const match = String(v).match(/\(([^)]+)\)$/);
                    if (match) total += parseFloat(match[1].replace(',', '.'));
                });
            } else {
                const match = String(val).match(/\(([^)]+)\)$/);
                if (match) {
                    total += parseFloat(match[1].replace(',', '.'));
                } else if (["PARRAFO", "ABIERTA"].includes(p.tipo_respuesta) && String(val).trim().length > 0) {
                    total += parseFloat(p.puntaje_asociado || 0);
                } else if (p.tipo_respuesta === "SLIDER") {
                    total += parseFloat(p.puntaje_asociado || 0);
                }
            }
        });
        return Math.round(total * 100) / 100;
    };

    const saveReto = async (statusFinal = 'COMPLETADO') => {
        const TIPOS_SIN_RESPUESTA = ["SECUENCIA_DEEPEN", "ANALISIS_INCLUSIVO_CREATE", "DASHBOARD_DIRECTIVO_R3"];
        const preguntasArray = reto.config_json?.preguntas || [];
        const totalPreguntas = preguntasArray.filter(p => !TIPOS_SIN_RESPUESTA.includes(p.tipo_respuesta)).length;
        const respondidas = preguntasArray.reduce((acc, p, idx) => {
            if (TIPOS_SIN_RESPUESTA.includes(p.tipo_respuesta)) return acc;
            const val = respuestas[idx];
            const tieneValor = val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
            return tieneValor ? acc + 1 : acc;
        }, 0);

        if (statusFinal === 'COMPLETADO' && respondidas < totalPreguntas) {
            const confirmacion = await Swal.fire({
                title: "Misión incompleta",
                text: `Has respondido ${respondidas} de ${totalPreguntas} preguntas. ¿Deseas guardar como borrador en su lugar?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Guardar borrador",
                cancelButtonText: "Seguir respondiendo",
                confirmButtonColor: "#c5a059",
            });
            if (!confirmacion.isConfirmed) return;
            statusFinal = 'BORRADOR';
        }

        setIsSaving(true);
        try {
            const puntajeTotal = calcularPuntajeTotal();
            const payload = {
                reto_plantilla_id: reto.id,
                numero_reto: reto.numero_orden || 1,
                nombre_reto: reto.nombre_reto || reto.nombre,
                nivel_unesco: reto.nivel_unesco,
                datos_json: { respuestas, puntaje_total: puntajeTotal, cumplimiento, puntosMatriz, secuenciaDeepen },
                status_reto: statusFinal,
            };

            await apiFetch("/api/retos-transformar", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            setStatusActual(statusFinal);

            if (statusFinal === 'COMPLETADO') {
                await Swal.fire({
                    title: "¡Misión Enviada!",
                    text: "Tu evidencia ha sido registrada correctamente.",
                    icon: "success",
                    confirmButtonColor: "#c5a059",
                    timer: 2500,
                });
                onNavigate('fase_transformar');
            } else {
                Swal.fire({
                    title: "Borrador Guardado",
                    icon: "success",
                    confirmButtonColor: "#c5a059",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "No se pudo guardar tu progreso. Inténtalo de nuevo.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="atlas-unique-page-wrapper">
                <div className="atlas-sync-float">
                    <div className="atlas-sync-pill">
                        <span className="sync-icon">🔄</span>
                        <span className="sync-text">Cargando misión...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!reto) {
        return (
            <div className="atlas-unique-page-wrapper">
                <main className="atlas-unique-main-content">
                    <section className="form-card" style={{ textAlign: "center" }}>
                        <h3>Misión no encontrada</h3>
                        <p>Es posible que este reto ya no esté asignado a tu empresa.</p>
                        <button className="btn-back-minimal" onClick={() => onNavigate('fase_transformar')}>⬅ Volver</button>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="atlas-unique-page-wrapper">
            <main className="atlas-unique-main-content">

                {/* CABECERA INTEGRADA — idéntica al original */}
                <div className="atlas-unique-header-container">
                    <header className="reto-header-inline">
                        <div className="header-left">
                            <button className="btn-back-minimal" onClick={() => onNavigate('fase_transformar')}>⬅ Volver</button>
                            <div className="badge-reto-id">Misión {reto.numero_orden || ""}</div>
                        </div>
                        <div className="atlas-unique-title-box">
                            <h2>{reto.nombre_reto || reto.nombre}</h2>
                        </div>
                        <button className="btn-save-draft-premium" onClick={() => saveReto('BORRADOR')} disabled={isSaving}>
                            {isSaving ? "..." : " Guardar"}
                        </button>
                    </header>
                </div>

                {/* SECCIÓN NARRATIVA — mismo layout 2 columnas + mission-card del original */}
                <div className="atlas-unique-section-narrative">
                    <section className="narrative-hero-section">

                        {/* CARD 1: CONTEXTO */}
                        {reto.contexto_narrativo && (
                            <div className="narrative-card context-card">
                                <h3>Contexto</h3>
                                <div className="unesco-text">
                                    {reto.contexto_narrativo.split("\n").map((parrafo, i) => (
                                        parrafo.trim() && <p key={i}>{parrafo}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CARD 2: PREGUNTAS ORIENTADORAS + CONCEPTOS */}
                        {(reto.preguntas_orientadoras?.length > 0 || reto.conceptos_clave?.length > 0) && (
                            <div className="narrative-card info-card">
                                {reto.preguntas_orientadoras?.length > 0 && (
                                    <>
                                        <h3>Preguntas orientadoras:</h3>
                                        <ul className="narrative-list">
                                            {reto.preguntas_orientadoras.map((p, i) => <li key={i}>{p}</li>)}
                                        </ul>
                                    </>
                                )}
                                {reto.conceptos_clave?.length > 0 && (
                                    <div className="concepts-tag-box">
                                        <strong>Conceptos relacionados:</strong>
                                        <div className="tags-container">
                                            {reto.conceptos_clave.map((c, i) => <span key={i} className="tag">{c}</span>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CARD 3: MISIÓN — esta SÍ es oscura a propósito (igual que el original) */}
                        <div className="narrative-card mission-card">
                            <h3>Tu Misión</h3>
                            <p>{reto.mision_texto || reto.descripcion}</p>

                            {reto.objetivos_aprendizaje?.length > 0 && (
                                <div className="condiciones-box">
                                    <strong>Objetivos de aprendizaje</strong>
                                    <ol className="mission-list">
                                        {reto.objetivos_aprendizaje.map((obj, i) => <li key={i}>{obj}</li>)}
                                    </ol>
                                </div>
                            )}
                        </div>
                        {reto.lectura_previa?.activa && (
                            <div className="pre-mission-notice">
                                <div className="notice-badge">LECTURA PREVIA</div>
                                <h4>Antes de comenzar</h4>

                                {reto.lectura_previa.intro_texto && (
                                    <p>{reto.lectura_previa.intro_texto}</p>
                                )}

                                {reto.lectura_previa.intro_destacado && (
                                    <p>
                                        Se espera que primero <strong>{reto.lectura_previa.intro_destacado}</strong>, y luego regreses a documentar tu rediseño con criterio profesional.
                                    </p>
                                )}

                                {(reto.lectura_previa.tiempo || reto.lectura_previa.proposito) && (
                                    <div className="notice-grid">
                                        {reto.lectura_previa.tiempo && (
                                            <div className="notice-item">
                                                <strong>⏳ Tiempo</strong>
                                                <span>{reto.lectura_previa.tiempo}</span>
                                            </div>
                                        )}
                                        {reto.lectura_previa.proposito && (
                                            <div className="notice-item">
                                                <strong>💡 Propósito</strong>
                                                <span>{reto.lectura_previa.proposito}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {reto.lectura_previa.puntos?.filter(p => p.trim()).length > 0 && (
                                    <ul className="notice-list">
                                        {reto.lectura_previa.puntos.filter(p => p.trim()).map((punto, i) => (
                                            <li key={i}>{punto}</li>
                                        ))}
                                    </ul>
                                )}

                                {reto.lectura_previa.nota_footer && (
                                    <div className="notice-footer">
                                        <span>{reto.lectura_previa.nota_footer}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>

                {/* FORMULARIO DINÁMICO — cada pregunta es un form-card normal (blanco), igual que el original */}
                <div className="atlas-unique-form-wrapper">
                    {preguntas.length === 0 ? (
                        <section className="form-card">
                            <p style={{ color: "#94a3b8" }}>Esta misión todavía no tiene preguntas configuradas.</p>
                        </section>
                    ) : (
                        preguntas.map((p, idx) => (
                            <section key={idx} className="form-card">
                                <div className="form-section-title">{idx + 1}. {p.texto_pregunta}</div>
                                {p.descripcion_pregunta && (
                                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '15px', marginTop: '-10px' }}>
                                        {p.descripcion_pregunta}
                                    </p>
                                )}

                                {p.tipo_respuesta === "MULTIPLE" && (
                                    <div className="options-vertical-premium">
                                        {(p.opciones_seleccion || []).map(opt => (
                                            <label key={opt} className="check-label-row">
                                                <input
                                                    type="radio"
                                                    name={`q_${idx}`}
                                                    value={opt}
                                                    checked={respuestas[idx] === opt}
                                                    onChange={() => handleInputChange(idx, opt)}
                                                />
                                                <span className="label-text">{cleanOptionText(opt)}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {(p.tipo_respuesta === "CHECKBOX" || p.tipo_respuesta === "SELECT") && (
                                    <div className="options-vertical-premium">
                                        {(p.opciones_seleccion || []).map(opt => (
                                            <label key={opt} className="check-label-row">
                                                <input
                                                    type={p.tipo_respuesta === "SELECT" ? "radio" : "checkbox"}
                                                    name={p.tipo_respuesta === "SELECT" ? `q_${idx}` : undefined}
                                                    value={opt}
                                                    checked={p.tipo_respuesta === "SELECT" ? respuestas[idx] === opt : (respuestas[idx] || []).includes(opt)}
                                                    onChange={() => p.tipo_respuesta === "SELECT" ? handleInputChange(idx, opt) : handleCheckbox(idx, opt)}
                                                />
                                                <span className="label-text">{cleanOptionText(opt)}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {p.tipo_respuesta === "ORDEN" && (
                                    <div className="options-vertical-premium">
                                        <p style={{ fontSize: '0.7rem', color: '#c5a059', marginBottom: '8px' }}>Selecciona las opciones en orden de prioridad:</p>
                                        {(p.opciones_seleccion || []).map(opt => {
                                            const orderIndex = (respuestas[idx] || []).indexOf(opt);
                                            return (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    className="check-label-row"
                                                    onClick={() => handleOrden(idx, opt)}
                                                    style={{
                                                        justifyContent: 'space-between',
                                                        cursor: 'pointer',
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        background: orderIndex !== -1 ? '#fffbeb' : undefined,
                                                        borderColor: orderIndex !== -1 ? '#c5a059' : undefined,
                                                    }}
                                                >
                                                    <span className="label-text">{cleanOptionText(opt)}</span>
                                                    {orderIndex !== -1 && (
                                                        <span style={{
                                                            backgroundColor: '#c5a059', color: 'white', borderRadius: '50%',
                                                            width: '22px', height: '22px', display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0
                                                        }}>
                                                            {orderIndex + 1}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {["ABIERTA", "PARRAFO"].includes(p.tipo_respuesta) && (
                                    <div className="textarea-group-premium">
                                        <textarea
                                            placeholder={p.tipo_respuesta === "PARRAFO" ? "Escribe un párrafo detallado..." : "Respuesta corta..."}
                                            value={respuestas[idx] || ""}
                                            onChange={(e) => handleInputChange(idx, e.target.value)}
                                        />
                                    </div>
                                )}

                                {p.tipo_respuesta === "SLIDER" && (
                                    <div style={{ marginTop: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                                            <span>{p.opciones_seleccion?.min ?? 1}</span>
                                            <span>{p.opciones_seleccion?.max ?? 5}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={p.opciones_seleccion?.min ?? 1}
                                            max={p.opciones_seleccion?.max ?? 5}
                                            value={respuestas[idx] ?? p.opciones_seleccion?.min ?? 1}
                                            onChange={(e) => handleInputChange(idx, e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                )}

                                {p.tipo_respuesta === "SECUENCIA_DEEPEN" && (() => {
                                    const BinaryBtn = ({ label, campo }) => (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>{label}</span>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {['Sí', 'No'].map(opt => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setSecuenciaDeepen(prev => ({ ...prev, [campo]: opt }))}
                                                        style={{
                                                            flex: 1, padding: '8px', borderRadius: '10px', border: '2px solid',
                                                            borderColor: secuenciaDeepen[campo] === opt ? 'var(--atlas-gold)' : '#e2e8f0',
                                                            background: secuenciaDeepen[campo] === opt ? 'var(--atlas-gold)' : 'white',
                                                            color: secuenciaDeepen[campo] === opt ? 'white' : '#64748b',
                                                            fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                                                        }}
                                                    >{opt}</button>
                                                ))}
                                            </div>
                                        </div>
                                    );

                                    const patron = calcularPatronUNESCO(secuenciaDeepen);

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                                            {/* INICIO */}
                                            <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <h5 style={{ color: 'var(--atlas-gold)', fontWeight: '800', marginBottom: '15px', fontSize: '0.9rem' }}>EN EL INICIO (PLANEACIÓN)</h5>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                                    <BinaryBtn label="¿Interviene IA?" campo="inicioIA" />
                                                    <BinaryBtn label="¿Interviene docente?" campo="inicioDocente" />
                                                    <BinaryBtn label="¿Interviene estudiante sin IA?" campo="inicioEstudiante" />
                                                </div>
                                            </div>

                                            {/* DESARROLLO */}
                                            <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <h5 style={{ color: 'var(--atlas-gold)', fontWeight: '800', marginBottom: '15px', fontSize: '0.9rem' }}>EN EL DESARROLLO (EJECUCIÓN)</h5>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                                    <BinaryBtn label="¿Interviene IA?" campo="desarrolloIA" />
                                                    <BinaryBtn label="¿Interviene docente?" campo="desarrolloDocente" />
                                                    <BinaryBtn label="¿Interviene estudiante sin IA?" campo="desarrolloEstudiante" />
                                                </div>
                                            </div>

                                            {/* CIERRE */}
                                            <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <h5 style={{ color: 'var(--atlas-gold)', fontWeight: '800', marginBottom: '15px', fontSize: '0.9rem' }}>EN EL CIERRE</h5>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                                    <BinaryBtn label="¿Hay instancia sin IA obligatoria?" campo="cierreSinIA" />
                                                    <BinaryBtn label="¿Hay reflexión metacognitiva?" campo="cierreReflexion" />
                                                    <BinaryBtn label="¿Interviene IA?" campo="cierreIA" />
                                                </div>
                                            </div>

                                            {/* PANEL DE ANÁLISIS AUTOMÁTICO */}
                                            <div style={{
                                                padding: '25px', borderRadius: '20px',
                                                border: `2px solid ${patron.color}`,
                                                background: `${patron.color}10`,
                                                animation: 'fadeIn 0.5s ease'
                                            }}>
                                                <h4 style={{ color: patron.color, fontWeight: '900', marginBottom: '15px' }}>
                                                    {patron.titulo}
                                                </h4>
                                                <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '15px' }}>
                                                    {patron.resultado}
                                                </p>
                                                {patron.recomendacion && (
                                                    <div>
                                                        <strong style={{ display: 'block', color: '#1e293b' }}>Recomendación:</strong>
                                                        <p style={{ margin: '5px 0 0 0' }}>{patron.recomendacion}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {p.tipo_respuesta === "SELECT_CON_TOOLTIP" && (() => {
                                    const valorSeleccionado = respuestas[idx] || "";
                                    const tooltip = TOOLTIPS_INTERVENCION[valorSeleccionado];

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {/* SELECT */}
                                            <select
                                                className="atlas-select-premium"
                                                value={valorSeleccionado}
                                                onChange={(e) => handleInputChange(idx, e.target.value)}
                                                style={{
                                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                                    border: '1.5px solid #e2e8f0', fontSize: '0.95rem',
                                                    color: '#334155', background: '#fafbfc', cursor: 'pointer'
                                                }}
                                            >
                                                <option value="">Seleccione una categoría...</option>
                                                {(p.opciones_seleccion || []).map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>

                                            {/* PANEL EXPLICATIVO — aparece solo si hay selección */}
                                            {tooltip && (
                                                <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                                    {/* TOOLTIP BREVE */}
                                                    <div style={{
                                                        padding: '15px', background: 'rgba(197, 160, 89, 0.08)',
                                                        borderRadius: '12px', borderLeft: '4px solid var(--atlas-gold)'
                                                    }}>
                                                        <strong style={{ display: 'block', color: 'var(--atlas-gold)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>
                                                            Tooltip breve:
                                                        </strong>
                                                        <p style={{ margin: 0, fontStyle: 'italic', color: '#334155', fontSize: '0.95rem' }}>
                                                            "{tooltip.breve}"
                                                        </p>
                                                    </div>

                                                    {/* ALERTA — solo para Producción final */}
                                                    {tooltip.alerta && (
                                                        <div style={{
                                                            padding: '15px', background: '#fef2f2',
                                                            border: '1px solid #fee2e2', borderRadius: '12px', color: '#991b1b'
                                                        }}>
                                                            <strong>⚠️ Alerta pedagógica:</strong> {tooltip.alerta}
                                                        </div>
                                                    )}

                                                    {/* VERSIÓN AMPLIADA */}
                                                    <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                        <strong style={{ display: 'block', fontSize: '0.85rem', color: '#1e293b', marginBottom: '8px' }}>
                                                            Versión ampliada:
                                                        </strong>
                                                        <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
                                                            {tooltip.ampliado}
                                                        </p>
                                                        {/* PREGUNTA ORIENTADORA */}
                                                        <div style={{
                                                            padding: '10px 14px', background: 'white',
                                                            borderRadius: '8px', border: '1px dashed #e2e8f0'
                                                        }}>
                                                            <strong style={{ fontSize: '0.78rem', color: 'var(--atlas-gold)', display: 'block', marginBottom: '4px' }}>
                                                                Pregunta orientadora:
                                                            </strong>
                                                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                                                {tooltip.pregunta}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {p.tipo_respuesta === "ANALISIS_INCLUSIVO_CREATE" && (() => {
                                    // Lee las respuestas de las preguntas relevantes por su índice en el JSON
                                    const bloom = respuestas[1] || "";                          // pregunta índice 1
                                    const garantias = respuestas[8] || [];                      // pregunta índice 8
                                    const validacion = respuestas[12] || [];                    // pregunta índice 12
                                    const riesgos = respuestas[7] || [];                        // pregunta índice 7

                                    const nivelAlto = ['Analizar', 'Evaluar', 'Crear'];
                                    const nivelMedio = ['Aplicar'];
                                    const esNivelAlto = nivelAlto.includes(bloom);
                                    const esNivelMedio = nivelMedio.includes(bloom);
                                    const esNivelBajo = ['Recordar', 'Comprender'].includes(bloom);

                                    const numGarantias = garantias.length;
                                    const tieneEstandarComun = garantias.includes('Todas las variantes conducen al mismo estándar de evaluación.');
                                    const tieneObjetivoComun = garantias.includes('El objetivo cognitivo es común y visible para todo el grupo.');
                                    const tieneComprobacion = validacion.length > 0;
                                    const riesgosSistemicosLista = ['Sesgo algorítmico', 'Perfilamiento', 'Dependencia diferencial', 'Invisibilización de fortalezas'];
                                    const identificaRiesgoSistemico = riesgos.some(r => riesgosSistemicosLista.includes(r));

                                    let patron, titulo, color, mensaje;

                                    if (esNivelAlto && numGarantias >= 4 && tieneComprobacion && identificaRiesgoSistemico) {
                                        patron = 1;
                                        color = "#16a34a";
                                        titulo = "🟢 Diseño Inclusivo Estructural";
                                        mensaje = "Tu estrategia evidencia un diseño inclusivo mediado por IA con impacto estructural en equidad. Se mantiene un objetivo cognitivo de alta complejidad, se amplían oportunidades sin reducción de estándares y se activan garantías claras de rigor.\n\nAdemás, identificas riesgos sistémicos y defines mecanismos para comprobar impacto, lo cual está alineado con:\n• UNESCO AI Competency Framework for Teachers (CREATE, 2024)\n• Principios de Diseño Universal para el Aprendizaje (DUA)\n• Enfoque de equidad estructural (no segmentación)\n\nTu estrategia es potencialmente transferible a otros contextos.";
                                    }

                                    else if (esNivelAlto && numGarantias >= 4 && tieneComprobacion && !identificaRiesgoSistemico) {
                                        patron = 2;
                                        color = "#2563eb";
                                        titulo = "🔵 Inclusión Avanzada con Oportunidad de Mejora";
                                        mensaje = "Tu diseño mantiene rigor cognitivo y evidencia mecanismos claros de equidad y evaluación común. Para consolidarse plenamente en nivel CREATE, sería recomendable fortalecer la identificación de riesgos sistémicos (sesgo algorítmico, perfilamiento, dependencia diferencial), tal como sugieren:\n• UNESCO 2024 (dimensión ética avanzada)\n• Recomendación UNESCO 2021 sobre IA y derechos humanos\n\nLa innovación inclusiva requiere anticipar posibles efectos estructurales.";
                                    }

                                    else if ((esNivelAlto || esNivelMedio) && (numGarantias === 2 || numGarantias === 3) && tieneComprobacion) {
                                        patron = 3;
                                        color = "#eab308";
                                        titulo = "🟡 Inclusión Operativa en Desarrollo";
                                        mensaje = "Tu estrategia amplía oportunidades y mantiene cierta coherencia evaluativa. Sin embargo, las garantías estructurales aún no son suficientes para asegurar que la equidad sea sostenida y replicable.\n\nEl marco CREATE invita a pasar de ajustes puntuales a diseño estructural.\n\nSugerencia:\nFortalecer las garantías explícitas de estándar común y supervisión humana.";
                                    }

                                    else if (esNivelBajo && numGarantias <= 3) {
                                        patron = 4;
                                        color = "#f97316";
                                        titulo = "🟠 Estrategia con Riesgo de Reducción Cognitiva";
                                        mensaje = "Se observa intención inclusiva, pero el nivel de pensamiento trabajado podría no sostener la exigencia académica común.\n\nEl Diseño Universal para el Aprendizaje no implica simplificación del objetivo cognitivo, sino diversificación del acceso al mismo estándar.\n\nSegún UNESCO CREATE, la equidad no consiste en bajar la complejidad, sino en ampliar oportunidades para alcanzarla.\n\nRecomendación:\nRevisar el nivel cognitivo y explicitar cómo se mantiene la complejidad.";
                                    }

                                    else if (numGarantias >= 2 && !tieneComprobacion) {
                                        patron = 5;
                                        color = "#6366f1";
                                        titulo = "🔵 Inclusión Declarativa";
                                        mensaje = "Tu estrategia incorpora principios de equidad y dignidad. Sin embargo, no se ha definido cómo comprobarás que la estrategia amplió oportunidades sin reducir estándares.\n\nEn el nivel CREATE, el diseño debe ser verificable y transferible.\n\nSugerencia:\nIncorporar evidencia comparativa, defensa común o evaluación con criterio compartido.";
                                    }

                                    else {
                                        patron = 6;
                                        color = "#dc2626";
                                        titulo = "🔴 Diferenciación con Riesgo de Segmentación";
                                        mensaje = "Tu estrategia amplía apoyos, pero no se evidencian suficientes garantías de estándar común.\n\nLa inclusión estructural (UNESCO, UDL) requiere:\n• Objetivo cognitivo común\n• Criterio de evaluación compartido\n• Evitar etiquetamiento implícito\n\nSe recomienda fortalecer las garantías de rigor.";
                                    }

                                    return (
                                        <div>
                                            {/* RESUMEN DE DATOS */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                gap: '12px',
                                                marginBottom: '20px'
                                            }}>
                                                {[
                                                    { label: "Nivel cognitivo", valor: bloom || "No definido" },
                                                    { label: "Garantías de equidad", valor: `${numGarantias} / 5` },
                                                    { label: "Comprobación de impacto", valor: tieneComprobacion ? "Sí" : "No" },
                                                    { label: "Riesgos sistémicos", valor: identificaRiesgoSistemico ? "Identificados" : "No identificados" }
                                                ].map(item => (
                                                    <div key={item.label} style={{
                                                        padding: '14px 18px',
                                                        background: '#f8fafc',
                                                        borderRadius: '12px',
                                                        border: '1px solid #e2e8f0'
                                                    }}>
                                                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                            {item.label}
                                                        </div>
                                                        <div style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>
                                                            {item.valor}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* PANEL DE RESULTADO */}
                                            <div style={{
                                                padding: '25px',
                                                borderRadius: '20px',
                                                border: `2px solid ${color}`,
                                                background: `${color}10`,
                                                animation: 'fadeIn 0.5s ease'
                                            }}>
                                                <h4 style={{ color, fontWeight: '900', marginBottom: '15px', fontSize: '1.1rem' }}>
                                                    Nivel alcanzado: {titulo}
                                                </h4>
                                                <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#1e293b' }}>
                                                    {mensaje}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {p.tipo_respuesta === "DASHBOARD_DIRECTIVO_R3" && (() => {
                                    // Solo tiene sentido si hay registros de docentes cargados
                                    if (registrosTransformar.length === 0) {
                                        return (
                                            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', color: '#94a3b8', textAlign: 'center' }}>
                                                Aún no hay docentes con registros en el Reto 3 de tu institución.
                                            </div>
                                        );
                                    }

                                    const docentesUnicos = new Set();
                                    let sumaBloom = { Recordar: 0, Aplicar: 0, Comprender: 0, Analizar: 0, Evaluar: 0, Crear: 0 };
                                    let sumaGarantias = 0;
                                    let conteoReto3 = 0;
                                    let conComprobacion = 0;
                                    let conRiesgoSistemico = 0;
                                    const conteoMisiones = { r1: {}, r2: {}, r3: {} };
                                    const IDX = { r1: 8, r2: 20, r3: 14 };
                                    const riesgosSistemicosLista = ['Sesgo algorítmico', 'Perfilamiento', 'Dependencia diferencial', 'Invisibilización de fortalezas'];

                                    registrosTransformar.forEach(reg => {
                                        try {
                                            const datos = reg.datos_json || {};
                                            const resp = datos.respuestas || {};
                                            docentesUnicos.add(reg.usuario_id);

                                            const f1 = datos.fortalecerMision1 || (Array.isArray(resp[IDX.r1]) ? resp[IDX.r1] : null);
                                            const f2 = datos.fortalecerMision2 || (Array.isArray(resp[IDX.r2]) ? resp[IDX.r2] : null);
                                            const f3 = datos.fortalecerMision3 || (Array.isArray(resp[IDX.r3]) ? resp[IDX.r3] : null);
                                            if (f1) f1.forEach(t => conteoMisiones.r1[t] = (conteoMisiones.r1[t] || 0) + 1);
                                            if (f2) f2.forEach(t => conteoMisiones.r2[t] = (conteoMisiones.r2[t] || 0) + 1);
                                            if (f3) f3.forEach(t => conteoMisiones.r3[t] = (conteoMisiones.r3[t] || 0) + 1);

                                            if (reg.nivel_unesco === 'CREATE' || reg.numero_reto === 3) {
                                                conteoReto3++;
                                                const bloom = resp[1];
                                                const garantias = Array.isArray(resp[8]) ? resp[8] : [];
                                                const validacion = Array.isArray(resp[12]) ? resp[12] : [];
                                                const riesgos = Array.isArray(resp[7]) ? resp[7] : [];
                                                if (bloom && sumaBloom.hasOwnProperty(bloom)) sumaBloom[bloom]++;
                                                sumaGarantias += garantias.length;
                                                if (validacion.length > 0) conComprobacion++;
                                                if (riesgos.some(r => riesgosSistemicosLista.includes(r))) conRiesgoSistemico++;
                                            }
                                        } catch (e) { console.error(e); }
                                    });

                                    const totalDocentes = docentesUnicos.size || 1;
                                    const base = conteoReto3 || 1;
                                    const promedioGarantias = (sumaGarantias / base).toFixed(1);
                                    const pctComprobacion = Math.round((conComprobacion / base) * 100);
                                    const pctRiesgo = Math.round((conRiesgoSistemico / base) * 100);
                                    const nivelMasFrecuente = Object.entries(sumaBloom)
                                        .filter(([, v]) => v > 0)
                                        .sort(([, a], [, b]) => b - a)[0]?.[0] || "No definido";
                                    const nivelAltoBloom = ['Analizar', 'Evaluar', 'Crear'];
                                    const pctNivelAlto = Math.round(
                                        (nivelAltoBloom.reduce((acc, n) => acc + (sumaBloom[n] || 0), 0) / base) * 100
                                    );
                                    const indiceInclusion = Math.round(
                                        pctNivelAlto * 0.3 +
                                        (Math.min(parseFloat(promedioGarantias) / 5, 1) * 100) * 0.3 +
                                        pctComprobacion * 0.2 +
                                        pctRiesgo * 0.2
                                    );
                                    const colorIndice = indiceInclusion >= 70 ? '#16a34a' : indiceInclusion >= 50 ? '#eab308' : '#dc2626';

                                    const renderBarras = (metricas, titulo, color = '#C5A059') => {
                                        const items = Object.entries(metricas)
                                            .map(([tema, cantidad]) => ({ tema, cantidad, porcentaje: Math.round((cantidad / totalDocentes) * 100) }))
                                            .sort((a, b) => b.porcentaje - a.porcentaje);
                                        return (
                                            <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ fontSize: '0.9rem', color: '#1e293b', marginBottom: '15px', borderLeft: `4px solid ${color}`, paddingLeft: '10px' }}>
                                                    {titulo}
                                                </h4>
                                                {items.length === 0 ? (
                                                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Sin solicitudes aún.</p>
                                                ) : items.map(item => (
                                                    <div key={item.tema} style={{ marginBottom: '12px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                                                            <span style={{ color: '#475569', fontWeight: '500' }}>{item.tema}</span>
                                                            <span style={{ color: '#1e293b', fontWeight: 'bold' }}>{item.porcentaje}%</span>
                                                        </div>
                                                        <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${item.porcentaje}%`, height: '100%', background: item.porcentaje >= 50 ? '#b45309' : color, transition: 'width 0.5s ease' }} />
                                                        </div>
                                                        {item.porcentaje >= 50 && (
                                                            <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#92400e', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px', display: 'inline-block', fontWeight: '600' }}>
                                                                🆘 PRIORIDAD ALTA: Organizar taller técnico
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    };

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                            {/* CARD OSCURA */}
                                            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '15px', color: '#fff' }}>
                                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                    <span style={{ color: '#C5A059', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        Madurez UNESCO: Capacidad Grupal (Reto 3)
                                                    </span>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                                    {[
                                                        { label: "Nivel Cognitivo", valor: nivelMasFrecuente },
                                                        { label: "Garantías Equidad", valor: `${promedioGarantias} / 5` },
                                                        { label: "Comp. de Impacto", valor: `${pctComprobacion}% Profes` },
                                                        { label: "Riesgos Sistémicos", valor: `${pctRiesgo}% Ident.` },
                                                    ].map(item => (
                                                        <div key={item.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px' }}>
                                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{item.label}</div>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#C5A059' }}>{item.valor}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '3rem', fontWeight: '900', color: colorIndice }}>{indiceInclusion}%</div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>ÍNDICE DE INCLUSIÓN ESTRUCTURAL</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '12px' }}>Promedio institucional basado en el Marco UNESCO CREATE</div>
                                                    <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '10px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${indiceInclusion}%`, height: '100%', background: colorIndice, transition: 'width 1s ease', borderRadius: '10px' }} />
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '16px', textAlign: 'center' }}>
                                                    {totalDocentes} docente(s) registrado(s) · {conteoReto3} registro(s) del Reto 3
                                                </p>
                                            </div>

                                            {/* GRILLA DE MISIONES */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                                {renderBarras(conteoMisiones.r1, "Misión 1: Ética y Privacidad")}
                                                {renderBarras(conteoMisiones.r2, "Misión 2: Diseño Human-Centred")}
                                                {renderBarras(conteoMisiones.r3, "Misión 3: Inclusión y Equidad")}
                                            </div>

                                            {/* NOTA */}
                                            <div style={{ padding: '15px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef08a', fontSize: '0.9rem', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.2rem' }}>📊</span>
                                                <span><strong>Estado de la muestra:</strong> Se han procesado respuestas de <strong>{totalDocentes} docentes únicos</strong>.</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {p.tipo_respuesta === "MATRIZ_UNESCO" && (
                                    <div>
                                        {/* GRID DE 5 CRITERIOS — exacto al original */}
                                        <div className="unesco-matrix-grid">
                                            {[
                                                { id: 'transparency', label: 'Transparencia' },
                                                { id: 'privacy', label: 'Privacidad y Datos' },
                                                { id: 'bias', label: 'Sesgo y Equidad' },
                                                { id: 'agency', label: 'Agencia Estudiantil' },
                                                { id: 'supervision', label: 'Supervisión Humana' }
                                            ].map(c => (
                                                <div key={c.id} className="matrix-pill-row">
                                                    <div className="matrix-content-left">
                                                        <strong className="matrix-label">{c.label}</strong>
                                                        <div className="unesco-dynamic-descriptor">
                                                            {descriptoresUNESCO[c.id][puntosMatriz[c.id]]}
                                                        </div>
                                                    </div>
                                                    <div className="matrix-controls-right">
                                                        <input
                                                            type="range"
                                                            className="atlas-slider-premium"
                                                            min="0" max="4"
                                                            value={puntosMatriz[c.id]}
                                                            onChange={(e) => {
                                                                const valInt = parseInt(e.target.value);
                                                                const nuevos = { ...puntosMatriz, [c.id]: valInt };
                                                                setPuntosMatriz(nuevos);
                                                                // guardar el total en respuestas[idx]
                                                                const total = Object.values(nuevos).reduce((a, b) => a + b, 0);
                                                                handleInputChange(idx, { puntosMatriz: nuevos, total });
                                                            }}
                                                        />
                                                        <div className="matrix-score-badge">
                                                            <span className="level-label">NIVEL</span>
                                                            <span className="score-number">{puntosMatriz[c.id]}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* PANEL DE RESULTADO — Actualizado con textos UNESCO */}
                                        {(() => {
                                            const total = Object.values(puntosMatriz).reduce((a, b) => a + b, 0);
                                            let nivel, color, texto;

                                            if (total <= 7) {

                                                color = "#dc2626";
                                                texto = `Resultado: 🔴 Riesgo alto en el uso pedagógico de la herramienta

Tu análisis indica que el uso actual presenta debilidades significativas en términos de transparencia, supervisión humana, agencia estudiantil o gestión de datos. Desde el AI Competency Framework for Teachers (UNESCO, 2024), el uso responsable de IA exige comprensión básica de funcionamiento, análisis de riesgos éticos y control humano significativo. En este momento, la herramienta podría estar influyendo en procesos pedagógicos sin suficiente mediación crítica.

Antes de implementarla, se recomienda rediseñar su uso, fortalecer la comprensión técnica básica y asegurar que no sustituya el juicio profesional docente.

Recuerda, la IA no debe reemplazar criterio pedagógico. Debe amplificarlo.`;
                                            } else if (total <= 13) {

                                                color = "#f97316";
                                                texto = `Resultado: 🟠 Uso con intención pedagógica, pero con ajustes necesarios

Tu evaluación muestra conciencia ética inicial y cierta supervisión, pero aún existen áreas que requieren fortalecimiento. El marco UNESCO (2024) señala que una práctica responsable debe integrar análisis explícito de sesgos, protección de datos y garantía de agencia estudiantil. Algunos de estos elementos aparecen de forma parcial en tu análisis.

La herramienta puede utilizarse, pero es recomendable ajustar criterios de transparencia, formalizar la supervisión y hacer explícitos los límites de la IA ante los estudiantes.

Estás en transición hacia una práctica más estructurada.`;
                                            } else if (total <= 17) {

                                                color = "#eab308";
                                                texto = `Resultado: 🟡 Uso pedagógicamente fundamentado con supervisión adecuada

Tu análisis refleja una integración consciente de principios éticos y control humano significativo. De acuerdo con el AI Competency Framework for Teachers (UNESCO, 2024), este nivel demuestra alineación con un enfoque human-centred: la tecnología apoya el aprendizaje sin sustituir la agencia docente ni estudiantil.

Existen prácticas claras de revisión, consideración de sesgos y manejo responsable de datos. Aun así, puedes seguir fortaleciendo la explicitación pedagógica de límites y riesgos como parte del aprendizaje crítico de tus estudiantes.

Tu uso de esta herramienta muestra criterio profesional.`;
                                            } else {
                                                color = "#16a34a";
                                                texto = `Resultado: 🟢 Práctica sólida alineada con estándares internacionales

Tu análisis evidencia un uso éticamente estructurado, con transparencia, supervisión humana significativa, protección de datos y fortalecimiento de la agencia estudiantil. Este nivel está claramente alineado con el AI Competency Framework for Teachers (UNESCO, 2024), especialmente en las dimensiones de ética de la IA, gobernanza responsable y pedagogía centrada en lo humano.

La herramienta que analizaste no sustituye tu juicio profesional: lo complementa dentro de un marco crítico y deliberado.

En este nivel, la IA se integra como parte de una arquitectura pedagógica consciente y responsable.`;
                                            }

                                            return (
                                                <div className="atlas-interpretation-panel" style={{ marginTop: '20px' }}>
                                                    <div className="interpretation-header">
                                                        Puntaje Total: <strong>{total} / 20</strong>
                                                        <span style={{ marginLeft: '15px', color }}>{nivel}</span>
                                                    </div>
                                                    {/* Nota: style={{ whiteSpace: 'pre-line' }} asegura que se respeten los saltos de línea del texto */}
                                                    <div className="interpretation-content" style={{ whiteSpace: 'pre-line' }}>{texto}</div>
                                                </div>
                                            );
                                        })()}

                                        {/* PREGUNTAS DE INTEGRIDAD */}
                                        <hr className="atlas-hr-divider" style={{ margin: '25px 0' }} />
                                        <div className="integrity-questions-container">
                                            <label className="group-main-label">Evaluación de Integridad y Autenticidad:</label>
                                            {[
                                                { id: 'depCognitiva', q: '¿Esta herramienta podría generar dependencia cognitiva?' },
                                                { id: 'autenticidad', q: '¿Esta herramienta podría afectar la autenticidad del aprendizaje?' },
                                                { id: 'alineacion', q: '¿El uso está alineado con las políticas institucionales?' }
                                            ].map(item => (
                                                <div key={item.id} className="integrity-row">
                                                    <p className="integrity-text">{item.q}</p>
                                                    <div className="pills-container">
                                                        {['Sí', 'No', 'Posiblemente', 'No sé'].map(opt => {
                                                            const currentVal = (respuestas[idx] && typeof respuestas[idx] === 'object' && !respuestas[idx].puntosMatriz)
                                                                ? respuestas[idx][item.id]
                                                                : (respuestas[`integridad_${item.id}`] || "");
                                                            return (
                                                                <label key={opt} className={`pill-option ${currentVal === opt ? 'selected' : ''}`}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`${idx}_${item.id}`}
                                                                        value={opt}
                                                                        checked={currentVal === opt}
                                                                        onChange={() => {
                                                                            setRespuestas(prev => ({
                                                                                ...prev,
                                                                                [`integridad_${item.id}`]: opt
                                                                            }));
                                                                        }}
                                                                    />
                                                                    <span>{opt}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>
                        ))
                    )}
                </div>

                {/* DASHBOARD DIRECTIVO — idéntico al original, adaptado a Flask */}
                {userData.rol === "DIRECTIVO" && registrosTransformar.length > 0 && (
                    <div style={{
                        marginTop: '3rem', padding: '25px',
                        background: '#f8fafc', borderRadius: '20px', border: '2px solid #e2e8f0'
                    }}>
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', color: '#1e293b' }}>
                            Análisis de Capacidad Institucional (Consolidado)
                        </h2>

                        {(() => {
                            const docentesUnicos = new Set();
                            const conteoMisiones = { r1: {}, r2: {}, r3: {} };

                            // ── Índices de preguntas "Proyección" en cada reto (nuevo sistema dinámico)
                            // Reto 1: índice 8  | Reto 2: índice 20  | Reto 3: índice 14
                            const IDX = { r1: 8, r2: 20, r3: 14 };

                            // ── Para el análisis de inclusión — solo registros del Reto 3 (CREATE)
                            let sumaBloom = { Recordar: 0, Aplicar: 0, Comprender: 0, Analizar: 0, Evaluar: 0, Crear: 0 };
                            let sumaGarantias = 0;
                            let conteoReto3 = 0;
                            let conComprobacion = 0;
                            let conRiesgoSistemico = 0;
                            const riesgosSistemicosLista = [
                                'Sesgo algorítmico', 'Perfilamiento',
                                'Dependencia diferencial', 'Invisibilización de fortalezas'
                            ];

                            registrosTransformar.forEach(reg => {
                                try {
                                    const datos = reg.datos_json || {};
                                    const resp = datos.respuestas || {};
                                    docentesUnicos.add(reg.usuario_id);

                                    // Barras de fortalecimiento — compatible con ambos sistemas
                                    const f1 = datos.fortalecerMision1 || (Array.isArray(resp[IDX.r1]) ? resp[IDX.r1] : null);
                                    const f2 = datos.fortalecerMision2 || (Array.isArray(resp[IDX.r2]) ? resp[IDX.r2] : null);
                                    const f3 = datos.fortalecerMision3 || (Array.isArray(resp[IDX.r3]) ? resp[IDX.r3] : null);
                                    if (f1) f1.forEach(t => conteoMisiones.r1[t] = (conteoMisiones.r1[t] || 0) + 1);
                                    if (f2) f2.forEach(t => conteoMisiones.r2[t] = (conteoMisiones.r2[t] || 0) + 1);
                                    if (f3) f3.forEach(t => conteoMisiones.r3[t] = (conteoMisiones.r3[t] || 0) + 1);

                                    // Análisis inclusivo — solo Reto 3 (nivel CREATE o numero_reto 3)
                                    if (reg.nivel_unesco === 'CREATE' || reg.numero_reto === 3) {
                                        conteoReto3++;
                                        const bloom = resp[1];
                                        const garantias = Array.isArray(resp[8]) ? resp[8] : [];
                                        const validacion = Array.isArray(resp[12]) ? resp[12] : [];
                                        const riesgos = Array.isArray(resp[7]) ? resp[7] : [];

                                        if (bloom && sumaBloom.hasOwnProperty(bloom)) sumaBloom[bloom]++;
                                        sumaGarantias += garantias.length;
                                        if (validacion.length > 0) conComprobacion++;
                                        if (riesgos.some(r => riesgosSistemicosLista.includes(r))) conRiesgoSistemico++;
                                    }
                                } catch (e) { console.error(e); }
                            });

                            const totalDocentes = docentesUnicos.size || 1;
                            const base = conteoReto3 || 1;
                            const promedioGarantias = (sumaGarantias / base).toFixed(1);
                            const pctComprobacion = Math.round((conComprobacion / base) * 100);
                            const pctRiesgo = Math.round((conRiesgoSistemico / base) * 100);
                            const nivelMasFrecuente = Object.entries(sumaBloom)
                                .filter(([, v]) => v > 0)
                                .sort(([, a], [, b]) => b - a)[0]?.[0] || "No definido";

                            // Índice de inclusión 0-100
                            const nivelAltoBloom = ['Analizar', 'Evaluar', 'Crear'];
                            const pctNivelAlto = Math.round(
                                (nivelAltoBloom.reduce((acc, n) => acc + (sumaBloom[n] || 0), 0) / base) * 100
                            );
                            const indiceInclusion = Math.round(
                                pctNivelAlto * 0.3 +
                                (Math.min(parseFloat(promedioGarantias) / 5, 1) * 100) * 0.3 +
                                pctComprobacion * 0.2 +
                                pctRiesgo * 0.2
                            );
                            const colorIndice = indiceInclusion >= 70 ? '#16a34a' : indiceInclusion >= 50 ? '#eab308' : '#dc2626';

                            const renderBarras = (metricas, titulo, color = '#C5A059') => {
                                const items = Object.entries(metricas)
                                    .map(([tema, cantidad]) => ({
                                        tema, cantidad,
                                        porcentaje: Math.round((cantidad / totalDocentes) * 100)
                                    }))
                                    .sort((a, b) => b.porcentaje - a.porcentaje);

                                return (
                                    <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: '#1e293b', marginBottom: '15px', borderLeft: `4px solid ${color}`, paddingLeft: '10px' }}>
                                            {titulo}
                                        </h4>
                                        {items.length === 0 ? (
                                            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Sin solicitudes aún.</p>
                                        ) : items.map(item => (
                                            <div key={item.tema} style={{ marginBottom: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                                                    <span style={{ color: '#475569', fontWeight: '500' }}>{item.tema}</span>
                                                    <span style={{ color: '#1e293b', fontWeight: 'bold' }}>{item.porcentaje}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${item.porcentaje}%`, height: '100%', background: item.porcentaje >= 50 ? '#b45309' : color, transition: 'width 0.5s ease' }} />
                                                </div>
                                                {item.porcentaje >= 50 && (
                                                    <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#92400e', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px', display: 'inline-block', fontWeight: '600' }}>
                                                        🆘 PRIORIDAD ALTA: Organizar taller técnico
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            };

                            return (
                                <>
                                    {/* CARD OSCURA — Madurez UNESCO + Índice de Inclusión */}
                                    <div style={{ background: '#1e293b', padding: '30px', borderRadius: '15px', color: '#fff', marginBottom: '25px' }}>
                                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                            <span style={{ color: '#C5A059', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                Madurez UNESCO: Capacidad Grupal (Reto 3)
                                            </span>
                                        </div>

                                        {/* 4 indicadores */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                            {[
                                                { label: "Nivel Cognitivo", valor: nivelMasFrecuente },
                                                { label: "Garantías Equidad", valor: `${promedioGarantias} / 5` },
                                                { label: "Comp. de Impacto", valor: `${pctComprobacion}% Profes` },
                                                { label: "Riesgos Sistémicos", valor: `${pctRiesgo}% Ident.` },
                                            ].map(item => (
                                                <div key={item.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px' }}>
                                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                                        {item.label}
                                                    </div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#C5A059' }}>
                                                        {item.valor}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Índice de inclusión */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '3rem', fontWeight: '900', color: colorIndice }}>{indiceInclusion}%</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>ÍNDICE DE INCLUSIÓN ESTRUCTURAL</div>
                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '12px' }}>
                                                Promedio institucional basado en el Marco UNESCO CREATE
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ width: `${indiceInclusion}%`, height: '100%', background: colorIndice, transition: 'width 1s ease', borderRadius: '10px' }} />
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '16px', textAlign: 'center' }}>
                                            {totalDocentes} docente(s) registrado(s) · {conteoReto3} registro(s) del Reto 3
                                        </p>
                                    </div>

                                    {/* GRILLA DE MISIONES */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                        {renderBarras(conteoMisiones.r1, "Misión 1: Ética y Privacidad")}
                                        {renderBarras(conteoMisiones.r2, "Misión 2: Diseño Human-Centred")}
                                        {renderBarras(conteoMisiones.r3, "Misión 3: Inclusión y Equidad")}
                                    </div>

                                    {/* NOTA */}
                                    <div style={{ padding: '15px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef08a', fontSize: '0.9rem', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>📊</span>
                                        <span>
                                            <strong>Estado de la muestra:</strong> Se han procesado respuestas de <strong>{totalDocentes} docentes únicos</strong>.
                                        </span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* ACCIÓN FINAL — mismo estilo de botón que el original (btn-finalizar-mision) */}
                {/* AUTOEVALUACIÓN DE LOGRO — mismo layout que el original */}
                <div className="atlas-unique-footer-section">
                    <section className="autoevaluacion-final-section">
                        <div className="autoeval-card">
                            <h3>AUTOEVALUACIÓN DE LOGRO</h3>
                            <p className="autoeval-desc">Certifico que esta estrategia:</p>

                            {reto.autoevaluacion_items?.length > 0 ? (
                                <div className="checklist-items-premium">
                                    {reto.autoevaluacion_items.map((item, idx) => (
                                        <label key={idx} className="atlas-checkbox-row-premium">
                                            <input
                                                type="checkbox"
                                                checked={cumplimiento.includes(item)}
                                                onChange={() => toggleCumplimiento(item)}
                                            />
                                            <span className="label-text">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: "#94a3b8" }}>
                                    Cuando hayas respondido todas las preguntas, envía tu misión.
                                </p>
                            )}

                            <button
                                className="btn-finalizar-mision"
                                disabled={
                                    isSaving ||
                                    (reto.autoevaluacion_items?.length > 0 && cumplimiento.length < Math.min(3, reto.autoevaluacion_items.length))
                                }
                                onClick={() => saveReto('COMPLETADO')}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="spinner-mini"></span> Enviando respuestas...
                                    </>
                                ) : statusActual === 'COMPLETADO' ? "ACTUALIZAR EVIDENCIA" : "ENVIAR MISIÓN"}
                            </button>
                        </div>
                    </section>
                </div>

            </main>
        </div>
    );
};
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/LaboratorioEtico.css";

const RetosLiderar = ({ userData, apiFetch, retoId, onNavigate, datosIniciales }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [esPublico, setEsPublico] = useState(false);
    const isDirectivo = userData.rol === "DIRECTIVO";

    const [haInteractuadoP2, setHaInteractuadoP2] = useState(false);

    const [formData, setFormData] = useState({
        promptReal: "",
        analisisAuto: null,
        rubricaAuto: { etica: 3, privacidad: 3, agencia: 3, cognitiva: 3 },
        respuestasSimulador: { q1: null, q2: null, q3: null, q4: null, q5: null },
    });

    const [analisisFinal, setAnalisisFinal] = useState(null);

    const getEstadoRubrica = () => {
        if (!haInteractuadoP2) return null;
        const valores = Object.values(formData.rubricaAuto);
        const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;

        if (promedio >= 4.5) return { texto: "Liderazgo Responsable", color: "#22c55e", desc: "Tu enfoque prioriza la ética y la autonomía humana de forma ejemplar. El prompt minimiza riesgos significativamente." };
        if (promedio >= 3.5) return { texto: "Uso Seguro", color: "#84cc16", desc: "El prompt es sólido y sigue lineamientos institucionales, pero tiene margen de mejora en transparencia o declaración de autoría." };
        if (promedio >= 2.5) return { texto: "Riesgo Moderado", color: "#f59e0b", desc: "Atención: Hay elementos que podrían comprometer la privacidad o la agencia docente. Se recomienda revisar la delegación de juicio." };
        return { texto: "Riesgo Crítico", color: "#ef4444", desc: "Requiere rediseño: El prompt delega demasiado juicio académico, usa datos sensibles o fomenta una alta dependencia cognitiva." };
    };

    const indicadoresRubrica = {
        etica: {
            titulo: "1. Ética y No Discriminación",
            niveles: [
                "Nivel 1: Crítico. Contiene lenguaje estereotipado o criterios de exclusión.",
                "Nivel 2: Alto. Puede inducir sesgos implícitos por falta de objetividad.",
                "3. Moderado: No discrimina explícitamente pero carece de estructura neutral.",
                "4. Bajo: Usa lenguaje inclusivo y define estándares objetivos.",
                "5. Ejemplar: Promueve equidad y declara explícitamente revisión anti-sesgo."
            ]
        },
        privacidad: {
            titulo: "2. Privacidad y Protección de Datos",
            niveles: [
                "Nivel 1: Crítico. Solicita nombres, documentos o datos sensibles reales.",
                "Nivel 2: Alto. Usa información que permite identificar parcialmente al sujeto.",
                "3. Moderado: Datos anonimizados pero incluye contexto personal irrelevante.",
                "4. Bajo: Aplica minimización de datos; solo usa lo estrictamente necesario.",
                "5. Ejemplar: Solo usa datos simulados, abstractos o ficticios."
            ]
        },
        agencia: {
            titulo: "3. Agencia Docente y Supervisión",
            niveles: [
                "Nivel 1: Crítico. Delegación total del juicio académico a la IA.",
                "Nivel 2: Alto. La IA determina resultados vinculantes sin validación previa.",
                "3. Moderado: IA sugiere resultados; la revisión humana es solo implícita.",
                "4. Bajo: IA genera borradores; se declara responsabilidad docente final.",
                "5. Ejemplar: IA como apoyo analítico; promueve el juicio crítico del docente."
            ]
        },
        cognitiva: {
            titulo: "4. Dependencia Cognitiva y Estudiante",
            niveles: [
                "Nivel 1: Crítico. La IA realiza la tarea completa sin esfuerzo del alumno.",
                "Nivel 2: Alto. Produce respuesta final con mínima transformación requerida.",
                "3. Moderado: Genera base de trabajo pero no incluye fase metacognitiva.",
                "4. Bajo: Apoya el proceso; exige reformulación o análisis obligatorio.",
                "5. Ejemplar: Actúa como detonador de pensamiento crítico y autonomía."
            ]
        }
    };

    const analizarPromptHeuristico = (text) => {
        if (!text || text.length < 8) return null;

        const quitarTildes = (str) =>
            str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalText = quitarTildes(text.toLowerCase());

        // Estructura robusta: dimensión -> subcategoría -> [ [término, peso], ... ]
        // Pesos: 4 = Crítico (Riesgo severo), 3 = Alto, 2 = Medio/Bajo
        const reglas = {
            agencia: {
                delegacion_total: [
                    ["decide", 4], ["decidir por mi", 4], ["toma la decision", 4], ["resuelve por mi", 4],
                    ["determina", 4], ["dictamina", 4], ["dicta sentencia", 4], ["formula juicio", 4],
                    ["emite concepto", 4], ["decide admision", 4], ["decide contratacion", 4],
                    ["asigna la nota", 4], ["asigna nota", 4], ["pon la nota", 4], ["calcula la nota", 4],
                    ["califica", 3], ["aprueba", 3], ["reprueba", 3], ["autoriza", 3], ["certifica", 3],
                    ["valida", 3], ["validar", 3], ["evalua", 3], ["evaluar", 3], ["sanciona", 3],
                    ["castiga", 3], ["adjudica", 3], ["dicta", 3], ["ordena", 3], ["impone", 3],
                    ["otorga", 3], ["niega", 3], ["concede", 3], ["revoca acceso", 3], ["autoriza acceso", 3],
                    ["establece resultado", 3], ["define resultado", 3], ["aprueba solicitud", 3],
                    ["rechaza solicitud", 3], ["evalua desempeno", 3], ["valora automaticamente", 3],
                    ["aprueba automaticamente", 3], ["rechaza automaticamente", 3],
                    ["asigna", 2], ["define", 2], ["establece", 2], ["selecciona", 2], ["elige", 2],
                    ["gestiona", 2], ["administra", 2], ["controla", 2], ["supervisa", 2],
                    ["prioriza", 2], ["categoriza", 2], ["clasifica", 2], ["filtra", 2], ["descarta", 2],
                    ["designa", 2], ["habilita", 2], ["deshabilita", 2], ["bloquea", 2], ["impide", 2],
                    ["estima", 2], ["valora", 2], ["define criterios", 2], ["determina criterios", 2],
                    ["clasifica automaticamente", 2]
                ],
                automatizacion: [
                    ["sin revision humana", 4], ["sin intervencion humana", 4], ["sin supervision humana", 4],
                    ["sin validacion humana", 4], ["sin control humano", 4], ["sin criterio humano", 4],
                    ["que la ia decida", 4], ["que el sistema decida", 4], ["autoaprueba", 4],
                    ["autocalifica", 4], ["autoevalua", 4], ["decision autonoma", 4], ["proceso autonomo", 4],
                    ["automaticamente decide", 4], ["decide solo", 4], ["opera solo", 4], ["modelo autonomo", 4],
                    ["sin revision", 3], ["sin supervision", 3], ["sin validacion", 3], ["sin intervencion", 3],
                    ["de forma automatica", 3], ["sin consultar", 3], ["sin aprobacion previa", 3],
                    ["sin revision docente", 3], ["sin revision manual", 3], ["sin auditoria", 3],
                    ["sin verificacion", 3], ["sin filtro humano", 3], ["sin mediacion", 3],
                    ["ejecuta sin validar", 3], ["aprueba sin revisar", 3], ["rechaza sin revisar", 3],
                    ["calificacion automatica", 3], ["nota automatica", 3], ["evaluacion automatica", 3],
                    ["asignacion automatica", 3], ["resolucion automatica", 3], ["sin revision etica", 3],
                    ["sin revision academica", 3], ["sin analisis humano", 3], ["sin evaluacion humana", 3],
                    ["automaticamente", 2], ["proceso automatico", 2], ["proceso automatizado", 2],
                    ["sin preguntar", 2], ["sin confirmacion", 2], ["sin permiso", 2], ["sin consentimiento", 2],
                    ["autoasigna", 2], ["autoselecciona", 2], ["autogestiona", 2], ["autorregula", 2],
                    ["actua sin control", 2], ["actua de forma independiente", 2], ["ejecucion automatica", 2],
                    ["proceso robotizado", 2], ["decide por defecto", 2], ["sin comprobacion", 2],
                    ["sin revision previa", 2], ["sin intervencion manual", 2], ["sin supervision docente", 2],
                    ["decision inmediata automatica", 2]
                ],
            },
            cognitiva: {
                sustitucion_total: [
                    ["haz mi tarea", 4], ["haz la tarea", 4], ["completa mi tarea", 4], ["termina mi trabajo", 4],
                    ["haz mi proyecto", 4], ["haz mi ensayo", 4], ["escribe el ensayo", 4], ["escribe mi ensayo", 4],
                    ["genera mi ensayo completo", 4], ["resuelve el examen", 4], ["contesta el examen", 4],
                    ["contesta por mi", 4], ["responde por mi", 4], ["haz mi informe", 4], ["haz mi investigacion", 4],
                    ["haz mi presentacion", 4], ["prepara mi exposicion", 4], ["dame el trabajo listo", 4],
                    ["dame el trabajo", 4], ["entrega lista", 4], ["hazlo todo", 4], ["hazlo como si fuera yo", 4],
                    ["simula que soy yo", 4], ["escribe todo", 4], ["redacta completo", 4],
                    ["resuelve", 3], ["dame las respuestas", 3], ["respuestas exactas", 3], ["solucion directa", 3],
                    ["solo la respuesta", 3], ["dame la respuesta", 3], ["resuelve el taller", 3],
                    ["contesta el cuestionario", 3], ["haz el analisis completo", 3],
                    ["responde como estudiante", 3], ["responde como profesor", 3],
                    ["sin explicacion", 2], ["sin procedimiento", 2], ["no expliques", 2], ["solo copia y pega", 2],
                    ["copia y pega", 2], ["dame ejemplos para copiar", 2]
                ],
                evasion_academica: [
                    ["que no detecten", 4], ["evita deteccion", 4], ["indetectable", 4], ["sin plagio detectable", 4],
                    ["que parezca humano", 4], ["que el profesor no se de cuenta", 4], ["que no se note que es ia", 4],
                    ["sin que se note", 3], ["para que no sospechen", 3], ["burla el detector", 3],
                    ["evita el antiplagio", 3], ["esquiva turnitin", 3], ["evita deteccion", 3],
                    ["listo para entregar", 2], ["sustituye el analisis", 2]
                ],
            },
            etica: {
                sesgo_discriminatorio: [
                    ["preferir hombres", 4], ["preferir mujeres", 4], ["descartar por raza", 4],
                    ["rendimiento por raza", 4], ["perfil racial", 4], ["aptitud genetica", 4],
                    ["descartar por origen", 4], ["descartar por edad", 4], ["clasificar por origen", 4],
                    ["segmentar por estrato", 4], ["limitacion mental", 4], ["inteligencia baja", 4],
                    ["mas capaz por genero", 4], ["menos capaz", 4], ["discriminacion", 4],
                    ["estrato", 3], ["nivel socioeconomico", 3], ["clase social", 3], ["ninos pobres", 3],
                    ["ninos ricos", 3], ["zona rural", 3], ["mejor por barrio", 3], ["peor por barrio", 3],
                    ["capacidad limitada", 3], ["evaluar por contexto social", 3], ["perfil socioeconomico", 3],
                    ["grupo vulnerable", 2], ["minoria", 2], ["mayoria dominante", 2], ["estereotipo", 2],
                    ["etnico", 2], ["genero", 2], ["pobre", 2], ["bajo rendimiento", 2]
                ],
                perfilado_conducta: [
                    ["perfil psicologico", 4], ["predice conducta", 4], ["determina comportamiento", 4],
                    ["analiza rasgos mentales", 4], ["diagnostica personalidad", 4],
                    ["personalidad", 3], ["segmenta personas", 3], ["categoriza personas", 3],
                    ["etiqueta", 2], ["clasifica alumnos", 2], ["clasifica estudiantes", 2],
                    ["clasifica", 2], ["segmenta", 2]
                ],
                manipulacion: [
                    ["manipula", 4], ["persuade sin que sepan", 4], ["influye subliminalmente", 4],
                    ["engana", 3], ["convence a toda costa", 3],
                    ["presiona", 2], ["induce", 2],
                ],
            },
            privacidad: {
                identificadores_directos: [
                    ["numero de documento", 4], ["numero de cedula", 4], ["cedula", 4], ["documento de identidad", 4],
                    ["historia clinica", 4], ["registro medico", 4], ["datos biometricos", 4], ["huella dactilar", 4],
                    ["reconocimiento facial", 4], ["datos financieros", 4], ["cuenta bancaria", 4],
                    ["contrasena", 4], ["credenciales", 4], ["numero de tarjeta", 4], ["documento", 4],
                    ["nombre completo", 3], ["apellido", 3], ["correo", 3], ["email", 3], ["telefono", 3],
                    ["numero celular", 3], ["direccion", 3], ["fecha de nacimiento", 3], ["codigo estudiantil", 3],
                    ["matricula", 3], ["expediente", 3], ["ubicacion exacta", 3], ["coordenadas", 3],
                    ["foto personal", 3], ["imagen personal", 3], ["grabacion de voz", 3], ["grabacion", 3],
                    ["nombre", 2], ["datos personales", 2], ["informacion confidencial", 2], ["acudiente", 2],
                    ["padres", 2], ["familia", 2], ["usuario", 2], ["id del estudiante", 2], ["id", 2],
                    ["ubicacion", 2], ["voz", 2]
                ],
                datos_sensibles: [
                    ["diagnostico medico", 4], ["enfermedad mental", 4], ["condicion medica", 4],
                    ["historial clinico", 4], ["estado psicologico", 4], ["antecedentes medicos", 4],
                    ["orientacion sexual", 4], ["religion del estudiante", 4], ["ideologia politica", 4],
                    ["diagnostico", 3], ["discapacidad", 3], ["trastorno", 3], ["salud mental", 3],
                    ["salud", 2]
                ],
            },
            transparencia: {
                ocultamiento: [
                    ["que no sepan que es ia", 4], ["oculta que uso ia", 4], ["no revelar uso de ia", 4],
                    ["sin avisar que es ia", 4], ["haz pasar por humano", 4],
                    ["sin declarar", 3], ["no menciones la ia", 3], ["sin transparencia", 3],
                    ["en secreto", 2], ["sin avisar", 2],
                ],
            },
        };

        // Mapear subcategorías a las 4 dimensiones de salida requeridas por la interfaz
        const mapaDimension = {
            agencia: "agencia",
            cognitiva: "cognitiva",
            etica: "etica",
            privacidad: "privacidad",
            transparencia: "etica", // transparencia refuerza el eje ético
        };

        const puntos = { etica: 0, privacidad: 0, agencia: 0, cognitiva: 0 };
        const hallazgos = { etica: [], privacidad: [], agencia: [], cognitiva: [] };

        Object.keys(reglas).forEach(dimOrigen => {
            const dimDestino = mapaDimension[dimOrigen];
            Object.keys(reglas[dimOrigen]).forEach(sub => {
                reglas[dimOrigen][sub].forEach(([termino, peso]) => {
                    const escapado = termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    const regex = new RegExp(`\\b${escapado}\\b`, "i");
                    if (regex.test(normalText)) {
                        puntos[dimDestino] += peso;
                        hallazgos[dimDestino].push(termino);
                    }
                });
            });
        });

        // Normalización 1-5 basada en puntos acumulados (más puntos = más riesgo = menor score)
        const normalizar = (p) =>
            p >= 14 ? 1 :
                p >= 9 ? 2 :
                    p >= 5 ? 3 :
                        p >= 2 ? 4 : 5;

        const getColor = (s) =>
            s <= 2 ? "#ef4444" :
                s <= 3 ? "#f59e0b" :
                    "#22c55e";

        const resultados = {};
        Object.keys(puntos).forEach(dim => {
            const score = normalizar(puntos[dim]);
            const unicos = [...new Set(hallazgos[dim])];
            resultados[dim] = {
                score,
                color: getColor(score),
                alerta: unicos.length > 0
                    ? `Detectado (${unicos.length}): ${unicos.slice(0, 6).join(", ")}${unicos.length > 6 ? "…" : ""}`
                    : "Cumplimiento responsable.",
            };
        });

        return resultados;
    };

    const getAnalisisRiesgo = () => {
        const r = formData.respuestasSimulador;
        if (!r || Object.values(r).some(v => v === null)) return null;

        const puntos = {
            q1: { 'IA Automática': 3, 'IA propone, yo acepto': 2, 'IA propone, yo reviso': 1, 'Decisión 100% mía': 0 },
            q2: { 'Datos personales': 3, 'Parcialmente identificable': 2, 'Anonimizados': 1, 'Simulados/Ficticios': 0 },
            q3: { 'No, directo': 3, 'Revisión superficial': 2, 'Análisis previo': 1, 'Insumo crítico': 0 },
            q4: { 'No lo sabe': 3, 'Implícito': 2, 'Mencionado': 1, 'Reflexión conjunta': 0 },
            q5: { 'Sin alternativa': 2, 'No evaluada': 1, 'Comparada': 0, 'IA complemento': 0 }
        };

        let total = 0;
        Object.keys(r).forEach(key => {
            if (puntos[key] && puntos[key][r[key]] !== undefined) {
                total += puntos[key][r[key]];
            }
        });

        if (total >= 9) return {
            texto: "🔴 ALTO RIESGO OPERATIVO",
            color: "#ef4444",
            score: total,
            mensaje: "Este prompt delega decisiones críticas a la IA con datos sensibles o nula transparencia. Se requiere intervención humana obligatoria y rediseño del flujo."
        };
        if (total >= 4) return {
            texto: "🟡 RIESGO MODERADO",
            color: "#f59e0b",
            score: total,
            mensaje: "Uso aceptable bajo supervisión. Existen puntos ciegos en la validación o en la comunicación de que se está usando una IA con el usuario final."
        };
        return {
            texto: "🟢 BAJO RIESGO / SEGURO",
            color: "#22c55e",
            score: total,
            mensaje: "Configuración ejemplar. Mantienes el control docente, proteges la identidad de los sujetos y promueves un uso ético de la tecnología."
        };
    };

    // --- CARGA DESDE BACKEND (adaptada a serialize de PromptLiderar) ---
    const cargarDatosEnFormulario = (reg) => {
        if (!reg) return;

        setAnalisisFinal(reg);
        setEsPublico(reg.es_publico === true);
        setHaInteractuadoP2(true);

        const respuestasCargadas = reg.detalle_respuestas && reg.detalle_respuestas.respuestas
            ? { q1: null, q2: null, q3: null, q4: null, q5: null, ...reg.detalle_respuestas.respuestas }
            : { q1: null, q2: null, q3: null, q4: null, q5: null };

        setFormData({
            promptReal: reg.prompt_original || "",
            analisisAuto: analizarPromptHeuristico(reg.prompt_original || ""),
            rubricaAuto: {
                etica: parseInt(reg.puntaje_etica) || 3,
                privacidad: parseInt(reg.puntaje_privacidad) || 3,
                agencia: parseInt(reg.puntaje_agencia) || 3,
                cognitiva: parseInt(reg.puntaje_dependencia) || 3,
            },
            respuestasSimulador: respuestasCargadas
        });
    };

    useEffect(() => {
        const fetchDatos = async () => {
            if (datosIniciales) {
                cargarDatosEnFormulario(datosIniciales);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const reg = await apiFetch("/api/liderar/mi-prompt").catch(() => null);
                if (reg) cargarDatosEnFormulario(reg);
            } catch (e) {
                console.error("Error en Fetch Retos:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchDatos();
    }, [datosIniciales]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.promptReal) {
                setFormData(prev => ({
                    ...prev,
                    analisisAuto: analizarPromptHeuristico(formData.promptReal)
                }));
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [formData.promptReal]);

    // --- Calcula la dimensión más baja para el ranking directivo ---
    const calcularDimensionMasBaja = () => {
        const r = formData.rubricaAuto;
        const entradas = Object.entries(r);
        entradas.sort((a, b) => a[1] - b[1]);
        return entradas[0][0];
    };

    // --- Limpia el formulario para empezar un prompt nuevo (no borra lo guardado en DB) ---
    const handleNuevoPrompt = () => {
        setFormData({
            promptReal: "",
            analisisAuto: null,
            rubricaAuto: { etica: 3, privacidad: 3, agencia: 3, cognitiva: 3 },
            respuestasSimulador: { q1: null, q2: null, q3: null, q4: null, q5: null },
        });
        setEsPublico(false);
        setHaInteractuadoP2(false);
        setAnalisisFinal(null);
        window.scrollTo(0, 0);
    };

    // --- Recarga el último prompt guardado desde el backend ---
    const handleRevisarPrompt = async () => {
        setLoading(true);
        try {
            const reg = await apiFetch("/api/liderar/mi-prompt").catch(() => null);
            if (reg) {
                cargarDatosEnFormulario(reg);
            } else {
                Swal.fire("Sin registros", "Aún no has guardado ningún prompt.", "info");
            }
        } catch (e) {
            console.error("Error revisando prompt:", e);
        } finally {
            setLoading(false);
            window.scrollTo(0, 0);
        }
    };

    const handleSave = async (statusFinal = 'BORRADOR') => {
        if (isSaving) return;

        setIsSaving(true);
        const riesgo = getAnalisisRiesgo();

        const payload = {
            prompt_original: formData.promptReal,
            puntaje_etica: formData.rubricaAuto.etica,
            puntaje_privacidad: formData.rubricaAuto.privacidad,
            puntaje_agencia: formData.rubricaAuto.agencia,
            puntaje_dependencia: formData.rubricaAuto.cognitiva,
            simulador_puntaje: riesgo ? riesgo.score : 0,
            clasificacion_riesgo: riesgo ? `${riesgo.texto} (${riesgo.score}/14)` : "Pendiente",
            detalle_respuestas: { respuestas: formData.respuestasSimulador },
            dimension_mas_baja: calcularDimensionMasBaja(),
            es_publico: esPublico,
            status: statusFinal
        };

        Swal.fire({
            title: "ATLAS",
            text: statusFinal === 'COMPLETADO' ? "Misión Finalizada con éxito" : "Borrador guardado",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });

        try {
            await apiFetch("/api/liderar/prompt", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            if (statusFinal === 'COMPLETADO') {
                onNavigate('fase_liderar');
            }
        } catch (e) {
            console.error("Error en sincronización:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const infoRubrica = getEstadoRubrica();
    const riesgoGlobal = getAnalisisRiesgo();

    return (
        <div className="latlab-unique-wrapper">
            {loading && formData.promptReal && (
                <div className="atlas-sync-float">
                    <div className="atlas-sync-pill">
                        <span className="sync-icon">🔄</span>
                        <span className="sync-text">Sincronizando Laboratorio...</span>
                    </div>
                </div>
            )}
            <header className="latlab-main-header">
                <div className="latlab-header-brand">
                    <button className="latlab-btn-back" onClick={() => onNavigate('fase_liderar')}>← Atras</button>
                    <h1>{isDirectivo ? "Gobernanza Institucional" : "Laboratorio de Prompt Ético"}</h1>
                </div>
                <div className="latlab-header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="latlab-btn-nuevo"
                        onClick={handleNuevoPrompt}
                        disabled={isSaving}
                        style={{
                            background: '#1e293b', color: '#fff', border: 'none',
                            padding: '10px 18px', borderRadius: '8px', fontWeight: 700,
                            cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1
                        }}
                    >
                        ＋ Nuevo prompt
                    </button>
                    <button
                        className="latlab-btn-nuevo"
                        onClick={handleRevisarPrompt}
                        disabled={isSaving || loading}
                        style={{
                            background: '#c5a059', color: '#fff', border: 'none',
                            padding: '10px 18px', borderRadius: '8px', fontWeight: 700,
                            cursor: (isSaving || loading) ? 'not-allowed' : 'pointer', opacity: (isSaving || loading) ? 0.6 : 1
                        }}
                    >
                        ↻ Revisar último
                    </button>
                    <button
                        className="latlab-btn-finish"
                        onClick={() => handleSave('COMPLETADO')}
                        disabled={isSaving}
                        style={{ opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                    >
                        {isSaving ? "Guardando..." : "Finalizar Misión"}
                    </button>
                </div>
            </header>

            <main className="latlab-vertical-container">
                <section className="latlab-card">
                    <div className="latlab-card-title-row">
                        {/* Agrupamos el Badge y el Título para la columna izquierda */}
                        <div className="latlab-title-group">
                            <span className="latlab-step-badge">PASO 1</span>
                            <h3 className="latlab-main-title">
                                Laboratorio:
                            </h3>
                        </div>

                        {/* Texto descriptivo de la columna derecha */}
                        <p className="latlab-description">
                            Escribe un prompt en español que sueles utilizar con IA generativa (idealmente, copia uno real de tus interacciones previas). Esto nos permitirá identificar riesgos, sesgos o usos inadecuados, y transformarlo en una instrucción responsable que mantenga tu rol como docente, promueva el aprendizaje auténtico y asegure principios de evaluación justa, transparencia y supervisión humana.
                        </p>
                    </div>

                    <textarea
                        className="latlab-textarea"
                        value={formData.promptReal}
                        onChange={(e) => setFormData({ ...formData, promptReal: e.target.value })}
                        placeholder="Input del Prompt"
                    />
                </section>

                <section className="latlab-card">
                    <div className="latlab-card-title-row">
                        <span className="latlab-step-badge">Paso 2</span>
                        <h3>Rúbrica de Autoevaluación</h3>
                    </div>
                    <div className="latlab-rubric-stack">
                        {Object.entries(indicadoresRubrica).map(([key, info]) => (
                            <div key={key} className="latlab-rubric-item">
                                <div className="latlab-rubric-info">
                                    <label>{info.titulo}</label>
                                    <span className="latlab-level-tag">Nivel: {formData.rubricaAuto[key]}</span>
                                </div>
                                <input type="range" min="1" max="5" value={formData.rubricaAuto[key]}
                                    onChange={(e) => {
                                        setHaInteractuadoP2(true);
                                        setFormData({ ...formData, rubricaAuto: { ...formData.rubricaAuto, [key]: parseInt(e.target.value) } });
                                    }}
                                />
                                <p className="latlab-level-desc">{info.niveles[formData.rubricaAuto[key] - 1]}</p>
                            </div>
                        ))}
                    </div>
                    {infoRubrica && (
                        <div style={{ backgroundColor: infoRubrica.color + '22', borderLeft: `5px solid ${infoRubrica.color}`, padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
                            <h4 style={{ margin: 0, color: infoRubrica.color }}>{infoRubrica.texto}</h4>
                            <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#334155' }}>{infoRubrica.desc}</p>
                        </div>
                    )}
                </section>

                <section className="latlab-card">
                    <div className="latlab-card-title-row">
                        <span className="latlab-step-badge">Paso 3</span>
                        <h3>Simulador de Riesgo Operativo</h3>
                    </div>
                    <div className="latlab-sim-vertical-stack">
                        {[
                            { id: 'q1', label: '1. ¿Quién toma la decisión final?', opts: ['IA Automática', 'IA propone, yo acepto', 'IA propone, yo reviso', 'Decisión 100% mía'] },
                            { id: 'q2', label: '2. ¿Qué datos se introducen?', opts: ['Datos personales', 'Parcialmente identificable', 'Anonimizados', 'Simulados/Ficticios'] },
                            { id: 'q3', label: '3. ¿Validación del resultado?', opts: ['No, directo', 'Revisión superficial', 'Análisis previo', 'Insumo crítico'] },
                            { id: 'q4', label: '4. ¿Transparencia con el usuario?', opts: ['No lo sabe', 'Implícito', 'Mencionado', 'Reflexión conjunta'] },
                            { id: 'q5', label: '5. ¿Existencia de alternativa humana?', opts: ['Sin alternativa', 'No evaluada', 'Comparada', 'IA complemento'] }
                        ].map(q => (
                            <div key={q.id} className="latlab-sim-box">
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>{q.label}</label>
                                <div className="latlab-opt-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {q.opts.map(o => (
                                        <button key={o} className={`latlab-opt-btn ${formData.respuestasSimulador[q.id] === o ? 'is-active' : ''}`}
                                            onClick={() => setFormData({ ...formData, respuestasSimulador: { ...formData.respuestasSimulador, [q.id]: o } })}>{o}</button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {riesgoGlobal && (
                        <div style={{ border: `2px solid ${riesgoGlobal.color}`, padding: '15px', borderRadius: '10px', marginTop: '20px', textAlign: 'center', backgroundColor: '#fff' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: riesgoGlobal.color }}>{riesgoGlobal.texto} (Puntaje: {riesgoGlobal.score}/14)</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{riesgoGlobal.mensaje}</p>
                        </div>
                    )}
                </section>

                <section className="latlab-card">
                    <div className="latlab-card-title-row">
                        <span className="latlab-step-badge">Paso 4</span>
                        <h3>Contra-Auditoría Heurística</h3>
                    </div>
                    {formData.analisisAuto ? (
                        <div className="latlab-audit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            {Object.entries(formData.analisisAuto).map(([key, data]) => (
                                <div key={key} style={{ padding: '15px', borderRadius: '8px', borderLeft: `5px solid ${data.color}`, background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <strong style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{key}</strong>
                                        <span style={{ fontWeight: 'bold', color: data.color }}>{data.score}/5</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>{data.alerta}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="latlab-empty-text">Escribe en el Paso 1 para activar la auditoría en tiempo real.</p>
                    )}
                </section>

                <section className="latlab-card" style={{ border: '2px solid #c5a059' }}>
                    <div className="latlab-card-title-row">
                        <span className="latlab-step-badge">Paso 5</span>
                        <h3>Privacidad de la Misión</h3>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                        <p>¿Deseas compartir este prompt en la Galería de Inspiración ATLAS?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '15px' }}>
                            <span style={{ color: !esPublico ? '#1e293b' : '#94a3b8' }}>Privado</span>
                            <label className="atlas-switch">
                                <input type="checkbox" checked={esPublico} onChange={(e) => setEsPublico(e.target.checked)} />
                                <span className="atlas-slider round"></span>
                            </label>
                            <span style={{ color: esPublico ? '#c5a059' : '#94a3b8', fontWeight: 'bold' }}>Público</span>
                        </div>
                    </div>
                    <div className="latlab-final-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '25px', flexWrap: 'wrap' }}>
                        <button
                            className="latlab-btn-finish"
                            onClick={() => handleSave('COMPLETADO')}
                            disabled={isSaving}
                            style={{ opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                        >
                            {isSaving ? "Guardando..." : "✓ Finalizar Misión"}
                        </button>
                        <button
                            className="latlab-btn-nuevo"
                            onClick={handleNuevoPrompt}
                            disabled={isSaving}
                            style={{
                                background: '#1e293b', color: '#fff', border: 'none',
                                padding: '12px 24px', borderRadius: '8px', fontWeight: 700,
                                cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1
                            }}
                        >
                            ＋ Subir nuevo prompt
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default RetosLiderar;
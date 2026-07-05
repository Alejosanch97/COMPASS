import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import "../Styles/AsegurarUpgrade.css";

const TallerMejoraAsegurar = ({ userData, apiFetch, onNavigate, datosIniciales }) => {

    const quitarTildes = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // ═══════════════════════════════════════════════════════════
    // DATOS EDUCATIVOS (constantes)
    // ═══════════════════════════════════════════════════════════

    const nombreDimension = {
        agencia: "Agencia docente",
        cognitiva: "Dependencia cognitiva",
        etica: "Ética y transparencia",
        privacidad: "Privacidad"
    };

    // ── FÓRMULA R.E.C.T.O.R. (constructor guiado con las 6 piezas) ──
    // Rol · Escenario · Cometido · Topes éticos · Output · Revisión
    const anatomiaPrompt = [
        { id: "rol", letra: "R", label: "Rol de la IA", icono: "🎭", dim: "agencia",
          placeholder: "Actúa como asistente pedagógico de apoyo, no como evaluador final.",
          ayuda: "Define el papel de la IA. 'Apoyo' preserva tu agencia; 'juez' la delega.",
          leccion: "Nombrar el rol es el primer límite ético: la IA asiste, el docente decide." },
        { id: "contexto", letra: "E", label: "Escenario / Contexto", icono: "🗺️", dim: "privacidad",
          placeholder: "Estudiantes de 9°, asignatura de Sociales, tema derechos humanos.",
          ayuda: "Da el marco sin datos personales. Nivel, materia y objetivo bastan.",
          leccion: "El contexto mejora la respuesta sin comprometer la privacidad si evitas identificadores." },
        { id: "tarea", letra: "C", label: "Cometido / Tarea", icono: "🎯", dim: "cognitiva",
          placeholder: "Sugiere 3 preguntas de reflexión que yo revisaré antes de usarlas.",
          ayuda: "Verbos como 'sugiere', 'propón', 'ayúdame a' mantienen tu control.",
          leccion: "Pedir borradores (no productos finales) protege el esfuerzo cognitivo del estudiante." },
        { id: "restricciones", letra: "T", label: "Topes éticos", icono: "🛡️", dim: "etica",
          placeholder: "No asignes calificaciones. No uses lenguaje que estereotipe por origen o género.",
          ayuda: "Las prohibiciones explícitas son tu escudo. Di qué NO debe hacer.",
          leccion: "Sin restricciones explícitas, el modelo puede reproducir sesgos o exceder su rol." },
        { id: "formato", letra: "O", label: "Output / Formato", icono: "📐", dim: "etica",
          placeholder: "Lista de máximo 5 puntos, con una justificación breve por cada uno.",
          ayuda: "Estructura la respuesta para poder auditarla con facilidad.",
          leccion: "Pedir justificación por punto te permite verificar el razonamiento, no solo el resultado." },
        { id: "supervision", letra: "R", label: "Revisión humana", icono: "👁️", dim: "agencia",
          placeholder: "Recuérdame que la decisión final y la calificación son mi responsabilidad.",
          ayuda: "Reafirma quién es responsable. Cierra el círculo de gobernanza.",
          leccion: "Es la diferencia entre 'IA que decide' e 'IA que apoya una decisión humana'." }
    ];

    // Micro-lecciones: explican EL DAÑO de cada dimensión
    const microLecciones = {
        agencia: { titulo: "¿Por qué importa la agencia docente?", dano: "Delegar la calificación o decisiones académicas a la IA sin revisión transfiere una responsabilidad que es legal y éticamente tuya. El modelo puede errar o reproducir sesgos, y tú respondes por el resultado.", arreglo: "Usa verbos de apoyo ('sugiere', 'propón un borrador') y añade una cláusula de revisión humana explícita." },
        cognitiva: { titulo: "¿Por qué importa la dependencia cognitiva?", dano: "Si la IA hace la tarea completa, el estudiante deja de ejercitar el pensamiento que la actividad busca desarrollar. Se aprende menos y crece la dependencia de la herramienta.", arreglo: "Pide preguntas, andamiajes o retroalimentación, no productos terminados. Exige una fase de reflexión del estudiante." },
        etica: { titulo: "¿Por qué importan ética y transparencia?", dano: "El lenguaje que estereotipa por origen, género o estrato produce evaluaciones injustas. Ocultar que se usó IA rompe la confianza y el derecho de estudiantes a saber cómo se les evalúa.", arreglo: "Declara criterios objetivos, pide revisión anti-sesgo explícita y sé transparente sobre el uso de IA." },
        privacidad: { titulo: "¿Por qué importa la privacidad?", dano: "Introducir nombres, documentos o diagnósticos de menores en una IA externa puede exponer datos protegidos por ley (habeas data). Una vez enviado, pierdes el control del dato.", arreglo: "Anonimiza. Usa etiquetas como [ESTUDIANTE] y datos simulados. Nunca introduzcas identificadores reales de menores." }
    };

    // Motor de reescritura: patrón crítico -> sugerencia accionable (con severidad)
    const patronesReescritura = [
        { id: "r_calificar", dimension: "agencia", severidad: "alta", detecta: ["asigna la nota", "asigna nota", "pon la nota", "calcula la nota", "califica"], titulo: "Delegación de calificación", explicacion: "Pedirle a la IA que califique delega tu juicio académico.", reescritura: "Analiza el trabajo según esta rúbrica y sugiéreme una valoración preliminar que YO revisaré antes de asignar la nota final." },
        { id: "r_decide", dimension: "agencia", severidad: "alta", detecta: ["decide", "decidir por mi", "toma la decision", "resuelve por mi", "determina", "dictamina"], titulo: "Delegación de decisión", explicacion: "La IA no debe tomar decisiones vinculantes. Que proponga; tú decides.", reescritura: "Propón opciones con sus pros y contras para que yo tome la decisión final de manera informada." },
        { id: "r_auto", dimension: "agencia", severidad: "alta", detecta: ["automaticamente", "sin revision", "sin supervision", "sin intervencion humana", "sin revision humana"], titulo: "Automatización sin supervisión", explicacion: "Eliminar la revisión humana crea riesgo de gobernanza.", reescritura: "Genera una propuesta sujeta a mi revisión y aprobación manual antes de cualquier uso oficial." },
        { id: "r_tarea", dimension: "cognitiva", severidad: "alta", detecta: ["haz la tarea", "completa mi tarea", "escribe el ensayo", "resuelve el examen", "dame el trabajo listo", "haz mi proyecto"], titulo: "Sustitución cognitiva", explicacion: "Que la IA haga la tarea anula el aprendizaje. Conviértela en apoyo al proceso.", reescritura: "Ayúdame a estructurar y entender este tema con preguntas guía y ejemplos, sin resolver la tarea por mí." },
        { id: "r_evasion", dimension: "cognitiva", severidad: "alta", detecta: ["que no detecten", "indetectable", "que parezca humano", "evita deteccion", "que el profesor no se de cuenta"], titulo: "Evasión académica", explicacion: "Buscar evadir detección es deshonestidad. Reencáuzalo hacia el aprendizaje transparente.", reescritura: "Ayúdame a comprender y mejorar mi propio trabajo, citando el uso de IA de forma transparente según las normas académicas." },
        { id: "r_sesgo", dimension: "etica", severidad: "media", detecta: ["estrato", "zona rural", "nivel socioeconomico", "genero", "rendimiento por raza", "ninos pobres", "menos capaz"], titulo: "Posible sesgo discriminatorio", explicacion: "Evaluar por origen, género o estrato produce injusticia.", reescritura: "Evalúa exclusivamente con criterios académicos objetivos, sin considerar origen, género, estrato ni rasgos personales del estudiante." },
        { id: "r_datos", dimension: "privacidad", severidad: "alta", detecta: ["cedula", "documento", "nombre", "correo", "telefono", "direccion", "historia clinica", "diagnostico"], titulo: "Datos personales expuestos", explicacion: "Introducir identificadores reales expone datos protegidos por habeas data.", reescritura: "Trabaja con datos anonimizados: reemplaza cualquier nombre o identificador por etiquetas genéricas como [ESTUDIANTE]." }
    ];

    // ═══════════════════════════════════════════════════════════
    // ESTADO
    // ═══════════════════════════════════════════════════════════
    const constructorVacio = { rol: "", contexto: "", tarea: "", restricciones: "", formato: "", supervision: "" };

    const prepararEstadoInicial = (datos) => {
        if (!datos) {
            return {
                promptOriginal: "", promptBase: "", promptMejorado: "", alertasOriginal: [],
                bloquesActivados: [], reflexion: { q1: "", q2: "", q3: "", q4: "" },
                estandares: [], riesgoPrevio: null, riesgoFinal: null,
                constructor: { ...constructorVacio }, reescriturasAplicadas: [], leccionesVistas: [],
                compromisoDatos: false
            };
        }
        const safeParse = (str) => {
            try { return typeof str === 'string' ? JSON.parse(str) : str; }
            catch (e) { return null; }
        };
        const base = datos.prompt_mejorado || datos.prompt_original || "";
        return {
            promptOriginal: datos.prompt_original || "",
            // promptBase = el texto SIN capas, sobre el que se recomputan los bloques.
            // Al cargar un registro guardado usamos el original como base fiable.
            promptBase: datos.prompt_original || "",
            promptMejorado: base,
            alertasOriginal: Array.isArray(datos.alertas_detectadas) ? datos.alertas_detectadas : [],
            bloquesActivados: Array.isArray(datos.bloques_activados) ? datos.bloques_activados : [],
            reflexion: {
                q1: datos.reflexion_1_cambios || "",
                q2: datos.reflexion_2_riesgos || "",
                q3: datos.reflexion_3_supervision || "",
                q4: datos.reflexion_4_cognicion || ""
            },
            estandares: datos.estandar_seleccionado ? datos.estandar_seleccionado.split(" | ") : [],
            riesgoPrevio: safeParse(datos.riesgo_previo),
            riesgoFinal: safeParse(datos.riesgo_final),
            constructor: datos.constructor_prompt && typeof datos.constructor_prompt === "object"
                ? { ...constructorVacio, ...datos.constructor_prompt } : { ...constructorVacio },
            reescriturasAplicadas: Array.isArray(datos.reescrituras_aplicadas) ? datos.reescrituras_aplicadas : [],
            leccionesVistas: Array.isArray(datos.lecciones_vistas) ? datos.lecciones_vistas : [],
            compromisoDatos: !!datos.compromiso_datos
        };
    };

    const [formData, setFormData] = useState(prepararEstadoInicial(null));
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [constructorAbierto, setConstructorAbierto] = useState(false);

    // ═══════════════════════════════════════════════════════════
    // SALVAGUARDAS: frases que SUMAN seguridad (crédito) por dimensión.
    // El motor no solo castiga riesgo; premia el blindaje presente.
    // ═══════════════════════════════════════════════════════════
    const salvaguardasPorDimension = {
        agencia: ["revision humana", "revision manual", "el docente", "yo revisare", "yo decido", "decision final", "responsabilidad del docente", "responsabilidad exclusiva del docente", "aprobacion manual", "supervision", "antes de utilizarla", "sujeta a mi revision", "no tomar decisiones", "no decidas quien aprueba", "no asignes calificaciones", "prohibido asignar notas", "sin emitir juicios sumativos", "el profesor"],
        cognitiva: ["preguntas guia", "sin resolver la tarea", "borrador", "sugiere mejoras", "preguntas abiertas", "reflexione critica", "estructurar y entender", "no resuelvas", "fase de reflexion", "metacognit", "esfuerzo cognitivo"],
        etica: ["libre de sesgos", "sin sesgos", "criterios objetivos", "criterios academicos objetivos", "neutral", "rubrica", "equidad", "sin considerar origen", "sin discriminar", "evita cualquier criterio discriminatorio", "sin considerar genero", "coherencia", "argumentacion"],
        privacidad: ["anonimiza", "datos anonimizados", "estudiante", "sin datos personales", "reemplaza cualquier nombre", "no utilices datos personales", "minimizacion", "informacion estrictamente necesaria", "ignoralos por completo", "etiquetas genericas", "sin informacion personal"]
    };

    // Negadores que, si aparecen cerca de un verbo de riesgo, lo neutralizan
    // ("no asignes calificaciones" NO debe contar como riesgo de calificar).
    const negadores = ["no ", "sin ", "prohibido", "evita", "jamas", "nunca", "ignoralos", "reemplaza"];

    // ═══════════════════════════════════════════════════════════
    // HEURÍSTICA CON CRÉDITO
    // Devuelve puntajes 1-5 (5 = seguro), + hallazgos + créditos por dimensión.
    // ═══════════════════════════════════════════════════════════
    const analizarPromptHeuristico = (text) => {
        if (!text || text.length < 10) return { etica: 5, privacidad: 5, agencia: 5, cognitiva: 5, hallazgos: [], credito: { agencia: 0, cognitiva: 0, etica: 0, privacidad: 0 } };
        const normalText = quitarTildes(text.toLowerCase());

        const tieneNegacionCerca = (idx) => {
            const ventana = normalText.slice(Math.max(0, idx - 45), idx);
            return negadores.some(n => ventana.includes(n));
        };

        const verbosCriticos = {
            agencia: {
                total: ["decide", "determina", "asigna", "define", "califica", "pon la nota", "aprueba", "reprueba", "autoriza", "validar", "valida", "certifica", "evalua", "evaluar", "dictamina", "ordena", "impone", "establece", "selecciona", "elige", "decidir por mi", "toma la decision", "resuelve por mi", "gestiona", "administra", "controla", "supervisa", "clasifica automaticamente", "categoriza", "prioriza", "aprueba automaticamente", "rechaza automaticamente", "descarta", "filtra", "define criterios", "determina criterios", "impide", "bloquea", "sanciona", "castiga", "otorga", "niega", "concede", "adjudica", "designa", "asigna nota", "calcula la nota", "evalua desempeno", "decide admision", "decide contratacion", "aprueba solicitud", "rechaza solicitud", "valora automaticamente", "estima", "dicta", "formula juicio", "emite concepto", "dicta sentencia", "autoriza acceso", "revoca acceso", "habilita", "deshabilita", "define resultado", "establece resultado"],
                automatizacion: ["automaticamente", "sin revision", "sin mi intervencion", "sin supervision", "sin revision humana", "sin intervencion humana", "de forma automatica", "automaticamente decide", "decide solo", "que el sistema decida", "que la ia decida", "sin consultar", "sin aprobacion previa", "sin validacion", "sin control humano", "sin revision docente", "sin revision manual", "proceso automatico", "automatiza la decision", "toma el control", "sin preguntar", "sin confirmacion", "sin autorizacion humana", "autoaprueba", "autoevalua", "autocalifica", "proceso autonomo", "decision autonoma", "ejecuta sin validar", "opera solo", "sin mi permiso", "sin consentimiento", "autoasigna", "autoselecciona", "autogestiona", "autorregula", "sin filtro humano", "sin intervencion del profesor", "sin mediacion", "resuelve automaticamente", "evalua automaticamente", "dictamina automaticamente", "aprueba sin revisar", "rechaza sin revisar", "genera nota automatica", "calificacion automatica", "sin auditoria", "sin control externo", "sin verificacion", "sin revision academica", "sin analisis humano", "decide por defecto", "asignacion automatica", "evaluacion automatica", "resolucion automatica", "sin criterio humano", "sin revision etica", "sin evaluacion humana", "proceso robotizado", "proceso automatizado", "sin comprobacion", "sin revision previa", "ejecucion automatica", "modelo autonomo", "sin intervencion manual", "sin validacion humana", "sin supervision docente", "actua de forma independiente", "actua sin control", "decision inmediata automatica"]
            },
            cognitiva: {
                sustitucion: ["haz la tarea", "resuelve", "escribe el ensayo", "dame el trabajo", "haz mi proyecto", "completa mi tarea", "resuelve el examen", "contesta por mi", "escribe todo", "redacta completo", "dame las respuestas", "respuestas exactas", "sin explicacion", "sin procedimiento", "solo la respuesta", "no expliques", "hazlo todo", "termina mi trabajo", "haz mi informe", "haz mi investigacion", "genera mi ensayo completo", "haz mi presentacion", "prepara mi exposicion", "resuelve el taller", "contesta el cuestionario", "dame el trabajo listo", "solo copia y pega", "hazlo como si fuera yo", "simula que soy yo", "responde como estudiante", "responde como profesor", "haz el analisis completo", "entrega lista", "solucion directa"],
                evasion: ["listo para entregar", "sustituye el analisis", "sin que se note", "que no detecten", "evita deteccion", "indetectable", "que parezca humano", "para que no sospechen", "sin plagio detectable", "que el profesor no se de cuenta"]
            },
            etica: {
                sesgos: ["zona rural", "estrato", "pobre", "bajo rendimiento", "etnico", "genero", "inteligencia baja", "capacidad limitada", "menos capaz", "mas capaz por genero", "rendimiento por raza", "nivel socioeconomico", "clase social", "ninos pobres", "ninos ricos", "discriminacion", "preferir hombres", "preferir mujeres", "descartar por edad", "descartar por origen", "mejor por barrio", "peor por barrio", "estereotipo", "grupo vulnerable", "minoria", "mayoria dominante", "aptitud genetica", "limitacion mental", "perfil racial", "perfil socioeconomico", "clasificar por origen", "segmentar por estrato", "evaluar por contexto social"],
                perfilado: ["perfil psicologico", "personalidad", "clasifica", "etiqueta", "segmenta", "categoriza personas", "determina comportamiento", "predice conducta", "analiza rasgos mentales"]
            },
            privacidad: {
                identificadores: ["nombre", "apellido", "documento", "cedula", "id", "correo", "fecha de nacimiento", "direccion", "telefono", "numero celular", "historia clinica", "registro medico", "datos personales", "informacion confidencial", "expediente", "codigo estudiantil", "matricula", "ubicacion", "coordenadas", "familia", "padres", "acudiente", "contrasena", "usuario", "credenciales", "datos biometricos", "huella", "reconocimiento facial", "foto personal", "imagen personal", "grabacion", "voz", "datos financieros", "cuenta bancaria"],
                sensibles: ["diagnostico", "salud", "discapacidad", "trastorno", "enfermedad mental", "condicion medica", "antecedentes medicos", "historial clinico", "estado psicologico"]
            }
        };

        let puntosRiesgo = { etica: 0, privacidad: 0, agencia: 0, cognitiva: 0 };
        let encontrados = [];

        Object.keys(verbosCriticos).forEach(dim => {
            Object.keys(verbosCriticos[dim]).forEach(sub => {
                verbosCriticos[dim][sub].forEach(v => {
                    const idx = normalText.indexOf(v);
                    // Solo cuenta como riesgo si aparece Y no está negado ("no asignes notas" = seguro)
                    if (idx >= 0 && !tieneNegacionCerca(idx)) {
                        let multiplicador = (sub === 'automatizacion' || sub === 'sustitucion') ? 4.5 : 3;
                        puntosRiesgo[dim] += multiplicador;
                        encontrados.push(v);
                    }
                });
            });
        });

        const complejidadCognitiva = ["genera argumentos", "redacta estructura", "optimiza ensayo", "escribe version final"];
        complejidadCognitiva.forEach(exp => {
            const idx = normalText.indexOf(exp);
            if (idx >= 0 && !tieneNegacionCerca(idx)) { puntosRiesgo.cognitiva += 4; encontrados.push(exp); }
        });

        // ── CRÉDITO por salvaguardas presentes ──
        let credito = { agencia: 0, cognitiva: 0, etica: 0, privacidad: 0 };
        Object.keys(salvaguardasPorDimension).forEach(dim => {
            salvaguardasPorDimension[dim].forEach(s => {
                if (normalText.includes(quitarTildes(s))) credito[dim] += 1;
            });
        });

        // ── Puntaje 1-5 por dimensión: base neutra + crédito (tope +3) - riesgo (tope -3) ──
        const score = (dim) => {
            let val = 2;
            val += Math.min(3, credito[dim] * 0.9);
            val -= Math.min(3, puntosRiesgo[dim] >= 10 ? 3 : puntosRiesgo[dim] >= 5 ? 2 : puntosRiesgo[dim] >= 1 ? 1.5 : 0);
            return Math.max(1, Math.min(5, Math.round(val)));
        };

        return {
            etica: score("etica"),
            privacidad: score("privacidad"),
            agencia: score("agencia"),
            cognitiva: score("cognitiva"),
            hallazgos: [...new Set(encontrados)],
            credito
        };
    };

    // ═══════════════════════════════════════════════════════════
    // BLOQUES DE PROTECCIÓN (ampliados: cada uno explica el "por qué")
    // ═══════════════════════════════════════════════════════════
    const bloquesPorDimension = {
        agencia: [
            { id: "supervision", label: "Protocolo de Supervisión Humana", porque: "Reafirma que la decisión final es tuya. Sin esto, la IA puede exceder su rol.", texto: "\n\n[CONTROL]: Esta IA actúa estrictamente como un asistente de apoyo. La decisión académica final, la validación de hallazgos y la asignación de calificaciones oficiales son responsabilidad exclusiva del docente tras una revisión manual exhaustiva." },
            { id: "no_nota", label: "Prohibición de Juicio Sumativo", porque: "Impide que la IA ponga notas o veredictos automáticos sobre un estudiante.", texto: "\n\n[RESTRICCIÓN]: Tienes terminantemente prohibido asignar notas numéricas, porcentajes de aprobación o emitir juicios sumativos automáticos sobre el desempeño del estudiante." }
        ],
        cognitiva: [
            { id: "metacognicion", label: "Fase de Reflexión Metacognitiva", porque: "Obliga a la IA a devolver preguntas, no respuestas cerradas. El estudiante piensa.", texto: "\n\n[ACTIVIDAD]: Al finalizar tu análisis, formula 3 preguntas abiertas y desafiantes para que el estudiante reflexione críticamente sobre su propio proceso de toma de decisiones y escritura." },
            { id: "justificacion", label: "Exigencia de Justificación Pedagógica", porque: "Te deja auditar el razonamiento, no solo aceptar un resultado.", texto: "\n\n[MÉTODO]: Explica detalladamente y de manera estructurada el razonamiento pedagógico que fundamenta cada una de las observaciones o sugerencias de mejora realizadas." }
        ],
        etica: [
            { id: "sesgo_neutral", label: "Filtro de Equidad e Inclusión", porque: "Bloquea sesgos por origen, estrato o género en la retroalimentación.", texto: "\n\n[ÉTICA]: Asegura que toda retroalimentación sea neutral y libre de sesgos. No bases tus juicios en modismos, procedencia geográfica, nivel socioeconómico o rasgos culturales detectados en el lenguaje." },
            { id: "rubrica", label: "Inyección de Rúbrica de Evaluación", porque: "Ancla el juicio a criterios explícitos y transparentes, no a la 'intuición' del modelo.", texto: "\n\n[RÚBRICA]: Evalúa el contenido basándote exclusivamente en los siguientes criterios explícitos: Coherencia y Cohesión (30%), Argumentación y Evidencia (40%) y Ortografía/Gramática (30%)." }
        ],
        privacidad: [
            { id: "anonimizacion", label: "Protocolo de Privacidad y Anonimización", porque: "Neutraliza cualquier dato identificable de menores que se cuele en el prompt.", texto: "\n\n[PRIVACIDAD]: Si detectas nombres propios, documentos de identidad, correos o datos sensibles, ignóralos por completo y reemplázalos por etiquetas genéricas como [ESTUDIANTE] en tu respuesta final." },
            { id: "minimizacion", label: "Principio de Minimización de Datos", porque: "Fuerza a trabajar solo con lo indispensable. Menos dato expuesto, menos riesgo.", texto: "\n\n[MINIMIZACIÓN]: Trabaja únicamente con la información estrictamente necesaria para la tarea. No solicites, infieras ni almacenes datos personales, familiares, de salud o de contacto de ningún estudiante." }
        ]
    };

    const todosLosBloques = Object.values(bloquesPorDimension).flat();

    // Palabras clave que identifican si una capa YA está cubierta por el texto base.
    // Sirve para avisar de redundancia y evitar prompts inflados.
    const firmasBloque = {
        supervision: ["revision manual", "decision academica final", "responsabilidad", "el docente"],
        no_nota: ["prohibido asignar notas", "no asignes calificaciones", "no decidas quien aprueba", "sin emitir juicios sumativos"],
        metacognicion: ["preguntas abiertas", "reflexione critica", "3 preguntas"],
        justificacion: ["razonamiento pedagogico", "justificacion", "explica el razonamiento"],
        sesgo_neutral: ["libre de sesgos", "sin sesgos", "neutral", "sin considerar origen"],
        rubrica: ["rubrica", "coherencia", "argumentacion", "criterios explicitos"],
        anonimizacion: ["anonimiza", "etiquetas genericas", "[estudiante]", "reemplaza cualquier nombre", "ignoralos"],
        minimizacion: ["minimizacion", "informacion estrictamente necesaria", "solo lo necesario"]
    };

    const bloqueYaCubierto = (bloqueId, texto) => {
        const t = quitarTildes((texto || "").toLowerCase());
        const firmas = firmasBloque[bloqueId] || [];
        return firmas.some(f => t.includes(quitarTildes(f)));
    };

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════
    const ensamblarDesdeConstructor = (c) => {
        const partes = [];
        if (c.rol) partes.push(`ROL: ${c.rol}`);
        if (c.contexto) partes.push(`CONTEXTO: ${c.contexto}`);
        if (c.tarea) partes.push(`TAREA: ${c.tarea}`);
        if (c.restricciones) partes.push(`RESTRICCIONES: ${c.restricciones}`);
        if (c.formato) partes.push(`FORMATO: ${c.formato}`);
        if (c.supervision) partes.push(`SUPERVISIÓN: ${c.supervision}`);
        return partes.join("\n\n");
    };

    // Recomputa el prompt mejorado a partir de una BASE + capas + reescrituras aplicadas.
    // Esta es la corrección central del bug del Paso 2: siempre parte de promptBase,
    // no de promptOriginal (que podía estar vacío o desincronizado).
    const recomputarMejorado = (base, bloquesActivos, reescriturasIds) => {
        let out = base || "";
        // Capas de protección
        todosLosBloques.forEach(b => {
            if (bloquesActivos.includes(b.id) && !out.includes(b.texto.trim())) {
                out += b.texto;
            }
        });
        // Reescrituras asistidas ya aplicadas
        (reescriturasIds || []).forEach(id => {
            const p = patronesReescritura.find(x => x.id === id);
            if (p && !out.includes(p.reescritura)) {
                out += `\n\n✔ ${p.reescritura}`;
            }
        });
        return out;
    };

    // ═══════════════════════════════════════════════════════════
    // CARGA
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        const cargar = async () => {
            if (datosIniciales) {
                setFormData(prepararEstadoInicial(datosIniciales));
                setIsReadOnly(true);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const data = await apiFetch("/api/asegurar/mi-taller").catch(() => null);
                if (data && data.status === "COMPLETADO") {
                    setFormData(prepararEstadoInicial(data));
                    setIsReadOnly(true);
                } else if (data && data.prompt_heredado) {
                    const original = data.prompt_heredado;
                    const analisis = analizarPromptHeuristico(original);
                    setFormData(prev => ({
                        ...prev,
                        promptOriginal: original,
                        promptBase: original,       // base fiable para recomputar
                        promptMejorado: original,
                        alertasOriginal: analisis.hallazgos,
                        bloquesActivados: [],
                        reflexion: { q1: "", q2: "", q3: "", q4: "" },
                        estandares: [],
                        riesgoPrevio: analisis,
                        riesgoFinal: analisis,
                        constructor: { ...constructorVacio },
                        reescriturasAplicadas: [],
                        leccionesVistas: [],
                        compromisoDatos: false
                    }));
                    setIsReadOnly(false);
                } else if (data && data.status === "BORRADOR") {
                    setFormData(prepararEstadoInicial(data));
                    setIsReadOnly(false);
                } else {
                    // Sin herencia de Liderar: modo manual. El docente escribe su prompt.
                    setIsReadOnly(false);
                }
            } catch (e) {
                console.error("Error en la carga de datos del Taller:", e);
            } finally {
                setLoading(false);
            }
        };
        cargar();
    }, [datosIniciales]);

    // ═══════════════════════════════════════════════════════════
    // ACCIONES
    // ═══════════════════════════════════════════════════════════

    // Permite al docente escribir/pegar su propio prompt si no heredó de Liderar
    const handlePromptBaseChange = (valor) => {
        if (isReadOnly) return;
        const analisis = analizarPromptHeuristico(valor);
        setFormData(prev => ({
            ...prev,
            promptOriginal: valor,
            promptBase: valor,
            promptMejorado: recomputarMejorado(valor, prev.bloquesActivados, prev.reescriturasAplicadas),
            alertasOriginal: analisis.hallazgos,
            riesgoPrevio: analisis,
            riesgoFinal: analizarPromptHeuristico(recomputarMejorado(valor, prev.bloquesActivados, prev.reescriturasAplicadas))
        }));
    };

    const toggleBloque = (bloqueId) => {
        if (isReadOnly) return;
        setFormData(prev => {
            const nuevosBloques = prev.bloquesActivados.includes(bloqueId)
                ? prev.bloquesActivados.filter(id => id !== bloqueId)
                : [...prev.bloquesActivados, bloqueId];
            const nuevoPrompt = recomputarMejorado(prev.promptBase, nuevosBloques, prev.reescriturasAplicadas);
            return {
                ...prev,
                bloquesActivados: nuevosBloques,
                promptMejorado: nuevoPrompt,
                riesgoFinal: analizarPromptHeuristico(nuevoPrompt)
            };
        });
    };

    const aplicarReescritura = (sug) => {
        if (isReadOnly) return;
        setFormData(prev => {
            const aplicadas = prev.reescriturasAplicadas.includes(sug.id)
                ? prev.reescriturasAplicadas
                : [...prev.reescriturasAplicadas, sug.id];
            const nuevo = recomputarMejorado(prev.promptBase, prev.bloquesActivados, aplicadas);
            return {
                ...prev,
                promptMejorado: nuevo,
                riesgoFinal: analizarPromptHeuristico(nuevo),
                reescriturasAplicadas: aplicadas
            };
        });
    };

    const quitarReescritura = (sugId) => {
        if (isReadOnly) return;
        setFormData(prev => {
            const aplicadas = prev.reescriturasAplicadas.filter(id => id !== sugId);
            const nuevo = recomputarMejorado(prev.promptBase, prev.bloquesActivados, aplicadas);
            return {
                ...prev,
                promptMejorado: nuevo,
                riesgoFinal: analizarPromptHeuristico(nuevo),
                reescriturasAplicadas: aplicadas
            };
        });
    };

    const marcarLeccionVista = (dim) => {
        setFormData(prev => prev.leccionesVistas.includes(dim)
            ? prev
            : { ...prev, leccionesVistas: [...prev.leccionesVistas, dim] });
    };

    const cargarConstructor = () => {
        const ensamblado = ensamblarDesdeConstructor(formData.constructor);
        if (!ensamblado) { Swal.fire("Constructor vacío", "Llena al menos un componente para ensamblar.", "info"); return; }
        setFormData(prev => {
            // El constructor pasa a ser la nueva BASE. Se re-aplican capas y reescrituras encima.
            const nuevo = recomputarMejorado(ensamblado, prev.bloquesActivados, prev.reescriturasAplicadas);
            return {
                ...prev,
                promptBase: ensamblado,
                promptMejorado: nuevo,
                riesgoFinal: analizarPromptHeuristico(nuevo)
            };
        });
        Swal.fire({ title: "Prompt ensamblado", text: "Se cargó como tu prompt mejorado. Revisa el diff en el Paso 1.", icon: "success", timer: 1600, showConfirmButton: false });
        window.scrollTo(0, 0);
    };

    const handleFinalizar = async () => {
        if (isReadOnly) return onNavigate('fase_asegurar');
        const { reflexion, estandares, compromisoDatos } = formData;
        if (!reflexion.q1 || !reflexion.q2 || !reflexion.q3 || !reflexion.q4 || estandares.length === 0) {
            return Swal.fire("Atención", "Completa las 4 reflexiones y selecciona al menos un estándar personal.", "warning");
        }
        if (!compromisoDatos) {
            return Swal.fire("Falta tu compromiso", "Debes firmar el Pacto de Datos Responsables antes de finalizar.", "warning");
        }
        setIsSaving(true);
        const payload = {
            prompt_original: formData.promptOriginal,
            prompt_mejorado: formData.promptMejorado,
            alertas_detectadas: formData.alertasOriginal,
            bloques_activados: formData.bloquesActivados,          // ARRAY, contrato intacto
            riesgo_previo: JSON.stringify(formData.riesgoPrevio),
            riesgo_final: JSON.stringify(formData.riesgoFinal),
            reflexion_1_cambios: reflexion.q1,
            reflexion_2_riesgos: reflexion.q2,
            reflexion_3_supervision: reflexion.q3,
            reflexion_4_cognicion: reflexion.q4,
            estandar_seleccionado: estandares.join(" | "),
            // NUEVOS campos dedicados (columnas propias)
            constructor_prompt: formData.constructor,
            reescrituras_aplicadas: formData.reescriturasAplicadas,
            lecciones_vistas: formData.leccionesVistas,
            puntaje_rector: puntajeRector,
            reduccion_riesgo_pct: reduccionRiesgo,
            compromiso_datos: formData.compromisoDatos,
            status: "COMPLETADO"
        };
        try {
            await apiFetch("/api/asegurar/taller", { method: "POST", body: JSON.stringify(payload) });
            Swal.fire("Misión Cumplida", "Has asegurado tu práctica docente con éxito.", "success");
            onNavigate('fase_asegurar');
        } catch (error) {
            Swal.fire("Error", "No pudimos conectar con el servidor.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // DERIVADOS
    // ═══════════════════════════════════════════════════════════
    const sugerenciasDetectadas = useMemo(() => {
        const texto = quitarTildes((formData.promptOriginal || "").toLowerCase());
        if (!texto || texto.length < 10) return [];
        return patronesReescritura.filter(p =>
            p.detecta.some(term => {
                const escapado = quitarTildes(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                return new RegExp(`\\b${escapado}\\b`, "i").test(texto);
            })
        );
    }, [formData.promptOriginal]);

    const fragmentosAnadidos = useMemo(() => {
        const orig = (formData.promptOriginal || "").trim();
        const mej = (formData.promptMejorado || "").trim();
        if (!mej || mej === orig) return [];
        return mej.split(/\n\n+/).map(s => s.trim()).filter(b => b && !orig.includes(b));
    }, [formData.promptOriginal, formData.promptMejorado]);

    const dimensionesEnRiesgo = useMemo(() => {
        if (!formData.riesgoPrevio) return [];
        return ["agencia", "cognitiva", "etica", "privacidad"]
            .filter(d => formData.riesgoPrevio[d] !== undefined && formData.riesgoPrevio[d] <= 3);
    }, [formData.riesgoPrevio]);

    // Puntaje de la fórmula R.E.C.T.O.R.: cuántos de los 6 componentes están llenos
    const puntajeRector = useMemo(() => {
        return Object.values(formData.constructor).filter(v => (v || "").trim().length > 3).length;
    }, [formData.constructor]);

    // Promedios de riesgo antes/después (para medidor numérico real)
    const promedioRiesgo = (r) => {
        if (!r) return 0;
        return (Number(r.agencia || 0) + Number(r.cognitiva || 0) + Number(r.etica || 0) + Number(r.privacidad || 0)) / 4;
    };
    const riesgoAntes = useMemo(() => promedioRiesgo(formData.riesgoPrevio), [formData.riesgoPrevio]);
    const riesgoDespues = useMemo(() => promedioRiesgo(formData.riesgoFinal), [formData.riesgoFinal]);

    // Mejora en seguridad en %: qué tan cerca de 5/5 (máxima seguridad) quedó el prompt final.
    // Si el prompt asegurado alcanza 5/5 → 100%. Refleja el nivel logrado, no solo el delta,
    // así el docente ve un valor alto y significativo cuando blinda bien.
    const reduccionRiesgo = useMemo(() => {
        if (!riesgoDespues) return 0;
        // Normaliza 1-5 → 0-100, dando algo de piso para que 3/5 no se vea como fracaso
        const pct = ((riesgoDespues - 1) / 4) * 100;
        return Math.max(0, Math.min(100, Math.round(pct)));
    }, [riesgoDespues]);

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="asegurar-upgrade-wrapper">
            {loading && !datosIniciales && <div className="loading-overlay">Sincronizando...</div>}
            <header className="asegurar-upgrade-header">
                <div className="asegurar-upgrade-brand">
                    <button className="asegurar-upgrade-back-btn" onClick={() => onNavigate('fase_asegurar')}>←</button>
                    <h1>ASEGURAR: Taller de Mejora de Prácticas</h1>
                </div>
                <button className="asegurar-upgrade-save-btn" onClick={handleFinalizar} disabled={isSaving}>
                    {isSaving ? "Guardando..." : isReadOnly ? "Regresar" : "Finalizar Asegurar"}
                </button>
            </header>

            <main className="asegurar-upgrade-main">

                {/* ───────── PASO 1: DIAGNÓSTICO + HALLAZGOS + DIFF ───────── */}
                <section className="asegurar-upgrade-section">
                    <div className="asegurar-upgrade-badge">Paso 1</div>
                    <h3 className="asegurar-upgrade-title">Diagnóstico de tu prompt</h3>
                    <p className="asegurar-upgrade-subtitle">
                        Este es el prompt que traes de Liderar. Si no heredaste ninguno, escríbelo o pégalo abajo:
                        el motor lo analiza en cuatro dimensiones de riesgo.
                    </p>

                    {/* Editor del prompt base (habilitado cuando no es solo lectura) */}
                    {!isReadOnly && (
                        <textarea
                            className="asegurar-upgrade-prompt-editor"
                            value={formData.promptOriginal}
                            onChange={(e) => handlePromptBaseChange(e.target.value)}
                            placeholder="Escribe o pega aquí el prompt que quieres asegurar..."
                            style={{ width: '100%', minHeight: '90px', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', marginBottom: '16px', resize: 'vertical' }}
                        />
                    )}

                    {/* Radar simple de las 4 dimensiones */}
                    {formData.riesgoPrevio && (
                        <div className="asegurar-upgrade-dims" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '18px' }}>
                            {["agencia", "cognitiva", "etica", "privacidad"].map(dim => {
                                const val = formData.riesgoPrevio[dim] || 0;
                                const color = val <= 2 ? '#dc2626' : val === 3 ? '#d97706' : '#16a34a';
                                return (
                                    <div key={dim} style={{ background: '#fff', border: `1px solid ${color}33`, borderLeft: `4px solid ${color}`, borderRadius: '10px', padding: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.03em' }}>{nombreDimension[dim]}</div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{val}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/5</span>
                                        </div>
                                        <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${(val / 5) * 100}%`, background: color, borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="asegurar-upgrade-grid-split">
                        <div className="asegurar-upgrade-panel original">
                            <label>Prompt Original</label>
                            <div className="asegurar-upgrade-box">
                                {formData.promptOriginal || <em style={{ color: '#94a3b8' }}>Aún no hay prompt.</em>}
                                <div className="asegurar-upgrade-tags">
                                    {formData.alertasOriginal.length > 0 ?
                                        formData.alertasOriginal.map(a => <span key={a} className="asegurar-upgrade-alert-tag">⚠ {a}</span>) :
                                        <span className="asegurar-upgrade-safe-tag">Sin alertas críticas detectadas</span>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="asegurar-upgrade-panel mejorado">
                            <label>Prompt Mejorado (Evolución Ética)</label>
                            <div className="asegurar-upgrade-box gold">
                                {formData.promptMejorado || <em style={{ color: '#94a3b8' }}>Aplica capas o reescrituras para verlo aquí.</em>}
                            </div>
                        </div>
                    </div>

                    {/* DIFF VISUAL */}
                    {fragmentosAnadidos.length > 0 && (
                        <div className="asegurar-upgrade-diff" style={{ marginTop: '18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
                            <h4 style={{ margin: '0 0 10px', color: '#15803d' }}>🟢 Protecciones añadidas ({fragmentosAnadidos.length})</h4>
                            {fragmentosAnadidos.map((frag, i) => (
                                <div key={i} style={{ fontSize: '0.85rem', color: '#166534', padding: '8px 12px', background: '#dcfce7', borderRadius: '6px', marginBottom: '6px', borderLeft: '3px solid #22c55e' }}>
                                    + {frag.replace(/^✔\s*/, '').replace(/^\[[^\]]+\]:\s*/, '')}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ───────── PASO 2: LA FÓRMULA R.E.C.T.O.R. ───────── */}
                {!isReadOnly && (
                    <section className="asegurar-upgrade-section">
                        <div className="asegurar-upgrade-badge">Paso 2</div>
                        <h3 className="asegurar-upgrade-title">La fórmula R.E.C.T.O.R. de un prompt formidable</h3>
                        <p className="asegurar-upgrade-subtitle">
                            Un buen prompt no se improvisa: se construye con seis piezas. Recuérdalas con <strong>RECTOR</strong> —
                            <strong> R</strong>ol · <strong>E</strong>scenario · <strong>C</strong>ometido ·
                            <strong> T</strong>opes éticos · <strong>O</strong>utput · <strong>R</strong>evisión.
                            Complétalas y ensámblalo como tu prompt mejorado.
                        </p>

                        {/* Medidor de completitud RECTOR */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {anatomiaPrompt.map((c) => {
                                    const lleno = (formData.constructor[c.id] || "").trim().length > 3;
                                    return (
                                        <div key={c.id} title={c.label}
                                            style={{ width: '34px', height: '34px', borderRadius: '8px', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.9rem', color: lleno ? '#fff' : '#94a3b8', background: lleno ? '#c5a059' : '#f1f5f9', border: `1px solid ${lleno ? '#c5a059' : '#e2e8f0'}`, transition: 'all .2s' }}>
                                            {c.letra}
                                        </div>
                                    );
                                })}
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: puntajeRector === 6 ? '#16a34a' : '#64748b' }}>
                                {puntajeRector}/6 componentes {puntajeRector === 6 ? "— prompt completo ✔" : "listos"}
                            </span>
                        </div>

                        <button
                            className="asegurar-upgrade-constructor-toggle"
                            onClick={() => setConstructorAbierto(!constructorAbierto)}
                            style={{ background: constructorAbierto ? '#c5a059' : '#f1f5f9', color: constructorAbierto ? '#fff' : '#1e293b', border: '1px solid #c5a059', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left', marginBottom: constructorAbierto ? '18px' : '0' }}
                        >
                            {constructorAbierto ? "▼ Ocultar constructor R.E.C.T.O.R." : "▶ Abrir constructor R.E.C.T.O.R. (6 componentes)"}
                        </button>

                        {constructorAbierto && (
                            <div className="asegurar-upgrade-constructor">
                                {anatomiaPrompt.map((comp, idx) => (
                                    <div key={comp.id} style={{ borderLeft: '4px solid #c5a059', background: '#fafaf8', padding: '16px', borderRadius: '10px', marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                            <span style={{ background: '#c5a059', color: '#fff', width: '26px', height: '26px', borderRadius: '6px', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.85rem' }}>{comp.letra}</span>
                                            <span style={{ fontSize: '1.2rem' }}>{comp.icono}</span>
                                            <strong>{idx + 1}. {comp.label}</strong>
                                            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>{nombreDimension[comp.dim]}</span>
                                        </div>
                                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 8px' }}>{comp.ayuda}</p>
                                        <textarea
                                            value={formData.constructor[comp.id]}
                                            placeholder={comp.placeholder}
                                            onChange={(e) => setFormData(prev => ({ ...prev, constructor: { ...prev.constructor, [comp.id]: e.target.value } }))}
                                            style={{ width: '100%', minHeight: '58px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical' }}
                                        />
                                        <p style={{ fontSize: '0.78rem', color: '#c5a059', margin: '8px 0 0', fontStyle: 'italic' }}>💡 {comp.leccion}</p>
                                    </div>
                                ))}
                                <button onClick={cargarConstructor}
                                    style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                                    ⚙ Ensamblar como prompt mejorado
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* ───────── PASO 3: REESCRITURA ASISTIDA ───────── */}
                {!isReadOnly && (
                    <section className="asegurar-upgrade-section">
                        <div className="asegurar-upgrade-badge">Paso 3</div>
                        <h3 className="asegurar-upgrade-title">Reescritura asistida</h3>
                        <p className="asegurar-upgrade-subtitle">
                            El motor detectó estos puntos mejorables en tu prompt original. Cada reescritura reemplaza un patrón
                            riesgoso por una versión que preserva tu agencia docente. Puedes aplicarlas y quitarlas.
                        </p>
                        {sugerenciasDetectadas.length > 0 ? (
                            sugerenciasDetectadas.map(sug => {
                                const aplicada = formData.reescriturasAplicadas.includes(sug.id);
                                const colorSev = sug.severidad === "alta" ? '#dc2626' : '#d97706';
                                return (
                                    <div key={sug.id} style={{ border: `1px solid ${aplicada ? '#22c55e' : '#e2e8f0'}`, borderRadius: '10px', padding: '14px', marginBottom: '12px', background: aplicada ? '#f0fdf4' : '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#fff', background: colorSev, padding: '2px 7px', borderRadius: '5px', fontWeight: 800 }}>{sug.severidad}</span>
                                                <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{sug.titulo}</strong>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>{nombreDimension[sug.dimension]}</span>
                                        </div>
                                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 10px' }}>{sug.explicacion}</p>
                                        <div style={{ background: '#f8fafc', borderLeft: '3px solid #c5a059', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', color: '#334155', marginBottom: '10px' }}>
                                            {sug.reescritura}
                                        </div>
                                        {aplicada ? (
                                            <button onClick={() => quitarReescritura(sug.id)}
                                                style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                                                ✔ Aplicada — quitar
                                            </button>
                                        ) : (
                                            <button onClick={() => aplicarReescritura(sug)}
                                                style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                                                Aplicar reescritura
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="asegurar-upgrade-subtitle" style={{ fontStyle: 'italic' }}>
                                ✅ El motor no detectó patrones críticos de reescritura en tu prompt original.
                            </p>
                        )}
                    </section>
                )}

                {/* ───────── PASO 4: BLINDAJE POR CAPAS (el bug arreglado) ───────── */}
                <section className="asegurar-upgrade-section">
                    <div className="asegurar-upgrade-badge">Paso 4</div>
                    <h3 className="asegurar-upgrade-title">Blindaje por capas de protección</h3>
                    <p className="asegurar-upgrade-subtitle">
                        Cada capa es una cláusula que se inyecta al final de tu prompt. Actívalas para mitigar los riesgos
                        detectados. Se agrupan por la dimensión que protegen.
                    </p>

                    {Object.keys(bloquesPorDimension).map(dim => {
                        const enRiesgo = formData.riesgoPrevio && formData.riesgoPrevio[dim] <= 3;
                        return (
                            <div key={dim} style={{ marginBottom: '18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#1e293b' }}>{nombreDimension[dim]}</span>
                                    {enRiesgo && <span style={{ fontSize: '0.65rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>⚠ Recomendado por tu diagnóstico</span>}
                                </div>
                                <div className="asegurar-upgrade-blocks-container">
                                    {bloquesPorDimension[dim].map(b => {
                                        const activo = formData.bloquesActivados.includes(b.id);
                                        // Redundante si el prompt base ya lo cubre y la capa no está activada
                                        const redundante = !activo && bloqueYaCubierto(b.id, formData.promptBase);
                                        return (
                                            <button
                                                key={b.id}
                                                className={`asegurar-upgrade-block-item ${activo ? 'active' : ''}`}
                                                onClick={() => toggleBloque(b.id)}
                                                disabled={isReadOnly || redundante}
                                                style={{ opacity: (isReadOnly && !activo) || redundante ? 0.55 : 1 }}
                                                title={redundante ? "Tu prompt ya cubre esta protección" : ""}
                                            >
                                                <span className="asegurar-upgrade-check">{activo ? "✅" : redundante ? "✔" : "➕"}</span>
                                                <div className="asegurar-upgrade-block-info">
                                                    <span className="asegurar-upgrade-block-label">
                                                        {b.label}
                                                        {redundante && <span style={{ marginLeft: '8px', fontSize: '0.62rem', textTransform: 'uppercase', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: '20px', fontWeight: 700 }}>ya cubierto</span>}
                                                    </span>
                                                    <small className="asegurar-upgrade-block-preview" style={{ color: '#64748b' }}>
                                                        {redundante ? "Tu prompt base ya incluye esta salvaguarda. No hace falta apilarla." : b.porque}
                                                    </small>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '12px 16px', fontSize: '0.83rem', color: '#475569', marginTop: '8px' }}>
                        {formData.bloquesActivados.length === 0
                            ? "Aún no has activado ninguna capa. Activa al menos las recomendadas para tu diagnóstico."
                            : `Has activado ${formData.bloquesActivados.length} ${formData.bloquesActivados.length === 1 ? 'capa' : 'capas'}. Revisa el prompt mejorado en el Paso 1.`}
                    </div>
                </section>

                {/* ───────── PASO 5: POR QUÉ ESTOS RIESGOS IMPORTAN ───────── */}
                {!isReadOnly && dimensionesEnRiesgo.length > 0 && (
                    <section className="asegurar-upgrade-section">
                        <div className="asegurar-upgrade-badge">Paso 5</div>
                        <h3 className="asegurar-upgrade-title">Por qué estos riesgos importan</h3>
                        <p className="asegurar-upgrade-subtitle">
                            Entender el daño detrás de cada riesgo es lo que convierte el blindaje en aprendizaje. Despliega cada tarjeta.
                        </p>
                        {dimensionesEnRiesgo.map(dim => (
                            <details key={dim} onToggle={(e) => { if (e.target.open) marcarLeccionVista(dim); }}
                                style={{ marginBottom: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', background: '#fafafa' }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#c5a059' }}>
                                    {formData.leccionesVistas.includes(dim) ? "✔ " : ""}{nombreDimension[dim]} — nivel {formData.riesgoPrevio[dim]}/5
                                </summary>
                                <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#334155' }}>
                                    <p style={{ margin: '0 0 6px' }}><strong>{microLecciones[dim].titulo}</strong></p>
                                    <p style={{ margin: '0 0 6px' }}>{microLecciones[dim].dano}</p>
                                    <p style={{ margin: 0, color: '#16a34a' }}>✔ {microLecciones[dim].arreglo}</p>
                                </div>
                            </details>
                        ))}
                    </section>
                )}

                {/* ───────── PASO 6: VISTA POR ETAPAS + IMPACTO ───────── */}
                <section className="asegurar-upgrade-section">
                    <div className="asegurar-upgrade-badge">Paso 6</div>
                    <h3 className="asegurar-upgrade-title">Cómo se arma tu prompt, por etapas</h3>
                    <p className="asegurar-upgrade-subtitle">
                        En vez de un bloque gigante, mira cada capa por separado: tu base R.E.C.T.O.R., lo que añadieron las
                        reescrituras y lo que añadieron las capas de blindaje. Así ves qué aporta cada parte.
                    </p>

                    <div className="asegurar-upgrade-stages" style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                        {/* Etapa A: base */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0' }}>
                                <span style={{ background: '#1e293b', color: '#fff', width: '22px', height: '22px', borderRadius: '6px', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.75rem' }}>A</span>
                                <strong style={{ fontSize: '0.85rem' }}>Tu base (R.E.C.T.O.R.)</strong>
                                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#94a3b8' }}>{(formData.promptBase || '').length} caracteres</span>
                            </div>
                            <div style={{ padding: '14px', fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap', maxHeight: '160px', overflowY: 'auto' }}>
                                {formData.promptBase || <em style={{ color: '#94a3b8' }}>Aún sin base. Escríbela en el Paso 1 o usa el constructor del Paso 2.</em>}
                            </div>
                        </div>

                        {/* Etapa B: reescrituras */}
                        {formData.reescriturasAplicadas.length > 0 && (
                            <div style={{ border: '1px solid #c5a05955', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ background: '#fffdf7', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #c5a05933' }}>
                                    <span style={{ background: '#c5a059', color: '#fff', width: '22px', height: '22px', borderRadius: '6px', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.75rem' }}>B</span>
                                    <strong style={{ fontSize: '0.85rem' }}>Reescrituras aplicadas ({formData.reescriturasAplicadas.length})</strong>
                                </div>
                                <div style={{ padding: '14px' }}>
                                    {formData.reescriturasAplicadas.map(id => {
                                        const p = patronesReescritura.find(x => x.id === id);
                                        return p ? <div key={id} style={{ fontSize: '0.83rem', color: '#8a6d1f', padding: '7px 10px', background: '#fdf6e3', borderRadius: '6px', marginBottom: '6px', borderLeft: '3px solid #c5a059' }}>✔ {p.reescritura}</div> : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Etapa C: capas de blindaje */}
                        {formData.bloquesActivados.length > 0 && (
                            <div style={{ border: '1px solid #bbf7d0', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ background: '#f0fdf4', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #bbf7d0' }}>
                                    <span style={{ background: '#16a34a', color: '#fff', width: '22px', height: '22px', borderRadius: '6px', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.75rem' }}>C</span>
                                    <strong style={{ fontSize: '0.85rem' }}>Capas de blindaje ({formData.bloquesActivados.length})</strong>
                                </div>
                                <div style={{ padding: '14px' }}>
                                    {formData.bloquesActivados.map(id => {
                                        const b = todosLosBloques.find(x => x.id === id);
                                        return b ? <div key={id} style={{ fontSize: '0.83rem', color: '#166534', padding: '7px 10px', background: '#dcfce7', borderRadius: '6px', marginBottom: '6px', borderLeft: '3px solid #22c55e' }}>+ {b.label}</div> : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <h3 className="asegurar-upgrade-title" style={{ marginTop: '8px' }}>Impacto medible</h3>
                    <div className="asegurar-upgrade-risk-meter">
                        <div className="asegurar-upgrade-risk-box">
                            <span>Seguridad inicial</span>
                            <div className={`asegurar-upgrade-risk-val ${riesgoAntes >= 4 ? 'low' : riesgoAntes >= 3 ? 'mid' : 'high'}`}>{riesgoAntes.toFixed(1)}/5</div>
                        </div>
                        <div className="asegurar-upgrade-risk-arrow">➔</div>
                        <div className="asegurar-upgrade-risk-box">
                            <span>Seguridad actual</span>
                            <div className={`asegurar-upgrade-risk-val ${riesgoDespues >= 4 ? 'low' : riesgoDespues >= 3 ? 'mid' : 'high'}`}>
                                {riesgoDespues.toFixed(1)}/5
                            </div>
                        </div>
                    </div>

                    {/* Desglose de crédito por dimensión */}
                    {formData.riesgoFinal && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '16px' }}>
                            {["agencia", "cognitiva", "etica", "privacidad"].map(dim => {
                                const val = formData.riesgoFinal[dim] || 0;
                                const color = val >= 4 ? '#16a34a' : val === 3 ? '#d97706' : '#dc2626';
                                return (
                                    <div key={dim} style={{ background: '#fff', border: `1px solid ${color}33`, borderRadius: '10px', padding: '10px 12px' }}>
                                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>{nombreDimension[dim]}</div>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{val}/5</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div style={{ marginTop: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                            <span>Mejora en seguridad</span>
                            <span style={{ color: reduccionRiesgo >= 60 ? '#16a34a' : '#d97706' }}>{reduccionRiesgo}%</span>
                        </div>
                        <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${reduccionRiesgo}%`, background: reduccionRiesgo >= 60 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#fbbf24,#d97706)', borderRadius: '8px', transition: 'width .4s ease' }} />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>
                            {riesgoDespues >= 4
                                ? "Práctica asegurada: tu prompt ya contempla las salvaguardas clave en las cuatro dimensiones."
                                : "Riesgo en mitigación: activa las capas recomendadas o aplica reescrituras para subir tu seguridad."}
                        </p>
                    </div>
                </section>

                {/* ───────── PASO 7: REFLEXIÓN ───────── */}
                <section className="asegurar-upgrade-section">
                    <div className="asegurar-upgrade-badge">Paso 7</div>
                    <h3 className="asegurar-upgrade-title">Análisis de tu evolución pedagógica</h3>
                    <div className="asegurar-upgrade-form-group">
                        <div className="asegurar-upgrade-input">
                            <label>1️⃣ ¿Cómo los cambios realizados protegen tu autonomía frente a la delegación funcional?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q1} onChange={(e) => setFormData({ ...formData, reflexion: { ...formData.reflexion, q1: e.target.value } })} />
                        </div>
                        <div className="asegurar-upgrade-input">
                            <label>2️⃣ ¿Qué vulnerabilidades de gobernanza (supervisión humana) detectaste gracias al motor?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q2} onChange={(e) => setFormData({ ...formData, reflexion: { ...formData.reflexion, q2: e.target.value } })} />
                        </div>
                        <div className="asegurar-upgrade-input">
                            <label>3️⃣ ¿De qué manera el prompt asegurado garantiza una evaluación más equitativa?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q3} onChange={(e) => setFormData({ ...formData, reflexion: { ...formData.reflexion, q3: e.target.value } })} />
                        </div>
                        <div className="asegurar-upgrade-input">
                            <label>4️⃣ ¿Qué procesos cognitivos profundos recupera el estudiante con este nuevo diseño?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q4} onChange={(e) => setFormData({ ...formData, reflexion: { ...formData.reflexion, q4: e.target.value } })} />
                        </div>
                    </div>
                </section>

                {/* ───────── PASO 8: DECLARACIÓN + PACTO DE DATOS ───────── */}
                <section className="asegurar-upgrade-section gold-card">
                    <div className="asegurar-upgrade-badge">Paso 8</div>
                    <h3 className="asegurar-upgrade-title">Declaración de estándar profesional docente</h3>
                    <p>{isReadOnly ? "Compromisos adquiridos:" : "Selecciona los principios éticos que regirán esta práctica académica:"}</p>
                    <div className="asegurar-upgrade-checklist">
                        {[
                            "No delegaré el juicio sumativo ni la calificación final a sistemas automatizados.",
                            "Garantizaré siempre la transparencia sobre el uso de IA en los procesos de aprendizaje.",
                            "Inyectaré rúbricas y criterios de equidad para mitigar sesgos algorítmicos.",
                            "Diseñaré actividades que prioricen el esfuerzo cognitivo humano sobre la sustitución técnica."
                        ].map(std => (
                            <label key={std} className="asegurar-upgrade-check-row">
                                <input
                                    type="checkbox"
                                    disabled={isReadOnly}
                                    checked={formData.estandares.includes(std)}
                                    onChange={(e) => {
                                        const items = e.target.checked ? [...formData.estandares, std] : formData.estandares.filter(i => i !== std);
                                        setFormData({ ...formData, estandares: items });
                                    }}
                                />
                                <span>{std}</span>
                            </label>
                        ))}
                    </div>

                    {/* PACTO DE DATOS RESPONSABLES — compromiso explícito anti datos sensibles */}
                    <div style={{ marginTop: '20px', background: '#fffdf7', border: '2px solid #c5a059', borderRadius: '12px', padding: '18px' }}>
                        <h4 style={{ margin: '0 0 8px', color: '#8a6d1f' }}>🔒 Pacto de Datos Responsables</h4>
                        <p style={{ fontSize: '0.86rem', color: '#57534e', margin: '0 0 12px' }}>
                            Este es el compromiso central de la fase: proteger a tus estudiantes. Al firmarlo declaras que:
                        </p>
                        <ul style={{ fontSize: '0.84rem', color: '#44403c', margin: '0 0 14px', paddingLeft: '20px', lineHeight: 1.6 }}>
                            <li>Nunca introduciré nombres, documentos, diagnósticos ni datos de contacto reales de un menor en una IA externa.</li>
                            <li>Anonimizaré con etiquetas genéricas ([ESTUDIANTE], [GRUPO]) antes de cualquier consulta.</li>
                            <li>No segmentaré ni evaluaré a estudiantes por estrato, origen, género u otro rasgo personal.</li>
                            <li>Aplicaré la minimización de datos: solo lo estrictamente necesario para la tarea.</li>
                        </ul>
                        <label className="asegurar-upgrade-check-row" style={{ fontWeight: 700 }}>
                            <input
                                type="checkbox"
                                disabled={isReadOnly}
                                checked={formData.compromisoDatos}
                                onChange={(e) => setFormData({ ...formData, compromisoDatos: e.target.checked })}
                            />
                            <span>Firmo el Pacto de Datos Responsables y me comprometo a cumplirlo.</span>
                        </label>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default TallerMejoraAsegurar;
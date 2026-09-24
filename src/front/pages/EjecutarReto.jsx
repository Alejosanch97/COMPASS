import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import "../Styles/ejecutarReto.css";

// ═══════════ CONFIGURACIÓN DEL RECORRIDO DOSIFICADO ═══════════
const TIPOS_SIN_RESPUESTA = ["SECUENCIA_DEEPEN", "ANALISIS_INCLUSIVO_CREATE", "DASHBOARD_DIRECTIVO_R3"];
// Tipos "protagonistas": ocupan una estación completa para ellos solos
// Solo los ejercicios interactivos grandes tienen estación propia
const TIPOS_PROTAGONISTAS = ["SECUENCIA_DEEPEN", "MATRIZ_UNESCO", "ANALISIS_INCLUSIVO_CREATE", "DASHBOARD_DIRECTIVO_R3"];

// Minutos aproximados por tipo de pregunta (para "unos X min")
const TIEMPO_POR_TIPO = { ABIERTA: 0.5, MULTIPLE: 0.7, SELECT: 0.7, SELECT_CON_TOOLTIP: 1.5, CHECKBOX: 1, PARRAFO: 3, SLIDER: 0.5, ORDEN: 1.5, SECUENCIA_DEEPEN: 4, MATRIZ_UNESCO: 5, ANALISIS_INCLUSIVO_CREATE: 2, DASHBOARD_DIRECTIVO_R3: 2 };

const FASES_RECORRIDO = [
    { id: "descubre", label: "Descubre", flex: 1 },
    { id: "disena", label: "Diseña", flex: 3 },
    { id: "cierra", label: "Cierra", flex: 0.8 },
];
const CAMPOS_SECUENCIA = ["inicioIA", "inicioDocente", "inicioEstudiante", "desarrolloIA", "desarrolloDocente", "desarrolloEstudiante", "cierreSinIA", "cierreReflexion", "cierreIA"];
const SECUENCIA_VACIA = CAMPOS_SECUENCIA.reduce((acc, c) => ({ ...acc, [c]: null }), {});

// Si la pregunta con clave "si" contiene alguna opción que empiece por "contiene",
// se ocultan todas las preguntas con clave "ocultar".
const REGLAS_RAMIFICACION = [
    { si: "modalidad_uso", contiene: ["solo yo"], ocultar: "requiere_uso_estudiantes" },
    { si: "riesgos_identificados", contiene: ["no identifico", "ninguno"], ocultar: "requiere_riesgo" },
];

const MICROCOPY = [
    "Empecemos por tu punto de partida",
    "Cada respuesta es una decisión pedagógica",
    "Aquí la IA se pone al servicio de tus estudiantes",
    "Tu criterio profesional es el protagonista",
    "Estás construyendo evidencia real de tu práctica",
    "Mira todo lo que ya has avanzado",
];

// ── Iconos de línea (reemplazan los emojis) ──
const TRAZOS = {
    guardar: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></>,
    atras: <><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></>,
    adelante: <><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></>,
    check: <path d="M20 6L9 17l-5-5" />,
    mas: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    docente: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    estudiantes: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    ia: <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2" /></>,
    balanza: <><path d="M12 3v18M7 21h10M4 7h16" /><path d="M7 7l-3 7a3 3 0 0 0 6 0z" /><path d="M17 7l-3 7a3 3 0 0 0 6 0z" /></>,
    bombillo: <><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /></>,
    mundo: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
    inicio: <><path d="M12 2v6M4.9 10.9l1.4 1.4M2 18h2M20 18h2M17.7 12.3l1.4-1.4M22 22H2M16 18a4 4 0 0 0-8 0" /></>,
    actividad: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    cierre: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></>,
    candado: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    ojo: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    alerta: <><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>,
    power: <><path d="M18.4 6.6a9 9 0 1 1-12.8 0" /><path d="M12 2v10" /></>,
    lupa: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
    reloj: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    destello: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />,
    lapiz: <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />,
};

const Icono = ({ nombre, size = 18, className = "" }) => (
    <svg className={`atlas-icon ${className}`} width={size} height={size} viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {TRAZOS[nombre]}
    </svg>
);

const MOMENTOS_SECUENCIA = [
    {
        titulo: "INICIO · Preparar y abrir la clase", icono: "inicio", preguntas: [
            { campo: "inicioIA", label: "¿Usaste IA para preparar o abrir la clase?", ayuda: "Ej: crear ejemplos, imágenes o una pregunta detonante." },
            { campo: "inicioDocente", label: "¿Tú guías la apertura de la clase?", ayuda: "Presentas el propósito y activas saberes previos." },
            { campo: "inicioEstudiante", label: "¿Tus estudiantes piensan primero por su cuenta?", ayuda: "Antes de ver cualquier respuesta de la IA." },
        ]
    },
    {
        titulo: "DESARROLLO · La actividad central", icono: "actividad", preguntas: [
            { campo: "desarrolloIA", label: "¿Se usa IA durante la actividad?", ayuda: "La usas tú en vivo o la usan tus estudiantes." },
            { campo: "desarrolloDocente", label: "¿Acompañas y retroalimentas mientras trabajan?", ayuda: "Circulas, preguntas, validas lo que produce la IA." },
            { campo: "desarrolloEstudiante", label: "¿Tus estudiantes producen con sus propias ideas?", ayuda: "Escriben, resuelven, argumentan o crean ellos mismos." },
        ]
    },
    {
        titulo: "CIERRE · Demostrar y reflexionar", icono: "cierre", preguntas: [
            { campo: "cierreSinIA", label: "¿Demuestran lo aprendido sin ayuda de la IA?", ayuda: "Ej: explican en voz alta, resuelven un ejercicio, exponen." },
            { campo: "cierreReflexion", label: "¿Reflexionan sobre cómo aprendieron?", ayuda: "Ej: ¿qué me aportó la IA?, ¿qué hice yo?" },
            { campo: "cierreIA", label: "¿Usas IA en el cierre?", ayuda: "Ej: para retroalimentar o sintetizar." },
        ]
    },
];

// Anclas humanas: lo que da el índice human-centred (la IA en sí no resta)
const ANCLAS_HUMANAS = [
    { campo: "inicioDocente", puntos: 10, tip: "Guía tú la apertura: presenta el propósito y activa saberes previos antes de usar IA." },
    { campo: "inicioEstudiante", puntos: 10, tip: "Da un momento para que tus estudiantes piensen por su cuenta antes de ver respuestas de la IA." },
    { campo: "desarrolloDocente", puntos: 15, tip: "Acompaña y retroalimenta mientras trabajan: tu mirada valida lo que produce la IA." },
    { campo: "desarrolloEstudiante", puntos: 20, tip: "Asegura que tus estudiantes produzcan con sus propias ideas (escribir, resolver, argumentar)." },
    { campo: "cierreSinIA", puntos: 20, tip: "Incluye un cierre donde demuestren lo aprendido sin IA (explicar, exponer, resolver)." },
    { campo: "cierreReflexion", puntos: 15, tip: "Invita a reflexionar: ¿qué me aportó la IA?, ¿qué hice yo?" },
];

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

    // ── Recorrido dosificado + protección de cambios ──
    const [pasoActual, setPasoActual] = useState(0);
    const [visitados, setVisitados] = useState(new Set([0]));
    const [dirty, setDirty] = useState(false);
    const [ultimoGuardado, setUltimoGuardado] = useState(null);
    const hidratado = useRef(false);
    const versionCambios = useRef(0);
    const celebrados = useRef(new Set());
    const inicioRef = useRef(null);
    const [aviso, setAviso] = useState(null);
    const avisoTimer = useRef(null);
    useEffect(() => () => clearTimeout(avisoTimer.current), []);
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
        const faltanPorResponder = CAMPOS_SECUENCIA.filter(c => !seq[c]).length;
        const base = { completo: faltanPorResponder === 0, faltanPorResponder, faltantes: [], indice: 0 };
        if (!base.completo) return base;

        const usaIA = [seq.inicioIA, seq.desarrolloIA, seq.cierreIA].includes('Sí');
        if (!usaIA) {
            return {
                ...base, color: "#64748b", titulo: "⚪ Aún no hay IA en esta práctica",
                resultado: "Según tus respuestas, la IA no interviene en ningún momento de la clase, así que todavía no podemos analizar cómo se integra.",
                recomendacion: "Si usaste IA para preparar material o ejemplos, marca «Sí» en el inicio: planear con IA también cuenta."
            };
        }

        let indice = 10; // intención de integrar IA
        const faltantes = [];
        ANCLAS_HUMANAS.forEach(a => {
            if (seq[a.campo] === 'Sí') indice += a.puntos;
            else faltantes.push(a.tip);
        });
        const iaEnTodo = [seq.inicioIA, seq.desarrolloIA, seq.cierreIA].every(v => v === 'Sí');
        if (iaEnTodo && seq.cierreSinIA !== 'Sí') indice -= 15;
        indice = Math.max(0, Math.min(100, indice));
        const r = { ...base, indice, faltantes };

        if (indice >= 85) return { ...r, color: "#16a34a", titulo: "🟢 Integración Human-Centred Sólida", resultado: "Tu práctica muestra un equilibrio robusto entre IA, mediación docente y autonomía estudiantil. La IA potencia procesos concretos sin sustituir el juicio humano ni el pensamiento crítico.", recomendacion: "Sigue haciendo explícitos los criterios de uso de IA y compara con tus estudiantes lo que producen ellos y lo que produce la IA. Tu diseño es coherente con el nivel DEEPEN del marco UNESCO 2024." };
        if (indice >= 65) return { ...r, color: "#2563eb", titulo: "🔵 Uso Estratégico Consolidado", resultado: "La IA está integrada con intención y predomina la agencia humana. Hay mediación docente clara y espacios que reducen el riesgo de dependencia.", recomendacion: "Fortalece los puntos de abajo para llegar a un modelo plenamente human-centred." };
        if (indice >= 45) return { ...r, color: "#eab308", titulo: "🟡 Integración Funcional en Construcción", resultado: "La IA cumple un rol relevante, pero el equilibrio aún no es estable: algunos momentos podrían favorecer la dependencia si no se explicita la reflexión.", recomendacion: "Agrega al menos un momento sin IA y una pregunta de reflexión: son los cambios de mayor impacto." };
        if (indice >= 25) return { ...r, color: "#f97316", titulo: "🟠 Dependencia Parcial en Desarrollo", resultado: "La IA empieza a tomar decisiones cognitivas clave sin suficiente validación de tus estudiantes ni mediación tuya.", recomendacion: "Rediseña el cierre con una demostración sin IA y dale más espacio a la producción propia de tus estudiantes." };
        return { ...r, color: "#dc2626", titulo: "🔴 Alta Dependencia Estructural", resultado: "La IA organiza la mayor parte de la clase y hay pocas evidencias de autonomía o supervisión pedagógica.", recomendacion: "Incorpora momentos sin IA, reflexión metacognitiva explícita y mayor intervención docente." };
    };

    useEffect(() => {
        hidratado.current = false;
        setDirty(false);
        setRespuestas({});
        setSecuenciaDeepen(SECUENCIA_VACIA);
        setPuntosMatriz({ transparency: 0, privacy: 0, bias: 0, agency: 0, supervision: 0 });
        setCumplimiento([]);
        setPasoActual(0);
        setVisitados(new Set([0]));
        celebrados.current = new Set();
        fetchRetoData();
        window.scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [retoId]);


    const fetchRetoData = async () => {
        setLoading(true);
        try {
            // Ejecutamos las promesas base en paralelo
            const promesas = [
                apiFetch(`/api/mi-empresa/retos?fase=TRANSFORMAR`).catch(() => []),
                apiFetch(`/api/retos-transformar/${retoId}`).catch(() => null),
            ];

            // Si es DIRECTIVO, empujamos la tercera petición al pool para que corra al mismo tiempo
            if (userData.rol === "DIRECTIVO") {
                promesas.push(apiFetch(`/api/empresa/retos-transformar`).catch(() => []));
            }

            const resultados = await Promise.all(promesas);
            const retosAsignados = resultados[0];
            const avance = resultados[1];

            if (userData.rol === "DIRECTIVO") {
                const todosLosRetos = resultados[2];
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
            let nuevo;
            if (actual.includes(value)) nuevo = actual.filter(v => v !== value);
            else if (esOpcionExclusiva(value)) nuevo = [value];
            else nuevo = [...actual.filter(v => !esOpcionExclusiva(v)), value];
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

    // ═══════════ MOTOR: ramificación, estaciones y progreso ═══════════
    const esOpcionExclusiva = (v) => /^(ningun|no identific|no se aplic|no lo he)/i.test(cleanOptionText(v));

    const tieneValor = (idx) => {
        const v = respuestas[idx];
        return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
    };

    const valorPorClave = (clave) => {
        const i = preguntas.findIndex(pr => pr.clave_analisis === clave);
        return i !== -1 ? respuestas[i] : undefined;
    };

    // Preguntas ocultas según lo que respondió el docente
    const ocultas = new Set();
    REGLAS_RAMIFICACION.forEach(regla => {
        const valor = valorPorClave(regla.si);
        const valores = (Array.isArray(valor) ? valor : [valor]).filter(Boolean).map(v => cleanOptionText(v).toLowerCase());
        if (valores.some(v => regla.contiene.some(c => v.startsWith(c)))) {
            preguntas.forEach((pr, i) => { if (pr.clave_analisis === regla.ocultar) ocultas.add(i); });
        }
    });

    // Pasos: Descubre (contexto, misión, preparación) → Diseña (estaciones) → Cierra
    const pasos = [];
    const pasoDePregunta = {};
    if (reto) {
        pasos.push({ id: 'contexto', titulo: 'Contexto', fase: 'descubre' });
        pasos.push({ id: 'mision', titulo: 'Tu misión', fase: 'descubre' });
        if (reto.lectura_previa?.activa) pasos.push({ id: 'preparacion', titulo: 'Antes de empezar', fase: 'descubre' });

        // 1) Tramos: corridas de preguntas normales separadas por ejercicios grandes
        const tramos = [];
        let corrida = [];
        preguntas.forEach((p, idx) => {
            if (TIPOS_PROTAGONISTAS.includes(p.tipo_respuesta)) {
                if (corrida.length) tramos.push({ tipo: 'normal', indices: corrida });
                corrida = [];
                tramos.push({ tipo: 'protagonista', indices: [idx] });
            } else corrida.push(idx);
        });
        if (corrida.length) tramos.push({ tipo: 'normal', indices: corrida });

        // 2) Agrupar sin dejar estaciones de una sola pregunta
        const grupos = [];
        tramos.forEach((t, k) => {
            if (t.tipo === 'protagonista') { grupos.push([...t.indices]); return; }
            if (t.indices.length === 1) {
                if (tramos[k - 1]?.tipo === 'protagonista') { grupos[grupos.length - 1].push(...t.indices); return; }
                if (tramos[k + 1]?.tipo === 'protagonista') { tramos[k + 1].indices = [...t.indices, ...tramos[k + 1].indices]; return; }
            }
            // Reparto balanceado: 11 → 3+3+3+2, 4 → 2+2, 13 → 3+3+3+2+2
            const n = t.indices.length;
            const numGrupos = Math.ceil(n / 3);
            const base = Math.floor(n / numGrupos);
            let resto = n % numGrupos;
            let cursor = 0;
            for (let g = 0; g < numGrupos; g++) {
                const tam = base + (resto > 0 ? 1 : 0);
                resto--;
                grupos.push(t.indices.slice(cursor, cursor + tam));
                cursor += tam;
            }
        });

        grupos.forEach((indices, g) => {
            pasos.push({ id: `estacion_${g + 1}`, titulo: `Estación ${g + 1}`, numEstacion: g + 1, indices, fase: 'disena' });
            indices.forEach(i => { pasoDePregunta[i] = pasos.length - 1; });
        });
        pasos.push({ id: 'cierre', titulo: 'Cierre', fase: 'cierra' });
    }
    const totalEstaciones = pasos.filter(p => p.indices).length;
    const pasoInfo = pasos[pasoActual] || {};
    const pasoId = pasoInfo.id;

    // Cabecera de la estación actual
    const indicesVisiblesPaso = (pasoInfo.indices || []).filter(i => !ocultas.has(i));
    const preguntasVisiblesPaso = indicesVisiblesPaso.length;
    const minutosEstacion = Math.max(1, Math.round(indicesVisiblesPaso.reduce((acc, i) => acc + (TIEMPO_POR_TIPO[preguntas[i].tipo_respuesta] ?? 1), 0)));
    const protagonistaPaso = indicesVisiblesPaso.find(i => TIPOS_PROTAGONISTAS.includes(preguntas[i].tipo_respuesta));
    const tituloEstacion = !pasoInfo.indices ? ""
        : protagonistaPaso !== undefined ? preguntas[protagonistaPaso].texto_pregunta
            : pasoInfo.numEstacion === totalEstaciones ? "Último tramo: ya casi completas tu misión"
                : MICROCOPY[(pasoInfo.numEstacion - 1) % MICROCOPY.length];

    const siguientePaso = pasos[pasoActual + 1];
    const textoSiguiente = pasoId === 'contexto' ? "Ver mi misión"
        : pasoId === 'mision' ? (reto?.lectura_previa?.activa ? "Ver recomendaciones" : "Empezar")
            : pasoId === 'preparacion' ? "Empezar"
                : siguientePaso?.id === 'cierre' ? "Ir al cierre"
                    : "Siguiente estación";

    // Estado de cada tramo de la barra de progreso
    const estadoFase = (faseId) => {
        const idxs = pasos.map((p, i) => (p.fase === faseId ? i : -1)).filter(i => i >= 0);
        if (!idxs.length) return { primerPaso: -1 };
        const activa = pasoInfo.fase === faseId;
        let pct = 0;
        let detalle = "";
        if (faseId === 'descubre') {
            pct = Math.round((idxs.filter(i => visitados.has(i)).length / idxs.length) * 100);
            if (activa) detalle = pasoInfo.titulo;
        } else if (faseId === 'disena') {
            pct = pctProgreso;
            if (activa) detalle = `Estación ${pasoInfo.numEstacion} de ${totalEstaciones}`;
        } else {
            pct = statusActual === 'COMPLETADO' ? 100 : activa ? 50 : 0;
            if (activa) detalle = "Autoevaluación";
        }
        const primerPaso = faseId === 'disena' && primerPasoPendiente >= 0 ? primerPasoPendiente : idxs[0];
        return { pct, activa, detalle, primerPaso };
    };

    const preguntaCompleta = (idx) => {
        const t = preguntas[idx]?.tipo_respuesta;
        if (t === "SECUENCIA_DEEPEN") return CAMPOS_SECUENCIA.every(c => secuenciaDeepen[c]);
        if (TIPOS_SIN_RESPUESTA.includes(t)) return true;
        return tieneValor(idx);
    };
    const indicesProgreso = preguntas.map((_, i) => i).filter(i =>
        !ocultas.has(i) && (preguntas[i].tipo_respuesta === "SECUENCIA_DEEPEN" || !TIPOS_SIN_RESPUESTA.includes(preguntas[i].tipo_respuesta))
    );
    const respondidasProgreso = indicesProgreso.filter(preguntaCompleta).length;
    const pctProgreso = indicesProgreso.length ? Math.round((respondidasProgreso / indicesProgreso.length) * 100) : 0;
    const pendientesGlobales = indicesProgreso.filter(i => !preguntaCompleta(i));

    const pasoCompleto = (i) => {
        const paso = pasos[i];
        if (!paso) return false;
        if (paso.indices) return paso.indices.filter(idx => !ocultas.has(idx)).every(preguntaCompleta);
        if (paso.id === 'cierre') return statusActual === 'COMPLETADO';
        return visitados.has(i) && i !== pasoActual;
    };
    const primerPasoPendiente = pasos.findIndex(p => p.indices && p.indices.some(idx => !ocultas.has(idx) && !preguntaCompleta(idx)));

    const numeroVisible = {};
    let contadorVisible = 0;
    preguntas.forEach((_, i) => { if (!ocultas.has(i)) numeroVisible[i] = ++contadorVisible; });

    const mostrarAviso = (titulo) => {
        clearTimeout(avisoTimer.current);
        setAviso({ id: Date.now(), titulo, detalle: `Llevas ${pctProgreso}% de tu misión` });
        avisoTimer.current = setTimeout(() => setAviso(null), 2400);
    };

    const irAPaso = (destino) => {
        const i = Math.max(0, Math.min(pasos.length - 1, destino));
        if (i > pasoActual && pasoInfo.indices && pasoCompleto(pasoActual) && !celebrados.current.has(pasoActual)) {
            celebrados.current.add(pasoActual);
            mostrarAviso(pasoInfo.titulo);
        }
        setVisitados(prev => new Set(prev).add(i));
        setPasoActual(i);
    };

    // Subir al inicio del reto cada vez que cambia el paso
    // (funciona aunque el scroll esté en el panel del dashboard y no en la ventana)
    useEffect(() => {
        const el = inicioRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }, [pasoActual]);

    // Campo libre cuando se elige "Otro"
    const renderCampoOtro = (idx) => {
        const v = respuestas[idx];
        const arr = Array.isArray(v) ? v : [v];
        if (!arr.some(x => typeof x === "string" && cleanOptionText(x).toLowerCase().startsWith("otro"))) return null;
        return (
            <label className="atlas-otro-field">
                <span><Icono nombre="lapiz" size={15} /> ¿Cuál? Escríbelo aquí</span>
                <input
                    type="text"
                    autoFocus
                    value={respuestas[`${idx}_otro`] || ""}
                    onChange={(e) => handleInputChange(`${idx}_otro`, e.target.value)}
                    placeholder="Por ejemplo, una herramienta que usa tu colegio"
                />
            </label>
        );
    };

    // Sugerencias de monitoreo construidas con las respuestas anteriores
    const generarAlertasMonitoreo = () => {
        const alertas = [];
        const sec = calcularPatronUNESCO(secuenciaDeepen);
        if (sec.completo) sec.faltantes.slice(0, 2).forEach(t => alertas.push({ icono: 'actividad', texto: t }));
        const esfuerzo = cleanOptionText(valorPorClave("esfuerzo_cognitivo") || "").toLowerCase();
        if (esfuerzo.startsWith("se reduce")) alertas.push({ icono: 'bombillo', texto: "Observar qué parte del pensamiento está haciendo la IA por mis estudiantes y devolverles ese paso." });
        if (esfuerzo.startsWith("no sabe")) alertas.push({ icono: 'ojo', texto: "Observar a 2 o 3 estudiantes y comparar su esfuerzo con una clase sin IA." });
        const retiro = cleanOptionText(valorPorClave("prueba_retiro") || "").toLowerCase();
        if (retiro.startsWith("disminuye") || retiro.startsWith("desaparece")) alertas.push({ icono: 'power', texto: "Verificar si mis estudiantes logran el objetivo sin la IA y, si no, ajustar el andamiaje." });
        if (retiro.startsWith("no lo he")) alertas.push({ icono: 'power', texto: "Probar una actividad corta sin IA para confirmar que el aprendizaje se sostiene." });
        const riesgos = valorPorClave("riesgos_identificados");
        (Array.isArray(riesgos) ? riesgos : []).filter(r => !esOpcionExclusiva(r)).forEach(r =>
            alertas.push({ icono: 'alerta', texto: `Vigilar señales de ${cleanOptionText(r).toLowerCase()} en el trabajo de mis estudiantes.` })
        );
        return alertas;
    };

    // Detectar cambios sin guardar (ignorando la carga inicial)
    useEffect(() => {
        if (!hidratado.current) return;
        versionCambios.current += 1;
        setDirty(true);
    }, [respuestas, secuenciaDeepen, puntosMatriz, cumplimiento]);

    useEffect(() => {
        if (loading) return;
        const t = setTimeout(() => { hidratado.current = true; }, 0);
        return () => clearTimeout(t);
    }, [loading]);

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

    const saveReto = async (statusFinal = 'COMPLETADO', opts = {}) => {
        const { silencioso = false } = opts;
        const preguntasArray = reto?.config_json?.preguntas || [];
        const evaluables = preguntasArray.map((_, i) => i).filter(i =>
            !TIPOS_SIN_RESPUESTA.includes(preguntasArray[i].tipo_respuesta) && !ocultas.has(i)
        );
        const totalPreguntas = evaluables.length;
        const respondidas = evaluables.filter(tieneValor).length;

        if (statusFinal === 'COMPLETADO' && respondidas < totalPreguntas) {
            const confirmacion = await Swal.fire({
                title: "Misión incompleta",
                text: `Has respondido ${respondidas} de ${totalPreguntas} preguntas. ¿Qué quieres hacer?`,
                icon: "warning",
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: "Guardar borrador",
                denyButtonText: "Ir a lo pendiente",
                cancelButtonText: "Seguir aquí",
                confirmButtonColor: "#c5a059",
                denyButtonColor: "#0f172a",
            });
            if (confirmacion.isDenied) {
                const primera = evaluables.find(i => !tieneValor(i));
                if (primera !== undefined) irAPaso(pasoDePregunta[primera]);
                return false;
            }
            if (!confirmacion.isConfirmed) return false;
            statusFinal = 'BORRADOR';
        }

        // Guardar un borrador nunca "des-envía" una misión ya completada
        const statusEnviar = (statusFinal === 'BORRADOR' && statusActual === 'COMPLETADO') ? 'COMPLETADO' : statusFinal;
        const versionAlGuardar = versionCambios.current;

        setIsSaving(true);
        try {
            const puntajeTotal = calcularPuntajeTotal();
            const respuestasPorClave = {};
            preguntasArray.forEach((p, idx) => {
                if (p.clave_analisis && !p.clave_analisis.startsWith('requiere_')) {
                    respuestasPorClave[p.clave_analisis] = respuestas[idx];
                }
            });
            const patronSec = calcularPatronUNESCO(secuenciaDeepen);

            const payload = {
                reto_plantilla_id: reto.id,
                numero_reto: reto.numero_reto ?? reto.numero_orden ?? 1,
                nombre_reto: reto.nombre_reto || reto.nombre,
                nivel_unesco: reto.nivel_unesco,
                datos_json: {
                    respuestas, respuestas_por_clave: respuestasPorClave, puntaje_total: puntajeTotal,
                    cumplimiento, puntosMatriz, secuenciaDeepen,
                    patron_secuencia: patronSec.completo ? { titulo: patronSec.titulo, indice: patronSec.indice } : null,
                    preguntas_ocultas: [...ocultas],
                },
                status_reto: statusEnviar,
            };

            await apiFetch("/api/retos-transformar", { method: "POST", body: JSON.stringify(payload) });

            setStatusActual(statusEnviar);
            if (versionCambios.current === versionAlGuardar) setDirty(false);
            setUltimoGuardado(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));

            if (statusFinal === 'COMPLETADO') {
                setDirty(false);
                await Swal.fire({
                    title: "Misión enviada",
                    text: "Tu evidencia quedó registrada. Cada decisión que tomaste hoy protege el aprendizaje de tus estudiantes.",
                    icon: "success",
                    iconColor: "#c5a059",
                    showConfirmButton: false,
                    timer: 2200,
                    timerProgressBar: true,
                });
                onNavigate('fase_transformar', { retoCompletadoId: reto.id });
            } else if (!silencioso) {
                Swal.fire({ title: "Borrador Guardado", icon: "success", confirmButtonColor: "#c5a059", timer: 1500, showConfirmButton: false });
            }
            return true;
        } catch (e) {
            console.error(e);
            if (!silencioso) Swal.fire("Error", "No se pudo guardar tu progreso. Inténtalo de nuevo.", "error");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleVolver = async () => {
        if (!dirty) return onNavigate('fase_transformar');
        const r = await Swal.fire({
            title: "Tienes cambios sin guardar",
            text: "Si sales ahora, perderás lo que escribiste desde tu último guardado.",
            icon: "warning",
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: "Guardar y salir",
            denyButtonText: "Salir sin guardar",
            cancelButtonText: "Seguir aquí",
            confirmButtonColor: "#c5a059",
            denyButtonColor: "#64748b",
        });
        if (r.isConfirmed) {
            const ok = await saveReto('BORRADOR', { silencioso: true });
            if (ok) onNavigate('fase_transformar');
        } else if (r.isDenied) {
            onNavigate('fase_transformar');
        }
    };

    // Autoguardado silencioso 45 s después del último cambio
    useEffect(() => {
        if (!dirty || !reto || isSaving) return;
        const t = setTimeout(() => { saveReto('BORRADOR', { silencioso: true }); }, 45000);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dirty, respuestas, secuenciaDeepen, puntosMatriz, cumplimiento]);

    // Aviso del navegador al cerrar o recargar con cambios pendientes
    useEffect(() => {
        const aviso = (e) => { if (!dirty) return; e.preventDefault(); e.returnValue = ""; };
        window.addEventListener("beforeunload", aviso);
        return () => window.removeEventListener("beforeunload", aviso);
    }, [dirty]);

    if (loading) {
        return (
            <div className="atlas-unique-page-wrapper">
                <div className="narrative-hero-section" style={{ opacity: 0.4 }}>
                    <div style={{ height: '28px', width: '60%', background: '#e2e8f0', borderRadius: '8px', marginBottom: '12px' }} />
                    <div style={{ height: '16px', width: '40%', background: '#e2e8f0', borderRadius: '8px' }} />
                </div>
                <div className="form-card" style={{ marginTop: '20px' }}>
                    {[1, 2, 3].map(i => (<div key={i} style={{ marginBottom: '24px' }}>
                        <div style={{ height: '14px', width: '30%', background: '#e2e8f0', borderRadius: '6px', marginBottom: '10px' }} />
                        <div style={{ height: '44px', width: '100%', background: '#f1f5f9', borderRadius: '10px' }} />
                    </div>
                    ))}            </div>
                <style>{`
                @keyframes shimmer {
                    0% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.4; }
                }
                .atlas-unique-page-wrapper > * { animation: shimmer 1.2s ease infinite; }
            `}</style>
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
            <main className="atlas-unique-main-content" ref={inicioRef}>

                {aviso && (
                    <div className="atlas-toast" key={aviso.id} role="status" aria-live="polite">
                        <span className="atlas-toast-check"><Icono nombre="check" size={16} /></span>
                        <div className="atlas-toast-text">
                            <strong>{aviso.titulo} completada</strong>
                            <span>{aviso.detalle}</span>
                        </div>
                        <span className="atlas-toast-bar" />
                    </div>
                )}

                {/* CABECERA + RECORRIDO (no fija) */}
                <div className="atlas-unique-header-container atlas-header-card">
                    <header className="atlas-header-row">
                        <div className="header-left">
                            <button className="btn-back-minimal" onClick={handleVolver}>
                                <Icono nombre="atras" size={16} /> Volver
                            </button>
                            <div className="badge-reto-id">Misión {reto.numero_reto ?? reto.numero_orden ?? ""}</div>
                        </div>
                        <div className="atlas-unique-title-box">
                            <h2>{reto.nombre_reto || reto.nombre}</h2>
                            <div className={`atlas-save-state ${dirty ? 'pendiente' : ultimoGuardado ? 'ok' : ''}`}>
                                {dirty ? "Cambios sin guardar" : ultimoGuardado ? `Guardado a las ${ultimoGuardado}` : "Tu avance se guarda automáticamente"}
                            </div>
                        </div>
                        <button className="btn-save-draft-premium atlas-btn-icon" onClick={() => saveReto('BORRADOR')} disabled={isSaving}>
                            <Icono nombre="guardar" size={17} /> {isSaving ? "Guardando…" : "Guardar"}
                        </button>
                    </header>

                    <nav className="atlas-journey" aria-label="Progreso de la misión">
                        {FASES_RECORRIDO.map((f, n) => {
                            const e = estadoFase(f.id);
                            if (e.primerPaso < 0) return null;
                            return (
                                <button
                                    key={f.id}
                                    type="button"
                                    className={`atlas-phase ${e.activa ? 'is-active' : ''} ${e.pct >= 100 ? 'is-done' : ''}`}
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
                            <strong>{pctProgreso}%</strong>
                            <span>{respondidasProgreso} de {indicesProgreso.length} respuestas</span>
                        </div>
                    </nav>
                </div>

                {/* SECCIÓN NARRATIVA DOSIFICADA — un paso a la vez */}
                {['contexto', 'mision', 'preparacion'].includes(pasoId) && (
                    <div className="atlas-unique-section-narrative atlas-step-anim" key={pasoId}>
                        <div className="atlas-step-intro">

                            <h3>
                                {pasoId === 'contexto' && "Antes de diseñar, entendamos el porqué"}
                                {pasoId === 'mision' && "Este es tu desafío"}
                                {pasoId === 'preparacion' && "Prepárate para vivir la misión en tu aula"}
                            </h3>
                        </div>

                        <section className="narrative-hero-section">
                            {pasoId === 'contexto' && (
                                <>
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
                                </>
                            )}

                            {pasoId === 'mision' && (
                                <>
                                    <div className="atlas-mission-hero">
                                        <div className="atlas-orbit" aria-hidden="true">
                                            <span className="atlas-orbit-core">
                                                <Icono nombre={reto.nivel_unesco === "ACQUIRE" ? "balanza" : reto.nivel_unesco === "DEEPEN" ? "bombillo" : "mundo"} size={40} />
                                            </span>
                                            <span className="atlas-orbit-sat s1"><Icono nombre="docente" size={20} /></span>
                                            <span className="atlas-orbit-sat s2"><Icono nombre="estudiantes" size={20} /></span>
                                            <span className="atlas-orbit-sat s3"><Icono nombre="ia" size={20} /></span>
                                        </div>
                                        <div className="atlas-mission-hero-text">
                                            <span className="reto-label">Nivel UNESCO · {reto.nivel_unesco || "—"}</span>
                                            <h4>Docente, estudiantes e IA en equilibrio</h4>
                                            <p>La IA gira alrededor de tu intención pedagógica, nunca al revés. En esta misión vas a demostrarlo con tu propia práctica.</p>
                                        </div>
                                    </div>
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
                                </>
                            )}

                            {pasoId === 'preparacion' && reto.lectura_previa?.activa && (
                                <div className="pre-mission-notice">
                                    <div className="notice-badge">LECTURA PREVIA</div>
                                    <h4>Antes de comenzar</h4>
                                    {reto.lectura_previa.intro_texto && <p>{reto.lectura_previa.intro_texto}</p>}
                                    {reto.lectura_previa.intro_destacado && (
                                        <p>Se espera que primero <strong>{reto.lectura_previa.intro_destacado}</strong>, y luego regreses a documentar tu rediseño con criterio profesional.</p>
                                    )}
                                    {(reto.lectura_previa.tiempo || reto.lectura_previa.proposito) && (
                                        <div className="notice-grid">
                                            {reto.lectura_previa.tiempo && (
                                                <div className="notice-item"><strong><Icono nombre="reloj" size={15} /> Tiempo</strong><span>{reto.lectura_previa.tiempo}</span></div>
                                            )}
                                            {reto.lectura_previa.proposito && (
                                                <div className="notice-item"><strong><Icono nombre="bombillo" size={15} /> Propósito</strong><span>{reto.lectura_previa.proposito}</span></div>
                                            )}
                                        </div>
                                    )}
                                    {reto.lectura_previa.puntos?.filter(p => p.trim()).length > 0 && (
                                        <ul className="notice-list">
                                            {reto.lectura_previa.puntos.filter(p => p.trim()).map((punto, i) => <li key={i}>{punto}</li>)}
                                        </ul>
                                    )}
                                    {reto.lectura_previa.nota_footer && (
                                        <div className="notice-footer"><span>{reto.lectura_previa.nota_footer}</span></div>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* FORMULARIO DINÁMICO — cada pregunta es un form-card normal (blanco), igual que el original */}
                <div className="atlas-unique-form-wrapper">
                    {pasoInfo.indices && (
                        <div className="atlas-station-head atlas-step-anim" key={pasoId}>
                            <div className="atlas-station-num" aria-label={`Estación ${pasoInfo.numEstacion} de ${totalEstaciones}`}>
                                <span>{String(pasoInfo.numEstacion).padStart(2, '0')}</span>
                                <small>de {String(totalEstaciones).padStart(2, '0')}</small>
                            </div>
                            <div className="atlas-station-text">
                                <h3>{tituloEstacion}</h3>
                                {preguntasVisiblesPaso > 0 && (
                                    <p>{preguntasVisiblesPaso === 1 ? "1 pregunta" : `${preguntasVisiblesPaso} preguntas`}, unos {minutosEstacion} min</p>
                                )}
                            </div>
                        </div>
                    )}
                    {pasoInfo.indices && preguntasVisiblesPaso === 0 && (
                        <section className="form-card atlas-empty-station">
                            <Icono nombre="destello" size={20} />
                            Según tus respuestas anteriores, esta estación no aplica. Continúa con la siguiente.
                        </section>
                    )}
                    {preguntas.length === 0 ? (
                        <section className="form-card">
                            <p style={{ color: "#94a3b8" }}>Esta misión todavía no tiene preguntas configuradas.</p>
                        </section>
                    ) : (
                        preguntas.map((p, idx) => (ocultas.has(idx) || pasoDePregunta[idx] !== pasoActual) ? null : (
                            <section key={idx} className={`form-card atlas-step-anim ${preguntaCompleta(idx) && !TIPOS_SIN_RESPUESTA.includes(p.tipo_respuesta) ? 'is-answered' : ''}`}>
                                <div className="form-section-title">{numeroVisible[idx]}. {p.texto_pregunta}</div>
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
                                        {renderCampoOtro(idx)}
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
                                        {renderCampoOtro(idx)}
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

                                {p.clave_analisis === "monitoreo_guiado" && (() => {
                                    const alertas = generarAlertasMonitoreo();
                                    const texto = respuestas[idx] || "";
                                    return (
                                        <div className="atlas-monitor-box">
                                            <strong><Icono nombre="lupa" size={16} /> Según tus respuestas, te sugerimos observar</strong>
                                            {alertas.length === 0 ? (
                                                <p>¡Tu diseño se ve equilibrado! Cuéntanos qué quieres seguir cuidando para mantenerlo así.</p>
                                            ) : (
                                                <div className="atlas-monitor-chips">
                                                    {alertas.map(a => {
                                                        const agregada = texto.includes(a.texto);
                                                        return (
                                                            <button
                                                                key={a.texto}
                                                                type="button"
                                                                disabled={agregada}
                                                                className={`atlas-monitor-chip ${agregada ? 'agregada' : ''}`}
                                                                onClick={() => handleInputChange(idx, `${texto.trim()}${texto.trim() ? "\n" : ""}• ${a.texto}`)}
                                                            >
                                                                <Icono nombre={a.icono} size={16} /> <span>{a.texto}</span> <em><Icono nombre={agregada ? "check" : "mas"} size={14} /></em>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <small>Toca una sugerencia para agregarla y luego complétala con tus palabras.</small>
                                        </div>
                                    );
                                })()}

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
                                    const patron = calcularPatronUNESCO(secuenciaDeepen);
                                    return (
                                        <div className="atlas-seq-wrapper">
                                            {MOMENTOS_SECUENCIA.map(m => (
                                                <div key={m.titulo} className="atlas-seq-moment">
                                                    <h5><Icono nombre={m.icono} size={17} /> {m.titulo}</h5>
                                                    <div className="atlas-seq-grid">
                                                        {m.preguntas.map(q => (
                                                            <div key={q.campo} className={`atlas-seq-item ${secuenciaDeepen[q.campo] ? 'respondida' : ''}`}>
                                                                <span className="atlas-seq-label">{q.label}</span>
                                                                <span className="atlas-seq-help">{q.ayuda}</span>
                                                                <div className="atlas-seq-binary">
                                                                    {['Sí', 'No'].map(opt => (
                                                                        <button
                                                                            key={opt}
                                                                            type="button"
                                                                            className={secuenciaDeepen[q.campo] === opt ? 'activo' : ''}
                                                                            onClick={() => setSecuenciaDeepen(prev => ({ ...prev, [q.campo]: opt }))}
                                                                        >{opt}</button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            {!patron.completo ? (
                                                <div className="atlas-seq-pending">
                                                    <Icono nombre="candado" size={16} /> Responde {patron.faltanPorResponder === 1 ? "la pregunta restante" : `las ${patron.faltanPorResponder} preguntas restantes`} para revelar el diagnóstico de tu práctica.
                                                </div>
                                            ) : (
                                                <div className="atlas-seq-result" style={{ borderColor: patron.color, background: `${patron.color}10` }}>
                                                    {patron.indice > 0 && (
                                                        <div className="atlas-balance">
                                                            <div className="atlas-balance-labels">
                                                                <span>Índice human-centred</span>
                                                                <strong style={{ color: patron.color }}>{patron.indice}%</strong>
                                                            </div>
                                                            <div className="atlas-balance-track">
                                                                <div className="atlas-balance-fill" style={{ width: `${patron.indice}%`, background: patron.color }} />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <h4 style={{ color: patron.color }}>{patron.titulo}</h4>
                                                    <p>{patron.resultado}</p>
                                                    {patron.faltantes.length > 0 && (
                                                        <div className="atlas-seq-tips">
                                                            <strong>Para fortalecer tu diseño:</strong>
                                                            <ul>{patron.faltantes.map(f => <li key={f}>{f}</li>)}</ul>
                                                        </div>
                                                    )}
                                                    <p className="atlas-seq-reco"><strong>Recomendación:</strong> {patron.recomendacion}</p>
                                                </div>
                                            )}
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
                                                            <strong>Alerta pedagógica:</strong> {tooltip.alerta}
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
                                    // Lee las respuestas por clave_analisis (robusto ante reordenamientos)
                                    const buscarPorClave = (clave) => {
                                        const i = preguntas.findIndex(pr => pr.clave_analisis === clave);
                                        return i !== -1 ? respuestas[i] : undefined;
                                    };
                                    const bloom = buscarPorClave("bloom") ?? respuestas[1] ?? "";
                                    const garantias = buscarPorClave("garantias_equidad") ?? respuestas[8] ?? [];
                                    const validacion = buscarPorClave("validacion_impacto") ?? respuestas[12] ?? [];
                                    const riesgos = buscarPorClave("riesgos_sistemicos") ?? respuestas[7] ?? [];

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
                                        titulo = "Diseño Inclusivo Estructural";
                                        mensaje = "Tu estrategia evidencia un diseño inclusivo mediado por IA con impacto estructural en equidad. Se mantiene un objetivo cognitivo de alta complejidad, se amplían oportunidades sin reducción de estándares y se activan garantías claras de rigor.\n\nAdemás, identificas riesgos sistémicos y defines mecanismos para comprobar impacto, lo cual está alineado con:\n• UNESCO AI Competency Framework for Teachers (CREATE, 2024)\n• Principios de Diseño Universal para el Aprendizaje (DUA)\n• Enfoque de equidad estructural (no segmentación)\n\nTu estrategia es potencialmente transferible a otros contextos.";
                                    }

                                    else if (esNivelAlto && numGarantias >= 4 && tieneComprobacion && !identificaRiesgoSistemico) {
                                        patron = 2;
                                        color = "#2563eb";
                                        titulo = "Inclusión Avanzada con Oportunidad de Mejora";
                                        mensaje = "Tu diseño mantiene rigor cognitivo y evidencia mecanismos claros de equidad y evaluación común. Para consolidarse plenamente en nivel CREATE, sería recomendable fortalecer la identificación de riesgos sistémicos (sesgo algorítmico, perfilamiento, dependencia diferencial), tal como sugieren:\n• UNESCO 2024 (dimensión ética avanzada)\n• Recomendación UNESCO 2021 sobre IA y derechos humanos\n\nLa innovación inclusiva requiere anticipar posibles efectos estructurales.";
                                    }

                                    else if ((esNivelAlto || esNivelMedio) && (numGarantias === 2 || numGarantias === 3) && tieneComprobacion) {
                                        patron = 3;
                                        color = "#eab308";
                                        titulo = "Inclusión Operativa en Desarrollo";
                                        mensaje = "Tu estrategia amplía oportunidades y mantiene cierta coherencia evaluativa. Sin embargo, las garantías estructurales aún no son suficientes para asegurar que la equidad sea sostenida y replicable.\n\nEl marco CREATE invita a pasar de ajustes puntuales a diseño estructural.\n\nSugerencia:\nFortalecer las garantías explícitas de estándar común y supervisión humana.";
                                    }

                                    else if (esNivelBajo && numGarantias <= 3) {
                                        patron = 4;
                                        color = "#f97316";
                                        titulo = "Estrategia con Riesgo de Reducción Cognitiva";
                                        mensaje = "Se observa intención inclusiva, pero el nivel de pensamiento trabajado podría no sostener la exigencia académica común.\n\nEl Diseño Universal para el Aprendizaje no implica simplificación del objetivo cognitivo, sino diversificación del acceso al mismo estándar.\n\nSegún UNESCO CREATE, la equidad no consiste en bajar la complejidad, sino en ampliar oportunidades para alcanzarla.\n\nRecomendación:\nRevisar el nivel cognitivo y explicitar cómo se mantiene la complejidad.";
                                    }

                                    else if (numGarantias >= 2 && !tieneComprobacion) {
                                        patron = 5;
                                        color = "#6366f1";
                                        titulo = "Inclusión Declarativa";
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
                                            const claves = datos.respuestas_por_clave || {};
                                            docentesUnicos.add(reg.usuario_id);

                                            const fortalecer = Array.isArray(claves.fortalecer_mision) ? claves.fortalecer_mision : null;
                                            const f1 = (reg.numero_reto === 1 ? fortalecer : null) || datos.fortalecerMision1 || (Array.isArray(resp[IDX.r1]) ? resp[IDX.r1] : null);
                                            const f2 = (reg.numero_reto === 2 ? fortalecer : null) || datos.fortalecerMision2 || (Array.isArray(resp[IDX.r2]) ? resp[IDX.r2] : null);
                                            const f3 = (reg.numero_reto === 3 ? fortalecer : null) || datos.fortalecerMision3 || (Array.isArray(resp[IDX.r3]) ? resp[IDX.r3] : null);
                                            if (f1) f1.forEach(t => conteoMisiones.r1[t] = (conteoMisiones.r1[t] || 0) + 1);
                                            if (f2) f2.forEach(t => conteoMisiones.r2[t] = (conteoMisiones.r2[t] || 0) + 1);
                                            if (f3) f3.forEach(t => conteoMisiones.r3[t] = (conteoMisiones.r3[t] || 0) + 1);

                                            if (reg.nivel_unesco === 'CREATE' || reg.numero_reto === 3) {
                                                conteoReto3++;
                                                const bloom = claves.bloom ?? resp[1];
                                                const garantias = Array.isArray(claves.garantias_equidad) ? claves.garantias_equidad : (Array.isArray(resp[8]) ? resp[8] : []);
                                                const validacion = Array.isArray(claves.validacion_impacto) ? claves.validacion_impacto : (Array.isArray(resp[12]) ? resp[12] : []);
                                                const riesgos = Array.isArray(claves.riesgos_sistemicos) ? claves.riesgos_sistemicos : (Array.isArray(resp[7]) ? resp[7] : []);
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

                {/* NAVEGACIÓN ENTRE PASOS */}
                {pasoId !== 'cierre' && (
                    <div className="atlas-step-nav">
                        <button className="atlas-nav-btn ghost" disabled={pasoActual === 0} onClick={() => irAPaso(pasoActual - 1)}>
                            <Icono nombre="atras" size={18} /> Anterior
                        </button>
                        {pasoActual === 0 && statusActual && primerPasoPendiente > 0 && (
                            <button className="atlas-nav-btn ghost" onClick={() => irAPaso(primerPasoPendiente)}>
                                Continuar donde quedé
                            </button>
                        )}
                        <button className="atlas-nav-btn" onClick={() => irAPaso(pasoActual + 1)}>
                            {textoSiguiente} <Icono nombre="adelante" size={18} />
                        </button>
                    </div>
                )}

                {/* CIERRE: pendientes + autoevaluación */}
                {pasoId === 'cierre' && (
                    <div className="atlas-unique-footer-section atlas-step-anim">
                        {pendientesGlobales.length > 0 ? (
                            <div className="atlas-pending-box">
                                <strong>Te faltan {pendientesGlobales.length} respuesta(s) antes de enviar:</strong>
                                <div className="atlas-pending-list">
                                    {pendientesGlobales.map(i => (
                                        <button key={i} type="button" onClick={() => irAPaso(pasoDePregunta[i])}>
                                            Pregunta {numeroVisible[i]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="atlas-pending-box completo"><Icono nombre="check" size={18} /> Respondiste todas las preguntas. Solo falta tu autoevaluación.</div>
                        )}

                        <section className="autoevaluacion-final-section">
                            <div className="autoeval-card">
                                <h3>AUTOEVALUACIÓN DE LOGRO</h3>
                                <p className="autoeval-desc">Certifico que esta estrategia:</p>
                                {reto.autoevaluacion_items?.length > 0 ? (
                                    <div className="checklist-items-premium">
                                        {reto.autoevaluacion_items.map((item, i) => (
                                            <label key={i} className="atlas-checkbox-row-premium">
                                                <input type="checkbox" checked={cumplimiento.includes(item)} onChange={() => toggleCumplimiento(item)} />
                                                <span className="label-text">{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: "#94a3b8" }}>Cuando hayas respondido todas las preguntas, envía tu misión.</p>
                                )}
                                <button
                                    className="btn-finalizar-mision"
                                    disabled={isSaving || (reto.autoevaluacion_items?.length > 0 && cumplimiento.length < Math.min(3, reto.autoevaluacion_items.length))}
                                    onClick={() => saveReto('COMPLETADO')}
                                >
                                    {isSaving ? (<><span className="spinner-mini"></span> Enviando respuestas...</>)
                                        : statusActual === 'COMPLETADO' ? "ACTUALIZAR EVIDENCIA" : "ENVIAR MISIÓN"}
                                </button>
                            </div>
                        </section>

                        <div className="atlas-step-nav">
                            <button className="atlas-nav-btn ghost" onClick={() => irAPaso(pasoActual - 1)}>← Anterior</button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};
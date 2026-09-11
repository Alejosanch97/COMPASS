import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import Swal from "sweetalert2";
import "../Styles/moduloSostener.css";

/* ============================================================
   24 PREGUNTAS INSTITUCIONALES (autoevaluación personal del
   directivo — igual que en tu versión vieja, sirve para
   desbloquear el "Cierre de Ciclo")
   ============================================================ */
const dimensiones = [
    {
        id: "D1",
        nombre: "Gobernanza y Liderazgo en IA",
        preguntas: [
            { id: 1, text: "Lidero la definición y actualización de la política institucional sobre uso de IA." },
            { id: 2, text: "Existe un equipo o responsable claramente designado para supervisar el uso de IA en la institución." },
            { id: 3, text: "Tomo decisiones informadas sobre la adopción de herramientas de IA en procesos académicos." },
            { id: 4, text: "Superviso la implementación de protocolos frente a riesgos o incidentes relacionados con IA." },
            { id: 5, text: "Aseguro que el uso de IA esté alineado con principios éticos y marcos internacionales (UNESCO u otros)." },
            { id: 6, text: "Participo activamente en el seguimiento del uso pedagógico de la IA en la institución." }
        ]
    },
    {
        id: "D2",
        nombre: "Desarrollo y Supervisión Docente",
        preguntas: [
            { id: 7, text: "Promuevo la formación docente en el uso pedagógico y ético de la IA." },
            { id: 8, text: "Superviso que los docentes utilicen IA con intención pedagógica clara." },
            { id: 9, text: "Verifico que exista supervisión humana en el uso de IA por parte de los docentes." },
            { id: 10, text: "Fomento el intercambio de buenas prácticas sobre IA entre docentes." },
            { id: 11, text: "Evalúo periódicamente el nivel de competencia docente en IA." },
            { id: 12, text: "Acompaño o retroalimento a los docentes en el diseño de experiencias de aprendizaje con IA." }
        ]
    },
    {
        id: "D3",
        nombre: "Ética, Privacidad y Protección de Datos",
        preguntas: [
            { id: 13, text: "Superviso que no se compartan datos sensibles de estudiantes en herramientas de IA." },
            { id: 14, text: "Garantizo que se apliquen medidas de protección de datos en el uso institucional de IA." },
            { id: 15, text: "Reviso o delego la revisión de términos y condiciones de herramientas de IA antes de su uso." },
            { id: 16, text: "Promuevo prácticas de anonimización o uso responsable de la información estudiantil." },
            { id: 17, text: "Aseguro que estudiantes y familias sean informados sobre el uso de IA en la institución." },
            { id: 18, text: "Tomo acciones cuando identifico riesgos éticos o de privacidad en el uso de IA." }
        ]
    },
    {
        id: "D4",
        nombre: "Monitoreo, Impacto y Transparencia",
        preguntas: [
            { id: 19, text: "Monitoreo el impacto del uso de IA en el aprendizaje de los estudiantes." },
            { id: 20, text: "Analizo datos o evidencias para tomar decisiones sobre el uso institucional de IA." },
            { id: 21, text: "Garantizo espacios donde estudiantes puedan cuestionar o reflexionar sobre el uso de IA." },
            { id: 22, text: "Superviso posibles sesgos o inequidades en el uso de IA en la institución." },
            { id: 23, text: "Promuevo la transparencia sobre cómo y para qué se utiliza la IA en la institución." },
            { id: 24, text: "Impulso procesos de evaluación o auditoría del uso institucional de la IA." }
        ]
    }
];

/* El endpoint /sostener/directivo/auditar-institucional agrupa por
   Orden_Pregunta (no por ID_Pregunta tipo 'Q-A2-04' como en tu Excel viejo).
   Estos rangos replican la misma lógica de dimensiones que ya usa tu
   backend para el docente individual (getMetricasAuditoria en el modelo viejo). */
const ORDEN_CONFIG = {
    Uso: [4, 5, 6, 7, 8],
    Etica: [13, 14, 15, 16, 17],
    Impacto: [18, 19, 20, 21, 22],
    Desarrollo: [9, 10, 11, 12, 23, 24, 25, 26],
};

const getCompassData = (score) => {
    const s = parseFloat(score) || 0;
    if (s >= 90) return { nivel: "Gobernanza madura", desc: "La institución lidera con madurez el ecosistema de IA educativa. Existe supervisión humana estructurada, documentación de decisiones, evaluación de impacto y contribución activa a lineamientos institucionales." };
    if (s >= 75) return { nivel: "Integración estratégica", desc: "La institución integra IA de manera coherente y estratégica. Existen criterios de uso responsable, supervisión explícita y evaluación ajustada." };
    if (s >= 60) return { nivel: "Integración pedagógica", desc: "La IA forma parte del diseño pedagógico institucional con intención clara. Aún se puede fortalecer la documentación y evaluación sistemática de impacto." };
    if (s >= 40) return { nivel: "Uso incipiente", desc: "El uso de IA es instrumental u ocasional. Hay intención pero falta sistematicidad en evaluación, documentación y criterios éticos." };
    return { nivel: "Exploración", desc: "La institución se encuentra en etapa inicial de aproximación a la IA educativa. Es el punto de partida del camino ATLAS." };
};

const generarDiagnostico = (puntaje) => {
    const p = parseFloat(puntaje) || 0;
    if (p >= 90) return { nivel: "Institución Referente de Vanguardia", texto: "La institución refleja una integración madura, ética y estratégicamente documentada de la IA.", implicacion: "La institución puede convertirse en modelo replicable y liderar procesos de certificación externa.", accion: "• Liderar comunidades de práctica interinstitucionales.\n• Documentar casos de impacto medible.\n• Participar en construcción de política sectorial de IA." };
    if (p >= 80) return { nivel: "Institución Estratégica Consolidada", texto: "La integración institucional de IA es sólida y coherente con objetivos de aprendizaje.", implicacion: "El siguiente paso es medir con mayor precisión el impacto en autonomía estudiantil y diferenciación pedagógica.", accion: "• Implementar métricas comparativas antes/después.\n• Sistematizar evidencias de mejora.\n• Profundizar en personalización avanzada." };
    if (p >= 60) return { nivel: "Institución en Evolución", texto: "La institución ha superado la fase instrumental, aunque aún existen oportunidades en la dimensión ética y la documentación de impacto.", implicacion: "El crecimiento depende de consolidar supervisión humana explícita y evaluar resultados más allá de la eficiencia operativa.", accion: "• Diseñar secuencias donde la IA tenga rol definido y evaluable.\n• Revisar políticas institucionales de protección de datos.\n• Iniciar registro estructurado de experiencias." };
    if (p >= 40) return { nivel: "Institución Exploradora", texto: "La institución se encuentra en aproximación activa a la IA, con un enfoque predominantemente funcional u ocasional.", implicacion: "El desafío no es incorporar más herramientas, sino comprender cuándo, cómo y para qué usarlas dentro de un marco ético.", accion: "• Formular objetivos antes de usar IA.\n• Practicar revisión crítica sistemática.\n• Participar en formación específica sobre ética y sesgos." };
    return { nivel: "Fase de Alfabetización Institucional", texto: "El uso institucional de IA es limitado o principalmente operativo.", implicacion: "El progreso depende de fortalecer comprensión conceptual antes de escalar.", accion: "• Comprender principios básicos de protección de datos.\n• Explorar casos de uso pedagógico con acompañamiento.\n• Reflexionar sobre el rol insustituible del criterio docente." };
};

const dimensionRecommendations = {
    uso: {
        basic: ["Definir política de uso pedagógico de IA.", "Capacitar docentes en uso intencional.", "Crear criterios institucionales de evaluación con IA."],
        medium: ["Medir impacto en aprendizaje institucional.", "Diseñar secuencias didácticas con rol de IA definido.", "Revisar si la automatización reemplaza criterio docente."],
        advanced: ["Documentar casos de alto impacto.", "Compartir prácticas en red interinstitucional.", "Experimentar con mejora incremental basada en evidencia."]
    },
    etica: {
        basic: ["Revisar la política institucional de IA.", "Evitar datos identificables en herramientas externas.", "Verificar términos de uso de plataformas."],
        medium: ["Analizar casos de posible sesgo algorítmico.", "Explicitar a estudiantes el uso de IA.", "Incorporar revisión humana sistemática."],
        advanced: ["Liderar conversación institucional sobre riesgos.", "Diseñar guía para estudiantes y familias.", "Apoyar procesos de revisión institucional externa."]
    },
    impacto: {
        basic: ["Definir indicadores concretos de mejora.", "Evaluar resultados antes y después del uso de IA.", "Ajustar herramientas que no aporten valor."],
        medium: ["Implementar medición sistemática institucional.", "Diseñar experiencias personalizadas con IA.", "Recoger retroalimentación de toda la comunidad."],
        advanced: ["Sistematizar evidencia institucional.", "Presentar resultados en espacios académicos.", "Convertir la institución en referente de impacto."]
    },
    desarrollo: {
        basic: ["Agendar formación institucional en IA educativa.", "Unirse a comunidades de práctica.", "Iniciar bitácora institucional mensual."],
        medium: ["Profundizar en tema específico por área.", "Publicar o compartir experiencias.", "Solicitar retroalimentación de pares externos."],
        advanced: ["Diseñar microformación para docentes.", "Participar en proyectos piloto nacionales.", "Apoyar diseño de lineamientos sectoriales."]
    }
};

const toPct = (val) => ((parseFloat(val) / 5) * 100).toFixed(1);

const ModuloSostenerDirectivo = ({ userData, apiFetch, onNavigate }) => {
    const [view, setView] = useState("menu");
    const [loading, setLoading] = useState(false);

    // Autoevaluación personal del directivo (desbloquea el Cierre)
    const [respuestas, setRespuestas] = useState({});
    const [historial, setHistorial] = useState([]);

    // Datos institucionales (toda la empresa)
    const [datosGrupales, setDatosGrupales] = useState({
        totalDocentes: 0, promedioGlobal: 0,
        promedioD1: 0, promedioD2: 0, promedioD3: 0, promedioD4: 0,
        distribucionNiveles: { N1: 0, N2: 0, N3: 0, N4: 0 },
    });
    const [selectedFormReal, setSelectedFormReal] = useState(null);
    const [respuestasAuditarReal, setRespuestasAuditarReal] = useState([]);
    const [datosAuditoriafase1, setDatosAuditoriafase1] = useState({
        promedioGlobal: 0, promedioPorcentaje: 0, totalDocentes: 0, desviacion: "0.00",
        categoriasData: [], dimensionDebil: "", nivelCompassObj: {},
    });
    const [huellaCompleta, setHuellaCompleta] = useState(null);
    const [auditarDos, setAuditarDos] = useState(null);
    const [auditarDosMedia, setAuditarDosMedia] = useState(null);
    const [statsPrompt, setStatsPrompt] = useState(null);
    const [retos, setRetos] = useState([]);
    const [datosAsegurar, setDatosAsegurar] = useState({ diagnostico: null, planAccion: null });
    const [tieneCierrePrevio, setTieneCierrePrevio] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [viewModeModal, setViewModeModal] = useState('stats');
    const [showModalReal, setShowModalReal] = useState(false);
    const [viewModeReal, setViewModeReal] = useState('stats');

    const [analysis, setAnalysis] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [showAnalysis, setShowAnalysis] = useState(false);

    const [cierreStep, setCierreStep] = useState(1);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const initialFormDataCierre = {
        reflexionPuntoPartida: "", estadoCumplimientoAsegurar: "", analisisImplementacion: "",
        aprendizajeClave: "", rutaElegida: "", prioridadEstrategicaAnual: "",
        accionGobernanza: "", indicadorMedible: "", fechaRevisionInstitucional: "", estrategiaComunicacion: "",
    };
    const [formDataCierre, setFormDataCierre] = useState(initialFormDataCierre);
    const formDataCierreRef = useRef(formDataCierre);
    useEffect(() => { formDataCierreRef.current = formDataCierre; }, [formDataCierre]);

    const getLocalStorageKey = useCallback(() => {
        const k = userData?.teacher_key || userData?.id || "UNKNOWN";
        return `atlas_cierre_directivo_${k}`;
    }, [userData]);

    useEffect(() => {
        if (isReadOnly) return;
        try { localStorage.setItem(getLocalStorageKey(), JSON.stringify(formDataCierre)); } catch (e) { /* noop */ }
    }, [formDataCierre, getLocalStorageKey, isReadOnly]);

    const cargarDesdeLocalStorage = useCallback(() => {
        try {
            const guardado = localStorage.getItem(getLocalStorageKey());
            if (guardado) { setFormDataCierre(prev => ({ ...prev, ...JSON.parse(guardado) })); return true; }
        } catch (e) { /* noop */ }
        return false;
    }, [getLocalStorageKey]);

    const limpiarLocalStorage = useCallback(() => {
        try { localStorage.removeItem(getLocalStorageKey()); } catch (e) { /* noop */ }
    }, [getLocalStorageKey]);

    const updateFormField = useCallback((field, value) => {
        setFormDataCierre(prev => { const u = { ...prev, [field]: value }; formDataCierreRef.current = u; return u; });
    }, []);

    /* ============================================================
       CARGA INSTITUCIONAL — reemplaza los fetch(`${API_URL}?sheet=...`)
       por las rutas reales del backend
       ============================================================ */
    useEffect(() => {
        const cargarTodo = async () => {
            setLoading(true);
            try {
                const [
                    misEvals, balance, auditarInst, grupales, huella,
                    auditarDosInst, retosInst, cierre, diagInst, planInst,
                ] = await Promise.all([
                    apiFetch("/api/sostener/mis-evaluaciones").catch(() => []),
                    apiFetch("/api/sostener/directivo/balance-institucional").catch(() => null),
                    apiFetch("/api/sostener/directivo/auditar-institucional").catch(() => null),
                    apiFetch("/api/sostener/directivo/grupales").catch(() => null),
                    apiFetch("/api/sostener/directivo/huella-institucional").catch(() => null),
                    apiFetch("/api/sostener/directivo/auditar-dos-inst").catch(() => null),
                    apiFetch("/api/sostener/directivo/mis-retos-transformar-inst").catch(() => []),
                    apiFetch("/api/sostener/directivo/cierre").catch(() => null),
                    apiFetch("/api/asegurar/directivo/diagnostico").catch(() => null),
                    apiFetch("/api/asegurar/directivo/plan").catch(() => null),
                ]);

                // -- Autoevaluación personal (desbloquea "Cierre de Ciclo")
                if (Array.isArray(misEvals) && misEvals.length > 0) {
                    const reciente = misEvals[0];
                    setHistorial([reciente]);
                    if (reciente.respuestas) {
                        const mapa = {};
                        Object.keys(reciente.respuestas).forEach(k => { mapa[Number(k)] = Number(reciente.respuestas[k]); });
                        setRespuestas(mapa);
                    }
                }

                // -- Panel 1 / Panel 2: media, moda, desviación, total de respuestas
                if (balance?.auditar) {
                    setSelectedFormReal({
                        puntosMedia: balance.auditar.media_base5,
                        promedioEscala100: balance.auditar.media_base100,
                        desviacion: balance.auditar.desviacion,
                        puntosModa: balance.auditar.moda,
                        puntajeTotal: balance.auditar.puntaje_total,
                        totalItems: balance.auditar.total_items,
                    });
                }
                if (balance?.prompt_liderar) {
                    const p = balance.prompt_liderar;
                    const promedio = (parseFloat(p.puntaje_etica || 0) + parseFloat(p.puntaje_privacidad || 0)
                        + parseFloat(p.puntaje_agencia || 0) + parseFloat(p.puntaje_dependencia || 0)) / 4;
                    setStatsPrompt({
                        etica: p.puntaje_etica, priv: p.puntaje_privacidad, agen: p.puntaje_agencia, cogn: p.puntaje_dependencia,
                        promedio: promedio.toFixed(2),
                        diagnostico: promedio >= 4 ? "Excelente equilibrio ético institucional." : "Se sugiere mayor supervisión humana institucional.",
                        color: promedio >= 4 ? "#22c55e" : "#f59e0b",
                        total: balance.totalDocentes || 0,
                    });
                }

                // -- Diagnóstico institucional por dimensión (Fase 1 del cierre)
                if (auditarInst) {
                    setRespuestasAuditarReal(auditarInst.respuestas || []);
                    const promPorOrden = (ordenes) => {
                        const filas = (auditarInst.respuestas || []).filter(r => ordenes.includes(Number(r.Orden_Pregunta)));
                        if (filas.length === 0) return 0;
                        return filas.reduce((acc, r) => acc + parseFloat(r.Puntos_Ganados || 0), 0) / filas.length;
                    };
                    const categoriasFinales = [
                        { dimension: "Uso", puntaje: parseFloat(promPorOrden(ORDEN_CONFIG.Uso).toFixed(1)) },
                        { dimension: "Ética", puntaje: parseFloat(promPorOrden(ORDEN_CONFIG.Etica).toFixed(1)) },
                        { dimension: "Impacto", puntaje: parseFloat(promPorOrden(ORDEN_CONFIG.Impacto).toFixed(1)) },
                        { dimension: "Desarrollo", puntaje: parseFloat(promPorOrden(ORDEN_CONFIG.Desarrollo).toFixed(1)) },
                    ];
                    const minCat = [...categoriasFinales].sort((a, b) => a.puntaje - b.puntaje)[0];
                    setDatosAuditoriafase1({
                        promedioGlobal: auditarInst.media_base5 || 0,
                        promedioPorcentaje: auditarInst.media_base100 || 0,
                        totalDocentes: auditarInst.docentesConAuditar || auditarInst.totalDocentes || 0,
                        desviacion: balance?.auditar?.desviacion != null ? balance.auditar.desviacion.toFixed(2) : "0.00",
                        categoriasData: categoriasFinales,
                        dimensionDebil: minCat?.dimension || "Por evaluar",
                        nivelCompassObj: getCompassData(auditarInst.media_base100 || 0),
                    });
                }

                if (grupales) setDatosGrupales(grupales);
                if (huella) setHuellaCompleta(huella);

                if (auditarDosInst?.existe) {
                    setAuditarDos(auditarDosInst);
                    setAuditarDosMedia({
                        media_base5: auditarDosInst.auditar.media_base5,
                        media_base100: auditarDosInst.auditar.media_base100,
                    });
                }

                if (Array.isArray(retosInst)) setRetos(retosInst);

                if (cierre) {
                    setTieneCierrePrevio(true);
                    setFormDataCierre({
                        reflexionPuntoPartida: cierre.reflexion_punto_partida || "",
                        estadoCumplimientoAsegurar: cierre.estado_cumplimiento_asegurar || "",
                        analisisImplementacion: cierre.analisis_implementacion || "",
                        aprendizajeClave: "",
                        rutaElegida: cierre.ruta_elegida || "",
                        prioridadEstrategicaAnual: cierre.prioridad_estrategica_anual || "",
                        accionGobernanza: cierre.accion_gobernanza || "",
                        indicadorMedible: cierre.indicador_medible || "",
                        fechaRevisionInstitucional: cierre.fecha_revision_institucional
                            ? String(cierre.fecha_revision_institucional).substring(0, 10) : "",
                        estrategiaComunicacion: cierre.estrategia_comunicacion || "",
                    });
                }

                setDatosAsegurar({ diagnostico: diagInst, planAccion: planInst });
            } catch (e) {
                console.error("Error cargando Sostener Directivo:", e);
            } finally {
                setLoading(false);
            }
        };
        cargarTodo();
    }, [apiFetch]);

    /* ============================================================
       DATASET PARA GRÁFICAS (reemplaza tu getMetricasAuditoria viejo)
       ============================================================ */
    const datasetAuditoria = datosAuditoriafase1.categoriasData.length
        ? datosAuditoriafase1.categoriasData.map(c => ({ label: c.dimension, valor: c.puntaje }))
        : [{ label: 'Uso', valor: 0 }, { label: 'Ética', valor: 0 }, { label: 'Impacto', valor: 0 }, { label: 'Desarrollo', valor: 0 }];
    const valorMinimo = Math.min(...datasetAuditoria.map(d => d.valor));

    const pD = [
        parseFloat(datosGrupales.promedioD1) || 0,
        parseFloat(datosGrupales.promedioD2) || 0,
        parseFloat(datosGrupales.promedioD3) || 0,
        parseFloat(datosGrupales.promedioD4) || 0,
    ];

    const getComparativoAtlas = useCallback(() => {
        const scoreAntesBase5 = parseFloat(datosAuditoriafase1.promedioGlobal) || 0;
        const scoreAntesPct = parseFloat(datosAuditoriafase1.promedioPorcentaje) || 0;
        const nivelAntes = getCompassData(scoreAntesPct).nivel;

        const scoreAhoraPct = huellaCompleta ? huellaCompleta.huella_total : (parseFloat(datosGrupales.promedioGlobal) || 0) * 20;
        const scoreAhoraBase5 = scoreAhoraPct / 20;
        const crecimiento = (scoreAhoraPct - scoreAntesPct).toFixed(1);

        return {
            scoreAntes: scoreAntesBase5,
            nivelAntes,
            scoreAhora: scoreAhoraBase5,
            nivelAhora: generarDiagnostico(scoreAhoraPct).nivel,
            crecimiento,
        };
    }, [datosAuditoriafase1, huellaCompleta, datosGrupales]);

    const generateAlerts = (data) => {
        const alerts = [];
        if (data.item3 <= 2 && data.item5 <= 2) alerts.push("⚠️ Riesgo de automatización sin supervisión pedagógica.");
        if (data.item7 <= 2 || data.item8 <= 2) alerts.push("⚠️ Posible riesgo en protección de datos institucional.");
        if (data.dim3 < 2.5) alerts.push("⚠️ El uso podría estar enfocado en eficiencia más que en aprendizaje.");
        if (data.dim4 < data.previousDim4) alerts.push("⚠️ Se detecta desaceleración en desarrollo profesional docente.");
        return alerts;
    };

    const generateAnalysis = () => {
        const dims = { uso: pD[0], etica: pD[1], impacto: pD[2], desarrollo: pD[3] };
        const result = {};
        Object.keys(dims).forEach(key => {
            const value = dims[key];
            if (value < 3.0) result[key] = dimensionRecommendations[key].basic;
            else if (value < 4.0) result[key] = dimensionRecommendations[key].medium;
            else result[key] = dimensionRecommendations[key].advanced;
        });
        return result;
    };

    /* ============================================================
       AUTOEVALUACIÓN PERSONAL DEL DIRECTIVO
       ============================================================ */
    const calcularResultados = () => {
        const valores = Object.values(respuestas);
        if (valores.length < 24) return null;
        const sumaTotal = valores.reduce((a, b) => a + b, 0);
        const promedioGlobal = sumaTotal / 24;
        const promediosD = dimensiones.map(d => {
            const sumaD = d.preguntas.reduce((acc, p) => acc + (respuestas[p.id] || 0), 0);
            return { id: d.id, nombre: d.nombre, promedio: (sumaD / 6).toFixed(2) };
        });
        let nivel = "";
        if (promedioGlobal >= 4.3) nivel = "Nivel 4: Referente Institucional";
        else if (promedioGlobal >= 3.5) nivel = "Nivel 3: Institución Estratégica";
        else if (promedioGlobal >= 2.5) nivel = "Nivel 2: Integración Inicial";
        else nivel = "Nivel 1: Exploración Institucional";

        const alertas = [];
        if ((respuestas[3] || 0) <= 2 && (respuestas[5] || 0) <= 2) alertas.push("Gobernanza sin estructura formal");
        if ((respuestas[7] || 0) <= 2 || (respuestas[8] || 0) <= 2) alertas.push("Riesgo en formación docente");
        if (parseFloat(promediosD[2].promedio) < 2.5) alertas.push("Bajo impacto pedagógico institucional");

        return { promedioGlobal, promediosD, nivel, alertas };
    };

    const adaptarRegistroBackend = (reg) => ({
        _id: reg.id,
        Promedio_Global: reg.promedio_global,
        Nivel_Calculado: reg.nivel_calculado,
        "Promedio_D1, Promedio_D2, Promedio_D3, Promedio_D4":
            `${reg.promedio_d1}, ${reg.promedio_d2}, ${reg.promedio_d3}, ${reg.promedio_d4}`,
    });

    const handleSave = async () => {
        const res = calcularResultados();
        if (!res) return Swal.fire("Incompleto", "Responde todas las preguntas.", "warning");

        setLoading(true);
        const promedioD1 = parseFloat(res.promediosD[0].promedio);
        const promedioD2 = parseFloat(res.promediosD[1].promedio);
        const promedioD3 = parseFloat(res.promediosD[2].promedio);
        const promedioD4 = parseFloat(res.promediosD[3].promedio);

        const respuestasJSON = {};
        for (let i = 1; i <= 24; i++) respuestasJSON[String(i)] = respuestas[i] || 0;

        const payload = {
            id: historial.length > 0 ? historial[0]._id : undefined,
            periodo: "2026-1",
            respuestas: respuestasJSON,
            promedio_global: parseFloat(res.promedioGlobal.toFixed(2)),
            promedio_d1: promedioD1, promedio_d2: promedioD2, promedio_d3: promedioD3, promedio_d4: promedioD4,
            nivel_calculado: res.nivel,
            alertas_activas: res.alertas.join(" | ") || "Sin Alertas",
            status: "COMPLETADO",
        };

        try {
            const guardado = await apiFetch("/api/sostener/evaluacion", { method: "POST", body: JSON.stringify(payload) });
            setHistorial([adaptarRegistroBackend(guardado)]);
            setView("dashboard");
            Swal.fire("Éxito", "Autoevaluación institucional guardada.", "success");
        } catch (e) {
            Swal.fire("Error", "Error al sincronizar con el servidor.", "error");
        } finally {
            setLoading(false);
        }
    };

    /* ============================================================
       GUARDAR CIERRE INSTITUCIONAL → POST /sostener/directivo/cierre
       ============================================================ */
    const handleNextStep = () => {
        if (cierreStep === 5) {
            isReadOnly ? setView("menu") : handleFinalSaveCierre();
            return;
        }
        setCierreStep(prev => prev + 1);
    };

    const handleFinalSaveCierre = async () => {
        const dataActual = formDataCierreRef.current;
        if (!dataActual.prioridadEstrategicaAnual || dataActual.prioridadEstrategicaAnual.length < 150) {
            Swal.fire("Acción Incompleta", "La prioridad estratégica debe tener al menos 150 caracteres.", "warning");
            return;
        }

        setLoading(true);
        const comp = getComparativoAtlas();
        const { N3, N4 } = datosGrupales.distribucionNiveles;

        const cleanText = (txt) => (txt ? String(txt).replace(/[\r\n\t]+/g, " ").trim() : "");

        const payload = {
            reflexion_punto_partida: cleanText(dataActual.reflexionPuntoPartida),
            estado_cumplimiento_asegurar: cleanText(dataActual.estadoCumplimientoAsegurar),
            analisis_implementacion: dataActual.aprendizajeClave
                ? cleanText(`${dataActual.aprendizajeClave}: ${dataActual.analisisImplementacion}`)
                : cleanText(dataActual.analisisImplementacion),
            nivel_institucional_actual: generarDiagnostico(comp.scoreAhora * 20).nivel,
            docentes_n1: (N3 || 0) + (N4 || 0), // docentes en niveles estratégicos (columna es Integer)
            porcentaje_reduccion_alertas: parseFloat(comp.crecimiento) || 0,
            ruta_elegida: cleanText(dataActual.rutaElegida),
            prioridad_estrategica_anual: cleanText(dataActual.prioridadEstrategicaAnual),
            accion_gobernanza: cleanText(dataActual.accionGobernanza),
            indicador_medible: cleanText(dataActual.indicadorMedible),
            fecha_revision_institucional: dataActual.fechaRevisionInstitucional || null,
            estrategia_comunicacion: cleanText(dataActual.estrategiaComunicacion),
        };

        try {
            await apiFetch("/api/sostener/directivo/cierre", { method: "POST", body: JSON.stringify(payload) });
            limpiarLocalStorage();
            setTieneCierrePrevio(true);
            await Swal.fire({
                title: "¡Ciclo Institucional Completado!",
                text: "La hoja de ruta institucional ha sido guardada correctamente.",
                icon: "success",
                confirmButtonColor: "#D4AF37",
            });
            setView("menu");
        } catch (e) {
            console.error("Error handleFinalSaveCierre:", e);
            Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
        } finally {
            setLoading(false);
        }
    };

    const cargarDatosCierreExistentes = async () => {
        setLoading(true);
        try {
            const cierre = await apiFetch("/api/sostener/directivo/cierre");
            if (!cierre) {
                Swal.fire("Sin datos", "No hay un ciclo previo guardado.", "info");
                return;
            }
            setFormDataCierre({
                reflexionPuntoPartida: cierre.reflexion_punto_partida || "",
                estadoCumplimientoAsegurar: cierre.estado_cumplimiento_asegurar || "",
                analisisImplementacion: cierre.analisis_implementacion || "",
                aprendizajeClave: "",
                rutaElegida: cierre.ruta_elegida || "",
                prioridadEstrategicaAnual: cierre.prioridad_estrategica_anual || "",
                accionGobernanza: cierre.accion_gobernanza || "",
                indicadorMedible: cierre.indicador_medible || "",
                fechaRevisionInstitucional: cierre.fecha_revision_institucional ? String(cierre.fecha_revision_institucional).substring(0, 10) : "",
                estrategiaComunicacion: cierre.estrategia_comunicacion || "",
            });
            setIsReadOnly(true);
            setCierreStep(1);
            setView("cierre");
        } catch (e) {
            Swal.fire("Error", "No pudimos conectar con el servidor.", "error");
        } finally {
            setLoading(false);
        }
    };

    /* ============================================================
       RENDER
       ============================================================ */
    return (
        <div className="sostener-page-wrapper">

            {/* ======================== MENÚ ======================== */}
            {view === "menu" && (
                <div className="sostener-menu animate-fade-in">
                    <div className="sostener-header">
                        <button className="btn-back-atlas" onClick={() => onNavigate('overview')}>⬅ Mapa ATLAS</button>
                        <h2>Misiones de Sostenibilidad Institucional</h2>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
                            <div className="spinner-mini" style={{
                                margin: '0 auto 16px',
                                animation: 'spin 1s linear infinite',
                                border: '3px solid rgba(197,160,89,0.25)',
                                borderTop: '3px solid #c5a059',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px'
                            }}></div>
                            <p>Cargando tu información institucional...</p>
                        </div>
                    ) : (
                        <div className="sostener-grid-menu">
                            <div className={`sos-card-main ${historial.length > 0 ? 'is-done' : ''}`}>
                                <div className="sos-icon">🏛️</div>
                                <h3>Radar Institucional</h3>
                                <p>Evaluación de gobernanza, competencia docente, datos e impacto institucional 2026.</p>
                                <div className="sos-actions">
                                    {historial.length > 0 ? (
                                        <>
                                            <button onClick={() => setView("dashboard")} className="btn-sos-primary">Ver Análisis Institucional</button>
                                            <button onClick={() => setView("cuestionario")} className="btn-sos-secondary">Revisar Evaluación</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setView("cuestionario")} className="btn-sos-primary">Iniciar Evaluación Institucional</button>
                                    )}
                                </div>
                            </div>

                            <div className={`sos-card-main ${historial.length > 0 ? '' : 'is-locked'}`}>
                                <div className="sos-icon">🔄</div>
                                <h3>Cierre de Ciclo Institucional</h3>
                                <p>Compara la evolución de todos los docentes Antes vs Después.</p>
                                <div className="sos-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                                    <button
                                        disabled={historial.length === 0}
                                        className="btn-sos-primary"
                                        onClick={() => {
                                            const teniaBorrador = cargarDesdeLocalStorage();
                                            if (!teniaBorrador) setFormDataCierre(initialFormDataCierre);
                                            setIsReadOnly(false);
                                            setCierreStep(1);
                                            setView("cierre");
                                        }}
                                    >Iniciar Nuevo Cierre</button>
                                    <button
                                        disabled={historial.length === 0 || !tieneCierrePrevio}
                                        className="btn-sos-secondary"
                                        onClick={cargarDatosCierreExistentes}
                                    >Ver Respuestas Anteriores</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ======================== CUESTIONARIO ======================== */}
            {view === "cuestionario" && (
                <div className="atl-q-page-container animate-fade-in">
                    <button className="atl-q-btn-back" onClick={() => setView("menu")}>⬅ Volver</button>
                    <div className="atl-q-main-card">
                        <header className="atl-q-header">
                            <h2 className="atl-q-title">Evaluación Institucional de IA</h2>
                            <p className="atl-q-subtitle">Sostener: Consolidación del Marco ATLAS Institucional 2026</p>
                        </header>
                        {dimensiones.map(dim => (
                            <section key={dim.id} className="atl-q-dimension-section">
                                <h3 className="atl-q-dim-title">{dim.nombre}</h3>
                                <p className="atl-q-dim-description">
                                    Valora cada aspecto en una escala de 1 a 5, donde 1 significa que el criterio no se evidencia o se aplica de manera muy limitada, y 5 significa que se cumple de forma sobresaliente.
                                </p>
                                <div className="atl-q-questions-list">
                                    {dim.preguntas.map(p => (
                                        <div key={p.id} className="atl-q-item-row">
                                            <span className="atl-q-question-text">{p.text}</span>
                                            <div className="atl-q-likert-scale">
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <button
                                                        key={v}
                                                        className={`atl-q-likert-btn ${respuestas[p.id] === v ? 'is-active' : ''} ${v === 5 ? 'is-premium' : ''}`}
                                                        onClick={() => setRespuestas(prev => ({ ...prev, [p.id]: v }))}
                                                    >{v}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                        <footer className="atl-q-footer">
                            <button className="atl-q-btn-submit" onClick={handleSave} disabled={loading}>
                                {loading ? "Sincronizando con ATLAS..." : "Finalizar y Guardar Evaluación Institucional"}
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* ======================== DASHBOARD ======================== */}
            {view === "dashboard" && historial.length > 0 && (
                <div className="sostener-dashboard animate-fade-in">
                    <button className="btn-sos-back" onClick={() => setView("menu")}>⬅ Menú Principal</button>
                    <div className="sos-dash-layout">

                        <div className="sos-dash-top">
                            <div className="sos-stat-card gold">
                                <span className="dash-lider-2026-panel-id">Panel 1 — Institucional</span>
                                <h4>Índice de Sostenibilidad Institucional</h4>
                                <div className="sos-big-val">
                                    {huellaCompleta ? `${huellaCompleta.huella_total}%` : "—"}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#c5a059', marginTop: '8px' }}>
                                    Promedio de <strong>{datosGrupales.totalDocentes}</strong> docentes evaluados
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                                    Media: {datosGrupales.promedioGlobal} | {generarDiagnostico(toPct(datosGrupales.promedioGlobal)).nivel}
                                </div>
                                <button className="atl-an-btn-main" onClick={() => setShowModal(true)}>
                                    Ver Análisis Institucional
                                </button>
                            </div>

                            <div className="sos-stat-card radar-cont">
                                <h4>Radar Institucional — Promedio de Todos los Docentes</h4>
                                <ResponsiveContainer width="100%" height={250}>
                                    <RadarChart data={[
                                        { s: 'Gobernanza', A: pD[0] },
                                        { s: 'Supervisión', A: pD[1] },
                                        { s: 'Ética/Datos', A: pD[2] },
                                        { s: 'Impacto', A: pD[3] }
                                    ]}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="s" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Radar name="Promedio Institucional" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.5} />
                                    </RadarChart>
                                </ResponsiveContainer>

                                <button className="analysis-btn" onClick={() => {
                                    if (analysis) { setShowAnalysis(prev => !prev); return; }
                                    const generated = generateAnalysis();
                                    setAnalysis(generated);
                                    setAlerts(generateAlerts({
                                        item3: pD[0] < 2.5 ? 2 : 3, item5: pD[0] < 2.5 ? 2 : 3,
                                        item7: pD[1] < 2.5 ? 2 : 3, item8: pD[1] < 2.5 ? 2 : 3,
                                        dim3: pD[2], dim4: pD[3], previousDim4: 3.5,
                                    }));
                                    setShowAnalysis(true);
                                }}>
                                    {!analysis ? "Generar Análisis Institucional" : showAnalysis ? "Minimizar Análisis" : "Mostrar Análisis"}
                                </button>
                            </div>
                        </div>

                        {analysis && showAnalysis && (
                            <div className="analysis-box">
                                <h3>📊 Recomendaciones Institucionales</h3>
                                {Object.entries(analysis).map(([dim, recs]) => (
                                    <div key={dim} className="dimension-block">
                                        <h4>{dim.toUpperCase()}</h4>
                                        <ul>{recs.map((r, i) => <li key={i}>{r}</li>)}</ul>
                                    </div>
                                ))}
                                {alerts.length > 0 && (
                                    <div className="alerts-box">
                                        <h3>🚨 Alertas Institucionales</h3>
                                        <ul>{alerts.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="sos-stat-card real-evidence" onClick={() => setShowModalReal(true)}>
                            <span className="dash-lider-2026-panel-id">Panel 2: Diagnóstico Institucional — Auditoría Grupal</span>
                            <h4>Distribución de Docentes por Nivel de Madurez</h4>
                            <div className="atl-an-metrics-grid">
                                {[
                                    { label: 'Exploración\n(N1)', val: datosGrupales.distribucionNiveles.N1, color: '#f87171' },
                                    { label: 'Integración\n(N2)', val: datosGrupales.distribucionNiveles.N2, color: '#fbbf24' },
                                    { label: 'Estratégico\n(N3)', val: datosGrupales.distribucionNiveles.N3, color: '#34d399' },
                                    { label: 'Referente\n(N4)', val: datosGrupales.distribucionNiveles.N4, color: '#c5a059' }
                                ].map((n, i) => (
                                    <div key={i} className="atl-an-mini-box" style={{ borderTop: `3px solid ${n.color}` }}>
                                        <span className="atl-an-mini-box-val" style={{ color: n.color }}>{n.val}</span>
                                        <span className="atl-an-mini-box-lbl" style={{ whiteSpace: 'pre-line', fontSize: '0.7rem' }}>{n.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
                                Total: <strong>{datosGrupales.totalDocentes}</strong> docentes | Promedio global: <strong>{datosGrupales.promedioGlobal}/5</strong>
                            </div>
                            <div className="atl-an-metrics-grid" style={{ marginTop: '8px' }}>
                                <div className="atl-an-mini-box">
                                    <span className="atl-an-mini-box-val">
                                        {selectedFormReal?.puntosMedia != null ? Number(selectedFormReal.puntosMedia).toFixed(2) : "0.00"}
                                    </span>
                                    <span className="atl-an-mini-box-lbl">Media Auditoría (0-5)</span>
                                </div>
                                <div className="atl-an-mini-box">
                                    <span className="atl-an-mini-box-val">{selectedFormReal?.totalItems || 0}</span>
                                    <span className="atl-an-mini-box-lbl">Respuestas</span>
                                </div>
                            </div>
                            <button className="atl-an-btn-main-alt">Ver Diagnóstico Detallado</button>
                        </div>

                        {showModalReal && (
                            <div className="atl-an-overlay">
                                <div className="audit-modal-container animate-fade-in">
                                    <div className="audit-modal-head">
                                        <div className="audit-modal-header-top">
                                            <div>
                                                <h3>Reporte ATLAS: Diagnóstico Grupal Institucional</h3>
                                                <p className="audit-modal-sub">
                                                    {selectedFormReal?.totalItems || 0} respuestas de {datosGrupales.totalDocentes} docentes
                                                </p>
                                            </div>
                                            <button className="audit-modal-close" onClick={() => setShowModalReal(false)}>✕</button>
                                        </div>
                                        <div className="audit-modal-tabs">
                                            <button className={viewModeReal === 'stats' ? 'active' : ''} onClick={() => setViewModeReal('stats')}>📊 Estadísticas</button>
                                            <button className={viewModeReal === 'survey' ? 'active' : ''} onClick={() => setViewModeReal('survey')}>📝 Ítems</button>
                                            <button className={`compass-tab-unique ${viewModeReal === 'compass' ? 'active' : ''}`} onClick={() => setViewModeReal('compass')}>🧭 Compass</button>
                                        </div>
                                    </div>

                                    <div className="audit-modal-body">
                                        {viewModeReal === 'stats' && (
                                            <div className="audit-stats-view">
                                                <div className="audit-metrics-grid">
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val blue">
                                                            {selectedFormReal?.puntosMedia != null ? (selectedFormReal.puntosMedia * 20).toFixed(2) : "0.00"}
                                                        </span>
                                                        <span className="audit-lbl">MEDIA GRUPAL (0-100)</span>
                                                    </div>
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val green">{datosGrupales.totalDocentes}</span>
                                                        <span className="audit-lbl">TOTAL DOCENTES</span>
                                                    </div>
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val orange">{selectedFormReal?.desviacion != null ? Number(selectedFormReal.desviacion).toFixed(2) : "0.00"}</span>
                                                        <span className="audit-lbl">DESVIACIÓN (Σ)</span>
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                                    <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                                                        <strong>Distribución por nivel:</strong><br />
                                                        N1 (Exploración): {datosGrupales.distribucionNiveles.N1} |
                                                        N2 (Integración): {datosGrupales.distribucionNiveles.N2} |
                                                        N3 (Estratégico): {datosGrupales.distribucionNiveles.N3} |
                                                        N4 (Referente): {datosGrupales.distribucionNiveles.N4}
                                                    </p>
                                                </div>
                                                <div className="audit-insight-card">
                                                    <h4>Interpretación Grupal</h4>
                                                    <p>
                                                        Una desviación de <strong>{selectedFormReal?.desviacion != null ? Number(selectedFormReal.desviacion).toFixed(2) : "0.00"}</strong> indica que la práctica institucional con IA
                                                        {parseFloat(selectedFormReal?.desviacion) < 1.0
                                                            ? " es altamente consistente entre los docentes."
                                                            : " presenta variaciones notables entre docentes, lo que sugiere necesidad de homogenización."}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {viewModeReal === 'survey' && (
                                            <div className="audit-survey-scroll">
                                                {respuestasAuditarReal.slice(0, 25).map((q, idx) => (
                                                    <div key={idx} className="audit-item-row" style={{ marginBottom: '18px' }}>
                                                        <div className="audit-item-info">
                                                            <span className="audit-item-text">{q.Texto_Pregunta || `Indicador ${idx + 1}`}</span>
                                                            {q.Moda && (
                                                                <span className="audit-item-score" style={{ fontSize: '0.75rem' }}>
                                                                    Moda: {q.Moda} ({q.Opciones?.[0]?.pct || 0}%)
                                                                </span>
                                                            )}
                                                        </div>

                                                        {Array.isArray(q.Opciones) && q.Opciones.length > 0 ? (
                                                            <div style={{ marginTop: '6px' }}>
                                                                {q.Opciones.map((op, i) => (
                                                                    <div key={i} style={{ marginBottom: '6px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569' }}>
                                                                            <span>{op.opcion}</span>
                                                                            <span>{op.pct}% ({op.count})</span>
                                                                        </div>
                                                                        <div className="audit-progress-bg">
                                                                            <div className="audit-progress-fill" style={{ width: `${op.pct}%`, backgroundColor: '#3182ce' }}></div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="audit-progress-bg">
                                                                <div className="audit-progress-fill" style={{
                                                                    width: `${(q.Puntos_Ganados / 5) * 100}%`,
                                                                    backgroundColor: q.Puntos_Ganados >= 4 ? '#48bb78' : q.Puntos_Ganados >= 2.5 ? '#ecc94b' : '#f56565'
                                                                }}></div>
                                                            </div>
                                                        )}

                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                                                            {q.TotalRespuestas || 0} respuestas
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {viewModeReal === 'compass' && (
                                            <div className="audit-compass-view animate-slide-up">
                                                <div className="audit-compass-badge">
                                                    {getCompassData(selectedFormReal?.promedioEscala100).nivel}
                                                </div>
                                                <div className="audit-compass-box">
                                                    <h4>Diagnóstico Compass Institucional</h4>
                                                    <p>{getCompassData(selectedFormReal?.promedioEscala100).desc}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="audit-modal-footer">
                                        <button className="audit-btn-close-full" onClick={() => setShowModalReal(false)}>Cerrar Diagnóstico</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="sos-history-chart audit-ethic-border" style={{ borderLeftColor: statsPrompt?.color || '#e2e8f0' }}>
                            <span className="dash-lider-2026-panel-id">Panel 3: Fase Liderar — Análisis Grupal</span>
                            <h4>Dictamen de Liderazgo Pedagógico e IA Institucional</h4>

                            {statsPrompt ? (
                                <div className="sos-audit-content">
                                    <div className="sos-audit-head-row">
                                        <div>
                                            <h5 className="sos-audit-title" style={{ color: statsPrompt.color }}>
                                                {statsPrompt.diagnostico}
                                            </h5>
                                            <small>Promedio de {statsPrompt.total} docentes | Marco UNESCO 2024 & AI Act</small>
                                        </div>
                                    </div>

                                    <div className="sos-mini-grid-bars">
                                        {[
                                            { l: 'Ética', v: statsPrompt.etica, c: '#8b5cf6' },
                                            { l: 'Privacidad', v: statsPrompt.priv, c: '#06b6d4' },
                                            { l: 'Agencia', v: statsPrompt.agen, c: '#f59e0b' },
                                            { l: 'Cognición', v: statsPrompt.cogn, c: '#ec4899' }
                                        ].map(d => (
                                            <div key={d.l} className="sos-mini-bar-item">
                                                <div className="sos-mini-bar-labels">
                                                    <span>{d.l}</span>
                                                    <strong>{d.v}/5</strong>
                                                </div>
                                                <div className="sos-mini-bar-bg">
                                                    <div className="sos-mini-bar-fill" style={{ width: `${(parseFloat(d.v) / 5) * 100}%`, backgroundColor: d.c }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="sos-dictamen-box">
                                        <strong className="sos-dictamen-tag">🔍 Hallazgos Grupales:</strong>
                                        <p className="sos-dictamen-text">
                                            {parseFloat(statsPrompt.agen) <= 2
                                                ? "⚠️ Alerta institucional: se detecta delegación excesiva del juicio docente en múltiples participantes."
                                                : "✅ La mayoría de docentes mantiene agencia humana adecuada en sus interacciones con IA."}
                                            <br /><br />
                                            En términos de <strong>Privacidad</strong> (promedio {statsPrompt.priv}/5), la institución
                                            {parseFloat(statsPrompt.priv) >= 4
                                                ? " aplica protocolos seguros de minimización de datos de manera consistente."
                                                : " requiere fortalecer los protocolos de seguridad de datos estudiantiles."}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="sos-empty-state">
                                    <p>No se encontraron registros de liderazgo ético. <br />Completa la Fase Liderar para activar este panel grupal.</p>
                                </div>
                            )}
                        </div>

                        <div className="sos-history-chart">
                            <span className="dash-lider-2026-panel-id">Panel 4</span>
                            <h4>Misiones de Transformación — Estado Global</h4>
                            <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                                Total misiones: <strong>{retos.length}</strong> |
                                Completadas: <strong>{retos.filter(r => (r.status_reto || '').toUpperCase() === 'COMPLETADO').length}</strong>
                            </div>
                            <div className="retos-summary-grid">
                                {retos.length > 0 ? retos.slice(0, 6).map((r, i) => (
                                    <div key={i} className="reto-mini-card">
                                        <h5>{r.nombre_reto}</h5>
                                        <span className={`status-pill ${r.status_reto}`}>{r.status_reto}</span>
                                        <small>{r.nivel_unesco}</small>
                                    </div>
                                )) : <p>No hay retos registrados en la institución.</p>}
                            </div>
                        </div>

                        <div className="sos-history-chart">
                            <span className="dash-lider-2026-panel-id">Panel 5</span>
                            <h4>Estado Actual ATLAS — Promedios Institucionales</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                                {[
                                    { label: 'Gobernanza', val: datosGrupales.promedioD1, color: '#8b5cf6' },
                                    { label: 'Supervisión', val: datosGrupales.promedioD2, color: '#06b6d4' },
                                    { label: 'Ética/Datos', val: datosGrupales.promedioD3, color: '#f59e0b' },
                                    { label: 'Impacto', val: datosGrupales.promedioD4, color: '#22c55e' }
                                ].map((d, i) => (
                                    <div key={i} style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: '8px', borderTop: `3px solid ${d.color}` }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: d.color }}>{parseFloat(d.val).toFixed(1)}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{d.label}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>/5</div>
                                    </div>
                                ))}
                            </div>
                            <ResponsiveContainer width="100%" height={120}>
                                <RadarChart data={[
                                    { s: 'Gobernanza', A: pD[0] },
                                    { s: 'Supervisión', A: pD[1] },
                                    { s: 'Ética', A: pD[2] },
                                    { s: 'Impacto', A: pD[3] }
                                ]}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="s" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Radar dataKey="A" stroke="#c5a059" fill="#c5a059" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                            {auditarDosMedia?.media_base5 != null && (
                                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                                    2º diagnóstico institucional: <strong>{auditarDosMedia.media_base5.toFixed(2)}/5</strong>
                                    {' '}({auditarDos?.docentesConSegundo || 0} de {auditarDos?.totalDocentes || 0} docentes)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ======================== CIERRE DE CICLO ======================== */}
            {view === "cierre" && (
                <div className="sostener-cuestionario animate-fade-in cierre-full-view">
                    <div className="cierre-nav-header">
                        <button className="btn-sos-back" onClick={() => setView("menu")}>⬅ Salir del Cierre</button>
                        <div className="cierre-stepper">
                            {[1, 2, 3, 4, 5].map(s => (
                                <div key={s} className={`step-pill ${cierreStep >= s ? 'active' : ''} ${cierreStep > s ? 'completed' : ''}`}>
                                    {s < cierreStep ? '✓' : s}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="sos-form-container cierre-main-content">

                        {/* FASE 1 */}
                        {cierreStep === 1 && (
                            <div className="at-cierre-fase-wrapper animate-slide-up">
                                <header className="at-cierre-header-main">
                                    <div className="at-cierre-badge-container">
                                        <span className="at-badge-gold">Fase 1: El Origen Institucional</span>
                                    </div>
                                    <h2 className="at-cierre-title">¿Dónde comenzó el viaje de tu institución?</h2>
                                    <p className="at-cierre-subtitle">
                                        Análisis retrospectivo basado en el Diagnóstico de Auditoría grupal de <strong>{datosAuditoriafase1.totalDocentes}</strong> docentes.
                                    </p>
                                </header>

                                <div className="at-cierre-grid-container">
                                    <section className="at-cierre-card-premium at-variant-dark">
                                        <div className="at-card-tag">Estado Inicial Institucional</div>
                                        <div className="at-score-hero-layout">
                                            <div className="at-score-circle">
                                                <span className="at-score-big-num">{Number(datosAuditoriafase1.promedioPorcentaje).toFixed(2)}</span>
                                                <span className="at-score-subtext">Media Global</span>
                                            </div>
                                            <h3 className="at-level-title">{datosAuditoriafase1.nivelCompassObj.nivel}</h3>
                                        </div>
                                        <div className="at-description-box"><p>{datosAuditoriafase1.nivelCompassObj.desc}</p></div>
                                        <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                                            <small style={{ color: '#c5a059' }}>📊 {datosAuditoriafase1.totalDocentes} docentes</small>
                                        </div>
                                    </section>

                                    <section className="at-cierre-card-premium at-variant-white">
                                        <h4 className="at-chart-title">Desempeño Grupal por Dimensión (Inicial)</h4>
                                        <div className="at-vertical-chart-area">
                                            {datasetAuditoria.map((item, idx) => {
                                                const isMin = item.valor === valorMinimo && item.valor < 5;
                                                return (
                                                    <div key={idx} className="at-chart-col">
                                                        <span className="at-col-val">{item.valor.toFixed(1)}</span>
                                                        <div className="at-col-track">
                                                            <div className={`at-col-fill ${isMin ? 'at-is-critical' : ''}`} style={{ height: `${(item.valor / 5) * 100}%` }}>
                                                                {isMin && <span className="at-alert-pulse"></span>}
                                                            </div>
                                                        </div>
                                                        <span className="at-col-label">{item.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {valorMinimo < 3 && (
                                            <div className="at-critical-alert-box">
                                                <span className="at-alert-icon">⚠️</span>
                                                <p>Brecha crítica institucional: <strong>{datasetAuditoria.find(d => d.valor === valorMinimo)?.label}</strong></p>
                                            </div>
                                        )}
                                    </section>
                                </div>

                                <div className="at-cierre-reflection-section">
                                    <div className="at-reflection-header">
                                        <h4>Reflexión sobre el Punto de Partida Institucional</h4>
                                        <ul className="at-reflection-prompts">
                                            <li>¿Qué decisiones institucionales eran más reactivas que estratégicas?</li>
                                            <li>¿Dónde no existía supervisión estructurada del uso de IA?</li>
                                            <li>¿Qué prácticas eran informales o desarticuladas a nivel institucional?</li>
                                        </ul>
                                    </div>
                                    <div className="at-reflection-input-group">
                                        <textarea
                                            className="at-reflection-textarea"
                                            readOnly={isReadOnly}
                                            placeholder="Escribe tu reflexión institucional aquí (mínimo 200 caracteres)..."
                                            value={formDataCierre.reflexionPuntoPartida}
                                            onChange={(e) => updateFormField("reflexionPuntoPartida", e.target.value)}
                                        />
                                        <div className={`at-char-counter ${formDataCierre.reflexionPuntoPartida.length >= 200 ? 'at-ready' : ''}`}>
                                            <span className="at-counter-number">{formDataCierre.reflexionPuntoPartida.length} / 200</span>
                                            <span className="at-counter-label">caracteres requeridos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FASE 2 */}
                        {cierreStep === 2 && (
                            <div className="at-c2-wrapper animate-slide-up">
                                <header className="at-c2-header-main">
                                    <div className="at-c2-badge-container"><span className="at-badge-success">Fase 2: Consolidación Institucional</span></div>
                                    <h2 className="at-c2-title">La evolución de tu institución</h2>
                                    <p className="at-c2-subtitle">Mira cuánto han avanzado los {datosGrupales.totalDocentes} docentes desde el diagnóstico inicial.</p>
                                </header>

                                <div className="at-c2-impact-grid">
                                    <div className="at-c2-card-stats at-variant-dark-gold">
                                        <div className="at-c2-growth-circle">
                                            <span className="at-c2-plus">+</span>
                                            <span className="at-c2-growth-num">{getComparativoAtlas().crecimiento}</span>
                                            <span className="at-c2-percent">%</span>
                                        </div>
                                        <h4>Crecimiento Institucional</h4>
                                        <p>Incremento grupal en madurez pedagógica</p>
                                    </div>

                                    <div className="at-c2-card-stats at-variant-white">
                                        <div className="at-c2-status-row">
                                            <div className="at-c2-status-item at-level-block">
                                                <label>Nivel Institucional Actual</label>
                                                <strong className="at-text-level">{generarDiagnostico(toPct(datosGrupales.promedioGlobal)).nivel}</strong>
                                            </div>
                                            <div className="at-c2-status-item">
                                                <label>Docentes N3+N4</label>
                                                <strong className="at-text-gold">{datosGrupales.distribucionNiveles.N3 + datosGrupales.distribucionNiveles.N4}</strong>
                                            </div>
                                            <div className="at-c2-status-item">
                                                <label>Alertas</label>
                                                <strong className="at-text-forest">-{alerts.length || 0} mitigadas</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="at-c2-comparison-container">
                                    <h4 className="at-c2-chart-title">Análisis Comparativo Grupal: Auditoría Inicial vs Sostenibilidad Actual</h4>
                                    <div className="at-c2-comparison-chart">
                                        {datasetAuditoria.map((item, idx) => (
                                            <div key={idx} className="at-c2-comp-row">
                                                <div className="at-c2-comp-label">{item.label}</div>
                                                <div className="at-c2-dual-track-container">
                                                    <div className="at-c2-track-path">
                                                        <div className="at-c2-bar-before" style={{ width: `${(item.valor / 5) * 100}%` }}>
                                                            <span className="at-c2-bar-label-val">{item.valor.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="at-c2-track-path">
                                                        <div className="at-c2-bar-after" style={{ width: `${(pD[idx] / 5) * 100}%` }}>
                                                            <span className="at-c2-bar-label-val">{(pD[idx] || 0).toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="at-c2-chart-legend">
                                        <span className="at-leg-before">Diagnóstico Inicial (Auditoría)</span>
                                        <span className="at-leg-after">Estado de Sostenibilidad (Promedio Grupal)</span>
                                    </div>
                                </div>

                                <div className="at-c2-reflection-section">
                                    <div className="at-reflection-header">
                                        <h4>Estado de Cumplimiento Institucional</h4>
                                        <ul className="at-reflection-prompts">
                                            <li>¿Cómo cambió la cultura institucional respecto al uso de IA?</li>
                                            <li>¿Cómo se garantiza ahora supervisión humana explícita a nivel institucional?</li>
                                            <li>¿Qué prácticas ya no dependen de voluntades individuales sino de política institucional?</li>
                                        </ul>
                                    </div>
                                    <div className="at-reflection-input-group">
                                        <textarea
                                            className="at-reflection-textarea"
                                            readOnly={isReadOnly}
                                            placeholder="Describe la transformación institucional (mínimo 300 caracteres)..."
                                            value={formDataCierre.estadoCumplimientoAsegurar}
                                            onChange={(e) => updateFormField("estadoCumplimientoAsegurar", e.target.value)}
                                        />
                                        <div className={`at-char-counter ${formDataCierre.estadoCumplimientoAsegurar.length >= 300 ? 'at-ready' : ''}`}>
                                            <span className="at-counter-number">{formDataCierre.estadoCumplimientoAsegurar.length} / 300</span>
                                            <span className="at-counter-label">caracteres requeridos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FASE 3 */}
                        {cierreStep === 3 && (
                            <div className="at-c3-wrapper animate-slide-up">
                                <header className="at-c2-header-main">
                                    <div className="at-c2-badge-container"><span className="at-badge-success">Fase 3: Análisis de Implementación Estratégica</span></div>
                                    <h2 className="at-c2-title">¿Cómo se ejecutó la estrategia institucional?</h2>
                                    <p className="at-c2-subtitle">Revisión del diagnóstico directivo y el plan de acción registrado en la fase ASEGURAR.</p>
                                </header>

                                {datosAsegurar.diagnostico ? (
                                    <div style={{ marginBottom: '28px' }}>
                                        <h4 style={{ color: '#1a237e', fontSize: '1rem', marginBottom: '14px', borderBottom: '2px solid #c5a059', paddingBottom: '6px' }}>
                                            🧭 Diagnóstico Directivo — Resultados del Radar ASEGURAR
                                        </h4>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #15203c 0%, #1e293b 100%)',
                                            borderRadius: '12px', padding: '16px 20px', marginBottom: '16px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
                                        }}>
                                            <div>
                                                <span style={{ color: '#c5a059', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Clasificación Final del Sistema</span>
                                                <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, marginTop: '4px' }}>
                                                    {datosAsegurar.diagnostico.clasificacion_final || 'Sin clasificación'}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ color: '#c5a059', fontSize: '0.75rem' }}>Puntaje Total Radar</span>
                                                <div style={{ color: 'white', fontSize: '1.8rem', fontWeight: 700 }}>
                                                    {parseFloat(datosAsegurar.diagnostico.puntaje_total_radar || 0).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        {(() => {
                                            const todasDims = [
                                                { label: 'Gobernanza', keys: ['gobernanza_1_politica', 'gobernanza_2_responsable', 'gobernanza_3_evaluacion_htas', 'gobernanza_4_protocolo_incidentes'], color: '#8b5cf6' },
                                                { label: 'Competencia', keys: ['competencia_1_etica', 'competencia_2_unesco_levels', 'competencia_3_plan_progresivo', 'competencia_4_reflexion_critica'], color: '#06b6d4' },
                                                { label: 'Datos', keys: ['datos_1_protocolo_estudiantes', 'datos_2_anonimizacion', 'datos_3_terminos_htas', 'datos_4_almacenamiento'], color: '#f59e0b' },
                                                { label: 'Supervisión', keys: ['supervision_1_decision_humana', 'supervision_2_no_automatizada', 'supervision_3_monitoreo_ia', 'supervision_4_revision_practicas'], color: '#22c55e' },
                                                { label: 'Transparencia', keys: ['transparencia_1_informa_estud', 'transparencia_2_lineamientos_uso', 'transparencia_3_alfabetizacion', 'transparencia_4_declaracion_pub'], color: '#ec4899' }
                                            ];
                                            const conPromedios = todasDims.map(d => ({
                                                ...d,
                                                prom: d.keys.reduce((acc, k) => acc + parseFloat(datosAsegurar.diagnostico[k] || 0), 0) / d.keys.length
                                            }));
                                            return (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                                                    {conPromedios.map((dim, i) => {
                                                        const pct = (dim.prom / 4) * 100;
                                                        return (
                                                            <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '12px', border: `2px solid ${dim.color}20`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>{dim.label}</div>
                                                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: dim.color }}>
                                                                    {dim.prom.toFixed(1)}<small style={{ fontSize: '0.7rem', color: '#94a3b8' }}>/4</small>
                                                                </div>
                                                                <div style={{ marginTop: '6px', height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                                                    <div style={{ height: '100%', width: `${pct}%`, background: dim.color, borderRadius: '99px' }}></div>
                                                                </div>
                                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>{pct.toFixed(0)}%</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px', color: '#94a3b8' }}>
                                        <p>📋 No se encontró diagnóstico directivo. Completa primero la fase ASEGURAR para ver este análisis.</p>
                                    </div>
                                )}

                                {datosAsegurar.planAccion ? (
                                    <div style={{ marginBottom: '28px' }}>
                                        <h4 style={{ color: '#1a237e', fontSize: '1rem', marginBottom: '14px', borderBottom: '2px solid #c5a059', paddingBottom: '6px' }}>
                                            🏗️ Plan Estratégico de Acción — ASEGURAR
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                            {[
                                                { label: '🎯 Objetivo Estratégico', value: datosAsegurar.planAccion.objetivo_estrategico, full: true },
                                                { label: '🛠️ Acciones Seleccionadas', value: datosAsegurar.planAccion.acciones_seleccionadas, full: false },
                                                { label: '👤 Responsables', value: datosAsegurar.planAccion.responsables_asignados, full: false },
                                                { label: '📅 Cronograma', value: datosAsegurar.planAccion.cronograma_estimado, full: false },
                                                { label: '⚡ Prioridad', value: datosAsegurar.planAccion.dimension_prioridad_1, full: false },
                                                { label: '📈 Indicadores de Éxito', value: datosAsegurar.planAccion.indicadores_exito, full: true }
                                            ].map((campo, i) => campo.value ? (
                                                <div key={i} style={{ gridColumn: campo.full ? '1 / -1' : 'auto', background: 'white', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>{campo.label}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                                                        {typeof campo.value === 'string' ? campo.value : JSON.stringify(campo.value)}
                                                    </div>
                                                </div>
                                            ) : null)}
                                        </div>
                                        <div style={{ marginTop: '14px', padding: '12px 16px', background: 'linear-gradient(90deg, #f0fdf4, #dcfce7)', borderRadius: '10px', border: '1px solid #86efac', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600 }}>
                                                ✅ Plan estratégico registrado — Estado: {datosAsegurar.planAccion.status || 'COMPLETADO'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px', color: '#94a3b8' }}>
                                        <p>📋 No se encontró plan de acción. Completa primero la fase ASEGURAR para ver este análisis.</p>
                                    </div>
                                )}

                                <div className="at-c2-reflection-section">
                                    <div className="at-reflection-header">
                                        <h4>Análisis de la Implementación Institucional</h4>
                                        <p className="at-reflection-subtext">Con base en el diagnóstico y el plan de acción mostrados arriba, describe cómo se ejecutaron las acciones.</p>
                                    </div>
                                    <div className="at-reflection-input-group">
                                        <textarea
                                            className="at-reflection-textarea"
                                            readOnly={isReadOnly}
                                            placeholder="Analiza la implementación institucional (mínimo 150 caracteres)..."
                                            value={formDataCierre.analisisImplementacion}
                                            onChange={(e) => updateFormField("analisisImplementacion", e.target.value)}
                                        />
                                        <div className={`at-char-counter ${formDataCierre.analisisImplementacion.length >= 150 ? 'at-ready' : ''}`}>
                                            <span className="at-counter-number">{formDataCierre.analisisImplementacion.length} / 150</span>
                                            <span className="at-counter-label">caracteres</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FASE 4 */}
                        {cierreStep === 4 && (() => {
                            const comp = getComparativoAtlas();
                            return (
                                <div className="at-c4-wrapper animate-slide-up">
                                    <header className="at-c4-header-main">
                                        <div className="at-c4-badge-container"><span className="at-badge-gold">Certificación Institucional ATLAS 2026</span></div>
                                        <h2 className="at-c4-title">Evolución Institucional ATLAS</h2>
                                        <p className="at-c4-subtitle">Consolidación de evidencias grupales: De la Auditoría a la Sostenibilidad Colectiva.</p>
                                    </header>

                                    <div className="at-c4-report-card">
                                        <div className="at-c4-report-header">
                                            <div className="at-c4-logo-section">
                                                <div className="at-c4-brand">ATLAS <span>PROJECT</span></div>
                                                <div className="at-c4-docente-info">
                                                    <strong>INSTITUCIÓN:</strong> {userData?.empresa_nombre || "—"}<br />
                                                    <strong>DIRECTIVO:</strong> {userData?.nombre_completo} | {new Date().toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="at-c4-stamp-seal"><div className="seal-inner">2026</div><span>CERTIFICADO</span></div>
                                        </div>

                                        <div className="at-c4-comparison-layout">
                                            <div className="at-c4-col-before">
                                                <h4 className="at-c4-col-title">Punto de Partida Grupal</h4>
                                                <div className="at-c4-main-metric">
                                                    <span className="at-val">{Number(datosAuditoriafase1.promedioPorcentaje).toFixed(1)}<small className="at-symbol-pct">%</small></span>
                                                    <span className="at-lbl">Diagnóstico Inicial</span>
                                                </div>
                                                <div className="at-c4-status-desc">
                                                    <strong>Nivel: {comp.nivelAntes}</strong>
                                                    <p>{getCompassData(datosAuditoriafase1.promedioPorcentaje).desc}</p>
                                                </div>
                                                <div className="at-c4-mini-stats">
                                                    <span>Docentes evaluados: {datosAuditoriafase1.totalDocentes}</span>
                                                    <span>Media auditoría: {Number(datosAuditoriafase1.promedioGlobal).toFixed(2)}/5</span>
                                                </div>
                                            </div>

                                            <div className="at-c4-divider">
                                                <div className="at-c4-impact-orb">
                                                    <span className="at-orb-plus">+</span>
                                                    <span className="at-orb-val">{comp.crecimiento}</span>
                                                    <span className="at-orb-pct">%</span>
                                                </div>
                                                <div className="at-c4-missions-badge">
                                                    <strong>{retos.filter(r => (r.status_reto || '').toUpperCase() === 'COMPLETADO').length}</strong>
                                                    <span>Misiones</span>
                                                </div>
                                            </div>

                                            <div className="at-c4-col-after">
                                                <h4 className="at-c4-col-title">Madurez Institucional Actual</h4>
                                                <div className="at-c4-main-metric gold">
                                                    <span className="at-val">{huellaCompleta ? huellaCompleta.huella_total : "0.0"}<small className="at-symbol-pct">%</small></span>
                                                    <span className="at-lbl">Huella COMPASS Institucional</span>
                                                </div>
                                                <div className="at-c4-status-desc">
                                                    <strong>{comp.nivelAhora}</strong>
                                                    <p>{generarDiagnostico(huellaCompleta ? huellaCompleta.huella_total : 0).texto}</p>
                                                </div>
                                                <div className="at-c4-mini-stats">
                                                    <span className="at-text-gold">N3+N4: {datosGrupales.distribucionNiveles.N3 + datosGrupales.distribucionNiveles.N4} docentes</span>
                                                    <span className="at-text-gold">Promedio: {datosGrupales.promedioGlobal}/5</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="at-c4-narrative-section">
                                            <h5 className="at-section-subtitle">Trayectoria Reflexiva Institucional</h5>
                                            <div className="at-narrative-grid">
                                                <div className="at-narrative-box">
                                                    <label>Visión Inicial</label>
                                                    <p>{formDataCierre.reflexionPuntoPartida.length > 5
                                                        ? `"${formDataCierre.reflexionPuntoPartida.substring(0, 200)}..."`
                                                        : `Al inicio, la institución presentaba una brecha crítica en ${datasetAuditoria.find(d => d.valor === valorMinimo)?.label}.`}</p>
                                                </div>
                                                <div className="at-narrative-box gold">
                                                    <label>Visión Transformada</label>
                                                    <p>{formDataCierre.estadoCumplimientoAsegurar.length > 5
                                                        ? `"${formDataCierre.estadoCumplimientoAsegurar.substring(0, 200)}..."`
                                                        : "A través del ciclo ATLAS, se han consolidado prácticas institucionales de supervisión humana activa."}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {statsPrompt && (
                                            <div className="at-c4-ethic-summary">
                                                <h5><span className="dot l"></span> Dictamen de Liderazgo Ético UNESCO — Grupal</h5>
                                                <div className="at-c4-ethic-bars">
                                                    {[
                                                        { l: 'Privacidad y Seguridad', v: statsPrompt.priv, c: '#06b6d4' },
                                                        { l: 'Agencia Humana', v: statsPrompt.agen, c: '#f59e0b' },
                                                        { l: 'Propósito Pedagógico', v: statsPrompt.etica, c: '#8b5cf6' }
                                                    ].map(d => (
                                                        <div key={d.l} className="at-c4-bar-row">
                                                            <div className="at-bar-label"><span>{d.l}</span> <strong>{d.v}/5</strong></div>
                                                            <div className="at-bar-track">
                                                                <div className="at-bar-fill" style={{ width: `${(parseFloat(d.v) / 5) * 100}%`, backgroundColor: d.c }}></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="at-c4-double-stats">
                                            <div className="at-c4-tech-block">
                                                <h5><span className="dot t"></span> Misiones Superadas</h5>
                                                <div className="at-c4-tags-container">
                                                    {retos.filter(r => (r.status_reto || '').toUpperCase() === 'COMPLETADO').length > 0 ? (
                                                        retos.filter(r => (r.status_reto || '').toUpperCase() === 'COMPLETADO').map((r, i) => (
                                                            <div key={i} className="at-mission-card-mini">
                                                                <span className="check">✓</span>
                                                                <div className="info">
                                                                    <strong>{r.nombre_reto}</strong>
                                                                    <small>{r.nivel_unesco || 'Nivel Avanzado'}</small>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : <p className="at-empty-text">No se registraron misiones completadas aún.</p>}
                                                </div>
                                            </div>

                                            <div className="at-c4-alerts-section">
                                                <h5><span className="dot a"></span> Gestión de Riesgos Institucionales</h5>
                                                <div className="at-c4-alerts-grid">
                                                    {alerts.length > 0 ? alerts.slice(0, 2).map((a, i) => (
                                                        <div key={i} className="at-alert-item-resolved">
                                                            <span className="icon">🛡️</span>
                                                            <p>{a}</p>
                                                        </div>
                                                    )) : (
                                                        <div className="at-alert-item-resolved success">
                                                            <span className="icon">✅</span>
                                                            <p>Ciclo finalizado sin brechas de seguridad activas.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="at-c4-quality-checks">
                                            <div className="at-check-row">
                                                <span className={`pill ${parseFloat(statsPrompt?.priv) >= 3 ? 'on' : ''}`}>🛡️ Privacidad UNESCO</span>
                                                <span className={`pill ${parseFloat(statsPrompt?.agen) >= 3 ? 'on' : ''}`}>👤 Agencia Humana</span>
                                                <span className={`pill ${parseFloat(selectedFormReal?.desviacion) < 1.8 ? 'on' : ''}`}>📊 Consistencia ATLAS</span>
                                                <span className={`pill ${datosGrupales.totalDocentes > 0 ? 'on' : ''}`}>♻️ Sostenibilidad</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* FASE 5 */}
                        {cierreStep === 5 && (() => {
                            const dims = [
                                { nombre: 'Uso', valor: datasetAuditoria[0]?.valor || 0 },
                                { nombre: 'Ética', valor: datasetAuditoria[1]?.valor || 0 },
                                { nombre: 'Impacto', valor: datasetAuditoria[2]?.valor || 0 },
                                { nombre: 'Desarrollo', valor: datasetAuditoria[3]?.valor || 0 },
                            ];
                            const oportunidad = [...dims].sort((a, b) => a.valor - b.valor)[0]?.nombre;
                            const nivelActual = parseFloat(datosGrupales.promedioGlobal);
                            const sugiereCertificacion = nivelActual >= 3.8;

                            return (
                                <div className="at-c5-roadmap-container animate-slide-up">
                                    <div className="at-c5-header">
                                        <span className="at-c5-badge">Fase 5: Proyección Institucional</span>
                                        <h2 className="at-c5-title">Decisión Estratégica Institucional</h2>
                                        <div className="at-c5-insight-box">
                                            <span className="at-c5-insight-label">Diagnóstico Automático:</span>
                                            <p>Nivel institucional promedio: <strong>{nivelActual.toFixed(2)}/5 ({toPct(nivelActual)}%)</strong> →
                                                {sugiereCertificacion
                                                    ? <span style={{ color: '#22c55e' }}> ✅ Se sugiere avanzar hacia Certificación ATLAS</span>
                                                    : <span style={{ color: '#f59e0b' }}> 🔷 Se sugiere Consolidar y Sostener primero</span>}
                                            </p>
                                            <p>Dimensión con mayor oportunidad de mejora: <strong>{oportunidad}</strong></p>
                                            <p>Docentes en niveles estratégicos (N3+N4): <strong>{datosGrupales.distribucionNiveles.N3 + datosGrupales.distribucionNiveles.N4} de {datosGrupales.totalDocentes}</strong></p>
                                        </div>
                                    </div>

                                    <div className="at-c5-roadmap-card">
                                        <div className="at-c5-v2-grid-wrapper">
                                            {['Ruta A: Sostener y Consolidar', 'Ruta B: Avanzar hacia Certificación ATLAS'].map(ruta => {
                                                const isSelected = formDataCierre.rutaElegida === ruta;
                                                const esSugerida = (ruta.includes('Consolidar') && !sugiereCertificacion) || (ruta.includes('Certificación') && sugiereCertificacion);
                                                return (
                                                    <button
                                                        key={ruta}
                                                        type="button"
                                                        disabled={isReadOnly}
                                                        onClick={() => updateFormField("rutaElegida", ruta)}
                                                        className={`at-c5-v2-card-btn ${isSelected ? 'is-selected' : ''}`}
                                                    >
                                                        {esSugerida && <span className="at-c5-v2-badge-sugerida">Ruta Recomendada</span>}
                                                        <div className="at-c5-v2-status-circle">✓</div>
                                                        <h4 className="at-c5-v2-route-title">{ruta}</h4>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="at-c5-form-grid">
                                            <div className="at-c5-field full">
                                                <label className="at-c5-label">
                                                    1. Prioridad estratégica institucional (próximos 12 meses):
                                                    <span className={formDataCierre.prioridadEstrategicaAnual?.length < 150 ? "at-char-count error" : "at-char-count"}>
                                                        ({formDataCierre.prioridadEstrategicaAnual?.length || 0}/150 caracteres)
                                                    </span>
                                                </label>
                                                <textarea
                                                    className="at-c5-textarea" readOnly={isReadOnly}
                                                    placeholder="¿Cuál es la prioridad estratégica institucional principal? (mínimo 150 caracteres)"
                                                    value={formDataCierre.prioridadEstrategicaAnual}
                                                    onChange={(e) => updateFormField("prioridadEstrategicaAnual", e.target.value)}
                                                />
                                            </div>

                                            <div className="at-c5-field full">
                                                <label className="at-c5-label"> 2. Acción concreta a nivel de gobernanza:</label>
                                                <textarea
                                                    className="at-c5-textarea" readOnly={isReadOnly}
                                                    placeholder="¿Qué acción específica de gobernanza implementará la institución?"
                                                    value={formDataCierre.accionGobernanza}
                                                    onChange={(e) => updateFormField("accionGobernanza", e.target.value)}
                                                />
                                            </div>

                                            <div className="at-c5-field">
                                                <label className="at-c5-label"> 3. Indicador medible:</label>
                                                <input
                                                    type="text" className="at-c5-input" readOnly={isReadOnly}
                                                    placeholder="¿Cómo medirá la institución el éxito?"
                                                    value={formDataCierre.indicadorMedible}
                                                    onChange={(e) => updateFormField("indicadorMedible", e.target.value)}
                                                />
                                            </div>

                                            <div className="at-c5-field">
                                                <label className="at-c5-label"> 4. Calendario de revisión institucional:</label>
                                                <input
                                                    type="date" className="at-c5-input-date" readOnly={isReadOnly}
                                                    value={formDataCierre.fechaRevisionInstitucional}
                                                    onChange={(e) => updateFormField("fechaRevisionInstitucional", e.target.value)}
                                                />
                                            </div>

                                            <div className="at-c5-field full">
                                                <label className="at-c5-label"> 5. Estrategia de comunicación institucional de IA:</label>
                                                <textarea
                                                    className="at-c5-textarea" readOnly={isReadOnly}
                                                    placeholder="¿Cómo comunicará la institución el uso responsable de IA a toda la comunidad educativa?"
                                                    value={formDataCierre.estrategiaComunicacion}
                                                    onChange={(e) => updateFormField("estrategiaComunicacion", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="at-c5-footer-quote">
                                            <div className="at-quote-line"></div>
                                            <p className="at-main-quote">"Sostener no es repetir acciones. Es institucionalizar buenas prácticas."</p>
                                            <p className="at-sub-quote">Esta hoja de ruta se guardará en el ciclo institucional al finalizar.</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="cierre-actions-footer">
                            {cierreStep > 1 && (
                                <button className="btn-sos-secondary" onClick={() => setCierreStep(cierreStep - 1)}>Anterior</button>
                            )}
                            <button className="btn-sos-primary btn-large" disabled={loading} onClick={handleNextStep}>
                                {loading ? "Guardando..." : cierreStep === 5
                                    ? (isReadOnly ? "Finalizar Consulta" : "Finalizar Ciclo Institucional e Integrar")
                                    : "Siguiente Etapa →"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================== MODAL ANÁLISIS ======================== */}
            {showModal && (
                <div className="atl-an-overlay">
                    <div className="atl-an-modal wide animate-fade-in">
                        <div className="atl-an-modal-head">
                            <div className="atl-an-modal-head-flex">
                                <div>
                                    <h3>Reporte Institucional: {userData?.empresa_nombre}</h3>
                                    <p className="atl-an-modal-sub">
                                        Marco COMPASS — Ciclo Sostener Institucional 2026 ({datosGrupales.totalDocentes} docentes)
                                    </p>
                                </div>
                                <button className="atl-an-close" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <div className="modal-tabs-margin">
                                <button className={viewModeModal === 'stats' ? 'active' : ''} onClick={() => setViewModeModal('stats')}>Análisis</button>
                                <button className={viewModeModal === 'survey' ? 'active' : ''} onClick={() => setViewModeModal('survey')}>Dimensiones</button>
                            </div>
                        </div>

                        <div className="atl-an-modal-body">
                            {viewModeModal === 'stats' ? (
                                <div className="stats-view">
                                    <div className="atl-an-metrics-grid">
                                        <div className="atl-an-mini-box-dark">
                                            <span className="atl-an-val-primary">{huellaCompleta ? `${huellaCompleta.huella_total}%` : "—"}</span>
                                            <span className="atl-an-lbl">MEDIA GRUPAL GLOBAL</span>
                                        </div>
                                        <div className="atl-an-mini-box-dark">
                                            <span className="atl-an-val-small">{generarDiagnostico(toPct(datosGrupales.promedioGlobal)).nivel}</span>
                                            <span className="atl-an-lbl">NIVEL INSTITUCIONAL</span>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '12px', padding: '12px', background: '#f1f5f9', borderRadius: '8px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                                            {[
                                                { l: 'N1', v: datosGrupales.distribucionNiveles.N1, c: '#f87171' },
                                                { l: 'N2', v: datosGrupales.distribucionNiveles.N2, c: '#fbbf24' },
                                                { l: 'N3', v: datosGrupales.distribucionNiveles.N3, c: '#34d399' },
                                                { l: 'N4', v: datosGrupales.distribucionNiveles.N4, c: '#c5a059' }
                                            ].map(n => (
                                                <div key={n.l}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: n.c }}>{n.v}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Nivel {n.l}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="atl-an-insight-card-individual">
                                        <h4 className="insight-title">💡 Diagnóstico Institucional</h4>
                                        <p className="insight-text">{generarDiagnostico(toPct(datosGrupales.promedioGlobal)).texto}</p>
                                        <h4 className="insight-sub-title">🔍 Implicación</h4>
                                        <p className="insight-sub-text">{generarDiagnostico(toPct(datosGrupales.promedioGlobal)).implicacion}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="survey-view">
                                    {dimensiones.map((d, i) => (
                                        <div key={d.id} className="atl-an-bar-container-margin">
                                            <div className="atl-an-bar-label-row-bold">
                                                <span>{d.nombre}</span>
                                                <span>{toPct(pD[i])}%</span>
                                            </div>
                                            <div className="atl-an-bar-bg-light">
                                                <div className="atl-an-bar-fill-primary" style={{ width: `${toPct(pD[i])}%` }}></div>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                                                Promedio grupal: {pD[i].toFixed(2)}/5
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="atl-an-btn-full" onClick={() => setShowModal(false)}>Cerrar Reporte Institucional</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuloSostenerDirectivo;
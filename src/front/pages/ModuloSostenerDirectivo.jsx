import React, { useState, useEffect, useRef } from "react";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    BarChart, Bar, Cell
} from "recharts";
import Swal from "sweetalert2";
import "../Styles/moduloSostener.css";

const ModuloSostenerDirectivo = ({ userData, apiFetch, onNavigate, datosExistentes }) => {
    const [view, setView] = useState("menu");
    const [respuestas, setRespuestas] = useState({});
    const [loading, setLoading] = useState(false);
    const [historial, setHistorial] = useState(datosExistentes || []);

    // Estados para la integración de Retos y Prompts
    const [retos, setRetos] = useState([]);
    const [promptData, setPromptData] = useState(null);
    const [viewModeModal, setViewModeModal] = useState('stats'); // 'stats' o 'survey'
    const [showModal, setShowModal] = useState(false);

    const [selectedFormReal, setSelectedFormReal] = useState(null);
    const [viewModeReal, setViewModeReal] = useState('stats'); // 'stats' o 'survey'

    const [showModalReal, setShowModalReal] = useState(false);

    const [auditarDosMedia, setAuditarDosMedia] = useState(null);

    const [huellaCompleta, setHuellaCompleta] = useState(null);

    const cierreTopRef = useRef(null);


    const [balanceGlobal, setBalanceGlobal] = useState({
        antes: { nivel: "Cargando...", dimensionBaja: "...", puntaje: 0 },
        ahora: { nivel: "...", dimensionAlta: "...", puntaje: 0 },
        evidencias: { retos: 0, notasLiderar: null },
        crecimiento: 0
    });

    const [cierreStep, setCierreStep] = useState(1);
    const [showCierre, setShowCierre] = useState(false);
    const [formDataCierre, setFormDataCierre] = useState({
        reflexionAntes: "",
        reflexionDespues: "",
        aprendizajeClave: "",
        aprendizajeDetalle: "",
        prioridadSostener: "",
        compromisoAccion: "",
        evidenciaMejora: "",
        fechaRevision: ""
    });

    const [auditarDos, setAuditarDos] = useState(null);   // {existe, auditar, detalle}


    const dimensiones = [
        {
            id: "D1", nombre: "Uso Pedagógico Estratégico", preguntas: [
                { id: 1, text: "Utilizo IA con un propósito pedagógico claramente definido." },
                { id: 2, text: "La IA apoya objetivos de aprendizaje explícitos, no solo tareas administrativas." },
                { id: 3, text: "Reviso críticamente los resultados generados por la IA antes de usarlos." },
                { id: 4, text: "Ajusto el uso de IA según el perfil y necesidades de mis estudiantes." },
                { id: 5, text: "Integro la IA como complemento, no como reemplazo de mi criterio profesional." },
                { id: 6, text: "Evalúo si el uso de IA realmente mejora la experiencia de aprendizaje." }
            ]
        },
        {
            id: "D2", nombre: "Ética y Protección de Datos", preguntas: [
                { id: 7, text: "Verifico que las herramientas de IA respeten principios de privacidad." },
                { id: 8, text: "Evito compartir datos sensibles de estudiantes en plataformas externas." },
                { id: 9, text: "Informo a mis estudiantes cuando utilizo IA en procesos pedagógicos." },
                { id: 10, text: "Identifico posibles sesgos en los resultados generados por IA." },
                { id: 11, text: "Intervengo cuando detecto contenido potencialmente inadecuado." },
                { id: 12, text: "Conozco las políticas institucionales sobre uso de IA." }
            ]
        },
        {
            id: "D3", nombre: "Impacto en el Aprendizaje", preguntas: [
                { id: 13, text: "La IA me permite ofrecer retroalimentación más personalizada." },
                { id: 14, text: "He observado mejoras en autonomía estudiantil gracias al uso de IA." },
                { id: 15, text: "Uso IA para diferenciar actividades según niveles." },
                { id: 16, text: "La IA reduce carga operativa sin afectar calidad pedagógica." },
                { id: 17, text: "Evalúo periódicamente si el uso de IA está generando resultados positivos." },
                { id: 18, text: "Ajusto mi práctica cuando la IA no aporta valor real." }
            ]
        },
        {
            id: "D4", nombre: "Desarrollo Profesional", preguntas: [
                { id: 19, text: "Me actualizo sobre nuevas aplicaciones educativas de IA." },
                { id: 20, text: "Participo en conversaciones o comunidades sobre uso responsable de IA." },
                { id: 21, text: "Reflexiono sobre mi dependencia o equilibrio frente a la tecnología." },
                { id: 22, text: "Comparto buenas prácticas con otros docentes." },
                { id: 23, text: "Documento experiencias significativas de uso." },
                { id: 24, text: "Busco formación adicional cuando identifico vacíos en mi competencia." }
            ]
        }
    ];

    const getCompassData = (score) => {
        if (score >= 90) return {
            nivel: "Gobernanza madura",
            rango: "90–100",
            desc: `Tu integración de IA va más allá del aula.
            
Estás aplicando supervisión humana significativa, documentando decisiones, evaluando impacto y contribuyendo a lineamientos institucionales.

Tu práctica está alineada con principios internacionales de IA confiable, ética y gobernanza educativa. No solo usas IA con intención pedagógica. Participas en la construcción de una cultura institucional responsable.

El desafío en este nivel no es usar más IA, sino sostener calidad, coherencia y liderazgo. Puedes avanzar las demás fases y convertirte en un gran referente en el ecosistema ATLAS.`
        };

        if (score >= 75) return {
            nivel: "Integración estratégica",
            rango: "75–89",
            desc: `La IA está integrada de manera coherente y estratégica en tu práctica.
            
No solo la utilizas con intención curricular, sino que también incorporas criterios de uso responsable, supervisión humana explícita y evaluación ajustada. Existe conciencia institucional en tu práctica. Posiblemente ya influyes en otros colegas y contribuyes a conversaciones sobre lineamientos.

Tu resto ahora es avanzar hacia gobernanza:
• Documentar procesos.
• Escalar dilemas éticos cuando sea necesario.
• Contribuir activamente a la construcción de criterios institucionales.

Tu práctica es consistente y replicable.`
        };

        if (score >= 60) return {
            nivel: "Integración pedagógica",
            rango: "60–74",
            desc: `La IA ya forma parte de tu diseño pedagógico con intención clara.
            
Estás vinculando su uso con objetivos curriculares específicos y realizando ajustes en evaluación. Además, demuestras conciencia sobre riesgos éticos y aplicas supervisión humana en tus decisiones. Tu práctica refleja alineación con estándares internacionales de integración pedagógica responsable.

Sin embargo, aún puedes fortalecer:
• La documentación de tus decisiones.
• La articulación con lineamientos institucionales.
• La evaluación del impacto real del uso de IA en el aprendizaje.

Ya no estás experimentando. Estás integrando.`
        };

        if (score >= 40) return {
            nivel: "Uso incipiente",
            rango: "40–59",
            desc: `Ya estás utilizando IA en tu práctica, pero principalmente de forma instrumental u ocasional.
            
Tu uso muestra intención, aunque aún no es completamente sistemático en términos de evaluación, documentación o criterios éticos explícitos. Probablemente ya reconoces algunos riesgos y tienes nociones básicas de supervisión humana, pero todavía no hay una integración estructurada con lineamientos institucionales o impacto medible.

Tu siguiente paso es avanzar de la eficiencia a la coherencia pedagógica. Pregúntate:
• ¿Estoy ajustando mis criterios de evaluación cuando uso IA?
• ¿Estoy comunicando claramente límites y riesgos a mis estudiantes?
• ¿Estoy documentando mis decisiones?

Estás construyendo bases importantes.`
        };

        return {
            nivel: "Exploración",
            rango: "0–39",
            desc: `Hoy te encuentras en una etapa inicial de aproximación a la inteligencia artificial en educación.
            
Esto significa que el uso de IA en tu práctica es limitado o aún no está integrado de manera estructurada al currículo, la evaluación o los principios éticos. Puede que exista interés o curiosidad, pero todavía no se evidencia una integración pedagógica planificada ni una comprensión sólida de los riesgos y responsabilidades asociados.

Este resultado no es una debilidad.

Estás en el inicio del camino ATLAS.`
        };
    };

    // Asegúrate de tener este estado declarado arriba de tus funciones
    const [respuestasAuditarReal, setRespuestasAuditarReal] = useState([]);

    const generarDiagnostico = (puntaje) => {
        const p = parseFloat(puntaje);

        if (p >= 90) return {
            nivel: "Referente Institucional de Vanguardia",
            texto: `
Tu perfil refleja una integración madura, ética y estratégicamente documentada de la inteligencia artificial.

No solo utilizas IA con intención pedagógica clara, sino que ejerces supervisión humana explícita, evalúas impacto en aprendizaje y contribuyes activamente a la gobernanza institucional.

Tu práctica ya no es instrumental: es sistémica. Existe coherencia entre propósito curricular, protección de datos, evaluación crítica y desarrollo profesional continuo.

Este nivel indica que tu uso de IA es sostenible en el tiempo y puede convertirse en modelo replicable dentro de tu institución.
        `,
            implicacion: `
La institución puede apoyarse en tu experiencia para fortalecer lineamientos, acompañar a otros docentes y consolidar procesos de certificación o validación externa.
        `,
            accion: `
• Liderar comunidades de práctica.
• Documentar casos de impacto medible.
• Diseñar microformaciones internas.
• Participar en construcción de política institucional de IA.
        `
        };

        if (p >= 80) return {
            nivel: "Docente Estratégico Consolidado",
            texto: `
Tu integración de IA es sólida y coherente con objetivos de aprendizaje. 

Existe intención pedagógica clara, revisión crítica de resultados generados y conciencia ética en el manejo de datos y posibles sesgos.

Estás operando en un nivel donde la IA deja de ser herramienta aislada y se convierte en recurso estratégico dentro de tu diseño didáctico.
        `,
            implicacion: `
El siguiente paso no es usar más tecnología, sino medir con mayor precisión el impacto en autonomía, pensamiento crítico y diferenciación pedagógica.
        `,
            accion: `
• Implementar métricas comparativas antes/después.
• Profundizar en personalización avanzada.
• Sistematizar evidencias de mejora.
        `
        };

        if (p >= 60) return {
            nivel: "Integrador en Evolución",
            texto: `
Has superado la fase meramente instrumental. La IA ya forma parte de tu práctica con intención pedagógica identificable.

Sin embargo, aún existen oportunidades para fortalecer la dimensión ética, la documentación de impacto y la sistematicidad del proceso.

Tu integración es funcional, pero puede volverse más estratégica y medible.
        `,
            implicacion: `
El crecimiento en este nivel depende de consolidar supervisión humana explícita, fortalecer protección de datos y evaluar resultados de aprendizaje más allá de la eficiencia operativa.
        `,
            accion: `
• Diseñar secuencias didácticas donde la IA tenga rol definido y evaluable.
• Revisar políticas institucionales de protección de datos.
• Iniciar registro estructurado de experiencias.
        `
        };

        if (p >= 40) return {
            nivel: "Explorador Inicial",
            texto: `
Te encuentras en una fase de aproximación activa a la inteligencia artificial.

El uso actual muestra interés y apertura, pero aún predomina un enfoque funcional u ocasional. La integración no es completamente sistemática ni alineada con objetivos curriculares explícitos.

Existe riesgo de automatización sin evaluación profunda del impacto pedagógico.
        `,
            implicacion: `
El desafío en esta etapa no es incorporar más herramientas, sino comprender mejor cuándo, cómo y para qué usarlas dentro de un marco ético y estratégico.
        `,
            accion: `
• Formular objetivos de aprendizaje antes de usar IA.
• Practicar revisión crítica sistemática de resultados generados.
• Participar en formación específica sobre ética y sesgos.
        `
        };

        return {
            nivel: "Fase de Alfabetización Instrumental",
            texto: `
Actualmente el uso de IA en tu práctica es limitado o principalmente operativo.

No se evidencia aún una integración pedagógica estructurada ni una conciencia consolidada sobre riesgos de privacidad, sesgos o dependencia automatizada.

Este resultado no representa una debilidad, sino un punto de partida claro para iniciar un proceso formativo consciente.
        `,
            implicacion: `
El progreso dependerá de fortalecer comprensión conceptual antes de escalar el uso con estudiantes.
        `,
            accion: `
• Comprender principios básicos de protección de datos.
• Explorar casos de uso pedagógico con acompañamiento.
• Reflexionar sobre el rol insustituible del criterio docente.
        `
        };
    };

    // ===============================
    // 🎯 MICRO RECOMENDACIONES
    // ===============================

    const dimensionRecommendations = {
        uso: {
            basic: [
                "Antes de usar IA, formula explícitamente el objetivo de aprendizaje.",
                "Define qué parte del proceso requiere tu juicio profesional.",
                "Diseña una actividad donde la IA apoye diferenciación pedagógica."
            ],
            medium: [
                "Mide impacto en aprendizaje, no solo eficiencia.",
                "Diseña una secuencia didáctica donde la IA tenga rol claro y medible.",
                "Reflexiona si alguna tarea está siendo automatizada sin necesidad."
            ],
            advanced: [
                "Documenta una experiencia de alto impacto.",
                "Comparte una práctica en comunidad docente.",
                "Experimenta con mejora incremental basada en evidencia."
            ]
        },

        etica: {
            basic: [
                "Revisa la política institucional de IA.",
                "Evita ingresar datos identificables en herramientas externas.",
                "Verifica términos de uso de plataformas."
            ],
            medium: [
                "Analiza un caso de posible sesgo algorítmico.",
                "Explicita a estudiantes cuándo y cómo usas IA.",
                "Incorpora revisión humana sistemática."
            ],
            advanced: [
                "Lidera conversación institucional sobre riesgos emergentes.",
                "Diseña una guía corta para estudiantes.",
                "Apoya procesos de revisión institucional."
            ]
        },

        impacto: {
            basic: [
                "Define un indicador concreto de mejora.",
                "Evalúa resultados antes y después del uso de IA.",
                "Ajusta herramientas que no aporten valor."
            ],
            medium: [
                "Implementa medición más sistemática.",
                "Diseña experiencia personalizada con IA.",
                "Solicita retroalimentación directa."
            ],
            advanced: [
                "Sistematiza evidencia.",
                "Presenta resultados en espacio académico.",
                "Conviértete en mentor interno."
            ]
        },

        desarrollo: {
            basic: [
                "Agenda una sesión de formación sobre IA educativa.",
                "Únete a comunidad interna o externa.",
                "Inicia bitácora mensual."
            ],
            medium: [
                "Profundiza en tema específico.",
                "Publica o comparte experiencia.",
                "Solicita retroalimentación de pares."
            ],
            advanced: [
                "Diseña microformación para colegas.",
                "Participa en proyectos piloto.",
                "Apoya diseño de lineamientos institucionales."
            ]
        }
    };

    const getMetricasAuditoria = () => {
        const r = respuestasAuditarReal;

        // Promedia los puntos de las preguntas cuyo orden cae en el rango dado
        const promPorOrden = (ordenes) => {
            const filtradas = r.filter(q => ordenes.includes(Number(q.Orden_Pregunta)));
            if (filtradas.length === 0) return 0;
            const suma = filtradas.reduce(
                (acc, curr) => acc + parseFloat(String(curr.Puntos_Ganados || 0).replace(',', '.')),
                0
            );
            return (suma / filtradas.length).toFixed(2);
        };

        const rango = (ini, fin) => Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);

        return {
            uso: promPorOrden(rango(4, 8)),
            desarrollo: promPorOrden([...rango(9, 12), ...rango(23, 26)]),
            etica: promPorOrden(rango(13, 17)),
            impacto: promPorOrden(rango(18, 22)),
        };
    };

    // ===============================
    // 🚨 ALERTAS
    // ===============================

    const generateAlerts = (data) => {
        const alerts = [];

        // ALERTA 1
        if (data.item3 <= 2 && data.item5 <= 2) {
            alerts.push("⚠️ Riesgo de automatización sin supervisión pedagógica.");
        }

        // ALERTA 2
        if (data.item7 <= 2 || data.item8 <= 2) {
            alerts.push("⚠️ Posible riesgo en protección de datos.");
        }

        // ALERTA 3
        if (data.dim3 < 2.5) {
            alerts.push("⚠️ El uso podría estar enfocado en eficiencia más que en aprendizaje.");
        }

        // ALERTA 4
        if (data.dim4 < data.previousDim4) {
            alerts.push("⚠️ Se detecta desaceleración en desarrollo profesional.");
        }

        return alerts;
    };

    const generateAnalysis = () => {

        const dims = {
            uso: pD[0],
            etica: pD[1],
            impacto: pD[2],
            desarrollo: pD[3]
        };

        const result = {};

        Object.keys(dims).forEach(key => {
            const value = dims[key];

            if (value < 3.0) {
                result[key] = dimensionRecommendations[key].basic;
            } else if (value < 4.0) {
                result[key] = dimensionRecommendations[key].medium;
            } else {
                result[key] = dimensionRecommendations[key].advanced;
            }
        });

        return result;
    };

    const [analysis, setAnalysis] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [showAnalysis, setShowAnalysis] = useState(false);

    // Adapta un registro del backend (snake_case + JSON) al formato que el render espera
    const adaptarRegistroBackend = (reg) => {
        const planas = {};
        if (reg.respuestas) {
            for (let i = 1; i <= 24; i++) {
                const dimPrefix = i <= 6 ? "D1_P" : i <= 12 ? "D2_P" : i <= 18 ? "D3_P" : "D4_P";
                planas[`${dimPrefix}${i}`] = reg.respuestas[String(i)] || 0;
            }
        }
        return {
            ...planas,
            _id: reg.id,
            ID_Sostener: reg.id,
            Teacher_Key: userData.teacher_key,
            Promedio_Global: reg.promedio_global,
            Nivel_Calculado: reg.nivel_calculado,
            "Promedio_D1, Promedio_D2, Promedio_D3, Promedio_D4":
                `${reg.promedio_d1}, ${reg.promedio_d2}, ${reg.promedio_d3}, ${reg.promedio_d4}`,
            Alertas_Activas: reg.alertas_activas,
            Porcentaje_Crecimiento: reg.porcentaje_crecimiento,
            Reflexion_Antes: reg.reflexion_antes,
            Reflexion_Despues: reg.reflexion_despues,
            Aprendizaje_Clave: reg.aprendizaje_clave,
            Compromiso_Accion: reg.compromiso_accion,
            Evidencia_Mejora: reg.evidencia_mejora,
            Prioridad_Sostener: reg.prioridad_sostener,
            Fecha_Revision_Plan: reg.fecha_revision_plan,
        };
    };

    useEffect(() => {
        const cargarHistorial = async () => {
            try {
                const evals = await apiFetch("/api/sostener/mis-evaluaciones").catch(() => []);
                if (Array.isArray(evals) && evals.length > 0) {
                    const adaptados = evals.map(adaptarRegistroBackend);
                    setHistorial(adaptados);
                    const reciente = evals[0];
                    if (reciente.respuestas) {
                        const mapa = {};
                        Object.keys(reciente.respuestas).forEach(k => {
                            mapa[Number(k)] = Number(reciente.respuestas[k]);
                        });
                        setRespuestas(mapa);
                    }
                }
            } catch (e) {
                console.error("Error cargando historial Sostener:", e);
            }
        };
        cargarHistorial();
    }, []);

    useEffect(() => {
        const integrarFases = async () => {
            if (!userData?.id) return;

            try {
                const balance = await apiFetch("/api/sostener/directivo/balance-institucional").catch(() => null);
                if (!balance) return;

                const scoreIniBase5 = balance.auditar.media_base5;
                const dLiderar = balance.prompt_liderar ? [balance.prompt_liderar] : [];
                const retosCount = balance.retos_completados;

                // Evidencia de auditoría (base 5 y base 100 ya calculadas en backend)
                setSelectedFormReal({
                    puntosMedia: balance.auditar.media_base5.toFixed(2),
                    promedioEscala100: balance.auditar.media_base100.toFixed(1),
                    desviacion: balance.auditar.desviacion.toFixed(2),
                    puntosModa: balance.auditar.moda.toFixed(2),          // ← MODA ya no sale vacío
                    puntajeTotal: balance.auditar.puntaje_total,
                    totalItems: balance.auditar.total_items,
                    analisis: { nivel: "Evidencia de Auditoría", color: "#4c51bf" }
                });

                // Prompt de Liderar (para el análisis institucional)
                if (balance.prompt_liderar) setPromptData(balance.prompt_liderar);

                // Cálculo de Balance Global (Comparativa Antes vs Ahora)
                const ultimoSostener = historial[0];
                const scoreActualBase5 = ultimoSostener ? parseFloat(ultimoSostener.Promedio_Global) : scoreIniBase5;

                setBalanceGlobal({
                    antes: {
                        nivel: scoreIniBase5 >= 4 ? "Estratégico" : scoreIniBase5 >= 2.5 ? "Integrador" : "Exploratorio",
                        puntaje: (scoreIniBase5 * 20).toFixed(1)
                    },
                    ahora: {
                        nivel: ultimoSostener?.Nivel_Calculado || "En Proceso",
                        puntaje: (scoreActualBase5 * 20).toFixed(1)
                    },
                    evidencias: {
                        retos: retosCount,
                        notasLiderar: dLiderar[0] || null
                    },
                    crecimiento: ((scoreActualBase5 * 20) - (scoreIniBase5 * 20)).toFixed(1)
                });

            } catch (e) {
                console.error("Error integrando balance:", e);
            }
        };
        integrarFases();
    }, [userData, historial]);

    useEffect(() => {
        const cargarAuditarReal = async () => {
            try {
                const data = await apiFetch("/api/sostener/directivo/auditar-institucional").catch(() => null);
                // El endpoint institucional devuelve { respuestas: [...] }
                if (data?.respuestas && Array.isArray(data.respuestas)) {
                    setRespuestasAuditarReal(data.respuestas);
                }
            } catch (e) {
                console.error("Error cargando respuestas auditar:", e);
            }
        };
        cargarAuditarReal();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch("/api/sostener/directivo/auditar-dos-inst").catch(() => null);
                if (data) {
                    setAuditarDos(data);
                    // Panel 5 (antes/después) usa auditarDosMedia: lo alimentamos del promedio institucional
                    if (data.existe && data.auditar) {
                        setAuditarDosMedia({
                            media_base5: data.auditar.media_base5,
                            media_base100: data.auditar.media_base100,
                        });
                    }
                }
            } catch (e) {
                console.error("Error cargando auditar-dos:", e);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch("/api/sostener/directivo/mis-retos-transformar-inst").catch(() => []);
                if (Array.isArray(data)) setRetos(data);
            } catch (e) {
                console.error("Error cargando retos transformar:", e);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch("/api/sostener/directivo/huella-institucional").catch(() => null);
                if (data) setHuellaCompleta(data);
            } catch (e) {
                console.error("Error cargando huella completa:", e);
            }
        })();
    }, []);

    // --- LÓGICA HEURÍSTICA PROMPTING INDIVIDUAL ---
    const analizarPromptIndiv = (p) => {
        if (!p) return null;
        const etica = parseFloat(p.puntaje_etica || 0);
        const priv = parseFloat(p.puntaje_privacidad || 0);
        const agen = parseFloat(p.puntaje_agencia || 0);
        const cogn = parseFloat(p.puntaje_dependencia || 0);
        const promedio = (etica + priv + agen + cogn) / 4;
        let diagnostico = promedio >= 4 ? "Excelente equilibrio ético." : "Se sugiere mayor supervisión humana.";
        let color = promedio >= 4 ? "#22c55e" : "#f59e0b";
        return { etica, priv, agen, cogn, promedio, diagnostico, color };
    };
    const statsPrompt = analizarPromptIndiv(promptData);

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
        else if (promedioGlobal >= 3.5) nivel = "Nivel 3: Docente Estratégico";
        else if (promedioGlobal >= 2.5) nivel = "Nivel 2: Integrador Inicial";
        else nivel = "Nivel 1: Uso Instrumental";

        const alertas = [];
        if (respuestas[3] <= 2 && respuestas[5] <= 2) alertas.push("Automatización sin supervisión");
        if (respuestas[7] <= 2 || respuestas[8] <= 2) alertas.push("Riesgo de protección de datos");
        if (parseFloat(promediosD[2].promedio) < 2.5) alertas.push("Bajo impacto pedagógico");

        return { promedioGlobal, promediosD, nivel, alertas };
    };

    const handleSave = async () => {
        const res = calcularResultados();
        if (!res) return Swal.fire("Incompleto", "Responde todas las preguntas.", "warning");

        setLoading(true);
        const esUpdate = historial.length > 0;

        const promedioD1 = parseFloat(res.promediosD[0].promedio);
        const promedioD2 = parseFloat(res.promediosD[1].promedio);
        const promedioD3 = parseFloat(res.promediosD[2].promedio);
        const promedioD4 = parseFloat(res.promediosD[3].promedio);

        const respuestasJSON = {};
        for (let i = 1; i <= 24; i++) {
            respuestasJSON[String(i)] = respuestas[i] || 0;
        }

        const payload = {
            id: esUpdate ? (historial[0]._id || historial[0].ID_Sostener) : undefined,
            periodo: "2026-1",
            respuestas: respuestasJSON,
            promedio_global: parseFloat(res.promedioGlobal.toFixed(2)),
            promedio_d1: promedioD1,
            promedio_d2: promedioD2,
            promedio_d3: promedioD3,
            promedio_d4: promedioD4,
            nivel_calculado: res.nivel,
            alertas_activas: res.alertas.join(" | ") || "Sin Alertas",
            porcentaje_crecimiento: `${balanceGlobal.crecimiento}%`,
            status: "COMPLETADO",
        };

        try {
            const guardado = await apiFetch("/api/sostener/evaluacion", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            setHistorial([adaptarRegistroBackend(guardado)]);
            setView("dashboard");
            Swal.fire("Éxito", "Evaluación sincronizada.", "success");
        } catch (e) {
            Swal.fire("Error", "Error al guardar en la nube.", "error");
        } finally {
            setLoading(false);
        }
    };

    const toPct = (val) => ((val / 5) * 100).toFixed(1);
    const pD = historial[0]?.["Promedio_D1, Promedio_D2, Promedio_D3, Promedio_D4"]?.split(',').map(v => parseFloat(v)) || [0, 0, 0, 0];

    const handleFinalSaveCierre = async () => {
        // 1. Validaciones de calidad antes de procesar
        if (!formDataCierre.compromisoAccion || formDataCierre.compromisoAccion.length < 150) {
            Swal.fire("Acción Incompleta", "Tu compromiso debe tener al menos 150 caracteres para ser transformador.", "warning");
            return;
        }

        setLoading(true);

        // Obtenemos los cálculos ponderados que corregimos (Evita el 0% en la DB)
        const comp = getComparativoAtlas();
        const idAUsar = historial[0]?.ID_Sostener;

        // 2. Construcción del payload de cierre (snake_case para el backend)
        const payloadCierre = {
            id: historial[0]?._id || historial[0]?.ID_Sostener,
            reflexion_antes: formDataCierre.reflexionAntes,
            reflexion_despues: formDataCierre.reflexionDespues,
            aprendizaje_clave: `${formDataCierre.aprendizajeClave}: ${formDataCierre.aprendizajeDetalle}`,
            compromiso_accion: formDataCierre.compromisoAccion,
            evidencia_mejora: formDataCierre.evidenciaMejora,
            prioridad_sostener: formDataCierre.prioridadSostener,
            fecha_revision_plan: formDataCierre.fechaRevision,
            porcentaje_crecimiento: `${comp.crecimiento || 0}%`,
            status: "COMPLETADO",
        };

        try {
            const guardado = await apiFetch("/api/sostener/evaluacion", {
                method: "POST",
                body: JSON.stringify(payloadCierre)
            });

            setHistorial([adaptarRegistroBackend(guardado)]);

            await Swal.fire({
                title: "¡Ciclo Completado!",
                text: "Tu hoja de ruta ha sido integrada al ecosistema ATLAS.",
                icon: "success",
                confirmButtonColor: "#D4AF37"
            });

            setShowCierre(false);
            setView("menu");

        } catch (e) {
            console.error("Error en handleFinalSaveCierre:", e);
            Swal.fire("Error", "No se pudo sincronizar el cierre. Verifica tu conexión.", "error");
        } finally {
            setLoading(false);
        }
    };

    const metricasAuditoria = getMetricasAuditoria();
    const datasetAuditoria = [
        { label: 'Desarrollo', valor: parseFloat(metricasAuditoria.desarrollo) || 0 },
        { label: 'Ética', valor: parseFloat(metricasAuditoria.etica) || 0 },
        { label: 'Impacto', valor: parseFloat(metricasAuditoria.impacto) || 0 },
        { label: 'Usabilidad.', valor: parseFloat(metricasAuditoria.uso) || 0 }
    ];

    // Identificamos el valor más bajo para resaltarlo
    const valorMinimo = Math.min(...datasetAuditoria.map(d => d.valor));

    const getComparativoAtlas = () => {
        // PUNTO DE PARTIDA = puntaje inicial de AUDITAR (base 100 vía Compass)
        // getCompassData usa puntaje_total; para % usamos media_base100 como referencia 0-100.
        const inicialPct = parseFloat(selectedFormReal?.promedioEscala100 || 0); // 0-100
        const inicialBase5 = parseFloat(selectedFormReal?.puntosMedia || 0);

        // MADUREZ ACTUAL = huella ponderada de las 5 fases (0-100)
        const actualPct = huellaCompleta
            ? parseFloat(huellaCompleta.huella_total)
            : inicialPct;

        // CRECIMIENTO = huella final − inicial
        const crecimiento = (actualPct - inicialPct).toFixed(1);

        return {
            scoreAntes: inicialBase5,
            scoreAntesPct: inicialPct.toFixed(1),
            nivelAntes: getCompassData(selectedFormReal?.puntajeTotal).nivel,
            scoreAhora: actualPct / 20,            // base 5 aproximada para textos
            scoreAhoraPct: actualPct.toFixed(1),
            nivelAhora: huellaCompleta
                ? `${huellaCompleta.fases_completas}/5 fases · ${actualPct.toFixed(0)}/100`
                : "Huella en progreso",
            crecimiento,
            hayHuella: !!huellaCompleta,
        };
    };

    const cargarDatosCierreExistentes = () => {
        if (historial.length > 0) {
            const registro = historial[0];

            // Mapeamos las columnas de Excel a nuestro estado de formulario
            setFormDataCierre({
                reflexionAntes: registro.Reflexion_Antes || "",
                reflexionDespues: registro.Reflexion_Despues || "",
                // El aprendizaje clave a veces viene como "Titulo: Detalle"
                aprendizajeClave: registro.Aprendizaje_Clave?.split(': ')[0] || "",
                aprendizajeDetalle: registro.Aprendizaje_Clave?.split(': ')[1] || "",
                prioridadSostener: registro.Prioridad_Sostener || "",
                compromisoAccion: registro.Compromiso_Accion || "",
                evidenciaMejora: registro.Evidencia_Mejora || "",
                fechaRevision: registro.Fecha_Revision_Plan || ""
            });

            setIsReadOnly(true); // Bloqueamos edición para que solo sea consulta
            setCierreStep(1);    // Empezamos desde la fase 1
            setView("cierre");   // Cambiamos a la vista de cierre
        } else {
            Swal.fire("Sin datos", "No hay un ciclo previo guardado para este docente.", "info");
        }
    };

    const [isReadOnly, setIsReadOnly] = useState(false); // Estado para bloquear inputs

    const fetchMisRespuestasCierre = async () => {
        setLoading(true);
        try {
            const data = await apiFetch("/api/sostener/mis-evaluaciones").catch(() => []);

            if (Array.isArray(data) && data.length > 0) {
                // Tomamos el registro más reciente (el backend ordena desc)
                const ultimoCierre = data[0];

                setFormDataCierre({
                    reflexionAntes: ultimoCierre.reflexion_antes || "",
                    reflexionDespues: ultimoCierre.reflexion_despues || "",
                    aprendizajeClave: ultimoCierre.aprendizaje_clave?.split(': ')[0] || "",
                    aprendizajeDetalle: ultimoCierre.aprendizaje_clave?.split(': ')[1] || "",
                    prioridadSostener: ultimoCierre.prioridad_sostener || "",
                    compromisoAccion: ultimoCierre.compromiso_accion || "",
                    evidenciaMejora: ultimoCierre.evidencia_mejora || "",
                    fechaRevision: ultimoCierre.fecha_revision_plan || ""
                });

                setIsReadOnly(true);
                setCierreStep(1);
                setView("cierre");
            } else {
                Swal.fire("Sin registros", "Aún no has completado ningún cierre de ciclo.", "info");
            }
        } catch (e) {
            console.error("Error al traer respuestas:", e);
            Swal.fire("Error", "No pudimos conectar con tu base de datos.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sostener-page-wrapper">
            {view === "menu" && (
                <div className="sostener-menu animate-fade-in">
                    <div className="sostener-header">
                        <button className="btn-back-atlas" onClick={() => onNavigate('overview')}>⬅ Mapa ATLAS</button>
                        <h2>Misiones de Sostenibilidad</h2>
                    </div>
                    <div className="sostener-grid-menu">
                        <div className={`sos-card-main ${historial.length > 0 ? 'is-done' : ''}`}>
                            <div className="sos-icon">📊</div>
                            <h3>Radar de Autoevaluación Institucional</h3>
                            <p>Análisis de dimensiones pedagógicas y éticas 2026.</p>
                            <div className="sos-actions">
                                {historial.length > 0 ? (
                                    <>
                                        <button onClick={() => setView("dashboard")} className="btn-sos-primary">
                                            Ver Mi Análisis
                                        </button>
                                        <button onClick={() => setView("cuestionario")} className="btn-sos-secondary">
                                            Revisar Autoevaluación
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setView("cuestionario")} className="btn-sos-primary">
                                        Iniciar Autoevaluación
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className={`sos-card-main ${historial.length > 0 ? '' : 'is-locked'}`}>
                            <div className="sos-icon">🔄</div>
                            <h3>Cierre de Ciclo</h3>
                            <p>Compara tu evolución Antes vs Después.</p>
                            <div className="sos-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                                {/* BOTÓN PARA NUEVO ENVÍO */}
                                <button
                                    disabled={historial.length === 0}
                                    className="btn-sos-primary"
                                    onClick={() => {
                                        // Limpiamos el formulario para un nuevo envío
                                        setFormDataCierre({
                                            reflexionAntes: "", reflexionDespues: "", aprendizajeClave: "",
                                            aprendizajeDetalle: "", prioridadSostener: "", compromisoAccion: "",
                                            evidenciaMejora: "", fechaRevision: ""
                                        });
                                        setIsReadOnly(false);
                                        setCierreStep(1);
                                        setView("cierre");
                                    }}
                                >
                                    Iniciar Nuevo Cierre
                                </button>

                                {/* BOTÓN PARA VER LO QUE YA ESTÁ EN LA HOJA */}
                                <button
                                    disabled={historial.length === 0}
                                    className="btn-sos-secondary"
                                    onClick={cargarDatosCierreExistentes}
                                >
                                    Ver Respuestas Anteriores
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === "cuestionario" && (
                <div className="atl-q-page-container animate-fade-in">
                    <button className="atl-q-btn-back" onClick={() => setView("menu")}>⬅ Volver</button>

                    <div className="atl-q-main-card">
                        <header className="atl-q-header">
                            <h2 className="atl-q-title">Autoevaluación Institucional IA</h2>
                            <p className="atl-q-subtitle">Sostener: Consolidación del Marco ATLAS 2026</p>
                        </header>

                        {dimensiones.map(dim => (
                            <section key={dim.id} className="atl-q-dimension-section">
                                <h3 className="atl-q-dim-title">{dim.nombre}</h3>
                                <p className="atl-q-dim-description">
                                    A continuación, realizarás la siguiente evaluación. Valora cada aspecto en una escala de 1 a 5, donde 1 significa que el criterio no se evidencia o se aplica de manera muy limitada, y 5 significa que se cumple de forma sobresaliente, con un uso estratégico, crítico y adecuado al contexto.
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
                                                        onClick={() => setRespuestas({ ...respuestas, [p.id]: v })}
                                                    >
                                                        {v}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}

                        <footer className="atl-q-footer">
                            <button
                                className="atl-q-btn-submit"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? "Sincronizando con ATLAS..." : "Finalizar y Guardar Evaluación"}
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {view === "dashboard" && historial.length > 0 && (
                <div className="sostener-dashboard animate-fade-in">
                    <button className="btn-sos-back" onClick={() => setView("menu")}>⬅ Menú Principal</button>
                    <div className="sos-dash-layout">
                        {/* PANEL 1: AUDITORÍA INDIVIDUAL */}
                        <div className="sos-dash-top">
                            <div className="sos-stat-card gold">
                                <span className="dash-lider-2026-panel-id">Panel 1</span>
                                <h4>Índice de Sostenibilidad</h4>
                                <div className="sos-big-val">
                                    {toPct(historial[0].Promedio_Global)}%
                                </div>

                                <button
                                    className="atl-an-btn-main"
                                    onClick={() => setShowModal(true)}
                                >
                                    Ver Análisis Maestro
                                </button>
                            </div>

                            <div className="sos-stat-card radar-cont">
                                <h4>Radar de Sostenibilidad</h4>

                                <ResponsiveContainer width="100%" height={250}>
                                    <RadarChart data={[
                                        { s: 'Uso', A: pD[0] },
                                        { s: 'Ética', A: pD[1] },
                                        { s: 'Impacto', A: pD[2] },
                                        { s: 'Desarrollo', A: pD[3] }
                                    ]}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="s" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Radar
                                            name="Nivel Actual"
                                            dataKey="A"
                                            stroke="var(--primary)"
                                            fill="var(--primary)"
                                            fillOpacity={0.5}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>

                                <button
                                    className="analysis-btn"
                                    onClick={() => {

                                        // Si ya existe análisis, solo alterna visibilidad
                                        if (analysis) {
                                            setShowAnalysis(prev => !prev);
                                            return;
                                        }

                                        // Si no existe, lo genera
                                        const generated = generateAnalysis();
                                        setAnalysis(generated);

                                        const alertResults = generateAlerts({
                                            item3: 2,
                                            item5: 2,
                                            item7: 3,
                                            item8: 4,
                                            dim3: pD[2],
                                            dim4: pD[3],
                                            previousDim4: 3.5
                                        });

                                        setAlerts(alertResults);

                                        setShowAnalysis(true);
                                    }}
                                >
                                    {!analysis
                                        ? "Generar Análisis Inteligente"
                                        : showAnalysis
                                            ? "Minimizar Análisis"
                                            : "Mostrar Análisis"}
                                </button>
                            </div>
                        </div>

                        {analysis && showAnalysis && (
                            <div className="analysis-box">

                                <h3>📊 Recomendaciones Personalizadas</h3>

                                {Object.entries(analysis).map(([dim, recs]) => (
                                    <div key={dim} className="dimension-block">
                                        <h4>{dim.toUpperCase()}</h4>
                                        <ul>
                                            {recs.map((r, i) => <li key={i}>{r}</li>)}
                                        </ul>
                                    </div>
                                ))}

                                {alerts.length > 0 && (
                                    <div className="alerts-box">
                                        <h3>🚨 Alertas Detectadas</h3>
                                        <ul>
                                            {alerts.map((a, i) => <li key={i}>{a}</li>)}
                                        </ul>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* PANEL 1.2: EVIDENCIA INSTITUCIONAL REAL (CARD BOTÓN) */}
                        <div className="sos-stat-card real-evidence" onClick={() => setShowModalReal(true)}>
                            <span className="dash-lider-2026-panel-id">Panel 2: Fase: AUDITAR</span>
                            <h4>Diagnóstico Pedagógico Institucional</h4>

                            <div className="atl-an-metrics-grid">
                                <div className="atl-an-mini-box">
                                    <span className="atl-an-mini-box-val">
                                        {respuestasAuditarReal.length}
                                    </span>
                                    <span className="atl-an-mini-box-lbl">Preguntas</span>
                                </div>
                                <div className="atl-an-mini-box">
                                    <span className="atl-an-mini-box-val">
                                        {selectedFormReal?.puntosMedia || "0.00"}
                                    </span>
                                    <span className="atl-an-mini-box-lbl">
                                        Puntos Media ({selectedFormReal?.promedioEscala100 || 0}%)
                                    </span>
                                </div>
                            </div>

                            <button className="atl-an-btn-main-alt">
                                Ver Diagnóstico
                            </button>
                        </div>

                        {/* MODAL ESPECÍFICO PARA AUDITORÍA REAL */}
                        {showModalReal && (
                            <div className="atl-an-overlay">
                                <div className="audit-modal-container animate-fade-in">
                                    <div className="audit-modal-head">
                                        <div className="audit-modal-header-top">
                                            <div>
                                                <h3>Reporte ATLAS: Diagnóstico de Auditoría</h3>
                                                <p className="audit-modal-sub">Basado en {selectedFormReal?.totalItems} evidencias reales</p>
                                            </div>
                                            <button className="audit-modal-close" onClick={() => setShowModalReal(false)}>✕</button>
                                        </div>
                                        <div className="audit-modal-tabs">
                                            <button className={viewModeReal === 'stats' ? 'active' : ''} onClick={() => setViewModeReal('stats')}>📊 Estadísticas</button>
                                            <button className={viewModeReal === 'survey' ? 'active' : ''} onClick={() => setViewModeReal('survey')}>📝 Puntos por Ítem</button>
                                            <button className={`compass-tab-unique ${viewModeReal === 'compass' ? 'active' : ''}`} onClick={() => setViewModeReal('compass')}>🧭 Análisis Compass</button>
                                            {auditarDos?.existe && (
                                                <button
                                                    className={`compass-tab-unique ${viewModeReal === 'compass2' ? 'active' : ''}`}
                                                    onClick={() => setViewModeReal('compass2')}
                                                >
                                                    ✨ Análisis Compass Nuevo (Institucional)
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="audit-modal-body">
                                        {viewModeReal === 'stats' && (
                                            <div className="audit-stats-view">
                                                <div className="audit-metrics-grid">
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val blue">{selectedFormReal?.puntosMedia}</span>
                                                        <span className="audit-lbl">MEDIA (0-5)</span>
                                                    </div>
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val green">{selectedFormReal?.puntosModa}</span>
                                                        <span className="audit-lbl">MODA (PUNTOS)</span>
                                                    </div>
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val orange">{selectedFormReal?.desviacion}</span>
                                                        <span className="audit-lbl">DESVIACIÓN (Σ)</span>
                                                    </div>
                                                </div>
                                                <div className="audit-insight-card">
                                                    <h4>Interpretación de Consistencia</h4>
                                                    <p>
                                                        Una desviación de <strong>{selectedFormReal?.desviacion}</strong> indica que su práctica docente con IA
                                                        {parseFloat(selectedFormReal?.desviacion) < 1.0 ? " es altamente consistente entre los diferentes indicadores." : " presenta variaciones notables dependiendo del área evaluada."}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {viewModeReal === 'survey' && (
                                            <div className="audit-survey-scroll">
                                                {respuestasAuditarReal.map((q, idx) => {
                                                    const puntos = parseFloat(String(q.Puntos_Ganados || "0").replace(',', '.'));
                                                    return (
                                                        <div key={idx} className="audit-item-row">
                                                            <div className="audit-item-info">
                                                                <span className="audit-item-text">{q.Valor_Respondido || `Indicador ${idx + 1}`}</span>
                                                                <span className="audit-item-score">{puntos.toFixed(1)} </span>
                                                            </div>
                                                            <div className="audit-progress-bg">
                                                                <div className="audit-progress-fill" style={{
                                                                    width: `${(puntos / 9) * 100}%`,
                                                                    backgroundColor: puntos >= 4 ? '#48bb78' : puntos >= 2.5 ? '#ecc94b' : '#f56565'
                                                                }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {viewModeReal === 'compass' && (
                                            <div className="audit-compass-view animate-slide-up">
                                                <div className="audit-compass-badge">
                                                    {getCompassData(selectedFormReal?.puntajeTotal).nivel}
                                                </div>
                                                <div className="audit-compass-box">
                                                    <h4>Diagnóstico Compass (Auditoría)</h4>
                                                    <p>{getCompassData(selectedFormReal?.puntajeTotal).desc}</p>
                                                </div>
                                            </div>
                                        )}

                                        {viewModeReal === 'compass2' && auditarDos?.existe && (
                                            <div className="audit-compass-view animate-slide-up">
                                                <div className="audit-compass-badge">
                                                    {getCompassData(auditarDos.auditar.puntaje_total).nivel}
                                                </div>

                                                {/* Comparativa institucional: 1er vs 2do AUDITAR promedio empresa */}
                                                <div className="audit-metrics-grid" style={{ marginBottom: '16px' }}>
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val blue">{selectedFormReal?.puntosMedia}</span>
                                                        <span className="audit-lbl">MEDIA 1er (EMPRESA)</span>
                                                    </div>
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val green">{auditarDos.auditar.media_base5.toFixed(2)}</span>
                                                        <span className="audit-lbl">MEDIA 2do (EMPRESA)</span>
                                                    </div>
                                                    <div className="audit-stat-box">
                                                        {(() => {
                                                            const delta = (auditarDos.auditar.puntaje_total - (selectedFormReal?.puntajeTotal || 0));
                                                            const signo = delta > 0 ? "+" : "";
                                                            return (
                                                                <span className="audit-val orange">{signo}{delta.toFixed(1)}</span>
                                                            );
                                                        })()}
                                                        <span className="audit-lbl">Δ PUNTOS</span>
                                                    </div>
                                                </div>

                                                <div className="audit-compass-box">
                                                    <h4>Análisis Compass Nuevo · Promedio Institucional</h4>
                                                    <p style={{ fontSize: '0.85rem', color: '#c5a059', marginBottom: '8px' }}>
                                                        Basado en {auditarDos.docentesConSegundo} de {auditarDos.totalDocentes} docentes que realizaron el segundo diagnóstico.
                                                    </p>
                                                    <p>{getCompassData(auditarDos.auditar.puntaje_total).desc}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="audit-modal-footer" style={{ display: 'flex', gap: '10px' }}>
                                        <button className="audit-btn-close-full" onClick={() => setShowModalReal(false)}>
                                            Cerrar Diagnóstico
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PANEL 2: DICTAMEN DE AUDITORÍA ÉTICA (LIDERAZGO) */}
                        <div className={`sos-history-chart audit-ethic-border`} style={{ borderLeftColor: statsPrompt?.color }}>
                            <span className="dash-lider-2026-panel-id">Panel 3: Fase Liderar</span>
                            <h4>Dictamen de Liderazgo Pedagógico e IA</h4>

                            {promptData ? (
                                <div className="sos-audit-content">
                                    <div className="sos-audit-head-row">
                                        <div>
                                            <h5 className="sos-audit-title" style={{ color: statsPrompt?.color }}>
                                                {promptData.clasificacion_riesgo?.split('|')[0] || promptData.categoria_uso || "Dictamen Ético"}
                                            </h5>
                                            <small>Auditoría bajo Marco UNESCO 2024 & AI Act</small>
                                        </div>
                                    </div>

                                    <div className="sos-mini-grid-bars">
                                        {[
                                            { l: 'Ética', v: promptData.puntaje_etica, c: '#8b5cf6' },
                                            { l: 'Privacidad', v: promptData.puntaje_privacidad, c: '#06b6d4' },
                                            { l: 'Agencia', v: promptData.puntaje_agencia, c: '#f59e0b' },
                                            { l: 'Cognición', v: promptData.puntaje_dependencia, c: '#ec4899' }
                                        ].map(d => (
                                            <div key={d.l} className="sos-mini-bar-item">
                                                <div className="sos-mini-bar-labels">
                                                    <span>{d.l}</span>
                                                    <strong>{d.v}/5</strong>
                                                </div>
                                                <div className="sos-mini-bar-bg">
                                                    <div className="sos-mini-bar-fill" style={{ width: `${(d.v / 5) * 100}%`, backgroundColor: d.c }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="sos-dictamen-box">
                                        <strong className="sos-dictamen-tag">🔍 Hallazgos de la Auditoría:</strong>
                                        <p className="sos-prompt-preview">
                                            "{promptData.prompt_original?.substring(0, 800)}"
                                        </p>
                                        <p className="sos-dictamen-text">
                                            {promptData.puntaje_agencia <= 2
                                                ? "⚠️ Alerta crítica: Se detecta una delegación excesiva del juicio docente. La IA está asumiendo roles evaluativos sin supervisión suficiente."
                                                : "✅ Se mantiene una agencia humana adecuada en el diseño de la interacción."}
                                            <br /><br />
                                            En términos de <strong>Privacidad</strong>, el nivel {promptData.puntaje_privacidad} indica que
                                            {promptData.puntaje_privacidad >= 4 ? " aplicas protocolos seguros de minimización de datos." : " existen riesgos de exposición de datos sensibles."}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="sos-empty-state">
                                    <p>No se han encontrado registros de auditoría ética. <br /> Completa la Fase Liderar para activar este panel.</p>
                                </div>
                            )}
                        </div>

                        {/* PANEL 3: RETOS (TRANSFORMACIÓN) */}
                        <div className="sos-history-chart">
                            <span className="dash-lider-2026-panel-id">Panel 4</span>
                            <h4>Misiones de Transformación</h4>
                            <div className="retos-summary-grid">
                                {retos.length > 0 ? retos.map((r, i) => (
                                    <div key={i} className="reto-mini-card">
                                        <h5>{r.nombre_reto || `Reto ${r.numero_reto}`}</h5>
                                        <span className={`status-pill ${r.status_reto}`}>{r.status_reto}</span>
                                        <small>{r.nivel_unesco}</small>
                                    </div>
                                )) : <p>No hay retos registrados.</p>}
                            </div>
                        </div>

                        {/* EVOLUCIÓN */}
                        <div className="sos-history-chart">
                            <span className="dash-lider-2026-panel-id">Panel 5</span>

                            {auditarDosMedia?.media_base5 != null ? (
                                <>
                                    <h4>Progreso de Auditoría (Antes vs Después)</h4>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart
                                            data={[
                                                { etapa: "1er Diagnóstico", media: parseFloat(selectedFormReal?.puntosMedia || 0), fill: "#94a3b8" },
                                                { etapa: "2do Diagnóstico", media: auditarDosMedia.media_base5, fill: "#c5a059" },
                                            ]}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="etapa" tick={{ fontSize: 12 }} />
                                            <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                                            <Tooltip formatter={(v) => [`${v} / 5`, "Media"]} />
                                            <Bar dataKey="media" radius={[6, 6, 0, 0]}>
                                                {[
                                                    { fill: "#94a3b8" },
                                                    { fill: "#c5a059" },
                                                ].map((c, i) => <Cell key={i} fill={c.fill} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>

                                    {(() => {
                                        const antes = parseFloat(selectedFormReal?.puntosMedia || 0);
                                        const despues = auditarDosMedia.media_base5;
                                        const delta = (despues - antes).toFixed(2);
                                        const subio = despues >= antes;
                                        return (
                                            <div className="sos-dictamen-box" style={{ marginTop: '12px' }}>
                                                <p className="sos-dictamen-text">
                                                    {subio ? "📈" : "📉"} Tu media pasó de <strong>{antes.toFixed(2)}</strong> a{" "}
                                                    <strong>{despues.toFixed(2)}</strong> (base 5).
                                                    {subio
                                                        ? ` Mejoraste ${delta} puntos. Tu práctica con IA muestra progreso.`
                                                        : ` Variación de ${delta} puntos. Revisa las áreas donde bajaste.`}
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </>
                            ) : (
                                <>
                                    <h4>Evolución Histórica ATLAS</h4>
                                    {historial && historial.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={180}>
                                            <LineChart data={[...historial].reverse()}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="Fecha_Evaluacion" tick={{ fontSize: 12 }} />
                                                <YAxis domain={[0, 5]} hide />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="Promedio_Global" stroke="#c5a059" strokeWidth={3} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="sos-empty-state">
                                            <p>Aún no has hecho tu segundo diagnóstico. <br />
                                                Complétalo para comparar tu progreso Antes vs Después.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {view === "cierre" && (
                <div ref={cierreTopRef} className="sostener-cuestionario animate-fade-in cierre-full-view">

                    <div className="sostener-cuestionario animate-fade-in cierre-full-view">
                        {/* Header Fijo */}
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

                            {/* FASE 1: EL ORIGEN - DISEÑO BLINDADO */}
                            {cierreStep === 1 && (
                                <div className="at-cierre-fase-wrapper animate-slide-up">

                                    {/* ENCABEZADO CENTRADO Y LIMPIO */}
                                    <header className="at-cierre-header-main">
                                        <div className="at-cierre-badge-container">
                                            <span className="at-badge-gold">Fase 1: El Origen</span>
                                        </div>
                                        <h2 className="at-cierre-title">¿Dónde comenzó tu viaje?</h2>
                                        <p className="at-cierre-subtitle">
                                            Análisis retrospectivo basado en el <strong>Diagnóstico de Auditoría</strong>.
                                        </p>
                                    </header>

                                    {/* GRID DE RESULTADOS (DIAGNÓSTICO) */}
                                    <div className="at-cierre-grid-container">

                                        {/* CARD IZQUIERDA: SCORE GLOBAL (AZUL PREMIUM) */}
                                        <section className="at-cierre-card-premium at-variant-dark">
                                            <div className="at-card-tag">Estado Inicial</div>

                                            <div className="at-score-hero-layout">
                                                <div className="at-score-circle">
                                                    <span className="at-score-big-num">{selectedFormReal?.puntajeTotal ?? 0}</span>
                                                    <span className="at-score-subtext">Puntaje Inicial (Auditar)</span>
                                                </div>

                                                <h3 className="at-level-title">
                                                    {getCompassData(selectedFormReal?.puntajeTotal).nivel}
                                                </h3>
                                            </div>

                                            <div className="at-description-box">
                                                <p>{getCompassData(selectedFormReal?.puntajeTotal).desc}</p>
                                            </div>
                                        </section>

                                        {/* CARD DERECHA: GRÁFICA DE BARRAS (ESTILO DASHBOARD) */}
                                        <section className="at-cierre-card-premium at-variant-white">
                                            <h4 className="at-chart-title">Desempeño por Dimensión (Inicial)</h4>

                                            <div className="at-vertical-chart-area">
                                                {datasetAuditoria.map((item, idx) => {
                                                    const isMin = item.valor === valorMinimo && item.valor < 5;
                                                    return (
                                                        <div key={idx} className="at-chart-col">
                                                            <span className="at-col-val">{item.valor.toFixed(1)}</span>
                                                            <div className="at-col-track">
                                                                <div
                                                                    className={`at-col-fill ${isMin ? 'at-is-critical' : ''}`}
                                                                    style={{ height: `${(item.valor / 5) * 100}%` }}
                                                                >
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
                                                    <p>Punto de mejora crítico: <strong>{datasetAuditoria.find(d => d.valor === valorMinimo)?.label}</strong></p>
                                                </div>
                                            )}
                                        </section>
                                    </div>

                                    {/* SECCIÓN DE REFLEXIÓN (INDETERMINADA POR EL DISEÑO DE RETOS) */}
                                    <div className="at-cierre-reflection-section">
                                        <div className="at-reflection-header">
                                            <h4>Guía de Reflexión</h4>
                                            <ul className="at-reflection-prompts">
                                                <li>¿Qué prácticas eran más funcionales que estratégicas?</li>
                                                <li>¿Dónde delegabas más de lo necesario?</li>
                                                <li>¿Qué riesgos no habías identificado aún?</li>
                                            </ul>
                                        </div>

                                        <div className="at-reflection-input-group">
                                            <textarea
                                                className="at-reflection-textarea"
                                                readOnly={isReadOnly}
                                                placeholder="Escribe tu análisis aquí..."
                                                value={formDataCierre.reflexionAntes}
                                                onChange={(e) => setFormDataCierre({ ...formDataCierre, reflexionAntes: e.target.value })}
                                            />
                                            <div className={`at-char-counter ${formDataCierre.reflexionAntes.length >= 200 ? 'at-ready' : ''}`}>
                                                <span className="at-counter-number">
                                                    {formDataCierre.reflexionAntes.length} / 200
                                                </span>
                                                <span className="at-counter-label">caracteres requeridos</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ETAPA 2: LA TRANSFORMACIÓN (SOSTENER) - DISEÑO COMPARATIVO EVOLUTIVO */}
                            {cierreStep === 2 && (
                                <div className="at-c2-wrapper animate-slide-up">

                                    {/* ENCABEZADO DE ÉXITO */}
                                    <header className="at-c2-header-main">
                                        <div className="at-c2-badge-container">
                                            <span className="at-badge-success">Fase 2: Consolidación</span>
                                        </div>
                                        <h2 className="at-c2-title">Tu evolución tangible</h2>
                                        <p className="at-c2-subtitle">
                                            Has completado el ciclo de Sostenibilidad. Mira cuánto has avanzado desde tu diagnóstico inicial:
                                        </p>
                                    </header>

                                    {/* DASHBOARD DE MÉTRICAS DE IMPACTO */}
                                    <div className="at-c2-impact-grid">

                                        {/* INDICADOR DE CRECIMIENTO (+X%) */}
                                        <div className="at-c2-card-stats at-variant-dark-gold">
                                            <div className="at-c2-growth-circle">
                                                <span className="at-c2-plus">+</span>
                                                <span className="at-c2-growth-num">{getComparativoAtlas().crecimiento}</span>
                                                <span className="at-c2-percent">%</span>
                                            </div>
                                            <h4>Crecimiento Global</h4>
                                            <p>Incremento en madurez pedagógica</p>
                                        </div>

                                        {/* STATUS ACTUAL AUTOMÁTICO - CORREGIDO PARA TEXTO LARGO */}
                                        <div className="at-c2-card-stats at-variant-white">
                                            <div className="at-c2-status-row">
                                                <div className="at-c2-status-item at-level-block">
                                                    <label>Estado Alcanzado</label>
                                                    <strong className="at-text-level">{getComparativoAtlas().nivelAhora}</strong>
                                                </div>
                                                <div className="at-c2-status-item">
                                                    <label>Fortaleza</label>
                                                    <strong className="at-text-gold">{getComparativoAtlas().dimensionCrecimiento || "Impacto"}</strong>
                                                </div>
                                                <div className="at-c2-status-item">
                                                    <label>Riesgos</label>
                                                    <strong className="at-text-forest">-{alerts.length || 0} mitigados</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PANTALLA COMPARATIVA: DOBLE CARRIL */}
                                    <div className="at-c2-comparison-container">
                                        <h4 className="at-c2-chart-title">Análisis Comparativo: Punto de Partida | Nivel Actual</h4>
                                        <div className="at-c2-comparison-chart">
                                            {datasetAuditoria.map((item, idx) => (
                                                <div key={idx} className="at-c2-comp-row">
                                                    <div className="at-c2-comp-label">{item.label}</div>

                                                    <div className="at-c2-dual-track-container">
                                                        {/* Carril Superior: EL ANTES (Dorado) */}
                                                        <div className="at-c2-track-path">
                                                            <div
                                                                className="at-c2-bar-before"
                                                                style={{ width: `${(item.valor / 5) * 100}%` }}
                                                            >
                                                                <span className="at-c2-bar-label-val">{item.valor.toFixed(1)}</span>
                                                            </div>
                                                        </div>

                                                        {/* Carril Inferior: EL AHORA (Verde Bosque) */}
                                                        <div className="at-c2-track-path">
                                                            <div
                                                                className="at-c2-bar-after"
                                                                style={{ width: `${(pD[idx] / 5) * 100}%` }}
                                                            >
                                                                <span className="at-c2-bar-label-val">{(pD[idx] || 0).toFixed(1)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="at-c2-chart-legend">
                                            <span className="at-leg-before">Diagnóstico Inicial</span>
                                            <span className="at-leg-after">Estado de Sostenibilidad</span>
                                        </div>
                                    </div>

                                    {/* SECCIÓN DE REFLEXIÓN EVOLUTIVA */}
                                    <div className="at-c2-reflection-section">
                                        <div className="at-reflection-header">
                                            <h4>Tu evolución: Describe tu cambio</h4>
                                            <ul className="at-reflection-prompts">
                                                <li>¿Qué cambió en tu manera de diseñar experiencias con IA?</li>
                                                <li>¿Cómo garantizas ahora supervisión humana explícita?</li>
                                                <li>¿Qué haces diferente para reducir riesgos y promover autonomía estudiantil?</li>
                                            </ul>
                                        </div>

                                        <div className="at-reflection-input-group">
                                            <textarea
                                                className="at-reflection-textarea"
                                                readOnly={isReadOnly}
                                                placeholder="Describe tu transformación (mínimo 300 caracteres)..."
                                                value={formDataCierre.reflexionDespues}
                                                onChange={(e) => setFormDataCierre({ ...formDataCierre, reflexionDespues: e.target.value })}
                                            />
                                            <div className={`at-char-counter ${formDataCierre.reflexionDespues.length >= 300 ? 'at-ready' : ''}`}>
                                                <span className="at-counter-number">
                                                    {formDataCierre.reflexionDespues.length} / 300
                                                </span>
                                                <span className="at-counter-label">caracteres requeridos</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ETAPA 3: MARCO ÉTICO (UNESCO) - APRENDIZAJES DE IMPACTO */}
                            {cierreStep === 3 && (
                                <div className="at-c3-wrapper animate-slide-up">

                                    {/* ENCABEZADO */}
                                    <header className="at-c2-header-main">
                                        <div className="at-c2-badge-container">
                                            <span className="at-badge-success">
                                                Fase 3: Marco Internacional
                                            </span>
                                        </div>
                                        <h2 className="at-c2-title">Aprendizajes de Impacto Global</h2>
                                        <p className="at-c2-subtitle">
                                            Durante este proceso comprendiste que integrar IA no es solo usar herramientas.
                                            <strong> Selecciona el aprendizaje que más impactó tu práctica:</strong>
                                        </p>
                                    </header>

                                    {/* GRID DE SELECCIÓN DE APRENDIZAJE */}
                                    <div className="at-c3-marco-grid">
                                        {[
                                            { id: 'A1', t: 'Agencia Humana', d: 'Mantener el control y la supervisión en las decisiones pedagógicas.', icon: '👤' },
                                            { id: 'A2', t: 'Ética y Datos', d: 'Reducir riesgos, proteger la privacidad y mitigar sesgos algorítmicos.', icon: '⚖️' },
                                            { id: 'A3', t: 'Propósito Pedagógico', d: 'Diseñar experiencias donde la IA potencie el aprendizaje activo.', icon: '🎯' },
                                            { id: 'A4', t: 'Pensamiento Crítico', d: 'Fomentar la evaluación reflexiva y crítica de los estudiantes hacia la IA.', icon: '🧠' }
                                        ].map(item => (
                                            <div
                                                key={item.id}
                                                className={`at-c3-marco-card ${formDataCierre.aprendizajeClave === item.t ? 'at-selected' : ''}`}
                                                onClick={() => setFormDataCierre({ ...formDataCierre, aprendizajeClave: item.t })}
                                            >
                                                <div className="at-c3-card-icon">{item.icon}</div>
                                                <h4>{item.t}</h4>
                                                <p>{item.d}</p>
                                                <div className="at-c3-check-indicator"></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* JUSTIFICACIÓN */}
                                    <div className="at-c2-reflection-section" style={{ marginTop: '30px' }}>
                                        <div className="at-reflection-header">
                                            <h4>Justifica tu elección</h4>
                                            <p className="at-reflection-subtext">Explica por qué este pilar es fundamental para tu nueva etapa docente.</p>
                                        </div>
                                        <div className="at-reflection-input-group">
                                            <textarea
                                                className="at-reflection-textarea"
                                                readOnly={isReadOnly}
                                                placeholder="Describe el impacto de este aprendizaje (mínimo 150 caracteres)..."
                                                value={formDataCierre.aprendizajeDetalle}
                                                onChange={(e) => setFormDataCierre({ ...formDataCierre, aprendizajeDetalle: e.target.value })}
                                            />
                                            <div className={`at-char-counter ${formDataCierre.aprendizajeDetalle.length >= 150 ? 'at-ready' : ''}`}>
                                                <span className="at-counter-number">{formDataCierre.aprendizajeDetalle.length} / 150</span>
                                                <span className="at-counter-label">caracteres</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ETAPA 4: REPORTE MAESTRO DE EVOLUCIÓN ATLAS */}
                            {cierreStep === 4 && (
                                <div className="at-c4-wrapper animate-slide-up">
                                    <header className="at-c4-header-main">
                                        <div className="at-c4-badge-container">
                                            <span className="at-badge-gold">Certificación de Huella Pedagógica 2026</span>
                                        </div>
                                        <h2 className="at-c4-title">Tu Evolución ATLAS</h2>
                                        <p className="at-c4-subtitle">Consolidación de evidencias: De la Auditoría Técnica a la Sostenibilidad Ética.</p>
                                    </header>

                                    <div className="at-c4-report-card">
                                        {/* CABECERA INSTITUCIONAL */}
                                        <div className="at-c4-report-header">
                                            <div className="at-c4-logo-section">
                                                <div className="at-c4-brand">ATLAS <span>PROJECT</span></div>
                                                <div className="at-c4-docente-info">
                                                    <strong>DOCENTE:</strong> {userData.nombre_completo} <br />
                                                    <strong>ID:</strong> {userData.teacher_key} | {new Date().toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="at-c4-stamp-seal">
                                                <div className="seal-inner">2026</div>
                                                <span>CERTIFICADO</span>
                                            </div>
                                        </div>

                                        {/* SECCIÓN 1: EL SALTO CUÁNTICO (COMPARATIVA EN PORCENTAJES) */}
                                        {(() => {
                                            const comp = getComparativoAtlas();
                                            const pctInicial = comp.scoreAntesPct;   // inicial AUDITAR
                                            const pctActual = comp.scoreAhoraPct;

                                            return (
                                                <div className="at-c4-comparison-layout">
                                                    {/* ESTADO INICIAL (PORCENTAJE PONDERADO) */}
                                                    <div className="at-c4-col-before">
                                                        <h4 className="at-c4-col-title">Fase 1: Punto de Partida</h4>
                                                        <div className="at-c4-main-metric">
                                                            <span className="at-val">
                                                                {pctInicial}
                                                                <small className="at-symbol-pct">%</small>
                                                            </span>
                                                            <span className="at-lbl">Calificación Inicial</span>
                                                        </div>
                                                        <div className="at-c4-status-desc">
                                                            <strong>Nivel: {comp.nivelAntes}</strong>
                                                            <p>{getCompassData(comp.scoreAntes * 20).desc}</p>
                                                        </div>
                                                        <div className="at-c4-mini-stats">
                                                            <span>Consistencia: {parseFloat(selectedFormReal?.desviacion || 0) < 1.0 ? "Estable" : "Variable"}</span>
                                                            <span>Media: {comp.scoreAntes.toFixed(2)} / 5</span>
                                                        </div>
                                                    </div>

                                                    {/* MÉTRICA DE IMPACTO CENTRAL */}
                                                    <div className="at-c4-divider">
                                                        <div className="at-c4-impact-orb">
                                                            <span className="at-orb-plus">+</span>
                                                            <span className="at-orb-val">{comp.crecimiento}</span>
                                                            <span className="at-orb-pct">%</span>
                                                        </div>
                                                        <div className="at-c4-missions-badge">
                                                            <strong>{retos.filter(r => r.status_reto?.toUpperCase() === 'COMPLETADO').length}</strong>
                                                            <span>Misiones</span>
                                                        </div>
                                                    </div>

                                                    {/* ESTADO ACTUAL (PORCENTAJE) */}
                                                    <div className="at-c4-col-after">
                                                        <h4 className="at-c4-col-title">Fase 4: Madurez Actual</h4>
                                                        <div className="at-c4-main-metric gold">
                                                            <span className="at-val">
                                                                {pctActual}
                                                                <small className="at-symbol-pct">%</small>
                                                            </span>
                                                            <span className="at-lbl">Sostenibilidad Alcanzada</span>
                                                        </div>
                                                        <div className="at-c4-status-desc">
                                                            <strong>{comp.nivelAhora}</strong>
                                                            <p>{generarDiagnostico(pctActual).texto}</p>
                                                        </div>
                                                        <div className="at-c4-mini-stats">
                                                            <span className="at-text-gold">Pilar: {formDataCierre.aprendizajeClave || "General"}</span>
                                                            <span className="at-text-gold">Media Actual: {comp.scoreAhora.toFixed(2)} / 5</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        {/* SECCIÓN 2: NARRATIVA DE TRANSFORMACIÓN */}
                                        <div className="at-c4-narrative-section">
                                            <h5 className="at-section-subtitle">Trayectoria Reflexiva</h5>
                                            <div className="at-narrative-grid">
                                                <div className="at-narrative-box">
                                                    <label>Visión Inicial</label>
                                                    {/* Si no hay reflexión escrita, sacamos la data de la dimensión más baja del dataset inicial */}
                                                    <p>
                                                        {formDataCierre.reflexionAntes.length > 5
                                                            ? `"${formDataCierre.reflexionAntes}"`
                                                            : `Al inicio, mi práctica presentaba una brecha crítica en ${datasetAuditoria.find(d => d.valor === Math.min(...datasetAuditoria.map(i => i.valor)))?.label}, con un desempeño basado más en la funcionalidad que en la estrategia ética.`}
                                                    </p>
                                                </div>
                                                <div className="at-narrative-box gold">
                                                    <label>Visión Transformada</label>
                                                    <p>
                                                        {formDataCierre.reflexionDespues.length > 5
                                                            ? `"${formDataCierre.reflexionDespues}"`
                                                            : "A través de la implementación de protocolos de sostenibilidad, he consolidado una supervisión humana activa, reduciendo la dependencia de la automatización."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECCIÓN 3: AUDITORÍA ÉTICA UNESCO */}
                                        <div className="at-c4-ethic-summary">
                                            <h5><span className="dot l"></span> Dictamen de Liderazgo Ético UNESCO</h5>
                                            <div className="at-c4-ethic-bars">
                                                {[
                                                    { l: 'Privacidad y Seguridad', v: promptData?.puntaje_privacidad, c: '#06b6d4' },
                                                    { l: 'Agencia Humana', v: promptData?.puntaje_agencia, c: '#f59e0b' },
                                                    { l: 'Propósito Pedagógico', v: promptData?.puntaje_etica, c: '#8b5cf6' }
                                                ].map(d => (
                                                    <div key={d.l} className="at-c4-bar-row">
                                                        <div className="at-bar-label"><span>{d.l}</span> <strong>{d.v}/5</strong></div>
                                                        <div className="at-bar-track">
                                                            <div className="at-bar-fill" style={{ width: `${(d.v / 5) * 100}%`, backgroundColor: d.c }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="at-c4-hallazgo-box">
                                                <strong>Análisis UNESCO 2026:</strong> {promptData?.puntaje_agencia <= 2
                                                    ? "Se detectó inicialmente una delegación de juicio docente. El ciclo ATLAS ha fortalecido la autonomía, permitiéndote usar la IA como copiloto sin ceder el control pedagógico."
                                                    : "Tu evolución demuestra una agencia humana sólida. Mantienes la autoridad en el diseño de experiencias, cumpliendo con los estándares de integridad digital de la UNESCO."}
                                            </div>
                                        </div>

                                        {/* SECCIÓN 4: LOGROS Y RIESGOS */}
                                        <div className="at-c4-double-stats">
                                            <div className="at-c4-tech-block">
                                                <h5><span className="dot t"></span> Misiones Superadas</h5>
                                                <div className="at-c4-tags-container">
                                                    {retos.filter(r => r.status_reto?.toUpperCase() === 'COMPLETADO').length > 0 ? (
                                                        retos.filter(r => r.status_reto?.toUpperCase() === 'COMPLETADO').map((r, i) => (
                                                            <div key={i} className="at-mission-card-mini">
                                                                <span className="check">✓</span>
                                                                <div className="info">
                                                                    <strong>{r.Nombre_Reto}</strong>
                                                                    <small>{r.Nivel_UNESCO || 'Nivel Avanzado'}</small>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : <p className="at-empty-text">No se registraron misiones externas.</p>}
                                                </div>
                                            </div>

                                            <div className="at-c4-alerts-section">
                                                <h5><span className="dot a"></span> Gestión de Riesgos</h5>
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

                                        {/* SECCIÓN 5: INDICADORES TÉCNICOS FINALES */}
                                        <div className="at-c4-quality-checks">
                                            <div className="at-check-row">
                                                <span className={`pill ${promptData?.puntaje_privacidad >= 3 ? 'on' : ''}`}>🛡️ Privacidad UNESCO</span>
                                                <span className={`pill ${promptData?.puntaje_agencia >= 3 ? 'on' : ''}`}>👤 Agencia Humana</span>
                                                <span className={`pill ${parseFloat(selectedFormReal?.desviacion) < 1.8 ? 'on' : ''}`}>📊 Consistencia ATLAS</span>
                                                <span className={`pill ${historial.length > 0 ? 'on' : ''}`}>♻️ Sostenibilidad</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ETAPA 5: HOJA DE RUTA (PLAN DE MEJORA) */}
                            {cierreStep === 5 && (() => {
                                // Calculamos automáticamente la dimensión con mayor oportunidad (la más baja)
                                const m = getMetricasAuditoria();
                                const dimensiones = [
                                    { nombre: 'Uso Pedagógico', valor: parseFloat(m.uso) },
                                    { nombre: 'Ética y Privacidad', valor: parseFloat(m.etica) },
                                    { nombre: 'Impacto en el Aprendizaje', valor: parseFloat(m.impacto) },
                                    { nombre: 'Desarrollo y Fundamentos', valor: parseFloat(m.desarrollo) }
                                ];
                                // Ordenamos de menor a mayor y tomamos la primera
                                const oportunidad = dimensiones.sort((a, b) => a.valor - b.valor)[0]?.nombre;

                                return (
                                    <div className="at-c5-roadmap-container animate-slide-up">
                                        {/* CABECERA ESTRATÉGICA */}
                                        <div className="at-c5-header">
                                            <span className="at-c5-badge">Fase 5: Sostener el Cambio</span>
                                            <h2 className="at-c5-title">Hoja de Ruta de Sostenibilidad</h2>
                                            <div className="at-c5-insight-box">
                                                <span className="at-c5-insight-label">Hallazgo del Ciclo:</span>
                                                <p>Tu dimensión con mayor oportunidad de consolidación es: <strong>{oportunidad}</strong></p>
                                            </div>
                                        </div>

                                        <div className="at-c5-roadmap-card">
                                            <div className="at-c5-instruction-text">
                                                <p>"Sostener implica mejorar de manera consciente. Define un compromiso realista para los próximos meses."</p>
                                            </div>

                                            <div className="at-c5-form-grid">
                                                {/* 1. PRIORIDAD */}
                                                <div className="at-c5-field full">
                                                    <label className="at-c5-label">1. Mi prioridad será fortalecer:</label>
                                                    <select
                                                        className="at-c5-select"
                                                        value={formDataCierre.prioridadSostener}
                                                        onChange={(e) => setFormDataCierre({ ...formDataCierre, prioridadSostener: e.target.value })}
                                                    >
                                                        <option value="">Selecciona una dimensión...</option>
                                                        <option value="Uso Pedagógico">Uso Pedagógico Intencional</option>
                                                        <option value="Ética">Ética y Privacidad</option>
                                                        <option value="Impacto">Impacto en el Aprendizaje</option>
                                                        <option value="Desarrollo">Desarrollo y Fundamentos</option>
                                                    </select>
                                                </div>

                                                {/* 2. ACCIÓN CONCRETA */}
                                                <div className="at-c5-field full">
                                                    <label className="at-c5-label">
                                                        2. Acción concreta que implementaré:
                                                        <span className={formDataCierre.compromisoAccion?.length < 150 ? "at-char-count error" : "at-char-count"}>
                                                            ({formDataCierre.compromisoAccion?.length || 0}/150 caracteres)
                                                        </span>
                                                    </label>
                                                    <textarea
                                                        className="at-c5-textarea"
                                                        placeholder="Describe detalladamente cómo aplicarás esto en tus clases..."
                                                        value={formDataCierre.compromisoAccion}
                                                        onChange={(e) => setFormDataCierre({ ...formDataCierre, compromisoAccion: e.target.value })}
                                                    />
                                                </div>

                                                {/* 3. EVIDENCIA */}
                                                <div className="at-c5-field">
                                                    <label className="at-c5-label">
                                                        3. Evidencia de mejora:
                                                        <span className={formDataCierre.evidenciaMejora?.length < 100 ? "at-char-count error" : "at-char-count"}>
                                                            ({formDataCierre.evidenciaMejora?.length || 0}/100)
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="at-c5-input"
                                                        placeholder="Ej: Portafolio de evidencias, resultados de examen..."
                                                        value={formDataCierre.evidenciaMejora}
                                                        onChange={(e) => setFormDataCierre({ ...formDataCierre, evidenciaMejora: e.target.value })}
                                                    />
                                                </div>

                                                {/* 4. FECHA */}
                                                <div className="at-c5-field">
                                                    <label className="at-c5-label">4. Fecha de revisión:</label>
                                                    <input
                                                        type="date"
                                                        className="at-c5-input-date"
                                                        value={formDataCierre.fechaRevision}
                                                        onChange={(e) => setFormDataCierre({ ...formDataCierre, fechaRevision: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* MENSAJE FINAL INSPIRACIONAL */}
                                            <div className="at-c5-footer-quote">
                                                <div className="at-quote-line"></div>
                                                <p className="at-main-quote">"No necesitas hacer más. Necesitas hacer mejor."</p>
                                                <p className="at-sub-quote">Este plan será tu guía para el siguiente ciclo ATLAS.</p>

                                                {/* Nueva sección de encuesta */}
                                                <div className="at-survey-section" style={{ marginTop: '20px' }}>
                                                    <p className="at-survey-text">
                                                        ¡Hola! Espero estés muy bien hoy. Por favor, llena esta última encuesta para saber de tu experiencia:
                                                    </p>
                                                    <a
                                                        href="https://tinyurl.com/cierre-piloto"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="at-survey-link"
                                                        style={{ color: '#007bff', fontWeight: 'bold', textDecoration: 'underline' }}
                                                    >
                                                        tinyurl.com/cierre-piloto
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Navegación Inferior */}
                            <div className="cierre-actions-footer">
                                {cierreStep > 1 && (
                                    <button className="btn-sos-secondary" onClick={() => {
                                        setCierreStep(cierreStep - 1);
                                        cierreTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}>Anterior</button>
                                )}
                                <button
                                    className="btn-sos-primary btn-large"
                                    onClick={() => {
                                        if (cierreStep === 5) {
                                            isReadOnly ? setView("menu") : handleFinalSaveCierre();
                                        } else {
                                            setCierreStep(cierreStep + 1);
                                            cierreTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }}
                                >
                                    {cierreStep === 5
                                        ? (isReadOnly ? "Finalizar Consulta" : "Finalizar Ciclo e Integrar")
                                        : "Siguiente Etapa"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE DIAGNÓSTICO INDIVIDUAL */}
            {showModal && (
                <div className="atl-an-overlay">
                    <div className="atl-an-modal wide animate-fade-in">
                        <div className="atl-an-modal-head">
                            <div className="atl-an-modal-head-flex">
                                <div>
                                    <h3>Reporte Individual: {userData.nombre_completo}</h3>
                                    <p className="atl-an-modal-sub">Marco COMPASS - Ciclo Sostener 2026</p>
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
                                            <span className="atl-an-val-primary">{toPct(historial[0].Promedio_Global)}%</span>
                                            <span className="atl-an-lbl">MEDIA GLOBAL</span>
                                        </div>
                                        <div className="atl-an-mini-box-dark">
                                            <span className="atl-an-val-small">{generarDiagnostico(toPct(historial[0].Promedio_Global)).nivel}</span>
                                            <span className="atl-an-lbl">NIVEL ACTUAL</span>
                                        </div>
                                    </div>

                                    <div className="atl-an-insight-card-individual">
                                        <h4 className="insight-title">💡 Diagnóstico Pedagógico</h4>
                                        <p className="insight-text">
                                            {generarDiagnostico(toPct(historial[0].Promedio_Global)).texto}
                                        </p>

                                        <h4 className="insight-sub-title">🔍 Implicación</h4>
                                        <p className="insight-sub-text">
                                            {generarDiagnostico(toPct(historial[0].Promedio_Global)).implicacion}
                                        </p>
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="atl-an-btn-full" onClick={() => setShowModal(false)}>Cerrar Reporte de Sostenibilidad</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuloSostenerDirectivo;
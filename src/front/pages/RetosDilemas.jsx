import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import "../Styles/LaboratorioEtico.css";
import { Icono } from "./Icono";

// ── Los 5 casos con estructura completa (estilo Morales-Chan) ──
// Cada opción trae su texto formativo (formativo) y lo que sostiene/expone
// se usa solo para mostrar al final; el CÁLCULO real lo hace el backend.
const CASOS = {
    caso01: {
        titulo: "El correo de las siete",
        momento: "Miércoles, 07:10 · Tu escritorio",
        contexto: "Un estudiante te pide prórroga: su mamá está hospitalizada y adjunta una historia clínica. El correo es impecable, cálido, con los datos exactos, y algo en la redacción te hace dudar: suena a IA. Le diste prórroga a otros dos esta semana por razones menos documentadas.",
        enJuego: "Una prórroga y qué peso le das a la forma en que alguien te pide ayuda.",
        sabes: "Que el correo probablemente fue redactado con IA. Que a otros les diste prórroga con menos evidencia.",
        noSabes: "Si la situación es real. Si usó IA para escribir mejor algo que sí le pasa, o para inventarlo.",
        plazo: "La entrega cierra hoy a medianoche.",
        opciones: {
            A: { titulo: "Das la prórroga sin más", desc: "Ante la duda, a favor de la persona.", formativo: "Eliges no convertir la sospecha en un obstáculo para quien quizá está en crisis. Pero al no nombrar tu duda, dejas sin regla el hecho de que la forma del correo influye en tu decisión.", claustro: "¿Estamos evaluando la necesidad del estudiante o su capacidad de redactar la súplica perfecta?" },
            B: { titulo: "Le dices que notas uso de IA y le pides que te lo cuente con sus palabras", desc: "Antes de decidir, una conversación.", formativo: "Devuelves la petición a un terreno humano. El riesgo es que quien de verdad está desbordado no tenga energía para demostrarlo, y le exijas un peaje emocional justo cuando menos puede pagarlo.", claustro: "¿Cuándo pedir explicaciones protege la equidad y cuándo castiga al que ya está mal?" },
            C: { titulo: "Ignoras cómo se escribió y decides solo por la evidencia", desc: "La historia clínica pesa; la redacción no.", formativo: "Separas el medio del fondo: importa si el hecho es cierto, no con qué herramienta se escribió. Lo que dejas fuera es la conversación sobre para qué sí y para qué no usar IA.", claustro: "¿Podemos evaluar la sustancia de una petición sin que su forma nos sesgue?" },
            D: { titulo: "Publicas una regla de prórrogas para todo el curso y la aplicas ya", desc: "La norma que faltaba, para todos.", formativo: "Conviertes un caso en política, y eso evita el favoritismo. Pero una regla que nace hoy y se aplica hoy cae con todo su peso sobre este estudiante, que quedó del lado equivocado del cambio sin saberlo.", claustro: "¿A partir de quién empieza a regir una regla que escribimos por un caso puntual?" },
        },
    },
    caso02: {
        titulo: "Noventa y uno por ciento",
        momento: "Martes, 06:50 · Sala de profesores",
        contexto: "El detector marca el trabajo de una estudiante en 91%, el más alto del grupo, y el sistema ya envió el reporte a coordinación. Ella tiene dislexia con ajustes aprobados. No lo niega: las ideas son suyas —te muestra borradores— y usó IA para organizar y corregir, porque escribir en limpio le toma el triple.",
        enJuego: "La nota final y un reporte que ya salió de tu curso.",
        sabes: "Que las ideas son de ella. Que tiene ajustes razonables aprobados. Que el proveedor del detector admite falsos positivos con textos muy corregidos.",
        noSabes: "Si el 91% se explica solo por la corrección. Si el reglamento te obliga a seguir el reporte.",
        plazo: "Coordinación pide tu respuesta el jueves.",
        opciones: {
            A: { titulo: "Aplicas el procedimiento que marca el reporte", desc: "La norma existe y es igual para todos.", formativo: "'Igual para todos' sobre una desigualdad de partida no es equidad: es dejar que una herramienta con falsos positivos decida sobre alguien a quien la institución ya le reconoció un apoyo.", claustro: "¿Un procedimiento automático puede pesar más que un ajuste razonable que aprobamos?" },
            B: { titulo: "Cierras el caso y se lo comunicas a coordinación por escrito", desc: "El reporte no prueba nada.", formativo: "Pones tu criterio por encima del detector, que es lo que debe hacer un docente. Al cerrarlo sin acordar cómo se declara el uso de IA a futuro, resuelves este caso pero no el próximo.", claustro: "¿Quién responde cuando un sistema señala a un estudiante y estábamos equivocados?" },
            C: { titulo: "Revisan juntos el borrador y acuerdan cómo declarar el uso de IA", desc: "Tu criterio decide; el detector solo levantó la mano.", formativo: "Transformas la acusación en aprendizaje. El punto ciego es institucional: el reporte ya salió, y arreglarlo entre los dos no responde ante la instancia que lo recibió.", claustro: "¿La solución dentro del aula nos exime de responder ante el sistema que activó la alerta?" },
            D: { titulo: "Evalúas contra el ajuste razonable ya aprobado", desc: "El apoyo que usó es el que la institución le reconoció.", formativo: "Conectas el uso de IA con el derecho ya reconocido. Lo que queda pendiente es explicitarlo: si el ajuste incluye asistencia de IA, debería estar escrito antes, no interpretarse bajo presión.", claustro: "¿Nuestros ajustes razonables contemplan la IA como accesibilidad, o la tratamos como trampa por defecto?" },
        },
    },
    caso03: {
        titulo: "Ciento diez trabajos",
        momento: "Jueves, 22:00 · Tu casa",
        contexto: "Ciento diez trabajos finales, dos días, y semanas durmiendo poco por algo personal. Armas un prompt con tu rúbrica y ejemplos. Calificas doce a mano para comparar: la IA coincide contigo en diez. En veinte minutos tendrías los ciento diez, con comentarios más largos. Tu institución no tiene norma sobre esto.",
        enJuego: "Ciento diez calificaciones y el método con que las produces.",
        sabes: "Que en doce de prueba coincidió contigo en diez. Que no hay norma institucional.",
        noSabes: "Qué hará en los otros noventa y ocho. Cuántos pedirían revisión si lo declaras.",
        plazo: "Dos días. Varios necesitan la nota cerrada para un proceso de becas.",
        opciones: {
            A: { titulo: "La usas y no lo mencionas", desc: "Un mismo criterio, 110 veces, sin fatiga.", formativo: "La consistencia es un argumento real: tú a las tres de la mañana no eres el mismo evaluador. Pero calificar sin decirlo rompe el pacto de que detrás de una nota hay un juicio humano que el estudiante puede reclamar.", claustro: "¿Una nota puesta por IA sin declararlo sigue siendo evaluación, o ya es otra cosa?" },
            B: { titulo: "La usas, lo declaras y ofreces revisión a quien la pida", desc: "Y asumes las revisiones que lleguen.", formativo: "Es la ruta que menos cede: dices cómo calificas y dejas la puerta abierta a revisión humana. El costo lo asumes tú, no el estudiante. La pregunta es si tu institución te respalda.", claustro: "¿Estamos dispuestos a asumir el trabajo extra de ser transparentes, o preferimos el atajo?" },
            C: { titulo: "Calificas tú una muestra y dejas que la IA haga el resto", desc: "Control de calidad, como cualquier coordinador.", formativo: "La supervisión por muestreo es legítima en muchos oficios. En evaluación tiene un filo: los del 90% no revisado reciben un juicio distinto, y ninguno sabe en cuál grupo quedó.", claustro: "¿Es justo que unos trabajos pasen por ojo humano y otros no, si ninguno lo eligió?" },
            D: { titulo: "Pides prórroga y calificas a mano", desc: "Evaluar es un juicio que no se delega.", formativo: "Defiendes que la evaluación es intransferible, y es honorable. El costo cae sobre los que necesitan la nota para la beca: tu principio los deja esperando.", claustro: "¿Cuándo nuestra exigencia de hacer las cosas bien se paga con el tiempo de quien menos puede esperar?" },
        },
    },
    caso04: {
        titulo: "El caso perfecto",
        momento: "Miércoles, 10:20 · Aula",
        contexto: "Generaste un caso de estudio con IA en diez minutos y el grupo lleva veinte discutiéndolo con ganas. Una estudiante lee en voz alta lo que nadie notó: los que mandan son hombres 'de carácter', las mujeres 'cuidan y apoyan', el que incumple es 'un migrante'. Quedan veinte minutos y ese caso entra en la evaluación del viernes.",
        enJuego: "Veinte minutos y lo que el grupo se lleva de lo que acaba de leer.",
        sabes: "Que el material lo elegiste tú. Que el tema entra en la evaluación.",
        noSabes: "Cuántos lo habían notado y callaron. Si la estudiante que lo dijo queda señalada.",
        plazo: "Veinte minutos.",
        opciones: {
            A: { titulo: "Reconoces el error, cambias de material y sigues con el tema", desc: "La evaluación es el viernes.", formativo: "Asumes que el material era tuyo, lo cual es correcto. Pero pasas de largo por una oportunidad de oro: un sesgo visible, señalado por una estudiante, apagado para volver al temario.", claustro: "¿Cuánto contenido vale sacrificar cuando la clase produce un ejemplo perfecto de lo que enseñamos?" },
            B: { titulo: "Paras y conviertes el caso en el objeto de análisis", desc: "A costa del contenido de la evaluación.", formativo: "Aprovechas el momento didáctico y validas a quien lo señaló. El riesgo es de gestión: si el tema entra el viernes y no lo cubres, el costo recae sobre las notas de todos.", claustro: "¿Improvisar sobre lo que emerge en clase es rigor o descuido de lo que prometimos evaluar?" },
            C: { titulo: "Explicas cómo se cuelan esos sesgos y continúas", desc: "Cinco minutos de contexto y de vuelta al caso.", formativo: "La solución intermedia enseña algo real sin descarrilar la clase. Lo que queda a medias es la persona del estereotipo: explicaste el mecanismo, pero no el daño concreto.", claustro: "¿Explicar por qué existe un sesgo nos exime de detenernos en a quién lastima?" },
            D: { titulo: "Propones al grupo rehacer el caso como tarea evaluada", desc: "Que la crítica se vuelva trabajo que cuenta.", formativo: "Conviertes la crítica en producción, lo más potente que puede pasar en un aula. El punto ciego: rehacerlo bien puede depender de recursos y tiempo que no todos tienen fuera de clase.", claustro: "¿Convertir una discusión en tarea amplía el aprendizaje o lo traslada a quien tiene más medios?" },
        },
    },
    caso05: {
        titulo: "Las dos de la mañana",
        momento: "Viernes, 07:00 · Revisando el chatbot del curso",
        aviso: "Si algo de este caso te toca de cerca, vale la pena hablarlo con un profesional o con la orientación de tu institución.",
        contexto: "Montaste un chatbot con los temas del curso. En el registro encuentras una conversación de las 02:14: una estudiante escribe que no puede dormir, que hace días no le encuentra sentido a nada. El bot respondió con cinco técnicas de estudio. Son las siete; su clase es a las nueve.",
        enJuego: "El acompañamiento de una persona, y qué hacer con un sistema que no supo verla.",
        sabes: "Que escribió eso a las 02:14 y el bot no lo detectó. Que la institución tiene orientación.",
        noSabes: "Si hubo señales antes en otras conversaciones. Si otros escribieron algo parecido.",
        plazo: "Su clase es a las nueve. El chatbot sigue encendido.",
        opciones: {
            A: { titulo: "Hablas con ella, la acompañas a orientación, y ahí te detienes", desc: "El sistema queda igual hasta saber qué cambiar.", formativo: "Priorizas a la persona sobre el sistema, correcto en el orden. Pero dejar el chatbot encendido significa que otro estudiante puede escribir a las 02:14 y recibir cinco técnicas de estudio.", claustro: "¿Atender a la persona nos autoriza a dejar corriendo el sistema que la falló?" },
            B: { titulo: "Hablas con ella y apagas el chatbot hasta rediseñarlo", desc: "Nadie más habla con ese sistema mientras tanto.", formativo: "Cortas el riesgo de raíz. El costo silencioso es que apagas el acceso legítimo de los otros ciento cincuenta que lo usaban bien para estudiar a horas en que no tienen a nadie.", claustro: "¿Apagar una herramienta por su peor falla es prudencia o renunciar al bien que hacía?" },
            C: { titulo: "Le agregas al bot protocolo de crisis y aviso de límites", desc: "Derivación automática y advertencia visible, sin apagarlo.", formativo: "Arreglas el sistema sin sacrificar su utilidad. El punto delicado es confiar la detección de una crisis a un automatismo: seguir dependiendo de que la máquina detecte es parte de lo que falló.", claustro: "¿Un mejor protocolo automático resuelve el problema o solo lo hace más difícil de ver?" },
            D: { titulo: "Avisas a orientación y revisas las conversaciones anteriores", desc: "Buscas si hubo más señales que nadie vio.", formativo: "Vas más allá del caso visible, un acto de cuidado real. El filo: revisar conversaciones privadas —aun con buena intención— entra en datos sensibles que los estudiantes no sabían que quedaban registrados.", claustro: "¿Hasta dónde podemos leer lo que confiaron a un bot creyéndolo privado, incluso para cuidarlos?" },
        },
    },
};

const PRINCIPIOS = [
    "Agencia humana", "Supervisión humana", "Transparencia", "Responsabilidad",
    "Equidad", "Inclusión y acceso", "Privacidad", "No dañar", "Alfabetización crítica",
];

// La clave interna no cambia (el backend sigue igual). Aquí solo cambia cómo se muestra y se explica.
const PRINCIPIOS_INFO = {
    "Agencia humana": { nombre: "Agencia humana", idea: "Las personas deciden; la IA solo propone.", marco: "UNESCO 2024: enfoque centrado en lo humano", consejo: "Antes de decidir, pregúntate quién tiene la última palabra y si esa persona puede explicar su decisión." },
    "Supervisión humana": { nombre: "Supervisión humana", idea: "Alguien revisa lo que hace la IA y puede corregirlo.", marco: "AI Act: supervisión humana de los sistemas de IA", consejo: "Define un momento fijo en el que revisas lo que produce la IA antes de que afecte a un estudiante." },
    "Transparencia": { nombre: "Transparencia", idea: "Se sabe cuándo y cómo se usa IA.", marco: "UNESCO 2021: transparencia y explicabilidad", consejo: "Cuéntale a tus estudiantes cuándo y cómo usas IA, y pídeles lo mismo." },
    "Responsabilidad": { nombre: "Responsabilidad", idea: "Alguien responde por la decisión y por sus efectos.", marco: "UNESCO 2021: responsabilidad y rendición de cuentas", consejo: "Si una decisión sale mal, deja claro quién responde y cómo se corrige." },
    "Equidad": { nombre: "Equidad", idea: "Una misma regla no debe producir daños desiguales.", marco: "UNESCO 2021: equidad y no discriminación", consejo: "Pregúntate si aplicarías la misma medida a todo el grupo; si no, revisa el diseño de la medida." },
    "Inclusión y acceso": { nombre: "Inclusión y acceso", idea: "Nadie queda por fuera por su condición o sus recursos.", marco: "UNESCO 2024: inclusión; Decreto 1421 de 2017", consejo: "Verifica que tu decisión no deje por fuera a quien tiene menos tiempo, recursos o apoyos." },
    "Privacidad": { nombre: "Privacidad", idea: "Los datos personales se cuidan y se usan solo para lo necesario.", marco: "UNESCO 2021: privacidad; Ley 1581 de 2012", consejo: "Usa solo los datos necesarios y avisa qué queda registrado." },
    "No dañar": { nombre: "Prevención del daño", idea: "Primero evitar que alguien salga lastimado, física, emocional o académicamente.", marco: "UNESCO 2021: proporcionalidad e inocuidad", consejo: "Cuando hay una persona en riesgo, atiéndela primero y después ajusta el sistema." },
    "Alfabetización crítica": { nombre: "Alfabetización crítica", idea: "Entender cómo funciona la IA, dónde falla y por qué.", marco: "UNESCO 2021 y 2024: alfabetización en IA", consejo: "Convierte los errores de la IA en ocasiones para enseñar cómo funciona y dónde falla." },
};
const nombreP = (p) => PRINCIPIOS_INFO[p]?.nombre || p;

// Copia de la matriz del backend (routes.py → DILEMAS_MATRIZ), para dar la retroalimentación al instante
const MATRIZ = {
    caso01: {
        A: { sostiene: ["No dañar", "Inclusión y acceso"], expone: ["Transparencia", "Responsabilidad"] },
        B: { sostiene: ["Transparencia", "Agencia humana"], expone: ["No dañar", "Inclusión y acceso"] },
        C: { sostiene: ["Equidad", "Responsabilidad"], expone: ["Alfabetización crítica"] },
        D: { sostiene: ["Transparencia", "Equidad"], expone: ["No dañar"] },
    },
    caso02: {
        A: { sostiene: ["Responsabilidad", "Equidad"], expone: ["Inclusión y acceso", "No dañar"] },
        B: { sostiene: ["Supervisión humana", "No dañar"], expone: ["Transparencia"] },
        C: { sostiene: ["Transparencia", "Alfabetización crítica"], expone: ["Responsabilidad"] },
        D: { sostiene: ["Inclusión y acceso", "Equidad"], expone: ["Transparencia"] },
    },
    caso03: {
        A: { sostiene: ["Equidad"], expone: ["Transparencia", "Responsabilidad", "Alfabetización crítica"] },
        B: { sostiene: ["Transparencia", "Responsabilidad"], expone: [] },
        C: { sostiene: ["Supervisión humana"], expone: ["Equidad", "Transparencia"] },
        D: { sostiene: ["Agencia humana", "Supervisión humana"], expone: ["No dañar", "Inclusión y acceso"] },
    },
    caso04: {
        A: { sostiene: ["Responsabilidad"], expone: ["Alfabetización crítica", "No dañar"] },
        B: { sostiene: ["Alfabetización crítica", "Agencia humana"], expone: ["Responsabilidad"] },
        C: { sostiene: ["Alfabetización crítica"], expone: ["Equidad", "No dañar"] },
        D: { sostiene: ["Agencia humana", "Alfabetización crítica"], expone: ["Inclusión y acceso"] },
    },
    caso05: {
        A: { sostiene: ["No dañar", "Supervisión humana"], expone: ["Responsabilidad"] },
        B: { sostiene: ["No dañar", "Responsabilidad"], expone: ["Inclusión y acceso"] },
        C: { sostiene: ["Responsabilidad", "Transparencia"], expone: ["Supervisión humana"] },
        D: { sostiene: ["Supervisión humana", "No dañar"], expone: ["Privacidad"] },
    },
};

// Opción más equilibrada por caso (revisable por el equipo pedagógico)
const RECOMENDADAS = {
    caso01: { opcion: "C", porque: "Decides por la evidencia y no por cómo está escrito el correo: evitas que tu sospecha sobre la IA se convierta en un sesgo contra el estudiante." },
    caso02: { opcion: "D", porque: "El ajuste razonable ya aprobado es un derecho reconocido. Tu criterio, apoyado en él, pesa más que un detector con falsos positivos." },
    caso03: { opcion: "B", porque: "Declarar el uso de IA y ofrecer revisión humana mantiene la transparencia y el derecho a reclamar, sin frenar a quienes necesitan la nota." },
    caso04: { opcion: "B", porque: "Convertir el sesgo en objeto de análisis enseña a leer críticamente la IA y respalda a la estudiante que se atrevió a señalarlo." },
    caso05: { opcion: "B", porque: "Ante una posible crisis, primero se protege a la persona y se detiene el sistema que falló hasta rediseñarlo: prevenir el daño va antes que la utilidad." },
};

// Videos o audios por caso (pega el enlace cuando los tengas)
// Formato: { tipo: "video", url: "https://..." }  o  { tipo: "audio", url: "https://....mp3" }
const MEDIA_CASOS = {
    caso01: null,
    caso02: null,
    caso03: null,
    caso04: null,
    caso05: null,
};

const elegirAlAzar = (obj, n) => {
    const keys = Object.keys(obj);
    for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    return keys.slice(0, n);
};

const MediaCaso = ({ media }) => {
    if (!media?.url) return null;
    if (media.tipo === "audio") return <audio className="dil-media-audio" controls src={media.url} />;
    return (
        <div className="dil-media-video">
            <iframe src={media.url} title="Video del caso" allow="fullscreen; encrypted-media" />
        </div>
    );
};

const Dato = ({ icono, etiqueta, valor }) => (
    <div className="dil-dato">
        <span><Icono nombre={icono} size={14} /> {etiqueta}</span>
        <p>{valor}</p>
    </div>
);

// ── Balanza de responsabilidad: rojo a la izquierda (expuesto), verde a la derecha (sostenido) ──
const BalanzaResponsabilidad = ({ conteo }) => {
    const filas = PRINCIPIOS
        .map(p => ({ p, ...(conteo?.[p] || { sostenido: 0, expuesto: 0, en_juego: 0 }) }))
        .filter(f => f.en_juego > 0)
        .sort((a, b) => (b.sostenido - b.expuesto) - (a.sostenido - a.expuesto));
    const max = Math.max(1, ...filas.map(f => Math.max(f.sostenido, f.expuesto)));

    return (
        <div className="dil-balanza">
            <div className="dil-balanza-head">
                <span />
                <span>Quedó expuesto</span>
                <span>Lo protegiste</span>
            </div>
            {filas.map(f => (
                <div key={f.p} className="dil-balanza-row">
                    <div className="dil-balanza-label">
                        <strong>{nombreP(f.p)}</strong>
                        <small>{PRINCIPIOS_INFO[f.p]?.idea}</small>
                    </div>
                    <div className="dil-balanza-bars">
                        <div className="dil-bar-side izq">
                            {f.expuesto > 0 && (
                                <span className="dil-bar expuesto" style={{ width: `${(f.expuesto / max) * 100}%` }}>{f.expuesto}</span>
                            )}
                        </div>
                        <div className="dil-bar-eje" />
                        <div className="dil-bar-side der">
                            {f.sostenido > 0 && (
                                <span className="dil-bar sostenido" style={{ width: `${(f.sostenido / max) * 100}%` }}>{f.sostenido}</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const RetosDilemas = ({ userData, apiFetch, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [casosAsignados, setCasosAsignados] = useState([]);
    const [selecciones, setSelecciones] = useState({});
    const [confirmados, setConfirmados] = useState({});
    const [resultado, setResultado] = useState(null);
    const [vista, setVista] = useState("intro"); // intro | caso | resultado
    const [indice, setIndice] = useState(0);
    const inicioRef = useRef(null);
    const N_CASOS = 5;

    useEffect(() => {
        const init = async () => {
            try {
                const reg = await apiFetch("/api/liderar/dilemas/mi-registro").catch(() => null);
                if (reg && reg.status === "COMPLETADO") {
                    const casos = reg.casos_asignados || [];
                    setResultado(reg);
                    setCasosAsignados(casos);
                    setSelecciones(reg.selecciones || {});
                    setConfirmados(Object.fromEntries(casos.map(c => [c, true])));
                    setVista("resultado");
                } else {
                    setCasosAsignados(elegirAlAzar(CASOS, N_CASOS));
                }
            } catch (e) {
                console.error("Error cargando dilemas:", e);
                setCasosAsignados(elegirAlAzar(CASOS, N_CASOS));
            } finally {
                setLoading(false);
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Subir al inicio en cada cambio de pantalla (funciona también dentro del panel del dashboard)
    useEffect(() => {
        if (loading) return;
        requestAnimationFrame(() => inicioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }, [vista, indice, loading]);

    const casoId = casosAsignados[indice];
    const caso = CASOS[casoId];
    const total = casosAsignados.length;
    const esAcierto = (c) => selecciones[c] === RECOMENDADAS[c]?.opcion;

    const seleccionar = (letra) => {
        if (resultado || confirmados[casoId]) return;
        setSelecciones(prev => ({ ...prev, [casoId]: letra }));
    };

    const confirmar = () => {
        if (!selecciones[casoId]) return;
        setConfirmados(prev => ({ ...prev, [casoId]: true }));
    };

    const handleFinalizar = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const reg = await apiFetch("/api/liderar/dilemas", {
                method: "POST",
                body: JSON.stringify({ casos_asignados: casosAsignados, selecciones }),
            });
            setResultado(reg);
            setVista("resultado");
        } catch (e) {
            console.error(e);
            Swal.fire({ title: "No se pudo guardar tu análisis", text: "Revisa tu conexión e inténtalo de nuevo.", icon: "error", confirmButtonColor: "#c5a059" });
        } finally {
            setIsSaving(false);
        }
    };

    const siguiente = () => {
        if (indice < total - 1) setIndice(i => i + 1);
        else handleFinalizar();
    };

    const rehacer = () => {
        setResultado(null);
        setSelecciones({});
        setConfirmados({});
        setIndice(0);
        setCasosAsignados(elegirAlAzar(CASOS, N_CASOS));
        setVista("intro");
    };

    if (loading) {
        return (
            <div className="latlab-unique-wrapper">
                <div className="atlas-sync-float">
                    <div className="atlas-sync-pill">
                        <span className="sync-text">Cargando dilemas...</span>
                    </div>
                </div>
            </div>
        );
    }

    // ── Datos del resultado ──
    const aciertosTotales = casosAsignados.filter(esAcierto).length;
    const mensajeResumen = aciertosTotales >= 4
        ? "Tus decisiones tienden a proteger los principios más importantes de cada situación. Mira abajo cuáles sostienes con más firmeza."
        : aciertosTotales >= 2
            ? "En algunos casos encontraste el equilibrio; en otros cediste principios que conviene revisar. La balanza te muestra cuáles."
            : "Tus decisiones priorizan resolver rápido. Revisa abajo qué principios quedan expuestos con más frecuencia y por qué importan.";

    const recomendaciones = resultado
        ? PRINCIPIOS
            .map(p => {
                const c = resultado.conteo_principios?.[p] || { en_juego: 0, expuesto: 0 };
                return { p, ratio: c.en_juego > 0 ? c.expuesto / c.en_juego : -1, ...c };
            })
            .filter(x => x.ratio > 0)
            .sort((a, b) => b.ratio - a.ratio)
            .slice(0, 3)
        : [];

    return (
        <div className="latlab-unique-wrapper" ref={inicioRef}>
            <header className="latlab-main-header">
                <div className="latlab-header-brand">
                    <button className="latlab-btn-back dil-back" onClick={() => onNavigate('fase_liderar')}>
                        <Icono nombre="atras" size={15} /> Atrás
                    </button>
                    <h1>Dilemas éticos</h1>
                </div>
                {vista === "caso" && <span className="dil-header-count">Caso {indice + 1} de {total}</span>}
            </header>

            {vista === "caso" && (
                <div className="dil-progress" aria-hidden="true">
                    {casosAsignados.map((c, i) => (
                        <span key={c} className={`dil-seg ${confirmados[c] ? (esAcierto(c) ? "ok" : "bad") : i === indice ? "actual" : ""}`} />
                    ))}
                </div>
            )}

            <main className="latlab-vertical-container">

                {/* ═══════════ 1. INSTRUCCIONES ═══════════ */}
                {vista === "intro" && (
                    <section className="latlab-card dil-anim">
                        <div className="latlab-card-title-row">
                            <div className="latlab-title-group">
                                <span className="latlab-step-badge">Misión 3</span>
                                <h3 className="latlab-main-title">Cinco decisiones difíciles</h3>
                            </div>
                            <p className="latlab-description">
                                Vas a vivir cinco situaciones reales de aula donde la IA complica una decisión. Cada opción protege
                                unos principios éticos y deja otros expuestos. Al final verás tu balanza de responsabilidad.
                            </p>
                        </div>

                        <ol className="dil-pasos">
                            <li>
                                <span className="dil-paso-num">1</span>
                                <div><strong>Lee el caso</strong><p>Fíjate en lo que está en juego, lo que sabes, lo que no sabes y el plazo que tienes.</p></div>
                            </li>
                            <li>
                                <span className="dil-paso-num">2</span>
                                <div><strong>Decide</strong><p>Elige lo que harías tú de verdad, no lo que crees que se espera. Luego confirma tu decisión.</p></div>
                            </li>
                            <li>
                                <span className="dil-paso-num">3</span>
                                <div><strong>Descubre</strong><p>Verás en verde los principios que protegiste, en rojo los que dejaste expuestos, y cuál era la opción más equilibrada.</p></div>
                            </li>
                            <li>
                                <span className="dil-paso-num">4</span>
                                <div><strong>Mira tu balanza</strong><p>Con los cinco casos verás en qué principios eres firme y dónde tiendes a ceder.</p></div>
                            </li>
                        </ol>

                        <div className="dil-principios">
                            <h4>Los nueve principios que vas a poner en juego</h4>
                            <p>Basados en la Recomendación UNESCO sobre la Ética de la IA (2021), el AI Competency Framework for Teachers (UNESCO 2024) y el AI Act.</p>
                            <div className="dil-principios-grid">
                                {PRINCIPIOS.map(p => (
                                    <div key={p} className="dil-principio">
                                        <strong>{nombreP(p)}</strong>
                                        <p>{PRINCIPIOS_INFO[p].idea}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="dil-actions">
                            <button className="latlab-btn-finish dil-btn" onClick={() => setVista("caso")}>
                                Empezar el primer caso <Icono nombre="adelante" size={18} />
                            </button>
                        </div>
                    </section>
                )}

                {/* ═══════════ 2. UN CASO POR PANTALLA ═══════════ */}
                {vista === "caso" && caso && (() => {
                    const confirmado = !!confirmados[casoId];
                    const letraElegida = selecciones[casoId];
                    const rec = RECOMENDADAS[casoId];
                    const acierto = letraElegida === rec?.opcion;
                    const efecto = MATRIZ[casoId]?.[letraElegida] || { sostiene: [], expone: [] };
                    const op = caso.opciones[letraElegida];

                    return (
                        <section className="latlab-card dil-anim" key={casoId}>
                            <div className="dil-caso-meta">
                                <span>Caso {indice + 1} de {total}</span>
                                <span><Icono nombre="reloj" size={14} /> {caso.momento}</span>
                            </div>
                            <h3 className="dil-caso-titulo">{caso.titulo}</h3>

                            <MediaCaso media={MEDIA_CASOS[casoId]} />

                            {caso.aviso && (
                                <div className="dil-aviso"><Icono nombre="alerta" size={16} /> {caso.aviso}</div>
                            )}

                            <p className="dil-contexto">{caso.contexto}</p>

                            <div className="dil-datos">
                                <Dato icono="diana" etiqueta="En juego" valor={caso.enJuego} />
                                <Dato icono="reloj" etiqueta="Plazo" valor={caso.plazo} />
                                <Dato icono="ojo" etiqueta="Lo que sabes" valor={caso.sabes} />
                                <Dato icono="pregunta" etiqueta="Lo que no sabes" valor={caso.noSabes} />
                            </div>

                            <p className="dil-pregunta">¿Qué haces?</p>
                            <div className="dil-opciones">
                                {Object.entries(caso.opciones).map(([letra, o]) => {
                                    const elegida = letraElegida === letra;
                                    const esRecomendada = rec?.opcion === letra;
                                    let estado = elegida ? "elegida" : "";
                                    if (confirmado) {
                                        if (elegida) estado = esRecomendada ? "acierto" : "error";
                                        else estado = esRecomendada ? "recomendada" : "apagada";
                                    }
                                    return (
                                        <button key={letra} type="button" className={`dil-opcion ${estado}`}
                                            onClick={() => seleccionar(letra)} disabled={confirmado}>
                                            <span className="dil-opcion-letra">
                                                {confirmado && elegida ? <Icono nombre={esRecomendada ? "check" : "alerta"} size={15} /> : letra}
                                            </span>
                                            <span className="dil-opcion-texto">
                                                <strong>{o.titulo}</strong>
                                                <small>{o.desc}</small>
                                            </span>
                                            {confirmado && esRecomendada && <em className="dil-opcion-tag">Más equilibrada</em>}
                                        </button>
                                    );
                                })}
                            </div>

                            {!confirmado ? (
                                <div className="dil-actions">
                                    <button className="latlab-btn-finish dil-btn" disabled={!letraElegida} onClick={confirmar}>
                                        Confirmar mi decisión
                                    </button>
                                    {!letraElegida && <small className="dil-hint">Elige una opción para continuar.</small>}
                                </div>
                            ) : (
                                <div className={`dil-feedback ${acierto ? "ok" : "bad"}`}>
                                    <div className="dil-feedback-head">
                                        <span className="dil-feedback-icon"><Icono nombre={acierto ? "check" : "alerta"} size={20} /></span>
                                        <div>
                                            <strong>{acierto ? "Elegiste la opción más equilibrada" : "Hay una opción que protege más principios"}</strong>
                                            <p>{acierto ? rec.porque : `La opción más equilibrada era la ${rec.opcion}. ${rec.porque}`}</p>
                                        </div>
                                    </div>

                                    <div className="dil-feedback-cols">
                                        <div>
                                            <span className="dil-col-title ok">Tu decisión protege</span>
                                            <div className="dil-chips">
                                                {efecto.sostiene.map(p => <span key={p} className="dil-chip ok" title={PRINCIPIOS_INFO[p]?.idea}>{nombreP(p)}</span>)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="dil-col-title bad">Deja expuesto</span>
                                            <div className="dil-chips">
                                                {efecto.expone.length
                                                    ? efecto.expone.map(p => <span key={p} className="dil-chip bad" title={PRINCIPIOS_INFO[p]?.idea}>{nombreP(p)}</span>)
                                                    : <span className="dil-chip neutro">Ningún principio</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {op && <p className="dil-formativo">{op.formativo}</p>}
                                    {op && <p className="dil-claustro"><strong>Para conversar con tus colegas:</strong> {op.claustro}</p>}

                                    <div className="dil-actions">
                                        <button className="latlab-btn-finish dil-btn" onClick={siguiente} disabled={isSaving}>
                                            {indice < total - 1
                                                ? <>Siguiente caso <Icono nombre="adelante" size={18} /></>
                                                : isSaving ? "Analizando…" : <>Ver mi balanza <Icono nombre="adelante" size={18} /></>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    );
                })()}

                {/* ═══════════ 3. RESULTADO ═══════════ */}
                {vista === "resultado" && resultado && (
                    <>
                        <section className="latlab-card dil-anim">
                            <div className="dil-resumen-head">
                                <div className="dil-resumen-score">
                                    <span>{aciertosTotales}</span>
                                    <small>de {total} equilibradas</small>
                                </div>
                                <div>
                                    <h3>Tu balanza de responsabilidad</h3>
                                    <p>{mensajeResumen}</p>
                                </div>
                            </div>
                            <div className="dil-progress dil-progress-inline" aria-hidden="true">
                                {casosAsignados.map(c => <span key={c} className={`dil-seg ${esAcierto(c) ? "ok" : "bad"}`} />)}
                            </div>
                        </section>

                        <section className="latlab-card">
                            <div className="latlab-card-title-row">
                                <div className="latlab-title-group">
                                    <span className="latlab-step-badge">Tu balanza</span>
                                    <h3 className="latlab-main-title">Qué protegiste y qué dejaste expuesto</h3>
                                </div>
                                <p className="latlab-description">
                                    Cada fila es un principio. A la derecha, las veces que tus decisiones lo protegieron; a la izquierda,
                                    las veces que lo dejaron expuesto. Arriba están tus principios más firmes; abajo, los que más cediste.
                                </p>
                            </div>
                            <BalanzaResponsabilidad conteo={resultado.conteo_principios} />
                        </section>

                        {recomendaciones.length > 0 && (
                            <section className="latlab-card">
                                <div className="latlab-card-title-row">
                                    <div className="latlab-title-group">
                                        <span className="latlab-step-badge">Recomendaciones</span>
                                        <h3 className="latlab-main-title">Empieza por lo que más cediste</h3>
                                    </div>
                                </div>
                                <div className="dil-recos">
                                    {recomendaciones.map(r => (
                                        <div key={r.p} className="dil-reco">
                                            <div className="dil-reco-top">
                                                <strong>{nombreP(r.p)}</strong>
                                                <small>Expuesto {r.expuesto} de {r.en_juego} {r.en_juego === 1 ? "vez" : "veces"} que estuvo en juego</small>
                                            </div>
                                            <p>{PRINCIPIOS_INFO[r.p]?.idea}</p>
                                            <p className="dil-reco-consejo">{PRINCIPIOS_INFO[r.p]?.consejo}</p>
                                            <span className="dil-reco-marco">{PRINCIPIOS_INFO[r.p]?.marco}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="latlab-card">
                            <div className="latlab-card-title-row">
                                <div className="latlab-title-group">
                                    <span className="latlab-step-badge">Tus decisiones</span>
                                    <h3 className="latlab-main-title">Lo que dejó cada elección</h3>
                                </div>
                                <p className="latlab-description">Toca cada caso para volver a leer la reflexión.</p>
                            </div>
                            {casosAsignados.map(c => {
                                const cs = CASOS[c];
                                const l = selecciones[c];
                                const op = cs?.opciones?.[l];
                                if (!op) return null;
                                const ok = esAcierto(c);
                                const rec = RECOMENDADAS[c];
                                return (
                                    <details key={c} className={`dil-recap ${ok ? "ok" : "bad"}`}>
                                        <summary>
                                            <small>{cs.titulo}</small>
                                            <strong>{l}. {op.titulo}</strong>
                                        </summary>
                                        <div className="dil-recap-body">
                                            <p>{op.formativo}</p>
                                            {!ok && rec && <p><strong>Opción más equilibrada ({rec.opcion}):</strong> {rec.porque}</p>}
                                            <p className="dil-claustro"><strong>Para conversar con tus colegas:</strong> {op.claustro}</p>
                                        </div>
                                    </details>
                                );
                            })}
                        </section>

                        <section className="latlab-card dil-final-actions">
                            <button className="dil-btn-dark" onClick={rehacer}>
                                <Icono nombre="reiniciar" size={16} /> Volver a empezar
                            </button>
                            <button className="latlab-btn-finish dil-btn" onClick={() => onNavigate('fase_liderar')}>
                                Volver a Liderar
                            </button>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default RetosDilemas;
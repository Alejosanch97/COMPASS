import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/LaboratorioEtico.css";

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

const ETIQUETA_CORTA = {
    "Agencia humana": "Agencia",
    "Supervisión humana": "Supervisión",
    "Transparencia": "Transparencia",
    "Responsabilidad": "Responsabilidad",
    "Equidad": "Equidad",
    "Inclusión y acceso": "Inclusión",
    "Privacidad": "Privacidad",
    "No dañar": "No dañar",
    "Alfabetización crítica": "Alfabetización",
};

const elegirAlAzar = (obj, n) => {
    const keys = Object.keys(obj);
    for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    return keys.slice(0, n);
};

// ── Radar SVG ──
const RadarDilemas = ({ conteo }) => {
    const size = 640, cx = size / 2, cy = size / 2, R = 180;
    const N = PRINCIPIOS.length;
    const VERDE = "#2f7a5b", CAFE = "#b07a2e";

    const punto = (i, frac) => {
        const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
        return [cx + Math.cos(ang) * R * frac, cy + Math.sin(ang) * R * frac];
    };
    const fracs = (tipo) => PRINCIPIOS.map(p => {
        const c = conteo[p] || { en_juego: 0 };
        return c.en_juego > 0 ? (c[tipo] || 0) / c.en_juego : 0;
    });
    const puntosDe = (tipo) => fracs(tipo).map((f, i) => punto(i, f));
    const pathDe = (tipo) => puntosDe(tipo).map(pt => pt.join(",")).join(" ");
    const anillos = [0.2, 0.4, 0.6, 0.8, 1];

    return (
        <svg viewBox={`0 0 ${size} ${size}`}
            style={{ width: "100%", maxWidth: 560, margin: "0 auto", display: "block", overflow: "visible" }}>
            {anillos.map(f => (
                <polygon key={f}
                    points={PRINCIPIOS.map((_, i) => punto(i, f).join(",")).join(" ")}
                    fill="none" stroke="#d9d3c7" strokeWidth="1" />
            ))}
            {PRINCIPIOS.map((_, i) => {
                const [x, y] = punto(i, 1);
                return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#d9d3c7" strokeWidth="1" />;
            })}
            <polygon points={pathDe("expuesto")} fill="rgba(176,122,46,0.15)" stroke={CAFE} strokeWidth="3" strokeLinejoin="round" />
            <polygon points={pathDe("sostenido")} fill="rgba(47,122,91,0.15)" stroke={VERDE} strokeWidth="3" strokeLinejoin="round" />
            {puntosDe("expuesto").map(([x, y], i) => (<circle key={`e${i}`} cx={x} cy={y} r="5" fill={CAFE} />))}
            {puntosDe("sostenido").map(([x, y], i) => (<circle key={`s${i}`} cx={x} cy={y} r="5" fill={VERDE} />))}
            {PRINCIPIOS.map((p, i) => {
                const [lx, ly] = punto(i, 1.18);
                const c = conteo[p] || { sostenido: 0, expuesto: 0, en_juego: 0 };
                const ancla = Math.abs(lx - cx) < 20 ? "middle" : (lx > cx ? "start" : "end");
                return (
                    <text key={p} x={lx} y={ly} textAnchor={ancla} fontSize="16" fill="#1e293b" style={{ fontFamily: "monospace" }}>
                        <tspan x={lx} dy="0" fontWeight="600">{ETIQUETA_CORTA[p]}</tspan>
                        <tspan x={lx} dy="20" fontSize="15">
                            <tspan fill={VERDE}>{c.sostenido}</tspan>
                            <tspan fill="#94a3b8"> · </tspan>
                            <tspan fill={CAFE}>{c.expuesto}</tspan>
                        </tspan>
                    </text>
                );
            })}
        </svg>
    );
};

// Fila de datos "En juego / Lo que sabes / ..."
const FilaDato = ({ etiqueta, valor }) => (
    <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#c5a059", textTransform: "uppercase", letterSpacing: "0.5px" }}>{etiqueta}</span>
        <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#475569", lineHeight: 1.5 }}>{valor}</p>
    </div>
);

const RetosDilemas = ({ userData, apiFetch, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [casosAsignados, setCasosAsignados] = useState([]);
    const [selecciones, setSelecciones] = useState({});
    const [resultado, setResultado] = useState(null);

    // ── CAMBIO CLAVE: los 5 casos, no 2 ──
    const N_CASOS = 5;

    useEffect(() => {
        window.scrollTo(0, 0);
        const init = async () => {
            try {
                const reg = await apiFetch("/api/liderar/dilemas/mi-registro").catch(() => null);
                if (reg && reg.status === "COMPLETADO") {
                    setResultado(reg);
                    setCasosAsignados(reg.casos_asignados || []);
                    setSelecciones(reg.selecciones || {});
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
    }, []);

    const seleccionar = (caso, opcion) => {
        if (resultado) return;
        setSelecciones(prev => ({ ...prev, [caso]: opcion }));
    };

    const todosRespondidos = casosAsignados.length > 0 && casosAsignados.every(c => selecciones[c]);

    const handleFinalizar = async () => {
        if (!todosRespondidos || isSaving) return;
        setIsSaving(true);
        try {
            const reg = await apiFetch("/api/liderar/dilemas", {
                method: "POST",
                body: JSON.stringify({ casos_asignados: casosAsignados, selecciones }),
            });
            setResultado(reg);
            window.scrollTo(0, 0);
            Swal.fire({ title: "Análisis listo", icon: "success", timer: 1400, showConfirmButton: false, confirmButtonColor: "#c5a059" });
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "No se pudo guardar tu análisis.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const rehacer = () => {
        setResultado(null);
        setSelecciones({});
        setCasosAsignados(elegirAlAzar(CASOS, N_CASOS));
        window.scrollTo(0, 0);
    };

    if (loading) {
        return (
            <div className="latlab-unique-wrapper">
                <div className="atlas-sync-float">
                    <div className="atlas-sync-pill">
                        <span className="sync-icon">🔄</span>
                        <span className="sync-text">Cargando dilemas...</span>
                    </div>
                </div>
            </div>
        );
    }

    const recomendaciones = resultado
        ? PRINCIPIOS
            .map(p => {
                const c = resultado.conteo_principios[p] || { en_juego: 0, expuesto: 0 };
                return { p, ratio: c.en_juego > 0 ? c.expuesto / c.en_juego : -1, ...c };
            })
            .filter(x => x.ratio > 0)
            .sort((a, b) => b.ratio - a.ratio)
            .slice(0, 3)
        : [];

    return (
        <div className="latlab-unique-wrapper">
            <header className="latlab-main-header">
                <div className="latlab-header-brand">
                    <button className="latlab-btn-back" onClick={() => onNavigate('fase_liderar')}>← Atrás</button>
                    <h1>Dilemas Éticos</h1>
                </div>
            </header>

            <main className="latlab-vertical-container">
                {!resultado ? (
                    <>
                        <section className="latlab-card">
                            <div className="latlab-card-title-row">
                                <div className="latlab-title-group">
                                    <span className="latlab-step-badge">MISIÓN 3</span>
                                    <h3 className="latlab-main-title">Tu mapa de decisiones</h3>
                                </div>
                                <p className="latlab-description">
                                    Cinco casos, sin respuesta correcta. Cada opción sostiene unos principios y cede otros. No es un examen: es el dibujo de lo que tiendes a proteger y a ceder cuando hay que decidir rápido.
                                </p>
                            </div>
                        </section>

                        {casosAsignados.map((casoId, idx) => {
                            const caso = CASOS[casoId];
                            if (!caso) return null;
                            return (
                                <section key={casoId} className="latlab-card">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8" }}>Caso {idx + 1} de {casosAsignados.length}</span>
                                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{caso.momento}</span>
                                    </div>
                                    <h3 style={{ margin: "0 0 14px" }}>{caso.titulo}</h3>

                                    {caso.aviso && (
                                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#854d0e", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem", marginBottom: 14 }}>
                                            ⚠️ {caso.aviso}
                                        </div>
                                    )}

                                    <p style={{ color: "#334155", lineHeight: 1.65, marginBottom: 18 }}>{caso.contexto}</p>

                                    <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 18px", marginBottom: 18 }}>
                                        <FilaDato etiqueta="En juego" valor={caso.enJuego} />
                                        <FilaDato etiqueta="Lo que sabes" valor={caso.sabes} />
                                        <FilaDato etiqueta="Lo que no sabes" valor={caso.noSabes} />
                                        <div style={{ marginBottom: 0 }}>
                                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#c5a059", textTransform: "uppercase", letterSpacing: "0.5px" }}>Plazo</span>
                                            <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#475569", lineHeight: 1.5 }}>{caso.plazo}</p>
                                        </div>
                                    </div>

                                    <p style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>¿Qué haces?</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        {Object.entries(caso.opciones).map(([letra, o]) => {
                                            const activo = selecciones[casoId] === letra;
                                            return (
                                                <button key={letra} type="button" onClick={() => seleccionar(casoId, letra)}
                                                    style={{
                                                        textAlign: "left", padding: "14px 18px", borderRadius: 12,
                                                        border: `2px solid ${activo ? "#c5a059" : "#e2e8f0"}`,
                                                        background: activo ? "#fffbeb" : "#fff", cursor: "pointer",
                                                        display: "flex", gap: 14, alignItems: "flex-start", transition: "all 0.15s",
                                                    }}>
                                                    <span style={{
                                                        flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
                                                        background: activo ? "#c5a059" : "#f1f5f9",
                                                        color: activo ? "#fff" : "#64748b",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontWeight: 800, fontSize: "0.9rem",
                                                    }}>{letra}</span>
                                                    <span>
                                                        <strong style={{ display: "block", color: "#1e293b", marginBottom: 3 }}>{o.titulo}</strong>
                                                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{o.desc}</span>
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}

                        <section className="latlab-card" style={{ textAlign: "center" }}>
                            <button className="latlab-btn-finish" onClick={handleFinalizar}
                                disabled={!todosRespondidos || isSaving}
                                style={{ opacity: (!todosRespondidos || isSaving) ? 0.5 : 1, cursor: (!todosRespondidos || isSaving) ? "not-allowed" : "pointer" }}>
                                {isSaving ? "Analizando..." : "Ver mi mapa"}
                            </button>
                            {!todosRespondidos && (
                                <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 10 }}>
                                    Responde los {casosAsignados.length} casos para ver tu radar.
                                </p>
                            )}
                        </section>
                    </>
                ) : (
                    <>
                        <section className="latlab-card">
                            <div className="latlab-card-title-row">
                                <div className="latlab-title-group">
                                    <span className="latlab-step-badge">TU MAPA</span>
                                    <h3 className="latlab-main-title">Tu mapa de decisiones</h3>
                                </div>
                                <p className="latlab-description">
                                    No es una calificación ni un perfil que te mida. Es el dibujo de lo que tendiste a sostener (verde) y de lo que tendiste a ceder (café). Los dos polígonos casi nunca coinciden, y ahí está la información.
                                </p>
                            </div>
                            <RadarDilemas conteo={resultado.conteo_principios} />
                            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 10, fontSize: "0.85rem" }}>
                                <span style={{ color: "#2f7a5b", fontWeight: 700 }}>● Sostuviste</span>
                                <span style={{ color: "#b07a2e", fontWeight: 700 }}>● Quedó expuesto</span>
                            </div>
                            <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#94a3b8", marginTop: 8 }}>
                                La distancia al centro es la proporción sobre las ocasiones en que el principio estuvo en juego.
                            </p>
                        </section>

                        {/* Devolución por cada caso elegido */}
                        <section className="latlab-card">
                            <div className="latlab-card-title-row">
                                <span className="latlab-step-badge">Tus decisiones</span>
                                <h3>Lo que dejó cada elección</h3>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {casosAsignados.map(casoId => {
                                    const caso = CASOS[casoId];
                                    const letra = selecciones[casoId];
                                    const op = caso?.opciones?.[letra];
                                    if (!op) return null;
                                    return (
                                        <div key={casoId} style={{ padding: 16, borderLeft: "4px solid #c5a059", background: "#f8fafc", borderRadius: 8 }}>
                                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8" }}>{caso.titulo}</span>
                                            <strong style={{ display: "block", color: "#1e293b", margin: "4px 0 8px" }}>{letra}. {op.titulo}</strong>
                                            <p style={{ fontSize: "0.9rem", color: "#475569", lineHeight: 1.6, margin: "0 0 10px" }}>{op.formativo}</p>
                                            <p style={{ fontSize: "0.85rem", color: "#64748b", fontStyle: "italic", margin: 0 }}>Para el claustro: {op.claustro}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {recomendaciones.length > 0 && (
                            <section className="latlab-card">
                                <div className="latlab-card-title-row">
                                    <span className="latlab-step-badge">Recomendaciones</span>
                                    <h3>Empiezan por lo que más cediste</h3>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {recomendaciones.map(r => (
                                        <div key={r.p} style={{ padding: 16, borderLeft: "4px solid #b07a2e", background: "#faf7f2", borderRadius: 8 }}>
                                            <strong style={{ color: "#1e293b" }}>{r.p}</strong>
                                            <p style={{ fontSize: "0.88rem", color: "#475569", margin: "6px 0 0" }}>
                                                Estuvo en juego {r.en_juego} {r.en_juego === 1 ? "vez" : "veces"} y lo cediste {r.expuesto}. Antes de aplicar una medida, pregúntate si se la pedirías a todo el grupo: si la respuesta es no, el problema está en el diseño de la medida, no en el estudiante.
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="latlab-card" style={{ textAlign: "center" }}>
                            <button className="latlab-btn-nuevo" onClick={rehacer}
                                style={{ background: "#1e293b", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                                ↻ Volver a empezar
                            </button>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default RetosDilemas;
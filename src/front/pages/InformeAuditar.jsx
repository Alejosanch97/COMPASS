import React from "react";

/**
 * InformeAuditar
 * Secciones nuevas del informe COMPASS de la fase AUDITAR.
 * Todo es cualitativo: ninguna sección muestra puntajes al usuario.
 * Recibe el JSON de GET /api/auditar/mi-informe.
 *
 * Cada tarjeta lleva la clase "ia-block" para que el PDF la trate
 * como unidad que no se parte entre páginas.
 */

// Escala única COMPASS (idéntica a ESCALA_MADUREZ de FaseAuditar y a ESCALA_COMPASS del backend)
const ESCALA = [
    { nombre: "Exploración", color: "#e11d48", desc: "Primeros pasos, todavía sin estructura." },
    { nombre: "Integración", color: "#dd6b20", desc: "Uso con intención, aún ocasional." },
    { nombre: "Consolidación", color: "#3182ce", desc: "Práctica intencional y consistente." },
    { nombre: "Liderazgo", color: "#38a169", desc: "Práctica sólida que orienta a otros." },
    { nombre: "Transformación", color: "#c5a059", desc: "Referente que transforma la institución." },
];
const COLOR_NO_APLICA = "#94a3b8";
const posNivel = (n) => ESCALA.findIndex((e) => e.nombre === n);
const colorNivel = (n) => (n === "No aplica" || posNivel(n) < 0 ? COLOR_NO_APLICA : ESCALA[posNivel(n)].color);

const NOMBRE_UNESCO = { ACQUIRE: "Adquirir", DEEPEN: "Profundizar", CREATE: "Crear" };
const COLOR_EVIDENCIA = { Formal: "#16a34a", Parcial: "#d97706", "Sin evidencia": "#dc2626", "No aplica": COLOR_NO_APLICA };

// ── Piezas pequeñas ──────────────────────────────────────────────────
const Chip = ({ nivel }) => {
    if (!nivel) return null;
    const c = colorNivel(nivel);
    return (
        <span className="ia-chip" style={{ color: c, background: `${c}14`, borderColor: `${c}55` }}>
            {nivel}
        </span>
    );
};

const Escalera = ({ nivel }) => {
    const p = posNivel(nivel);
    return (
        <div className="ia-escalera" role="img" aria-label={`Nivel ${nivel}`}>
            {ESCALA.map((e, i) => (
                <span
                    key={e.nombre}
                    className={`ia-escalon${i === p ? " is-actual" : ""}`}
                    style={{ background: i <= p ? e.color : "#e2e8f0" }}
                />
            ))}
        </div>
    );
};

const Encabezado = ({ titulo, texto }) => (
    <header className="ia-head ia-block">
        <h4 className="ia-titulo">{titulo}</h4>
        {texto && <p className="ia-sub">{texto}</p>}
    </header>
);

const Leyenda = ({ conNoAplica = false }) => (
    <div className="ia-leyenda">
        {ESCALA.map((e) => (
            <span key={e.nombre}>
                <i style={{ background: e.color }} /> {e.nombre}
            </span>
        ))}
        {conNoAplica && (
            <span>
                <i style={{ background: COLOR_NO_APLICA }} /> No aplica
            </span>
        )}
    </div>
);

// ── 1. Contexto y aviso de uso ───────────────────────────────────────
const Contexto = ({ contexto, uso, esDirectivo }) => (
    <div className="ia-card ia-block ia-contexto">
        <div className="ia-contexto-datos">
            {contexto.map((c) => (
                <div key={c.etiqueta} className="ia-contexto-dato">
                    <small>{c.etiqueta}</small>
                    <span>{c.valor}</span>
                </div>
            ))}
        </div>
        {uso?.sin_uso && (
            <p className="ia-aviso-uso">
                {esDirectivo
                    ? "Indicaste que la institución aún no usa IA de forma extendida. Este informe muestra el punto de partida de la gobernanza, no fallas de gestión: es el mejor momento para ordenar antes de escalar."
                    : "Por tus respuestas, todavía no usas la IA de forma habitual con tus estudiantes. Las preguntas marcadas como «No aplica» no son malas prácticas: señalan tu punto de partida. Tu informe te muestra cómo empezar con criterio."}
            </p>
        )}
    </div>
);

// ── 2. Mapa de madurez por dimensión (escalera de 5 niveles) ─────────
const MapaDimensiones = ({ dimensiones }) => (
    <div className="ia-card ia-block">
        <div className="ia-dims">
            {dimensiones.map((d) => (
                <div key={d.dimension} className="ia-dim-fila">
                    <span className="ia-dim-nombre">{d.dimension}</span>
                    <Escalera nivel={d.nivel} />
                    <Chip nivel={d.nivel} />
                </div>
            ))}
        </div>
        <Leyenda />
    </div>
);

// ── 3. Matriz de posición 2×2 (rediseñada) ───────────────────────────
const nivelEje = (v) => (v >= 60 ? "Alto" : v >= 35 ? "Medio" : "Bajo");

const MatrizPosicion = ({ matriz }) => {
    if (!matriz) return null;
    const W = 520, H = 390, ML = 44, MT = 14, MB = 46, MR = 14;
    const iw = W - ML - MR, ih = H - MT - MB;
    const clamp = (v) => Math.max(7, Math.min(93, v));
    const px = ML + (clamp(matriz.x) / 100) * iw;
    const py = MT + (1 - clamp(matriz.y) / 100) * ih;
    const cx = ML + 0.6 * iw;
    const cy = MT + 0.4 * ih;
    const metaX = (cx + ML + iw) / 2;
    const metaY = (MT + cy) / 2;
    const yaEnMeta = matriz.clave === "alto_alto";

    const cuadros = [
        { k: "bajo_alto", x: ML, y: MT, w: cx - ML, h: cy - MT, fill: "#eff6ff", ax: ML + 14, an: "start", ty: MT + 24 },
        { k: "alto_alto", x: cx, y: MT, w: ML + iw - cx, h: cy - MT, fill: "#ecfdf5", ax: ML + iw - 14, an: "end", ty: MT + 24 },
        { k: "bajo_bajo", x: ML, y: cy, w: cx - ML, h: MT + ih - cy, fill: "#fff1f2", ax: ML + 14, an: "start", ty: MT + ih - 16 },
        { k: "alto_bajo", x: cx, y: cy, w: ML + iw - cx, h: MT + ih - cy, fill: "#fff7ed", ax: ML + iw - 14, an: "end", ty: MT + ih - 16 },
    ];

    const dx = metaX - px, dy = metaY - py;
    const len = Math.hypot(dx, dy);
    const mostrarFlecha = !yaEnMeta && len > 60;
    const ux = dx / (len || 1), uy = dy / (len || 1);

    const lx = Math.max(ML + 56, Math.min(ML + iw - 56, px));
    const ly = py < MT + 50 ? py + 34 : py - 34;

    return (
        <div className="ia-card ia-block ia-matriz">
            <div className="ia-matriz-grafico">
                <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Tu cuadrante: ${matriz.cuadrante}`}>
                    <defs>
                        <marker id="ia-flecha" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                            <path d="M0 0L10 5L0 10z" fill="#c5a059" />
                        </marker>
                    </defs>

                    {cuadros.map((c) => (
                        <g key={c.k}>
                            <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c.fill}
                                stroke={c.k === matriz.clave ? "#c5a059" : "#e2e8f0"}
                                strokeWidth={c.k === matriz.clave ? 2.5 : 1} rx="10" />
                            <text x={c.ax} y={c.ty} textAnchor={c.an} fontSize="12" fontWeight="800"
                                fill={c.k === matriz.clave ? "#0f172a" : "#94a3b8"}>
                                {matriz.nombres?.[c.k]}
                            </text>
                        </g>
                    ))}

                    {[0.25, 0.5, 0.75].map((t) => (
                        <g key={t} opacity="0.7">
                            <line x1={ML + t * iw} y1={MT} x2={ML + t * iw} y2={MT + ih} stroke="#fff" />
                            <line x1={ML} y1={MT + t * ih} x2={ML + iw} y2={MT + t * ih} stroke="#fff" />
                        </g>
                    ))}

                    {!yaEnMeta && (
                        <g>
                            <circle cx={metaX} cy={metaY} r="18" fill="none" stroke="#c5a059" strokeWidth="1.5" strokeDasharray="4 4" />
                            <text x={metaX} y={metaY + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#a17d33">META</text>
                        </g>
                    )}
                    {mostrarFlecha && (
                        <line x1={px + ux * 18} y1={py + uy * 18} x2={metaX - ux * 22} y2={metaY - uy * 22}
                            stroke="#c5a059" strokeWidth="2" strokeDasharray="6 5" markerEnd="url(#ia-flecha)" />
                    )}

                    <circle cx={px} cy={py} r="16" fill="#c5a059" opacity="0.2">
                        <animate attributeName="r" values="12;22;12" dur="2.6s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2.6s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={px} cy={py} r="8" fill="#c5a059" stroke="#fff" strokeWidth="3" />
                    <g>
                        <rect x={lx - 52} y={ly - 13} width="104" height="24" rx="12" fill="#0f172a" />
                        <text x={lx} y={ly + 3} textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#fff">Tú estás aquí</text>
                    </g>

                    <line x1={ML} y1={MT + ih + 8} x2={ML + iw} y2={MT + ih + 8} stroke="#cbd5e1" />
                    <text x={ML} y={H - 20} fontSize="10.5" fill="#94a3b8" fontWeight="700">Bajo</text>
                    <text x={ML + iw} y={H - 20} textAnchor="end" fontSize="10.5" fill="#94a3b8" fontWeight="700">Alto</text>
                    <text x={ML + iw / 2} y={H - 6} textAnchor="middle" fontSize="12" fontWeight="800" fill="#334155">{matriz.eje_x} →</text>

                    <text x={ML - 8} y={MT + 12} textAnchor="end" fontSize="10.5" fill="#94a3b8" fontWeight="700">Alto</text>
                    <text x={ML - 8} y={MT + ih} textAnchor="end" fontSize="10.5" fill="#94a3b8" fontWeight="700">Bajo</text>
                    <text x={11} y={MT + ih / 2} textAnchor="middle" fontSize="12" fontWeight="800" fill="#334155"
                        transform={`rotate(-90 11 ${MT + ih / 2})`}>{matriz.eje_y} →</text>
                </svg>
            </div>

            <div className="ia-matriz-texto">
                <small>Tu cuadrante</small>
                <h5>{matriz.cuadrante}</h5>
                <p>{matriz.descripcion}</p>
                <div className="ia-ejes">
                    <div><small>{matriz.eje_x}</small><b className={`n-${nivelEje(matriz.x).toLowerCase()}`}>{nivelEje(matriz.x)}</b></div>
                    <div><small>{matriz.eje_y}</small><b className={`n-${nivelEje(matriz.y).toLowerCase()}`}>{nivelEje(matriz.y)}</b></div>
                </div>
                {!yaEnMeta && matriz.nombres?.alto_alto && (
                    <p className="ia-meta-txt">Hacia dónde avanzar: <strong>{matriz.nombres.alto_alto}</strong></p>
                )}
            </div>
        </div>
    );
};

// ── 4. Mapa de respuestas (mapa de calor por pregunta) ───────────────
const MapaRespuestas = ({ items, dimensiones }) => {
    const graduadas = items.filter((i) => i.clase === "graduada" && i.dimension);
    if (!graduadas.length) return null;
    const grupos = dimensiones
        .map((d) => ({ dim: d.dimension, items: graduadas.filter((i) => i.dimension === d.dimension) }))
        .filter((g) => g.items.length);
    return (
        <div className="ia-card ia-block">
            <div className="ia-heat">
                {grupos.map((g) => (
                    <div key={g.dim} className="ia-heat-fila">
                        <span className="ia-heat-dim">{g.dim}</span>
                        <div className="ia-heat-celdas">
                            {g.items.map((it) => (
                                <span
                                    key={it.orden}
                                    className="ia-heat-celda"
                                    style={{ background: colorNivel(it.nivel) }}
                                    title={`${it.pregunta}\nTu respuesta: ${it.respuesta}\nNivel: ${it.nivel}`}
                                >
                                    P{it.orden}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <Leyenda conNoAplica />
        </div>
    );
};

// ── 5. Próximos pasos: siguiente escalón ─────────────────────────────
const ProximosPasos = ({ pasos }) => (
    <div className="ia-pasos">
        {pasos.map((p, i) => (
            <article key={p.orden} className="ia-paso ia-block">
                <span className="ia-paso-num">{i + 1}</span>
                <div className="ia-paso-cuerpo">
                    <span className="ia-tag">{p.dimension}</span>
                    <p className="ia-paso-preg">{p.pregunta}</p>
                    <div className="ia-paso-escalera">
                        <div className="ia-paso-hoy">
                            <small>Hoy</small>
                            <span>{p.respuesta}</span>
                        </div>
                        <svg className="ia-paso-flecha" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="ia-paso-sig">
                            <small>Tu siguiente escalón</small>
                            <span>{p.siguiente}</span>
                        </div>
                    </div>
                    {p.reto && <p className="ia-paso-reto">Lo trabajarás en Transformar, en la misión «{p.reto}».</p>}
                </div>
            </article>
        ))}
    </div>
);

// ── 6. Tu voz (respuestas abiertas) ──────────────────────────────────
const Voz = ({ voz }) => (
    <div className="ia-voces">
        {voz.map((v) => (
            <article key={v.orden} className="ia-voz ia-block">
                <h5>{v.titulo}</h5>
                <blockquote>{v.texto}</blockquote>
                {v.temas?.length > 0 && (
                    <div className="ia-temas">
                        <small>A partir de lo que escribiste, aparecen estos temas:</small>
                        <div>{v.temas.map((t) => <span key={t} className="ia-tag">{t}</span>)}</div>
                    </div>
                )}
                <p className="ia-puente">{v.puente}</p>
            </article>
        ))}
    </div>
);

// ── 7. Riesgos (docente) ─────────────────────────────────────────────
const Riesgos = ({ riesgos }) => (
    <div className="ia-card ia-block ia-riesgos">
        <div>
            <h5>Los riesgos que más te preocupan, en tu orden</h5>
            {riesgos.prioridad.length ? (
                <ol className="ia-podio">
                    {riesgos.prioridad.map((r, i) => (
                        <li key={r} style={{ opacity: 1 - i * 0.12 }}>
                            <span className="ia-podio-n">{i + 1}</span>
                            {r}
                        </li>
                    ))}
                </ol>
            ) : <p className="ia-mini">No ordenaste los riesgos.</p>}
        </div>
        <div>
            <h5>Los que ya has visto en tu práctica</h5>
            {riesgos.vistos.length ? (
                <div className="ia-temas-lista">{riesgos.vistos.map((v) => <span key={v} className="ia-tag ia-tag-alerta">{v}</span>)}</div>
            ) : <p className="ia-mini">No marcaste riesgos observados en tu práctica.</p>}
            {riesgos.prioridad[0] && (
                <p className="ia-puente">
                    Tu riesgo principal ({riesgos.prioridad[0].toLowerCase()}) será el foco de tu análisis ético en la primera misión de Transformar.
                </p>
            )}
        </div>
    </div>
);

// ── 8. Semáforo de evidencias (directivo) ────────────────────────────
const Evidencias = ({ evidencias }) => (
    <div className="ia-card ia-block">
        <div className="ia-evid-grid">
            {evidencias.map((e) => (
                <div key={e.orden} className="ia-evid" style={{ borderLeftColor: COLOR_EVIDENCIA[e.estado] }}>
                    <span className="ia-evid-nombre">{e.nombre}</span>
                    <span className="ia-evid-estado" style={{ color: COLOR_EVIDENCIA[e.estado] }}>{e.estado}</span>
                    <small>{e.respuesta}</small>
                </div>
            ))}
        </div>
        <div className="ia-leyenda">
            {Object.entries(COLOR_EVIDENCIA).map(([k, c]) => (
                <span key={k}><i style={{ background: c }} /> {k}</span>
            ))}
        </div>
    </div>
);

// ── 9. Brecha directivo–docentes ─────────────────────────────────────
const Brecha = ({ brecha }) => {
    if (!brecha?.disponible) {
        return (
            <div className="ia-card ia-block ia-vacio">
                <p>
                    Cuando al menos {brecha?.minimo ?? 3} docentes completen su diagnóstico AUDITAR, aquí verás si tu lectura
                    de la institución coincide con lo que ellos viven en el aula.
                    {brecha?.docentes_participantes ? ` Hasta ahora han participado ${brecha.docentes_participantes}.` : ""}
                </p>
            </div>
        );
    }
    return (
        <div className="ia-brechas">
            {brecha.temas.map((t) => (
                <article key={t.tema} className={`ia-brecha ia-block v-${t.veredicto}`}>
                    <div className="ia-brecha-head">
                        <h5>{t.tema}</h5>
                        <span className="ia-veredicto">{t.veredicto_texto}</span>
                    </div>
                    <div className="ia-brecha-cuerpo">
                        <div className="ia-brecha-tu">
                            <small>Tu lectura</small>
                            <strong>{t.tu_respuesta}</strong>
                        </div>
                        <div className="ia-brecha-doc">
                            <small>Lo que responden tus docentes ({t.n})</small>
                            {t.distribucion.map((d) => (
                                <div key={d.opcion} className="ia-dist">
                                    <span className="ia-dist-txt">{d.opcion}</span>
                                    <span className="ia-dist-track">
                                        <span style={{ width: `${t.n ? (d.cantidad / t.n) * 100 : 0}%` }} />
                                    </span>
                                    <span className="ia-dist-n">{d.cantidad}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
};

// ── 10. Tus 3 retos en Transformar ───────────────────────────────────
const VALORES_TRANSFORMAR = [
    { t: "Del diagnóstico a la acción", d: "Cada reto parte de una dimensión donde hoy tienes más espacio para crecer." },
    { t: "Evidencia de tu práctica", d: "Lo que hagas queda documentado y respalda tu avance real." },
    { t: "Un escalón más en la escala", d: "Al completarlos, tu próximo diagnóstico puede reflejar un nivel más alto." },
];

const RetosTransformar = ({ ruta, esDirectivo, onNavigate }) => {
    if (!ruta.length) {
        return (
            <div className="ia-card ia-block ia-vacio">
                <p>Tu institución aún no tiene retos de Transformar asignados para tu rol. Cuando los tenga, aquí verás los tres que más impacto tendrán en tu punto de partida.</p>
            </div>
        );
    }
    const retos = [...ruta].sort((a, b) => Number(!!b.prioridad) - Number(!!a.prioridad)).slice(0, 3);

    return (
        <div className="ia-transf">
            <div className="ia-transf-banner ia-block">
                <div className="ia-transf-intro">
                    <span className="ia-transf-kicker">Siguiente fase · Transformar</span>
                    <h5>{esDirectivo
                        ? "Transformar convierte este diagnóstico en decisiones institucionales."
                        : "Transformar convierte este diagnóstico en práctica de aula."}</h5>
                    <p>Este informe es tu punto de partida. Estos son los {retos.length} retos donde tu trabajo tendrá más efecto.</p>
                </div>
                <ul className="ia-transf-valores">
                    {VALORES_TRANSFORMAR.map((v) => (
                        <li key={v.t}><strong>{v.t}</strong><span>{v.d}</span></li>
                    ))}
                </ul>
            </div>

            <div className="ia-retos-grid">
                {retos.map((r, i) => (
                    <article key={r.id} className={`ia-reto ia-block${r.prioridad ? " is-prioridad" : ""}`}>
                        <div className="ia-reto-top">
                            <span className="ia-reto-num">{i + 1}</span>
                            <span className="ia-nivel-unesco">{NOMBRE_UNESCO[r.nivel_unesco] || r.nivel_unesco}</span>
                            {r.prioridad && !r.completado && <span className="ia-badge-prio">Prioridad</span>}
                            {r.completado && <span className="ia-badge-ok">Completado</span>}
                        </div>
                        <h5>{r.nombre}</h5>
                        <p>{r.por_que}</p>
                        {r.dimensiones.length > 0 && (
                            <div className="ia-reto-dims">
                                <small>Fortalece</small>
                                {r.dimensiones.map((d) => (
                                    <span key={d.nombre} className="ia-ruta-dim">{d.nombre} <Chip nivel={d.nivel} /></span>
                                ))}
                            </div>
                        )}
                    </article>
                ))}
            </div>

            {onNavigate && (
                <div className="ia-ruta-accion cmp-no-print">
                    <button type="button" className="ia-btn" onClick={() => onNavigate("fase_transformar")}>
                        Comenzar mis retos en Transformar →
                    </button>
                </div>
            )}
        </div>
    );
};

// ── 11. Estándares con trazabilidad (tarjetas por marco) ─────────────
const Estandares = ({ estandares }) => {
    const grupos = estandares.reduce((acc, e) => {
        (acc[e.marco] = acc[e.marco] || []).push(e);
        return acc;
    }, {});
    return (
        <div className="ia-card ia-block">
            <div className="ia-est-grid">
                {Object.entries(grupos).map(([marco, lista]) => (
                    <article key={marco} className="ia-est">
                        <h5 className="ia-est-marco">{marco}</h5>
                        <ul>
                            {lista.map((e) => (
                                <li key={`${e.marco}-${e.componente}`}>
                                    <div>
                                        <strong>{e.componente}</strong>
                                        <small>{e.dimensiones.join(" y ")}</small>
                                    </div>
                                    <Chip nivel={e.nivel} />
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
            <p className="ia-mini">
                Lectura orientativa calculada a partir de las dimensiones de tu diagnóstico. No es una certificación de cumplimiento normativo.
            </p>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════
// Componente principal
// ══════════════════════════════════════════════════════════════════
export const InformeAuditar = ({ informe, esDirectivo, onNavigate }) => {
    if (!informe || !informe.disponible) return null;
    const {
        perfil, contexto = [], uso, matriz, items = [], proximos_pasos = [], voz = [],
        riesgos, evidencias, ruta_transformar = [], estandares = [],
    } = informe;

    const hayDims = perfil?.dimensiones?.length > 0;
    const hayMapaResp = items.some((i) => i.clase === "graduada");
    const hayRiesgos = !esDirectivo && riesgos && (riesgos.prioridad.length > 0 || riesgos.vistos.length > 0);

    return (
        <div className="ia-informe">
            {(contexto.length > 0 || uso?.sin_uso) && (
                <section className="ia-seccion">
                    <Encabezado titulo="Tu punto de partida" />
                    <Contexto contexto={contexto} uso={uso} esDirectivo={esDirectivo} />
                </section>
            )}

            {(hayDims || matriz) && (
                <div className="ia-duo">
                    {hayDims && (
                        <section className="ia-seccion">
                            <Encabezado
                                titulo="Tu mapa de madurez"
                                texto="Cada dimensión se ubica en uno de los cinco niveles de la escala COMPASS."
                            />
                            <MapaDimensiones dimensiones={perfil.dimensiones} />
                        </section>
                    )}
                    {matriz && (
                        <section className="ia-seccion">
                            <Encabezado
                                titulo={esDirectivo ? "Estructura y control de la gobernanza" : "Uso y criterio: dónde estás hoy"}
                                texto={esDirectivo
                                    ? "Cruza qué tan formalizada está la gobernanza con qué tan controlados están los riesgos y los datos."
                                    : "Cruza cuánto integras la IA en tu aula con el criterio ético y crítico con el que la usas."}
                            />
                            <MatrizPosicion matriz={matriz} />
                        </section>
                    )}
                </div>
            )}

            {esDirectivo && evidencias?.length > 0 && (
                <section className="ia-seccion">
                    <Encabezado
                        titulo="Semáforo de evidencias institucionales"
                        texto="Lo que la institución podría mostrar hoy si alguien lo solicitara."
                    />
                    <Evidencias evidencias={evidencias} />
                </section>
            )}

            {(hayMapaResp || hayRiesgos) && (
                <div className="ia-duo">
                    {hayMapaResp && (
                        <section className="ia-seccion">
                            <Encabezado
                                titulo="Mapa de tus respuestas"
                                texto="Cada casilla es una pregunta, coloreada según el nivel que refleja tu respuesta."
                            />
                            <MapaRespuestas items={items} dimensiones={perfil?.dimensiones || []} />
                        </section>
                    )}
                    {hayRiesgos && (
                        <section className="ia-seccion">
                            <Encabezado titulo="Tu mapa de riesgos" />
                            <Riesgos riesgos={riesgos} />
                        </section>
                    )}
                </div>
            )}

            {proximos_pasos.length > 0 && (
                <section className="ia-seccion">
                    <Encabezado
                        titulo="Tus próximos pasos"
                        texto="Tres prácticas concretas para subir un escalón, elegidas a partir de tus propias respuestas."
                    />
                    <ProximosPasos pasos={proximos_pasos} />
                </section>
            )}

            {voz.length > 0 && (
                <section className="ia-seccion">
                    <Encabezado titulo="Tu voz en el diagnóstico" texto="Lo que escribiste es parte de tu evidencia y orienta tu ruta." />
                    <Voz voz={voz} />
                </section>
            )}

            <section className="ia-seccion">
                <Encabezado
                    titulo="Tus 3 retos en Transformar"
                    texto="Lo que harás con este diagnóstico en la siguiente fase."
                />
                <RetosTransformar ruta={ruta_transformar} esDirectivo={esDirectivo} onNavigate={onNavigate} />
            </section>

            {estandares.length > 0 && (
                <section className="ia-seccion">
                    <Encabezado
                        titulo="Alineación con marcos de referencia"
                        texto="Cómo se conectan tus dimensiones con los estándares internacionales."
                    />
                    <Estandares estandares={estandares} />
                </section>
            )}
        </div>
    );
};

/**
 * Lista del modal "Ver respuestas": muestra el enunciado real y el nivel
 * cualitativo de cada respuesta en lugar de puntos.
 */
export const ListaRespuestasAuditar = ({ respuestas = [], informe }) => {
    const porPregunta = {};
    (informe?.items || []).forEach((it) => { porPregunta[it.pregunta_id] = it; });
    const ordenadas = [...respuestas].sort((a, b) =>
        (porPregunta[a.pregunta_id]?.orden ?? 999) - (porPregunta[b.pregunta_id]?.orden ?? 999));

    return (
        <div className="ia-lista-resp">
            {ordenadas.map((r, i) => {
                const it = porPregunta[r.pregunta_id];
                return (
                    <div key={r.id ?? i} className="ia-lista-item">
                        <div className="ia-lista-meta">
                            <span>Pregunta {it?.orden ?? i + 1}</span>
                            {it?.dimension && <span className="ia-tag">{it.dimension}</span>}
                        </div>
                        <p className="ia-lista-preg">{it?.pregunta || r.pregunta_texto || `Pregunta ${i + 1}`}</p>
                        <p className="ia-lista-resp-txt">{r.valor_respondido}</p>
                        {it?.nivel && <Chip nivel={it.nivel} />}
                    </div>
                );
            })}
        </div>
    );
};
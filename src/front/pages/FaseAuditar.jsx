import React, { useState, useEffect } from "react";

import "../Styles/faseAuditar.css";
import Swal from "sweetalert2";




// ── Color de nivel para el radar COMPASS ──
const nivelColorCompass = (nivel) =>
    nivel === "Avanzado" ? "#38a169" :
        nivel === "Intermedio" ? "#3182ce" :
            nivel === "Básico" ? "#dd6b20" : "#e53e3e";

// ── Radar / gráfico de araña reutilizable (sin librerías) ──
const RadarCompass = ({ dimensiones = [] }) => {
    const size = 440, box = 400;
    const cx = size / 2, cy = box / 2 + 5, maxR = 118;
    const n = dimensiones.length;
    if (!n) return null;

    const ang = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
    const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];

    const dataPts = dimensiones.map((d, i) =>
        pt(i, maxR * (Math.max(0, Math.min(100, d.porcentaje || 0)) / 100)));
    const dataStr = dataPts.map(p => p.join(",")).join(" ");

    return (
        <svg viewBox={`0 0 ${size} ${box}`} className="radar-compass-svg">
            {[0.25, 0.5, 0.75, 1].map((f, idx) => (
                <polygon key={idx}
                    points={dimensiones.map((_, i) => pt(i, maxR * f).join(",")).join(" ")}
                    fill="none" stroke="#e2e8f0" strokeWidth="1" />
            ))}
            {dimensiones.map((_, i) => {
                const [x, y] = pt(i, maxR);
                return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
            })}
            <polygon points={dataStr} fill="rgba(197,160,89,0.28)" stroke="#c5a059" strokeWidth="2.5" />
            {dataPts.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="4.5" fill="#c5a059" stroke="#fff" strokeWidth="1.5" />
            ))}
            {dimensiones.map((d, i) => {
                const [lx, ly] = pt(i, maxR + 22);
                const a = ang(i);
                const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : (Math.cos(a) > 0 ? "start" : "end");
                const palabras = d.dimension.split(" ");
                let l1 = d.dimension, l2 = "";
                if (palabras.length > 2) {
                    const mid = Math.ceil(palabras.length / 2);
                    l1 = palabras.slice(0, mid).join(" ");
                    l2 = palabras.slice(mid).join(" ");
                }
                return (
                    <g key={i}>
                        <text x={lx} y={ly - (l2 ? 6 : 0)} textAnchor={anchor}
                            fontSize="11" fontWeight="700" fill="#1e293b">
                            {l1}
                            {l2 && <tspan x={lx} dy="13">{l2}</tspan>}
                        </text>
                        <text x={lx} y={ly + (l2 ? 21 : 15)} textAnchor={anchor}
                            fontSize="9.5" fontWeight="800" fill={nivelColorCompass(d.nivel)}>
                            {d.nivel}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

/**
 * FaseAuditar
 * Mantiene el mismo diseño, textos e interpretaciones COMPASS del código
 * original (Google Sheets), pero conectado al backend Flask nuevo.
 *
 * Flujo: Capa 1 (Declarar Marco Ético) -> Capa 2 (Responder formulario
 * asignado a la empresa) -> Capa 3 (Resultado COMPASS con interpretación).
 *
 * Si la empresa del usuario no tiene ningún formulario asignado para su
 * rol en AUDITAR, se muestra un aviso en vez del diagnóstico.
 */
export const FaseAuditar = ({ userData, apiFetch, onNavigate }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reflexion, setReflexion] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [formulariosFase, setFormulariosFase] = useState([]);
    const [respuestasUsuario, setRespuestasUsuario] = useState([]);

    const [modalRespuestas, setModalRespuestas] = useState(null);
    const [perfilDimensiones, setPerfilDimensiones] = useState(null);

    const infografiaRef = React.useRef(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        if (!progreso) setLoading(true);
        try {
            const [progresoData, formsData, respuestasData, perfilData] = await Promise.all([
                apiFetch("/api/progreso-fases").catch(() => []),
                apiFetch("/api/mi-empresa/formularios?fase=AUDITAR").catch(() => []),
                apiFetch("/api/mis-respuestas").catch(() => []),
                apiFetch("/api/auditar/mi-perfil-dimensiones").catch(() => null),
            ]);
            setPerfilDimensiones(perfilData);

            const registroFase = Array.isArray(progresoData)
                ? progresoData.find(item => item.fase === "AUDITAR")
                : null;
            if (registroFase) {
                setProgreso(registroFase);
                setReflexion(registroFase.capa_3_hito_texto || "");
            }

            setFormulariosFase(Array.isArray(formsData) ? formsData : []);
            setRespuestasUsuario(Array.isArray(respuestasData) ? respuestasData : []);
        } catch (e) {
            console.error("Error crítico en sincronización ATLAS:", e);
        } finally {
            setLoading(false);
        }
    };

    // ── PUNTAJE: suma de puntos_ganados de todas las respuestas del formulario relevante ──
    const obtenerPuntajeDirecto = () => {
        if (formulariosFase.length === 0) return 0;
        const formularioRelevante = formulariosFase[0]; // un solo formulario por rol en AUDITAR
        const respuestasDelFormulario = respuestasUsuario.filter(r => r.formulario_id === formularioRelevante.id);
        if (respuestasDelFormulario.length === 0) return 0;
        return respuestasDelFormulario.reduce((acc, r) => acc + parseFloat(r.puntos_ganados || 0), 0);
    };

    const puntajeFinal = React.useMemo(() => obtenerPuntajeDirecto(), [respuestasUsuario, formulariosFase]);

    // ── NIVEL GLOBAL a partir del PROMEDIO de las dimensiones ──
    const nivelGlobalPromedio = React.useMemo(() => {
        if (!perfilDimensiones || !perfilDimensiones.dimensiones?.length) return null;
        const dims = perfilDimensiones.dimensiones;
        const promedio = dims.reduce((acc, d) => acc + (d.porcentaje || 0), 0) / dims.length;
        let nivel, color;
        if (promedio >= 80) { nivel = "Avanzado"; color = "#38a169"; }
        else if (promedio >= 55) { nivel = "Intermedio"; color = "#3182ce"; }
        else if (promedio >= 30) { nivel = "Básico"; color = "#dd6b20"; }
        else { nivel = "Inicial"; color = "#e53e3e"; }
        return { nivel, color, promedio: Math.round(promedio) };
    }, [perfilDimensiones]);

    // ── INTERPRETACIONES COMPASS — DOCENTE (texto original sin modificar) ──
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

Este resultado no es una debilidad. Es tu punto de partida. El siguiente paso no es usar más herramientas, sino fortalecer tu comprensión sobre:
• Cómo vincular la IA con objetivos curriculares concretos.
• Cómo mantener supervisión humana significativa.
• Cómo identificar riesgos éticos básicos.

Estás en el inicio del camino ATLAS.`
        };
    };

    // ── INTERPRETACIONES COMPASS — DIRECTIVO (texto original sin modificar) ──
    const getCompassDataDirectivo = (score) => {
        if (score >= 90) return {
            nivel: "Gobernanza alineada internacionalmente",
            rango: "90–100",
            desc: `Tu puntaje refleja el nivel actual de madurez institucional en gobernanza de IA educativa.

No mide adopción tecnológica.
Mide coherencia, supervisión, gestión de riesgo y alineación con estándares internacionales.

En este nivel la institución demuestra una madurez alta en gobernanza de IA, alineada con principios internacionales de ética, supervisión humana, protección de datos y rendición de cuentas.

Evidencias:
• Existen políticas formales y monitoreo sistemático.
• Se realizan evaluaciones de riesgo antes de implementar.
• Se documenta impacto y decisiones automatizadas.
• Hay mecanismos claros de reclamación y revisión.
• La cultura institucional incorpora criterios éticos y pedagógicos explícitos.

La IA no es solo una herramienta.
Es un componente regulado dentro de la arquitectura institucional.

El desafío en este nivel no es crecer, sino sostener coherencia y liderazgo.

Te invitamos a avanzar en el modelo ATLAS y consolidar la gobernanza de IA responsable en tu institución.

Este diagnóstico es una fotografía del momento actual.
La meta no es alcanzar 100 por cumplimiento.
La meta es asegurar que la adopción de IA ocurra con coherencia pedagógica, responsabilidad ética y solidez institucional.`
        };

        if (score >= 75) return {
            nivel: "Gobernanza consolidada",
            rango: "75–89",
            desc: `Tu puntaje refleja el nivel actual de madurez institucional en gobernanza de IA educativa.

La IA estaría integrada dentro de una arquitectura institucional coherente.

En este nivel existen protocolos formales, responsabilidades definidas, supervisión humana obligatoria y evaluación de impacto periódica.

Evidencias de gobernanza:
• Hay comité o instancia de seguimiento.
• Se documentan decisiones relevantes.
• Se gestionan riesgos de manera preventiva.
• Hay transparencia hacia la comunidad educativa.

La institución no solo regula el uso de IA: lo gobierna.

El siguiente paso es asegurar sostenibilidad y mejora continua.

Recuerda:
Este diagnóstico es una fotografía del momento actual.
La meta es fortalecer coherencia, responsabilidad ética y solidez institucional.`
        };

        if (score >= 60) return {
            nivel: "Gobernanza estructurada",
            rango: "60–74",
            desc: `Tu puntaje refleja el nivel actual de madurez institucional en gobernanza de IA educativa.

Según tu diagnóstico como directivo, la institución parece contar con política formal y criterios explícitos sobre el uso de IA.

Recuerda que en este nivel:
• Hay lineamientos escritos.
• Se consideran riesgos éticos y de datos.
• Existe revisión antes de escalar implementación.
• Hay formación docente estructurada.

Se deberían poder evidenciar prácticas de supervisión humana significativa, revisión de riesgos y documentación de procesos.

Sin embargo, el monitoreo aún puede no ser sistemático o la evaluación de impacto no estar completamente integrada.

A este punto la institución ya no improvisa: organiza.

Este diagnóstico es una fotografía del momento actual.
El desafío ahora es avanzar hacia monitoreo sistemático y mejora continua.`
        };

        if (score >= 40) return {
            nivel: "Gobernanza emergente",
            rango: "40–59",
            desc: `Tu puntaje refleja el nivel actual de madurez institucional en gobernanza de IA educativa.

La institución parece haber iniciado conversaciones y posiblemente tiene lineamientos preliminares sobre el uso de IA, pero estos no parecen estar completamente formalizados ni monitoreados.

En este nivel:
• Podría existir política escrita, pero sin seguimiento estructurado.
• La supervisión humana no parece ser consistente.
• La gestión de riesgo sería parcial.
• No habría evaluación sistemática de impacto.

Existe intención estratégica, pero aún no parece evidenciarse arquitectura consolidada.

El desafío ahora es pasar de intención a institucionalización.

Recuerda:
La meta no es adoptar más herramientas, sino construir coherencia institucional, responsabilidad ética y estructuras claras de gobernanza.`
        };

        return {
            nivel: "Gobernanza inexistente",
            rango: "0–39",
            desc: `Tu puntaje refleja el nivel actual de madurez institucional en gobernanza de IA educativa.

Actualmente la institución parece no contar con una estructura formal de gobernanza para el uso de IA.

Puede haber uso aislado de herramientas, pero no se detectan lineamientos institucionales claros, supervisión estructurada ni protocolos de gestión de riesgo documentados.

En este nivel:
• No parece haber política formal.
• No habría evaluación sistemática de riesgos.
• No se encontrarían mecanismos claros de rendición de cuentas.
• El uso dependería de decisiones individuales.

El principal riesgo no es tecnológico, sino institucional: desarticulación y exposición jurídica.

El siguiente paso no es prohibir ni adoptar más herramientas, sino establecer principios básicos, responsabilidades explícitas y criterios institucionales claros.

Este diagnóstico es una fotografía del momento actual.
Es el punto de partida para construir una gobernanza sólida y responsable.`
        };
    };

    const compass = React.useMemo(() => {
        return userData.rol === "DIRECTIVO"
            ? getCompassDataDirectivo(puntajeFinal)
            : getCompassData(puntajeFinal);
    }, [puntajeFinal, userData.rol]);

    const checkFormulariosCompletos = () => {
        if (formulariosFase.length === 0) return false;
        return formulariosFase.every(form =>
            respuestasUsuario.some(resp => resp.formulario_id === form.id)
        );
    };

    const formsCompletos = checkFormulariosCompletos();
    const isProcessComplete = progreso?.capa_1_sentido === 'COMPLETADO' && formsCompletos;
    const sinFormulariosAsignados = formulariosFase.length === 0;

    useEffect(() => {
        if (isProcessComplete && !loading) {
            Swal.fire({
                title: `Nivel: ${compass.nivel}`,
                text: userData.rol === "DIRECTIVO"
                    ? "Se ha completado el diagnóstico de gobernanza institucional."
                    : "Has completado con éxito la primera etapa de Auditoría ATLAS.",
                icon: "success",
                confirmButtonColor: "#c5a059",
                timer: 5000,
                timerProgressBar: true,
                backdrop: `rgba(197, 160, 89, 0.2)`
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isProcessComplete, loading]);

    const handleAceptarMarco = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const actualizado = await apiFetch("/api/progreso-fases", {
                method: "POST",
                body: JSON.stringify({ fase: "AUDITAR", capa_1_sentido: "COMPLETADO" }),
            });
            setProgreso(actualizado);
            Swal.fire({
                title: "Compromiso Registrado",
                text: "Ha formalizado su adhesión al Marco Ético ATLAS. El diagnóstico ha sido habilitado.",
                icon: "success",
                confirmButtonColor: "#c5a059",
                timer: 2000
            });
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "No se pudo guardar el compromiso. Intenta de nuevo.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGuardarReto = async () => {
        if (reflexion.length < 100) {
            Swal.fire("Rigor Académico", "La evidencia requiere una profundidad analítica mayor (mínimo 100 caracteres).", "warning");
            return;
        }
        setIsSaving(true);
        try {
            const actualizado = await apiFetch("/api/progreso-fases", {
                method: "POST",
                body: JSON.stringify({ fase: "AUDITAR", capa_3_hito_texto: reflexion }),
            });
            setProgreso(actualizado);
            Swal.fire({ title: "Hito Sincronizado", icon: "success", confirmButtonColor: "#c5a059" });
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    // ── Carga jsPDF una sola vez (html-to-image se importa arriba) ──
    const cargarScript = (src) => new Promise((resolve, reject) => {
        if ([...document.scripts].some(s => s.src === src)) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error("No se pudo cargar " + src));
        document.body.appendChild(s);
    });

    // ── Descarga la infografía como PDF (nodo aislado + colores forzados) ──
    const descargarPDF = async () => {
        const nodo = infografiaRef.current;
        if (!nodo) return;
        Swal.fire({
            title: "Generando PDF...",
            html: "Esto toma unos segundos.",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        let sandbox = null;
        try {
            const { toPng } = await import("html-to-image");
            await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

            // 1. Clonamos la infografía y le quitamos los botones
            const clon = nodo.cloneNode(true);
            clon.classList.add("exporting");
            clon.querySelectorAll(".cmp-no-print").forEach(el => el.remove());

            // 2. Contenedor aislado fuera de la vista (no hereda estilos globales)
            sandbox = document.createElement("div");
            sandbox.style.position = "fixed";
            sandbox.style.left = "-99999px";
            sandbox.style.top = "0";
            sandbox.style.width = "1100px";
            sandbox.style.background = "#ffffff";
            sandbox.style.color = "#1e293b";
            sandbox.appendChild(clon);
            document.body.appendChild(sandbox);

            await new Promise(r => setTimeout(r, 80));

            // 3. Medimos puntos de corte "seguros": fin de cada bloque Y también
            //    los espacios entre tarjetas/párrafos internos (para bloques altos).
            const clonRect = clon.getBoundingClientRect();
            const cortesSet = new Set();

            // Fin de cada sección principal
            clon.querySelectorAll(".cmp-header, section, .cmp-brand-footer").forEach(b => {
                cortesSet.add(Math.round(b.getBoundingClientRect().bottom - clonRect.top));
            });

            // Fin de elementos internos que se pueden partir sin romper diseño:
            // párrafos de interpretación, tarjetas de hallazgos, filas de dimensión,
            // tarjetas de estándares y párrafos del próximo paso.
            clon.querySelectorAll(
                ".cmp-interpret p, .cmp-interpret .cmp-disclaimer, " +
                ".cmp-hallazgo-card, .cmp-dim-row, .cmp-standard-card, " +
                ".cmp-next-step p, .radar-compass-svg"
            ).forEach(el => {
                cortesSet.add(Math.round(el.getBoundingClientRect().bottom - clonRect.top));
            });

            const cortesPx = [...cortesSet].sort((a, b) => a - b);
            const totalPx = clon.scrollHeight;

            // 4. Capturamos el clon aislado
            const dataUrl = await toPng(clon, {
                pixelRatio: 2,
                backgroundColor: "#ffffff",
                width: 1100,
                cacheBust: true,
            });

            const img = new Image();
            img.src = dataUrl;
            await new Promise(res => { img.onload = res; });

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF("p", "mm", "a4");
            const pw = pdf.internal.pageSize.getWidth();
            const ph = pdf.internal.pageSize.getHeight();

            // px del render -> mm del PDF
            const pxToMm = pw / img.width;               // ancho imagen -> ancho página
            const escala = img.width / clon.offsetWidth; // ratio pixelRatio real
            const phPx = ph / pxToMm / escala;           // alto de una página A4, en px del clon
            const cortesClon = cortesPx.map(c => c);     // ya están en px del clon

            // Calcula los cortes de página: avanza por A4 pero retrocede al fin
            // del último bloque que cabe entero.
            const paginas = [];
            let inicio = 0;
            while (inicio < totalPx - 1) {
                let limite = inicio + phPx;
                if (limite >= totalPx) { limite = totalPx; }
                else {
                    // busca el último punto de corte seguro dentro de [inicio, limite]
                    const candidatos = cortesClon.filter(c => c > inicio + 60 && c <= limite);
                    if (candidatos.length) {
                        limite = Math.max(...candidatos);
                    }
                    // si no hubo ninguno (bloque enorme), se corta en el límite A4
                    // para no dejar página en blanco.
                }
                paginas.push([inicio, limite]);
                inicio = limite;
            }

            // Dibuja cada segmento en su propia página (recortando el canvas fuente)
            const canvasFuente = document.createElement("canvas");
            const ctx = canvasFuente.getContext("2d");
            for (let i = 0; i < paginas.length; i++) {
                const [ini, fin] = paginas[i];
                const hPx = (fin - ini) * escala;
                canvasFuente.width = img.width;
                canvasFuente.height = hPx;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvasFuente.width, canvasFuente.height);
                ctx.drawImage(img, 0, ini * escala, img.width, hPx, 0, 0, img.width, hPx);

                const segUrl = canvasFuente.toDataURL("image/png");
                const segMmH = (hPx * pw) / img.width;
                if (i > 0) pdf.addPage();
                pdf.addImage(segUrl, "PNG", 0, 0, pw, segMmH);
            }

            const nombre = (userData.nombre_completo || "diagnostico").replace(/\s+/g, "_");
            pdf.save(`COMPASS_${nombre}.pdf`);
            Swal.close();
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "No se pudo generar el PDF. Intenta de nuevo.", "error");
        } finally {
            if (sandbox) document.body.removeChild(sandbox);
        }
    };

    return (
        <div className="auditar-container animate-fade-in">
            <div className="nav-back-container" style={{ marginBottom: '20px' }}>
                <button className="btn-back-minimal" onClick={() => onNavigate('overview')}
                    style={{ padding: '10px 15px', backgroundColor: '#fff', border: '1px solid #c5a059', borderRadius: '8px', color: '#c5a059', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⬅ Volver al Panel
                </button>
            </div>

            <div className="atlas-roadmap-container">
                <h2 className="roadmap-title">📍 Ruta de finalización de Auditoria ATLAS</h2>
                <div className="roadmap-steps">
                    <div className={`step-item ${progreso?.capa_1_sentido === 'COMPLETADO' ? 'done' : 'active'}`}>
                        <span className="step-num">{progreso?.capa_1_sentido === 'COMPLETADO' ? "✓" : "1"}</span>
                        <p>Marco Ético</p>
                    </div>
                    <div className={`step-item ${formsCompletos ? 'done' : (progreso?.capa_1_sentido === 'COMPLETADO' ? 'active' : '')}`}>
                        <span className="step-num">{formsCompletos ? "✓" : "2"}</span>
                        <p>Diagnóstico</p>
                    </div>
                    <div className={`step-item ${isProcessComplete ? 'done' : (formsCompletos ? 'active' : '')}`}>
                        <span className="step-num">{isProcessComplete ? "✓" : "3"}</span>
                        <p>{userData.rol === "DIRECTIVO" ? "Gobernanza" : "Resultado"}</p>
                    </div>
                </div>
            </div>

            <div className="auditar-layers-grid">
                <div className={`layer-card main-entry ${progreso?.capa_1_sentido === 'COMPLETADO' ? 'completed' : 'pending'}`}>
                    <div className="layer-badge">A1</div>
                    <div className="layer-content">
                        <h3>Capa 1: Compromiso institucional</h3>
                        <p className="intro-p">
                            <strong>COMPASS</strong> no es una capacitación sobre herramientas de inteligencia artificial. Es un proceso de <strong>reflexión institucional, diagnóstico estratégico, gestión de riesgos y gobernanza responsable</strong> que orienta la integración de la IA en la educación.<br /><br />
                            Declarar este compromiso significa utilizar la inteligencia artificial con <strong>propósito pedagógico, criterio ético y evidencia documentada</strong>. Este es el punto de partida para una implementación consciente, responsable y alineada con los principios de la institución.
                        </p>
                        <button onClick={handleAceptarMarco} disabled={progreso?.capa_1_sentido === 'COMPLETADO' || isSaving} className={`btn-formal-action ${progreso?.capa_1_sentido === 'COMPLETADO' ? 'btn-done' : ''}`}>
                            {isSaving ? "Guardando..." : progreso?.capa_1_sentido === 'COMPLETADO' ? "✓ Compromiso Declarado" : "Declaro Compromiso ATLAS"}
                        </button>
                    </div>
                </div>

                <div className={`layer-card side-entry ${progreso?.capa_1_sentido !== 'COMPLETADO' ? 'locked' : ''}`}>
                    <div className="layer-badge">A2</div>
                    <div className="layer-content">
                        <h3>Capa 2: Diagnóstico institucional basado en evidencia</h3>
                        {userData.rol === "DIRECTIVO" && (
                            <p className="layer-microtext">
                                Evalúa la capacidad de tu institución para liderar, gestionar riesgos y establecer lineamientos para el uso responsable de la inteligencia artificial.
                            </p>
                        )}

                        {sinFormulariosAsignados ? (
                            <div className="status-indicator-box">
                                <span className="status-tag locked">⏳ Aún no te han asignado un formulario en esta fase. Contacta a tu administrador.</span>
                            </div>
                        ) : (
                            <>
                                <div className="forms-status-list">
                                    {formulariosFase.map(f => {
                                        const completado = respuestasUsuario.some(r => r.formulario_id === f.id);
                                        return (
                                            <div key={f.id} className={`form-mini-status ${completado ? 'is-ok' : 'is-pending'}`}>
                                                <span className="f-title">{f.titulo}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className="f-check">{completado ? "" : "⏳"}</span>
                                                    {completado && (
                                                        <button
                                                            onClick={() => setModalRespuestas(f)}
                                                            style={{
                                                                fontSize: '0.72rem', padding: '3px 10px',
                                                                borderRadius: '6px', border: '1px solid #c5a059',
                                                                background: 'white', color: '#c5a059',
                                                                cursor: 'pointer', fontWeight: '700'
                                                            }}
                                                        >
                                                            Ver respuestas
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="status-indicator-box">
                                    {progreso?.capa_1_sentido === 'COMPLETADO' ? (
                                        formsCompletos ? <span className="status-tag success">✅ Completo</span> :
                                            <button className="btn-go-diagnostic" onClick={() => onNavigate('responder_fase', 'AUDITAR')}>Ir a Bitácora</button>
                                    ) : <span className="status-tag locked">🔒 Bloqueado</span>}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- CAPA 3: INFOGRAFÍA DE RESULTADOS COMPASS --- */}
            {isProcessComplete && (() => {
                const fechaHoy = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
                const esDirectivo = userData.rol === "DIRECTIVO";
                const CAMINO = ["Exploración", "Integración", "Consolidación", "Liderazgo", "Transformación"];
                const etapaActual = puntajeFinal >= 90 ? 4 : puntajeFinal >= 75 ? 3 : puntajeFinal >= 60 ? 2 : puntajeFinal >= 40 ? 1 : 0;

                const nivelEstandar = (offset = 0) => {
                    const e = Math.max(0, etapaActual - offset);
                    return e >= 3 ? { t: "Consolidado", c: "#38a169" }
                        : e >= 2 ? { t: "En desarrollo", c: "#3182ce" }
                            : e >= 1 ? { t: "En progreso", c: "#dd6b20" }
                                : { t: "Inicial", c: "#e53e3e" };
                };

                const RIESGO_POR_DIM = {
                    // Docente
                    "Integración pedagógica": "Uso de IA desconectado de objetivos curriculares.",
                    "Pensamiento crítico": "Escasa evaluación crítica de las respuestas de IA.",
                    "Gestión de riesgos y datos": "Manejo de datos sin criterios de privacidad claros.",
                    "Gobernanza institucional": "Falta de lineamientos institucionales claros.",
                    "Visión y madurez": "Adopción de IA sin una visión estratégica.",
                    // Directivo
                    "Gobernanza y política": "Ausencia de política institucional formal y supervisión humana obligatoria.",
                    "Gestión de riesgos": "No hay protocolos ni evaluación de riesgos antes de implementar IA.",
                    "Datos y cumplimiento": "Manejo de datos (incluidos menores) sin protocolos verificables.",
                    "Visión estratégica": "Decisiones sobre IA sin criterio pedagógico ni evaluación de impacto.",
                };
                const riesgos = (perfilDimensiones?.oportunidades || [])
                    .map(o => RIESGO_POR_DIM[o]).filter(Boolean);

                return (
                    <div className="compass-infografia" ref={infografiaRef}>

                        {/* HEADER */}
                        <header className="cmp-header">
                            <div className="cmp-header-brand">
                                <div className="cmp-logo">◭</div>
                                <div>
                                    <h1 className="cmp-brand-title">COMPASS</h1>
                                    <p className="cmp-brand-sub">Gobernanza y Sentido Crítico de la IA</p>
                                </div>
                            </div>
                            <div className="cmp-header-ident">
                                <span className="cmp-ident-tag">DIAGNÓSTICO {esDirectivo ? "DIRECTIVO" : "DOCENTE"}</span>
                                <p className="cmp-ident-nombre">{userData.nombre_completo || "—"}</p>
                                <p className="cmp-ident-meta">
                                    {esDirectivo ? "Directivo" : "Docente"}
                                    {userData.empresa_nombre ? ` · ${userData.empresa_nombre}` : ""}
                                </p>
                                <p className="cmp-ident-fecha">{fechaHoy}</p>
                            </div>
                        </header>

                        {/* HERO: nivel + camino */}
                        <section className="cmp-hero">
                            <div className="cmp-hero-left">
                                <p className="cmp-hero-eyebrow">Tu nivel de uso responsable de IA</p>
                                <h2 className="cmp-hero-nivel">{compass.nivel}</h2>
                                <div className="cmp-nivel-global">
                                    📊 Nivel global: <strong>{nivelGlobalPromedio ? nivelGlobalPromedio.nivel : compass.nivel}</strong>
                                </div>
                                <span className="cmp-rango">Rango ATLAS: {compass.rango}</span>
                            </div>

                            <div className="cmp-hero-right">
                                <h3 className="cmp-camino-title">Un camino de crecimiento profesional y colectivo</h3>
                                <div className="cmp-camino">
                                    {CAMINO.map((_, idx) => {
                                        const i = CAMINO.length - 1 - idx; // de arriba (más alto) a abajo
                                        const nombre = CAMINO[i];
                                        const activo = i === etapaActual;
                                        const alcanzado = i <= etapaActual;
                                        return (
                                            <div key={nombre} className={`cmp-camino-step${activo ? " activo" : ""}${alcanzado ? " alcanzado" : ""}`}>
                                                <span className="cmp-camino-dot" />
                                                <span className="cmp-camino-label">{nombre}</span>
                                                {activo && <span className="cmp-camino-you">Tú estás aquí</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="cmp-camino-foot">Misma educación. Nuevas posibilidades.</p>
                            </div>
                        </section>

                        {/* INTERPRETACIÓN */}
                        <section className="cmp-interpret">
                            <h4 className="cmp-block-title">Interpretación de resultados</h4>
                            <p className="cmp-interpret-text">{compass.desc}</p>
                            <div className="cmp-disclaimer">
                                <strong>Nota:</strong> Este diagnóstico no mide cuánto usas IA. Mide cómo la integras, supervisas y articulas con principios pedagógicos y éticos bajo estándares internacionales (UNESCO, OCDE).
                            </div>
                        </section>

                        {/* RADAR + HALLAZGOS (docente y directivo) */}
                        {perfilDimensiones && perfilDimensiones.dimensiones?.length > 0 && (
                            <section className="cmp-analysis">
                                <div className="cmp-radar-box">
                                    <h4 className="cmp-block-title">{esDirectivo ? "Radar de gobernanza institucional" : "Radar COMPASS — Perfil por dimensiones"}</h4>
                                    <RadarCompass dimensiones={perfilDimensiones.dimensiones} />
                                    <div className="cmp-dim-list">
                                        {perfilDimensiones.dimensiones.map(d => (
                                            <div key={d.dimension} className="cmp-dim-row"
                                                style={{ borderLeftColor: nivelColorCompass(d.nivel) }}>
                                                <span className="cmp-dim-name">{d.dimension}</span>
                                                <span className="cmp-dim-nivel" style={{ color: nivelColorCompass(d.nivel) }}>
                                                    {d.nivel} · {d.porcentaje}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="cmp-hallazgos">
                                    <h4 className="cmp-block-title">Tus principales hallazgos</h4>

                                    <div className="cmp-hallazgo-card fortalezas">
                                        <span className="cmp-hallazgo-icon">⭐</span>
                                        <div>
                                            <h5>Fortalezas</h5>
                                            {perfilDimensiones.fortalezas.length > 0
                                                ? perfilDimensiones.fortalezas.map(f => <p key={f}>✅ {f}</p>)
                                                : <p className="cmp-muted">Sigue trabajando para consolidar fortalezas.</p>}
                                        </div>
                                    </div>

                                    <div className="cmp-hallazgo-card oportunidades">
                                        <span className="cmp-hallazgo-icon">📈</span>
                                        <div>
                                            <h5>Oportunidades de crecimiento</h5>
                                            {perfilDimensiones.oportunidades.length > 0
                                                ? perfilDimensiones.oportunidades.map(o => <p key={o}>• {o}</p>)
                                                : <p className="cmp-muted">¡Sin dimensiones críticas!</p>}
                                        </div>
                                    </div>

                                    <div className="cmp-hallazgo-card riesgos">
                                        <span className="cmp-hallazgo-icon">⚠️</span>
                                        <div>
                                            <h5>Riesgos a tener en cuenta</h5>
                                            {riesgos.length > 0
                                                ? riesgos.map(r => <p key={r}>• {r}</p>)
                                                : <p className="cmp-muted">Sin riesgos críticos detectados. Mantén la supervisión humana.</p>}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ESTÁNDARES */}
                        <section className="cmp-standards">
                            <h4 className="cmp-block-title">Alineación con estándares internacionales</h4>
                            <div className="cmp-standards-grid">
                                {[
                                    { n: "UNESCO", d: "Recomendación sobre la Ética de la IA", e: nivelEstandar(0) },
                                    { n: "OCDE", d: "Principios de IA en educación", e: nivelEstandar(0) },
                                    { n: "AI Act (UE)", d: "Marco regulatorio de IA", e: nivelEstandar(1) },
                                ].map(s => (
                                    <div key={s.n} className="cmp-standard-card">
                                        <div className="cmp-standard-info">
                                            <strong>{s.n}</strong>
                                            <span>{s.d}</span>
                                        </div>
                                        <span className="cmp-standard-estado" style={{ background: `${s.e.c}18`, color: s.e.c }}>
                                            {s.e.t}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* PRÓXIMO PASO ESTRATÉGICO (solo directivo) */}
                        {esDirectivo && (
                            <section className="cmp-next-step">
                                <h4 className="cmp-block-title">Próximo paso estratégico</h4>
                                <p>
                                    Los principales marcos internacionales para la gobernanza de la inteligencia
                                    artificial en educación coinciden en que una implementación responsable requiere
                                    combinar liderazgo institucional, desarrollo de capacidades, supervisión humana y
                                    mejora continua.
                                </p>
                                <p>
                                    COMPASS le permitirá transformar los hallazgos de este diagnóstico en una hoja de
                                    ruta institucional basada en evidencia. A medida que avance por las fases del modelo
                                    ATLAS, podrá fortalecer progresivamente las capacidades de gobernanza, gestión de
                                    riesgos, toma de decisiones y uso responsable de la IA en toda la institución.
                                </p>
                                <p>
                                    Al mismo tiempo, la participación de la planta docente permitirá comprender cómo se
                                    están viviendo estos procesos en la práctica, facilitando una visión más completa de
                                    las fortalezas, necesidades y oportunidades de mejora de la comunidad educativa.
                                </p>
                                <p className="cmp-next-step-highlight">
                                    La gobernanza efectiva se construye cuando las decisiones institucionales están
                                    alineadas con las prácticas reales de enseñanza y aprendizaje.
                                </p>
                            </section>
                        )}

                        {/* FOOTER */}
                        <section className="cmp-footer">
                            <div className="cmp-footer-text">
                                <h4 className="cmp-block-title">¿Qué sigue ahora?</h4>
                                <p>
                                    Has finalizado con éxito la fase de <strong>Auditoría</strong>. Tu fotografía
                                    actual nos permite trazar una ruta personalizada para la fase de <strong>Transformación</strong>.
                                </p>
                            </div>
                            <div className="cmp-footer-actions cmp-no-print">
                                <button className="cmp-btn-pdf" onClick={descargarPDF}>⬇ Descargar PDF</button>
                                <button className="cmp-btn-finish" onClick={() => onNavigate('overview')}>Finalizar Fase →</button>
                            </div>
                        </section>

                        <footer className="cmp-brand-footer">
                            ◭ COMPASS · Educación hoy. Posibilidades mañana.
                        </footer>
                    </div>
                );
            })()}

            {modalRespuestas && (
                <div
                    onClick={() => setModalRespuestas(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white', borderRadius: '20px', padding: '30px',
                            maxWidth: '640px', width: '100%', maxHeight: '80vh',
                            overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>{modalRespuestas.titulo}</h3>
                            <button
                                onClick={() => setModalRespuestas(null)}
                                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
                            >×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {respuestasUsuario
                                .filter(r => r.formulario_id === modalRespuestas.id)
                                .map((r, i) => (
                                    <div key={i} style={{
                                        padding: '14px 18px', background: '#f8fafc',
                                        borderRadius: '12px', border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            Pregunta {i + 1}
                                        </div>
                                        <div style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: '600', marginBottom: '4px' }}>
                                            {r.pregunta_texto || `Pregunta ${i + 1}`}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                                            → {r.valor_respondido}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#c5a059', fontWeight: '700', marginTop: '4px' }}>
                                            {r.puntos_ganados} pts
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
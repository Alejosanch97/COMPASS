// ══════════════════════════════════════════════════════════════════════
// TARJETA DE CERTIFICADO DEL ALUMNO (para el Dashboard)
// Colócala en src/front/pages/MiCertificado.jsx
// Muestra el certificado como imagen descargable + botón "Agregar a LinkedIn".
//
// Requiere una librería para exportar a imagen. Instala una vez:
//   npm install html2canvas
// ══════════════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import "../Styles/miCertificado.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "";
const FASES = ["AUDITAR", "TRANSFORMAR", "LIDERAR", "ASEGURAR", "SOSTENER"];

export const MiCertificado = () => {
    const [info, setInfo] = useState(null);
    const [cargando, setCargando] = useState(true);
    const certRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch(`${BACKEND}/api/mi-credencial`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => { setInfo(d); setCargando(false); })
            .catch(() => setCargando(false));
    }, []);

    const descargarImagen = async () => {
        if (!certRef.current) return;
        const canvas = await html2canvas(certRef.current, {
            scale: 3, backgroundColor: "#ffffff", useCORS: true,
        });
        const link = document.createElement("a");
        link.download = `Certificado-${info.id_credencial}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    const [copiada, setCopiada] = useState("");
    const [abierto, setAbierto] = useState(false);
    const copiar = (txt) => {
        navigator.clipboard.writeText(txt);
        setCopiada(txt);
        setTimeout(() => setCopiada(""), 1500);
    };

    if (cargando) return <p className="cert-loading">Cargando…</p>;

    // Aún no alcanza el umbral de huella (80)
    if (info && !info.tiene_credencial) {
        return (
            <div className="cert-bloqueado">
                <h3>Certificado en progreso 🔒</h3>
                <p>
                    Tu Huella COMPASS actual es{" "}
                    <strong>{Math.round(info.huella_actual)}</strong> / 100.
                    Alcanza al menos <strong>{info.huella_requerida}</strong> puntos
                    completando las fases ATLAS para desbloquear tu credencial verificable.
                </p>
                <div className="cert-barra">
                    <div
                        className="cert-barra-fill"
                        style={{ width: `${Math.min(info.huella_actual, 100)}%` }}
                    />
                </div>
            </div>
        );
    }

    const fecha = info?.fecha_emision
        ? new Date(info.fecha_emision).toLocaleDateString("es-CO", {
            year: "numeric", month: "long", day: "numeric",
        })
        : "";

    const top = info?.aptitudes_top || [];
    const aptitudesOrdenadas = [
        ...top,
        ...(info?.aptitudes || []).filter((s) => !top.includes(s)),
    ];

    return (
        <div className="cert-container">
            {/* ---- Certificado azul que se exporta a imagen ---- */}
            <div className="cv-diploma" ref={certRef}>
                <svg className="cv-corners" viewBox="0 0 920 560" preserveAspectRatio="none">
                    <polygon points="0,0 172,0 0,172" fill="#c5a059" />
                    <polygon points="0,0 150,0 0,150" fill="#16233f" />
                    <polygon points="920,560 748,560 920,388" fill="#c5a059" />
                    <polygon points="920,560 770,560 920,410" fill="#16233f" />
                </svg>

                <div className="cv-logo-plate">
                    <span className="cv-brand">COMPASS</span>
                </div>
                <div className="cv-brand-sub">— IA RESPONSABLE —</div>

                <h1 className="cv-title">Certificado de participación</h1>
                <p className="cv-subtitle">PILOTO COMPASS IA RESPONSABLE</p>

                <div className="cv-otorgado"><span>OTORGADO A</span></div>
                <h2 className="cv-name">{info.nombre_completo}</h2>

                <p className="cv-body">
                    Por su compromiso y participación activa en el <strong>Piloto COMPASS IA Responsable</strong>,
                    contribuyendo al desarrollo de una implementación ética, sostenible y centrada en las
                    personas en instituciones educativas.
                </p>

                <div className="cv-fases">
                    {FASES.map((f, i) => (
                        <React.Fragment key={f}>
                            <span className="cv-fase">{f}</span>
                            {i < FASES.length - 1 && <span className="cv-dot">·</span>}
                        </React.Fragment>
                    ))}
                </div>

                <div className="cv-signrow">
                    <div className="cv-sign">
                        <span className="cv-sign-val">{fecha}</span>
                        <span className="cv-sign-lbl">CERTIFICADO EMITIDO EL DÍA</span>
                    </div>

                    <div className="cv-seal">
                        <img src="/logover2.png" alt="Sello COMPASS" className="cv-seal-img" />
                    </div>

                    <div className="cv-sign">
                        <span className="cv-sign-val cv-signature">Felipe Cárdenas</span>
                        <span className="cv-sign-lbl">EQUIPO COMPASS</span>
                    </div>
                </div>

                <div className="cv-meta-line">
                    Huella COMPASS: <strong>{Math.round(info.huella_final)}/100</strong>
                    &nbsp;·&nbsp; Credencial verificable: <strong>{info.id_credencial}</strong>
                </div>
            </div>

            {/* ---- Acciones ---- */}
            <div className="cert-acciones">
                <button className="cert-btn cert-btn-download" onClick={descargarImagen}>
                    ⬇ Descargar imagen
                </button>
                <a
                    className="cert-btn cert-btn-linkedin"
                    href={info.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    in  Agregar a LinkedIn
                </a>
                <a
                    className="cert-btn cert-btn-verify"
                    href={info.cert_url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    🔗 Ver página de verificación
                </a>
                <button
                    className="cert-btn cert-btn-skills"
                    onClick={() => setAbierto(true)}
                >
                    🎯 Mis aptitudes
                </button>
            </div>

            {abierto && (
                <div className="cert-modal-fondo" onClick={() => setAbierto(false)}>
                    <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="cert-modal-x" onClick={() => setAbierto(false)}>✕</button>
                        <div className="cert-topbar" />
                        <p className="cert-eyebrow">Aptitudes para LinkedIn</p>
                        <h3 className="cert-modal-titulo">Tus aptitudes COMPASS</h3>
                        <p className="cert-modal-sub">
                            Copia una, pégala en el campo <strong>Aptitudes</strong> de LinkedIn,
                            elige la sugerencia y repite con la siguiente.
                        </p>

                        <ul className="cert-modal-lista">
                            {aptitudesOrdenadas.map((s) => (
                                <li key={s} className="cert-apt-fila">
                                    <span className="cert-apt-nombre">
                                        {top.includes(s) && <span className="cert-apt-star">★</span>}
                                        {s}
                                    </span>
                                    <button
                                        className={`cert-apt-copiar ${copiada === s ? "ok" : ""}`}
                                        onClick={() => copiar(s)}
                                    >
                                        {copiada === s ? "✓ Copiado" : "Copiar"}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <p className="cert-modal-nota">
                            ★ = las 5 recomendadas para asociar a esta certificación.
                        </p>
                    </div>
                </div>
            )}

            <p className="cert-hint">
                Consejo: el botón <strong>Agregar a LinkedIn</strong> lleva el certificado
                a tu sección de Licencias y Certificaciones con todo pre-rellenado. La
                <strong> imagen</strong> puedes subirla a un post o a tu sección Destacado.
            </p>
        </div>
    );
};

export default MiCertificado;
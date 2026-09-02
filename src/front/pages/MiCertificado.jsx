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
        const canvas = await html2canvas(certRef.current, { scale: 3, backgroundColor: null });
        const link = document.createElement("a");
        link.download = `Certificado-${info.id_credencial}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
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

    return (
        <div className="cert-container">
            {/* ---- Tarjeta que se exporta a imagen ---- */}
            <div className="cert-diploma" ref={certRef}>
                <div className="cert-topbar" />
                <div className="cert-brand">COMPASS</div>
                <p className="cert-eyebrow">CERTIFICADO DE FINALIZACIÓN</p>
                <h1 className="cert-nombre">{info.nombre_completo}</h1>
                <p className="cert-texto">ha completado exitosamente el programa</p>
                <h2 className="cert-programa">{info.programa}</h2>

                <div className="cert-fases">
                    {(info.fases_completadas || []).map((f) => (
                        <span key={f} className="cert-chip">{f}</span>
                    ))}
                </div>

                <div className="cert-meta">
                    <div>
                        <span className="cert-meta-label">Huella COMPASS</span>
                        <span className="cert-meta-val">{Math.round(info.huella_final)}/100</span>
                    </div>
                    <div>
                        <span className="cert-meta-label">Fecha</span>
                        <span className="cert-meta-val">{fecha}</span>
                    </div>
                </div>

                <div className="cert-footer">
                    <span className="cert-seal">✓</span>
                    <div className="cert-footer-txt">
                        <span>Credencial verificable</span>
                        <span className="cert-id">{info.id_credencial}</span>
                    </div>
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
            </div>

            <p className="cert-hint">
                Consejo: el botón <strong>Agregar a LinkedIn</strong> lleva el certificado
                a tu sección de Licencias y Certificaciones con todo pre-rellenado. La
                <strong> imagen</strong> puedes subirla a un post o a tu sección Destacado.
            </p>
        </div>
    );
};

export default MiCertificado;
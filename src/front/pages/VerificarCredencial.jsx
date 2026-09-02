// ══════════════════════════════════════════════════════════════════════
// PÁGINA PÚBLICA DE VERIFICACIÓN  ->  tusitio.com/verify/COMPASS-XXXX
// Colócala en src/front/pages/VerificarCredencial.jsx
// NO requiere login. La ve el reclutador cuando hace clic en "Mostrar credencial".
// ══════════════════════════════════════════════════════════════════════
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../Styles/verificarCredencial.css";

// Ajusta si tu backend usa otra variable de entorno
const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

export const VerificarCredencial = () => {
    const { idCred } = useParams();
    const [estado, setEstado] = useState("cargando"); // cargando | valido | invalido
    const [data, setData] = useState(null);

    useEffect(() => {
        const url = `${BACKEND}/api/verify/${idCred}`;
        fetch(url)
            .then((r) => {
                if (!r.ok) throw new Error("no valido");
                return r.json();
            })
            .then((d) => {
                if (d.valido) {
                    setData(d);
                    setEstado("valido");
                } else {
                    setEstado("invalido");
                }
            })
            .catch(() => setEstado("invalido"));
    }, [idCred]);

    const fecha = data?.fecha_emision
        ? new Date(data.fecha_emision).toLocaleDateString("es-CO", {
              year: "numeric", month: "long", day: "numeric",
          })
        : "";

    return (
        <div className="verify-wrap">
            <div className="verify-card">
                <div className="verify-brand">COMPASS</div>

                {estado === "cargando" && (
                    <p className="verify-loading">Verificando credencial…</p>
                )}

                {estado === "invalido" && (
                    <div className="verify-invalid">
                        <div className="verify-x">✕</div>
                        <h2>Credencial no válida</h2>
                        <p>
                            No encontramos una credencial activa con el código{" "}
                            <strong>{idCred}</strong>. Puede haber sido revocada o el
                            enlace es incorrecto.
                        </p>
                    </div>
                )}

                {estado === "valido" && data && (
                    <>
                        <div className="verify-seal">
                            <div className="verify-check">✓</div>
                        </div>
                        <h1 className="verify-title">Verificación</h1>

                        <div className="verify-rows">
                            <p>Emitido a <strong>{data.nombre}</strong></p>
                            <p>Programa: <strong>{data.programa}</strong></p>
                            {data.empresa && (
                                <p>Institución: <strong>{data.empresa}</strong></p>
                            )}
                            <p>Fecha de emisión: <strong>{fecha}</strong></p>
                            <p>Código: <strong>{data.id_credencial}</strong></p>
                        </div>

                        {data.fases_completadas?.length > 0 && (
                            <div className="verify-fases">
                                {data.fases_completadas.map((f) => (
                                    <span key={f} className="verify-chip">{f}</span>
                                ))}
                            </div>
                        )}

                        <div className="verify-authentic">
                            <span className="verify-dot">✓</span>
                            La credencial fue verificada. Es auténtica.
                        </div>
                    </>
                )}
            </div>

            <p className="verify-footer">
                La verificación permite que cualquier tercero confirme que esta persona
                participó en el programa, sin depender de PDFs o capturas. Es una
                credencial digital verificable.
            </p>
        </div>
    );
};

export default VerificarCredencial;
import React, { useState } from "react";
import { POLITICAS, TEXTO_ACEPTACION } from "./politicas";
import "../Styles/politicas.css";

const Bloques = ({ bloques }) =>
    bloques.map((b, i) =>
        b.tipo === "ul" ? (
            <ul key={i} className="pol-lista">
                {b.items.map((it, j) => <li key={j}>{it}</li>)}
            </ul>
        ) : (
            <p key={i}>{b.texto}</p>
        )
    );

export const PoliticasContenido = () => (
    <div className="pol-contenido">
        {POLITICAS.map((p) => (
            <section key={p.id} className="pol-seccion">
                <h3>{p.titulo}</h3>
                <Bloques bloques={p.bloques} />
            </section>
        ))}
    </div>
);

// Landing: solo lectura, se puede cerrar
export const ModalPoliticas = ({ abierta, onClose }) => {
    if (!abierta) return null;
    return (
        <div className="pol-overlay" onClick={onClose}>
            <div className="pol-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="pol-header">
                    <div>
                        <span className="pol-tag">COMPASS IA Responsable</span>
                        <h2>Privacidad y tratamiento de datos</h2>
                    </div>
                    <button className="pol-close" onClick={onClose} aria-label="Cerrar">✕</button>
                </div>
                <div className="pol-body"><PoliticasContenido /></div>
            </div>
        </div>
    );
};

// Dashboard: bloqueante, obliga a aceptar o salir
export const ModalAceptarPoliticas = ({ onAceptar, onRechazar }) => {
    const [acepta, setAcepta] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const confirmar = async () => {
        setGuardando(true);
        setError("");
        try {
            await onAceptar();
        } catch (e) {
            setError("No pudimos registrar tu aceptación. Intenta de nuevo.");
            setGuardando(false);
        }
    };

    return (
        <div className="pol-overlay">
            <div className="pol-modal" role="dialog" aria-modal="true">
                <div className="pol-header">
                    <div>
                        <span className="pol-tag">Antes de continuar</span>
                        <h2>Privacidad y tratamiento de datos</h2>
                    </div>
                </div>
                <div className="pol-body"><PoliticasContenido /></div>
                <div className="pol-footer">
                    <label className="pol-check">
                        <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
                        <span>{TEXTO_ACEPTACION}</span>
                    </label>
                    {error && <p className="pol-error">{error}</p>}
                    <div className="pol-acciones">
                        <button className="pol-btn-sec" onClick={onRechazar} disabled={guardando}>
                            No acepto · Cerrar sesión
                        </button>
                        <button className="pol-btn-pri" onClick={confirmar} disabled={!acepta || guardando}>
                            {guardando ? "Guardando..." : "Aceptar y continuar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
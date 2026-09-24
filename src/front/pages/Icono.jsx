import React from "react";

const TRAZOS = {
    atras: <><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></>,
    adelante: <><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></>,
    check: <path d="M20 6L9 17l-5-5" />,
    alerta: <><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>,
    docente: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    balanza: <><path d="M12 3v18M7 21h10M4 7h16" /><path d="M7 7l-3 7a3 3 0 0 0 6 0z" /><path d="M17 7l-3 7a3 3 0 0 0 6 0z" /></>,
    bombillo: <><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /></>,
    candado: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    ojo: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    reloj: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    diana: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
    pregunta: <><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>,
    reiniciar: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
};

export const Icono = ({ nombre, size = 18, className = "" }) => (
    <svg className={`atlas-icon ${className}`} width={size} height={size} viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {TRAZOS[nombre]}
    </svg>
);
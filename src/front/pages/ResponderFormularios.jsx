import React, { useState, useEffect } from 'react';
import '../Styles/responderFormularios.css';
import Swal from "sweetalert2";


/**
 * ResponderFormularios
 * Mismo diseño y comportamiento del original (tabs Pendientes/Completados,
 * modal de preguntas, 6 tipos de pregunta), conectado al backend Flask.
 *
 * filterPhase recibe el nombre real de la fase ("AUDITAR", "TRANSFORMAR", etc.)
 */
export const ResponderFormularios = ({
    userData,
    apiFetch,
    filterPhase,
    onNavigate,
}) => {
    const [availableForms, setAvailableForms] = useState([]);
    const [userAnswers, setUserAnswers] = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [currentResponses, setCurrentResponses] = useState({});
    const [activeTab, setActiveTab] = useState('pending');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterPhase]);

    const fetchInitialData = async () => {
        setIsSyncing(true);
        try {
            const [formsData, answersData] = await Promise.all([
                apiFetch(`/api/mi-empresa/formularios?fase=${filterPhase || "AUDITAR"}`).catch(() => []),
                apiFetch("/api/mis-respuestas").catch(() => []),
            ]);
            setAvailableForms(Array.isArray(formsData) ? formsData : []);
            setUserAnswers(Array.isArray(answersData) ? answersData : []);
        } catch (e) {
            console.error("Error cargando formularios:", e);
        } finally {
            setIsSyncing(false);
        }
    };

    const isFormAnswered = (formId) => userAnswers.some(ans => ans.formulario_id === formId);

    const pendingForms = availableForms.filter(f => !isFormAnswered(f.id));
    const completedForms = availableForms.filter(f => isFormAnswered(f.id));

    const handleOpenForm = async (form) => {
    // Abre el modal inmediatamente con estado de carga
    setSelectedForm({ ...form, questions: null });
    try {
        const preguntas = await apiFetch(`/api/formularios/${form.id}/preguntas`);
        setSelectedForm({ ...form, questions: preguntas });
        setCurrentResponses({});
    } catch (e) {
        console.error(e);
        setSelectedForm(null);
        Swal.fire("Error", "No se pudieron cargar las preguntas.", "error");
    }
};

    // Las opciones llegan como array (opciones_seleccion es JSON), no como string separado por comas
    const splitOptions = (opciones) => {
        if (!opciones) return [];
        if (Array.isArray(opciones)) return opciones;
        // compatibilidad por si llega como string antiguo
        return String(opciones).split(/(?<!\d),/).map(opt => opt.trim());
    };

    const handleInputChange = (questionId, value, isCheckbox = false, isOrdering = false) => {
        if (isOrdering) {
            setCurrentResponses(prev => {
                const prevOrder = prev[questionId] || [];
                const newOrder = prevOrder.includes(value)
                    ? prevOrder.filter(v => v !== value)
                    : [...prevOrder, value];
                return { ...prev, [questionId]: newOrder };
            });
        } else if (isCheckbox) {
            setCurrentResponses(prev => {
                const prevValues = prev[questionId] || [];
                const newValues = prevValues.includes(value)
                    ? prevValues.filter(v => v !== value)
                    : [...prevValues, value];
                return { ...prev, [questionId]: newValues };
            });
        } else {
            setCurrentResponses(prev => ({ ...prev, [questionId]: value }));
        }
    };

    // Limpia el texto visible de la opción quitando el puntaje entre paréntesis al final, ej: "Sí(5)" -> "Sí"
    const cleanOptionText = (text) => {
        if (!text) return "";
        return String(text).replace(/\s*\([^)]+\)$/, "").trim();
    };

    const handleSubmitAnswers = async (e) => {
        e.preventDefault();

        const totalQuestions = selectedForm.questions.length;
        const answeredQuestions = Object.keys(currentResponses).filter(key => {
            const val = currentResponses[key];
            if (Array.isArray(val)) return val.length > 0;
            return val !== undefined && val !== null && val !== "";
        }).length;

        if (answeredQuestions < totalQuestions) {
            Swal.fire({
                icon: 'warning',
                title: 'Formulario Incompleto',
                text: `Has respondido ${answeredQuestions} de ${totalQuestions} preguntas. Por favor, completa todo el instrumento antes de enviar.`,
                confirmButtonColor: '#c5a059',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        const formToSave = { ...selectedForm };
        const responsesToSave = { ...currentResponses };

        setSelectedForm(null);
        setIsSyncing(true);

        const respuestasPayload = formToSave.questions.map(q => {
            const rawValue = responsesToSave[q.id];
            let answerString = "";
            let totalPoints = 0;

            if (q.tipo_respuesta === "ORDEN") {
                answerString = (rawValue || []).map((v, i) => `${i + 1}. ${cleanOptionText(v)}`).join(", ");
                totalPoints = parseFloat(q.puntaje_asociado || 0);
            } else if (Array.isArray(rawValue)) {
                // CHECKBOX: suma el puntaje incrustado en cada opción seleccionada, ej "Sesgos(1.25)"
                answerString = rawValue.map(v => cleanOptionText(v)).join(", ");
                rawValue.forEach(v => {
                    const match = String(v).match(/\(([^)]+)\)$/);
                    if (match) totalPoints += parseFloat(match[1].replace(',', '.'));
                });
            } else {
                answerString = q.tipo_respuesta === "ESCALA" ? `Nivel ${rawValue}` : cleanOptionText(rawValue);
                const match = String(rawValue).match(/\(([^)]+)\)$/);
                if (match) {
                    totalPoints = parseFloat(match[1].replace(',', '.'));
                } else if (q.tipo_respuesta === "ESCALA") {
                    totalPoints = parseFloat(rawValue || 0);
                } else if (q.tipo_respuesta === "SLIDER") {
                    totalPoints = parseFloat(q.puntaje_asociado || 0);
                } else {
                    totalPoints = parseFloat(q.puntaje_asociado || 0);
                }
            }

            return {
                pregunta_id: q.id,
                valor_respondido: answerString,
                puntos_ganados: totalPoints,
            };
        });

        try {
            await apiFetch("/api/respuestas", {
                method: "POST",
                body: JSON.stringify({
                    formulario_id: formToSave.id,
                    respuestas: respuestasPayload,
                }),
            });

            await fetchInitialData();

await Swal.fire({
    icon: 'success',
    title: '¡Enviado!',
    text: 'Tus respuestas han sido sincronizadas correctamente.',
    timer: 2000,
    showConfirmButton: false
});

// Redirigir a la fase de origen después de completar
if (filterPhase === 'AUDITAR') {
    onNavigate('fase_auditar');
} else {
    onNavigate('overview');
}


        } catch (err) {
            console.error("Error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error de Sincronización',
                text: 'No pudimos guardar tus datos. Inténtalo de nuevo.'
            });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="atlas-responder-container animate-fade-in">

            <div className="nav-back-container" style={{ marginBottom: '20px' }}>
                <button
                    className="btn-back-minimal"
                    onClick={() => {
                        if (filterPhase === 'AUDITAR') {
                            onNavigate('fase_auditar');
                        } else {
                            onNavigate('overview');
                        }
                    }}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#fff',
                        border: '1px solid #c5a059',
                        borderRadius: '8px',
                        color: '#c5a059',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    ⬅ Volver
                </button>
            </div>

            <div className="responder-controls-row">
                <div className="tab-container-modern">
                    <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                        Pendientes <span className="tab-count">{pendingForms.length}</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
                        Completados <span className="tab-count">{completedForms.length}</span>
                    </button>
                </div>
               
            </div>

            <div className="forms-grid-responder">
                {isSyncing && availableForms.length === 0 ? (
                    <div className="loading-state-placeholder">
                        <p>Buscando instrumentos en la nube...</p>
                    </div>
                ) : (activeTab === 'pending' ? pendingForms : completedForms).length === 0 ? (
                    <div className="no-forms-message">
                        <p>
                            {availableForms.length === 0
                                ? `Aún no te han asignado retos en la Fase ${filterPhase || ''}. Contacta a tu administrador institucional.`
                                : `No hay instrumentos ${activeTab === 'pending' ? 'pendientes' : 'completados'} en la Fase ${filterPhase || ''} por ahora.`}
                        </p>
                    </div>
                ) : (
                    (activeTab === 'pending' ? pendingForms : completedForms).map(form => (
                        <div key={form.id} className={`form-card-answerable ${activeTab === 'completed' ? 'card-done' : 'card-pending'}`}>
                            <div className="card-accent" />
                            <span className="phase-badge">{form.fase_atlas}</span>
                            <h3>{form.titulo}</h3>
                            <p>{form.descripcion}</p>
                            <div className="card-footer">
                                <span className="pts-tag">{form.puntos_maximos} Pts Máx</span>
                                {activeTab === 'pending' ? (
                                    <button className="btn-respond" onClick={() => handleOpenForm(form)}>Responder Ahora ✍️</button>
                                ) : (
                                    <span className="status-done-pill">✅ Completado</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedForm && (
                <div className="modal-overlay-atlas" onClick={() => setSelectedForm(null)}>
                    <div className="modal-content-glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-atlas-header">
                            <div className="header-info">
                                <h2>{selectedForm.titulo}</h2>
                                <span className="modal-subtitle">Fase {selectedForm.fase_atlas} • Máximo: {selectedForm.puntos_maximos} pts</span>
                            </div>
                            <button className="close-btn-circle" onClick={() => setSelectedForm(null)}>×</button>
                        </div>

                        <form onSubmit={handleSubmitAnswers} className="modal-atlas-body">

    {selectedForm.questions === null ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <div style={{
                width: '36px', height: '36px', border: '3px solid #f1f5f9',
                borderTopColor: '#c5a059', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
            }} />
            <p>Cargando preguntas...</p>
        </div>
    ) : (
        selectedForm.questions.map((q, idx) => (
            <div key={q.id} className="question-card-minimal">
                <div className="q-number">{idx + 1}</div>
                <div className="q-content">
                    <label className="q-text">{q.texto_pregunta}</label>

                    {q.tipo_respuesta === "MULTIPLE" && (
                        <div className="options-vertical">
                            {splitOptions(q.opciones_seleccion).map(opt => (
                                <label key={opt} className="custom-radio-row">
                                    <input type="radio" name={`q_${q.id}`} value={opt} required onChange={(e) => handleInputChange(q.id, e.target.value)} />
                                    <span className="radio-label-text">{cleanOptionText(opt)}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {(q.tipo_respuesta === "CHECKBOX" || q.tipo_respuesta === "SELECT") && (
                        <div className="options-vertical">
                            {splitOptions(q.opciones_seleccion).map(opt => (
                                <label key={opt} className="custom-radio-row">
                                    <input
                                        type={q.tipo_respuesta === "SELECT" ? "radio" : "checkbox"}
                                        name={q.tipo_respuesta === "SELECT" ? `q_${q.id}` : undefined}
                                        value={opt}
                                        onChange={(e) => handleInputChange(q.id, e.target.value, q.tipo_respuesta === "CHECKBOX")}
                                    />
                                    <span className="radio-label-text">{cleanOptionText(opt)}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {q.tipo_respuesta === "ORDEN" && (
                        <div className="options-vertical">
                            <p style={{ fontSize: '0.7rem', color: '#c5a059', marginBottom: '8px' }}>Selecciona las opciones en orden de importancia (1 es mayor prioridad):</p>
                            {splitOptions(q.opciones_seleccion).map(opt => {
                                const orderIndex = (currentResponses[q.id] || []).indexOf(opt);
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        className={`custom-radio-row ${orderIndex !== -1 ? 'active-order' : ''}`}
                                        onClick={() => handleInputChange(q.id, opt, false, true)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            cursor: 'pointer', width: '100%', padding: '12px', textAlign: 'left',
                                            background: orderIndex !== -1 ? '#fdf8ee' : 'white',
                                            border: orderIndex !== -1 ? '1px solid #c5a059' : '1px solid #e2e8f0',
                                            borderRadius: '8px', marginBottom: '6px'
                                        }}
                                    >
                                        <span className="radio-label-text">{cleanOptionText(opt)}</span>
                                        {orderIndex !== -1 && (
                                            <span style={{
                                                backgroundColor: '#c5a059', color: 'white', borderRadius: '50%',
                                                width: '22px', height: '22px', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'
                                            }}>
                                                {orderIndex + 1}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {["ABIERTA", "PARRAFO"].includes(q.tipo_respuesta) && (
                        <textarea
                            className="atlas-textarea"
                            placeholder={q.tipo_respuesta === "PARRAFO" ? "Escribe un párrafo detallado..." : "Respuesta corta..."}
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                            required
                        />
                    )}

                    {q.tipo_respuesta === "ESCALA" && (
                        <div className="scale-container-expert">
                            <div className="scale-labels-top">
                                <span className="label-min">1 - Totalmente en desacuerdo</span>
                                <span className="label-max">5 - Totalmente de acuerdo</span>
                            </div>
                            <div className="atlas-scale-row">
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        className={`scale-pill ${currentResponses[q.id] == num ? 'active' : ''}`}
                                        onClick={() => handleInputChange(q.id, num)}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {q.tipo_respuesta === "SLIDER" && (
                        <div className="scale-container-expert">
                            <div className="scale-labels-top">
                                <span className="label-min">{q.opciones_seleccion?.min ?? 1}</span>
                                <span className="label-max">{q.opciones_seleccion?.max ?? 5}</span>
                            </div>
                            <input
                                type="range"
                                min={q.opciones_seleccion?.min ?? 1}
                                max={q.opciones_seleccion?.max ?? 5}
                                defaultValue={q.opciones_seleccion?.min ?? 1}
                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    )}
                </div>
            </div>
        ))
    )}

    {selectedForm.questions !== null && (
        <div className="modal-footer-sticky">
            <button type="submit" className="btn-submit-atlas">Finalizar y Enviar Respuestas</button>
        </div>
    )}

</form>
                    </div>
                </div>
            )}
        </div>
    );
};
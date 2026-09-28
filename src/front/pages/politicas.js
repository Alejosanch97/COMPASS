// Si cambias el texto de las políticas, sube la versión:
// todos los usuarios volverán a ver el modal y deberán aceptar de nuevo.
export const POLITICAS_VERSION = "2026-09";

// TODO: reemplazar por el correo definitivo (Felipe dejó XXXXX)
export const CORREO_DATOS = "atlasframework.ai@gmail.com";

export const TEXTO_ACEPTACION =
  "He leído y acepto la Política de Privacidad y autorizo el tratamiento de mis datos personales para los fines descritos.";

export const POLITICAS = [
  {
    id: "privacidad",
    titulo: "Política de Privacidad",
    bloques: [
      { tipo: "p", texto: "COMPASS IA Responsable respeta y protege la privacidad de las personas e instituciones que participan en sus diagnósticos, evaluaciones y actividades de acompañamiento." },
      { tipo: "p", texto: "La información recopilada será utilizada exclusivamente para fines de análisis, diagnóstico, mejora institucional, investigación aplicada y generación de recomendaciones relacionadas con la adopción, gobernanza y uso responsable de la inteligencia artificial en entornos educativos." },
      { tipo: "p", texto: "COMPASS no comercializa, vende ni comparte información personal con terceros sin autorización expresa, salvo cuando exista obligación legal." },
      { tipo: "p", texto: "Toda la información será almacenada bajo medidas razonables de seguridad y únicamente será accesible para el equipo autorizado de COMPASS." },
    ],
  },
  {
    id: "tratamiento",
    titulo: "Autorización para el Tratamiento de Datos",
    bloques: [
      { tipo: "p", texto: "Al aceptar estas condiciones, usted autoriza de manera libre, informada y voluntaria a COMPASS IA Responsable para recopilar, almacenar, analizar y procesar la información suministrada." },
      { tipo: "p", texto: "Los datos recopilados podrán incluir:" },
      { tipo: "ul", items: [
        "Nombre y apellidos.",
        "Correo electrónico institucional o personal.",
        "Cargo o rol profesional.",
        "Institución educativa u organización.",
        "País o región.",
        "Respuestas a cuestionarios, diagnósticos y evaluaciones relacionadas con inteligencia artificial y transformación educativa.",
      ]},
      { tipo: "p", texto: "La participación es completamente voluntaria y el participante podrá solicitar la modificación o eliminación de sus datos en cualquier momento." },
    ],
  },
  {
    id: "uso",
    titulo: "Evaluación y Uso de la Información",
    bloques: [
      { tipo: "p", texto: "La información proporcionada será revisada y analizada por el equipo de COMPASS IA Responsable con el propósito de:" },
      { tipo: "ul", items: [
        "Generar diagnósticos institucionales.",
        "Identificar oportunidades de mejora.",
        "Elaborar reportes agregados y recomendaciones.",
        "Diseñar estrategias de fortalecimiento de capacidades en inteligencia artificial.",
        "Desarrollar análisis estadísticos y tendencias generales.",
      ]},
      { tipo: "p", texto: "Cuando se presenten resultados públicos, académicos o de investigación, estos se compartirán de forma agregada y sin identificar individualmente a los participantes, salvo autorización expresa." },
    ],
  },
  {
    id: "eliminacion",
    titulo: "Solicitud de Eliminación de Datos",
    bloques: [
      { tipo: "p", texto: "Los participantes podrán solicitar en cualquier momento la eliminación total de sus datos personales y respuestas registradas." },
      { tipo: "p", texto: `Para ejercer este derecho, deberán enviar una solicitud al correo: ${CORREO_DATOS}` },
      { tipo: "p", texto: "Una vez recibida la solicitud, COMPASS eliminará la información asociada dentro de un plazo razonable y confirmará la ejecución del proceso al solicitante." },
      { tipo: "p", texto: "La eliminación de los datos puede implicar la exclusión de análisis, diagnósticos o reportes previamente generados cuando sea técnicamente posible." },
    ],
  },
];
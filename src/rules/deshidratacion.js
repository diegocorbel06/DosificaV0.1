/**
 * Reglas JSON editables para deshidratación.
 * Pueden moverse a base de datos o archivo externo sin cambiar el motor.
 */
export const deshidratacionRules = [
  {
    id: 'deshidratacion_moderada_adulto',
    pathology: 'deshidratacion',
    conditions: [
      { field: 'edad', operator: 'greaterThan', value: 15 },
      { field: 'signos', operator: 'includes', value: 'ojos hundidos' },
      { field: 'signos', operator: 'includes', value: 'mucosas secas' },
      { field: 'nivelResolutivo', operator: 'includes', value: 'I-' },
    ],
    diagnosis: 'Deshidratación moderada',
    severity: 'Moderada',
    treatment: {
      firstLine: 'SRO',
      alternative: 'ClNa 0.9%',
      doseFormula: '75 ml * peso',
      indications: [
        'Administrar en 4 horas y reevaluar hidratación clínica.',
        'Monitorizar diuresis y tolerancia oral.',
      ],
    },
    referralCriteria: 'Referir si no mejora en 4 horas o hay deterioro hemodinámico.',
  },
];

export const anemiaRules = [
  {
    id: 'anemia_leve_pediatrica',
    pathology: 'anemia',
    conditions: [
      { field: 'edad', operator: 'lessThan', value: 12 },
      { field: 'laboratorio.hemoglobina', operator: 'lessThan', value: 11 },
    ],
    diagnosis: 'Anemia leve pediátrica',
    severity: 'Leve',
    treatment: {
      firstLine: 'Sulfato ferroso',
      alternative: 'Hierro polimaltosado',
      doseFormula: '3 mg * peso',
      indications: ['Suplementación diaria y control en 30 días.'],
    },
    referralCriteria: 'Referir si hemoglobina < 7 g/dL o signos de compromiso cardiopulmonar.',
  },
];

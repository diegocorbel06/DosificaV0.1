import { describe, expect, it } from 'vitest';
import { evaluateRule, evaluateRules } from '../engine/ruleEvaluator.js';
import { calculateDosage } from '../engine/dosageCalculator.js';
import { runRuleEngine } from '../engine/ruleEngine.js';

describe('Clinical engine basics', () => {
  it('evalúa regla básica correctamente', () => {
    const rule = {
      id: 'r1',
      conditions: [
        { field: 'edad', operator: 'greaterThan', value: 10 },
        { field: 'signos', operator: 'includes', value: 'mucosas secas' },
      ],
    };

    const patient = {
      edad: 25,
      signos: ['mucosas secas', 'sed intensa'],
    };

    expect(evaluateRule(rule, patient)).toBe(true);
  });

  it('evalúa múltiples variables simultáneas y ordena por prioridad', () => {
    const rules = [
      {
        id: 'baja-prioridad',
        active: true,
        priority: 1,
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'edad', label: 'Edad', type: 'number', operator: '>', value: 12 },
            { field: 'sexo', label: 'Sexo', type: 'select', operator: '=', value: 'F' },
          ],
        },
      },
      {
        id: 'alta-prioridad',
        active: true,
        priority: 10,
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'edad', label: 'Edad', type: 'number', operator: '>=', value: 18 },
            { field: 'gestante', label: 'Gestante', type: 'boolean', operator: '=', value: true },
            { field: 'laboratorio.hemoglobina', label: 'Hb', type: 'number', operator: '<', value: 11 },
          ],
        },
      },
    ];

    const patient = {
      edad: 20,
      sexo: 'F',
      gestante: true,
      laboratorio: { hemoglobina: 10.2 },
    };

    const matched = evaluateRules(rules, patient);
    expect(matched.map((rule) => rule.id)).toEqual(['alta-prioridad', 'baja-prioridad']);
  });

  it('filtra por nivel resolutivo, evalúa altitud y retorna CompositeResult', () => {
    const rules = [
      {
        id: 'solo-I3-altitud',
        pathologyId: 'anemia',
        priority: 5,
        levelRestriction: ['I-3', 'I-4'],
        altitudeMaxMsnm: 500,
        conditions: {
          operator: 'AND',
          conditions: [{ field: 'edad', label: 'Edad', type: 'number', operator: '>', value: 5 }],
        },
        result: {
          classification: 'Anemia moderada',
          severity: 'Moderada',
          morphology: 'Microcítica hipocrómica',
          medullaryResponse: 'Arregenerativa',
        },
        compositeResult: {
          primaryClassification: 'Anemia moderada',
          secondaryClassification: 'Microcítica hipocrómica',
          tertiaryClassification: 'Arregenerativa',
        },
        managementPlan: { id: 'MP-1', name: 'Plan hierro', description: 'Control y suplementación' },
        specificMedications: ['Sulfato ferroso', 'Ácido fólico'],
        requiredMedications: ['Sulfato ferroso'],
        treatment: { firstLine: 'Sulfato ferroso', doseFormula: '3 mg * peso' },
      },
    ];

    const patient = {
      edad: 20,
      peso: 50,
      sexo: 'F',
      gestante: false,
      altitud: 650,
      nivelResolutivo: 'I-2',
      medicamentosDisponibles: ['Sulfato ferroso'],
      establishmentId: 'EST-TEST',
      nationalMedications: [
        {
          id: 'PNM-SF',
          genericName: 'Sulfato ferroso',
          concentration: '125 mg/5 mL',
          pharmaceuticalForm: 'jarabe',
          route: 'VO',
          presentation: 'frasco x 120 mL',
          active: true,
          allowedLevels: ['I-1', 'I-2', 'I-3', 'I-4'],
        },
        {
          id: 'PNM-AF',
          genericName: 'Ácido fólico',
          concentration: '5 mg',
          pharmaceuticalForm: 'tableta',
          route: 'VO',
          presentation: 'blíster x 10',
          active: true,
          allowedLevels: ['I-1', 'I-2', 'I-3', 'I-4'],
        },
      ],
      establishmentInventory: [
        {
          id: 'INV-1',
          establishmentId: 'EST-TEST',
          nationalMedicationId: 'PNM-SF',
          stock: 10,
          isAvailable: true,
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'INV-2',
          establishmentId: 'EST-TEST',
          nationalMedicationId: 'PNM-AF',
          stock: 0,
          isAvailable: false,
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
      ],
    };

    const noneByLevel = runRuleEngine({ rules, patientData: patient });
    expect(noneByLevel).toHaveLength(0);

    const noneByAltitude = runRuleEngine({
      rules,
      patientData: { ...patient, nivelResolutivo: 'I-3' },
      altitudeConfig: { maxMsnm: 500 },
    });
    expect(noneByAltitude).toHaveLength(0);

    const resolved = runRuleEngine({
      rules,
      patientData: { ...patient, nivelResolutivo: 'I-3', altitud: 400 },
      altitudeConfig: { maxMsnm: 500 },
    });

    expect(resolved[0].classification).toBe('Anemia moderada');
    expect(resolved[0].severity).toBe('Moderada');
    expect(resolved[0].morphology).toBe('Microcítica hipocrómica');
    expect(resolved[0].medullaryResponse).toBe('Arregenerativa');
    expect(resolved[0].compositeResult.secondaryClassification).toBe('Microcítica hipocrómica');
    expect(resolved[0].planRecommended).toBe('Control y suplementación');
    expect(resolved[0].medicationAvailable).toEqual(['Sulfato ferroso']);
    expect(resolved[0].therapeuticMedications.recommended.map((item) => item.genericName)).toEqual([
      'Sulfato ferroso',
      'Ácido fólico',
    ]);
    expect(resolved[0].therapeuticMedications.available.map((item) => item.genericName)).toEqual(['Sulfato ferroso']);
    expect(resolved[0].therapeuticMedications.unavailable.map((item) => item.genericName)).toEqual(['Ácido fólico']);
  });

  it('soporta síntomas, signos, laboratorio y select parasitológico con combinaciones AND/OR complejas', () => {
    const rules = [
      {
        id: 'anemia-severa-giardia',
        priority: 100,
        conditions: {
          operator: 'AND',
          conditions: [
            {
              operator: 'OR',
              conditions: [
                { field: 'sintomas', label: 'Síntomas', type: 'select', operator: 'includes', value: 'fatiga' },
                {
                  field: 'signos',
                  label: 'Signos físicos',
                  type: 'select',
                  operator: 'includes',
                  value: 'palidez intensa',
                },
              ],
            },
            { field: 'laboratorio.hemoglobina', label: 'Hemoglobina', type: 'number', operator: '<', value: 7 },
            {
              field: 'laboratorio.coproparasitoscopico',
              label: 'Coproparasitoscópico',
              type: 'select',
              operator: '=',
              value: 'quistes giardia',
            },
          ],
        },
        result: { classification: 'Anemia severa asociada a parasitosis', severity: 'severa' },
      },
      {
        id: 'anemia-moderada',
        priority: 50,
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'laboratorio.hemoglobina', label: 'Hemoglobina', type: 'number', operator: '<', value: 10 },
            { field: 'laboratorio.hemoglobina', label: 'Hemoglobina', type: 'number', operator: '>=', value: 7 },
          ],
        },
        result: { classification: 'Anemia moderada', severity: 'moderada' },
      },
      {
        id: 'anemia-leve',
        priority: 10,
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'laboratorio.hemoglobina', label: 'Hemoglobina', type: 'number', operator: '<', value: 12 },
            { field: 'laboratorio.hemoglobina', label: 'Hemoglobina', type: 'number', operator: '>=', value: 10 },
          ],
        },
        result: { classification: 'Anemia leve', severity: 'leve' },
      },
    ];

    const patient = {
      sintomas: ['fatiga', 'mareo'],
      signos: ['palidez cutánea'],
      laboratorio: {
        hemoglobina: 6.8,
        coproparasitoscopico: 'quistes giardia',
      },
      nivelResolutivo: 'I-3',
      altitud: 200,
      medicamentosDisponibles: ['Sulfato ferroso'],
      establishmentId: 'EST-TEST',
      nationalMedications: [
        {
          id: 'PNM-SF',
          genericName: 'Sulfato ferroso',
          concentration: '125 mg/5 mL',
          pharmaceuticalForm: 'jarabe',
          route: 'VO',
          presentation: 'frasco x 120 mL',
          active: true,
          allowedLevels: ['I-1', 'I-2', 'I-3', 'I-4'],
        },
        {
          id: 'PNM-AF',
          genericName: 'Ácido fólico',
          concentration: '5 mg',
          pharmaceuticalForm: 'tableta',
          route: 'VO',
          presentation: 'blíster x 10',
          active: true,
          allowedLevels: ['I-1', 'I-2', 'I-3', 'I-4'],
        },
      ],
      establishmentInventory: [
        {
          id: 'INV-1',
          establishmentId: 'EST-TEST',
          nationalMedicationId: 'PNM-SF',
          stock: 10,
          isAvailable: true,
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'INV-2',
          establishmentId: 'EST-TEST',
          nationalMedicationId: 'PNM-AF',
          stock: 0,
          isAvailable: false,
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
      ],
    };

    const matchedRules = evaluateRules(rules, patient);
    expect(matchedRules.map((rule) => rule.id)).toEqual(['anemia-severa-giardia']);

    const engineResult = runRuleEngine({ rules, patientData: patient, altitudeConfig: { maxMsnm: 500 } });
    expect(engineResult).toHaveLength(1);
    expect(engineResult[0].classification).toBe('Anemia severa asociada a parasitosis');
    expect(engineResult[0].severity).toBe('severa');
  });


  it('retorna alerta cuando ningún medicamento sugerido está disponible en establecimiento', () => {
    const rules = [
      {
        id: 'regla-alerta-disponibilidad',
        priority: 1,
        conditions: {
          operator: 'AND',
          conditions: [{ field: 'edad', label: 'Edad', type: 'number', operator: '>', value: 1 }],
        },
        specificMedications: ['Albendazol'],
        result: { classification: 'Parasitosis probable', severity: 'leve' },
      },
    ];

    const patient = {
      edad: 10,
      establishmentId: 'EST-ALERTA',
      nivelResolutivo: 'I-2',
      medicamentosDisponibles: [],
      nationalMedications: [
        {
          id: 'PNM-ALB',
          genericName: 'Albendazol',
          concentration: '400 mg',
          pharmaceuticalForm: 'tableta',
          route: 'VO',
          presentation: 'blíster x 1',
          active: true,
          allowedLevels: ['I-1', 'I-2', 'I-3', 'I-4'],
        },
      ],
      establishmentInventory: [
        {
          id: 'INV-ALB',
          establishmentId: 'EST-ALERTA',
          nationalMedicationId: 'PNM-ALB',
          stock: 0,
          isAvailable: false,
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
      ],
    };

    const resolved = runRuleEngine({ rules, patientData: patient });
    expect(resolved).toHaveLength(1);
    expect(resolved[0].therapeuticMedications.available).toEqual([]);
    expect(resolved[0].alerts).toContain('No disponible en establecimiento');
  });


  it('no sugiere medicamentos no permitidos para el nivel resolutivo activo', () => {
    const rules = [
      {
        id: 'regla-nivel-medicamento',
        priority: 1,
        conditions: {
          operator: 'AND',
          conditions: [{ field: 'edad', label: 'Edad', type: 'number', operator: '>', value: 1 }],
        },
        specificMedications: ['Albendazol', 'Sulfato ferroso'],
        result: { classification: 'Manejo antiparasitario', severity: 'leve' },
      },
    ];

    const patient = {
      edad: 12,
      establishmentId: 'EST-LVL',
      nivelResolutivo: 'I-1',
      medicamentosDisponibles: ['Albendazol', 'Sulfato ferroso'],
      nationalMedications: [
        {
          id: 'PNM-ALB',
          genericName: 'Albendazol',
          concentration: '400 mg',
          pharmaceuticalForm: 'tableta',
          route: 'VO',
          presentation: 'blíster x 1',
          active: true,
          allowedLevels: ['I-3', 'I-4'],
        },
        {
          id: 'PNM-SF',
          genericName: 'Sulfato ferroso',
          concentration: '125 mg/5 mL',
          pharmaceuticalForm: 'jarabe',
          route: 'VO',
          presentation: 'frasco x 120 mL',
          active: true,
          allowedLevels: ['I-1', 'I-2', 'I-3', 'I-4'],
        },
      ],
      establishmentInventory: [
        {
          id: 'INV-ALB',
          establishmentId: 'EST-LVL',
          nationalMedicationId: 'PNM-ALB',
          stock: 20,
          isAvailable: true,
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'INV-SF',
          establishmentId: 'EST-LVL',
          nationalMedicationId: 'PNM-SF',
          stock: 20,
          isAvailable: true,
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
      ],
    };

    const resolved = runRuleEngine({ rules, patientData: patient });
    expect(resolved).toHaveLength(1);
    expect(resolved[0].therapeuticMedications.recommended.map((item) => item.genericName)).toEqual(['Sulfato ferroso']);
    expect(resolved[0].therapeuticMedications.available.map((item) => item.genericName)).toEqual(['Sulfato ferroso']);
    expect(resolved[0].therapeuticMedications.unavailable).toEqual([]);
  });

  it('calcula dosis por peso con límite máximo', () => {
    const dosage = calculateDosage(
      { mgPorKg: 10, frecuencia: 'cada 8 horas', dosisMaxima: 1000 },
      { peso: 150, edad: 40 },
    );

    expect(dosage.dosisFinal).toBe(1000);
    expect(dosage.frecuencia).toBe('cada 8 horas');
    expect(dosage.advertenciaSiAplica).toContain('Dosis ajustada al máximo permitido');
  });
});

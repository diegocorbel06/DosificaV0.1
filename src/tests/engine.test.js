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

  it('evalúa ConditionGroup recursivo y ordena por prioridad', () => {
    const rules = [
      {
        id: 'baja-prioridad',
        active: true,
        priority: 1,
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'edad', label: 'Edad', type: 'number', operator: '>', value: 12 },
          ],
        },
      },
      {
        id: 'alta-prioridad',
        active: true,
        priority: 10,
        conditions: {
          operator: 'OR',
          conditions: [
            {
              operator: 'AND',
              conditions: [
                { field: 'edad', label: 'Edad', type: 'number', operator: '>=', value: 18 },
                { field: 'laboratorio.hemoglobina', label: 'Hb', type: 'number', operator: '<', value: 11 },
              ],
            },
            { field: 'signos', label: 'Signos', type: 'select', operator: 'includes', value: 'palidez' },
          ],
        },
      },
    ];

    const patient = {
      edad: 20,
      signos: ['palidez'],
      laboratorio: { hemoglobina: 10.2 },
    };

    const matched = evaluateRules(rules, patient);
    expect(matched.map((rule) => rule.id)).toEqual(['alta-prioridad', 'baja-prioridad']);
  });

  it('filtra por nivel resolutivo y retorna plan/medicación disponible', () => {
    const rules = [
      {
        id: 'solo-I3',
        pathologyId: 'anemia',
        priority: 5,
        levelRestriction: ['I-3', 'I-4'],
        conditions: {
          operator: 'AND',
          conditions: [{ field: 'edad', label: 'Edad', type: 'number', operator: '>', value: 5 }],
        },
        result: { classification: 'Anemia moderada', severity: 'Moderada' },
        managementPlan: { id: 'MP-1', name: 'Plan hierro', description: 'Control y suplementación' },
        specificMedications: ['Sulfato ferroso', 'Ácido fólico'],
        treatment: { firstLine: 'Sulfato ferroso', doseFormula: '3 mg * peso' },
      },
    ];

    const patient = {
      edad: 20,
      peso: 50,
      nivelResolutivo: 'I-2',
      medicamentosDisponibles: ['Sulfato ferroso'],
    };

    const none = runRuleEngine({ rules, patientData: patient });
    expect(none).toHaveLength(0);

    const resolved = runRuleEngine({
      rules,
      patientData: { ...patient, nivelResolutivo: 'I-3' },
    });

    expect(resolved[0].classification).toBe('Anemia moderada');
    expect(resolved[0].planRecommended).toBe('Control y suplementación');
    expect(resolved[0].medicationAvailable).toEqual(['Sulfato ferroso']);
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

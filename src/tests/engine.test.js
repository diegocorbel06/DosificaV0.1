import { describe, expect, it } from 'vitest';
import { evaluateRule } from '../engine/ruleEvaluator.js';
import { calculateDosage } from '../engine/dosageCalculator.js';

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

import { getValueByPath, normalizeText } from '../utils/helpers.js';

/**
 * Operadores permitidos por el motor. Son exactamente los solicitados.
 */
const OPERATORS = {
  equals: (actual, expected) => {
    if (typeof actual === 'string' || typeof expected === 'string') {
      return normalizeText(actual) === normalizeText(expected);
    }
    return actual === expected;
  },

  greaterThan: (actual, expected) => Number(actual) > Number(expected),

  lessThan: (actual, expected) => Number(actual) < Number(expected),

  includes: (actual, expected) => {
    if (Array.isArray(actual)) {
      return actual.map(normalizeText).includes(normalizeText(expected));
    }

    if (typeof actual === 'string') {
      return normalizeText(actual).includes(normalizeText(expected));
    }

    return false;
  },

  notIncludes: (actual, expected) => {
    if (Array.isArray(actual)) {
      return !actual.map(normalizeText).includes(normalizeText(expected));
    }

    if (typeof actual === 'string') {
      return !normalizeText(actual).includes(normalizeText(expected));
    }

    return true;
  },
};

/**
 * Evalúa una condición clínica individual sobre datos del paciente.
 *
 * @param {{field: string, operator: keyof typeof OPERATORS, value: *}} condition
 * @param {object} patientData
 * @returns {boolean}
 */
export const evaluateCondition = (condition, patientData) => {
  const comparator = OPERATORS[condition.operator];

  if (!comparator) {
    throw new Error(`Operador no soportado: ${condition.operator}`);
  }

  const actualValue = getValueByPath(patientData, condition.field);
  return comparator(actualValue, condition.value);
};

/**
 * Evalúa una regla completa: todas las condiciones deben cumplirse (AND).
 *
 * @param {object} rule
 * @param {object} patientData
 * @returns {boolean}
 */
export const evaluateRule = (rule, patientData) => {
  if (!rule?.conditions?.length) return false;
  return rule.conditions.every((condition) => evaluateCondition(condition, patientData));
};

export { OPERATORS };

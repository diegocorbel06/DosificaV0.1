import { evaluateRules } from './ruleEvaluator.js';
import { calculateDosage } from './dosageCalculator.js';
import { isResourceAvailable, normalizeText } from '../utils/helpers.js';

/**
 * Jerarquía resolutiva explícita:
 * I-4 > I-3 > I-2 > I-1
 */
const CARE_LEVEL_RANK = {
  'I-1': 1,
  'I-2': 2,
  'I-3': 3,
  'I-4': 4,
};

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

/**
 * Soporta levelRequired legacy y levelRestriction (nuevo RuleDefinition).
 */
const getRequiredLevels = (rule) => {
  const levelField = rule.levelRestriction ?? rule.levelRequired ?? rule.requiredCareLevel;
  return toArray(levelField);
};

const getPathology = (rule) => rule.pathology || rule.pathologyId || 'general';

const getDiagnosis = (rule) => rule.diagnosis || rule.result?.classification || rule.name || 'Sin clasificación';

const getSeverity = (rule) => rule.severity || rule.result?.severity || '';

const getTreatmentConfig = (rule) => {
  if (rule.treatment) return rule.treatment;

  if (rule.managementPlan) return rule.managementPlan;

  if (rule.managementPlanId) {
    return {
      firstLine: rule.managementPlanId,
      alternative: '',
      doseFormula: '',
      indications: [],
    };
  }

  return {};
};

/**
 * Compara automáticamente nivel del establecimiento contra niveles permitidos.
 * Si la regla no define nivel, se asume aplicable.
 */
const meetsAnyRequiredLevel = (requiredLevels, facilityLevel) => {
  if (!requiredLevels.length) return true;

  const facilityRank = CARE_LEVEL_RANK[facilityLevel] || 0;
  return requiredLevels.some((level) => facilityRank >= (CARE_LEVEL_RANK[level] || 0));
};

const hasRequiredResources = (requiredMedications = [], availableMedications = []) => {
  const required = toArray(requiredMedications).map(normalizeText);
  const available = toArray(availableMedications).map(normalizeText);
  return required.every((item) => available.includes(item));
};

const resolveTreatmentByAvailability = (treatment = {}, medicationsAvailable = []) => {
  const firstLineAvailable = isResourceAvailable(medicationsAvailable, treatment.firstLine);

  if (firstLineAvailable) {
    return { selected: treatment.firstLine, fallbackUsed: false, unavailable: false };
  }

  if (treatment.alternative && isResourceAvailable(medicationsAvailable, treatment.alternative)) {
    return { selected: treatment.alternative, fallbackUsed: true, unavailable: false };
  }

  return {
    selected: treatment.firstLine || null,
    fallbackUsed: false,
    unavailable: Boolean(treatment.firstLine),
  };
};

/**
 * Si la regla exige hospitalización y el establecimiento es I-1,
 * no se debe aplicar tratamiento definitivo.
 */
const shouldReferByHospitalizationConstraint = (rule, facilityLevel) => {
  const requiresHospitalization = Boolean(rule.requiresHospitalization);
  const isI1 = facilityLevel === 'I-1';
  return requiresHospitalization && isI1;
};

const buildReferralReason = ({ levelOk, medsOk, hospitalizationConstraint, requiredLevels }) => {
  if (hospitalizationConstraint) {
    return 'Nivel resolutivo insuficiente';
  }

  if (!levelOk) {
    return `Nivel resolutivo insuficiente. Requiere al menos: ${requiredLevels.join(', ')}`;
  }

  if (!medsOk) {
    return 'No cuenta con medicamentos requeridos para manejo definitivo';
  }

  return '';
};

const buildAlerts = ({ levelOk, medsOk, hospitalizationConstraint, requiredLevels }) => {
  const alerts = [];

  if (hospitalizationConstraint) {
    alerts.push('Regla requiere hospitalización y establecimiento I-1 no puede resolver definitivamente.');
  }

  if (!levelOk) {
    alerts.push(`Nivel insuficiente para esta regla. Requerido: ${requiredLevels.join(', ')}`);
  }

  if (!medsOk) {
    alerts.push('No cumple medicamentos requeridos de la regla.');
  }

  return alerts;
};

/**
 * @param {{
 *  rules: object[],
 *  patientData: object,
 *  unmetPolicy?: 'exclude'|'reference'
 * }} params
 */
export const runRuleEngine = ({ rules = [], patientData, unmetPolicy = 'reference' }) => {
  return evaluateRules(rules, patientData)
    .map((rule) => {
      const requiredLevels = getRequiredLevels(rule);
      const levelOk = meetsAnyRequiredLevel(requiredLevels, patientData.nivelResolutivo);
      const medsOk = hasRequiredResources(rule.requiredMedications, patientData.medicamentosDisponibles || []);

      const hospitalizationConstraint = shouldReferByHospitalizationConstraint(
        rule,
        patientData.nivelResolutivo,
      );

      const managementConstraintOk = !hospitalizationConstraint;
      const constraintsMet = levelOk && medsOk && managementConstraintOk;

      if (!constraintsMet && unmetPolicy === 'exclude') {
        return null;
      }

      const requiresReferral = !constraintsMet;
      const referralReason = requiresReferral
        ? buildReferralReason({ levelOk, medsOk, hospitalizationConstraint, requiredLevels })
        : '';

      const alerts = buildAlerts({ levelOk, medsOk, hospitalizationConstraint, requiredLevels });

      const definitiveTreatmentAllowed = !hospitalizationConstraint;
      const treatment = getTreatmentConfig(rule);
      const resolvedTreatment = definitiveTreatmentAllowed
        ? resolveTreatmentByAvailability(treatment, patientData.medicamentosDisponibles)
        : { selected: null, fallbackUsed: false, unavailable: false };

      return {
        id: rule.id,
        pathology: getPathology(rule),
        diagnosis: getDiagnosis(rule),
        severity: getSeverity(rule),
        priority: Number(rule.priority || 0),
        requiresReferral,
        referralReason,
        isReferral: requiresReferral,
        alerts,
        treatmentPlan: {
          firstLine: treatment?.firstLine,
          alternative: treatment?.alternative,
          definitiveTreatmentAllowed,
          selectedTreatment: resolvedTreatment.selected,
          usedAlternative: resolvedTreatment.fallbackUsed,
          unavailableMedication: resolvedTreatment.unavailable,
          requiredResourcesAvailable: medsOk,
          dosage: definitiveTreatmentAllowed
            ? calculateDosage(treatment?.dose || treatment?.doseFormula, patientData)
            : {
                dosisFinal: null,
                frecuencia: '',
                advertenciaSiAplica: 'Tratamiento definitivo no permitido en este nivel resolutivo.',
                unit: '',
                description: 'Derivar a mayor nivel para manejo definitivo.',
                value: null,
              },
          indications: treatment?.indications || [],
          outpatientAllowed: rule.outpatientAllowed !== false,
          requiresHospitalization: Boolean(rule.requiresHospitalization),
        },
        referralCriteria: rule.referralCriteria,
      };
    })
    .filter(Boolean);
};

import { evaluateRules } from './ruleEvaluator.js';
import { calculateDosage } from './dosageCalculator.js';
import { isResourceAvailable, normalizeText } from '../utils/helpers.js';

const CARE_LEVEL_RANK = {
  'I-1': 1,
  'I-2': 2,
  'I-3': 3,
  'I-4': 4,
};

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const getRequiredLevels = (rule) => {
  const levelField = rule.levelRestriction ?? rule.levelRequired ?? rule.requiredCareLevel;
  return toArray(levelField);
};

const meetsAnyRequiredLevel = (requiredLevels, facilityLevel) => {
  if (!requiredLevels.length) return true;
  const facilityRank = CARE_LEVEL_RANK[facilityLevel] || 0;
  return requiredLevels.some((level) => facilityRank >= (CARE_LEVEL_RANK[level] || 0));
};

const getDiagnosis = (rule) => rule.diagnosis || rule.result?.classification || rule.name || 'Sin clasificación';
const getSeverity = (rule) => rule.severity || rule.result?.severity || '';
const getPathology = (rule) => rule.pathology || rule.pathologyId || 'general';

const getManagementPlan = (rule) => {
  if (rule.managementPlan && typeof rule.managementPlan === 'object') {
    return {
      id: rule.managementPlan.id || rule.managementPlanId || '',
      name: rule.managementPlan.name || rule.managementPlanId || '',
      description: rule.managementPlan.description || '',
    };
  }

  return {
    id: rule.managementPlanId || '',
    name: rule.managementPlanId || '',
    description: rule.managementDescription || '',
  };
};

const getRuleSpecificMedications = (rule) => {
  const direct = toArray(rule.specificMedications);
  if (direct.length) return direct;

  const required = toArray(rule.requiredMedications);
  if (required.length) return required;

  const fromTreatment = [rule.treatment?.firstLine, rule.treatment?.alternative].filter(Boolean);
  return fromTreatment;
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

const shouldReferByHospitalizationConstraint = (rule, facilityLevel) => {
  const requiresHospitalization = Boolean(rule.requiresHospitalization);
  return requiresHospitalization && facilityLevel === 'I-1';
};

const getTreatmentConfig = (rule) => {
  if (rule.treatment) return rule.treatment;

  if (rule.managementPlan?.treatment) return rule.managementPlan.treatment;

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
 * Ejecuta reglas dinámicas y retorna recomendaciones clínicas integradas con inventario.
 */
export const runRuleEngine = ({ rules = [], patientData, unmetPolicy = 'reference' }) => {
  const matchedRules = evaluateRules(rules, patientData);

  // Requisito: filtrar por nivel resolutivo del establecimiento activo.
  const levelFilteredRules = matchedRules.filter((rule) =>
    meetsAnyRequiredLevel(getRequiredLevels(rule), patientData.nivelResolutivo),
  );

  return levelFilteredRules
    .map((rule) => {
      const specificMedications = getRuleSpecificMedications(rule);
      const strictRequiredMedications = toArray(rule.requiredMedications);
      const medsOk = strictRequiredMedications.length
        ? hasRequiredResources(strictRequiredMedications, patientData.medicamentosDisponibles || [])
        : true;
      const hospitalizationConstraint = shouldReferByHospitalizationConstraint(rule, patientData.nivelResolutivo);

      if ((hospitalizationConstraint || !medsOk) && unmetPolicy === 'exclude') {
        return null;
      }

      const availableCatalog = toArray(patientData.medicamentosDisponibles || []);
      const medicationAvailable = specificMedications.filter((medication) =>
        availableCatalog.map(normalizeText).includes(normalizeText(medication)),
      );

      const managementPlan = getManagementPlan(rule);
      const treatment = getTreatmentConfig(rule);
      const definitiveTreatmentAllowed = !hospitalizationConstraint;
      const resolvedTreatment = definitiveTreatmentAllowed
        ? resolveTreatmentByAvailability(treatment, availableCatalog)
        : { selected: null, fallbackUsed: false, unavailable: false };

      const classification = getDiagnosis(rule);
      const severity = getSeverity(rule);
      const planRecommended = managementPlan.description || managementPlan.name || treatment.firstLine || '';

      return {
        id: rule.id,
        pathology: getPathology(rule),
        classification,
        diagnosis: classification,
        severity,
        priority: Number(rule.priority || 0),
        planRecommended,
        managementPlan,
        specificMedications,
        medicationAvailable,
        requiresReferral: hospitalizationConstraint || !medsOk,
        referralReason: hospitalizationConstraint
          ? 'Nivel resolutivo insuficiente para hospitalización.'
          : !medsOk
            ? 'Medicamentos específicos no disponibles en inventario activo.'
            : '',
        isReferral: hospitalizationConstraint || !medsOk,
        alerts: [
          hospitalizationConstraint ? 'Requiere hospitalización y establecimiento actual no puede resolver.' : null,
          !medsOk ? 'No se cumplen medicamentos requeridos para el plan.' : null,
        ].filter(Boolean),
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

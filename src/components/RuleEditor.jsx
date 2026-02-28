import React, { useEffect, useMemo, useState } from 'react';
import ConditionBuilder from './ConditionBuilder.jsx';
import RuleList from './RuleList.jsx';
import AutoCompleteInput from './AutoCompleteInput.jsx';
import Card from './Card.jsx';
import { useClinicalStore } from '../store/clinicalStore.jsx';

const PATHOLOGY_OPTIONS = ['deshidratacion', 'anemia', 'parasitosis'];
const MEDICATION_SUGGESTIONS = ['SRO', 'ClNa 0.9%', 'Sulfato ferroso', 'Hierro polimaltosado', 'Albendazol'];


const OPERATOR_MIGRATION = {
  greaterThan: '>',
  lessThan: '<',
  equals: '=',
};

const buildEmptyCondition = () => ({
  field: 'edad',
  label: 'Edad',
  type: 'number',
  operator: '>',
  value: '',
});

const createEmptyRule = () => ({
  id: '',
  pathologyId: 'deshidratacion',
  pathology: 'deshidratacion',
  name: '',
  description: '',
  priority: 0,
  conditions: {
    operator: 'AND',
    conditions: [buildEmptyCondition()],
  },
  result: {
    classification: '',
    severity: '',
    tags: [],
  },
  managementPlanId: '',
  levelRestriction: ['I-1'],
  diagnosis: '',
  severity: '',
  treatment: {
    firstLine: '',
    alternative: '',
    doseFormula: '',
    indications: [],
  },
  requiredMedications: [],
  referralCriteria: '',
});

const parseCommaSeparated = (text) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeRuleForEditor = (rule) => {
  const base = createEmptyRule();
  const next = { ...base, ...rule };

  const legacyPathology = rule.pathology || rule.pathologyId || base.pathologyId;
  next.pathologyId = legacyPathology;
  next.pathology = legacyPathology;

  if (!rule.result) {
    next.result = {
      classification: rule.diagnosis || rule.name || '',
      severity: rule.severity || '',
      tags: [],
    };
  }

  if (!rule.conditions || Array.isArray(rule.conditions)) {
    const legacyConditions = Array.isArray(rule.conditions) ? rule.conditions : [buildEmptyCondition()];
    next.conditions = {
      operator: 'AND',
      conditions: legacyConditions.map((condition) => ({
        field: condition.field,
        label: condition.label || condition.field,
        type: condition.type || 'number',
        operator: OPERATOR_MIGRATION[condition.operator] || condition.operator || '>',
        value: condition.value ?? '',
        unit: condition.unit,
      })),
    };
  }

  if (!Array.isArray(next.levelRestriction) || !next.levelRestriction.length) {
    const legacyLevel = rule.levelRequired;
    next.levelRestriction = Array.isArray(legacyLevel)
      ? legacyLevel
      : legacyLevel
        ? [legacyLevel]
        : ['I-1'];
  }

  return next;
};

const normalizeRuleForSave = (rule) => {
  const pathologyValue = rule.pathologyId || rule.pathology || 'general';
  const classification = rule.result?.classification || rule.diagnosis || rule.name;
  const severity = rule.result?.severity || rule.severity || '';

  return {
    ...rule,
    pathologyId: pathologyValue,
    pathology: pathologyValue,
    name: rule.name || classification,
    priority: Number(rule.priority || 0),
    conditions: rule.conditions,
    result: {
      classification,
      severity,
      tags: Array.isArray(rule.result?.tags) ? rule.result.tags : [],
    },
    diagnosis: classification,
    severity,
    levelRestriction: Array.isArray(rule.levelRestriction) ? rule.levelRestriction : [],
    levelRequired: Array.isArray(rule.levelRestriction) ? rule.levelRestriction : [],
  };
};

/**
 * Editor visual conectado a store global con soporte de RuleDefinition dinámico.
 */
const RuleEditor = ({ filterText = '' }) => {
  const { rules, addRule, updateRule, removeRule, replaceRules } = useClinicalStore();

  const [formRule, setFormRule] = useState(createEmptyRule());
  const [editingIndex, setEditingIndex] = useState(null);
  const [jsonImportText, setJsonImportText] = useState('');
  const [formError, setFormError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const generatedJson = useMemo(() => JSON.stringify(rules, null, 2), [rules]);

  const filteredRules = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    if (!query) return rules;
    return rules.filter((rule) =>
      [rule.id, rule.pathologyId || rule.pathology, rule.name, rule.result?.classification || rule.diagnosis]
        .some((field) => String(field || '').toLowerCase().includes(query)),
    );
  }, [rules, filterText]);

  useEffect(() => {
    if (saveStatus !== 'saved') return undefined;
    const timer = setTimeout(() => setSaveStatus('idle'), 2200);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const setSavedState = () => {
    setSaveStatus('saved');
    setLastSavedAt(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const updateRuleField = (field, value) => {
    setSaveStatus('draft');
    setFormRule((prev) => ({ ...prev, [field]: value }));
  };

  const updateResultField = (field, value) => {
    setSaveStatus('draft');
    setFormRule((prev) => ({
      ...prev,
      result: {
        ...prev.result,
        [field]: value,
      },
    }));
  };

  const updateTreatmentField = (field, value) => {
    setSaveStatus('draft');
    setFormRule((prev) => ({
      ...prev,
      treatment: {
        ...prev.treatment,
        [field]: value,
      },
    }));
  };

  const validateRule = (rule) => {
    if (!rule.id.trim()) return 'El ID de la regla es obligatorio.';
    if (!(rule.pathologyId || rule.pathology).trim()) return 'La patología es obligatoria.';
    if (!(rule.result?.classification || '').trim()) return 'La clasificación de resultado es obligatoria.';

    const baseGroup = rule.conditions;
    if (!baseGroup?.conditions?.length) return 'Debe definir al menos una condición.';

    const invalidCondition = baseGroup.conditions.some(
      (condition) => !condition.field || !condition.operator || condition.value === '',
    );

    if (invalidCondition) return 'Todas las condiciones deben tener campo, operador y valor.';
    return '';
  };

  const handleSaveRule = () => {
    const error = validateRule(formRule);
    if (error) {
      setFormError(error);
      return;
    }

    setFormError('');
    const normalized = normalizeRuleForSave(formRule);

    if (editingIndex !== null) {
      updateRule(editingIndex, normalized);
      setEditingIndex(null);
    } else {
      addRule(normalized);
    }

    setFormRule(createEmptyRule());
    setSavedState();
  };

  const handleEditRule = (index) => {
    setFormRule(normalizeRuleForEditor(rules[index]));
    setEditingIndex(index);
    setFormError('');
    setSaveStatus('draft');
  };

  const handleDeleteRule = (index) => {
    removeRule(index);
    if (editingIndex === index) {
      setFormRule(createEmptyRule());
      setEditingIndex(null);
    }
    setSavedState();
  };

  const handleExportJson = () => {
    const blob = new Blob([generatedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'clinical-rules.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonImportText);
      if (!Array.isArray(parsed)) {
        setFormError('El JSON importado debe ser un array de reglas.');
        return;
      }
      replaceRules(parsed.map(normalizeRuleForSave));
      setFormError('');
      setSavedState();
    } catch {
      setFormError('JSON inválido. Verifica formato y vuelve a intentar.');
    }
  };

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      {formError && <div style={{ border: '1px solid #e39', background: '#fff0f5', color: '#701', padding: 10, borderRadius: 8 }}>{formError}</div>}

      <div style={{ border: '1px solid #dbe2ef', background: saveStatus === 'saved' ? '#ecfdf3' : '#f8fafc', color: '#334155', borderRadius: 8, padding: 8, fontSize: 12 }}>
        {saveStatus === 'saved' && '✓ Cambios guardados correctamente.'}
        {saveStatus === 'draft' && '⏺ Cambios en borrador. Guardado automático pendiente de confirmación.'}
        {saveStatus === 'idle' && 'Editor listo para nuevos cambios.'}
        {lastSavedAt && <span style={{ marginLeft: 8 }}>Último guardado: {lastSavedAt}</span>}
      </div>

      <Card title={editingIndex !== null ? 'Editar RuleDefinition' : 'Nueva RuleDefinition'}>
        <section style={{ display: 'grid', gap: 10 }}>
          <label>ID de regla<input type="text" value={formRule.id} onChange={(e) => updateRuleField('id', e.target.value)} /></label>

          <label>Patología
            <AutoCompleteInput listId="pathology-options" suggestions={PATHOLOGY_OPTIONS} value={formRule.pathologyId} onChange={(value) => updateRuleField('pathologyId', value)} />
          </label>

          <label>Nombre de regla<input type="text" value={formRule.name} onChange={(e) => updateRuleField('name', e.target.value)} /></label>
          <label>Descripción<textarea value={formRule.description} onChange={(e) => updateRuleField('description', e.target.value)} rows={2} /></label>
          <label>Prioridad<input type="number" value={formRule.priority} onChange={(e) => updateRuleField('priority', e.target.value)} /></label>

          <ConditionBuilder
            conditions={formRule.conditions.conditions}
            onChange={(conditions) => updateRuleField('conditions', { ...formRule.conditions, conditions })}
            groupOperator={formRule.conditions.operator}
            onGroupOperatorChange={(operator) => updateRuleField('conditions', { ...formRule.conditions, operator })}
          />

          <h4 style={{ marginBottom: 0 }}>Resultado clasificatorio</h4>
          <label>Clasificación<input type="text" value={formRule.result.classification} onChange={(e) => updateResultField('classification', e.target.value)} /></label>
          <label>Severidad<input type="text" value={formRule.result.severity} onChange={(e) => updateResultField('severity', e.target.value)} /></label>
          <label>Tags (coma separados)<input type="text" value={(formRule.result.tags || []).join(', ')} onChange={(e) => updateResultField('tags', parseCommaSeparated(e.target.value))} /></label>

          <h4 style={{ marginBottom: 0 }}>Plan terapéutico asociado</h4>
          <label>managementPlanId<input type="text" value={formRule.managementPlanId} onChange={(e) => updateRuleField('managementPlanId', e.target.value)} /></label>
          <label>Medicamento de elección<AutoCompleteInput listId="med-first-line" suggestions={MEDICATION_SUGGESTIONS} value={formRule.treatment.firstLine} onChange={(value) => updateTreatmentField('firstLine', value)} /></label>
          <label>Alternativa terapéutica<AutoCompleteInput listId="med-alternative" suggestions={MEDICATION_SUGGESTIONS} value={formRule.treatment.alternative} onChange={(value) => updateTreatmentField('alternative', value)} /></label>
          <label>Fórmula de dosis<input type="text" value={formRule.treatment.doseFormula} onChange={(e) => updateTreatmentField('doseFormula', e.target.value)} /></label>
          <label>Indicaciones (coma separadas)<input type="text" value={formRule.treatment.indications.join(', ')} onChange={(e) => updateTreatmentField('indications', parseCommaSeparated(e.target.value))} /></label>

          <label>Restricción de nivel (coma separados, ej: I-2,I-3,I-4)
            <input type="text" value={(formRule.levelRestriction || []).join(', ')} onChange={(e) => updateRuleField('levelRestriction', parseCommaSeparated(e.target.value))} />
          </label>

          <label>Medicamentos necesarios (coma separados)
            <input type="text" value={formRule.requiredMedications.join(', ')} onChange={(e) => updateRuleField('requiredMedications', parseCommaSeparated(e.target.value))} />
          </label>
          <label>Criterios de referencia<textarea value={formRule.referralCriteria} onChange={(e) => updateRuleField('referralCriteria', e.target.value)} rows={2} /></label>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleSaveRule}>{editingIndex !== null ? 'Actualizar regla' : 'Guardar regla'}</button>
            {editingIndex !== null && (
              <button type="button" onClick={() => { setFormRule(createEmptyRule()); setEditingIndex(null); setFormError(''); setSaveStatus('idle'); }}>
                Cancelar edición
              </button>
            )}
          </div>
        </section>
      </Card>

      <Card title="Gestión de reglas (JSON)">
        <section style={{ display: 'grid', gap: 10 }}>
          <textarea value={jsonImportText} onChange={(e) => setJsonImportText(e.target.value)} rows={6} placeholder="Pega aquí un array JSON de reglas para importar" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleImportJson}>Importar JSON</button>
            <button type="button" onClick={handleExportJson}>Exportar JSON</button>
          </div>
          <pre style={{ background: '#f8f8f8', borderRadius: 8, padding: 10, margin: 0, overflowX: 'auto' }}>{generatedJson}</pre>
        </section>
      </Card>

      <RuleList rules={filteredRules} onEdit={handleEditRule} onDelete={handleDeleteRule} />
    </section>
  );
};

export default RuleEditor;

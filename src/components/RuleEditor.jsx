import React, { useMemo, useState } from 'react';
import ConditionBuilder from './ConditionBuilder.jsx';
import RuleList from './RuleList.jsx';
import AutoCompleteInput from './AutoCompleteInput.jsx';
import Card from './Card.jsx';
import { useClinicalStore } from '../store/clinicalStore.jsx';

const PATHOLOGY_OPTIONS = ['deshidratacion', 'anemia', 'parasitosis'];
const MEDICATION_SUGGESTIONS = ['SRO', 'ClNa 0.9%', 'Sulfato ferroso', 'Hierro polimaltosado', 'Albendazol'];

const createEmptyRule = () => ({
  id: '',
  pathology: 'deshidratacion',
  conditions: [
    {
      field: 'edad',
      operator: 'greaterThan',
      value: '',
    },
  ],
  diagnosis: '',
  severity: '',
  treatment: {
    firstLine: '',
    alternative: '',
    doseFormula: '',
    indications: [],
  },
  levelRequired: 'I-1',
  requiredMedications: [],
  referralCriteria: '',
});

const parseCommaSeparated = (text) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Editor visual conectado a store global.
 */
const RuleEditor = ({ filterText = '' }) => {
  const { rules, addRule, updateRule, removeRule, replaceRules } = useClinicalStore();

  const [formRule, setFormRule] = useState(createEmptyRule());
  const [editingIndex, setEditingIndex] = useState(null);
  const [jsonImportText, setJsonImportText] = useState('');
  const [formError, setFormError] = useState('');

  const generatedJson = useMemo(() => JSON.stringify(rules, null, 2), [rules]);

  const filteredRules = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    if (!query) return rules;
    return rules.filter((rule) =>
      [rule.id, rule.pathology, rule.diagnosis, rule.severity].some((field) =>
        String(field || '').toLowerCase().includes(query),
      ),
    );
  }, [rules, filterText]);

  const updateRuleField = (field, value) => {
    setFormRule((prev) => ({ ...prev, [field]: value }));
  };

  const updateTreatmentField = (field, value) => {
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
    if (!rule.pathology.trim()) return 'La patología es obligatoria.';
    if (!rule.diagnosis.trim()) return 'El diagnóstico es obligatorio.';
    if (!rule.severity.trim()) return 'La clasificación de gravedad es obligatoria.';
    if (!rule.treatment.firstLine.trim()) return 'El tratamiento de elección es obligatorio.';
    if (!rule.treatment.doseFormula.trim()) return 'La fórmula de dosis es obligatoria.';
    if (!rule.referralCriteria.trim()) return 'Los criterios de referencia son obligatorios.';

    const invalidCondition = rule.conditions.some(
      (condition) => !condition.field || !condition.operator || condition.value === '',
    );

    if (invalidCondition) {
      return 'Todas las condiciones deben tener campo, operador y valor.';
    }

    return '';
  };

  const handleSaveRule = () => {
    const error = validateRule(formRule);
    if (error) {
      setFormError(error);
      return;
    }

    setFormError('');

    if (editingIndex !== null) {
      updateRule(editingIndex, formRule);
      setEditingIndex(null);
    } else {
      addRule(formRule);
    }

    setFormRule(createEmptyRule());
  };

  const handleEditRule = (index) => {
    setFormRule(rules[index]);
    setEditingIndex(index);
    setFormError('');
  };

  const handleDeleteRule = (index) => {
    removeRule(index);

    if (editingIndex === index) {
      setFormRule(createEmptyRule());
      setEditingIndex(null);
    }
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
      replaceRules(parsed);
      setFormError('');
    } catch {
      setFormError('JSON inválido. Verifica formato y vuelve a intentar.');
    }
  };

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      {formError && (
        <div style={{ border: '1px solid #e39', background: '#fff0f5', color: '#701', padding: 10, borderRadius: 8 }}>
          {formError}
        </div>
      )}

      <Card title={editingIndex !== null ? 'Editar regla clínica' : 'Nueva regla clínica'}>
        <section style={{ display: 'grid', gap: 10 }}>
          <label>
            ID de regla
            <input
              type="text"
              value={formRule.id}
              onChange={(e) => updateRuleField('id', e.target.value)}
              placeholder="ej: deshidratacion_moderada_adulto"
            />
          </label>

          <label>
            Patología
            <AutoCompleteInput
              listId="pathology-options"
              suggestions={PATHOLOGY_OPTIONS}
              value={formRule.pathology}
              onChange={(value) => updateRuleField('pathology', value)}
            />
          </label>

          <ConditionBuilder
            conditions={formRule.conditions}
            onChange={(conditions) => updateRuleField('conditions', conditions)}
          />

          <label>
            Diagnóstico probable
            <input type="text" value={formRule.diagnosis} onChange={(e) => updateRuleField('diagnosis', e.target.value)} />
          </label>

          <label>
            Clasificación de gravedad
            <input type="text" value={formRule.severity} onChange={(e) => updateRuleField('severity', e.target.value)} />
          </label>

          <h4 style={{ marginBottom: 0 }}>Tratamiento</h4>

          <label>
            Medicamento de elección
            <AutoCompleteInput
              listId="med-first-line"
              suggestions={MEDICATION_SUGGESTIONS}
              value={formRule.treatment.firstLine}
              onChange={(value) => updateTreatmentField('firstLine', value)}
            />
          </label>

          <label>
            Alternativa terapéutica
            <AutoCompleteInput
              listId="med-alternative"
              suggestions={MEDICATION_SUGGESTIONS}
              value={formRule.treatment.alternative}
              onChange={(value) => updateTreatmentField('alternative', value)}
            />
          </label>

          <label>
            Fórmula de dosis
            <input
              type="text"
              value={formRule.treatment.doseFormula}
              onChange={(e) => updateTreatmentField('doseFormula', e.target.value)}
              placeholder="ej: 75 ml * peso"
            />
          </label>

          <label>
            Indicaciones (coma separadas)
            <input
              type="text"
              value={formRule.treatment.indications.join(', ')}
              onChange={(e) => updateTreatmentField('indications', parseCommaSeparated(e.target.value))}
              placeholder="ej: Rehidratar, Reevaluar"
            />
          </label>

          <label>
            Nivel resolutivo requerido
            <select value={formRule.levelRequired} onChange={(e) => updateRuleField('levelRequired', e.target.value)}>
              <option value="I-1">I-1</option>
              <option value="I-2">I-2</option>
              <option value="I-3">I-3</option>
              <option value="I-4">I-4</option>
            </select>
          </label>

          <label>
            Medicamentos necesarios (coma separados)
            <input
              type="text"
              value={formRule.requiredMedications.join(', ')}
              onChange={(e) => updateRuleField('requiredMedications', parseCommaSeparated(e.target.value))}
              placeholder="ej: SRO, Zinc"
            />
          </label>

          <label>
            Criterios de referencia
            <textarea value={formRule.referralCriteria} onChange={(e) => updateRuleField('referralCriteria', e.target.value)} />
          </label>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleSaveRule}>
              {editingIndex !== null ? 'Actualizar regla' : 'Guardar regla'}
            </button>

            {editingIndex !== null && (
              <button
                type="button"
                onClick={() => {
                  setFormRule(createEmptyRule());
                  setEditingIndex(null);
                  setFormError('');
                }}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </section>
      </Card>

      <Card title="Gestión de reglas (JSON)">
        <section style={{ display: 'grid', gap: 10 }}>
          <textarea
            value={jsonImportText}
            onChange={(e) => setJsonImportText(e.target.value)}
            rows={6}
            placeholder="Pega aquí un array JSON de reglas para importar"
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleImportJson}>Importar JSON</button>
            <button type="button" onClick={handleExportJson}>Exportar JSON</button>
          </div>
          <pre style={{ background: '#f8f8f8', borderRadius: 8, padding: 10, margin: 0, overflowX: 'auto' }}>
            {generatedJson}
          </pre>
        </section>
      </Card>

      <RuleList rules={filteredRules} onEdit={handleEditRule} onDelete={handleDeleteRule} />
    </section>
  );
};

export default RuleEditor;

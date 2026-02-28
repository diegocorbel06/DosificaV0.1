import React, { useMemo, useState } from 'react';
import ConditionBuilder from './ConditionBuilder.jsx';
import RuleList from './RuleList.jsx';
import { useClinicalStore } from '../store/clinicalStore.js';

const PATHOLOGY_OPTIONS = [
  { value: 'deshidratacion', label: 'Deshidratación' },
  { value: 'anemia', label: 'Anemia' },
  { value: 'parasitosis', label: 'Parasitosis intestinal' },
];

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

/**
 * Editor visual conectado a store global.
 */
const RuleEditor = () => {
  const { rules, addRule, updateRule, removeRule, replaceRules } = useClinicalStore();

  const [formRule, setFormRule] = useState(createEmptyRule());
  const [editingIndex, setEditingIndex] = useState(null);
  const [jsonImportText, setJsonImportText] = useState('');
  const [formError, setFormError] = useState('');

  const generatedJson = useMemo(() => JSON.stringify(rules, null, 2), [rules]);

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

  const parseCommaSeparated = (text) =>
    text
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

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
      <h2 style={{ marginBottom: 0 }}>Editor de reglas clínicas</h2>

      {formError && (
        <div
          style={{
            border: '1px solid #e39',
            background: '#fff0f5',
            color: '#701',
            padding: 10,
            borderRadius: 8,
          }}
        >
          {formError}
        </div>
      )}

      <section
        style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 12,
          display: 'grid',
          gap: 10,
        }}
      >
        <h3 style={{ margin: 0 }}>{editingIndex !== null ? 'Editar regla' : 'Nueva regla clínica'}</h3>

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
          <select
            value={formRule.pathology}
            onChange={(e) => updateRuleField('pathology', e.target.value)}
          >
            {PATHOLOGY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <ConditionBuilder
          conditions={formRule.conditions}
          onChange={(conditions) => updateRuleField('conditions', conditions)}
        />

        <label>
          Diagnóstico probable
          <input
            type="text"
            value={formRule.diagnosis}
            onChange={(e) => updateRuleField('diagnosis', e.target.value)}
          />
        </label>

        <label>
          Clasificación de gravedad
          <input
            type="text"
            value={formRule.severity}
            onChange={(e) => updateRuleField('severity', e.target.value)}
          />
        </label>

        <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
          <h4>Tratamiento</h4>
          <label>
            Medicamento de elección
            <input
              type="text"
              value={formRule.treatment.firstLine}
              onChange={(e) => updateTreatmentField('firstLine', e.target.value)}
            />
          </label>

          <label>
            Alternativa
            <input
              type="text"
              value={formRule.treatment.alternative}
              onChange={(e) => updateTreatmentField('alternative', e.target.value)}
            />
          </label>

          <label>
            Fórmula de dosis
            <input
              type="text"
              value={formRule.treatment.doseFormula}
              onChange={(e) => updateTreatmentField('doseFormula', e.target.value)}
              placeholder="Ej: 75 ml * peso"
            />
          </label>

          <label>
            Indicaciones (separadas por coma)
            <input
              type="text"
              value={formRule.treatment.indications.join(', ')}
              onChange={(e) =>
                updateTreatmentField('indications', parseCommaSeparated(e.target.value))
              }
            />
          </label>
        </section>

        <label>
          Nivel resolutivo requerido
          <select
            value={formRule.levelRequired}
            onChange={(e) => updateRuleField('levelRequired', e.target.value)}
          >
            <option value="I-1">I-1</option>
            <option value="I-2">I-2</option>
            <option value="I-3">I-3</option>
            <option value="I-4">I-4</option>
          </select>
        </label>

        <label>
          Medicamentos necesarios (separados por coma)
          <input
            type="text"
            value={formRule.requiredMedications.join(', ')}
            onChange={(e) => updateRuleField('requiredMedications', parseCommaSeparated(e.target.value))}
          />
        </label>

        <label>
          Criterios de referencia
          <textarea
            rows={3}
            value={formRule.referralCriteria}
            onChange={(e) => updateRuleField('referralCriteria', e.target.value)}
          />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleSaveRule}>
            {editingIndex !== null ? 'Guardar cambios' : 'Crear regla'}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormRule(createEmptyRule());
              setEditingIndex(null);
              setFormError('');
            }}
          >
            Limpiar
          </button>
        </div>
      </section>

      <RuleList rules={rules} onEdit={handleEditRule} onDelete={handleDeleteRule} />

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
        <h3>Importar reglas JSON</h3>
        <textarea
          rows={6}
          style={{ width: '100%' }}
          value={jsonImportText}
          onChange={(e) => setJsonImportText(e.target.value)}
          placeholder='Pega aquí un array JSON: [{"id":"...", ...}]'
        />
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={handleImportJson}>
            Importar JSON
          </button>
        </div>
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
        <h3>JSON generado en tiempo real</h3>
        <button type="button" onClick={handleExportJson}>
          Exportar reglas en JSON
        </button>
        <pre
          style={{
            background: '#f8f8f8',
            padding: 12,
            overflowX: 'auto',
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          {generatedJson}
        </pre>
      </section>
    </section>
  );
};

export default RuleEditor;

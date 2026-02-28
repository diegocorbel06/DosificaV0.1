import React from 'react';

/**
 * Opciones base para construir condiciones clínicas.
 * Se exportan para facilitar escalabilidad y reutilización.
 */
export const FIELD_OPTIONS = [
  { value: 'edad', label: 'Edad' },
  { value: 'peso', label: 'Peso' },
  { value: 'sexo', label: 'Sexo' },
  { value: 'sintomas', label: 'Síntomas' },
  { value: 'signos', label: 'Signos' },
  { value: 'laboratorio.hemoglobina', label: 'Laboratorio: Hemoglobina' },
  { value: 'laboratorio.sodio', label: 'Laboratorio: Sodio' },
  { value: 'nivelResolutivo', label: 'Nivel resolutivo' },
  { value: 'medicamentosDisponibles', label: 'Medicamentos disponibles' },
  { value: 'equiposDisponibles', label: 'Equipos disponibles' },
];

export const OPERATOR_OPTIONS = [
  { value: 'greaterThan', label: '>' },
  { value: 'lessThan', label: '<' },
  { value: 'equals', label: '=' },
  { value: 'includes', label: 'includes' },
  { value: 'notIncludes', label: 'not includes' },
];

/**
 * Builder dinámico para una lista de condiciones.
 */
const ConditionBuilder = ({ conditions, onChange }) => {
  const updateCondition = (index, key, value) => {
    const next = [...conditions];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  const addCondition = () => {
    onChange([
      ...conditions,
      {
        field: 'edad',
        operator: 'greaterThan',
        value: '',
      },
    ]);
  };

  const removeCondition = (index) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3>Condiciones clínicas</h3>
      <p style={{ marginTop: 0, color: '#555' }}>
        Define múltiples condiciones (todas deben cumplirse).
      </p>

      {conditions.map((condition, index) => (
        <div
          key={`condition-${index}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: 8,
            marginBottom: 8,
            alignItems: 'center',
          }}
        >
          <select
            value={condition.field}
            onChange={(e) => updateCondition(index, 'field', e.target.value)}
            aria-label={`Campo condición ${index + 1}`}
          >
            {FIELD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
            aria-label={`Operador condición ${index + 1}`}
          >
            {OPERATOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={condition.value}
            onChange={(e) => updateCondition(index, 'value', e.target.value)}
            placeholder="Valor"
            aria-label={`Valor condición ${index + 1}`}
          />

          <button type="button" onClick={() => removeCondition(index)}>
            Eliminar
          </button>
        </div>
      ))}

      <button type="button" onClick={addCondition}>
        + Agregar condición
      </button>
    </section>
  );
};

export default ConditionBuilder;

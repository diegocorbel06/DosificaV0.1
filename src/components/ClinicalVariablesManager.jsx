import React, { useState } from 'react';
import Card from './Card.jsx';
import { useVariablesStore } from '../store/variablesStore.jsx';

const createInitial = () => ({ id: '', name: '', type: 'number', unit: '', options: '' });

const ClinicalVariablesManager = () => {
  const { variables, addVariable, removeVariable } = useVariablesStore();
  const [form, setForm] = useState(createInitial());
  const [message, setMessage] = useState('');

  const submit = () => {
    const ok = addVariable({
      id: form.id.trim(),
      name: form.name.trim(),
      type: form.type,
      unit: form.unit.trim(),
      options: form.type === 'select'
        ? form.options.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
    });

    if (!ok) {
      setMessage('No se pudo crear variable (verifica ID único y campos requeridos).');
      return;
    }

    setMessage('Variable clínica guardada.');
    setForm(createInitial());
  };

  return (
    <Card title="Variables Clínicas">
      {message && (
        <div style={{ fontSize: 12, padding: 8, borderRadius: 8, background: '#f1f5f9', marginBottom: 8 }}>
          {message}
        </div>
      )}

      <section style={{ display: 'grid', gap: 8 }}>
        <label>ID<input value={form.id} onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))} /></label>
        <label>Nombre<input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
        <label>Tipo
          <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="select">select</option>
          </select>
        </label>
        <label>Unidad<input value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))} /></label>
        {form.type === 'select' && (
          <label>Opciones (coma separadas)
            <input value={form.options} onChange={(e) => setForm((prev) => ({ ...prev, options: e.target.value }))} />
          </label>
        )}
        <button type="button" onClick={submit}>Guardar variable</button>
      </section>

      <section style={{ marginTop: 12 }}>
        <h4 style={{ margin: 0 }}>Catálogo ({variables.length})</h4>
        <ul style={{ paddingLeft: 18 }}>
          {variables.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong> ({item.id}) - {item.type}
              {item.unit ? ` [${item.unit}]` : ''}{' '}
              <button type="button" onClick={() => removeVariable(item.id)} style={{ fontSize: 11 }}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </section>
    </Card>
  );
};

export default ClinicalVariablesManager;

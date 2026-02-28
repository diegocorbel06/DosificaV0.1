import React, { useState } from 'react';
import { useEstablishmentsStore } from '../store/establishmentsStore.js';

/**
 * Selector de establecimiento activo y alta rápida de sedes.
 */
const EstablishmentSelector = () => {
  const {
    establishments,
    activeEstablishmentId,
    setActiveEstablishment,
    addEstablishment,
  } = useEstablishmentsStore();

  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState('I-1');

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
      <h2 style={{ marginBottom: 0 }}>Establecimiento activo</h2>

      <label>
        Seleccionar establecimiento
        <select value={activeEstablishmentId} onChange={(e) => setActiveEstablishment(e.target.value)}>
          {establishments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.id}) - {item.level}
            </option>
          ))}
        </select>
      </label>

      <details>
        <summary>Agregar nuevo establecimiento</summary>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <input
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="ID (ej: EST-003)"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del establecimiento"
          />
          <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
            <option value="I-1">I-1</option>
            <option value="I-2">I-2</option>
            <option value="I-3">I-3</option>
            <option value="I-4">I-4</option>
          </select>
          <button
            type="button"
            onClick={() => {
              addEstablishment({ id: newId.trim(), name: newName.trim(), level: newLevel });
              if (newId.trim()) {
                setActiveEstablishment(newId.trim());
              }
              setNewId('');
              setNewName('');
              setNewLevel('I-1');
            }}
          >
            Crear establecimiento
          </button>
        </div>
      </details>
    </section>
  );
};

export default EstablishmentSelector;

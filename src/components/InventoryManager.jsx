import React, { useState } from 'react';
import { useEstablishmentsStore } from '../store/establishmentsStore.js';

/**
 * Editor del inventario del establecimiento activo.
 */
const InventoryManager = () => {
  const {
    activeEstablishment,
    updateActiveField,
    addMedicationToActive,
    removeMedicationFromActive,
    addEquipmentToActive,
    removeEquipmentFromActive,
  } = useEstablishmentsStore();

  const [newMedication, setNewMedication] = useState('');
  const [newEquipment, setNewEquipment] = useState('');

  if (!activeEstablishment) {
    return null;
  }

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 10 }}>
      <h2 style={{ marginBottom: 0 }}>Inventario clínico editable</h2>

      <label>
        ID del establecimiento
        <input
          value={activeEstablishment.id}
          onChange={(e) => updateActiveField('id', e.target.value)}
        />
      </label>

      <label>
        Nombre del establecimiento
        <input
          value={activeEstablishment.name}
          onChange={(e) => updateActiveField('name', e.target.value)}
        />
      </label>

      <label>
        Nivel resolutivo
        <select
          value={activeEstablishment.level}
          onChange={(e) => updateActiveField('level', e.target.value)}
        >
          <option value="I-1">I-1</option>
          <option value="I-2">I-2</option>
          <option value="I-3">I-3</option>
          <option value="I-4">I-4</option>
        </select>
      </label>

      <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
        <h3>Medicamentos disponibles</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newMedication}
            onChange={(e) => setNewMedication(e.target.value)}
            placeholder="Ej: SRO"
          />
          <button
            type="button"
            onClick={() => {
              addMedicationToActive(newMedication);
              setNewMedication('');
            }}
          >
            Agregar
          </button>
        </div>

        <ul>
          {activeEstablishment.medicationsAvailable.map((item) => (
            <li key={item}>
              {item}{' '}
              <button type="button" onClick={() => removeMedicationFromActive(item)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
        <h3>Equipos disponibles</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newEquipment}
            onChange={(e) => setNewEquipment(e.target.value)}
            placeholder="Ej: Venoclisis"
          />
          <button
            type="button"
            onClick={() => {
              addEquipmentToActive(newEquipment);
              setNewEquipment('');
            }}
          >
            Agregar
          </button>
        </div>

        <ul>
          {activeEstablishment.equipmentAvailable.map((item) => (
            <li key={item}>
              {item}{' '}
              <button type="button" onClick={() => removeEquipmentFromActive(item)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
};

export default InventoryManager;

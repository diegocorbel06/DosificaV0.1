import React, { useMemo, useState } from 'react';
import { useEstablishmentsStore } from '../store/establishmentsStore.jsx';
import { useNationalMedicationsStore } from '../store/nationalMedicationsStore.jsx';
import AutoCompleteInput from './AutoCompleteInput.jsx';
import Card from './Card.jsx';

const KNOWN_EQUIPMENT = ['venoclisis', 'balanza pediátrica', 'oxímetro', 'cama hospitalaria'];

/**
 * Editor del inventario del establecimiento activo.
 * Separa explícitamente el inventario local del petitorio nacional.
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
  const { activeNationalMedications } = useNationalMedicationsStore();

  const [newMedication, setNewMedication] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [message, setMessage] = useState('');

  const medicationOptions = useMemo(
    () => Array.from(new Set(activeNationalMedications.map((item) => item.genericName))),
    [activeNationalMedications],
  );

  const equipmentOptions = useMemo(
    () => Array.from(new Set([...KNOWN_EQUIPMENT, ...(activeEstablishment?.equipmentAvailable || [])])),
    [activeEstablishment],
  );

  if (!activeEstablishment) {
    return null;
  }

  return (
    <Card title="Inventario del establecimiento">
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        Inventario local independiente del petitorio nacional. Solo se agregan medicamentos activos del petitorio.
      </div>
      {message && <div style={{ fontSize: 12, color: '#0369a1', marginBottom: 8 }}>{message}</div>}

      <section style={{ display: 'grid', gap: 10 }}>
        <label>
          ID del establecimiento
          <input value={activeEstablishment.id} onChange={(e) => updateActiveField('id', e.target.value)} />
        </label>

        <label>
          Nombre
          <input value={activeEstablishment.name} onChange={(e) => updateActiveField('name', e.target.value)} />
        </label>

        <label>
          Nivel resolutivo
          <select value={activeEstablishment.level} onChange={(e) => updateActiveField('level', e.target.value)}>
            <option value="I-1">I-1</option>
            <option value="I-2">I-2</option>
            <option value="I-3">I-3</option>
            <option value="I-4">I-4</option>
          </select>
        </label>

        <section>
          <h4 style={{ marginBottom: 6 }}>Medicamentos disponibles (inventario local)</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <AutoCompleteInput
              listId="inventory-medications"
              value={newMedication}
              onChange={setNewMedication}
              suggestions={medicationOptions}
              placeholder="Buscar medicamento del petitorio"
            />
            <button
              type="button"
              onClick={() => {
                if (!medicationOptions.includes(newMedication)) {
                  setMessage('Seleccione un medicamento activo del petitorio nacional.');
                  return;
                }
                addMedicationToActive(newMedication);
                setNewMedication('');
                setMessage('Medicamento agregado al inventario local.');
              }}
              style={{ fontSize: 12 }}
            >
              Agregar
            </button>
          </div>

          <ul>
            {activeEstablishment.medicationsAvailable.map((item) => (
              <li key={item}>
                {item}{' '}
                <button type="button" onClick={() => removeMedicationFromActive(item)} style={{ fontSize: 12 }}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 style={{ marginBottom: 6 }}>Equipamiento disponible</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <AutoCompleteInput
              listId="inventory-equipment"
              value={newEquipment}
              onChange={setNewEquipment}
              suggestions={equipmentOptions}
              placeholder="Equipo"
            />
            <button
              type="button"
              onClick={() => {
                addEquipmentToActive(newEquipment);
                setNewEquipment('');
              }}
              style={{ fontSize: 12 }}
            >
              Agregar
            </button>
          </div>

          <ul>
            {activeEstablishment.equipmentAvailable.map((item) => (
              <li key={item}>
                {item}{' '}
                <button type="button" onClick={() => removeEquipmentFromActive(item)} style={{ fontSize: 12 }}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </Card>
  );
};

export default InventoryManager;

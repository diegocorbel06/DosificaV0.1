import React, { useMemo, useState } from 'react';
import { useEstablishmentsStore } from '../store/establishmentsStore.jsx';
import AutoCompleteInput from './AutoCompleteInput.jsx';
import Card from './Card.jsx';

const KNOWN_MEDICATIONS = ['SRO', 'ClNa 0.9%', 'Sulfato ferroso', 'Albendazol', 'Paracetamol'];
const KNOWN_EQUIPMENT = ['venoclisis', 'balanza pediátrica', 'oxímetro', 'cama hospitalaria'];

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

  const medicationOptions = useMemo(
    () => Array.from(new Set([...KNOWN_MEDICATIONS, ...(activeEstablishment?.medicationsAvailable || [])])),
    [activeEstablishment],
  );
  const equipmentOptions = useMemo(
    () => Array.from(new Set([...KNOWN_EQUIPMENT, ...(activeEstablishment?.equipmentAvailable || [])])),
    [activeEstablishment],
  );

  if (!activeEstablishment) {
    return null;
  }

  return (
    <Card title="Inventario clínico editable">
      <section style={{ display: 'grid', gap: 10 }}>
        <label>
          ID del establecimiento
          <input value={activeEstablishment.id} onChange={(e) => updateActiveField('id', e.target.value)} />
        </label>

        <label>
          Nombre del establecimiento
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

        <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
          <h3 style={{ marginTop: 0 }}>Medicamentos disponibles</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <AutoCompleteInput
              listId="inventory-medications"
              value={newMedication}
              onChange={setNewMedication}
              suggestions={medicationOptions}
              placeholder="Ej: SRO"
            />
            <button
              type="button"
              onClick={() => {
                addMedicationToActive(newMedication);
                setNewMedication('');
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

        <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
          <h3 style={{ marginTop: 0 }}>Equipos disponibles</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <AutoCompleteInput
              listId="inventory-equipment"
              value={newEquipment}
              onChange={setNewEquipment}
              suggestions={equipmentOptions}
              placeholder="Ej: venoclisis"
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

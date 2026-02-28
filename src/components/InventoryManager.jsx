import React, { useMemo, useState } from 'react';
import { useEstablishmentsStore } from '../store/establishmentsStore.jsx';
import { useNationalMedicationsStore } from '../store/nationalMedicationsStore.jsx';
import AutoCompleteInput from './AutoCompleteInput.jsx';
import Card from './Card.jsx';
import InventoryDashboard from './InventoryDashboard.jsx';

const KNOWN_EQUIPMENT = ['venoclisis', 'balanza pediátrica', 'oxímetro', 'cama hospitalaria'];

/**
 * Editor del inventario del establecimiento activo usando establishment_inventory.
 */
const InventoryManager = () => {
  const {
    tableName,
    activeEstablishment,
    updateActiveField,
    inventoryForActiveEstablishment,
    associateNationalMedicationToEstablishment,
    updateInventoryStock,
    setInventoryAvailability,
    importInventoryCsv,
    addEquipmentToActive,
    removeEquipmentFromActive,
  } = useEstablishmentsStore();

  const { activeNationalMedications } = useNationalMedicationsStore();

  const [selectedMedicationName, setSelectedMedicationName] = useState('');
  const [selectedStock, setSelectedStock] = useState('1');
  const [selectedExpirationDate, setSelectedExpirationDate] = useState('');
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

  const selectedMedication = useMemo(
    () => activeNationalMedications.find((item) => item.genericName === selectedMedicationName) || null,
    [activeNationalMedications, selectedMedicationName],
  );

  if (!activeEstablishment) {
    return null;
  }

  const onAssociateMedication = () => {
    if (!selectedMedication) {
      setMessage('Seleccione un medicamento válido del petitorio nacional.');
      return;
    }

    const ok = associateNationalMedicationToEstablishment({
      establishmentId: activeEstablishment.id,
      nationalMedication: selectedMedication,
      stock: Number(selectedStock || 0),
      expirationDate: selectedExpirationDate,
    });

    setMessage(ok ? 'Medicamento asociado al establecimiento.' : 'No se pudo asociar medicamento.');
  };

  const onCsvImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = importInventoryCsv(text, activeNationalMedications, activeEstablishment.id);
    setMessage(imported ? `CSV cargado: ${imported} filas mapeadas al petitorio.` : 'CSV sin filas válidas para mapear.');
    event.target.value = '';
  };

  return (
    <Card title="Inventario del establecimiento">
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        Tabla lógica: <strong>{tableName}</strong>. Inventario local separado del petitorio nacional.
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
          <h4 style={{ marginBottom: 6 }}>Asociar medicamento nacional</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
            <AutoCompleteInput
              listId="inventory-medications"
              value={selectedMedicationName}
              onChange={setSelectedMedicationName}
              suggestions={medicationOptions}
              placeholder="Medicamento del petitorio"
            />
            <label style={{ fontSize: 12 }}>
              Stock
              <input value={selectedStock} onChange={(e) => setSelectedStock(e.target.value)} style={{ width: 100 }} />
            </label>
            <label style={{ fontSize: 12 }}>
              Vencimiento
              <input type="date" value={selectedExpirationDate} onChange={(e) => setSelectedExpirationDate(e.target.value)} />
            </label>
            <button type="button" onClick={onAssociateMedication} style={{ fontSize: 12 }}>
              Asociar
            </button>
            <label style={{ fontSize: 12 }}>
              Importar CSV inventario
              <input type="file" accept=".csv,text/csv" onChange={onCsvImport} />
            </label>
          </div>

          <ul style={{ paddingLeft: 18 }}>
            {inventoryForActiveEstablishment.map((item) => (
              <li key={item.id} style={{ marginBottom: 6 }}>
                <strong>{item.medicationName}</strong> ({item.nationalMedicationId}) — Stock: {item.stock}{' '}
                {item.stock === 0 && <span style={{ color: '#b91c1c', fontWeight: 700 }}>⚠ Sin stock</span>}{' '}
                <button
                  type="button"
                  onClick={() => updateInventoryStock(item.id, Number(item.stock || 0) + 1)}
                  style={{ fontSize: 11 }}
                >
                  +1
                </button>{' '}
                <button
                  type="button"
                  onClick={() => updateInventoryStock(item.id, Math.max(0, Number(item.stock || 0) - 1))}
                  style={{ fontSize: 11 }}
                >
                  -1
                </button>{' '}
                <button
                  type="button"
                  onClick={() => setInventoryAvailability(item.id, !item.isAvailable)}
                  style={{ fontSize: 11 }}
                >
                  {item.isAvailable ? 'Marcar no disponible' : 'Marcar disponible'}
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

        <InventoryDashboard />
      </section>
    </Card>
  );
};

export default InventoryManager;

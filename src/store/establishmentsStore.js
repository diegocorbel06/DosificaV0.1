import React, { createContext, useContext, useMemo, useState } from 'react';

/**
 * Store multi-establecimiento preparado para futura persistencia.
 * Mantiene lista de establecimientos + establecimiento activo.
 */
const EstablishmentsStoreContext = createContext(null);

const initialEstablishments = [
  {
    id: 'EST-001',
    name: 'Centro de Salud I-1 Demo',
    level: 'I-1',
    medicationsAvailable: [],
    equipmentAvailable: [],
  },
  {
    id: 'EST-002',
    name: 'Hospital Local I-3 Demo',
    level: 'I-3',
    medicationsAvailable: ['SRO', 'Albendazol'],
    equipmentAvailable: ['venoclisis'],
  },
];

export const EstablishmentsStoreProvider = ({ children }) => {
  const [establishments, setEstablishments] = useState(initialEstablishments);
  const [activeEstablishmentId, setActiveEstablishmentId] = useState(initialEstablishments[0].id);

  const activeEstablishment = useMemo(
    () => establishments.find((item) => item.id === activeEstablishmentId) || null,
    [establishments, activeEstablishmentId],
  );

  const addEstablishment = (establishment) => {
    if (!establishment?.id || !establishment?.name) return;

    setEstablishments((prev) => {
      if (prev.some((item) => item.id === establishment.id)) return prev;
      return [
        ...prev,
        {
          id: establishment.id,
          name: establishment.name,
          level: establishment.level || 'I-1',
          medicationsAvailable: Array.isArray(establishment.medicationsAvailable)
            ? establishment.medicationsAvailable
            : [],
          equipmentAvailable: Array.isArray(establishment.equipmentAvailable)
            ? establishment.equipmentAvailable
            : [],
        },
      ];
    });
  };

  const setActiveEstablishment = (id) => {
    setActiveEstablishmentId(id);
  };

  const updateActiveField = (field, value) => {
    setEstablishments((prev) =>
      prev.map((item) => (item.id === activeEstablishmentId ? { ...item, [field]: value } : item)),
    );
  };

  const addMedicationToActive = (medication) => {
    const normalized = String(medication || '').trim();
    if (!normalized) return;

    setEstablishments((prev) =>
      prev.map((item) => {
        if (item.id !== activeEstablishmentId) return item;
        if (item.medicationsAvailable.includes(normalized)) return item;
        return {
          ...item,
          medicationsAvailable: [...item.medicationsAvailable, normalized],
        };
      }),
    );
  };

  const removeMedicationFromActive = (medication) => {
    setEstablishments((prev) =>
      prev.map((item) =>
        item.id === activeEstablishmentId
          ? {
              ...item,
              medicationsAvailable: item.medicationsAvailable.filter((entry) => entry !== medication),
            }
          : item,
      ),
    );
  };

  const addEquipmentToActive = (equipment) => {
    const normalized = String(equipment || '').trim();
    if (!normalized) return;

    setEstablishments((prev) =>
      prev.map((item) => {
        if (item.id !== activeEstablishmentId) return item;
        if (item.equipmentAvailable.includes(normalized)) return item;
        return {
          ...item,
          equipmentAvailable: [...item.equipmentAvailable, normalized],
        };
      }),
    );
  };

  const removeEquipmentFromActive = (equipment) => {
    setEstablishments((prev) =>
      prev.map((item) =>
        item.id === activeEstablishmentId
          ? {
              ...item,
              equipmentAvailable: item.equipmentAvailable.filter((entry) => entry !== equipment),
            }
          : item,
      ),
    );
  };

  const value = useMemo(
    () => ({
      establishments,
      activeEstablishmentId,
      activeEstablishment,
      addEstablishment,
      setActiveEstablishment,
      updateActiveField,
      addMedicationToActive,
      removeMedicationFromActive,
      addEquipmentToActive,
      removeEquipmentFromActive,
    }),
    [establishments, activeEstablishmentId, activeEstablishment],
  );

  return (
    <EstablishmentsStoreContext.Provider value={value}>
      {children}
    </EstablishmentsStoreContext.Provider>
  );
};

export const useEstablishmentsStore = () => {
  const context = useContext(EstablishmentsStoreContext);
  if (!context) {
    throw new Error('useEstablishmentsStore debe usarse dentro de EstablishmentsStoreProvider');
  }
  return context;
};

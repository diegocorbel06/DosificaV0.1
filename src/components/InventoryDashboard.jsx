import React, { useMemo, useState } from 'react';
import SmartTable from './SmartTable.jsx';
import { useEstablishmentsStore } from '../store/establishmentsStore.jsx';

const InventoryDashboard = () => {
  const { inventoryForActiveEstablishment } = useEstablishmentsStore();
  const [searchText, setSearchText] = useState('');
  const [routeFilter, setRouteFilter] = useState('all');
  const [formFilter, setFormFilter] = useState('all');

  const routeOptions = useMemo(
    () => ['all', ...Array.from(new Set(inventoryForActiveEstablishment.map((item) => item.route).filter(Boolean)))],
    [inventoryForActiveEstablishment],
  );

  const formOptions = useMemo(
    () => ['all', ...Array.from(new Set(inventoryForActiveEstablishment.map((item) => item.pharmaceuticalForm).filter(Boolean)))],
    [inventoryForActiveEstablishment],
  );

  const filteredRows = useMemo(() => {
    return inventoryForActiveEstablishment.filter((item) => {
      if (routeFilter !== 'all' && item.route !== routeFilter) return false;
      if (formFilter !== 'all' && item.pharmaceuticalForm !== formFilter) return false;
      return true;
    });
  }, [inventoryForActiveEstablishment, routeFilter, formFilter]);

  const columns = useMemo(
    () => [
      { key: 'medicationName', label: 'Medicamento' },
      { key: 'route', label: 'Vía' },
      { key: 'pharmaceuticalForm', label: 'Forma farmacéutica' },
      {
        key: 'stock',
        label: 'Stock',
        render: (value) => {
          const stock = Number(value || 0);
          if (stock === 0) {
            return <span style={{ color: '#b91c1c', fontWeight: 700 }}>0 ⚠ Sin stock</span>;
          }
          return stock;
        },
      },
      {
        key: 'isAvailable',
        label: 'Disponibilidad',
        render: (value, row) => (
          <span
            style={{
              fontWeight: 700,
              color: value && Number(row.stock) > 0 ? '#15803d' : '#b91c1c',
            }}
          >
            {value && Number(row.stock) > 0 ? 'Disponible' : 'No disponible'}
          </span>
        ),
      },
      { key: 'expirationDate', label: 'Vencimiento' },
      { key: 'lastUpdated', label: 'Actualizado' },
    ],
    [],
  );

  return (
    <section style={{ display: 'grid', gap: 8 }}>
      <h4 style={{ margin: 0 }}>InventoryDashboard</h4>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Buscar medicamento"
          style={{ minWidth: 220 }}
        />

        <select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)}>
          {routeOptions.map((option) => (
            <option key={option} value={option}>{option === 'all' ? 'Todas las vías' : option}</option>
          ))}
        </select>

        <select value={formFilter} onChange={(e) => setFormFilter(e.target.value)}>
          {formOptions.map((option) => (
            <option key={option} value={option}>{option === 'all' ? 'Todas las formas' : option}</option>
          ))}
        </select>
      </div>

      <SmartTable
        columns={columns}
        rows={filteredRows}
        filterText={searchText}
        emptyMessage="No hay registros de inventario para los filtros seleccionados."
      />
    </section>
  );
};

export default InventoryDashboard;

import React from 'react';
import { useAppModeStore } from '../store/appModeStore.jsx';

/**
 * Selector explícito de modo de operación.
 */
const AppModeSelector = () => {
  const { mode, setMode, isSimulation, isProduction } = useAppModeStore();

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
      <h2 style={{ margin: 0 }}>Modo de aplicación</h2>

      <label>
        Seleccionar modo
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="simulation">Simulación</option>
          <option value="production">Producción</option>
        </select>
      </label>

      <div style={{ fontSize: 13, background: '#f7f7f7', borderRadius: 6, padding: 8 }}>
        {isSimulation && (
          <span>
            Simulación activa: no guarda auditoría, no registra decisiones y no exige compuerta legal.
          </span>
        )}
        {isProduction && (
          <span>
            Producción activa: auditoría y decision log habilitados; responsabilidad clínica obligatoria.
          </span>
        )}
      </div>
    </section>
  );
};

export default AppModeSelector;

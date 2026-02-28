import React from 'react';
import styles from './MainLayout.module.css';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Estado general', icon: '📊' },
  { id: 'evaluacion', label: 'Evaluación clínica', icon: '🩺' },
  { id: 'reglas', label: 'Editor de reglas', icon: '📘' },
  { id: 'inventario', label: 'Inventario', icon: '💊' },
  { id: 'auditoria', label: 'Auditoría', icon: '🧾' },
  { id: 'decisiones', label: 'Decisiones médicas', icon: '👩‍⚕️' },
  { id: 'versionado', label: 'Versionado', icon: '🧬' },
  { id: 'establecimientos', label: 'Establecimientos', icon: '🏥' },
];

const Sidebar = ({ activeSection, onSelectSection, collapsed }) => {
  if (collapsed) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      <h2 style={{ padding: '14px', margin: 0, fontSize: '1rem' }}>Panel clínico</h2>
      <nav>
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`${styles.navItem} ${activeSection === item.id ? styles.navItemActive : ''}`}
            onClick={() => onSelectSection(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

import React, { useMemo } from 'react';
import { useClinicalStore } from '../store/clinicalStore.jsx';
import { useEstablishmentsStore } from '../store/establishmentsStore.jsx';
import { useAppModeStore } from '../store/appModeStore.jsx';
import { useAuditStore } from '../store/auditStore.jsx';
import { useDecisionLogStore } from '../store/decisionLogStore.jsx';
import StatusCard from './StatusCard.jsx';
import DataTable from './DataTable.jsx';

/**
 * Dashboard central de visualización del estado del sistema clínico.
 * Solo lectura (no modifica datos).
 */
const SystemDashboard = () => {
  const { rules, evaluableRules, activeNtsVersion, versionSummary } = useClinicalStore();
  const { establishments, activeEstablishment } = useEstablishmentsStore();
  const { mode } = useAppModeStore();
  const { auditLogs } = useAuditStore();
  const { decisions } = useDecisionLogStore();

  const latestAudit20 = useMemo(() => auditLogs.slice(0, 20), [auditLogs]);
  const latestDecisions20 = useMemo(() => decisions.slice(0, 20), [decisions]);

  const ruleRows = useMemo(
    () =>
      rules.map((rule) => ({
        id: rule.id,
        pathology: rule.pathology,
        severity: rule.severity,
        levelRequired: Array.isArray(rule.levelRequired)
          ? rule.levelRequired.join(', ')
          : rule.levelRequired || rule.requiredCareLevel || '-',
        active: rule.active ? 'Activa' : 'Inactiva',
        ntsVersion: rule.ntsVersion || '-',
      })),
    [rules],
  );

  const auditRows = useMemo(
    () =>
      latestAudit20
        .filter((entry) => entry.diagnosis)
        .map((entry) => ({
          timestamp: entry.timestamp,
          diagnosis: entry.diagnosis,
          establishmentId: entry.establishmentId,
          medication: entry.medication || '-',
          referral: entry.referral ? 'Sí' : 'No',
          auditId: entry.auditId,
        })),
    [latestAudit20],
  );

  const decisionRows = useMemo(
    () =>
      latestDecisions20.map((entry) => ({
        diagnosisSuggested: entry.diagnosisSuggested,
        diagnosisFinal: entry.diagnosisFinal,
        clinicianId: entry.clinicianId,
        confirmedAt: entry.confirmedAt,
        decisionId: entry.decisionId,
      })),
    [latestDecisions20],
  );

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0 }}>System Dashboard</h2>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 10 }}>
        <h3 style={{ margin: 0 }}>🔹 Sección 1 – Estado del Motor</h3>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <StatusCard title="Total reglas activas" value={evaluableRules.length} subtitle="En versión global activa" />
          <StatusCard title="Versión NTS activa" value={activeNtsVersion} subtitle={`Versiones cargadas: ${versionSummary.length}`} />
          <StatusCard title="Modo del sistema" value={mode} subtitle="simulation | production" />
          <StatusCard
            title="Establecimiento activo"
            value={activeEstablishment ? activeEstablishment.name : 'Sin establecimiento'}
            subtitle={activeEstablishment ? `${activeEstablishment.id} (${activeEstablishment.level})` : '-'}
          />
        </div>
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>🔹 Sección 2 – Inventario</h3>
        {!activeEstablishment ? (
          <p style={{ color: '#777', margin: 0 }}>No hay establecimiento activo.</p>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            <div>
              <strong>Nivel resolutivo:</strong> {activeEstablishment.level}
            </div>
            <div>
              <strong>Medicamentos disponibles:</strong>{' '}
              {activeEstablishment.medicationsAvailable.length
                ? activeEstablishment.medicationsAvailable.join(', ')
                : '-'}
            </div>
            <div>
              <strong>Equipos disponibles:</strong>{' '}
              {activeEstablishment.equipmentAvailable.length
                ? activeEstablishment.equipmentAvailable.join(', ')
                : '-'}
            </div>
            <div>
              <strong>Establecimientos registrados:</strong> {establishments.length}
            </div>
          </div>
        )}
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>🔹 Sección 3 – Reglas</h3>
        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'pathology', label: 'Patología' },
            { key: 'severity', label: 'Severidad' },
            { key: 'levelRequired', label: 'Nivel requerido' },
            { key: 'active', label: 'Activa / Inactiva' },
            { key: 'ntsVersion', label: 'Versión NTS' },
          ]}
          rows={ruleRows}
          emptyMessage="No hay reglas cargadas."
        />
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>🔹 Sección 4 – Auditoría (últimos 20)</h3>
        <DataTable
          columns={[
            { key: 'timestamp', label: 'Fecha' },
            { key: 'diagnosis', label: 'Diagnóstico' },
            { key: 'establishmentId', label: 'Establecimiento' },
            { key: 'medication', label: 'Medicamento' },
            { key: 'referral', label: 'Referencia (sí/no)' },
          ]}
          rows={auditRows}
          emptyMessage="Sin auditorías clínicas registradas."
        />
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>🔹 Sección 5 – Decisiones Médicas (últimas 20)</h3>
        <DataTable
          columns={[
            { key: 'diagnosisSuggested', label: 'Diagnóstico sugerido' },
            { key: 'diagnosisFinal', label: 'Diagnóstico final' },
            { key: 'clinicianId', label: 'Confirmado por' },
            { key: 'confirmedAt', label: 'Fecha' },
          ]}
          rows={decisionRows}
          emptyMessage="Sin decisiones médicas confirmadas."
        />
      </section>
    </section>
  );
};

export default SystemDashboard;

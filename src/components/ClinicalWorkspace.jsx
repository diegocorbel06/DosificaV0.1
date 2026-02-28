import React from 'react';
import RuleEditor from './RuleEditor.jsx';
import ClinicalEvaluator from './ClinicalEvaluator.jsx';
import InventoryManager from './InventoryManager.jsx';
import EstablishmentSelector from './EstablishmentSelector.jsx';
import AuditViewer from './AuditViewer.jsx';
import VersionControlPanel from './VersionControlPanel.jsx';
import DecisionPanel from './DecisionPanel.jsx';
import AppModeSelector from './AppModeSelector.jsx';
import SystemDashboard from './SystemDashboard.jsx';
import { ClinicalStoreProvider } from '../store/clinicalStore.jsx';
import { EstablishmentsStoreProvider } from '../store/establishmentsStore.jsx';
import { AuditStoreProvider } from '../store/auditStore.jsx';
import { DecisionLogStoreProvider } from '../store/decisionLogStore.jsx';
import { AppModeStoreProvider } from '../store/appModeStore.jsx';

/**
 * Pantalla integrada: modo + establecimientos + versionado + inventario + editor + evaluador + auditoría + decisiones.
 */
const ClinicalWorkspace = () => {
  return (
    <AppModeStoreProvider>
      <ClinicalStoreProvider>
        <EstablishmentsStoreProvider>
          <AuditStoreProvider>
            <DecisionLogStoreProvider>
              <main
                style={{
                  maxWidth: 1200,
                  margin: '0 auto',
                  padding: 16,
                  fontFamily: 'Arial, sans-serif',
                  display: 'grid',
                  gap: 16,
                  gridTemplateColumns: '1fr',
                }}
              >
                <h1 style={{ marginBottom: 0 }}>Motor clínico NTS/MBE integrado</h1>
                <AppModeSelector />
                <SystemDashboard />
                <EstablishmentSelector />
                <VersionControlPanel />
                <InventoryManager />
                <RuleEditor />
                <ClinicalEvaluator />
                <AuditViewer />
                <DecisionPanel />
              </main>
            </DecisionLogStoreProvider>
          </AuditStoreProvider>
        </EstablishmentsStoreProvider>
      </ClinicalStoreProvider>
    </AppModeStoreProvider>
  );
};

export default ClinicalWorkspace;

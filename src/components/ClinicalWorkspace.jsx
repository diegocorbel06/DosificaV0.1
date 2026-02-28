import React, { useState } from 'react';
import RuleEditor from './RuleEditor.jsx';
import ClinicalEvaluator from './ClinicalEvaluator.jsx';
import InventoryManager from './InventoryManager.jsx';
import EstablishmentSelector from './EstablishmentSelector.jsx';
import AuditViewer from './AuditViewer.jsx';
import VersionControlPanel from './VersionControlPanel.jsx';
import DecisionPanel from './DecisionPanel.jsx';
import AppModeSelector from './AppModeSelector.jsx';
import SystemDashboard from './SystemDashboard.jsx';
import MainLayout from './MainLayout.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import { ClinicalStoreProvider, useClinicalStore } from '../store/clinicalStore.jsx';
import { EstablishmentsStoreProvider, useEstablishmentsStore } from '../store/establishmentsStore.jsx';
import { AuditStoreProvider } from '../store/auditStore.jsx';
import { DecisionLogStoreProvider } from '../store/decisionLogStore.jsx';
import { AppModeStoreProvider, useAppModeStore } from '../store/appModeStore.jsx';

const WorkspaceContent = () => {
  const { mode } = useAppModeStore();
  const { activeNtsVersion } = useClinicalStore();
  const { activeEstablishment } = useEstablishmentsStore();

  const [activeSection, setActiveSection] = useState('dashboard');
  const [compactMode, setCompactMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const sections = {
    dashboard: <SystemDashboard filterText={searchTerm} />,
    evaluacion: <ClinicalEvaluator />,
    reglas: <RuleEditor filterText={searchTerm} />,
    inventario: <InventoryManager />,
    auditoria: <AuditViewer />,
    decisiones: <DecisionPanel />,
    versionado: <VersionControlPanel />,
    establecimientos: <EstablishmentSelector />,
  };

  return (
    <MainLayout
      compactMode={compactMode}
      sidebar={
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          collapsed={sidebarCollapsed}
        />
      }
      topbar={
        <TopBar
          mode={mode}
          activeNtsVersion={activeNtsVersion}
          activeEstablishment={activeEstablishment}
          compactMode={compactMode}
          onToggleCompact={() => setCompactMode((prev) => !prev)}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      }
    >
      <AppModeSelector />
      {sections[activeSection]}
    </MainLayout>
  );
};

/**
 * Pantalla integrada del motor clínico.
 */
const ClinicalWorkspace = () => {
  return (
    <AppModeStoreProvider>
      <ClinicalStoreProvider>
        <EstablishmentsStoreProvider>
          <AuditStoreProvider>
            <DecisionLogStoreProvider>
              <WorkspaceContent />
            </DecisionLogStoreProvider>
          </AuditStoreProvider>
        </EstablishmentsStoreProvider>
      </ClinicalStoreProvider>
    </AppModeStoreProvider>
  );
};

export default ClinicalWorkspace;

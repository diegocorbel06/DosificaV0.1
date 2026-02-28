import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  cloneRulesToVersion,
  ensureRuleVersionMetadata,
  getEvaluableRules,
  getRulesByVersion,
  getVersionSummary,
  setVersionActiveState,
} from '../engine/versionManager.js';

const ClinicalStoreContext = createContext(null);

const DEFAULT_VERSION = 'NTS-2024';

export const ClinicalStoreProvider = ({ children }) => {
  const [rules, setRules] = useState([]);
  const [activeNtsVersion, setActiveNtsVersion] = useState(DEFAULT_VERSION);

  const addRule = (rule) => {
    const normalized = ensureRuleVersionMetadata(rule, { defaultVersion: activeNtsVersion });
    setRules((prev) => [...prev, normalized]);
  };

  const updateRule = (index, nextRule) => {
    setRules((prev) =>
      prev.map((rule, i) =>
        i === index
          ? ensureRuleVersionMetadata(
              { ...nextRule, createdAt: rule.createdAt || nextRule.createdAt },
              { defaultVersion: activeNtsVersion, preserveCreatedAt: true },
            )
          : rule,
      ),
    );
  };

  const removeRule = (index) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const replaceRules = (nextRules) => {
    const normalized = Array.isArray(nextRules)
      ? nextRules.map((rule) => ensureRuleVersionMetadata(rule, { defaultVersion: activeNtsVersion }))
      : [];

    setRules(normalized);
  };

  const toggleVersionActive = (version, nextActive) => {
    setRules((prev) => setVersionActiveState(prev, version, nextActive));
  };

  const cloneVersion = (sourceVersion, targetVersion) => {
    if (!sourceVersion || !targetVersion) return;
    setRules((prev) => cloneRulesToVersion(prev, sourceVersion, targetVersion));
  };

  const versionSummary = useMemo(() => getVersionSummary(rules), [rules]);
  const rulesForActiveVersion = useMemo(
    () => getRulesByVersion(rules, activeNtsVersion),
    [rules, activeNtsVersion],
  );
  const evaluableRules = useMemo(
    () => getEvaluableRules(rules, activeNtsVersion),
    [rules, activeNtsVersion],
  );

  const value = useMemo(
    () => ({
      rules,
      evaluableRules,
      activeNtsVersion,
      setActiveNtsVersion,
      versionSummary,
      rulesForActiveVersion,
      addRule,
      updateRule,
      removeRule,
      replaceRules,
      toggleVersionActive,
      cloneVersion,
    }),
    [rules, evaluableRules, activeNtsVersion, versionSummary, rulesForActiveVersion],
  );

  return <ClinicalStoreContext.Provider value={value}>{children}</ClinicalStoreContext.Provider>;
};

export const useClinicalStore = () => {
  const context = useContext(ClinicalStoreContext);
  if (!context) {
    throw new Error('useClinicalStore debe usarse dentro de ClinicalStoreProvider');
  }
  return context;
};

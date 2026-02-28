import React, { useEffect, useMemo, useState } from 'react';
import useClinicalEngine from '../hooks/useClinicalEngine.js';
import { useClinicalStore } from '../store/clinicalStore.jsx';
import { useEstablishmentsStore } from '../store/establishmentsStore.jsx';
import { useAuditStore } from '../store/auditStore.jsx';
import { buildAuditEntries } from '../audit/auditLogger.js';
import ResponsibilityGate from './ResponsibilityGate.jsx';
import { useAppModeStore } from '../store/appModeStore.jsx';
import AutoCompleteInput from './AutoCompleteInput.jsx';
import Card from './Card.jsx';

const SYMPTOM_SUGGESTIONS = ['sed intensa', 'fiebre', 'palidez', 'diarrea', 'vómitos'];
const SIGN_SUGGESTIONS = ['mucosas secas', 'ojos hundidos', 'llenado capilar lento', 'taquicardia'];

const createInitialPatient = () => ({
  edad: '',
  peso: '',
  sexo: 'F',
  sintomas: '',
  signos: '',
  hemoglobina: '',
  sodio: '',
});

const parseCsv = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Evaluador clínico conectado a reglas + establecimiento activo.
 */
const ClinicalEvaluator = () => {
  const { rules, evaluableRules, activeNtsVersion } = useClinicalStore();
  const { activeEstablishment } = useEstablishmentsStore();
  const { addAuditEntries, addResponsibilityAcceptance } = useAuditStore();
  const { isSimulation, isProduction } = useAppModeStore();
  const { evaluatePatient } = useClinicalEngine(evaluableRules);

  const [patientForm, setPatientForm] = useState(createInitialPatient());
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [unmetPolicy, setUnmetPolicy] = useState('reference');
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);

  const patientPreview = useMemo(
    () => ({
      edad: Number(patientForm.edad || 0),
      peso: Number(patientForm.peso || 0),
      sexo: patientForm.sexo,
      sintomas: parseCsv(patientForm.sintomas),
      signos: parseCsv(patientForm.signos),
      laboratorio: {
        hemoglobina: patientForm.hemoglobina === '' ? undefined : Number(patientForm.hemoglobina),
        sodio: patientForm.sodio === '' ? undefined : Number(patientForm.sodio),
      },
      nivelResolutivo: activeEstablishment?.level || 'I-1',
      medicamentosDisponibles: activeEstablishment?.medicationsAvailable || [],
      equiposDisponibles: activeEstablishment?.equipmentAvailable || [],
    }),
    [patientForm, activeEstablishment],
  );

  const updatePatientField = (field, value) => {
    setPatientForm((prev) => ({ ...prev, [field]: value }));
  };

  const evaluateNow = () => {
    if (!evaluableRules.length) {
      setMessage(`No hay reglas activas para la versión ${activeNtsVersion}.`);
      setResults([]);
      setResponsibilityAccepted(false);
      return;
    }

    if (!activeEstablishment) {
      setMessage('No hay establecimiento activo para evaluar.');
      setResults([]);
      setResponsibilityAccepted(false);
      return;
    }

    setMessage('');
    const evaluation = evaluatePatient(patientPreview, { unmetPolicy });
    setResults(evaluation);
    setResponsibilityAccepted(isSimulation);

    const patientSnapshot = {
      edad: patientPreview.edad,
      peso: patientPreview.peso,
      sintomas: patientPreview.sintomas,
      signos: patientPreview.signos,
      laboratorio: patientPreview.laboratorio,
    };

    if (isProduction) {
      const auditEntries = buildAuditEntries({
        engineResults: evaluation,
        patientSnapshot,
        establishmentId: activeEstablishment?.id || '',
        resolutionLevel: activeEstablishment?.level || '',
      });
      addAuditEntries(auditEntries);
    }

    if (!evaluation.length) {
      setMessage('No se encontraron diagnósticos probables con los datos ingresados.');
    }
  };

  useEffect(() => {
    evaluateNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rules,
    evaluableRules,
    activeNtsVersion,
    activeEstablishment?.id,
    activeEstablishment?.level,
    activeEstablishment?.medicationsAvailable,
    activeEstablishment?.equipmentAvailable,
    patientPreview,
    unmetPolicy,
    isSimulation,
    isProduction,
  ]);

  const globalAlerts = results.flatMap((result) => result.alerts || []).filter(Boolean);

  const gatedResults = useMemo(() => {
    if (responsibilityAccepted) return results;

    return results.map((result) => ({
      ...result,
      treatmentPlan: {
        blocked: true,
        message: 'Plan terapéutico y dosis final bloqueados hasta confirmar responsabilidad clínica.',
      },
    }));
  }, [results, responsibilityAccepted]);

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <Card title="Evaluador clínico">
        <div style={{ fontSize: 13, border: '1px solid #ddd', borderRadius: 8, padding: 8, background: '#fafafa' }}>
          Modo actual: <strong>{isSimulation ? 'Simulación' : 'Producción'}</strong>
        </div>

        {message && (
          <div style={{ border: '1px solid #f0c36d', background: '#fff8e5', borderRadius: 8, padding: 10, marginTop: 8 }}>
            {message}
          </div>
        )}

        {Boolean(globalAlerts.length) && (
          <section style={{ border: '1px solid #e39', background: '#fff0f5', borderRadius: 8, padding: 12, marginTop: 8 }}>
            <h3 style={{ marginTop: 0 }}>Alertas de inventario/nivel resolutivo</h3>
            <ul style={{ marginBottom: 0 }}>
              {globalAlerts.map((alert, index) => (
                <li key={`alert-${index}`}>{alert}</li>
              ))}
            </ul>
          </section>
        )}
      </Card>

      <Card title="Datos clínicos del paciente">
        <section style={{ display: 'grid', gap: 8 }}>
          <label>
            Edad
            <input type="number" value={patientForm.edad} onChange={(e) => updatePatientField('edad', e.target.value)} />
          </label>

          <label>
            Peso (kg)
            <input type="number" value={patientForm.peso} onChange={(e) => updatePatientField('peso', e.target.value)} />
          </label>

          <label>
            Sexo
            <select value={patientForm.sexo} onChange={(e) => updatePatientField('sexo', e.target.value)}>
              <option value="F">F</option>
              <option value="M">M</option>
              <option value="Otro">Otro</option>
            </select>
          </label>

          <label>
            Síntomas (coma separados)
            <AutoCompleteInput
              listId="symptoms-ac"
              suggestions={SYMPTOM_SUGGESTIONS}
              value={patientForm.sintomas}
              onChange={(value) => updatePatientField('sintomas', value)}
            />
          </label>

          <label>
            Signos (coma separados)
            <AutoCompleteInput
              listId="signs-ac"
              suggestions={SIGN_SUGGESTIONS}
              value={patientForm.signos}
              onChange={(value) => updatePatientField('signos', value)}
            />
          </label>

          <label>
            Laboratorio - Hemoglobina
            <input type="number" value={patientForm.hemoglobina} onChange={(e) => updatePatientField('hemoglobina', e.target.value)} />
          </label>

          <label>
            Laboratorio - Sodio
            <input type="number" value={patientForm.sodio} onChange={(e) => updatePatientField('sodio', e.target.value)} />
          </label>

          <label>
            Política cuando no cumple recursos/nivel
            <select value={unmetPolicy} onChange={(e) => setUnmetPolicy(e.target.value)}>
              <option value="reference">Marcar como referencia</option>
              <option value="exclude">Excluir regla</option>
            </select>
          </label>

          <div style={{ fontSize: 13, color: '#444', background: '#f7f7f7', borderRadius: 6, padding: 8 }}>
            Establecimiento activo: <strong>{activeEstablishment?.name || '-'}</strong> ({activeEstablishment?.id || '-'}) | Nivel:{' '}
            <strong>{activeEstablishment?.level || '-'}</strong>
          </div>

          <button type="button" onClick={evaluateNow}>Ejecutar motor clínico</button>
        </section>
      </Card>

      {Boolean(results.length) && isProduction && !responsibilityAccepted && (
        <ResponsibilityGate
          onConfirm={({ simulateMode }) => {
            setResponsibilityAccepted(true);
            if (!simulateMode) {
              addResponsibilityAcceptance({ establishmentId: activeEstablishment?.id || '', simulateMode: false });
            }
          }}
        />
      )}

      <Card title="Resultado diagnóstico dinámico">
        <pre style={{ background: '#f8f8f8', borderRadius: 8, padding: 12, overflowX: 'auto', margin: 0 }}>
          {JSON.stringify(gatedResults, null, 2)}
        </pre>
      </Card>
    </section>
  );
};

export default ClinicalEvaluator;

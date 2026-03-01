import useAppModeStore from '../store/appModeStore';

function ClinicalEvaluator() {
  const { isProduction, operatorId } = useAppModeStore((state) => ({
    isProduction: state.isProduction,
    operatorId: state.operatorId,
  }));

  const clinicianId = isProduction ? operatorId : 'DEMO_CLINICIAN';

  return (
    <section>
      <h2>Clinical Evaluator</h2>
      <p>clinicianId: {clinicianId}</p>
    </section>
  );
}

export default ClinicalEvaluator;

import ClinicalEvaluator from './ClinicalEvaluator';
import OperatorGate from './OperatorGate';
import useAppModeStore from '../store/appModeStore';

function ClinicalWorkspace() {
  const { isProduction, operatorId } = useAppModeStore((state) => ({
    isProduction: state.isProduction,
    operatorId: state.operatorId,
  }));

  return (
    <main>
      {isProduction && !operatorId ? <OperatorGate /> : null}
      <ClinicalEvaluator />
    </main>
  );
}

export default ClinicalWorkspace;

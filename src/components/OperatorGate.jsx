import { useState } from 'react';
import useAppModeStore from '../store/appModeStore';

function OperatorGate() {
  const { isProduction, operatorId, setOperatorId } = useAppModeStore((state) => ({
    isProduction: state.isProduction,
    operatorId: state.operatorId,
    setOperatorId: state.setOperatorId,
  }));
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  if (!isProduction || operatorId) {
    return null;
  }

  const handleSubmit = () => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setError('Debe identificarse para usar modo producción');
      return;
    }

    setError('');
    setOperatorId(trimmedValue);
  };

  return (
    <section>
      <label htmlFor="operator-id-input">Código de operador (DNI o código establecimiento)</label>
      <input
        id="operator-id-input"
        type="text"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (error) {
            setError('');
          }
        }}
      />
      {error ? <p>{error}</p> : null}
      <button type="button" onClick={handleSubmit}>
        Ingresar a modo producción
      </button>
    </section>
  );
}

export default OperatorGate;

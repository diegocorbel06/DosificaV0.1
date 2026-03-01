import { create } from 'zustand';

const useAppModeStore = create((set) => ({
  isProduction: false,
  operatorId: '',
  setProductionMode: (isProduction) => set({ isProduction }),
  setOperatorId: (id) => set({ operatorId: id }),
}));

export default useAppModeStore;

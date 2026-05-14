import { create } from 'zustand';

const useLocationStore = create((set) => ({
  isLocationOpen: false,
  locationTitle: 'Delivery Location',
  locationFull: 'Select your address',
  isSet: false,

  openLocation: () => set({ isLocationOpen: true }),
  closeLocation: () => set({ isLocationOpen: false }),
  setLocation: (title, full) => set({
    locationTitle: title,
    locationFull: full,
    isLocationOpen: false,
    isSet: true,
  }),
}));

export default useLocationStore;

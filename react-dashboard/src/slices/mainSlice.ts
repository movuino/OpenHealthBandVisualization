import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SensorStatusI {
  name: string;
  status: boolean;
}

export interface MainState {
  connected: boolean;
  sensorStatuses: SensorStatusI[];
  acquisitionStarted: boolean;
}

const initialState: MainState = {
  connected: false,
  sensorStatuses: [
    { name: "MPU9250", status: false },
    { name: "MAX86141", status: false },
  ],
  acquisitionStarted: false,
};

export const mainSlice = createSlice({
  name: "main",
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    startAcquisition: (state) => {
      state.acquisitionStarted = true;
    },
    stopAcquisition: (state) => {
      state.acquisitionStarted = false;
    },
    setSensorStatuses: (state, action: PayloadAction<MainState["sensorStatuses"]>) => {
      state.sensorStatuses = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setConnected, startAcquisition, stopAcquisition, setSensorStatuses } = mainSlice.actions;

export default mainSlice.reducer;

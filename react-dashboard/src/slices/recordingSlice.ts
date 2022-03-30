import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type FileFormat = "csv" | "tsv";

export interface RecordConfig {
  properties: {
    Accelerometer: boolean;
    Gyroscope: boolean;
    Magnetometer: boolean;
    PPG1: boolean;
    PPG2: boolean;
    SNR1: boolean;
    SNR2: boolean;
  };
  format: FileFormat;
}

export const DEFAULT_RECORDING_PROPERTIES = {
  Accelerometer: true,
  Gyroscope: true,
  Magnetometer: true,
  PPG1: true,
  PPG2: true,
  SNR1: true,
  SNR2: true,
};

export interface RecordingState {
  isRecording: boolean;
  config: RecordConfig;
  filename: string;
  fileSize: number;
  linesRecorded: string[];
}

const initialState: RecordingState = {
  isRecording: false,
  config: { format: "csv", properties: DEFAULT_RECORDING_PROPERTIES },
  filename: "OHB_acquisition",
  fileSize: 0,
  linesRecorded: [],
};

export const recordingSlice = createSlice({
  name: "main",
  initialState,
  reducers: {
    startRecording: (state) => {
      state.isRecording = true;
    },
    stopRecording: (state) => {
      state.isRecording = false;
    },
    setFilename: (state, action: PayloadAction<string>) => {
      state.filename = action.payload;
    },
    setConfig: (state, action: PayloadAction<RecordConfig>) => {
      state.config = action.payload;
    },
    setLinesRecorded: (state, action: PayloadAction<string[]>) => {
      state.linesRecorded = action.payload;
    },
    setFileSize: (state, action: PayloadAction<number>) => {
      state.fileSize = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { startRecording, stopRecording, setFilename, setConfig, setLinesRecorded, setFileSize } = recordingSlice.actions;

export default recordingSlice.reducer;

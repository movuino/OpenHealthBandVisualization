import React, {
  useCallback,
  useState,
  useRef,
} from "react";
import "./App.css";
import {
  MantineProvider,
  AppShell,
  MediaQuery,
  ColorScheme,
  ColorSchemeProvider,
} from "@mantine/core";

import { useLocalStorage } from "@mantine/hooks";

import PPGConfigCard from "./PPGConfigCard";
import PlotCard from "./PlotCard";
import PPGPlotCard from "./PPGPlotCard";
import SideBar from "./SideBar";
import AppHeader from "./Header";
import RecordModal, {
  RecordConfig,
  DEFAULT_RECORDING_PROPERTIES,
} from "./RecordModal";
import ZoomOverlayOnClick from "./ZoomOverlayOnClick";

import {
  axis3I,
  monitorAccFactory,
  monitorGyrFactory,
  monitorMagFactory,
  monitorPpgFactory,
  monitorSnrFactory,
} from "./BleMonitoring";

import packageJson from '../package.json'

const BLE_ERROR_SERVICE_UUID = 0x1200;
const BLE_ERROR_CHAR_UUID = 0x1201;

const BLE_IMU_SERVICE_UUID = 0x1101;
const BLE_ACC_CHAR_UUID = 0x1102;
const BLE_GYR_CHAR_UUID = 0x1103;
const BLE_MAG_CHAR_UUID = 0x1104;

const BLE_PPG86_SERVICE_UUID = 0x1300;
const BLE_PPG1_CHAR_UUID = 0x1305;
const BLE_PPG2_CHAR_UUID = 0x1307;
const BLE_SNR1_CHAR_UUID = 0x1313;
const BLE_SNR2_CHAR_UUID = 0x1314;

const BLE_STARTSTOP_SERVICE_UUID = 0x1400;
const BLE_STARTSTOP_CHAR_UUID = 0x1401;

interface dataI {
  acc: axis3I;
  gyr: axis3I;
  mag: axis3I;
  ppg1: number[];
  ppg2: number[];
}

const SERIES_MAX_LENGTH = 50;

const generateFile = (lines: string[]) => {
  const blob = new Blob(lines, {type: 'text/csv'});
  console.log(blob);
  return blob;
}

function App() {
  const [deviceGatt, setDeviceGatt] =
    useState<BluetoothRemoteGATTServer | null>(null);
  const [errorBuffer, setErrorBuffer] = useState<Uint8Array>(
    new Uint8Array([1, 1, 1, 1])
  );
  const [data, setData] = useState<dataI>({
    acc: { x: [], y: [], z: [] },
    gyr: { x: [], y: [], z: [] },
    mag: { x: [], y: [], z: [] },
    ppg1: [],
    ppg2: [],
  });
  const accRef = useRef<axis3I>({ x: [], y: [], z: [] });
  const gyrRef = useRef<axis3I>({ x: [], y: [], z: [] });
  const magRef = useRef<axis3I>({ x: [], y: [], z: [] });
  const ppg1Ref = useRef<{ timestamp: number; value: number }[]>([]);
  const ppg2Ref = useRef<{ timestamp: number; value: number }[]>([]);
  const [snr1, setSnr1] = useState(0);
  const [snr2, setSnr2] = useState(0);

  const recordLineRef = useRef<string[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isRecordModalVisible, setRecordModalVisibility] = useState(false);
  const [recordConfig, setRecordConfig] = useState<RecordConfig>({
    format: "csv",
    properties: DEFAULT_RECORDING_PROPERTIES,
  });

  const [isConnected, setConnected] = useState(false);
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: "light",
  });

  const toggleColorScheme = useCallback(
    (value?: ColorScheme) => {
      setColorScheme(value || colorScheme === "dark" ? "light" : "dark");
    },
    [colorScheme, setColorScheme]
  );

  const toggleAcquisition = useCallback(
    async (state: boolean) => {
      const startstopService = await deviceGatt?.getPrimaryService(
        BLE_STARTSTOP_SERVICE_UUID
      );
      const startstopCharacteristic = await startstopService?.getCharacteristic(
        BLE_STARTSTOP_CHAR_UUID
      );
      if (startstopCharacteristic === undefined) return;
      startstopCharacteristic.writeValue(new Uint8Array([state ? 1 : 2]));
    },
    [deviceGatt]
  );

  const onConnectionButtonClick = useCallback(async () => {
    const deviceSelected = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        BLE_ERROR_SERVICE_UUID,
        BLE_IMU_SERVICE_UUID,
        BLE_PPG86_SERVICE_UUID,
        BLE_STARTSTOP_SERVICE_UUID,
      ],
    });
    const gattServer = await deviceSelected.gatt?.connect();
    if (gattServer === undefined) return;
    setDeviceGatt(gattServer);

    const errorService = await gattServer?.getPrimaryService(BLE_ERROR_SERVICE_UUID);
    const errorChar = await errorService?.getCharacteristic(BLE_ERROR_CHAR_UUID);
    setErrorBuffer(new Uint8Array((await errorChar?.readValue()).buffer));

    const imuService = await gattServer?.getPrimaryService(BLE_IMU_SERVICE_UUID);
    const accCharacteristic = await imuService?.getCharacteristic(BLE_ACC_CHAR_UUID);
    const gyrCharacteristic = await imuService?.getCharacteristic(BLE_GYR_CHAR_UUID);
    const magCharacteristic = await imuService?.getCharacteristic(BLE_MAG_CHAR_UUID);

    const ppgService = await gattServer?.getPrimaryService( BLE_PPG86_SERVICE_UUID);
    const ppg1Characteristic = await ppgService?.getCharacteristic(BLE_PPG1_CHAR_UUID);
    const ppg2Characteristic = await ppgService?.getCharacteristic(BLE_PPG2_CHAR_UUID);
    const snr1Characteristic = await ppgService?.getCharacteristic(BLE_SNR1_CHAR_UUID);
    const snr2Characteristic = await ppgService?.getCharacteristic(BLE_SNR2_CHAR_UUID);

    accCharacteristic.oncharacteristicvaluechanged = function (this: BluetoothRemoteGATTCharacteristic,ev: Event) {
      monitorAccFactory(accRef, SERIES_MAX_LENGTH).call(this, ev);
      setData({
        acc: accRef.current,
        gyr: gyrRef.current,
        mag: magRef.current,
        ppg1: ppg1Ref.current.map((e) => e.value),
        ppg2: ppg2Ref.current.map((e) => e.value),
      });
    };
    accCharacteristic.startNotifications();

    gyrCharacteristic.oncharacteristicvaluechanged = monitorGyrFactory(gyrRef, SERIES_MAX_LENGTH);
    gyrCharacteristic.startNotifications();

    magCharacteristic.oncharacteristicvaluechanged = monitorMagFactory(magRef, SERIES_MAX_LENGTH);
    magCharacteristic.startNotifications();

    ppg1Characteristic.oncharacteristicvaluechanged = monitorPpgFactory(ppg1Ref, SERIES_MAX_LENGTH);
    ppg1Characteristic.startNotifications();

    ppg2Characteristic.oncharacteristicvaluechanged = monitorPpgFactory(ppg2Ref, SERIES_MAX_LENGTH);
    ppg2Characteristic.startNotifications();

    snr1Characteristic.oncharacteristicvaluechanged = monitorSnrFactory(setSnr1);
    snr1Characteristic.startNotifications();

    snr2Characteristic.oncharacteristicvaluechanged = monitorSnrFactory(setSnr2);
    snr2Characteristic.startNotifications();

    setConnected(true);
  }, []);

  const startRecording = useCallback(async (config: RecordConfig) => {
    setRecordModalVisibility(false);
    setIsRecording(true);
    setRecordConfig(config);
    console.log(config);

    const imuService = await deviceGatt?.getPrimaryService(BLE_IMU_SERVICE_UUID);
    if (imuService === undefined) return;

    const accCharacteristic = await imuService?.getCharacteristic(BLE_ACC_CHAR_UUID);

    accCharacteristic!.oncharacteristicvaluechanged = function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
      console.log("recording", recordLineRef.current?.length);
      monitorAccFactory(accRef, SERIES_MAX_LENGTH).call(this, ev);
      setData({
        acc: accRef.current,
        gyr: gyrRef.current,
        mag: magRef.current,
        ppg1: ppg1Ref.current.map((e) => e.value),
        ppg2: ppg2Ref.current.map((e) => e.value),
      });

      const line = [];
      if (config.properties.Accelerometer && Object.values(accRef.current).every((arr) => arr.length)) {
        line.push(accRef.current.x.at(-1));
        line.push(accRef.current.y.at(-1));
        line.push(accRef.current.z.at(-1));
      }
      if (config.properties.Gyroscope && Object.values(gyrRef.current).every((arr) => arr.length)) {
        line.push(gyrRef.current.x.at(-1));
        line.push(gyrRef.current.y.at(-1));
        line.push(gyrRef.current.z.at(-1));
      }
      if (config.properties.Magnetometer && Object.values(magRef.current).every((arr) => arr.length)) {
        line.push(magRef.current.x.at(-1));
        line.push(magRef.current.y.at(-1));
        line.push(magRef.current.z.at(-1));
      }
      if (config.properties.PPG1 && ppg1Ref.current.length) {
        line.push(ppg1Ref.current[ppg1Ref.current.length - 1].value);
      }
      if (config.properties.PPG2 && ppg2Ref.current.length) {
        line.push(ppg2Ref.current[ppg2Ref.current.length - 1].value);
      }
      if (config.properties.SNR1) {
        line.push(snr1);
      }
      if (config.properties.SNR2) {
        line.push(snr2);
      }
      recordLineRef.current?.push(
        line.join(config.format === "csv" ? "," : "\t")
      );
    };
  }, [deviceGatt, snr1, snr2])

  const finishRecording = useCallback(async () => {
    console.log("finishRecording");
    setIsRecording(false);
    console.log(recordLineRef.current);
    generateFile(['hello'])

    const imuService = await deviceGatt?.getPrimaryService(BLE_IMU_SERVICE_UUID);
    if (imuService === undefined) return;
    const accCharacteristic = await imuService?.getCharacteristic(BLE_ACC_CHAR_UUID);

    accCharacteristic!.oncharacteristicvaluechanged = function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
      console.log("recording", recordLineRef.current?.length);
      monitorAccFactory(accRef, SERIES_MAX_LENGTH).call(this, ev);
      setData({
        acc: accRef.current,
        gyr: gyrRef.current,
        mag: magRef.current,
        ppg1: ppg1Ref.current.map((e) => e.value),
        ppg2: ppg2Ref.current.map((e) => e.value),
      })
    }
  }, [deviceGatt, ])


  return (
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider
        theme={{
          colorScheme: colorScheme,
          fontFamily: "Nunito",
          headings: { fontFamily: "Nunito" },
          breakpoints: {
            xs: 500,
            sm: 800,
            md: 1000,
            lg: 1200,
            xl: 1400,
          },
        }}
      >
        <AppShell
          fixed
          padding="md"
          header={<AppHeader version={packageJson.version}/>}
          navbar={
            <SideBar
              isRecording={isRecording}
              onRecordButtonClick={() =>
                isRecording ? finishRecording() : setRecordModalVisibility(true)
              }
              disabled={!isConnected}
              onConnectionButtonClick={onConnectionButtonClick}
              onStartButtonClick={() => toggleAcquisition(true)}
              onStopButtonClick={() => toggleAcquisition(false)}
              statuses={[
                { name: "MAX86150", status: !errorBuffer[0] },
                { name: "MPU9250", status: !errorBuffer[1] },
              ]}
            />
          }
          styles={(theme) => ({
            main: {
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[0],
            },
          })}
        >
          <RecordModal
            opened={isRecordModalVisible}
            onClose={() => setRecordModalVisibility(false)}
            onValidate={startRecording}
          />
          <MediaQuery smallerThan="lg" styles={{ display: "none !important" }}>
            <main className="main-container">
              <div className="main-flex-column">
                <ZoomOverlayOnClick>
                  <PlotCard
                    title="Accelerometer"
                    data={[data.acc.x, data.acc.y, data.acc.z]}
                    colors={["#8CE99A", "#74C0FC", "#FF8787"]}
                    recording={
                      isRecording && recordConfig.properties.Accelerometer
                    }
                  />
                </ZoomOverlayOnClick>
                <ZoomOverlayOnClick>
                  <PlotCard
                    title="Gyroscope"
                    data={[data.gyr.x, data.gyr.y, data.gyr.z]}
                    colors={["#8CE99A", "#74C0FC", "#FF8787"]}
                    recording={isRecording && recordConfig.properties.Gyroscope}
                  />
                </ZoomOverlayOnClick>
                <ZoomOverlayOnClick>
                  <PlotCard
                    title="Magnetometer"
                    data={[data.mag.x, data.mag.y, data.mag.z]}
                    colors={["#8CE99A", "#74C0FC", "#FF8787"]}
                    recording={
                      isRecording && recordConfig.properties.Magnetometer
                    }
                  />
                </ZoomOverlayOnClick>
              </div>
              <div className="main-flex-column">
                <ZoomOverlayOnClick>
                  <PPGPlotCard
                    title="PPG1"
                    data={[data.ppg1]}
                    colors={["#8CE99A"]}
                    snr={snr1}
                    recording={isRecording}
                  />
                </ZoomOverlayOnClick>
                <ZoomOverlayOnClick>
                  <PPGPlotCard
                    title="PPG2"
                    data={[data.ppg2]}
                    colors={["#74C0FC"]}
                    snr={snr2}
                    recording={isRecording}
                  />
                </ZoomOverlayOnClick>
                <div style={{ height: "100%" }}>
                  <PPGConfigCard gattServer={deviceGatt} />
                </div>
              </div>
            </main>
          </MediaQuery>
          <MediaQuery largerThan="lg" styles={{ display: "none !Important" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ height: 300 }}>
                {/* <PlotCard
                      title="Accelerometer"
                      data={[data.acc.x, data.acc.y, data.acc.z]}
                      colors={["#8CE99A", "#74C0FC", "#FF8787"]}
                    />
                </div>
                <div style={{height: 300}}>
                <PlotCard
                    title="Gyroscope"
                    data={[data.gyr.x, data.gyr.y, data.gyr.z]}
                    colors={["#8CE99A", "#74C0FC", "#FF8787"]}
                  />
                </div>
                <div style={{height: 300}}>
                <PlotCard
                    title="Magnetometer"
                    data={[data.mag.x, data.mag.y, data.mag.z]}
                    colors={["#8CE99A", "#74C0FC", "#FF8787"]}
                  />
                </div>
                <div style={{height: 300}}>
                <PlotCard
                    title="Magnetometer"
                    data={[data.mag.x, data.mag.y, data.mag.z]}
                    colors={["#8CE99A", "#74C0FC", "#FF8787"]}
                  /> */}
              </div>
            </div>
          </MediaQuery>
        </AppShell>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export default App;

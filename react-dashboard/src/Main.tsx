import React, {
    useState,
    useRef,
    useEffect,
} from "react";
import "./App.css";
import {
    MediaQuery,
} from "@mantine/core";

import PPGConfigCard from "./PPGConfigCard";
import PlotCard from "./PlotCard";
import PPGPlotCard from "./PPGPlotCard";
import ZoomOverlayOnClick from "./ZoomOverlayOnClick";

import {
    axis3I,
    monitorAccFactory,
    monitorGyrFactory,
    monitorMagFactory,
    monitorPpgFactory,
    readSnr,
} from "./BleMonitoring";

import { useInterval } from "./customHooks";


import { SensorStatusI, setSensorStatuses } from "./slices/mainSlice";
import { useAppDispatch, useAppSelector } from "./store";
import { setLinesRecorded } from './slices/recordingSlice'


import {
    BLE_ERROR_SERVICE_UUID,
    BLE_ERROR_CHAR_UUID,
    BLE_IMU_SERVICE_UUID,
    BLE_ACC_CHAR_UUID,
    BLE_GYR_CHAR_UUID,
    BLE_MAG_CHAR_UUID,
    BLE_PPG86_SERVICE_UUID,
    BLE_PPG1_CHAR_UUID,
    BLE_PPG2_CHAR_UUID,
    BLE_SNR1_CHAR_UUID,
    BLE_SNR2_CHAR_UUID
} from './BLE'

const SERIES_MAX_LENGTH = 100;

interface MainProps {
    gattServer: BluetoothRemoteGATTServer | null;
}

const Main: React.FC<MainProps> = ({ gattServer }) => {
    const dispatch = useAppDispatch();
    const isRecording = useAppSelector(state => state.recording.isRecording);
    const recordingConfig = useAppSelector(state => state.recording.config)
    const isConnected = useAppSelector(state => state.main.connected);
    const acquisitionStarted = useAppSelector(state => state.main.acquisitionStarted)

    // const theme = useMantineTheme();

    const accRef = useRef<axis3I>({ x: [], y: [], z: [] });
    const gyrRef = useRef<axis3I>({ x: [], y: [], z: [] });
    const magRef = useRef<axis3I>({ x: [], y: [], z: [] });
    const ppg1Ref = useRef<{ timestamp: number; value: number }[]>([]);
    const ppg2Ref = useRef<{ timestamp: number; value: number }[]>([]);
    const [snr1Char, setSnr1Char] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
    const [snr2Char, setSnr2Char] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
    const [snr1, setSnr1] = useState(0);
    const [snr2, setSnr2] = useState(0);
    const snr1ref = useRef<number>(0);
    const snr2ref = useRef<number>(0);

    const [accSwitchIsOn, setAccSwicth] = useState(true);
    const [gyrSwitchIsOn, setGyrSwicth] = useState(true);
    const [magSwitchIsOn, setMagSwicth] = useState(true);
    const [ppg1SwitchIsOn, setPpg1Swicth] = useState(true);
    const [ppg2SwitchIsOn, setPpg2Swicth] = useState(true);

    const recordingRef = useRef<string[]>([]);

    useInterval(() => {
        if (!acquisitionStarted) return;
        if (snr1Char && ppg1SwitchIsOn) {
            readSnr(snr1Char, setSnr1, snr1ref);
        }
        if (snr2Char && ppg2SwitchIsOn) {
            readSnr(snr2Char, setSnr2, snr2ref);
        }
    }, 1000)


    useEffect(() => {
        if (!gattServer) return;
        (async () => {
            console.log(`===> Connected to ${gattServer.device.name} <===`)

            const errorService = await gattServer?.getPrimaryService(BLE_ERROR_SERVICE_UUID);
            const errorChar = await errorService?.getCharacteristic(BLE_ERROR_CHAR_UUID);
            const errorBuff = (await errorChar?.readValue())
            const sensorStatuses: SensorStatusI[] = [
                { name: 'MPU9250', status: !errorBuff.getUint8(0) },
                { name: 'MAX86141', status: !errorBuff.getUint8(1) }
            ]
            console.log("Sensor Statuses", sensorStatuses);
            dispatch(setSensorStatuses(sensorStatuses));

            console.log("==> Fetching services and charatceristics <==")
            const imuService = await gattServer.getPrimaryService(BLE_IMU_SERVICE_UUID);
            const accCharacteristic = await imuService.getCharacteristic(BLE_ACC_CHAR_UUID);
            const gyrCharacteristic = await imuService.getCharacteristic(BLE_GYR_CHAR_UUID);
            const magCharacteristic = await imuService.getCharacteristic(BLE_MAG_CHAR_UUID);

            const ppgService = await gattServer?.getPrimaryService(BLE_PPG86_SERVICE_UUID);
            const ppg1Characteristic = await ppgService.getCharacteristic(BLE_PPG1_CHAR_UUID);
            const ppg2Characteristic = await ppgService.getCharacteristic(BLE_PPG2_CHAR_UUID);
            const snr1Characteristic = await ppgService.getCharacteristic(BLE_SNR1_CHAR_UUID);
            const snr2Characteristic = await ppgService.getCharacteristic(BLE_SNR2_CHAR_UUID);

            console.log("IMU Service : ", imuService);
            console.log('Characteristics : ')
            console.log("\t\t Acceleromter : ", accCharacteristic.uuid)
            console.log("\t\t Gyroscope : ", gyrCharacteristic.uuid)
            console.log("\t\t Magnetometer : ", magCharacteristic.uuid)
            console.log()
            console.log("PPG Service : ", ppgService);
            console.log('Characteristics : ')
            console.log("\t\t PPG1: ", ppg1Characteristic.uuid);
            console.log("\t\t PPG2: ", ppg2Characteristic.uuid);
            console.log("\t\t SNR1: ", snr1Characteristic.uuid);
            console.log("\t\t SNR2: ", snr2Characteristic.uuid);
            console.log()

        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gattServer])

    useEffect(() => {
        if (!gattServer || !isConnected) return;
        (async () => {
            const imuService = await gattServer.getPrimaryService(BLE_IMU_SERVICE_UUID);
            const accCharacteristic = await imuService.getCharacteristic(BLE_ACC_CHAR_UUID);
            const gyrCharacteristic = await imuService.getCharacteristic(BLE_GYR_CHAR_UUID);
            const magCharacteristic = await imuService.getCharacteristic(BLE_MAG_CHAR_UUID);

            const ppgService = await gattServer?.getPrimaryService(BLE_PPG86_SERVICE_UUID);
            const ppg1Characteristic = await ppgService.getCharacteristic(BLE_PPG1_CHAR_UUID);
            const ppg2Characteristic = await ppgService.getCharacteristic(BLE_PPG2_CHAR_UUID);
            const snr1Characteristic = await ppgService.getCharacteristic(BLE_SNR1_CHAR_UUID);
            const snr2Characteristic = await ppgService.getCharacteristic(BLE_SNR2_CHAR_UUID);

            if (isRecording) {
                recordingRef.current = [];

                let targetCharacteristic: BluetoothRemoteGATTCharacteristic;
                let idleFunction: any;
                if (recordingConfig.properties.PPG2) {
                    targetCharacteristic = ppg2Characteristic;
                    idleFunction = monitorPpgFactory(ppg2Ref, 'svg-ppg2', SERIES_MAX_LENGTH);
                } else if (recordingConfig.properties.PPG1) {
                    targetCharacteristic = ppg1Characteristic;
                    idleFunction = monitorPpgFactory(ppg1Ref, 'svg-ppg1', SERIES_MAX_LENGTH);
                } else if (recordingConfig.properties.Magnetometer) {
                    targetCharacteristic = magCharacteristic;
                    idleFunction = monitorMagFactory(magRef, 'svg-mag', SERIES_MAX_LENGTH);
                } else if (recordingConfig.properties.Gyroscope) {
                    targetCharacteristic = gyrCharacteristic;
                    idleFunction = monitorGyrFactory(gyrRef, 'svg-gyr', SERIES_MAX_LENGTH);
                } else if (recordingConfig.properties.Accelerometer) {
                    targetCharacteristic = accCharacteristic;
                    idleFunction = monitorAccFactory(accRef, 'svg-acc', SERIES_MAX_LENGTH);
                }

                console.log("==> Binding Recording Notification Callbacks <==");
                console.log("Config: ", recordingConfig);
                console.log("Target characteristic is : ", targetCharacteristic!.uuid);
                targetCharacteristic!.oncharacteristicvaluechanged = function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
                    idleFunction.call(this, ev);

                    const timestamp = this.value?.getUint32(0);
                    const line = [timestamp];
                    if (recordingConfig.properties.Accelerometer && Object.values(accRef.current).every((arr) => arr.length)) {
                        line.push(accRef.current.x.at(-1));
                        line.push(accRef.current.y.at(-1));
                        line.push(accRef.current.z.at(-1));
                    }
                    if (recordingConfig.properties.Gyroscope && Object.values(gyrRef.current).every((arr) => arr.length)) {
                        line.push(gyrRef.current.x.at(-1));
                        line.push(gyrRef.current.y.at(-1));
                        line.push(gyrRef.current.z.at(-1));
                    }
                    if (recordingConfig.properties.Magnetometer && Object.values(magRef.current).every((arr) => arr.length)) {
                        line.push(magRef.current.x.at(-1));
                        line.push(magRef.current.y.at(-1));
                        line.push(magRef.current.z.at(-1));
                    }
                    if (recordingConfig.properties.PPG1 && ppg1Ref.current.length) {
                        line.push(ppg1Ref.current[ppg1Ref.current.length - 1].value);
                    }
                    if (recordingConfig.properties.PPG2 && ppg2Ref.current.length) {
                        line.push(ppg2Ref.current[ppg2Ref.current.length - 1].value);
                    }
                    if (recordingConfig.properties.SNR1) {
                        line.push(snr1ref.current);
                    }
                    if (recordingConfig.properties.SNR2) {
                        line.push(snr2ref.current);
                    }
                    recordingRef.current?.push(
                        line.join(recordingConfig.format === "csv" ? "," : "\t")
                    );
                    console.log(recordingRef.current);
                }
                ppg2Characteristic.startNotifications();
                setAccSwicth(recordingConfig.properties.Accelerometer);
                setGyrSwicth(recordingConfig.properties.Gyroscope);
                setMagSwicth(recordingConfig.properties.Magnetometer);
                setPpg1Swicth(recordingConfig.properties.PPG1);
                setPpg2Swicth(recordingConfig.properties.PPG2);


            } else {
                if (recordingRef.current.length) {
                    dispatch(setLinesRecorded(recordingRef.current));
                    recordingRef.current = [];
                }

                console.log("==> Binding Idle Notification Callbacks <==")
                accCharacteristic.oncharacteristicvaluechanged = monitorAccFactory(accRef, 'svg-acc', SERIES_MAX_LENGTH);
                setAccSwicth(true);

                gyrCharacteristic.oncharacteristicvaluechanged = monitorGyrFactory(gyrRef, 'svg-gyr', SERIES_MAX_LENGTH);
                setGyrSwicth(true);

                magCharacteristic.oncharacteristicvaluechanged = monitorMagFactory(magRef, 'svg-mag', SERIES_MAX_LENGTH);
                setMagSwicth(true);

                ppg1Characteristic.oncharacteristicvaluechanged = monitorPpgFactory(ppg1Ref, 'svg-ppg1', SERIES_MAX_LENGTH);
                setPpg1Swicth(true);

                ppg2Characteristic.oncharacteristicvaluechanged = monitorPpgFactory(ppg2Ref, 'svg-ppg2', SERIES_MAX_LENGTH);
                setPpg2Swicth(true);

                setSnr1Char(snr1Characteristic);
                setSnr2Char(snr2Characteristic);
            }
        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gattServer, isRecording, isConnected, recordingConfig])

    useEffect(() => {
        if (!gattServer) return;
        (async () => {
            const imuService = await gattServer.getPrimaryService(BLE_IMU_SERVICE_UUID);
            const accCharacteristic = await imuService.getCharacteristic(BLE_ACC_CHAR_UUID);
            if (accSwitchIsOn)
                accCharacteristic.startNotifications();
            else
                accCharacteristic.stopNotifications();
        })();

    }, [accSwitchIsOn, gattServer])

    useEffect(() => {
        if (!gattServer) return;
        (async () => {
            const imuService = await gattServer.getPrimaryService(BLE_IMU_SERVICE_UUID);
            const Characteristic = await imuService.getCharacteristic(BLE_GYR_CHAR_UUID);
            if (gyrSwitchIsOn)
                Characteristic.startNotifications();
            else
                Characteristic.stopNotifications();
        })();

    }, [gyrSwitchIsOn, gattServer])

    useEffect(() => {
        if (!gattServer) return;
        (async () => {
            const imuService = await gattServer.getPrimaryService(BLE_IMU_SERVICE_UUID);
            const Characteristic = await imuService.getCharacteristic(BLE_MAG_CHAR_UUID);
            if (magSwitchIsOn)
                Characteristic.startNotifications();
            else
                Characteristic.stopNotifications();
        })();

    }, [magSwitchIsOn, gattServer])

    useEffect(() => {
        if (!gattServer) return;
        (async () => {
            const ppgService = await gattServer?.getPrimaryService(BLE_PPG86_SERVICE_UUID);
            const Characteristic = await ppgService.getCharacteristic(BLE_PPG1_CHAR_UUID);
            if (ppg1SwitchIsOn)
                Characteristic.startNotifications();
            else
                Characteristic.stopNotifications();
        })();

    }, [ppg1SwitchIsOn, gattServer])

    useEffect(() => {
        if (!gattServer) return;
        (async () => {
            const ppgService = await gattServer?.getPrimaryService(BLE_PPG86_SERVICE_UUID);
            const Characteristic = await ppgService.getCharacteristic(BLE_PPG2_CHAR_UUID);
            if (ppg2SwitchIsOn)
                Characteristic.startNotifications();
            else
                Characteristic.stopNotifications();
        })();

    }, [ppg2SwitchIsOn, gattServer])


    return (
        <>
            <MediaQuery smallerThan="lg" styles={{ display: "none !important" }}>
                <main className="main-container">
                    <div className="main-flex-column">
                        <ZoomOverlayOnClick>
                        <div className="tour-sensor-card" style={{height: "100%"}}>
                            <PlotCard

                                switchValue={accSwitchIsOn}
                                onSwitchChange={setAccSwicth}
                                disableSwitch={isRecording}
                                initialData={[accRef.current.x, accRef.current.y, accRef.current.z]}
                                initialColors={["#8CE99A", "#74C0FC", "#FF8787"]}
                                svgClassName="svg-acc"
                                title="Accelerometer"
                                recording={
                                    isRecording && recordingConfig.properties.Accelerometer
                                }
                            />
                            </div>
                        </ZoomOverlayOnClick>
                        <ZoomOverlayOnClick>
                        <PlotCard
                                switchValue={gyrSwitchIsOn}
                                onSwitchChange={setGyrSwicth}
                                disableSwitch={isRecording}
                                initialData={[gyrRef.current.x, gyrRef.current.y, gyrRef.current.z]}
                                initialColors={["#8CE99A", "#74C0FC", "#FF8787"]}
                                svgClassName="svg-gyr"
                                title="Gyroscope"
                                recording={
                                    isRecording && recordingConfig.properties.Gyroscope
                                }
                            />
                            
                        </ZoomOverlayOnClick>
                        <ZoomOverlayOnClick>
                            <PlotCard
                                switchValue={magSwitchIsOn}
                                onSwitchChange={setMagSwicth}
                                disableSwitch={isRecording}
                                initialData={[magRef.current.x, magRef.current.y, magRef.current.z]}
                                initialColors={["#8CE99A", "#74C0FC", "#FF8787"]}
                                svgClassName="svg-mag"
                                title="Magnetometer"
                                recording={
                                    isRecording && recordingConfig.properties.Magnetometer
                                }
                            />
                        </ZoomOverlayOnClick>
                    </div>
                    <div className="main-flex-column">
                        <ZoomOverlayOnClick>
                            <PPGPlotCard
                                switchValue={ppg1SwitchIsOn}
                                onSwitchChange={setPpg1Swicth}
                                disableSwitch={isRecording}
                                title="PPG1"
                                svgClassName="svg-ppg1"
                                initialData={[ppg1Ref.current.map(e => e.value)]}
                                initialColors={["#8CE99A"]}
                                snr={snr1}
                                recording={isRecording && recordingConfig.properties.PPG1}
                            />
                        </ZoomOverlayOnClick>
                        <ZoomOverlayOnClick>
                            <PPGPlotCard
                                switchValue={ppg2SwitchIsOn}
                                onSwitchChange={setPpg2Swicth}
                                disableSwitch={isRecording}
                                title="PPG2"
                                svgClassName="svg-ppg2"
                                initialData={[ppg2Ref.current.map(e => e.value)]}
                                initialColors={["#74C0FC"]}
                                snr={snr2}
                                recording={isRecording && recordingConfig.properties.PPG2}
                            />
                        </ZoomOverlayOnClick>
                        <div style={{ height: "100%" }}>
                            <PPGConfigCard gattServer={gattServer} />
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
        </>
    );
}

export default Main;

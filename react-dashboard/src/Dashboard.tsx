import React, {
    useCallback,
    useState,
    useRef,
    useEffect,
    useMemo,
} from "react";
import "./App.css";
import {
    AppShell,
    MediaQuery,
    Text,
    Button,
    useMantineTheme
} from "@mantine/core";

import { StepType, useTour } from '@reactour/tour'

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

const generateFile = (header: string, lines: string[], extension: string) => {
    lines.unshift(header);
    const blob = new Blob([lines.join('\n')], { type: `text/${extension}` });
    console.log(blob);
    return blob;
}

function Dashboard() {
    const theme = useMantineTheme();
    const { setIsOpen, setSteps, setCurrentStep } = useTour()
    const [deviceGatt, setDeviceGatt] = useState<BluetoothRemoteGATTServer | null>(null);
    const [errorBuffer, setErrorBuffer] = useState<Uint8Array>(new Uint8Array([1, 1, 1, 1]));

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

    const [downloadFileName, setDownloadFileName] = useState('OHB_acquisition');
    const [fileBlob, setFileBlob] = useState<Blob | null>(null);
    const downloadLinkRef = useRef<HTMLAnchorElement>(null);
    const recordLineRef = useRef<string[]>([]);

    const [isRecording, setIsRecording] = useState(false);
    const [isRecordModalVisible, setRecordModalVisibility] = useState(false);
    const [recordConfig, setRecordConfig] = useState<RecordConfig>({
        format: "csv",
        properties: DEFAULT_RECORDING_PROPERTIES,
    });

    /** Local storage viariable used to check if it is the first time the user visit the app */
    const [newUser, setNewUser] = useLocalStorage<boolean>({
        key: "ohb-dashboard-new",
        defaultValue: true,
    });

    /** Steps for the tour */
    const tourSteps: StepType[] = useMemo(() => {
        return [
            {
                selector: '.tour-step-0',
                content: (<div>
                    <Text mb={'xl'}>Welcome to the <span style={{ fontWeight: 'bold', color: theme.colors.blue[6] }}>Movuino Open Health Band Dashboard</span> ! <br />Would you like a quick tour ?</Text>
                    <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>No, thx</Button>
                        <Button onClick={() => setCurrentStep(1)}>Yes, I'd love to !</Button>
                    </div>
                </div>),
                position: 'center'

            },
            {
                selector: '.tour-step-1',
                content: (<Text>This is the <span style={{ fontWeight: 'bold', color: theme.colors.blue[6] }}>Big Blue Button</span> !<br /> <span style={{ fontWeight: 'bold' }}>Click</span> on it to connect to your Movuino</Text>)
            }, {
                selector: '.tour-step-2',
                content: (<Text>Here you can see the status of the sensors. <br /><span style={{ fontWeight: 'bold', color: theme.colors.red[6] }}>Red</span> is usually not good news...</Text>)
            },
            {
                selector: '.tour-step-3',
                content: (<Text>These are the <span style={{ fontWeight: 'bold', color: theme.colors.green[6] }}>Start</span> and <span style={{ fontWeight: 'bold', color: theme.colors.red[6] }}>Stop</span> buttons. <br />Use them to toggle the data acquisition</Text>)
            },
            {
                selector: '.tour-step-4',
                content: (<Text>This is the <span style={{ fontWeight: 'bold', color: theme.colors.green[6] }}>Record</span> button.<br /><span style={{ fontWeight: 'bold' }}>Click</span> on it to record the data streamed from the Movuino.</Text>)
            },
            {
                selector: '.tour-step-5',
                content: (<Text>Here you can <span style={{ fontWeight: 'bold' }}>change the name</span> of the file containing your precious data.</Text>)
            },
            {
                selector: '.tour-step-6',
                content: (<Text>This is the <span style={{ fontWeight: 'bold', color: theme.colors.blue[6] }}>Download</span> button.<br /><span style={{ fontWeight: 'bold' }}>Click</span> on it to download the text file containing your data.</Text>)
            },
            {
                selector: '.tour-step-7',
                content: (<Text><span style={{ fontWeight: 'bold' }}>Click</span> here to toggle between <span style={{ fontWeight: 'bold', color: theme.colors.blue[9] }}>Dark</span> and <span style={{ fontWeight: 'bold', color: theme.colors.yellow[5] }}>Light</span> mode.</Text>),

            },
            {
                selector: '.tour-step-8',
                content: (<div>
                    <Text style={{ fontWeight: 'bold' }}>And... That's it !</Text>
                    <Text mb='xl'>Your data is waiting for you !</Text>
                    <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                        <Button onClick={() => setIsOpen(false)}>Let's go !</Button>
                    </div>
                </div>),
                position: 'center'

            },
        ]
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const [isConnected, setConnected] = useState(false);
    useEffect(() => {
        setSteps(tourSteps);
        if (newUser) {
            setIsOpen(newUser)
        }
        setNewUser(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newUser])

    /** Start or stop the acquisition by sending 1 or 2 on the STARTSTOP characteristic. */
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

    /** Callback triggered when the user connects to the device from the Chrome built-in BLE dialog */
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

        // Store the GATT server for later use.
        setDeviceGatt(gattServer);

        // Check the error characteristic
        const errorService = await gattServer?.getPrimaryService(BLE_ERROR_SERVICE_UUID);
        const errorChar = await errorService?.getCharacteristic(BLE_ERROR_CHAR_UUID);
        setErrorBuffer(new Uint8Array((await errorChar?.readValue()).buffer));

        // Get all the characteristic for all the disired services
        const imuService = await gattServer?.getPrimaryService(BLE_IMU_SERVICE_UUID);
        const accCharacteristic = await imuService?.getCharacteristic(BLE_ACC_CHAR_UUID);
        const gyrCharacteristic = await imuService?.getCharacteristic(BLE_GYR_CHAR_UUID);
        const magCharacteristic = await imuService?.getCharacteristic(BLE_MAG_CHAR_UUID);

        const ppgService = await gattServer?.getPrimaryService(BLE_PPG86_SERVICE_UUID);
        const ppg1Characteristic = await ppgService?.getCharacteristic(BLE_PPG1_CHAR_UUID);
        const ppg2Characteristic = await ppgService?.getCharacteristic(BLE_PPG2_CHAR_UUID);
        const snr1Characteristic = await ppgService?.getCharacteristic(BLE_SNR1_CHAR_UUID);
        const snr2Characteristic = await ppgService?.getCharacteristic(BLE_SNR2_CHAR_UUID);

        // Set the onNotify callback for all the characteristics to monitor.
        // All those callback won't modify the state of the App to not trigger an excecive amount or rerenders.
        // Data are stored into Refs and only one characteristic will act as the `master` and trigger a update the state for all
        // the characteristics when it is notified.
        accCharacteristic.oncharacteristicvaluechanged = function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
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

        // Set the state to connected to enable the disabled buttons
        setConnected(true);
    }, []);

    /**
     * Callback called when the user validates the recording form 
     * @param {RecordConfig} config - the recording configuration with the characteristics to store and the file format.
     */
    const startRecording = useCallback(async (config: RecordConfig) => {
        setRecordModalVisibility(false);
        setIsRecording(true);
        setRecordConfig(config);
        setFileBlob(null);
        console.log(config);

        const imuService = await deviceGatt?.getPrimaryService(BLE_IMU_SERVICE_UUID);
        if (imuService === undefined) return;

        const accCharacteristic = await imuService?.getCharacteristic(BLE_ACC_CHAR_UUID);

        // We modify the `master` characteristic responsible for state updates to also store the data permanently
        accCharacteristic!.oncharacteristicvaluechanged = function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
            console.log("recording ", recordLineRef.current?.length);
            monitorAccFactory(accRef, SERIES_MAX_LENGTH).call(this, ev);
            setData({
                acc: accRef.current,
                gyr: gyrRef.current,
                mag: magRef.current,
                ppg1: ppg1Ref.current.map((e) => e.value),
                ppg2: ppg2Ref.current.map((e) => e.value),
            });

            const timestamp = this.value?.getUint32(0);
            const line = [timestamp];
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


    /** Callback triggered when the user stops the recording */
    const finishRecording = useCallback(async () => {
        console.log("finishRecording");
        setIsRecording(false);
        console.log(recordLineRef.current);

        // Create the file headers
        const headers = ['timestamp'];
        if (recordConfig.properties.Accelerometer)
            headers.push('acc_x', 'acc_y', 'acc_z');
        if (recordConfig.properties.Gyroscope)
            headers.push('gyr_x', 'gyr_y', 'gyr_z');
        if (recordConfig.properties.Magnetometer)
            headers.push('mag_x', 'mag_y', 'mag_z');
        if (recordConfig.properties.PPG1)
            headers.push('ppg1');
        if (recordConfig.properties.PPG2)
            headers.push('ppg2');
        if (recordConfig.properties.SNR1)
            headers.push('snr1')
        if (recordConfig.properties.SNR2)
            headers.push('snr2')
        const header = recordConfig.format === 'csv' ? headers.join(',') : headers.join('\t');

        setFileBlob(generateFile(header, recordLineRef.current, recordConfig.format));

        // Reset the `master` characteristic monitoring callback to its default
        const imuService = await deviceGatt?.getPrimaryService(BLE_IMU_SERVICE_UUID);
        if (imuService === undefined) return;
        const accCharacteristic = await imuService?.getCharacteristic(BLE_ACC_CHAR_UUID);
        accCharacteristic!.oncharacteristicvaluechanged = function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
            monitorAccFactory(accRef, SERIES_MAX_LENGTH).call(this, ev);
            setData({
                acc: accRef.current,
                gyr: gyrRef.current,
                mag: magRef.current,
                ppg1: ppg1Ref.current.map((e) => e.value),
                ppg2: ppg2Ref.current.map((e) => e.value),
            })
        }
    }, [deviceGatt, recordConfig])

    /** Function used to trigger a file download from the user browser */
    const downloadFile = () => {
        if (downloadLinkRef.current && fileBlob) {
            console.log(downloadFileName)
            downloadLinkRef.current.download = downloadFileName + '.' + recordConfig.format;
            downloadLinkRef.current.href = URL.createObjectURL(fileBlob);
            downloadLinkRef.current.click();
        }
    }


    return (
        <AppShell
            fixed
            padding="md"
            header={<AppHeader version={packageJson.version} />}
            navbar={
                <SideBar
                    downloadDisabled={(fileBlob?.size ?? 0) <= 0}
                    onDownloadClick={downloadFile}
                    fileSize={fileBlob?.size ?? 0}
                    fileExtension={recordConfig.format}
                    fileName={downloadFileName}
                    onFileNameChange={setDownloadFileName}
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
            <a style={{ display: 'none' }} ref={downloadLinkRef} href='#/'>Dowload</a>
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
    );
}

export default Dashboard;

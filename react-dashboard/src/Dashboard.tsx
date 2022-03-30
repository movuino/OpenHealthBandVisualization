import React, {
    useState,
    useRef,
    useEffect,
    useMemo,
} from "react";
import "./App.css";
import {
    AppShell,
    Text,
    Button,
    useMantineTheme,
} from "@mantine/core";
import { StepType, useTour } from '@reactour/tour'
import { useLocalStorage } from "@mantine/hooks";
import SideBar from "./SideBar";
import AppHeader from "./Header";
import RecordModal, { RecordConfig} from "./RecordModal";
import Main from "./Main";
import packageJson from '../package.json'
import { setConnected } from "./slices/mainSlice";
import { stopRecording, startRecording, setConfig, setFileSize, setLinesRecorded } from './slices/recordingSlice';
import { useAppDispatch, useAppSelector } from "./store";
import { BLE_STARTSTOP_SERVICE_UUID, BLE_STARTSTOP_CHAR_UUID } from "./BLE";
import ErrorModal from "./ErrorModal";

const generateFile = (header: string, lines: string[], extension: string) => {
    lines.unshift(header);
    const blob = new Blob([lines.join('\n')], { type: `text/${extension}` });
    console.log(blob);
    return blob;
}


function Dashboard() {
    const dispatch = useAppDispatch();
    const acquisitionStarted = useAppSelector(state => state.main.acquisitionStarted);
    const isRecording = useAppSelector(state => state.recording.isRecording);
    const linesRecorded = useAppSelector(state => state.recording.linesRecorded);
    const recordConfig = useAppSelector(state => state.recording.config);
    const fileName = useAppSelector(state => state.recording.filename);

    const theme = useMantineTheme();
    const { setIsOpen, setSteps, setCurrentStep } = useTour()

    const downloadLinkRef = useRef<HTMLAnchorElement>(null);
    const [isRecordModalVisible, setRecordModalVisibility] = useState(false);
    const [gattServer, setGattServer] = useState<BluetoothRemoteGATTServer | null>(null);
    const [file, setFile] = useState(new Blob());
    const [isErrorModalVisible, setErrorModalVisibility] = useState(false);

    /** Local storage viariable used to check if it is the first time the user visit the app */
    const [newUser, setNewUser] = useLocalStorage<boolean>({
        key: "ohb-dashboard-new",
        defaultValue: true,
    });

    useEffect(() => {
        if (navigator.bluetooth === null || navigator.bluetooth === undefined) {
            setErrorModalVisibility(true);
        }
    }, [])

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
                position: 'center',

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
                selector: '.tour-sensor-card',
                content: (<Text>Here you can see the real time data from the Movuino sensors.<br/><span style={{ fontWeight: 'bold' }}>Click</span> on the card to make it full screen.</Text>)
            },
            {
                selector: '.tour-switch',
                content: (<Text>The <span style={{ fontWeight: 'bold', color: theme.colors.blue[6] }}>Switch</span> toggles the monitoring of a specific sensor.<br/>Due to limitation in the performances of certain browser, streaming data from all the sensors <br/><span style={{ fontWeight: 'bold' }}>simulaneously</span> can result in a laggy and slow interface. <br/>Use the <span style={{ fontWeight: 'bold', color: theme.colors.blue[6] }}>Toggle Switch</span> to stop the monitoring of sensors you do not need to increase performances. </Text>)
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

    useEffect(() => {
        setSteps(tourSteps);
        if (newUser) {
            setIsOpen(newUser)
        }
        setNewUser(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newUser])

    useEffect(() => {
        (async () => {
            const utilsService = await gattServer?.getPrimaryService(BLE_STARTSTOP_SERVICE_UUID);
            const startstopCharacteristic = await utilsService?.getCharacteristic(BLE_STARTSTOP_CHAR_UUID);
            if (acquisitionStarted) {
                console.log("STARTING ACQUISITION")
                startstopCharacteristic?.writeValue(new Uint8Array([1]));
            } else {
                console.log("STOPING ACQUISITION")
                startstopCharacteristic?.writeValue(new Uint8Array([2]));
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acquisitionStarted])



    /** Function used to trigger a file download from the user browser */
    const downloadFile = () => {
        if (downloadLinkRef.current && file) {
            console.log(fileName)
            downloadLinkRef.current.download = fileName + '.' + recordConfig.format;
            downloadLinkRef.current.href = URL.createObjectURL(file);
            downloadLinkRef.current.click();
        }
    }

    const onConnection = (gatt: BluetoothRemoteGATTServer) => {
        dispatch(setConnected(true));
        setGattServer(gatt);
    }

    const onRecordButtonClick = () => {
        if (isRecording) {
            dispatch(stopRecording());
        } else {
            setRecordModalVisibility(true);
        }
    }

    const onStartRecording = (config: RecordConfig) => {
        setRecordModalVisibility(false);
        dispatch(startRecording());
        dispatch(setConfig(config));
    }

    useEffect(() => {
        // console.log("useEffect line recorded")
        if (!linesRecorded.length) return;
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
        const blob = generateFile(header, [...linesRecorded], recordConfig.format);
        dispatch(setLinesRecorded([]));
        setFile(blob);
        dispatch(setFileSize(blob.size));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [linesRecorded])

    return (
        <AppShell
            fixed
            padding="md"
            header={<AppHeader version={packageJson.version} />}
            navbar={
                <SideBar onConnection={onConnection} onRecordButtonClick={onRecordButtonClick} onDownloadButtonClick={downloadFile} />
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
                onValidate={onStartRecording}
            />
            <ErrorModal opened={isErrorModalVisible}/>
            <Main gattServer={gattServer} />
        </AppShell>
    );
}

export default Dashboard;

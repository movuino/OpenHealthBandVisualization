
import React, {} from "react";
import "./App.css";
import {
  Button,
  Navbar,
  Text,
  Divider,
  Group,
  Badge,
  TextInput,
  useMantineTheme
} from "@mantine/core";

import { BLE_ERROR_SERVICE_UUID, BLE_IMU_SERVICE_UUID, BLE_PPG86_SERVICE_UUID, BLE_STARTSTOP_SERVICE_UUID } from './BLE'

import { useAppDispatch, useAppSelector } from "./store";
import { startAcquisition, stopAcquisition } from "./slices/mainSlice";
import { setFilename, } from './slices/recordingSlice'

interface SideBarProps {
  onConnection: (gattServer: BluetoothRemoteGATTServer) => void;
  onRecordButtonClick: () => void;
  onDownloadButtonClick: () => void;
}

function humanFileSize(size: number) {
  var i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return Number((size / Math.pow(1024, i)).toFixed(2)) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
};

const SideBar: React.FC<SideBarProps> = (props) => {
  const acquisitionStarted = useAppSelector(state => state.main.acquisitionStarted);
  const filename = useAppSelector(state => state.recording.filename);
  const sensorStatuses = useAppSelector(state => state.main.sensorStatuses);
  const isConnected = useAppSelector(state => state.main.connected);
  const isRecording = useAppSelector(state => state.recording.isRecording);
  const config = useAppSelector(state => state.recording.config);
  const fileSize = useAppSelector(state => state.recording.fileSize);
  const dispatch = useAppDispatch();

  const theme = useMantineTheme();

  const blePromptAndConnect = async () => {
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
    if (gattServer !== undefined) {
      props.onConnection(gattServer);
    } else {
      console.log("BLE Gatt Server connection failed !");
    }
  }

  const start = () => {
    dispatch(startAcquisition());
  }

  const stop = () => {
    dispatch(stopAcquisition());
  }

  const onFilenameChange = (value: string) => {
    dispatch(setFilename(value));
  }

  return (
    <Navbar width={{ base: 300 }} style={{ flexDirection: 'column' }} fixed p="xs" sx={theme => ({ backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[9] : 'default' })}>
      <Button onClick={blePromptAndConnect} className='tour-step-1'>Connect to Movuino</Button>
      <Divider my="sm" />
      <div className="tour-step-2">
        {sensorStatuses.map((e) => (
          <Group style={{ display: "flex", alignItems: "center" }} key={e.name}>
            <Text sx={theme => ({ color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : 'inherit' })}>{e.name}</Text>
            {e.status ? (
              <Badge color={"green"}>OK</Badge>
            ) : (
              <Badge color={"red"}>KO</Badge>
            )}
          </Group>
        ))}
      </div>
      <Divider my="sm" />
      <Group grow className="tour-step-3">
        <Button
          onClick={start}
          variant="light"
          color={"green"}
          disabled={acquisitionStarted || !isConnected}
        >
          Start
        </Button>
        <Button
          onClick={stop}
          variant="light"
          color={"red"}
          disabled={!acquisitionStarted || !isConnected}
        >
          Stop
        </Button>
      </Group>
      <Divider my="sm" />
      <Button disabled={!isConnected} color={isRecording ? 'red' : 'green'} onClick={props.onRecordButtonClick} className='tour-step-4'>{isRecording ? 'Stop' : 'Record'}</Button>
      <div style={{ marginTop: 'auto' }}>
        <TextInput
          className='tour-step-5'
          style={{ marginTop: 'auto' }}
          placeholder="File name"
          label={null}
          value={filename}
          onChange={(e) => onFilenameChange(e.target.value)}
          rightSection={<Text style={{ color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : 'inherit' }}>.{config.format}</Text>}

        />
        <Button className='tour-step-6' mt={'md'} style={{ width: '100%' }} disabled={fileSize === 0} onClick={props.onDownloadButtonClick}>Download ({humanFileSize(fileSize)})</Button>
      </div>

    </Navbar>
  );
};

export default SideBar
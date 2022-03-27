
import React, {
  useState,
} from "react";
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

interface SideBarProps {
  // gattServer: BluetoothRemoteGATTServer | null;
  statuses: { name: string; status: boolean }[];
  onConnectionButtonClick: () => void;
  onStartButtonClick: () => void;
  onStopButtonClick: () => void;
  disabled: boolean;
  isRecording: boolean;
  onRecordButtonClick: () => void;
  fileName: string;
  fileExtension: string;
  onFileNameChange: (filename: string) => void;
  fileSize: number;
  onDownloadClick: () => void;
  downloadDisabled: boolean;
}


function humanFileSize(size: number) {
  var i = size === 0 ? 0 : Math.floor( Math.log(size) / Math.log(1024) ); 
  return Number((size / Math.pow(1024, i)).toFixed(2)) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
};

const SideBar: React.FC<SideBarProps> = (props) => {
  const theme = useMantineTheme();
  const [isStarted, setStarted] = useState(false);

  return (
    <Navbar width={{ base: 300 }} style={{ flexDirection: 'column' }} fixed p="xs" sx={theme => ({ backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[9] : 'default' })}>
      <Button onClick={props.onConnectionButtonClick} className='tour-step-1'>Connect to device</Button>
      <Divider my="sm" />
      <div className="tour-step-2">
      {props.statuses.map((e) => (
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
          onClick={() => {
            setStarted(true);
            props.onStartButtonClick();
          }}
          variant="light"
          color={"green"}
          disabled={isStarted || props.disabled}
        >
          Start
        </Button>
        <Button
          onClick={() => {
            setStarted(false);
            props.onStopButtonClick();
          }}
          variant="light"
          color={"red"}
          disabled={!isStarted || props.disabled}
        >
          Stop
        </Button>
      </Group>
      <Divider my="sm" />
      <Button disabled={props.disabled} color={props.isRecording ? 'red' : 'green'} onClick={props.onRecordButtonClick} className='tour-step-4'>{props.isRecording ? 'Stop' : 'Record'}</Button>
      <div style={{ marginTop: 'auto'}}>
        <TextInput
        className='tour-step-5'
          style={{ marginTop: 'auto' }}
          placeholder="File name"
          label={null}
          value={props.fileName}
          onChange={(e) => props.onFileNameChange(e.target.value)}
          rightSection={<Text style={{color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : 'inherit'}}>.{props.fileExtension}</Text>}
          
        />
        <Button className='tour-step-6' mt={'md'} style={{width: '100%'}} disabled={props.downloadDisabled} onClick={props.onDownloadClick}>Download ({humanFileSize(props.fileSize)})</Button>
      </div>

    </Navbar>
  );
};

export default SideBar
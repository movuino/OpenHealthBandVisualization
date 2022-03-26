
import React, {
    useState,
  } from "react";
  import logo from "./logo.svg";
  import "./App.css";
  import {
    Button,
    Navbar,
    Text,
    Divider,
    Group,
    Badge,
    useMantineTheme,
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
  }
  

const SideBar: React.FC<SideBarProps> = (props) => {
    const [isStarted, setStarted] = useState(false);
    const theme = useMantineTheme();
    return (
      <Navbar width={{ base: 300 }} style={{flexDirection: 'column'}} fixed p="xs" sx={theme => ({backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[9] : 'default'})}>
        <Button onClick={props.onConnectionButtonClick}>Connect to device</Button>
        <Divider my="sm" />
        {props.statuses.map((e) => (
          <Group style={{ display: "flex", alignItems: "center" }} key={e.name}>
            <Text sx={theme => ({color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : 'inherit'})}>{e.name}</Text>
            {e.status ? (
              <Badge color={"green"}>OK</Badge>
            ) : (
              <Badge color={"red"}>KO</Badge>
            )}
          </Group>
        ))}
        <Divider my="sm" />
        <Group grow>
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
        <Button disabled={props.disabled} color={props.isRecording ? 'red' : 'green'} onClick={props.onRecordButtonClick}>{props.isRecording ? 'Stop' : 'Record'}</Button>
        <Button style={{marginTop: 'auto'}} disabled>Download (12.0 M)</Button>
      </Navbar>
    );
  };

export default SideBar
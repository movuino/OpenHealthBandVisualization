import React, {} from "react";
  import "./App.css";
  import { Modal, Paper, Text, Title } from "@mantine/core";


interface ErrorModalProps {
    opened: boolean
}

const ErrorModal: React.FC<ErrorModalProps> = ({opened}) => {
    return <Modal opened={opened} withCloseButton={false} onClose={() => {}}>
        <Paper title="Brower not supported">
            <Title align="center">Oops !</Title>
            <Text>It seems like your browser does not support the <a href='https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API'>Web BLE API.</a></Text>
            <Text>Make sure to use the lastest versions of <strong>Chrome</strong> or <strong>Edge</strong>.</Text>
        </Paper>
    </Modal>
}

export default ErrorModal;
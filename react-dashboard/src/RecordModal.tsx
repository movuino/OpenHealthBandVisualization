import React, {
  useEffect,
  useState,
} from "react";
import "./App.css";
import { Modal, Group, Button, Checkbox, Select } from "@mantine/core";

type FileFormat = "csv" | "tsv";

export interface RecordConfig {
  properties: {
    'Accelerometer': boolean,
    'Gyroscope': boolean,
    'Magnetometer': boolean,
    'PPG1': boolean,
    'PPG2': boolean,
    'SNR1': boolean,
    'SNR2': boolean,
  };
  format: FileFormat;
}

interface RecordModalProps {
  opened: boolean;
  onClose: () => void;
  onValidate: (config: RecordConfig) => void;
}

export const DEFAULT_RECORDING_PROPERTIES = {
  'Accelerometer': true,
  'Gyroscope': true,
  'Magnetometer': true,
  'PPG1': true,
  'PPG2': true,
  'SNR1': true,
  'SNR2': true,
};

const RecordModal: React.FC<RecordModalProps> = ({
  opened,
  onClose,
  onValidate,
}) => {
  const [properties, setProperties] = useState<RecordConfig['properties']>(DEFAULT_RECORDING_PROPERTIES);
  const [format, setFormat] = useState<FileFormat>("csv");

  useEffect(() => {
    console.log(properties);
  }, [properties]);

  return (
    <Modal opened={opened} onClose={onClose} title="Setup recording">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Object.entries(properties).map(([propertie, value], idx) => (
          <Checkbox
            key={idx}
            label={propertie}
            defaultChecked={value}
            onChange={(e) => {
              setProperties((curr) => {
                curr[propertie as keyof RecordConfig['properties']] = e.target.checked;
                return { ...curr };
              });
            }}
          />
        ))}
      </div>
      <Select
        label="Format"
        placeholder="Pick one"
        mt="lg"
        value={format}
        data={[
          { value: "csv", label: "csv" },
          { value: "tsv", label: "tsv" },
        ]}
        onChange={(val: FileFormat) => {
          setFormat(val ? val : "csv");
        }}
      />
      <Group grow mt="lg">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onValidate({ properties: { ...properties }, format: format });
          }}
        >
          Record
        </Button>
      </Group>
    </Modal>
  );
};

export default RecordModal;

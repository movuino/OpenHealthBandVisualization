
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import "./App.css";
import {
  Button,
  Text,
  Paper,
  Slider,
  Select,
} from "@mantine/core";


const BLE_STARTSTOP_SERVICE_UUID = 0x1400;
const BLE_LED_CHAR_UUID = 0x1402;
const BLE_SAMPLE_RATE_CHAR_UUID = 0x1403;
const BLE_SAMPLE_AVG_CHAR_UUID = 0x1404;
const BLE_CALIBRATION_CHAR_UUID = 0x1405;

interface PPGConfigCardProps {
  gattServer: BluetoothRemoteGATTServer | null;
}

const PPGConfigCard: React.FC<PPGConfigCardProps> = ({ gattServer }) => {

  const [ledIntensity, setLedIntensity] = useState(0);
  const [sampleRateSelectValue, setSampleRateSelectValue] = useState<string | null>(null);
  const [sampleAvgSelectValue, setSampleAvgSelectValue] = useState<string | null>(null);

  const [ledCharacteristic, setLedCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [calibrationCharacteristic, setCalibrationCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [sampleRateCharacteristic, setSampleRateCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [sampleAvgCharacteristic, setSampleAvgCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  const onCalibrate = useCallback(() => {
    calibrationCharacteristic?.writeValue(new Uint8Array([1]));
  }, [calibrationCharacteristic])

  useEffect(() => {
    ledCharacteristic?.writeValue(new Uint8Array([ledIntensity]));
  }, [ledIntensity, ledCharacteristic])

  useEffect(() => {
    if (sampleRateSelectValue === null) return;
    sampleRateCharacteristic?.writeValue(new Uint8Array([parseInt(sampleRateSelectValue) / 25]));
  }, [sampleRateSelectValue, sampleRateCharacteristic])

  useEffect(() => {
    if (sampleAvgSelectValue === null) return;
    sampleAvgCharacteristic?.writeValue(new Uint8Array([parseInt(sampleAvgSelectValue)]));
  }, [sampleAvgSelectValue, sampleAvgCharacteristic])

  useEffect(() => {
    (async () => {
      const service = await gattServer?.getPrimaryService(BLE_STARTSTOP_SERVICE_UUID);
      const ledChar = await service?.getCharacteristic(BLE_LED_CHAR_UUID) ?? null;
      if (ledChar)
        ledChar.oncharacteristicvaluechanged = function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
          setLedIntensity(this.value?.getUint8(0) ?? 0);
        }
      ledChar?.startNotifications();
      setLedCharacteristic(ledChar);
      setCalibrationCharacteristic(await service?.getCharacteristic(BLE_CALIBRATION_CHAR_UUID) ?? null);
      setSampleRateCharacteristic(await service?.getCharacteristic(BLE_SAMPLE_RATE_CHAR_UUID) ?? null);
      setSampleAvgCharacteristic(await service?.getCharacteristic(BLE_SAMPLE_AVG_CHAR_UUID) ?? null);
    })()
  }, [gattServer])

  return (
    <Paper p="md" className="card" shadow="sm">
      <Text>PPG Config</Text>
      <div style={{ flexGrow: 1, display: 'flex' }}>
        <div style={{ width: "60%" }}>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              alignItems: "center",
              // width: "60%",
              justifyContent: "space-between",
            }}
          >
            <div style={{ width: "100%" }}>
              <Text style={{ fontSize: 15 }} mb="xs">
                Led intensity
              </Text>
              <Slider
                size="sm"
                marks={[
                  { value: 20, label: "20%" },
                  { value: 50, label: "50%" },
                  { value: 80, label: "80%" },
                ]}
                style={{ width: "100%" }}
                value={ledIntensity}
                onChange={setLedIntensity}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              alignItems: "center",
              // width: "60%",
              justifyContent: "space-between",
            }}
          >
            <div>
              <Text style={{ fontSize: 15 }} mb="xs" mt="lg">
                Sample rate
              </Text>
              <Select
                placeholder="Pick one"
                data={[
                  { value: "25", label: "25" },
                  { value: "50", label: "50" },
                  { value: "75", label: "75" },
                  { value: "100", label: "100" },
                  { value: "200", label: "200" },
                  { value: "500", label: "500" },
                  { value: "750", label: "750" },
                  { value: "1000", label: "1000" },
                ]}
                size="xs"
                value={sampleRateSelectValue}
                onChange={setSampleRateSelectValue}
              />
            </div>
            <div>
              <Text style={{ fontSize: 15 }} mb="xs" mt="lg">
                Sample average
              </Text>
              <Select
                placeholder="Pick one"
                data={[
                  { value: "1", label: "1" },
                  { value: "2", label: "2" },
                  { value: "4", label: "4" },
                  { value: "8", label: "8" },
                  { value: "16", label: "16" },
                  { value: "32", label: "32" },
                  { value: "64", label: "64" },
                  { value: "128", label: "128" },
                  { value: "254", label: "254" },
                ]}
                size="xs"
                value={sampleAvgSelectValue}
                onChange={setSampleAvgSelectValue}
              />
            </div>
          </div>
        </div>
        <div style={{ flexGrow: 1, display: 'flex', height: '100%', justifyContent: 'center' }}>
          <Button mt='md' variant='light' onClick={onCalibrate}>Calibrate</Button>
        </div>
      </div>
    </Paper>
  )
}

export default PPGConfigCard
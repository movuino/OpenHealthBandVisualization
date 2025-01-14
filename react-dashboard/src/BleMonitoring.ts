import { MutableRefObject } from "react";
import { updateChart } from "./Chart";

export interface axis3I {
  x: number[];
  y: number[];
  z: number[];
}

function getValueFromBuffer(buffer: DataView, index: number, range: number) {
  let v = (buffer.getUint8(index) << 8) | buffer.getUint8(index + 1);

  if (v & 0x8000) {
    v = v - 0x10000; // Convert to a signed 16-bit value
  }
  return (v * -1 * range) / 0x8000;
}

const monitorAccFactory = (
  ref: MutableRefObject<axis3I>,
  svgClassName: string,
  maxLength: number
) => {
  return function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
    // const timestamp = this.value?.getUint32(0);
    if (!this.value) return;
    const x = getValueFromBuffer(this.value, 5, 16);
    const y = getValueFromBuffer(this.value, 7, 16);
    const z = getValueFromBuffer(this.value, 9, 16);

    // (((this.value.getInt8(5) << 8) | this.value.getInt8(6)) * -1 * 16) /
    // 0x8000;
    // const y =
    //   (((this.value.getInt8(7) << 8) | this.value.getInt8(8)) * -1 * 16) /
    //   0x8000;
    // const z =
    //   (((this.value.getInt8(9) << 8) | this.value.getInt8(10)) * -1 * 16) /
    //   0x8000;
    ref.current.x.push(x);
    ref.current.y.push(y);
    ref.current.z.push(z);
    if (ref.current.x.length >= maxLength) {
      ref.current.x.shift();
      ref.current.y.shift();
      ref.current.z.shift();
    }
    const elements = document.getElementsByClassName(svgClassName);
    for (let element of elements as any) {
      updateChart(
        [ref.current.x, ref.current.y, ref.current.z],
        element,
        { bottom: 10, left: 10, top: 10, right: 10 },
        ["#8CE99A", "#74C0FC", "#FF8787"]
      );
    }
  };
};

const monitorGyrFactory = monitorAccFactory;

const monitorMagFactory = (
  ref: MutableRefObject<axis3I>,
  svgClassName: string,
  maxLength: number
) => {
  return function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
    // const timestamp = this.value?.getUint32(0);
    if (!this.value) return;
    const x =
      ((this.value.getInt8(4) << 8) | this.value.getInt8(5)) * 1.1796875;
    const y =
      ((this.value.getInt8(6) << 8) | this.value.getInt8(7)) * 1.1796875;
    const z =
      ((this.value.getInt8(8) << 8) | this.value.getInt8(9)) * 1.1796875;
    ref.current.x.push(x);
    ref.current.y.push(y);
    ref.current.z.push(z);
    if (ref.current.x.length >= maxLength) {
      ref.current.x.shift();
      ref.current.y.shift();
      ref.current.z.shift();
    }
    const elements = document.getElementsByClassName(svgClassName);
    for (let element of elements as any) {
      updateChart(
        [ref.current.x, ref.current.y, ref.current.z],
        element,
        { bottom: 10, left: 10, top: 10, right: 10 },
        ["#8CE99A", "#74C0FC", "#FF8787"]
      );
    }
  };
};

const monitorPpgFactory = (
  ref: MutableRefObject<{ timestamp: number; value: number }[]>,
  svgClassName: string,
  maxLength: number
) => {
  return function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
    const timestamp = this.value?.getUint32(0);
    const val1 = this.value?.getUint32(4);
    const val2 = this.value?.getUint32(8);
    if (val1 === undefined || val2 === undefined || timestamp === undefined)
      return;
    ref.current.push({ timestamp: timestamp, value: (val1 + val2) / 2 });
    if (ref.current.length >= maxLength) ref.current.shift();
    const elements = document.getElementsByClassName(svgClassName);
    for (let element of elements as any) {
      updateChart(
        [ref.current.map((e) => e.value)],
        element,
        { bottom: 10, left: 10, top: 10, right: 10 },
        ["#8CE99A", "#74C0FC", "#FF8787"]
      );
    }
  };
};

const monitorSnrFactory = (
  setState: React.Dispatch<React.SetStateAction<number>>
) => {
  return function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
    setState((this.value?.getUint32(0) ?? 0) / 100);
  };
};

const readSnr = async (
  characteristic: BluetoothRemoteGATTCharacteristic,
  setState: React.Dispatch<React.SetStateAction<number>>,
  ref: React.MutableRefObject<number>
) => {
  const val = (await characteristic.readValue()).getUint32(0) / 100;
  setState(val);
  ref.current = val;
};

export {
  monitorAccFactory,
  monitorGyrFactory,
  monitorMagFactory,
  monitorPpgFactory,
  monitorSnrFactory,
  readSnr,
};

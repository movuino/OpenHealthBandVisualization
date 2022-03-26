import { MutableRefObject } from "react";

export interface axis3I {
  x: number[];
  y: number[];
  z: number[];
}

const monitorAccFactory = (
  ref: MutableRefObject<axis3I>,
  maxLength: number
) => {
  return function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
    // const timestamp = this.value?.getUint32(0);
    if (!this.value) return;
    const x =
      (((this.value.getInt8(5) << 8) | this.value.getInt8(6)) * -1 * 16) /
      0x8000;
    const y =
      (((this.value.getInt8(7) << 8) | this.value.getInt8(8)) * -1 * 16) /
      0x8000;
    const z =
      (((this.value.getInt8(9) << 8) | this.value.getInt8(10)) * -1 * 16) /
      0x8000;
    ref.current.x.push(x);
    ref.current.y.push(y);
    ref.current.z.push(z);
    if (ref.current.x.length >= maxLength) {
      ref.current.x.shift();
      ref.current.y.shift();
      ref.current.z.shift();
    }
  };
};

const monitorGyrFactory = monitorAccFactory;

const monitorMagFactory = (
  ref: MutableRefObject<axis3I>,
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
  };
};

const monitorPpgFactory = (
  ref: MutableRefObject<{ timestamp: number; value: number }[]>,
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
  };
};

const monitorSnrFactory = (
  setState: React.Dispatch<React.SetStateAction<number>>
) => {
  return function (this: BluetoothRemoteGATTCharacteristic, ev: Event) {
    setState((this.value?.getUint32(0) ?? 0) / 100);
  };
};

export {
  monitorAccFactory,
  monitorGyrFactory,
  monitorMagFactory,
  monitorPpgFactory,
  monitorSnrFactory,
};

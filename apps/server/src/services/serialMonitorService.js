import { ReadlineParser, SerialPort } from "serialport";

let activePort = null;

export async function closeSerialMonitor() {
  if (!activePort) return;

  const port = activePort;
  activePort = null;

  await new Promise((resolve) => {
    if (!port.isOpen) {
      resolve();
      return;
    }

    port.close(() => resolve());
  });
}

export async function openSerialStream({ port, baudRate, onLine, onError }) {
  await closeSerialMonitor();

  const serial = new SerialPort({
    path: port,
    baudRate,
    autoOpen: false
  });

  activePort = serial;

  const parser = serial.pipe(new ReadlineParser({ delimiter: "\n" }));

  parser.on("data", (line) => {
    onLine(String(line).replace(/\r$/, ""));
  });

  serial.on("error", (error) => {
    onError(error);
  });

  await new Promise((resolve, reject) => {
    serial.open((error) => {
      if (error) {
        if (activePort === serial) activePort = null;
        reject(error);
        return;
      }

      resolve();
    });
  });

  return async () => {
    if (activePort === serial) {
      await closeSerialMonitor();
    } else if (serial.isOpen) {
      await new Promise((resolve) => serial.close(() => resolve()));
    }
  };
}

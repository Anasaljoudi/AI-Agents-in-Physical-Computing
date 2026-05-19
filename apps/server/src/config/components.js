export const componentCatalog = [
  {
    type: "led-ring",
    label: "LED Ring",
    description: "RGB light ring",
    defaults: {
      signalPin: "D6",
      power: "5V"
    }
  },

  {
    type: "button",
    label: "Button",
    description: "Digital input",
    defaults: {
      signalPin: "D2",
      mode: "INPUT_PULLUP"
    }
  },

  {
    type: "servo",
    label: "Servo",
    description: "PWM motor",
    defaults: {
      signalPin: "D3",
      power: "5V"
    }
  },

  {
    type: "buzzer",
    label: "Buzzer",
    description: "Sound output",
    defaults: {
      signalPin: "D4",
      power: "5V"
    }
  },

  {
    type: "oled",
    label: "OLED Display",
    description: "I2C screen",
    defaults: {
      sdaPin: "SDA",
      sclPin: "SCL",
      power: "3.3V"
    }
  },

  {
    type: "slide-pot",
    label: "Slide Potentiometer",
    description: "Analog slider",
    defaults: {
      signalPin: "A0"
    }
  },

  {
    type: "rgb-led",
    label: "RGB LED",
    description: "Color output",
    defaults: {
      redPin: "D9",
      greenPin: "D10",
      bluePin: "D11",
      resistor: "220 ohm"
    }
  },

  {
    type: "relay",
    label: "Relay Module",
    description: "Switch external devices",
    defaults: {
      signalPin: "D7",
      power: "5V"
    }
  },

  {
    type: "ultrasonic",
    label: "Ultrasonic Sensor",
    description: "Distance sensing",
    defaults: {
      trigPin: "D12",
      echoPin: "D13",
      power: "5V"
    }
  }
];

export const boardOptions = [
  { label: "Arduino Uno", value: "uno", fqbn: "arduino:avr:uno" },
  { label: "Arduino Nano", value: "nano", fqbn: "arduino:avr:nano" },
  { label: "Arduino Mega", value: "mega", fqbn: "arduino:avr:mega" },
  { label: "Other", value: "other", fqbn: "" }
];

export function getBoardConfig(boardType) {
  return boardOptions.find((option) => option.value === boardType) ?? boardOptions[0];
}

export function getBoardConfigByFqbn(fqbn = "") {
  return boardOptions.find((option) => option.fqbn === fqbn) ?? null;
}

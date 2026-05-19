import { getBoardConfig } from "../config/components.js";

function normalizePin(pin, fallback) {
  if (
    pin === undefined ||
    pin === null ||
    pin === ""
  ) {
    return fallback;
  }

  // already formatted
  if (
    String(pin).startsWith("D") ||
    String(pin).startsWith("A") ||
    pin === "SDA" ||
    pin === "SCL" ||
    pin === "5V" ||
    pin === "3.3V" ||
    pin === "GND"
  ) {
    return String(pin);
  }

  return `D${pin}`;
}

export function generateWiringDiagram({
  boardType,
  components = [],
  boardOverride
}) {
  const board =
    boardOverride ??
    getBoardConfig(boardType);

  const boardLabel =
    board.label || "Arduino Nano 33 BLE";

  const tableConnections = [];

  components.forEach((comp, idx) => {
    const cfg = comp.config || {};

    const label =
      comp.label ||
      comp.name ||
      comp.type ||
      `Component ${idx + 1}`;

    /* ---------------- LED RING ---------------- */

    if (comp.type === "led-ring") {
      tableConnections.push(
        {
          component: label,
          componentPin: "DIN",
          arduinoPin: normalizePin(
            cfg.signalPin,
            "D6"
          ),
          wireColor: "Blue",
          color: "#1e88e5"
        },

        {
          component: label,
          componentPin: "5V",
          arduinoPin: "5V",
          wireColor: "Red",
          color: "#e53935"
        },

        {
          component: label,
          componentPin: "GND",
          arduinoPin: "GND",
          wireColor: "Black",
          color: "#222"
        }
      );
    }

    /* ---------------- BUTTON ---------------- */

    else if (comp.type === "button") {
      tableConnections.push(
        {
          component: label,
          componentPin: "Signal",
          arduinoPin: normalizePin(
            cfg.signalPin,
            "D2"
          ),
          wireColor: "Blue",
          color: "#1e88e5"
        },

        {
          component: label,
          componentPin: "GND",
          arduinoPin: "GND",
          wireColor: "Black",
          color: "#222"
        }
      );
    }

    /* ---------------- SERVO ---------------- */

    else if (comp.type === "servo") {
      tableConnections.push(
        {
          component: label,
          componentPin: "Signal",
          arduinoPin: normalizePin(
            cfg.signalPin,
            "D3"
          ),
          wireColor: "Blue",
          color: "#1e88e5"
        },

        {
          component: label,
          componentPin: "5V",
          arduinoPin: "5V",
          wireColor: "Red",
          color: "#e53935"
        },

        {
          component: label,
          componentPin: "GND",
          arduinoPin: "GND",
          wireColor: "Black",
          color: "#222"
        }
      );
    }

    /* ---------------- BUZZER ---------------- */

    else if (comp.type === "buzzer") {
      tableConnections.push(
        {
          component: label,
          componentPin: "Signal",
          arduinoPin: normalizePin(
            cfg.signalPin,
            "D4"
          ),
          wireColor: "Blue",
          color: "#1e88e5"
        },

        {
          component: label,
          componentPin: "GND",
          arduinoPin: "GND",
          wireColor: "Black",
          color: "#222"
        }
      );
    }

    /* ---------------- OLED DISPLAY ---------------- */

    else if (comp.type === "oled") {
      tableConnections.push(
        {
          component: label,
          componentPin: "SDA",
          arduinoPin: "A4",
          wireColor: "Blue",
          color: "#1e88e5"
        },

        {
          component: label,
          componentPin: "SCL",
          arduinoPin: "A5",
          wireColor: "Green",
          color: "#43a047"
        },

        {
          component: label,
          componentPin: "VCC",
          arduinoPin: "3.3V",
          wireColor: "Red",
          color: "#e53935"
        },

        {
          component: label,
          componentPin: "GND",
          arduinoPin: "GND",
          wireColor: "Black",
          color: "#222"
        }
      );
    }

    /* ---------------- SLIDE POT ---------------- */

    else if (comp.type === "slide-pot") {
      tableConnections.push(
        {
          component: label,
          componentPin: "SIG",
          arduinoPin: "A0",
          wireColor: "Blue",
          color: "#1e88e5"
        },

        {
          component: label,
          componentPin: "5V",
          arduinoPin: "5V",
          wireColor: "Red",
          color: "#e53935"
        },

        {
          component: label,
          componentPin: "GND",
          arduinoPin: "GND",
          wireColor: "Black",
          color: "#222"
        }
      );
    }

    /* ---------------- RGB LED ---------------- */

    else if (comp.type === "rgb-led") {
      tableConnections.push(
        {
          component: label,
          componentPin: "Red",
          arduinoPin: "D9",
          wireColor: "Red",
          color: "#e53935"
        },

        {
          component: label,
          componentPin: "Green",
          arduinoPin: "D10",
          wireColor: "Green",
          color: "#43a047"
        },

        {
          component: label,
          componentPin: "Blue",
          arduinoPin: "D11",
          wireColor: "Blue",
          color: "#1e88e5"
        },

        {
          component: label,
          componentPin: "GND",
          arduinoPin: "GND",
          wireColor: "Black",
          color: "#222"
        }
      );
    }

    /* ---------------- RELAY ---------------- */

    else if (comp.type === "relay") {
      tableConnections.push(
        {
          component: label,
          componentPin: "IN",
          arduinoPin: "D7",
          wireColor: "Blue",
          color: "#1e88e5"
        },

        {
          component: label,
          componentPin: "VCC",
          arduinoPin: "5V",
          wireColor: "Red",
          color: "#e53935"
        },

        {
          component: label,
          componentPin: "GND",
          arduinoPin: "GND",
          wireColor: "Black",
          color: "#222"
        }
      );
    }

    /* ---------------- ULTRASONIC ---------------- */

    else if (comp.type === "ultrasonic") {
      tableConnections.push(
        {
          component: label,
          componentPin: "TRIG",
          arduinoPin: "D12",
          wireColor: "Blue",
          color: "#1e88e5"
        },

        {
          component: label,
          componentPin: "ECHO",
          arduinoPin: "D13",
          wireColor: "Green",
          color: "#43a047"
        },

        {
          component: label,
          componentPin: "VCC",
          arduinoPin: "5V",
          wireColor: "Red",
          color: "#e53935"
        },

        {
          component: label,
          componentPin: "GND",
          arduinoPin: "GND",
          wireColor: "Black",
          color: "#222"
        }
      );
    }

    /* ---------------- FALLBACK ---------------- */

    else {
      tableConnections.push({
        component: label,
        componentPin: "Signal",
        arduinoPin: normalizePin(
          cfg.signalPin,
          `D${2 + idx}`
        ),
        wireColor: "Blue",
        color: "#1e88e5"
      });
    }
  });

  return {
    connections: tableConnections,
    components,
    board: {
      label: boardLabel
    }
  };
}
import { useMemo } from "react";

// Pin coordinates mapped directly to the Nano image
const pinCoordinates = {
  // TOP DIGITAL ROW
  D13: { x: 126, y: 274 },
  D12: { x: 147, y: 274 },
  D11: { x: 168, y: 274 },
  D10: { x: 189, y: 274 },
  D9:  { x: 210, y: 274 },
  D8:  { x: 231, y: 274 },
  D7:  { x: 252, y: 274 },
  D6:  { x: 280, y: 248 },
  D5:  { x: 294, y: 274 },
  D4:  { x: 337, y: 250 },

  // FINAL D2 / D3 CALIBRATION
  D3:  { x: 368, y: 248 },
  D2:  { x: 395, y: 248 },

  // ANALOG
  A0: { x: 231, y: 430 },
  A1: { x: 252, y: 430 },
  A2: { x: 273, y: 430 },
  A3: { x: 294, y: 430 },
  A4: { x: 310, y: 400 },
  A5: { x: 340, y: 400 },

  // POWER
  "3.3V": { x: 138, y: 399 },

  // FINAL POWER CALIBRATION
  "5V": { x: 425, y: 400 },
  GND:  { x: 485, y: 400 }
};

function getWireColor(pin) {

  if (
    pin === "5V" ||
    pin === "3.3V"
  ) {
    return "#e53935";
  }

  if (pin === "GND") {
    return "#222";
  }

  // OLED SCL
  if (pin === "A5") {
    return "#43a047";
  }

  // OLED SDA
  if (pin === "A4") {
    return "#1e88e5";
  }

  // RGB LED
  if (pin === "D9") {
    return "#e53935";
  }

  if (pin === "D10") {
    return "#43a047";
  }

  if (pin === "D11") {
    return "#1e88e5";
  }

  // Ultrasonic
  if (pin === "D12") {
    return "#fb8c00";
  }

  if (pin === "D13") {
    return "#8e24aa";
  }

  // Relay
  if (pin === "D7") {
    return "#fb8c00";
  }

  return "#1e88e5";
}

export function WiringPanel({ wiring }) {
  if (!wiring?.connections?.length) {
    return (
      <div className="empty-wiring">
        <div className="empty-wiring-inner">
          <strong>No wiring generated yet.</strong>
          <p>Add components and run again.</p>
        </div>
      </div>
    );
  }

  // GROUP COMPONENTS
  const grouped = useMemo(() => {
    const map = new Map();

    wiring.connections.forEach((conn) => {
      if (!map.has(conn.component)) {
        map.set(conn.component, []);
      }

      map.get(conn.component).push(conn);
    });

    return [...map.entries()];
  }, [wiring]);

  const svgMarkup = useMemo(() => {
    const width = 1650;
    const height = Math.max(
      720,
      420 + grouped.length * 160
    );

    let svg = `
      <svg
        viewBox="0 0 ${width} ${height}"
        xmlns="http://www.w3.org/2000/svg"
        style="
          width:100%;
          height:auto;
          background:#f5f5f5;
          border-radius:20px;
        "
      >
    `;

    // PANEL
    svg += `
      <rect
        x="40"
        y="40"
        width="${width - 80}"
        height="${height - 80}"
        rx="28"
        fill="#ffffff"
        stroke="#dddddd"
      />
    `;

    // BREADBOARD IMAGE
    svg += `
      <image
        href="/nano33ble-pinout.png"
        x="80"
        y="120"
        width="980"
        height="420"
      />
    `;

    grouped.forEach(([componentName, connections], componentIndex) => {
      const componentX = 1240;
      const componentY = 100 + componentIndex * 180;

      // COMPONENT CARD
      svg += `
        <rect
          x="${componentX}"
          y="${componentY}"
          width="250"
          height="${90 + connections.length * 30}"
          rx="18"
          fill="#fafafa"
          stroke="#cccccc"
        />
      `;

      // COMPONENT TITLE
      svg += `
        <text
          x="${componentX + 125}"
          y="${componentY + 34}"
          text-anchor="middle"
          font-size="22"
          font-weight="700"
          fill="#111"
        >
          ${componentName}
        </text>
      `;

      connections.forEach((conn, connIndex) => {
        const pin = pinCoordinates[conn.arduinoPin];

        // THIS fixes non-led disappearing issue
        if (!pin) {
          return;
        }

        const color = getWireColor(conn.arduinoPin);

        // ACTUAL ARDUINO PIN
const IMAGE_X = 80;
const IMAGE_Y = 120;

const ORIGINAL_WIDTH = 1962;
const ORIGINAL_HEIGHT = 624;

const DISPLAY_WIDTH = 980;
const DISPLAY_HEIGHT = 420;

const scaleX = DISPLAY_WIDTH / ORIGINAL_WIDTH;
const scaleY = DISPLAY_HEIGHT / ORIGINAL_HEIGHT;

const startX =
  IMAGE_X + (pin.x * scaleX);

const startY =
  IMAGE_Y + (pin.y * scaleY);

        // wire routing lane
        const laneX =
  860 +
  componentIndex * 70 +
  connIndex * 26;
          

        // connection point on card
        const targetX = componentX;
        const targetY =
          componentY + 68 + connIndex * 30;

        // shorter offset = cleaner
        const offset =
          conn.arduinoPin.startsWith("D")
            ? -8 - connIndex * 4
            : 8 + connIndex * 4;

        // WIRE
        svg += `
          <path
            d="
              M ${startX} ${startY}
              L ${startX} ${startY + offset}
              L ${laneX} ${startY + offset}
              L ${laneX} ${targetY}
              L ${targetX} ${targetY}
            "
            fill="none"
            stroke="${color}"
            stroke-width="5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        `;

        // PIN DOT
        svg += `
          <circle
            cx="${startX}"
            cy="${startY}"
            r="6"
            fill="${color}"
          />
        `;

        // LABEL
        svg += `
          <text
            x="${componentX + 20}"
            y="${targetY + 5}"
            font-size="14"
            fill="#333"
          >
            ${conn.componentPin} → ${conn.arduinoPin}
          </text>
        `;
      });
    });

    svg += `</svg>`;

    return svg;
  }, [grouped]);

  return (
    <div className="wiring-panel">
      <div
        className="generated-wiring"
        dangerouslySetInnerHTML={{
          __html: svgMarkup
        }}
      />

      <div className="wiring-table">
        <h3>Wiring Guide</h3>

        <table className="connections-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Pin</th>
              <th>Arduino</th>
              <th>Wire</th>
            </tr>
          </thead>

          <tbody>
            {wiring.connections.map((conn, idx) => (
              <tr key={idx}>
                <td>{conn.component}</td>

                <td>{conn.componentPin}</td>

                <td>
                  <strong>{conn.arduinoPin}</strong>
                </td>

                <td
                  style={{
                    color: getWireColor(conn.arduinoPin),
                    fontWeight: 700
                  }}
                >
                  {conn.arduinoPin}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
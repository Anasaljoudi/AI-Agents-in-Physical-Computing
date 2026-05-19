const digitalPins = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"];
const pwmPins = ["3", "5", "6", "9", "10", "11"];
const analogPins = ["A0", "A1", "A2", "A3", "A4", "A5"];

function take(pool, used, fallback = "9") {
  const pin = pool.find((candidate) => !used.has(candidate)) ?? fallback;
  used.add(pin);
  return pin;
}

function manualOrAuto(value, pool, used, fallback) {
  if (value) {
    used.add(value);
    return value;
  }

  return take(pool, used, fallback);
}

export function resolvePinMapping(components = []) {
  const used = new Set();

  return components.map((component) => {
    const config = { ...component.config };

    switch (component.type) {
      case "rgb-led":
        config.redPin = manualOrAuto(config.redPin, pwmPins, used, "9");
        config.greenPin = manualOrAuto(config.greenPin, pwmPins, used, "10");
        config.bluePin = manualOrAuto(config.bluePin, pwmPins, used, "11");
        break;
      case "multi-led": {
        const count = Number.parseInt(config.count, 10) || 3;
        config.signalPins = Array.from({ length: Math.max(1, Math.min(count, 6)) }, () =>
          take(digitalPins, used, "13")
        ).join(",");
        break;
      }
      case "potentiometer":
      case "temperature":
      case "light":
      case "microphone":
        config.signalPin = manualOrAuto(config.signalPin, analogPins, used, "A0");
        break;
      case "touch":
        config.signalPin = manualOrAuto(config.signalPin, digitalPins, used, "4");
        break;
      case "servo":
        config.signalPin = manualOrAuto(config.signalPin, pwmPins, used, "5");
        break;
      case "imu":
      case "bluetooth":
        config.location = "Built-in";
        break;
      case "oled":
        break;
      case "resistor":
        break;
      case "ultrasonic":
        config.trigPin = manualOrAuto(config.trigPin, digitalPins, used, "6");
        config.echoPin = manualOrAuto(config.echoPin, digitalPins, used, "7");
        break;
      default:
        config.signalPin = manualOrAuto(config.signalPin, digitalPins, used, "9");
    }

    return {
      ...component,
      config
    };
  });
}

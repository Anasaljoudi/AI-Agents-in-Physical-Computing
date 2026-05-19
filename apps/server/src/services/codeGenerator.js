import { getBoardConfig } from "../config/components.js";

// Helper: sleep for ms (for retries)
const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Helper: strip markdown code fences
function stripCodeFences(code) {
  let cleaned = code
    .replace(
      /^```(?:cpp|c)?\s*\n?/i,
      ""
    )
    .replace(/\n?```\s*$/, "");

  return cleaned.trim();
}

function buildComponentSummary(components) {
  return components
    .map(
      (component) =>
        `${component.type} (${Object.entries(
          component.config
        )
          .map(
            ([key, value]) =>
              `${key}: ${value}`
          )
          .join(", ")})`
    )
    .join("; ");
}

function safeBlinkSketch() {
  return `void setup() {
  pinMode(
    LED_BUILTIN,
    OUTPUT
  );
}

void loop() {
  digitalWrite(
    LED_BUILTIN,
    HIGH
  );

  delay(1000);

  digitalWrite(
    LED_BUILTIN,
    LOW
  );

  delay(1000);
}`;
}

function extractDelay(
  prompt,
  defaultDelay = 1000
) {
  const match = prompt.match(
    /(\d+)\s*(ms|milliseconds?|seconds?)/i
  );

  if (match) {
    let val = parseInt(match[1]);

    if (
      match[2]
        .toLowerCase()
        .startsWith("s")
    ) {
      val *= 1000;
    }

    return Math.min(val, 10000);
  }

  return defaultDelay;
}

function needsColorHardware(prompt) {
  const normalized =
    prompt.toLowerCase();

  return /\b(rgb|red|green|blue|color|colour|purple|yellow|cyan|magenta)\b/.test(
    normalized
  );
}

function componentUsesPin13(component) {
  return Object.values(
    component.config ?? {}
  ).some((value) =>
    String(value)
      .split(",")
      .map(p => p.trim())
      .includes("13")
  );
}

function normalizeBoardSafeConstants(
  code,
  components
) {
  if (
    components.some(componentUsesPin13)
  ) {
    return code;
  }

  return code
    .replace(
      /\bpinMode\s*\(\s*13\s*,/g,
      "pinMode(LED_BUILTIN,"
    )
    .replace(
      /\bdigitalWrite\s*\(\s*13\s*,/g,
      "digitalWrite(LED_BUILTIN,"
    )
    .replace(
      /\banalogWrite\s*\(\s*13\s*,/g,
      "analogWrite(LED_BUILTIN,"
    );
}

function ensureSerialBegin(code) {
  if (
    /\bSerial\s*\.\s*begin\s*\(/.test(
      code
    )
  ) {
    return code;
  }

  return code.replace(
    /void\s+setup\s*\(\s*\)\s*\{/,
    "void setup() {\n  Serial.begin(9600);"
  );
}

function finalizeSketch(
  code,
  components
) {
  return ensureSerialBegin(
    normalizeBoardSafeConstants(
      code,
      components
    )
  );
}

/* ------------------------------------------------ */
/* RULE-BASED GENERATOR */
/* ------------------------------------------------ */

function generateFromPrompt(
  components,
  prompt
) {
  const ledRing = components.find(
    c => c.type === "led-ring"
  );

  const rgbLed = components.find(
    c => c.type === "rgb-led"
  );

  const button = components.find(
    c => c.type === "button"
  );

  const buzzer = components.find(
    c => c.type === "buzzer"
  );

  const servo = components.find(
    c => c.type === "servo"
  );

  const oled = components.find(
    c => c.type === "oled"
  );

  const slidePot = components.find(
    c => c.type === "slide-pot"
  );

  const ultrasonic = components.find(
    c => c.type === "ultrasonic"
  );

  const relay = components.find(
    c => c.type === "relay"
  );

  const lowerPrompt =
    prompt.toLowerCase();

  const delayMs =
    extractDelay(prompt, 1000);

/* BUILT-IN TEMPERATURE SENSOR */

if (
  lowerPrompt.includes("temperature") ||
  lowerPrompt.includes("room") ||
  lowerPrompt.includes("humidity")
) {

  return `#include <Arduino_HTS221.h>

void setup() {

  Serial.begin(9600);

  while (!Serial);

  if (!HTS.begin()) {

    Serial.println(
      "Failed to initialize HTS221"
    );

    while (1);
  }
}

void loop() {

  Serial.print(
    "Temperature: "
  );

  Serial.print(
    HTS.readTemperature()
  );

  Serial.println(" °C");

  delay(${delayMs});
}`;
}

  /* OLED */

  if (oled) {
    return `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);

void setup() {
  Serial.begin(9600);

  if(!display.begin(
    SSD1306_SWITCHCAPVCC,
    0x3C
  )) {
    while(true);
  }

  display.clearDisplay();

  display.setTextSize(2);
  display.setTextColor(WHITE);

  display.setCursor(10, 20);
  display.println("Hello");

  display.display();
}

void loop() {

}`;
  }

  /* RGB LED */

  if (
    rgbLed &&
    (
      lowerPrompt.includes("rgb") ||
      lowerPrompt.includes("color") ||
      lowerPrompt.includes("rainbow")
    )
  ) {
    return `const int redPin = 9;
const int greenPin = 10;
const int bluePin = 11;

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
}

void loop() {
  analogWrite(redPin, 255);
  analogWrite(greenPin, 0);
  analogWrite(bluePin, 0);
  delay(500);

  analogWrite(redPin, 0);
  analogWrite(greenPin, 255);
  analogWrite(bluePin, 0);
  delay(500);

  analogWrite(redPin, 0);
  analogWrite(greenPin, 0);
  analogWrite(bluePin, 255);
  delay(500);
}`;
  }

  /* LED RING */

  if (ledRing) {
    return `#include <Adafruit_NeoPixel.h>

#define PIN 6
#define NUMPIXELS 16

Adafruit_NeoPixel ring(
  NUMPIXELS,
  PIN,
  NEO_GRB + NEO_KHZ800
);

void setup() {
  ring.begin();
}

void loop() {
  for(int i = 0; i < NUMPIXELS; i++) {

    ring.clear();

    ring.setPixelColor(
      i,
      ring.Color(0, 150, 255)
    );

    ring.show();

    delay(120);
  }
}`;
  }

  /* BUTTON */

  if (button) {
    return `const int buttonPin = 2;

void setup() {
  Serial.begin(9600);

  pinMode(
    buttonPin,
    INPUT_PULLUP
  );
}

void loop() {

  if (
    digitalRead(buttonPin)
    == LOW
  ) {

    Serial.println(
      "Button pressed"
    );
  }

  delay(50);
}`;
  }

  /* SERVO */

  if (servo) {
    return `#include <Servo.h>

Servo myServo;

void setup() {
  myServo.attach(3);
}

void loop() {

  myServo.write(0);
  delay(1000);

  myServo.write(90);
  delay(1000);

  myServo.write(180);
  delay(1000);
}`;
  }

  /* BUZZER */

  if (buzzer) {
    return `const int buzzerPin = 4;

void setup() {
  pinMode(
    buzzerPin,
    OUTPUT
  );
}

void loop() {

  tone(
    buzzerPin,
    1000
  );

  delay(500);

  noTone(
    buzzerPin
  );

  delay(500);
}`;
  }

  /* SLIDE POT */

  if (slidePot) {
    return `const int potPin = A0;

void setup() {
  Serial.begin(9600);
}

void loop() {

  int value =
    analogRead(potPin);

  Serial.println(value);

  delay(100);
}`;
  }

  /* RELAY */

  if (relay) {
    return `const int relayPin = 7;

void setup() {
  pinMode(
    relayPin,
    OUTPUT
  );
}

void loop() {

  digitalWrite(
    relayPin,
    HIGH
  );

  delay(1000);

  digitalWrite(
    relayPin,
    LOW
  );

  delay(1000);
}`;
  }

  /* ULTRASONIC */

  if (ultrasonic) {
    return `const int trigPin = 12;
const int echoPin = 13;

void setup() {

  Serial.begin(9600);

  pinMode(
    trigPin,
    OUTPUT
  );

  pinMode(
    echoPin,
    INPUT
  );
}

void loop() {

  digitalWrite(
    trigPin,
    LOW
  );

  delayMicroseconds(2);

  digitalWrite(
    trigPin,
    HIGH
  );

  delayMicroseconds(10);

  digitalWrite(
    trigPin,
    LOW
  );

  long duration =
    pulseIn(
      echoPin,
      HIGH
    );

  float distance =
    duration * 0.034 / 2;

  Serial.print(
    "Distance: "
  );

  Serial.print(distance);

  Serial.println(" cm");

  delay(250);
}`;
  }

  /* DEFAULT */

  return `void setup() {

  pinMode(
    LED_BUILTIN,
    OUTPUT
  );
}

void loop() {

  digitalWrite(
    LED_BUILTIN,
    HIGH
  );

  delay(${delayMs});

  digitalWrite(
    LED_BUILTIN,
    LOW
  );

  delay(${delayMs});
}`;
}

/* ------------------------------------------------ */
/* OPENAI */
/* ------------------------------------------------ */

async function generateWithOpenAI({
  prompt,
  boardType,
  boardLabel,
  components
}) {

  const apiKey =
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      "No OPENAI_API_KEY set."
    );

    return null;
  }

  const model =
    process.env.OPENAI_MODEL ||
    "gpt-3.5-turbo";

  const board = boardLabel
    ? { label: boardLabel }
    : getBoardConfig(boardType);

  const systemPrompt =
`You are an expert Arduino programmer.

Generate only complete Arduino sketches.

Do not include explanations.

Do not use markdown code fences.

Use beginner-friendly code.

Only generate hardware behavior for components that exist in the provided component list.

Use LED_BUILTIN for onboard LEDs.

Return only raw Arduino code.`;

  const userPrompt =
`Board: ${board.label}.
Components: ${buildComponentSummary(components)}.
Requested behavior: ${prompt}.`;

  console.log(
    `Calling OpenAI with model: ${model}`
  );

  let lastError;

  const maxRetries = 2;

  const baseDelay = 1000;

  for (
    let attempt = 1;
    attempt <= maxRetries;
    attempt++
  ) {
    try {

      const response =
        await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${apiKey}`
            },

            body: JSON.stringify({
              model,

              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },

                {
                  role: "user",
                  content: userPrompt
                }
              ],

              temperature: 0.3,

              max_tokens: 1500
            })
          }
        );

      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          `OpenAI API error (${response.status}): ${errorText}`
        );
      }

      const payload =
        await response.json();

      const rawText =
        payload.choices?.[0]
          ?.message?.content?.trim();

      if (!rawText) {
        throw new Error(
          "OpenAI returned empty sketch"
        );
      }

      return stripCodeFences(
        rawText
      );

    } catch (error) {

      lastError = error;

      console.error(
        `OpenAI attempt ${attempt} failed:`,
        error.message
      );

      await sleep(baseDelay);
    }
  }

  console.error(
    "OpenAI generation failed."
  );

  return null;
}

/* ------------------------------------------------ */
/* MAIN EXPORT */
/* ------------------------------------------------ */

export async function generateArduinoCode({
  prompt,
  boardType,
  boardLabel,
  components
}) {

  if (
    needsColorHardware(prompt) &&
    !components.some(
      c => c.type === "rgb-led"
    )
  ) {

    const fallbackCode =
      generateFromPrompt(
        components,
        prompt
      );

    return {
      source: "fallback",

      code: finalizeSketch(
        fallbackCode,
        components
      ),

      warning:
        "RGB behavior requires an RGB LED component."
    };
  }

const lowerPrompt =
  prompt.toLowerCase();

/* FORCE BUILT-IN SENSOR RULES */

if (
  lowerPrompt.includes("temperature") ||
  lowerPrompt.includes("room") ||
  lowerPrompt.includes("humidity")
) {

  const localCode =
    generateFromPrompt(
      components,
      prompt
    );

  return {
    source: "local-rules",

    code: finalizeSketch(
      localCode,
      components
    ),

    warning: null
  };
}

  let openAICode = null;

  if (
    process.env.OPENAI_API_KEY
  ) {
    try {

      openAICode =
        await generateWithOpenAI({
          prompt,
          boardType,
          boardLabel,
          components
        });

    } catch (err) {

      console.error(
        "OpenAI error:",
        err.message
      );
    }
  }

  if (openAICode) {

    return {
      source: "openai",

      code: finalizeSketch(
        stripCodeFences(openAICode),
        components
      ),

      warning: null
    };
  }

  const code =
    generateFromPrompt(
      components,
      prompt
    );

  return {
    source: "local-rules",

    code: finalizeSketch(
      code,
      components
    ),

    warning: null
  };
}
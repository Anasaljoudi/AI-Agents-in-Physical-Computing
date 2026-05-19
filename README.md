# Prompt-to-Programming for Physical Computing

A full-stack web application for generating Arduino programs and wiring diagrams from natural language prompts.

The system transforms a text-based description into:
- Arduino code
- hardware wiring instructions
- visual breadboard diagrams
- live serial monitor output
- automatic compilation and upload workflows

The interaction flow is designed around a simplified prompt-driven workflow:

```text
Connect board → Select components → Describe behavior → Generate and upload

Features
Automatic Arduino board detection
Prompt-based Arduino code generation
Dynamic SVG wiring visualization
Breadboard-based hardware layouts
Automatic pin mapping
Live serial monitor integration
Component-aware code generation
Automatic compile and upload using arduino-cli
OpenAI-powered generation with local fallback templates
Supported Components
LED Ring
Button
Servo
Buzzer
OLED Display
Slide Potentiometer
RGB LED
Relay Module
Ultrasonic Sensor
Tech Stack
Frontend
React
Vite
Backend
Node.js
Express
Hardware Layer
Arduino CLI
Serial communication
SVG-based wiring renderer
Code Generation
OpenAI API
Rule-based fallback generation system
Project Structure
apps/
├── server/
│   ├── config/
│   ├── routes/
│   ├── services/
│   └── utils/
│
└── web/
    ├── components/
    ├── lib/
    └── styles/
Local Setup

Install dependencies:

npm install

Run backend:

npm run dev:server

Run frontend:

npm run dev:web

Open:

http://localhost:5173
Arduino CLI Setup

Install Arduino CLI:

Arduino CLI Documentation

Install AVR core:

arduino-cli core install arduino:avr

Connect an Arduino board over USB before starting the application.

Environment Variables

Create a .env file:

OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
Example Prompts
Blink the built-in LED every second
Change the LED ring color when the button is pressed
Show the room temperature every 1 second
Rotate the servo when an object is detected
System Output

The application generates:

Arduino sketches
SVG wiring diagrams
Breadboard layouts
Pin connection tables
Serial monitor streams
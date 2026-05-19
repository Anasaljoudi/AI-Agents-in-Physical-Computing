export function WiringPanel({ wiring }) {
  if (!wiring?.connections || wiring.connections.length === 0) {
    return (
      <div className="empty-wiring">
        No components selected. Add components in step 2.
      </div>
    );
  }

  return (
    <div className="wiring-panel">
      <div className="pinout-image">
        <img 
          src="/nano33ble-pinout.png" 
          alt="Arduino Nano 33 BLE Pinout"
          style={{ width: '100%', maxWidth: '600px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '8px' }}
        />
        <p className="note" style={{ fontSize: '0.85rem', color: '#555' }}>
          ⚡ Use the pinout diagram above to locate the physical pins on your Arduino.
        </p>
      </div>

      <div className="wiring-table">
        <h3>🔌 Wiring Guide</h3>
        <table className="connections-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Component</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Component Pin</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Arduino Pin</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Wire Color</th>
            </tr>
          </thead>
          <tbody>
            {wiring.connections.map((conn, idx) => (
              <tr key={idx}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{conn.component}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{conn.componentPin}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{conn.arduinoPin}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd', color: conn.color, fontWeight: 'bold' }}>{conn.wireColor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
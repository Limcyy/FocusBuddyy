import { useState } from 'react';
import { useSerial } from '../context/SerialContext';

function ConnectionModal() {
  const { showConnectionModal, connect, isConnected } = useSerial();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  if (!showConnectionModal) {
    return null;
  }

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    
    try {
      const connected = await connect();
      if (!connected) {
        setError('Failed to connect to microbit. Please try again.');
      }
    } catch (err) {
      setError('Error connecting to microbit: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="connection-modal-overlay">
      <div className="connection-modal">
        <h2>Connect to Microbit</h2>
        <p>You need to connect to a microbit device to use this application.</p>
        <p className="connection-instructions">
          1. Connect your microbit to your computer via USB<br />
          2. Click the "Connect" button below<br />
          3. Select your microbit device from the list
        </p>
        
        {error && <p className="error-message">{error}</p>}
        
        <button 
          className={`connect-serial-btn ${isConnected ? 'connected' : ''}`} 
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? 'Connecting...' : isConnected ? 'Connected ✓' : 'Connect to Microbit'}
        </button>
      </div>
    </div>
  );
}

export default ConnectionModal;
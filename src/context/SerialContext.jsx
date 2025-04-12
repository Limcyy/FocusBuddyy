import { createContext, useContext, useState, useEffect } from 'react';
import serialCommunication from '../utils/serialCommunication';

const SerialContext = createContext();

export function SerialProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(true);

  useEffect(() => {
    // Check if already connected when component mounts
    setIsConnected(serialCommunication.isConnected);
    setShowConnectionModal(!serialCommunication.isConnected);
  }, []);

  const connect = async () => {
    try {
      const connected = await serialCommunication.connect();
      setIsConnected(connected);
      if (connected) {
        setShowConnectionModal(false);
      }
      return connected;
    } catch (err) {
      console.error("Serial connection error:", err);
      return false;
    }
  };

  const disconnect = async () => {
    await serialCommunication.disconnect();
    setIsConnected(false);
  };

  return (
    <SerialContext.Provider value={{ 
      isConnected, 
      connect, 
      disconnect,
      showConnectionModal,
      setShowConnectionModal
    }}>
      {children}
    </SerialContext.Provider>
  );
}

export function useSerial() {
  const context = useContext(SerialContext);
  if (!context) {
    throw new Error('useSerial must be used within a SerialProvider');
  }
  return context;
}
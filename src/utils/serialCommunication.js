export class SerialCommunication {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.isConnected = false;
    this.onDataReceived = null;
  }

  async connect() {
    try {
      // Request a serial port
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 115200 });
      
      this.writer = this.port.writable.getWriter();
      this.isConnected = true;
      
      // Start reading from the port
      this.startReading();
      
      return true;
    } catch (error) {
      console.error("Connection error:", error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }
    
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
    
    this.isConnected = false;
  }

  async startReading() {
    while (this.port && this.port.readable) {
      this.reader = this.port.readable.getReader();
      
      try {
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) break;
          
          // Convert the received bytes to a string
          const decodedValue = new TextDecoder().decode(value);
          
          // Call the callback if defined
          if (this.onDataReceived) {
            this.onDataReceived(decodedValue);
          }
        }
      } catch (error) {
        console.error("Error reading data:", error);
      } finally {
        this.reader.releaseLock();
      }
    }
  }

  async sendData(data) {
    if (!this.isConnected || !this.writer) {
      throw new Error("Serial port not connected");
    }
    
    // Convert the string to bytes and send it
    const encoder = new TextEncoder();
    const dataToSend = encoder.encode(data + "\n");
    await this.writer.write(dataToSend);
  }

  setDataReceivedCallback(callback) {
    this.onDataReceived = callback;
  }
}

// Create a singleton instance
const serialCommunication = new SerialCommunication();
export default serialCommunication;
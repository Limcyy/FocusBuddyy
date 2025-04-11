import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import serialCommunication from '../utils/serialCommunication';

function AddPointsPage() {
  const navigate = useNavigate();
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [points, setPoints] = useState('120');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSerialConnected, setIsSerialConnected] = useState(false);

  // Connect to serial and request student list
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Check if already connected
        if (!serialCommunication.isConnected) {
          const connected = await serialCommunication.connect();
          setIsSerialConnected(connected);
          
          if (!connected) {
            setError('Failed to connect to microbit');
            setIsLoading(false);
            return;
          }
        } else {
          setIsSerialConnected(true);
        }

        // Set up response callback
        serialCommunication.setDataReceivedCallback(handleSerialData);
        
        // Send ping to get student list
        await serialCommunication.sendData("ping");
        console.log("Ping sent to microbit");
        
        // Give some time for responses
        setTimeout(() => {
          if (students.length === 0) {
            setError('No students received from microbit');
            setIsLoading(false);
          }
        }, 5000);
      } catch (err) {
        console.error("Serial communication error:", err);
        setError('Error communicating with microbit');
        setIsLoading(false);
      }
    };

    fetchStudents();

    return () => {
      serialCommunication.setDataReceivedCallback(null);
    };
  }, []);

  const handleSerialData = (data) => {
    // Process incoming data from microbit
    console.log("Received from microbit:", data);
    
    const trimmedData = data.trim();
    if (trimmedData.startsWith('USER:')) {
      const studentId = trimmedData.substring(5); // Extract student ID after "USER:"
      setStudents(prev => {
        // Add only if not already in the list
        if (!prev.includes(studentId)) {
          return [...prev, studentId];
        }
        return prev;
      });
      setIsLoading(false);
    }
  };

  const connectToSerial = async () => {
    try {
      const connected = await serialCommunication.connect();
      setIsSerialConnected(connected);
      
      if (connected) {
        setError('');
        // Send ping to get student list
        serialCommunication.setDataReceivedCallback(handleSerialData);
        await serialCommunication.sendData("ping");
      } else {
        setError('Failed to connect to microbit');
      }
    } catch (err) {
      console.error("Serial connection error:", err);
      setError('Error connecting to microbit');
      setIsSerialConnected(false);
    }
  };

  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const submitPoints = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    if (!points || isNaN(parseInt(points)) || parseInt(points) <= 0) {
      setError('Please enter a valid point value');
      return;
    }

    try {
      // Connect if not connected
      if (!isSerialConnected) {
        await connectToSerial();
        if (!serialCommunication.isConnected) {
          setError('Please connect to microbit before submitting points');
          return;
        }
      }

      // Send points to each selected student
      for (const student of selectedStudents) {
        await serialCommunication.sendData(`${student}|points|${points}`);
        console.log(`Points sent to ${student}: ${points}`);
      }

      // Navigate back to home
      navigate('/');
    } catch (err) {
      console.error("Error sending points:", err);
      setError('Failed to send points to microbit');
    }
  };

  return (
    <div className='create-question-container'>
      <div className='create-question-form-container'>
        <h1 style={{color: '#3F3F3F', fontSize: '2.5rem'}}>Vyberte si žáky a počet bodů</h1>
        <div className="deviding-line"></div>
        
        {isLoading ? (
          <div className="loading-message">Načítání studentů...</div>
        ) : students.length > 0 ? (
          <div className="students-grid-container">
            {students.map((student) => (
              <button
                key={student}
                className={`student-button ${selectedStudents.includes(student) ? 'selected' : ''}`}
                onClick={() => toggleStudent(student)}
              >
                {student}
              </button>
            ))}
          </div>
        ) : (
          <div className="serial-connection">
            <button 
              className={`connect-serial-btn ${isSerialConnected ? 'connected' : ''}`} 
              onClick={connectToSerial}
            >
              {isSerialConnected ? 'Connected ✓' : 'Connect to Microbit'}
            </button>
          </div>
        )}
        
        <div className="points-input-container">
          <p>počet bodů:</p>
          <input 
            type="number" 
            value={points} 
            onChange={(e) => setPoints(e.target.value)}
            className="points-input"
          />
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <div className="deviding-line"></div>
        <button 
          className="submit-points-btn" 
          onClick={submitPoints}
          disabled={selectedStudents.length === 0}
        >
          Nahrát Body
        </button>
      </div>
    </div>
  )
}

export default AddPointsPage

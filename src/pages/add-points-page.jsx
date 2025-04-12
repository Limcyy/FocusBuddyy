import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useSerial } from '../context/SerialContext';
import serialCommunication from '../utils/serialCommunication';

function AddPointsPage() {
  const navigate = useNavigate();
  const { isConnected } = useSerial();
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [points, setPoints] = useState('120');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Request student list when component mounts
  useEffect(() => {
    const fetchStudents = async () => {
      if (!isConnected) {
        setIsLoading(false);
        return;
      }

      try {
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
  }, [isConnected]);

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
      if (!isConnected) {
        setError('Microbit not connected');
        return;
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
      <button className="back-button" onClick={() => navigate('/')}>
        <span className="back-arrow">←</span> Zpět
      </button>
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
          <div className="no-students-message">
            <p>Nebyly nalezeni žádní studenti.</p>
            <p>Zkontrolujte, zda je microbit správně připojen a obsahuje seznam studentů.</p>
          </div>
        )}
        
        {isConnected && (
          <div className="connection-status">
            <div className="status-indicator connected"></div>
            <span>Připojeno k Microbit</span>
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

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
  const [pingTimeout, setPingTimeout] = useState(null);

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
        
        // Clear existing students
        setStudents([]);
        
        // Send ping to get student list
        await serialCommunication.sendData("ping");
        console.log("Ping sent to microbit");
        
        // Give some time for responses - clear any existing timeout
        if (pingTimeout) {
          clearTimeout(pingTimeout);
        }
        
        const timeout = setTimeout(() => {
          // If we received no responses, show an error
          if (students.length === 0) {
            setError('No students received from microbit. Make sure your microbit is set up correctly.');
          }
          setIsLoading(false);
        }, 5000);
        
        setPingTimeout(timeout);
      } catch (err) {
        console.error("Serial communication error:", err);
        setError('Error communicating with microbit');
        setIsLoading(false);
      }
    };

    fetchStudents();

    return () => {
      serialCommunication.setDataReceivedCallback(null);
      if (pingTimeout) {
        clearTimeout(pingTimeout);
      }
    };
  }, [isConnected]);

  const handleSerialData = (data) => {
    // Process incoming data from microbit
    console.log("Received from microbit:", data);
    
    const trimmedData = data.trim();
    
    // Check for different possible formats
    if (trimmedData.startsWith('USER:')) {
      // Format: USER:S1
      const studentId = trimmedData.substring(5).trim();
      if (studentId) {
        addStudent(studentId);
      }
    } else if (trimmedData.startsWith('LIST:')) {
      // Format: LIST:S1,S2,S3
      const userList = trimmedData.substring(5).trim();
      if (userList) {
        const userArray = userList.split(',').map(s => s.trim()).filter(Boolean);
        setStudents(prev => {
          const combined = [...prev];
          for (const user of userArray) {
            if (!combined.includes(user)) {
              combined.push(user);
            }
          }
          return combined;
        });
        setIsLoading(false);
      }
    } else if (trimmedData.includes('|')) {
      // Possibly a response with format S1|answer - not relevant here
      // But we could parse it if needed
    }
  };
  
  const addStudent = (studentId) => {
    if (!studentId) return;
    
    setStudents(prev => {
      // Add only if not already in the list
      if (!prev.includes(studentId)) {
        return [...prev, studentId];
      }
      return prev;
    });
    setIsLoading(false);
  };

  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const refreshStudentList = async () => {
    if (!isConnected) {
      setError('Please connect to microbit first');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Clear existing student list
      setStudents([]);
      
      // Send ping to get student list
      await serialCommunication.sendData("ping");
      console.log("Refreshing student list...");
      
      // Set timeout to check if we got responses
      if (pingTimeout) {
        clearTimeout(pingTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (students.length === 0) {
          setError('No students received from microbit');
        }
        setIsLoading(false);
      }, 5000);
      
      setPingTimeout(timeout);
    } catch (err) {
      console.error("Error refreshing student list:", err);
      setError('Failed to refresh student list');
      setIsLoading(false);
    }
  };

  const submitPoints = async () => {
    if (selectedStudents.length === 0) {
      setError('Prosím vyberte alespoň jednoho studenta');
      return;
    }

    if (!points || isNaN(parseInt(points)) || parseInt(points) <= 0) {
      setError('Zadejte platný počet bodů');
      return;
    }

    try {
      if (!isConnected) {
        setError('Microbit není připojen');
        return;
      }

      // Send points to each selected student - using the format "USER|points"
      for (const student of selectedStudents) {
        await serialCommunication.sendData(`${student}|${points}`);
        console.log(`Body odeslány studentovi ${student}: ${points}`);
      }

      // Navigate back to home
      navigate('/');
    } catch (err) {
      console.error("Error sending points:", err);
      setError('Chyba při odesílání bodů do microbitu');
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
          <>
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
            <button 
              className="refresh-students-btn" 
              onClick={refreshStudentList}
            >
              <i className="fas fa-sync"></i> Obnovit seznam studentů
            </button>
          </>
        ) : (
          <div className="no-students-message">
            <p>Nebyly nalezeni žádní studenti.</p>
            <p>Zkontrolujte, zda je microbit správně připojen a obsahuje seznam studentů.</p>
            <button 
              className="refresh-students-btn" 
              onClick={refreshStudentList}
              style={{ marginTop: '1rem' }}
            >
              Zkusit znovu
            </button>
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

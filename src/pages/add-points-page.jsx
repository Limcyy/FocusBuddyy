import { useState, useEffect, useRef } from 'react'
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
  const timeoutRef = useRef(null);
  const pingAttemptsRef = useRef(0);
  const maxPingAttempts = 3;

  // Keep track of whether we're currently listening for student responses
  const listeningForResponsesRef = useRef(false);

  // Request student list when component mounts
  useEffect(() => {
    if (isConnected) {
      fetchStudentList();
    } else {
      setIsLoading(false);
    }

    return () => {
      serialCommunication.setDataReceivedCallback(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isConnected]);

  const fetchStudentList = async () => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }

    try {
      // Set up response callback
      serialCommunication.setDataReceivedCallback(handleSerialData);
      
      // Clear existing student list and reset state
      setStudents([]);
      setError('');
      setIsLoading(true);
      listeningForResponsesRef.current = true;
      pingAttemptsRef.current = 0;
      
      // Send ping to get student list
      await sendPingCommand();
      
    } catch (err) {
      console.error("Serial communication error:", err);
      setError('Chyba při komunikaci s microbit zařízením');
      setIsLoading(false);
      listeningForResponsesRef.current = false;
    }
  };

  const sendPingCommand = async () => {
    try {
      pingAttemptsRef.current++;
      console.log(`Sending ping attempt ${pingAttemptsRef.current}...`);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Send ping command
      await serialCommunication.sendData("ping");
      
      // Set a timeout to check if we received a response
      timeoutRef.current = setTimeout(() => {
        // If we still have no students and have attempts left, try again
        if (students.length === 0 && pingAttemptsRef.current < maxPingAttempts) {
          console.log(`No response received, trying again (attempt ${pingAttemptsRef.current + 1} of ${maxPingAttempts})...`);
          sendPingCommand();
        } else if (students.length === 0) {
          // If we've tried multiple times and still have no students, show an error
          setError('Žádní studenti nebyli nalezeni. Zkontrolujte připojení k microbit zařízení.');
          setIsLoading(false);
          listeningForResponsesRef.current = false;
        } else {
          // We have some students, but no more are coming in
          setIsLoading(false);
        }
      }, 8000); // Longer timeout (8 seconds) to give microbit time to respond
      
    } catch (err) {
      console.error("Error sending ping:", err);
      setError('Chyba při odesílání ping příkazu');
      setIsLoading(false);
      listeningForResponsesRef.current = false;
    }
  };

  const handleSerialData = (data) => {
    // If we're not listening for responses, ignore the data
    if (!listeningForResponsesRef.current) return;
    
    // Process incoming data from microbit
    console.log("Received from microbit:", data);
    
    const trimmedData = data.trim();
    
    // Check for different possible formats
    if (trimmedData.startsWith('USER:')) {
      // Format: USER:S1
      const studentId = trimmedData.substring(5).trim();
      
      if (studentId && !studentId.includes('|')) {
        // Valid student ID, add to our list
        addStudent(studentId);
        
        // Received a valid response, so we can stop the loading state
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            // After a short delay, assume we have all students
            setIsLoading(false);
          }, 2000);
        }
      }
    } else if (trimmedData === 'CLEAR_USERS') {
      // Clear the student list
      setStudents([]);
    } else if (trimmedData.startsWith('LIST:')) {
      // Format: LIST:S1,S2,S3
      setStudents([]); // Clear list first
      
      const userList = trimmedData.substring(5).trim();
      if (userList) {
        const userArray = userList.split(',')
          .map(s => s.trim())
          .filter(s => s && !s.includes('|')); // Filter out empty or malformed IDs
        
        setStudents(userArray);
        setIsLoading(false);
        listeningForResponsesRef.current = false; // Stop listening after getting full list
      }
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
  };

  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const refreshStudentList = () => {
    fetchStudentList();
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
          <div className="loading-message">
            Načítání studentů...
            <div className="ping-status">Odesílám ping příkaz na microbit</div>
          </div>
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
              disabled={isLoading}
            >
              {isLoading ? 'Načítání...' : 'Obnovit seznam studentů'}
            </button>
          </>
        ) : (
          <div className="no-students-message">
            <p>Nebyly nalezeni žádní studenti.</p>
            <p>Zkontrolujte, zda je microbit správně připojen a obsahuje seznam studentů.</p>
            <button 
              className="refresh-students-btn" 
              onClick={refreshStudentList}
              disabled={isLoading}
              style={{ marginTop: '1rem' }}
            >
              {isLoading ? 'Načítání...' : 'Zkusit znovu'}
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

import { useNavigate } from 'react-router-dom';
import { useQuestion } from '../context/QuestionContext';
import { useEffect, useState } from 'react';
import serialCommunication from '../utils/serialCommunication';

function QuestionDisplayPage() {
  const navigate = useNavigate();
  const { questionData, addStudentResponse, studentResponses } = useQuestion();
  const [timeLeft, setTimeLeft] = useState(questionData.timeLimit);
  const [localResponses, setLocalResponses] = useState([]);

  useEffect(() => {
    // Set up serial data handler
    serialCommunication.setDataReceivedCallback(handleSerialData);
    
    return () => {
      serialCommunication.setDataReceivedCallback(null);
    };
  }, []);
  
  const handleSerialData = (data) => {
    // Process incoming data from microbit in format "USER|answer" (e.g., "S1|a")
    console.log("Received from microbit:", data);
    
    const trimmedData = data.trim();
    
    // Handle possible response formats
    let student, answer;
    
    if (trimmedData.includes('|')) {
      // Format: "S1|a"
      [student, answer] = trimmedData.split('|');
      
      // Clean up student ID - remove any "USER:" prefix
      if (student.startsWith('USER:')) {
        student = student.substring(5);
      }
      
      // Make sure it's a valid student response
      if (student && answer) {
        // Store in context so it's available to results page
        if (answer.length === 1) { // Make sure we only process single letter answers (a, b, c, d)
          addStudentResponse(student.trim(), answer.trim().toLowerCase());
          
          // Also update local state for display
          setLocalResponses(prev => {
            const existingIndex = prev.findIndex(resp => resp.student === student);
            if (existingIndex !== -1) {
              const newResponses = [...prev];
              newResponses[existingIndex] = { student, answer: answer.trim().toLowerCase(), timestamp: new Date() };
              return newResponses;
            } else {
              return [...prev, { student, answer: answer.trim().toLowerCase(), timestamp: new Date() }];
            }
          });
        }
      }
    }
  };

  useEffect(() => {
    if (!questionData.timeLimit) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          navigate('/results');
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questionData.timeLimit, navigate]);

  useEffect(() => {
    if (!questionData.title) {
      navigate('/');
    }
  }, [questionData, navigate]);

  if (!questionData.title) return null;

  // Map letter answers to colors for visual indication
  const getAnswerColor = (answer) => {
    switch(answer.toLowerCase()) {
      case 'a': return '#F0BA20'; // yellow
      case 'b': return '#F0484B'; // red
      case 'c': return '#81C75B'; // green
      case 'd': return '#4F90CD'; // blue
      default: return '#888888';
    }
  };

  return (
    <div className='create-question-container'>
      <div className='display-question-container'>
        <h1>{questionData.title}</h1>
        <div className='options-container'>
          {questionData.options.map((option, index) => (
            <div 
              key={index} 
              className={`option-container-${index === 0 ? 'one' : index === 1 ? 'two' : index === 2 ? 'three' : 'four'}`}
              style={{
                boxShadow: questionData.correctAnswer === ['#F0BA20', '#F0484B', '#81C75B', '#4F90CD'][index] 
                  ? '0px 7.065px 0px 0px ' + questionData.correctAnswer
                  : undefined
              }}
            >
              <p>{option}</p>
            </div>
          ))}
        </div>
        
        {localResponses.length > 0 && (
          <div className="student-responses">
            <h3>Odpovědi studentů: {localResponses.length}</h3>
            <div className="responses-list">
              {localResponses.map((response, index) => (
                <div key={index} className="response-item">
                  <span className="student-id">{response.student}:</span>
                  <span 
                    className="student-answer"
                    style={{ backgroundColor: getAnswerColor(response.answer), color: 'white', padding: '0 8px', borderRadius: '4px' }}
                  >
                    {response.answer.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {timeLeft > 0 && (
        <div className='timer-container'>
          <p>{timeLeft}s zbývá</p>
        </div>
      )}
      <p className="cancel-question-btn" onClick={() => navigate('/')}>zrušit</p>
    </div>
  );
}

export default QuestionDisplayPage;

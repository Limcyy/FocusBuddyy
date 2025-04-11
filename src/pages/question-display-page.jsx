import { useNavigate } from 'react-router-dom';
import { useQuestion } from '../context/QuestionContext';
import { useEffect, useState } from 'react';
import serialCommunication from '../utils/serialCommunication';

function QuestionDisplayPage() {
  const navigate = useNavigate();
  const { questionData } = useQuestion();
  const [timeLeft, setTimeLeft] = useState(questionData.timeLimit);
  const [studentResponses, setStudentResponses] = useState([]);

  useEffect(() => {
    // Set up serial data handler
    serialCommunication.setDataReceivedCallback(handleSerialData);
    
    return () => {
      serialCommunication.setDataReceivedCallback(null);
    };
  }, []);
  
  const handleSerialData = (data) => {
    // Process incoming data from microbit
    const trimmedData = data.trim();
    if (trimmedData.includes('|')) {
      const [student, answer] = trimmedData.split('|');
      // Add to the responses
      setStudentResponses(prev => [...prev, { student, answer, timestamp: new Date() }]);
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
        
        {studentResponses.length > 0 && (
          <div className="student-responses">
            <h3>Student Responses:</h3>
            <div className="responses-list">
              {studentResponses.map((response, index) => (
                <div key={index} className="response-item">
                  <span className="student-id">{response.student}:</span>
                  <span className="student-answer">{response.answer}</span>
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

import { useNavigate } from 'react-router-dom';
import { useQuestion } from '../context/QuestionContext';
import { useEffect, useState } from 'react';
import serialCommunication from '../utils/serialCommunication';

function QuestionResultsPage() {
  const navigate = useNavigate();
  const { questionData, studentResponses } = useQuestion();
  const [results, setResults] = useState({
    '1': 0, '2': 0, '3': 0, '4': 0, other: 0
  });
  const [totalResponses, setTotalResponses] = useState(0);
  const [processedResponses, setProcessedResponses] = useState([]);
  const [pointsSent, setPointsSent] = useState(false);
  const [sendingPoints, setSendingPoints] = useState(false);

  useEffect(() => {
    if (!questionData.title) {
      navigate('/');
      return;
    }

    console.log("Processing student responses:", studentResponses);
    
    // Process student responses - deduplicate by student ID
    const uniqueStudents = new Map();
    
    // First, get the latest response from each student
    studentResponses.forEach(response => {
      const studentId = response.student;
      
      // If this student already exists in our map, only update if this response is newer
      if (uniqueStudents.has(studentId)) {
        const existing = uniqueStudents.get(studentId);
        if (response.timestamp > existing.timestamp) {
          uniqueStudents.set(studentId, response);
        }
      } else {
        // New student response
        uniqueStudents.set(studentId, response);
      }
    });
    
    // Convert the map values to an array for display
    const processed = Array.from(uniqueStudents.values());
    
    console.log("Processed unique responses:", processed);
    setProcessedResponses(processed);
    
    // Now count answers based on the unique student responses
    const answerCounts = { '1': 0, '2': 0, '3': 0, '4': 0, other: 0 };
    
    processed.forEach(response => {
      const answer = response.answer?.toString().trim();
      console.log(`Counting answer for ${response.student}: "${answer}"`);
      
      if (['1', '2', '3', '4'].includes(answer)) {
        answerCounts[answer]++;
      } else {
        answerCounts.other++;
      }
    });
    
    console.log("Final answer counts:", answerCounts);
    
    setResults(answerCounts);
    setTotalResponses(processed.length);
  }, [questionData, studentResponses, navigate]);

  const getCorrectAnswerIndex = () => {
    const colors = ['#F0BA20', '#F0484B', '#81C75B', '#4F90CD'];
    return colors.indexOf(questionData.correctAnswer);
  };

  const correctAnswerNumber = ['1', '2', '3', '4'][getCorrectAnswerIndex()];

  const getAnswerPercentage = (answer) => {
    if (totalResponses === 0) return 0;
    return Math.round((results[answer] / totalResponses) * 100);
  };

  const getBarColor = (answer) => {
    const colors = {
      '1': '#F0BA20', // yellow
      '2': '#F0484B', // red
      '3': '#81C75B', // green
      '4': '#4F90CD'  // blue
    };
    return colors[answer] || '#888888';
  };

  const isCorrectAnswer = (response) => {
    return response.answer?.toString().trim() === correctAnswerNumber;
  };

  const sendPointsToCorrectStudents = async () => {
    if (pointsSent || !serialCommunication.isConnected) return;
    
    try {
      setSendingPoints(true);
      
      // Find students who answered correctly
      const correctStudents = processedResponses.filter(isCorrectAnswer);
      
      if (correctStudents.length === 0) {
        alert('Žádný student neodpověděl správně');
        setSendingPoints(false);
        return;
      }
      
      // Send 100 points to each correct student
      const pointsToSend = 100;
      
      for (const student of correctStudents) {
        await serialCommunication.sendData(`${student.student}|${pointsToSend}`);
        console.log(`Body odeslány studentovi ${student.student}: ${pointsToSend}`);
      }
      
      // Mark points as sent to prevent duplicate sending
      setPointsSent(true);
      alert(`Body (${pointsToSend}) byly úspěšně odeslány ${correctStudents.length} studentům!`);
    } catch (err) {
      console.error("Error sending points:", err);
      alert('Chyba při odesílání bodů');
    } finally {
      setSendingPoints(false);
    }
  };

  if (!questionData.title) return null;

  return (
    <div className='create-question-container'>
      <div className='display-question-container'>
        <div className="results-message">
          <p>Správná odpověď na otázku:</p>
          <h1>{questionData.title}</h1>
        </div>
        
        <div className="results-chart-container enhanced">
          <div className="results-stats">
            <p>Celkem odpovědí: <strong>{totalResponses}</strong></p>
            <p>Správná odpověď: <strong className="highlight">{correctAnswerNumber}</strong></p>
          </div>
          
          <div className="answer-bars">
            {['1', '2', '3', '4'].map((answer, index) => (
              <div className="answer-bar-container" key={answer}>
                <div className="answer-label">
                  <span 
                    className={`answer-letter ${answer === correctAnswerNumber ? 'correct' : ''}`}
                    style={{ backgroundColor: getBarColor(answer) }}
                  >
                    {answer}
                  </span>
                  <span className={`answer-text ${answer === correctAnswerNumber ? 'answer-text-correct' : ''}`}>
                    {questionData.options[index]}
                  </span>
                </div>
                <div className="answer-bar-wrapper">
                  <div 
                    className={`answer-bar ${answer === correctAnswerNumber ? 'correct' : ''}`}
                    style={{ 
                      width: results[answer] > 0 ? `${Math.max(getAnswerPercentage(answer), 5)}%` : '0',
                      backgroundColor: getBarColor(answer),
                      minWidth: results[answer] > 0 ? '40px' : '0',
                      boxShadow: answer === correctAnswerNumber 
                        ? '0px 0px 15px rgba(255, 255, 255, 0.5), 0px 0px 20px ' + getBarColor(answer) 
                        : 'none'
                    }}
                  >
                    <span className="answer-count">{results[answer]}</span>
                  </div>
                  <span className="answer-percentage">{getAnswerPercentage(answer)}%</span>
                </div>
              </div>
            ))}
          </div>
          
          {processedResponses.length > 0 && (
            <>
              <div className="student-results">
                <h3>Odpovědi podle studentů:</h3>
                <div className="student-results-grid">
                  {processedResponses.map((response, index) => (
                    <div 
                      key={index} 
                      className={`student-result-item ${isCorrectAnswer(response) ? 'correct' : 'incorrect'}`}
                    >
                      <span className="student-id">{response.student}</span>
                      <span 
                        className="student-answer"
                        style={{ backgroundColor: getBarColor(response.answer) }}
                      >
                        {response.answer || '?'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="points-award-section">
                <button 
                  className="award-points-btn"
                  onClick={sendPointsToCorrectStudents}
                  disabled={pointsSent || sendingPoints}
                >
                  {pointsSent 
                    ? 'Body již byly odeslány ✓' 
                    : sendingPoints 
                      ? 'Odesílání bodů...' 
                      : 'Udělit body za správné odpovědi'}
                </button>
                <p className="points-info">
                  Udělí 100 bodů každému studentovi, který odpověděl správně.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="back-home-btn" onClick={() => navigate('/')}>
        zpět domů
      </div>
    </div>
  );
}

export default QuestionResultsPage;
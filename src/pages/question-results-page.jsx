import { useNavigate } from 'react-router-dom';
import { useQuestion } from '../context/QuestionContext';
import { useEffect, useState } from 'react';

function QuestionResultsPage() {
  const navigate = useNavigate();
  const { questionData, studentResponses } = useQuestion();
  const [results, setResults] = useState({
    a: 0, b: 0, c: 0, d: 0, other: 0
  });
  const [totalResponses, setTotalResponses] = useState(0);

  useEffect(() => {
    if (!questionData.title) {
      navigate('/');
      return;
    }

    // Process student responses
    const answerCounts = { a: 0, b: 0, c: 0, d: 0, other: 0 };
    
    studentResponses.forEach(response => {
      const answer = response.answer.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(answer)) {
        answerCounts[answer]++;
      } else {
        answerCounts.other++;
      }
    });
    
    setResults(answerCounts);
    setTotalResponses(studentResponses.length);
  }, [questionData, studentResponses, navigate]);

  const getCorrectAnswerIndex = () => {
    const colors = ['#F0BA20', '#F0484B', '#81C75B', '#4F90CD'];
    return colors.indexOf(questionData.correctAnswer);
  };

  const correctAnswerLetter = ['a', 'b', 'c', 'd'][getCorrectAnswerIndex()];

  const getAnswerPercentage = (answer) => {
    if (totalResponses === 0) return 0;
    return Math.round((results[answer] / totalResponses) * 100);
  };

  const getBarColor = (answer) => {
    const colors = {
      a: '#F0BA20', // yellow
      b: '#F0484B', // red
      c: '#81C75B', // green
      d: '#4F90CD'  // blue
    };
    return colors[answer] || '#888888';
  };

  if (!questionData.title) return null;

  return (
    <div className='create-question-container'>
      <div className='display-question-container'>
        <div className="results-message">
          <p>Správná odpověď na otázku:</p>
          <h1>{questionData.title}</h1>
        </div>
        
        <div className="results-chart-container">
          <div className="results-stats">
            <p>Celkem odpovědí: <strong>{totalResponses}</strong></p>
            <p>Správná odpověď: <strong>{correctAnswerLetter.toUpperCase()}</strong></p>
          </div>
          
          <div className="answer-bars">
            {['a', 'b', 'c', 'd'].map((answer, index) => (
              <div className="answer-bar-container" key={answer}>
                <div className="answer-label">
                  <span 
                    className={`answer-letter ${answer === correctAnswerLetter ? 'correct' : ''}`}
                    style={{ backgroundColor: getBarColor(answer) }}
                  >
                    {answer.toUpperCase()}
                  </span>
                  <span className="answer-text">{questionData.options[index]}</span>
                </div>
                <div className="answer-bar-wrapper">
                  <div 
                    className={`answer-bar ${answer === correctAnswerLetter ? 'correct' : ''}`}
                    style={{ 
                      width: `${getAnswerPercentage(answer)}%`,
                      backgroundColor: getBarColor(answer),
                      minWidth: results[answer] > 0 ? '30px' : '0'
                    }}
                  >
                    <span className="answer-count">{results[answer]}</span>
                  </div>
                  <span className="answer-percentage">{getAnswerPercentage(answer)}%</span>
                </div>
              </div>
            ))}
          </div>
          
          {studentResponses.length > 0 && (
            <div className="student-results">
              <h3>Odpovědi podle studentů:</h3>
              <div className="student-results-grid">
                {studentResponses.map((response, index) => (
                  <div 
                    key={index} 
                    className={`student-result-item ${response.answer.toLowerCase() === correctAnswerLetter ? 'correct' : 'incorrect'}`}
                  >
                    <span className="student-id">{response.student}</span>
                    <span 
                      className="student-answer"
                      style={{ backgroundColor: getBarColor(response.answer.toLowerCase()) }}
                    >
                      {response.answer.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
        
        <div className="deviding-line"></div>
        
        <div className='options-container'>
          {questionData.options.map((option, index) => (
            <div 
              key={index} 
              className={`
                option-container-${index === 0 ? 'one' : index === 1 ? 'two' : index === 2 ? 'three' : 'four'}
                ${index === getCorrectAnswerIndex() ? 'correct-answer' : 'incorrect-answer'}
              `}
            >
              <p>{option}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="back-home-btn" onClick={() => navigate('/')}>
        zpět domů
      </div>
    </div>
  );
}

export default QuestionResultsPage;
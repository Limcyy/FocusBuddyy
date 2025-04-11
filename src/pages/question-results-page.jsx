import { useNavigate } from 'react-router-dom';
import { useQuestion } from '../context/QuestionContext';
import { useEffect } from 'react';

function QuestionResultsPage() {
  const navigate = useNavigate();
  const { questionData } = useQuestion();

  useEffect(() => {
    if (!questionData.title) {
      navigate('/');
    }
  }, [questionData, navigate]);

  const getCorrectAnswerIndex = () => {
    const colors = ['#F0BA20', '#F0484B', '#81C75B', '#4F90CD'];
    return colors.indexOf(questionData.correctAnswer);
  };

  if (!questionData.title) return null;

  return (
    <div className='create-question-container'>
      <div className='display-question-container'>
        <div className="results-message">
          <p>Správná odpověď na otázku:</p>
          <h1>{questionData.title}</h1>
        </div>
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
import addQuestionButton from '../assets/add-question-button.png'
import addPointsButton from '../assets/add-points-button.png'
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate();

  const handleQuestionClick = () => {
    navigate('/create');
  };

  return (
    <div className='main-page-container'>
      <div className='choose-action-container'>
        <h1>Co chcete přidat?</h1>
        <div className='choose-action-buttons-container'>
          <button className='choose-action-button' onClick={handleQuestionClick}>
            <p>dočasnou otázku</p>
            <img src={addQuestionButton} alt='choose-action-button' />
          </button>
          <button className='choose-action-button'>
            <p>body za aktivitu</p>
            <img src={addPointsButton} alt='choose-action-button' />
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomePage 
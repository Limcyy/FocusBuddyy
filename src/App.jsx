import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import addQuestionButton from './assets/add-question-button.png'
import addPointsButton from './assets/add-points-button.png'
import CreateQuestionPage from './pages/create-question-page'
import QuestionDisplayPage from './pages/question-display-page'
import QuestionResultsPage from './pages/question-results-page'
import AddPointsPage from './pages/add-points-page'
import { QuestionProvider } from './context/QuestionContext'

function MainPage() {
  const navigate = useNavigate();

  return (
    <div className='main-page-container'>
      <div className='choose-action-container'>
        <h1>Co chcete přidat?</h1>
        <div className='choose-action-buttons-container'>
          <button className='choose-action-button' onClick={() => navigate('/create')}>
            <p>dočasnou otázku</p>
            <img src={addQuestionButton} alt='choose-action-button' />
          </button>
          <button className='choose-action-button' onClick={() => navigate('/add')}>
            <p>body za aktivitu</p>
            <img src={addPointsButton} alt='choose-action-button' />
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QuestionProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/create" element={<CreateQuestionPage />} />
          <Route path="/display" element={<QuestionDisplayPage />} />
          <Route path="/results" element={<QuestionResultsPage />} />
          <Route path="/add" element={<AddPointsPage />} />
        </Routes>
      </Router>
    </QuestionProvider>
  )
}

export default App

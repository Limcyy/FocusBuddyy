import { useState } from 'react'
import { useNavigate } from 'react-router-dom';

function AddPointsPage() {
  const navigate = useNavigate();
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [points, setPoints] = useState('120');

  const students = [
    'Filip Dvořák', 'Filip Dvořák', 'Filip Dvořák', 'Filip Dvořák',
    'Filip Dvořák', 'Filip Dvořák', 'Filip Dvořák', 'Filip Dvořák',
    'Filip Dvořák', 'Filip Dvořák', 'Filip Dvořák', 'Filip Dvořák'
  ];

  const toggleStudent = (index) => {
    if (selectedStudents.includes(index)) {
      setSelectedStudents(selectedStudents.filter(i => i !== index));
    } else {
      setSelectedStudents([...selectedStudents, index]);
    }
  };

  return (
    <div className='create-question-container'>
      <div className='create-question-form-container'>
        <h1 style={{color: '#3F3F3F', fontSize: '2.5rem'}}>Vyberte si žáky a počet bodů</h1>
        <div className="deviding-line"></div>
        <div className="students-grid-container">
          {students.map((student, index) => (
            <button
              key={index}
              className={`student-button ${selectedStudents.includes(index) ? 'selected' : ''}`}
              onClick={() => toggleStudent(index)}
            >
              {student}
            </button>
          ))}
        </div>
        <div className="points-input-container">
          <p>počet bodů:</p>
          <input 
            type="number" 
            value={points} 
            onChange={(e) => setPoints(e.target.value)}
            className="points-input"
          />
        </div>
        <div className="deviding-line"></div>
        <button className="submit-points-btn" onClick={() => navigate('/')}>Nahrát Body</button>
      </div>
    </div>
  )
}

export default AddPointsPage

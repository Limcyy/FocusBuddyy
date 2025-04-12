import { useState, useEffect } from 'react'
import arrowDown from '../assets/arrow-down.png'
import { useNavigate } from 'react-router-dom'
import { useQuestion } from '../context/QuestionContext'
import { useSerial } from '../context/SerialContext'
import serialCommunication from '../utils/serialCommunication'

function CreateQuestionPage() {
  const navigate = useNavigate();
  const { updateQuestionData } = useQuestion();
  const { isConnected } = useSerial();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    options: ['', '', '', ''],
    correctAnswer: '#F0BA20',
    timeLimit: '10'
  });

  const colors = [
    { color: '#F0BA20', name: 'yellow' },
    { color: '#F0484B', name: 'red' },
    { color: '#81C75B', name: 'green' },
    { color: '#4F90CD', name: 'blue' }
  ];

  const timeOptions = [
    { value: '5', label: '5 sekund' },
    { value: '10', label: '10 sekund' },
    { value: '20', label: '20 sekund' }
  ];

  // Set up serial data callback
  useEffect(() => {
    serialCommunication.setDataReceivedCallback(handleSerialData);
    
    return () => {
      serialCommunication.setDataReceivedCallback(null);
    };
  }, []);

  const handleSerialData = (data) => {
    // Process incoming data from microbit
    console.log("Received from microbit:", data);
    // Format: "USER|answer" (e.g., "S1|a")
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
    setError('');
  };

  const handleTimeChange = (value) => {
    if (value && parseInt(value) > 0) {
      setFormData({ ...formData, timeLimit: value });
      setIsTimeDropdownOpen(false);
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Vyplňte název otázky');
      return false;
    }

    const emptyOptions = formData.options.findIndex(opt => !opt.trim());
    if (emptyOptions !== -1) {
      setError(`Vyplňte odpověď ${emptyOptions + 1}`);
      return false;
    }

    if (!formData.timeLimit || parseInt(formData.timeLimit) <= 0) {
      setError('Zadejte platný časový limit');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      if (!isConnected) {
        setError('Please connect to microbit before starting');
        return;
      }

      try {
        // Send the question command to microbit - using the new format "question"
        await serialCommunication.sendData("question");
        console.log("Question sent to microbit");
        
        updateQuestionData({
          ...formData,
          timeLimit: parseInt(formData.timeLimit)
        });
        navigate('/display');
      } catch (err) {
        console.error("Error sending data to microbit:", err);
        setError('Failed to send question to microbit');
      }
    }
  };

  return (
    <div className='create-question-container'>
      <button className="back-button" onClick={() => navigate('/')}>
        <span className="back-arrow">←</span> Zpět
      </button>
      <div className='create-question-form-container'>
        <input 
          className={`question-title-input ${error === 'Vyplňte název otázky' ? 'error' : ''}`}
          type="text" 
          placeholder='Název otázky'
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value });
            setError('');
          }}
        />
        <div className="deviding-line"></div>
        <div className="options-container">
          {[1, 2, 3, 4].map((num, index) => (
            <div 
              key={num} 
              className={`option-container-${num === 1 ? 'one' : num === 2 ? 'two' : num === 3 ? 'three' : 'four'} ${error === `Vyplňte odpověď ${index + 1}` ? 'error' : ''}`}
            >
              <input 
                type="text" 
                placeholder={`Odpověď ${num}`}
                value={formData.options[index]}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="deviding-line"></div>
        <div className="extra-options-container">
          <div className="correct-answer-dropdown">
            <button className="correct-answer-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              správná odpověď 
              <img 
                src={arrowDown} 
                alt="" 
                style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
              <div className="selected-color" style={{ backgroundColor: formData.correctAnswer }}></div>
            </button>
            {isDropdownOpen && (
              <div className="color-dropdown">
                {colors.map((color) => (
                  <div
                    key={color.name}
                    className="color-option"
                    onClick={() => {
                      setFormData({ ...formData, correctAnswer: color.color });
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div 
                      className="color-circle" 
                      style={{ backgroundColor: color.color }}
                    ></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="time-limit-dropdown">
            <button 
              className={`time-limit-btn ${error === 'Zadejte platný časový limit' ? 'error' : ''}`}
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
            >
              časový limit: {formData.timeLimit}s
              <img 
                src={arrowDown} 
                alt="" 
                style={{ transform: isTimeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
            {isTimeDropdownOpen && (
              <div className="time-options-dropdown">
                {timeOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`time-option ${formData.timeLimit === option.value ? 'selected' : ''}`}
                    onClick={() => handleTimeChange(option.value)}
                  >
                    {option.label}
                  </div>
                ))}
                <div className="custom-time-option">
                  <input 
                    type="number" 
                    placeholder="nebo vlastní"
                    value={!timeOptions.some(opt => opt.value === formData.timeLimit) ? formData.timeLimit : ''}
                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                  />
                  <button 
                    className="set-time-btn"
                    onClick={() => handleTimeChange(formData.timeLimit)}
                  >
                    nastavit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {isConnected && (
          <div className="connection-status">
            <div className="status-indicator connected"></div>
            <span>Připojeno k Microbit</span>
          </div>
        )}
        
        {error && <p className="error-message">{error}</p>}
        <button className="create-question-btn" onClick={handleSubmit}>
          Vytvořit otázku
        </button>
      </div>
    </div>
  )
}

export default CreateQuestionPage
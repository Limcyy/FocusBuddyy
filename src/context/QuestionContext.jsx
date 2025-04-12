import { createContext, useContext, useState } from 'react';

const QuestionContext = createContext();

export function QuestionProvider({ children }) {
  const [questionData, setQuestionData] = useState({
    title: '',
    options: ['', '', '', ''],
    correctAnswer: '#F0BA20', // Default yellow
    timeLimit: 0
  });
  
  // Add state for student responses
  const [studentResponses, setStudentResponses] = useState([]);

  const updateQuestionData = (newData) => {
    setQuestionData(newData);
    setStudentResponses([]); // Reset responses when a new question is created
  };

  // Process and normalize student ID
  const normalizeStudentId = (student) => {
    if (!student) return '';
    
    // Remove any "USER:" prefix
    let id = student.trim();
    if (id.startsWith('USER:')) {
      id = id.substring(5).trim();
    }
    
    // Normalize case to uppercase for consistency
    if (id.startsWith('s')) {
      id = 'S' + id.substring(1);
    }
    
    return id;
  };

  const addStudentResponse = (student, answer) => {
    if (!student) return;
    
    // Normalize student ID and answer
    const normalizedStudent = normalizeStudentId(student);
    const normalizedAnswer = answer ? answer.toString().trim() : '';
    
    console.log(`Adding response: ${normalizedStudent} → ${normalizedAnswer}`);
    
    setStudentResponses(prev => {
      // Check if student already answered
      const existingIndex = prev.findIndex(resp => resp.student === normalizedStudent);
      if (existingIndex !== -1) {
        // Update existing response
        const newResponses = [...prev];
        newResponses[existingIndex] = { 
          ...newResponses[existingIndex],
          answer: normalizedAnswer,
          timestamp: new Date()
        };
        return newResponses;
      } else {
        // Add new response
        return [...prev, { 
          student: normalizedStudent, 
          answer: normalizedAnswer, 
          timestamp: new Date() 
        }];
      }
    });
  };

  return (
    <QuestionContext.Provider value={{ 
      questionData, 
      updateQuestionData,
      studentResponses,
      addStudentResponse
    }}>
      {children}
    </QuestionContext.Provider>
  );
}

export function useQuestion() {
  const context = useContext(QuestionContext);
  if (!context) {
    throw new Error('useQuestion must be used within a QuestionProvider');
  }
  return context;
}
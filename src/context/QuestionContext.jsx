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

  const addStudentResponse = (student, answer) => {
    setStudentResponses(prev => {
      // Check if student already answered
      const existingIndex = prev.findIndex(resp => resp.student === student);
      if (existingIndex !== -1) {
        // Update existing response
        const newResponses = [...prev];
        newResponses[existingIndex] = { 
          ...newResponses[existingIndex],
          answer,
          timestamp: new Date()
        };
        return newResponses;
      } else {
        // Add new response
        return [...prev, { student, answer, timestamp: new Date() }];
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
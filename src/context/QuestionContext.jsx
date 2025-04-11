import { createContext, useContext, useState } from 'react';

const QuestionContext = createContext();

export function QuestionProvider({ children }) {
  const [questionData, setQuestionData] = useState({
    title: '',
    options: ['', '', '', ''],
    correctAnswer: '#F0BA20', // Default yellow
    timeLimit: 0
  });

  const updateQuestionData = (newData) => {
    setQuestionData(newData);
  };

  return (
    <QuestionContext.Provider value={{ questionData, updateQuestionData }}>
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
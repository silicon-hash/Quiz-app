"use client";

import React, { useEffect, useState } from 'react';

interface Question {
  id: string;
  question: string;
  choice: { id: string; text: string }[];
}

interface TestResult {
  correctAnswers: number;
  score: number;
  correctAnswersIds: string[][];
  userAnswers: string[][];
}

interface TestResultsProps {
  testid: string;
  questions: Question[];
}

const TestResults: React.FC<TestResultsProps> = ({ testid, questions: initialQuestions }) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const response = await fetch(`/api/test/${testid}`);
        const data = await response.json();
        if (data.err) {
          console.error(data.msg);
        } else {
          const { questions: fetchedQuestions, userAnswers } = data.data;
          setQuestions(fetchedQuestions);
          
          const correctAnswers = fetchedQuestions.reduce((count: number, question: any, index: number) => {
            const isCorrect = JSON.stringify(question.answer.sort()) === JSON.stringify(userAnswers[index].sort());
            return count + (isCorrect ? 1 : 0);
          }, 0);

          const score = (correctAnswers / fetchedQuestions.length) * 100;

          setTestResult({
            correctAnswers,
            score,
            correctAnswersIds: fetchedQuestions.map((q: any) => q.answer),
            userAnswers,
          });
        }
      } catch (error) {
        console.error("Failed to fetch test data:", error);
      }
    };

    fetchTestData();
  }, [testid]);

  if (!testResult) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex justify-center">
      <div className="max-w-3xl w-full px-4">
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Test Results</h2>
          <p>Total Questions: {questions.length}</p>
          <p>Correct Answers: {testResult.correctAnswers}</p>
          <p>Score: {testResult.score.toFixed(2)}%</p>
          <div className="mt-6">
            {questions.map((question, index) => (
              <div key={question.id} className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Question {index + 1}</h3>
                <p className="mb-2">{question.question}</p>
                <div className="space-y-2">
                  {question.choice.map((choice) => (
                    <div
                      key={choice.id}
                      className={`p-2 rounded ${
                        testResult.correctAnswersIds[index]?.includes(choice.id)
                          ? 'bg-green-200 dark:bg-green-700'
                          : testResult.userAnswers[index]?.includes(choice.id)
                          ? 'bg-red-200 dark:bg-red-700'
                          : 'bg-white dark:bg-gray-700'
                      }`}
                    >
                      {choice.text}
                      {testResult.correctAnswersIds[index]?.includes(choice.id) && ' ✓'}
                      {testResult.userAnswers[index]?.includes(choice.id) &&
                        !testResult.correctAnswersIds[index]?.includes(choice.id) &&
                        ' ✗'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
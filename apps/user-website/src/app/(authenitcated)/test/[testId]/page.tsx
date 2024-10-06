"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useTheme } from "@/components/context/ThemeContext";
import TestResults from "@/src/components/TestResults/page";

interface Question {
  id: string;
  question: string;
  choice: { id: string; text: string }[];
}

interface TestResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  correctAnswersIds: string[][];
  userAnswers: string[][];
}

export default function TestPage() {
  const router = useRouter();
  const params = useParams();
  const { isDarkTheme } = useTheme();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const questionCount = parseInt(searchParams.get("questionCount") || "20", 10);
  const [isTimed, setIsTimed] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: string]: string[];
  }>({});
  const [duration, setDuration] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/api/test/${params.testId}`);
        const data = await response.json();
        console.log("data in test page");
        console.log(data);
        if (data.err) {
          console.error(data.msg);
        } else {
          if (data.data.isCompleted) {
            // Redirect to test results page if the test is already completed
            router.push(`/test/${params.testId}/results`);
          } else {
            setQuestions(data.data.questions);
            setIsTimed(data.data.isTimed);
            setDuration(data.data.duration);
          }
        }
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      }
    };

    fetchQuestions();
  }, [params.testId, router]);

  useEffect(() => {
    if (isTimed) {
      const timer = setInterval(() => {
        setDuration((prevDuration) => {
          if (prevDuration <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prevDuration - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isTimed]);

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      const updatedAnswers = currentAnswers.includes(answerId)
        ? currentAnswers.filter((id) => id !== answerId)
        : [...currentAnswers, answerId];
      return { ...prev, [questionId]: updatedAnswers };
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (questions.length === 0) {
    return <div className="text-center mt-8">Loading questions...</div>;
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/test/${params.testId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAnswers: Object.values(selectedAnswers),
        }),
      });
      const data = await response.json();
      console.log(data);
      if (data.err) {
        console.error(data.msg);
      } else {
        console.log("Test submitted successfully:", data.data);
        setTestResult(data.data);
        setShowDialog(true);
      }
    } catch (error) {
      console.error("Failed to submit test:", error);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    router.push(`/test/${params.testId}/results`);
  };

  if (questions.length === 0) {
    return <div className="text-center mt-8">Loading questions...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-6 text-center bg-white dark:bg-gray-900 text-black dark:text-white p-4">
        {category || "General"} Test
      </h1>
      {isTimed && (
        <div className="text-xl font-semibold mb-6 text-center bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-3 rounded-lg">
          Time Remaining: {formatTime(duration)}
        </div>
      )}
      {/* Add progress bar */}
      <div className="mb-6 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
          }}
        ></div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Question {currentQuestionIndex + 1} of {questions.length}
        </h2>
        <div className="mb-6 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-inner">
          <p className="text-lg text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
            {currentQuestion.question}
          </p>
        </div>
        <div className="space-y-3">
          {currentQuestion.choice.map((option) => (
            <button
              key={option.id}
              className={`w-full p-3 text-left border rounded-lg transition-colors duration-200 ${
                selectedAnswers[currentQuestion?.id]?.includes(option.id)
                  ? "bg-blue-600 dark:bg-blue-700 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
            >
              {option.text}
              <span className="float-right">
                {selectedAnswers[currentQuestion?.id]?.includes(option.id) ? '✓' : '◯'}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <button
          className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors duration-200"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>
        {currentQuestionIndex === questions.length - 1 ? (
          <button
            className="bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 px-6 py-2 rounded-lg transition-colors duration-200"
            onClick={handleSubmit}
          >
            Submit
          </button>
        ) : (
          <button
            className="bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 px-6 py-2 rounded-lg transition-colors duration-200"
            onClick={handleNextQuestion}
          >
            Next
          </button>
        )}
      </div>
      {showDialog && testResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full relative">
            <button
              onClick={handleCloseDialog}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-4">Test Submitted</h2>
            <p className="mb-2">Your test has been successfully submitted. Thank you!</p>
            <p className="mb-2">Total Questions: {testResult.totalQuestions}</p>
            <p className="mb-2">Correct Answers: {testResult.correctAnswers}</p>
            <p className="mb-4">Score: {testResult.score.toFixed(2)}%</p>
            <div className="text-center">
              <button
                onClick={handleCloseDialog}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 cursor-pointer font-medium"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

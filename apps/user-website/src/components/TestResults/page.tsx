"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

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

const TestResults: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const testId = params.testId as string;

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/test/${testId}`);
        const data = await response.json();

        if (data.err) {
          throw new Error(data.msg);
        }

        const { questions: fetchedQuestions, userAnswers } = data.data;
        setQuestions(fetchedQuestions);

        const correctAnswers = fetchedQuestions.reduce(
          (count: number, question: any, index: number) => {
            const isCorrect =
              JSON.stringify(question.answer.sort()) ===
              JSON.stringify(userAnswers[index].sort());
            return count + (isCorrect ? 1 : 0);
          },
          0
        );

        const score = (correctAnswers / fetchedQuestions.length) * 100;

        setTestResult({
          correctAnswers,
          score,
          correctAnswersIds: fetchedQuestions.map((q: any) => q.answer),
          userAnswers,
        });

        toast.success("Test results loaded successfully!");
      } catch (error) {
        console.error("Failed to load test results:", error);
        toast.error("Failed to load test results");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestData();
  }, [testId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-100"></div>
        <div className="text-center mt-4 text-xl font-semibold">
          Loading test results...
        </div>
      </div>
    );
  }

  if (!testResult) {
    return <div className="text-center mt-8">No test results available.</div>;
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
              <div
                key={question.id}
                className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                <h3 className="text-xl font-semibold mb-2">
                  Question {index + 1}
                </h3>
                <p className="mb-2">{question.question}</p>
                <div className="space-y-2">
                  {question.choice.map((choice) => (
                    <div
                      key={choice.id}
                      className={`p-2 rounded ${
                        testResult.correctAnswersIds[index]?.includes(choice.id)
                          ? "bg-green-200 dark:bg-green-700"
                          : testResult.userAnswers[index]?.includes(choice.id)
                            ? "bg-red-200 dark:bg-red-700"
                            : "bg-white dark:bg-gray-700"
                      }`}
                    >
                      {choice.text}
                      {testResult.correctAnswersIds[index]?.includes(
                        choice.id
                      ) && " ✓"}
                      {testResult.userAnswers[index]?.includes(choice.id) &&
                        !testResult.correctAnswersIds[index]?.includes(
                          choice.id
                        ) &&
                        " ✗"}
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

"use client";

import { useParams } from "next/navigation";
import TestResults from "@/src/components/TestResults/page";

export default function TestResultsPage() {
  const params = useParams();

  return <TestResults testid={params.testId as string} questions={[]} />;
}
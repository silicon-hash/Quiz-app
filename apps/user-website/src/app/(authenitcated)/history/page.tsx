"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { authOptions } from "@/src/lib/auth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type UserTest = {
  id: string;
  correctAnswers: string;
  isCompleted: boolean;
  category: {
    name: string;
  };
  numberOfQuestions: string;
};

interface UserTestData {
  UserTestDetail: UserTest[];
}

export default function TestList() {
  const [test, setTest] = useState<UserTestData>();
  const router = useRouter();
  //@ts-ignore
  const session = useSession(authOptions);
  const handleTestClick = (testId: string, isCompleted: boolean) => {
    if (isCompleted) {
      router.push(`/test/${testId}/results`);
      return;
    }
    router.push(`/test/${testId}`);
  };

  const fetchData = async () => {
    const loadingId = toast.loading("Loading info");
    try {
      const response = await fetch(
        `/api/testhistory/${(session.data?.user as any)?.id}`
      );
      if (!response.ok) {
        toast.dismiss(loadingId);
        toast.error("Failed fetching data");
        return;
      }
      const result = await response.json();
      if (result.err) {
        toast.dismiss(loadingId);
        toast.error(`${result.msg}`);
        return;
      }
      setTest(result.data);
      toast.dismiss(loadingId);
      toast.success(`${result.msg}`);
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error("An error occurred while fetching data");
    }
  };

  useEffect(() => {
    //@ts-ignore
    if (session.data?.user?.id) {
      fetchData();
    }
    //@ts-ignore
  }, [session.data?.user?.id]);

  return (
    <div className="container mx-auto p-4">
      {/* <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Test Results
      </h1> */}
      {test?.UserTestDetail && test.UserTestDetail.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {test.UserTestDetail.map((test) => (
            <Card
              key={test.id}
              className="cursor-pointer hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 overflow-hidden"
              onClick={() => handleTestClick(test.id, test.isCompleted)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">
                    {test.category.name}
                  </h3>
                  <Badge
                    //@ts-ignore
                    variant={test.isCompleted ? "success" : "destructive"}
                    className="text-xs"
                  >
                    {test.isCompleted ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {test.isCompleted ? "Completed" : "Incomplete"}
                  </Badge>
                </div>
                <div className="mt-2 mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Score:{" "}
                    <span className="font-semibold">
                      {test.correctAnswers || "0"}/{test.numberOfQuestions}
                    </span>
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-400">
          You haven't participated in any tests.
        </p>
      )}
    </div>
  );
}

import prisma from "@repo/db/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  {
    params,
  }: {
    params: {
      testid: string;
    };
  }
) => {
  try {
    if (!params.testid) {
      return NextResponse.json({
        msg: "Id Not Sent",
        err: true,
        data: null,
      });
    }

    const testDetail = await prisma.userTestDetail.findUnique({
      where: {
        id: params.testid,
      },
      select: {
        isCompleted: true,
        questions: {
          select: {
            id: true,
            question: true,
            choice: {
              select: {
                id: true,
                text: true,
              },
            },
          },
        },
        isTimed: true,
        duration: true,
        createdAt: true,
      },
    });

    if (!testDetail) {
      return NextResponse.json({
        msg: "Invalid ID",
        err: true,
        data: null,
      });
    }

    // Define responseData with optional correctAnswers and userAnswers
    let responseData: {
      isTimed: boolean;
      duration: number | null;
      createdAt: Date;
      questions: {
        id: string;
        question: string;
        choice: {
          id: string;
          text: string;
        }[];
      }[];
      correctAnswers?: string; // Make it optional
      userAnswers?: string[][]; // Make it optional
      isCompleted: boolean;
    } = {
      isTimed: testDetail.isTimed,
      duration: testDetail.duration,
      createdAt: testDetail.createdAt,
      questions: testDetail.questions,
      isCompleted: testDetail.isCompleted,
    };

    if (testDetail.isCompleted) {
      const data = await prisma.userTestDetail.findUnique({
        where: {
          id: params.testid,
        },
        select: {
          questions: {
            select: {
              choice: true,
              answer: true,
              question: true,
            },
          },
          userAnswers: true,
          isCompleted: true,
        },
      });

      return NextResponse.json({
        msg: "ALL good",
        err: false,
        data,
      });
    }

    return NextResponse.json({
      msg: "ALL good",
      err: false,
      data: responseData,
    });
  } catch (error) {
    return NextResponse.json({
      msg: "Something went wrong while fetching",
      err: true,
      data: null,
    });
  }
};

interface UserTestPostData {
  userAnswers: string[][];
}

export const POST = async (
  req: NextRequest,
  {
    params,
  }: {
    params: {
      testid: string;
    };
  }
) => {
  try {
    const { userAnswers }: UserTestPostData = await req.json();
    console.log("asdasdasd", userAnswers);
    const userTestDetail = await prisma.userTestDetail.findUnique({
      where: {
        id: params.testid,
      },
      include: {
        questions: true,
      },
    });
    if (!userTestDetail) {
      return NextResponse.json({
        msg: "Test not found",
        err: true,
        data: null,
      });
    }
    let correctAnswersCount = 0;
    userTestDetail.questions.forEach((question, index) => {
      const correctAnswerIds = question.answer;
      const userSubmittedAnswerIds = userAnswers[index];

      if (Array.isArray(correctAnswerIds)) {
        if (
          JSON.stringify(correctAnswerIds.sort()) ===
          JSON.stringify(userSubmittedAnswerIds!.sort())
        ) {
          correctAnswersCount++;
        }
      }
    });

    const totalQuestions = userTestDetail.questions.length;
    const score = (correctAnswersCount / totalQuestions) * 100;
    await prisma.userTestDetail.update({
      where: {
        id: params.testid,
      },
      data: {
        userAnswers: userAnswers,
        correctAnswers: correctAnswersCount.toString(),
        isCompleted: true,
      },
    });

    return NextResponse.json({
      msg: "Test completed successfully",
      err: false,
      data: {
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswersCount,
        score: score,
      },
    });
  } catch (error) {
    return NextResponse.json({
      msg: "Something went wrong",
      err: true,
      data: null,
    });
  }
};

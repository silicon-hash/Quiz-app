import { UserTestDetailSchema } from "@/src/lib/validation";
import prisma from "@repo/db/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const data = await req.json();
    const testSchema = await UserTestDetailSchema.safeParse(data);

    if (!testSchema.success) {
      return NextResponse.json({
        msg: testSchema.error.format(),
        err: true,
        data: null,
      });
    }

    const testDetails = testSchema.data;
    // Fetch questions in the specified order for SIMULATION
    let selectedQuestions;
    if (testDetails.testType === "SIMULATION") {
      // Fetch the first 50 single-answer questions
      console.log("inside");
      const singleAnswerQuestions = await prisma.question.findMany({
        where: { categoryId: testDetails.categoryId, isMultipleAnswer: false },
        take: 50,
      });

      const multipleAnswerQuestions = await prisma.question.findMany({
        where: { categoryId: testDetails.categoryId, isMultipleAnswer: true },
        take: 150,
      });

      selectedQuestions = [
        ...singleAnswerQuestions,
        ...multipleAnswerQuestions,
      ];
    } else {
      selectedQuestions = await prisma.question.findMany({
        where: { categoryId: testDetails.categoryId },
        take: testDetails.numberOfQuestions,
      });
    }

    const userTestDetail = await prisma.userTestDetail.create({
      data: {
        userId: testDetails.userId,
        categoryId: testDetails.categoryId,
        numberOfQuestions: selectedQuestions.length,
        duration: testDetails.isTimed ? testDetails.duration : 0,
        isCompleted: false,
        isTimed: testDetails.isTimed,
        testType: testDetails.testType,
        questions: {
          connect: selectedQuestions.map((question) => ({ id: question.id })),
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      msg: "Successfully created",
      err: false,
      data: userTestDetail.id,
    });
  } catch (error) {
    console.error("Error while creating test details:", error);
    return NextResponse.json({
      msg: "Something went wrong while creating test details",
      err: true,
      data: null,
    });
  }
};

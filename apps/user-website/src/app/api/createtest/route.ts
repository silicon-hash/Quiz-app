import { UserTestDetailSchema } from "@/src/lib/validation";
import prisma from "@repo/db/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const data = await req.json();
    console.log(data);
    const testSchema = await UserTestDetailSchema.safeParse(data);
    if (!testSchema.success) {
      return NextResponse.json({
        msg: testSchema.error.format(),
        err: true,
        data: null,
      });
    }
    const testDetails = testSchema.data;
    const findUser = await prisma.user.findUnique({
      where: {
        id: testDetails.userId,
      },
    });
    if (!findUser) {
      return NextResponse.json({
        msg: "Invalid user",
        err: true,
        data: null,
      });
    }
    const category = await prisma.category.findUnique({
      where: {
        id: testDetails.categoryId,
      },
    });
    if (!category) {
      return NextResponse.json({
        msg: "Invalid categoryID",
        err: true,
        data: null,
      });
    }
    const selectedQuestions = await prisma.question.findMany({
      where: {
        categoryId: testDetails.categoryId,
      },
      take: testDetails.numberOfQuestions,
    });

    const userTestDetail = await prisma.userTestDetail.create({
      data: {
        userId: testDetails.userId,
        categoryId: testDetails.categoryId,
        numberOfQuestions: selectedQuestions.length,
        duration: testDetails.isTimed ? testDetails.duration : 0,
        isCompleted: false,
        questions: {
          connect: selectedQuestions.map((question) => ({ id: question.id })),
        },
        isTimed: testDetails.isTimed,
      },
      select: {
        id: true,
        questions: {
          select: {
            id: true,
            title: true,
            choice: {
              select: {
                id: true,
                text: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json({
      msg: "Successfully created",
      err: false,
      data: userTestDetail.id,
    });
  } catch (error) {
    return NextResponse.json({
      msg: "Something went wrong",
      err: true,
      data: null,
    });
  }
};

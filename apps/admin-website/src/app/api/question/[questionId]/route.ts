import prisma from "@repo/db/client";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: {
      questionId: string;
    };
  }
) {
  try {
    const id = params.questionId;
    if (!id) {
      return NextResponse.json(
        { msg: "Missing question ID", err: true, data: null },
        { status: 400 }
      );
    }

    const data = await prisma.question.findUnique({
      where: { id },
      include: { choice: true },
    });

    if (!data) {
      return NextResponse.json({
        msg: "Question not found",
        err: true,
        data: null,
      });
    }

    return NextResponse.json(
      { msg: "Fetched successfully", err: false, data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { msg: "Something went wrong", err: true, data: null },
      { status: 500 }
    );
  }
}

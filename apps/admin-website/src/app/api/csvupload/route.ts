import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import prisma from "@repo/db/client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const categoryId = formData.get("categoryId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const content = await file.text();
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    for (const record of records) {
      const { question, choice1, choice2, choice3, choice4, choice5, answer } =
        record;

      // Create the question first
      const newQuestion = await prisma.question.create({
        data: {
          title: question.substring(0, 50),
          categoryId: categoryId,
          question: question,
        },
      });

      // Collect all choice texts into an array, filtering out any empty ones
      const choices = [choice1, choice2, choice3, choice4, choice5].filter(
        Boolean
      );

      // Store created choice IDs in an array
      const choiceIds: string[] = [];

      // Create each choice and store its ID
      for (const choiceText of choices) {
        const createdChoice = await prisma.choices.create({
          data: {
            questionId: newQuestion.id,
            text: choiceText,
          },
        });
        choiceIds.push(createdChoice.id);
      }

      const answerTexts = answer.includes(",")
        ? answer.split(",").map((a: string) => a.trim())
        : [answer];
      const correctChoiceIds = answerTexts
        .map((answerText: string) => {
          const answerIndex = choices.indexOf(answerText);
          return answerIndex !== -1 ? choiceIds[answerIndex] : null;
        })
        .filter(Boolean);

      if (correctChoiceIds.length > 0) {
        await prisma.question.update({
          where: {
            id: newQuestion.id,
          },
          data: {
            answer: correctChoiceIds, // Store the correct choice IDs as the answer
          },
        });
      }
    }

    return NextResponse.json({
      message: "Questions and choices uploaded successfully",
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { error: "Error processing file" },
      { status: 500 }
    );
  }
}

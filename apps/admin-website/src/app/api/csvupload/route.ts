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
    const records = parse(content, { columns: true, skip_empty_lines: true });

    for (const record of records) {
      const { question, choice1, choice2, choice3, choice4, choice5, answer } =
        record;
      const isMultipleAnswer = answer.includes(",");

      const newQuestion = await prisma.question.create({
        data: {
          title: question.substring(0, 50),
          categoryId: categoryId,
          question: question,
          isMultipleAnswer: isMultipleAnswer,
        },
      });

      const choices = [choice1, choice2, choice3, choice4, choice5].filter(
        Boolean
      );

      // Create each choice individually to capture IDs
      const createdChoices = await Promise.all(
        choices.map((choiceText) =>
          prisma.choices.create({
            data: {
              questionId: newQuestion.id,
              text: choiceText,
            },
          })
        )
      );

      // Process the answer field to get the correct choice IDs
      const answerTexts = isMultipleAnswer
        ? answer.split(",").map((a: any) => a.trim())
        : [answer];
      const correctChoiceIds = answerTexts
        .map((answerText: string) => {
          const matchingChoice = createdChoices.find(
            (choice) => choice.text === answerText
          );
          return matchingChoice ? matchingChoice.id : null;
        })
        .filter(Boolean);

      // Update the question with the correct choice IDs
      if (correctChoiceIds.length > 0) {
        await prisma.question.update({
          where: { id: newQuestion.id },
          data: { answer: correctChoiceIds },
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

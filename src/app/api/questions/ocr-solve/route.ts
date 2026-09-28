import { NextRequest, NextResponse } from "next/server";
import { scanQuestionFromImageAction } from "@/actions/ocr-question-actions";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await scanQuestionFromImageAction(formData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, quotaExceeded: result.quotaExceeded },
        { status: result.quotaExceeded ? 429 : 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro interno ao processar OCR da questão." },
      { status: 500 }
    );
  }
}

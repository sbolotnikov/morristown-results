import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('Debug PDF route called');
  try {
    const formData = await req.formData();
    const pdfFile = formData.get('pdfFile') as File | null;

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'No PDF file uploaded' },
        { status: 400 }
      );
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      const text = data.text;

      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'No text extracted from PDF' },
          { status: 400 }
        );
      }

      const lines = text
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

      return NextResponse.json({
        success: true,
        rawText: text,
        totalLines: lines.length,
        lines: lines,
        // Show patterns we're looking for
        patterns: {
          studentTeacherPattern:
            /^(.+?)\/(.+?)\s*\(#\d+\)\s*\[.+?\]$|^(.+?)\s*\(#\d+\)\/(.+?)\s*\[.+?\]$/,
          placePattern: /^(\d+)(?:\s*\[(\d+\.?\d*)\])?$/,
          heatPattern: /^(Heat|Solo)\s+(\d+)$/,
        },
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: `PDF parsing failed: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  processCompetitionData,
  generateCSVFromProcessedData,
} from '../../../lib/competitionProcessor';

export const runtime = 'nodejs'; // Specify Node.js runtime

export async function POST(req: NextRequest) {
  console.log('API route /api/process-pdf received a request.');
  try {
    const formData = await req.formData();
    const pdfFile = formData.get('pdfFile') as File | null;

    if (!pdfFile) {
      console.error('No PDF file uploaded.');
      return NextResponse.json(
        { error: 'No PDF file uploaded' },
        { status: 400 }
      );
    }

    console.log('Processing uploaded PDF file:', pdfFile.name);

    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      let pdfParse: any;

      // Try to require pdf-parse, fallback if it fails
      try {
        pdfParse = require('pdf-parse');
      } catch (requireError) {
        return NextResponse.json(
          {
            error:
              'PDF parsing library not available. Please install pdf-parse.',
          },
          { status: 500 }
        );
      }

      // Extract text from PDF
      const data = await pdfParse(buffer);
      const text = data.text;

      if (!text || text.trim() === '') {
        return NextResponse.json(
          {
            error:
              'Could not extract text from the PDF. It might be empty, image-based, or corrupted.',
          },
          { status: 400 }
        );
      }

      // Split text into lines for easier processing
      let lines = text
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

      // Handle PDF-specific format where place/proficiency/heat/event are on one line
      // Split lines like "1 [97.0]Heat 288", "*A [95.0]Heat 288", etc.
      // into separate lines: "1 [97.0]", "Heat 288", "L-B1 Bronze Closed Prof. Grade Foxtrot"
      const processedLines: string[] = [];

      for (const line of lines) {
        // Check if this is a student/teacher line - keep as is
        const studentTeacherMatch = line.match(
          /^(.+?)\/(.+?)\s*\(#\d+\)\s*\[.+?\]$|^(.+?)\s*\(#\d+\)\/(.+?)\s*\[.+?\]$/
        );

        if (studentTeacherMatch) {
          processedLines.push(line);
        } else {
          // Check if this line matches the condensed format: "place [score]Heat number event description"
          // Updated to handle places like "*A", "1", "*B", etc.
          const condensedMatch = line.match(
            /^([*]?[A-Za-z0-9]+\s*(?:\[\d+\.?\d*\])?)((Heat|Solo)\s+\d+)(.+)$/
          );

          if (condensedMatch) {
            // Split into separate lines
            if (condensedMatch[2].trim() == 'Solo') {
              console.log('', condensedMatch);
            }
            processedLines.push(condensedMatch[1].trim()); // "1 [97.0]"
            processedLines.push(condensedMatch[2].trim()); // "Heat 288"
            processedLines.push(condensedMatch[4].trim()); // "L-B1 Bronze Closed Prof. Grade Foxtrot"
          } else {
            // Keep line as is if it doesn't match the condensed format
            processedLines.push(line);
          }
        }
      }

      lines = processedLines;
      //   console.log('Processed lines for PDF:', lines);

      // Process the competition data using the same logic as DOCX
      const { processedData, processedDataAmateurCouples } =
        processCompetitionData(lines);

      if (processedData.length === 0) {
        // Log the extracted lines for debugging
        console.log('Debug - First 20 lines extracted from PDF:');
        lines.slice(0, 20).forEach((line, index) => {
          console.log(`Line ${index + 1}: "${line}"`);
        });

        return NextResponse.json(
          {
            error:
              'No valid competition entries found in the PDF after processing.',
            debug: {
              totalLines: lines.length,
              sampleLines: lines.slice(0, 20),
              message: 'Check console logs for detailed line-by-line output',
            },
          },
          { status: 400 }
        );
      }

      // Generate CSV using the same logic as DOCX
      const csv = generateCSVFromProcessedData(
        processedData,
        processedDataAmateurCouples
      );

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition':
            'attachment; filename="competition_results_from_pdf.csv"',
        },
      });
    } catch (parsingError: any) {
      console.error('Error during PDF parsing:', parsingError);
      return NextResponse.json(
        {
          error: `PDF parsing failed: ${
            parsingError.message || 'Unknown error'
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Unhandled error in PDF API route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

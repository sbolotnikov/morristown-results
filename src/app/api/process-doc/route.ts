import { NextRequest, NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export const runtime = 'nodejs'; // Specify Node.js runtime

export async function POST(req: NextRequest) {
  console.log('API route /api/process-doc received a request.');
  try {
    const formData = await req.formData();
    const docxFile = formData.get('docxFile') as File | null;

    if (!docxFile) {
      console.error('No .docx file uploaded.');
      return NextResponse.json(
        { error: 'No .docx file uploaded' },
        { status: 400 }
      );
    }

    console.log('Processing uploaded file:', docxFile.name);

    const arrayBuffer = await docxFile.arrayBuffer();

    let text = '';
    const processedData: any[] = [];
    const processedDataAmateurCouples: any[] = [];
    try {
      const zip = new PizZip(arrayBuffer);

      // Extract text with preserved line breaks by parsing the document.xml directly
      const docXml = zip.files['word/document.xml'];
      if (!docXml) {
        throw new Error('Invalid DOCX file: missing document.xml');
      }

      const xmlContent = docXml.asText();

      // Parse paragraphs and preserve line breaks
      const paragraphMatches =
        xmlContent.match(/<w:p[^>]*>(.*?)<\/w:p>/g) || [];
      let paragraphs = [];

      for (const paragraphMatch of paragraphMatches) {
        const textMatches =
          paragraphMatch.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
        let paragraphText = '';

        for (const textMatch of textMatches) {
          const textContent = textMatch.replace(/<\/?w:t[^>]*>/g, '');
          paragraphText += textContent;
        }

        if (paragraphText.trim()) {
          paragraphs.push(paragraphText.trim());
        }
      }

      text = paragraphs.join('\n');
      //console.log('Extracted text from docx with line breaks:', text); // Log the full extracted text for debugging
    } catch (parsingError: any) {
      console.error('Error during document parsing:', parsingError);
      return NextResponse.json(
        {
          error: `Document parsing failed: ${
            parsingError.message || 'Unknown error'
          }`,
        },
        { status: 500 }
      );
    }
    console.log(
      'Extracted text from docx with line breaks:',
      text.split('\n').length
    );
    if (!text || text.trim() === '') {
      return NextResponse.json(
        {
          error:
            'Could not extract text from the document. It might be empty or corrupted.',
        },
        { status: 400 }
      );
    }

    // Split text into lines for easier processing
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // console.log('Lines extracted:', lines);
    let sumOfPoints = 0;
    // Process lines to extract competition data
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let currentstudent;

      // Check if this line contains student/teacher info in format: "Name/Name (#number) [Location]" or "Name (#number)/Name [Location]"
      const studentTeacherMatch = line.match(
        /^(.+?)\/(.+?)\s*\(#\d+\)\s*\[.+?\]$|^(.+?)\s*\(#\d+\)\/(.+?)\s*\[.+?\]$/
      );

      if (studentTeacherMatch) {
        // Handle both formats: Name/Name (#number) [Location] and Name (#number)/Name [Location]
        let student, teacher;

        if (studentTeacherMatch[1] && studentTeacherMatch[2]) {
          // Format: Name/Name (#number) [Location]
          student = studentTeacherMatch[1].trim();
          teacher = studentTeacherMatch[2].trim();
        } else if (studentTeacherMatch[3] && studentTeacherMatch[4]) {
          // Format: Name (#number)/Name [Location]
          student = studentTeacherMatch[3].trim();
          teacher = studentTeacherMatch[4].trim();
        }

        // Look ahead for all place/proficiency and heat/event information for this student/teacher pair
        let j = i + 1;

        // Continue processing entries until we hit another student/teacher line or end of file
        while (j < lines.length) {
          // Check if we've hit another student/teacher line
          const nextStudentTeacherMatch = lines[j].match(
            /^(.+?)\/(.+?)\s*\(#\d+\)\s*\[.+?\]$|^(.+?)\s*\(#\d+\)\/(.+?)\s*\[.+?\]$/
          );
          if (nextStudentTeacherMatch) {
            // Found another student/teacher pair, stop processing current pair
            break;
          }

          let place = '';
          let proficiency = '';
          let heatNumber = '';
          let eventDescription = '';

          // Find place/proficiency line (format: "1 [93.0]" or just "1")
          const placeLine = lines[j];
          const placeMatch = placeLine.match(/^(\d+)(?:\s*\[(\d+\.?\d*)\])?$/);

          if (placeMatch) {
            place = placeMatch[1];
            proficiency = placeMatch[2] || '';
            j++;

            // Find heat line (format: "Heat 612")
            while (j < lines.length) {
              const heatLine = lines[j];
              const heatMatch = heatLine.match(/^(Heat|Solo)\s+(\d+)$/);

              if (heatMatch) {
                heatNumber = heatMatch[1] + ' ' + heatMatch[2];
                j++;
                break;
              }
              j++;
            }

            // Find event description line (next line after heat)
            if (j < lines.length) {
              // Check if this is another student/teacher line
              const checkStudentTeacher = lines[j].match(
                /^(.+?)\/(.+?)\s*\(#\d+\)\s*\[.+?\]$|^(.+?)\s*\(#\d+\)\/(.+?)\s*\[.+?\]$/
              );
              if (!checkStudentTeacher) {
                eventDescription = lines[j];
                j++;
              }
            }

            // Process this entry if we have all required information
            if (student && teacher && place && heatNumber && eventDescription) {
              // Check for "AC-" or "Pro heat" indicators
              if (eventDescription.includes('AC-')) {
                // Process AC- entries separately
                const fullEvent = ` ${heatNumber} ${eventDescription.trim()}`;
                let points = 0;

                // Base Points for Event Types
                if (
                  fullEvent.includes('Schol') ||
                  fullEvent.includes('Champ')
                ) {
                  // For Scholarship or Championship events, count slashes between parentheses
                  const parenthesesMatch = fullEvent.match(/\(([^)]+)\)/);
                  if (parenthesesMatch) {
                    const contentInParentheses = parenthesesMatch[1];
                    const slashCount = (contentInParentheses.match(/\//g) || [])
                      .length;
                    points = slashCount + 2;
                  } else {
                    points = 2;
                  }
                } else {
                  points = 11;
                }

                // Additional Points for Placement or Proficiency
                if (proficiency) {
                  const profScore = parseFloat(proficiency);
                  if (profScore >= 96.5) {
                    points += 3;
                  } else if (profScore >= 93.5) {
                    points += 2;
                  } else if (profScore >= 89.5) {
                    points += 1;
                  }
                } else {
                  const placeNum = parseInt(place);
                  if (placeNum === 1) {
                    points += 3;
                  } else if (placeNum === 2) {
                    points += 2;
                  } else if (placeNum === 3) {
                    points += 1;
                  } else if (isNaN(placeNum)) {
                    points -= 1;
                  }
                }

                processedDataAmateurCouples.push({
                  Student: student.trim(),
                  Teacher: teacher.trim(),
                  Event: fullEvent.trim(),
                  Place: place.trim(),
                  Proficiency: proficiency ? proficiency.trim() : '',
                  Points: points,
                });
                continue;
              } else if (eventDescription.toLowerCase().includes('pro heat')) {
                // console.log('Skipping filtered entry:', eventDescription);
                continue;
              }

              const fullEvent = ` ${heatNumber} ${eventDescription.trim()}`;
              let points = 0;

              // Base Points for Event Types
              if (fullEvent.includes('Schol') || fullEvent.includes('Champ')) {
                // For Scholarship or Championship events, count slashes between parentheses
                const parenthesesMatch = fullEvent.match(/\(([^)]+)\)/);
                if (parenthesesMatch) {
                  const contentInParentheses = parenthesesMatch[1];

                  const slashCount = (contentInParentheses.match(/\//g) || [])
                    .length;
                  points = slashCount + 2; //because of substruction -1 in the end+1 and +1 because of slashes less then dances
                } else {
                  // Default if no parentheses found
                  points = 2;
                }
              } else {
                // All individual entries, Solo, Novelty, Showcase
                points = 11;
              }

              // Additional Points for Placement or Proficiency
              if (proficiency) {
                const profScore = parseFloat(proficiency);
                if (profScore >= 96.5) {
                  points += 3;
                } else if (profScore >= 93.5) {
                  points += 2;
                } else if (profScore >= 89.5) {
                  points += 1;
                }
              } else {
                const placeNum = parseInt(place);
                if (placeNum === 1) {
                  points += 3;
                } else if (placeNum === 2) {
                  points += 2;
                } else if (placeNum === 3) {
                  points += 1;
                } else if (isNaN(placeNum)) {
                  // If no numerical place
                  points -= 1;
                }
              }
              if (currentstudent !== student.trim()) {
                currentstudent = student.trim();
                if (processedData.length > 1)
                  processedData.push({
                    Student: 'Total :',
                    Teacher: '',
                    Event: '',
                    Place: '',
                    Proficiency: '',
                    Points: sumOfPoints,
                  });
                sumOfPoints = points;
              } else {
                sumOfPoints += points;
              }
              processedData.push({
                Student: student.trim(),
                Teacher: teacher.trim(),
                Event: fullEvent.trim(),
                Place: place.trim(),
                Proficiency: proficiency ? proficiency.trim() : '',
                Points: points,
              });
            } else {
              console.log('Skipping incomplete entry:', {
                student,
                teacher,
                place,
                heatNumber,
                eventDescription,
              });
            }
          } else {
            // If this line doesn't match a place pattern, move to next line
            j++;
          }
        }

        // Update i to j-1 so the main loop continues from where we left off
        i = j - 1;
      }
    }

    if (processedData.length === 0) {
      return NextResponse.json(
        { error: 'No valid entries found in the document after processing.' },
        { status: 400 }
      );
    }

    // Calculate totals for each unique student and teacher
    const studentTotals = new Map<string, number>();
    const teacherTotals = new Map<string, number>();

    // Calculate totals from processed data (excluding any existing "Total :" entries)
    processedData.forEach((entry) => {
      if (entry.Student !== 'Total :') {
        const student = entry.Student;
        const teacher = entry.Teacher;
        const points = entry.Points;

        // Add to student totals
        studentTotals.set(student, (studentTotals.get(student) || 0) + points);

        // Add to teacher totals
        teacherTotals.set(teacher, (teacherTotals.get(teacher) || 0) + points);
      }
    });

    // Add student totals to processed data
    processedData.push({
      Student: '',
      Teacher: '',
      Event: '',
      Place: '',
      Proficiency: '',
      Points: '',
    });

    processedData.push({
      Student: 'STUDENT TOTALS:',
      Teacher: '',
      Event: '',
      Place: '',
      Proficiency: '',
      Points: '',
    });

    studentTotals.forEach((total, student) => {
      processedData.push({
        Student: student,
        Teacher: '',
        Event: '',
        Place: '',
        Proficiency: '',
        Points: total,
      });
    });

    // Add teacher totals to processed data
    processedData.push({
      Student: '',
      Teacher: '',
      Event: '',
      Place: '',
      Proficiency: '',
      Points: '',
    });

    processedData.push({
      Student: 'TEACHER TOTALS:',
      Teacher: '',
      Event: '',
      Place: '',
      Proficiency: '',
      Points: '',
    });

    teacherTotals.forEach((total, teacher) => {
      processedData.push({
        Student: '',
        Teacher: teacher,
        Event: '',
        Place: '',
        Proficiency: '',
        Points: total,
      });
    });

    // Add Amateur Couples section if there are any entries
    if (processedDataAmateurCouples.length > 0) {
      // Calculate totals for Amateur Couples
      const amateurCoupleTotals = new Map<string, number>();

      processedDataAmateurCouples.forEach((entry) => {
        const coupleKey = `${entry.Student}/${entry.Teacher}`;
        amateurCoupleTotals.set(
          coupleKey,
          (amateurCoupleTotals.get(coupleKey) || 0) + entry.Points
        );
      });

      // Add Amateur Couples entries
      processedData.push({
        Student: '',
        Teacher: '',
        Event: '',
        Place: '',
        Proficiency: '',
        Points: '',
      });

      processedData.push({
        Student: 'AMATEUR COUPLES ENTRIES:',
        Teacher: '',
        Event: '',
        Place: '',
        Proficiency: '',
        Points: '',
      });

      // Add all AC entries
      processedDataAmateurCouples.forEach((entry) => {
        processedData.push(entry);
      });

      // Add Amateur Couples totals
      processedData.push({
        Student: '',
        Teacher: '',
        Event: '',
        Place: '',
        Proficiency: '',
        Points: '',
      });

      processedData.push({
        Student: 'AMATEUR COUPLES TOTALS:',
        Teacher: '',
        Event: '',
        Place: '',
        Proficiency: '',
        Points: '',
      });

      amateurCoupleTotals.forEach((total, couple) => {
        const [student, teacher] = couple.split('/');
        processedData.push({
          Student: student,
          Teacher: teacher,
          Event: '',
          Place: '',
          Proficiency: '',
          Points: total,
        });
      });
    }

    // Generate CSV
    const csvHeader = 'Student,Teacher,Event,Place,Proficiency,Points\n';
    const csvRows = processedData
      .map(
        (row) =>
          `"${row.Student}","${row.Teacher}","${row.Event}","${row.Place}","${row.Proficiency}",${row.Points}`
      )
      .join('\n');

    const csv = csvHeader + csvRows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="competition_results.csv"',
      },
    });
  } catch (error: any) {
    console.error('Unhandled error in API route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

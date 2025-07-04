// Shared processing logic for competition results
export function processCompetitionData(lines: string[]) {
  const processedData: any[] = [];
  const processedDataAmateurCouples: any[] = [];
  let sumOfPoints = 0;
  let currentstudent: string | undefined;

  //   console.log('=== STARTING COMPETITION DATA PROCESSING ===');
  //   console.log(`Total lines to process: ${lines.length}`);

  // Process lines to extract competition data
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line contains student/teacher info in format: "Name/Name (#number) [Location]" or "Name (#number)/Name [Location]"
    const studentTeacherMatch = line.match(
      /^(.+?)\/(.+?)\s*\(#\d+\)\s*\[.+?\]$|^(.+?)\s*\(#\d+\)\/(.+?)\s*\[.+?\]$/
    );

    if (studentTeacherMatch) {
      //   console.log(`Found student/teacher match at line ${i + 1}: "${line}"`);

      // Handle both formats: Name/Name (#number) [Location] and Name (#number)/Name [Location]
      let student, teacher;

      if (studentTeacherMatch[1] && studentTeacherMatch[2]) {
        // Format: Name/Name (#number) [Location]
        student = studentTeacherMatch[1].trim();
        teacher = studentTeacherMatch[2].trim();
        // console.log(`  Format 1 - Student: "${student}", Teacher: "${teacher}"`);
      } else if (studentTeacherMatch[3] && studentTeacherMatch[4]) {
        // Format: Name (#number)/Name [Location]
        student = studentTeacherMatch[3].trim();
        teacher = studentTeacherMatch[4].trim();
        // console.log(`  Format 2 - Student: "${student}", Teacher: "${teacher}"`);
      }

      // Look ahead for all place/proficiency and heat/event information for this student/teacher pair
      let j = i + 1;
      //   console.log(`  Looking ahead from line ${j + 1} for competition data...`);

      // Continue processing entries until we hit another student/teacher line or end of file
      while (j < lines.length) {
        // console.log(`    Checking line ${j + 1}: "${lines[j]}"`);

        // Check if we've hit another student/teacher line
        const nextStudentTeacherMatch = lines[j].match(
          /^(.+?)\/(.+?)\s*\(#\d+\)\s*\[.+?\]$|^(.+?)\s*\(#\d+\)\/(.+?)\s*\[.+?\]$/
        );
        if (nextStudentTeacherMatch) {
        //   console.log(
        //     `    Found next student/teacher line, stopping processing for current pair`
        //   );
          // Found another student/teacher pair, stop processing current pair
          break;
        }

        let place = '';
        let proficiency = '';
        let heatNumber = '';
        let eventDescription = '';

        // Find place/proficiency line (format: "1 [93.0]", "1", "*A [95.0]", "*A", etc.)
        const placeLine = lines[j];
        let checkSoloLine = placeLine.match(/^(Solo)\s+\d+$/);
        const placeMatch = placeLine.match(
          /^([*]?[A-Za-z0-9]+)(?:\s*\[(\d+\.?\d*)\])?$/
        );
        
        if (placeMatch) {
          place = placeMatch[1];
          proficiency = placeMatch[2] || '';
        //   console.log(`    Found place match: place="${place}", proficiency="${proficiency}"`);
          j++;

          // Find heat line (format: "Heat 612")
          while (j < lines.length) {
            const heatLine = lines[j];
            // console.log(`  Checking for heat pattern in line ${j + 1}: "${heatLine}"`);
            const heatMatch = heatLine.match(/^(Heat|Solo)\s+(\d+)$/);
             checkSoloLine = heatLine.match(/^(Solo)\s+\d+$/);
        if (checkSoloLine) {
          // This is a Solo or Heat line, skip it
          console.log(heatLine); 
        }
            if (heatMatch) {
              heatNumber = heatMatch[1] + ' ' + heatMatch[2];
              //   console.log(`      Found heat match: "${heatNumber}"`);
              j++;
              break;
            }
            j++;
          }

          // Find event description line (next line after heat)
          if (j < lines.length) {
            // console.log(`      Checking for event description in line ${j + 1}: "${lines[j]}"`);
            // Check if this is another student/teacher line
            const checkStudentTeacher = lines[j].match(
              /^(.+?)\/(.+?)\s*\(#\d+\)\s*\[.+?\]$|^(.+?)\s*\(#\d+\)\/(.+?)\s*\[.+?\]$/
            );
            if (!checkStudentTeacher) {
              eventDescription = lines[j];
              // Replace all double quotes with single quotes in event description
              eventDescription = eventDescription.replace(/"/g, "'");
              if (checkSoloLine) {
          // This is a Solo or Heat line, skip it
          console.log(lines[j]); 
        }
              //   console.log(`      Found event description: "${eventDescription}"`);
              j++;
            }
          }

          // Process this entry if we have all required information
          if (student && teacher && place && heatNumber && eventDescription) {
            if (checkSoloLine) {
          // This is a Solo or Heat line, skip it
          console.log(`    ✓ Complete entry found: Student="${student}", Teacher="${teacher}", Place="${place}", Heat="${heatNumber}", Proficiency="${proficiency}", Event="${eventDescription}"`);

        }
            // console.log(`    ✓ Complete entry found: Student="${student}", Teacher="${teacher}", Place="${place}", Heat="${heatNumber}", Event="${eventDescription}"`);

            // Check for "AC-" or "Pro heat" indicators
            if (eventDescription.includes('AC-')) {
              // Process AC- entries separately
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
              // Skip filtered entries
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
                points = slashCount + 2;
              } else {
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
            console.log(
              `    ✗ Incomplete entry: Student="${student}", Teacher="${teacher}", Place="${place}", Heat="${heatNumber}", Event="${eventDescription}"`
            );
          }
        } else {
          console.log(`    No place pattern match for line: "${placeLine}"`);
          j++;
        }
      }

      // Update i to j-1 so the main loop continues from where we left off
      i = j - 1;
    } else {
      // Log lines that don't match student/teacher pattern (only first few for brevity)
      if (i < 10) {
        console.log(
          `Line ${i + 1} doesn't match student/teacher pattern: "${line}"`
        );
      }
    }
  }

  //   console.log(`=== PROCESSING COMPLETE ===`);
  //   console.log(`Processed data entries: ${processedData.length}`);
  //   console.log(`Amateur couples entries: ${processedDataAmateurCouples.length}`);

  return { processedData, processedDataAmateurCouples };
}

export function generateCSVFromProcessedData(
  processedData: any[],
  processedDataAmateurCouples: any[]
) {
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

  // Create final data array with proper order
  const finalProcessedData: any[] = [];

  // 1. Add student totals first
  finalProcessedData.push({
    Student: 'STUDENT TOTALS:',
    Teacher: '',
    Event: '',
    Place: '',
    Proficiency: '',
    Points: '',
  });

  studentTotals.forEach((total, student) => {
    finalProcessedData.push({
      Student: student,
      Teacher: '',
      Event: '',
      Place: '',
      Proficiency: '',
      Points: total,
    });
  });

  // 2. Add teacher totals
  finalProcessedData.push({
    Student: '',
    Teacher: '',
    Event: '',
    Place: '',
    Proficiency: '',
    Points: '',
  });

  finalProcessedData.push({
    Student: 'TEACHER TOTALS:',
    Teacher: '',
    Event: '',
    Place: '',
    Proficiency: '',
    Points: '',
  });

  teacherTotals.forEach((total, teacher) => {
    finalProcessedData.push({
      Student: '',
      Teacher: teacher,
      Event: '',
      Place: '',
      Proficiency: '',
      Points: total,
    });
  });

  // 3. Add Amateur Couples totals (if any)
  if (processedDataAmateurCouples.length > 0) {
    const amateurCoupleTotals = new Map<string, number>();

    processedDataAmateurCouples.forEach((entry) => {
      const coupleKey = `${entry.Student}/${entry.Teacher}`;
      amateurCoupleTotals.set(
        coupleKey,
        (amateurCoupleTotals.get(coupleKey) || 0) + entry.Points
      );
    });

    finalProcessedData.push({
      Student: '',
      Teacher: '',
      Event: '',
      Place: '',
      Proficiency: '',
      Points: '',
    });

    finalProcessedData.push({
      Student: 'AMATEUR COUPLES TOTALS:',
      Teacher: '',
      Event: '',
      Place: '',
      Proficiency: '',
      Points: '',
    });

    amateurCoupleTotals.forEach((total, couple) => {
      const [student, teacher] = couple.split('/');
      finalProcessedData.push({
        Student: student,
        Teacher: teacher,
        Event: '',
        Place: '',
        Proficiency: '',
        Points: total,
      });
    });

    // 4. Add Amateur Couples entries
    finalProcessedData.push({
      Student: '',
      Teacher: '',
      Event: '',
      Place: '',
      Proficiency: '',
      Points: '',
    });

    finalProcessedData.push({
      Student: 'AMATEUR COUPLES ENTRIES:',
      Teacher: '',
      Event: '',
      Place: '',
      Proficiency: '',
      Points: '',
    });

    processedDataAmateurCouples.forEach((entry) => {
      finalProcessedData.push(entry);
    });
  }

  // 5. Add other entries (main competition entries)
  finalProcessedData.push({
    Student: '',
    Teacher: '',
    Event: '',
    Place: '',
    Proficiency: '',
    Points: '',
  });

  finalProcessedData.push({
    Student: 'MAIN COMPETITION ENTRIES:',
    Teacher: '',
    Event: '',
    Place: '',
    Proficiency: '',
    Points: '',
  });

  // Add all main entries (excluding "Total :" entries)
  processedData.forEach((entry) => {
    if (entry.Student !== 'Total :') {
      finalProcessedData.push(entry);
    }
  });

  // Generate CSV
  const csvHeader = 'Student,Teacher,Event,Place,Proficiency,Points\n';
  const csvRows = finalProcessedData
    .map(
      (row) =>
        `"${row.Student}","${row.Teacher}","${row.Event}","${row.Place}","${row.Proficiency}",${row.Points}`
    )
    .join('\n');

  return csvHeader + csvRows;
}

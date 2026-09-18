const fs = require('fs');
const path = require('path');

function getAverageGrade(student) {
  if (!student || typeof student !== 'object') {
    throw new TypeError('Invalid input: student must be an object.');
  }

  const grades = student.grades || [];
  if (grades.length === 0) return 0;

  const total = grades.reduce((acc, curr) => acc + curr, 0);
  return Number((total / grades.length).toFixed(2));
}


function getTopStudents(students, n) {
  if (!Array.isArray(students)) {
    throw new TypeError('Invalid input: students must be an array.');
  }
  if (typeof n !== 'number' || n < 0 || !Number.isInteger(n)) {
    throw new RangeError('Invalid input: n must be a non-negative integer.');
  }

  return [...students]
    .sort((a, b) => getAverageGrade(b) - getAverageGrade(a))
    .slice(0, n);
}


function groupByCourse(students) {
  if (!Array.isArray(students)) {
    throw new TypeError('Invalid input: students must be an array.');
  }

  return students.reduce((acc, student) => {
    const course = student.course || 'Unassigned';
    if (!acc[course]) {
      acc[course] = [];
    }
    acc[course].push(student);
    return acc;
  }, {});
}


function getEnrolledCount(students) {
  if (!Array.isArray(students)) {
    throw new TypeError('Invalid input: students must be an array.');
  }

  const enrolled = students.filter((s) => s.enrolled).length;
  const notEnrolled = students.length - enrolled;

  return { enrolled, notEnrolled };
}


function findStudent(students, name) {
  if (!Array.isArray(students)) {
    throw new TypeError('Invalid input: students must be an array.');
  }
  if (typeof name !== 'string') {
    throw new TypeError('Invalid input: name must be a string.');
  }

  const query = name.trim().toLowerCase();
  const match = students.find(
    (student) => student.name && student.name.toLowerCase() === query
  );

  return match || null;
}


function getCourseAverages(students) {
  if (!Array.isArray(students)) {
    throw new TypeError('Invalid input: students must be an array.');
  }

  const grouped = groupByCourse(students);

  const courseAverages = Object.keys(grouped).map((course) => {
    const courseStudents = grouped[course];
    const totalAvg = courseStudents.reduce(
      (acc, s) => acc + getAverageGrade(s),
      0
    );
    const avg = courseStudents.length === 0 ? 0 : totalAvg / courseStudents.length;

    return {
      course,
      averageGrade: Number(avg.toFixed(2)),
    };
  });

  return courseAverages.sort((a, b) => b.averageGrade - a.averageGrade);
}

function exportSummary(students) {
  if (!Array.isArray(students)) {
    throw new TypeError('Invalid input: students must be an array.');
  }

  const totalStudents = students.length;

  const overallAverage =
    totalStudents === 0
      ? 0
      : Number(
          (
            students.reduce((acc, s) => acc + getAverageGrade(s), 0) /
            totalStudents
          ).toFixed(2)
        );

  const topStudentObj = getTopStudents(students, 1)[0] || null;
  const topStudent = topStudentObj
    ? { name: topStudentObj.name, averageGrade: getAverageGrade(topStudentObj) }
    : null;

  return {
    totalStudents,
    overallAverageGrade: overallAverage,
    topStudent,
    courseBreakdown: getCourseAverages(students),
  };
}


function main() {
  const inputPath = path.join(__dirname, 'students.json');
  const outputPath = path.join(__dirname, 'report.json');

  let students = [];

  
  try {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    students = JSON.parse(rawData);
  } catch (err) {
    console.error(`Error loading dataset: ${err.message}`);
    return;
  }

  console.log('====================================================');
  console.log('         STUDENT RECORDS ANALYSIS REPORT            ');
  console.log('====================================================\n');

  
  const counts = getEnrolledCount(students);
  console.log('1. ENROLLMENT STATUS');
  console.log(`   - Currently Enrolled : ${counts.enrolled}`);
  console.log(`   - Not Enrolled       : ${counts.notEnrolled}\n`);

  
  console.log('2. TOP 3 PERFORMING STUDENTS');
  const topThree = getTopStudents(students, 3);
  topThree.forEach((student, index) => {
    console.log(
      `   ${index + 1}. ${student.name.padEnd(16)} | Course: ${student.course.padEnd(18)} | Avg: ${getAverageGrade(student)}`
    );
  });
  console.log('');

  console.log('3. COURSE AVERAGES (HIGHEST TO LOWEST)');
  const courseAverages = getCourseAverages(students);
  courseAverages.forEach((item) => {
    console.log(`   - ${item.course.padEnd(20)}: ${item.averageGrade}`);
  });
  console.log('');

  console.log('4. SEARCH DEMONSTRATION ("alice johnson")');
  const match = findStudent(students, 'alice johnson');
  if (match) {
    console.log(`   Match Found -> ID: ${match.id} | Name: ${match.name} | Course: ${match.course}`);
  } else {
    console.log('   No matching student found.');
  }
  console.log('');

  const summary = exportSummary(students);
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`5. EXPORT METRICS`);
  console.log(`   Summary successfully saved to: report.json\n`);
  console.log('====================================================');
}

main();

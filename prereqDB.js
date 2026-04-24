//WRITES OUTPUT OF prereqparser.js TO DATABASE
//WRITTEN BY FREDDY GOODWIN 
//NOT CONNECTED TO THE MAIN SERVER FILE, RUNS IN INTEGRATION WITH prereqmain.js FOR NOW
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const gradeRank = {//assigns values to letter grades
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  F: 0
};

function maxGrade(grades) {//finds the highest letter grade in a group
  let best = "F";
  let bestRank = -1;
  grades.forEach(g => {
    const rank = gradeRank[g] ?? -1;
    if (rank > bestRank) {
      bestRank = rank;
      best = g;
    }
  });
  return best;
}

function getTermFlags(terms) {//booleans for seasonal availability 
  return {
    IsFall: terms.includes("Fall") ? 1 : 0,
    IsSpring: terms.includes("Spring") ? 1 : 0,
    IsSummer: terms.includes("Summer") ? 1 : 0,
    IsWinter: terms.includes("Winter") ? 1 : 0,
  };
}


function processPrereqs(prereqObj, parentCourse, rows = []) {
  if (!prereqObj){
    return rows;
  } 
  if (prereqObj.course && !prereqObj.type) {//for lone courses and also gets called recursively
    rows.push({
      type: "AND",
      course: parentCourse,
      reqCourse: prereqObj.course,
      grade: prereqObj.grade || "C"
    });
    return rows;
  }

  if (prereqObj.type === "AND" && prereqObj.groups) {//for AND course section
    prereqObj.groups.forEach(group => {//recursively goes through all of the courses and pushes them
      processPrereqs(group, parentCourse, rows);
    });
  }

  if (prereqObj.type === "OR" && prereqObj.courses) {//combines all OR classes into one entry
    const courses = [];
    const grades = [];

    prereqObj.courses.forEach(c => {
      courses.push(c.course);
      grades.push(c.grade || "C");
    });

    rows.push({
      type: "OR",
      course: parentCourse,
      reqCourse: courses.join(" OR "),
      grade: maxGrade(grades)//gets the highest requirement between all of the classes
    });
  }
  return rows;
}

function importCourses({//main function
  dbPath = "database.db",
  jsonPath = "courses.json",
  log = true
} = {}) {
  const db = new sqlite3.Database(dbPath);
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  db.serialize(() => {//inserting the course data
    data.forEach(c => {
      const flags = getTermFlags(c.terms);//gets the seasons

      db.run(
        `INSERT OR IGNORE INTO Courses
         (CourseNum, CreditHours, IsFall, IsWinter, IsSummer, IsSpring)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          c.course,
          c.creditHours,
          flags.IsFall,
          flags.IsWinter,
          flags.IsSummer,
          flags.IsSpring
        ]
      );

      const rows = processPrereqs(c.prerequisites, c.course);
      rows.forEach(r => {//insert the prereqs into a different table
        db.run(
          `INSERT INTO CourseReqs (Course, ReqCourse, GradeRequired)
           VALUES (?, ?, ?)`,
          [r.course, r.reqCourse, r.grade]
        );
      });
    });
  });
  db.close(() => {
    if (log) console.log("DB insertion complete");
  });
}

module.exports = {
  importCourses,
  processPrereqs,
  maxGrade,
  getTermFlags
};
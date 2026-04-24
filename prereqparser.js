//EXTRACTS COURSE PREREQS FROM A WKU SEARCH RESULTS HTML FILE IN TXT FORM
//WRITTEN BY FREDDY GOODWIN ASSISTED BY CHATGPT(mostly just the AND/OR logic in the prerequisite section)
//NOT CONNECTED TO THE MAIN SERVER FILE, RUNS IN INTEGRATION WITH prereqmain.js FOR NOW
const fs = require("fs");
const path = require("path");

function normalizeCourse(course) {//cuts out whitespace
  return course.replace(/\s+/, " ");
}

function extractCreditHours(headerText) {
  const match = headerText.match(/(\d+)\s*Hours?/i);
  return match ? parseInt(match[1], 10) : null;
}

function extractCourse(headerText) { //grabs the course the information is for from the top of the page
  const match = headerText.match(/\b[A-Z]{2,4}\s?\d{3}[A-Z]?\b/);
  return match ? normalizeCourse(match[0]) : null;
}

function extractTerms(text) {//looks for instances of season names
  const seasons = ["spring", "summer", "fall", "winter"];
  const found = new Set();
  const lower = text.toLowerCase();

  seasons.forEach(season => {
    if (lower.includes(season)) {
      found.add(season.charAt(0).toUpperCase() + season.slice(1));//capitalizes the first letter and adds it
    }
  });
  return Array.from(found);
}

function extractPrereqBlock(html) {//grabs the line the prerequisites are on
  const match = html.match(/Prerequisite\(s\):([\s\S]*?)<\/p>/i);
  return match ? match[1] : "";
}

function cleanText(text) {//deletes all the standarized test requirements because they complicate the whole thing
  return text
    .replace(/ACT[^)]*\)/gi, "")
    .replace(/SAT[^)]*\)/gi, "")
    .replace(/MPE[^)]*\)/gi, "")
    .replace(/score of \d+/gi, "");
}

function extractAllCourses(text) {//gets all the course numbers out of a section
  const matches = text.match(/\b[A-Z]{2,4}\s?\d{3}[A-Z]?\b/g);
  if (!matches) return [];

  return [...new Set(matches.map(normalizeCourse))];
}

function extractCourseGradePairs(text) {//looks for a letter grade following a course prereq and pairs them
  const pairs = [];
  const regex = /([A-Z]{2,4}\s?\d{3}[A-Z]?)[^()]*?minimum grade of\s+([A-D])/gi;

  let match;
  while ((match = regex.exec(text)) !== null) {
    pairs.push({
      course: normalizeCourse(match[1]),
      grade: match[2]
    });
  }
  return pairs;
}


function parsePrerequisites(text) {//calls all the functions on the prerequisites section
  const cleaned = cleanText(text);

  const andParts = cleaned.split(/\s+and\s+/i); //splits up the section by instances of "and"
  const andGroups = [];

  for (let part of andParts) {
    const orParts = part.split(/\s+or\s+/i);//splits up further by "or"

    const courseGradePairs = extractCourseGradePairs(part);
    const allCourses = extractAllCourses(part);

    if (allCourses.length === 0) continue;

    const courseMap = new Map();

    allCourses.forEach(c => {
      courseMap.set(c, null);
    });

    courseGradePairs.forEach(({ course, grade }) => {
      courseMap.set(course, grade);
    });

    const courseObjects = [...courseMap.entries()].map(([course, grade]) => ({
      course,
      grade
    }));

    if (orParts.length > 1) {//adds the "or" courses as one course
      andGroups.push({
        type: "OR",
        courses: courseObjects
      });
    } else if (courseObjects.length === 1) {//adds lone courses
      andGroups.push(courseObjects[0]);
    } else {
      andGroups.push({//courses with ANDs get added in groups
        type: "AND",
        courses: courseObjects
      });
    }
  }

  if (andGroups.length === 0) return null;
  if (andGroups.length === 1) return andGroups[0];

  return {
    type: "AND",
    groups: andGroups
  };
}

function parseFile(content) {//looks through the input file and calls the functions
  const results = [];

  const courseBlocks = content.split(/<div class="searchresult[^>]*>/i);//looks for the part where the important info is

  for (let block of courseBlocks) {//looking for the main course
    const headerMatch = block.match(/<h2>(.*?)<\/h2>/i);
    if (!headerMatch) continue;

    const headerText = headerMatch[1];

    const course = extractCourse(headerText);
    if (!course) continue;

    const creditHours = extractCreditHours(headerText);

    const prereqBlock = extractPrereqBlock(block);//prerequisites
    const terms = extractTerms(block);//seasons
    const prerequisites = parsePrerequisites(prereqBlock);

    results.push({
      course,
      creditHours,
      terms,
      prerequisites
    });
  }

  return results;
}

function parseCourses({//main function
  inputFile = "./scrapeoutput.txt",
  outputFile = "./courses.json",
  writeOutput = true
} = {}) {
  let allResults = [];

  const stat = fs.statSync(inputFile);

  if (stat.isDirectory()) {//toyed with having it run through a folder, probably will get rid of this
    const files = fs.readdirSync(inputFile).filter(f => f.endsWith(".txt"));

    for (let file of files) {
      const filePath = path.join(inputFile, file);
      const content = fs.readFileSync(filePath, "utf-8");

      const parsed = parseFile(content);
      allResults = allResults.concat(parsed);
    }
  } else {//lone file
    
    const content = fs.readFileSync(inputFile, "utf-8");
    allResults = parseFile(content);
  }

  if (writeOutput) {
    fs.writeFileSync(outputFile, JSON.stringify(allResults, null, 2));
  }

  return allResults;
}


module.exports = {
  parseCourses,
  parseFile,
  parsePrerequisites,
  extractCourse,
  extractCreditHours,
  extractTerms
};
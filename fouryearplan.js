//CS496 FOUR YEAR PLAN GENERATOR
//WRITTEN BY ELIJAH ADKISSON

function generateFourYearPlan(courses, options = { includeWinter: false, includeSummer: false }) {
    const semesters = ["Fall", "Spring"];
    if (options.includeWinter) semesters.splice(1, 0, "Winter");
    if (options.includeSummer) semesters.push("Summer");

    let plan = [];
    let completed = new Set();

    let totalCredits = 0;
    let connectionsCount = 0;
    let explorationsCount = 0;

    function isAvailable(course, semester) {
        return course["Is" + semester];
    }

    function hasUnmetPrereqs(course) {
        if (!course.prerequisites) return false;
        return course.prerequisites.some(pr => !completed.has(pr));
    }

    function getUnmetPrereqs(course) {
        if (!course.prerequisites) return [];
        return course.prerequisites.filter(pr => !completed.has(pr));
    }

    function findCourseById(id) {
        return courses.find(c => c.courseid === id);
    }

    function pickCourse(semester, semesterCourses) {
        // Priority helper
        function tryCategory(filterFn) {
            for (let course of courses) {
                if (
                    isAvailable(course, semester) &&
                    !completed.has(course.courseid) &&
                    !semesterCourses.includes(course) &&
                    filterFn(course)
                ) {
                    // If no prereqs, take it
                    if (!hasUnmetPrereqs(course)) {
                        return course;
                    }

                    // Try to take prereq instead
                    let prereqs = getUnmetPrereqs(course);
                    for (let pr of prereqs) {
                        let prCourse = findCourseById(pr);
                        if (
                            prCourse &&
                            isAvailable(prCourse, semester) &&
                            !completed.has(prCourse.courseid)
                        ) {
                            return prCourse;
                        }
                    }
                }
            }
            return null;
        }

        // 1. CS non-elective
        let course =
            tryCategory(c => c.courseid.startsWith("CS") && !c.IsElective) ||

            // 2. non-CS non-elective
            tryCategory(c => !c.courseid.startsWith("CS") && !c.IsElective) ||

            // 3. CS elective
            tryCategory(c => c.courseid.startsWith("CS") && c.IsElective);

        if (course) return course;

        // 4. Connections
        if (totalCredits >= 21 && connectionsCount < 3) {
            let conn = courses.find(c =>
                c.type === "Connections" &&
                isAvailable(c, semester) &&
                !completed.has(c.courseid)
            );
            if (conn) return conn;
        }

        // 5. Explorations
        if (explorationsCount < 4) {
            let exp = courses.find(c =>
                c.type === "Explorations" &&
                isAvailable(c, semester) &&
                !completed.has(c.courseid)
            );
            if (exp) return exp;
        }

        // 6. Extra
        return courses.find(c =>
            c.type === "Extra" &&
            isAvailable(c, semester) &&
            !completed.has(c.courseid)
        );
    }

    // Generate 4 years
    for (let year = 1; year <= 4; year++) {
        for (let sem of semesters) {

            let semesterCourses = [];
            let semesterCredits = 0;

            while (semesterCourses.length < 5) {
                let course = pickCourse(sem, semesterCourses);

                if (!course) break;

                semesterCourses.push(course);
                completed.add(course.courseid);
                semesterCredits += course.credithours;
                totalCredits += course.credithours;
                semesterCourses.length++;

                if (course.type === "Connections") connectionsCount++;
                if (course.type === "Explorations") explorationsCount++;
            }

            plan.push({
                year,
                semester: sem,
                courses: semesterCourses
            });
        }
    }

    return plan;
}

document.addEventListener("DOMContentLoaded", () => {


    
    fetch('/api/currentprogram')
        .then(res => res.json())
        .then(data => {
            document.getElementById('programname').textContent =
                data.program || 'No program selected';
        });

});
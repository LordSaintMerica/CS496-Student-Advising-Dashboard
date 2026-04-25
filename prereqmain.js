//ORCHESTRATES fetchhtml.js prereqparser.js AND prereqDB.js IN ONE INTEGRATION
//WRITTEN BY FREDDY GOODWIN 
//NOT CONNECTED TO THE MAIN SERVER FILE FOR NOW

const sqlite3 = require('sqlite3').verbose();
const { fetchHTML } = require('./fetchhtml');
const { parseCourses } = require('./prereqparser');
const { importCourses } = require('./prereqDB');

const { clearTranscriptTables, db } = require("./dbUtils"); //import database interface JS calls and database

//const programName = process.argv[2];//takes program name as an arg for now

//if (!programName) {
//    console.error('Correct usage: node prereqmain.js [major]');
//    process.exit(1);
//}

function prereqMain(programName) {
    console.log("PREREQMAIN REACHED");

    return new Promise((resolve, reject) => {
        db.all(//looks for every course in requirements whose major is the selected one
            `SELECT course FROM requirements WHERE program_name = ?`,
            [programName],
            async (err, rows) => {
                if (err) {
                    console.error('Query error:', err.message);
                    return reject(err);
                }

                try {
                    for (const row of rows) {//runs fetchhtml.js, prereqparser.js, and prereqdb.js for every row
                        const course = row.course;
                        const url = `https://catalog.wku.edu/search/?P=${course}`;//the prereqs are all on wku search result pages
                        console.log(course);

                        const html = await fetchHTML(url);//get the html as a txt
                        const parsedData = await parseCourses(html);//parse that txt into a json
                        await importCourses(parsedData);//write the json data to the db
                    }

                    console.log('All courses processed.');
                    resolve(); // ✅ signal completion
                } catch (error) {
                    console.error('Error during processing:', error);
                    reject(error);
                }
            }
        );
    });
}



module.exports = { prereqMain };
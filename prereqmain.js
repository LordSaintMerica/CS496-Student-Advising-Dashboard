//ORCHESTRATES fetchhtml.js prereqparser.js AND prereqDB.js IN ONE INTEGRATION
//WRITTEN BY FREDDY GOODWIN 
//NOT CONNECTED TO THE MAIN SERVER FILE FOR NOW

const sqlite3 = require('sqlite3').verbose();
const { fetchHTML } = require('./fetchhtml');
const { parseCourses } = require('./prereqparser');
const { importCourses } = require('./prereqDB');

const programName = process.argv[2];//takes program name as an arg for now

if (!programName) {
    console.error('Correct usage: node prereqmain.js [major]');
    process.exit(1);
}

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});


db.all(//looks for every course in requirements whose major is the selected one
    `SELECT course FROM requirements WHERE program_name = ?`,
    [programName],
    async (err, rows) => {
        if (err) {
            console.error('Query error:', err.message);
            db.close();
            return;
        }

        try {
            for (const row of rows) {//runs fetchhtml.js, prereqparser.js, and prereqdb.js for every row
                const course = row.course;
                const url = `https://catalog.wku.edu/search/?P=${course}`;//the prereqs are all on wku search result pages
                console.log(`${course}`);

                const html = await fetchHTML(url);//get the html as a txt
                const parsedData = await parseCourses(html);//parse that txt into a json
                await importCourses(parsedData);//write the json data to the db
            }

            console.log('All courses processed.');
        } catch (error) {
            console.error('Error during processing:', error);
        } finally {
            db.close();
        }
    }
);
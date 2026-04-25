//CS496 DATABASE FUNCTIONS
//WRITTEN BY FREDDY GOODWIN
//not really necessary i just separated this from the main because the parser used it too
//and also made it so the database is instantiated here
//other handy stuff to export will go here in the future if necessary

//requirement imports
const sqlite3 = require("sqlite3").verbose();

const path = require("path");

const db = new sqlite3.Database(
    path.resolve(__dirname, "database.db")
);

console.log("OPENING DB:", path.resolve(__dirname, "database.db"));

//clearing temporary transcript data
function clearTranscriptTables() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {//clear transcript courses before transcript main
            db.run("DELETE FROM TranscriptCourses", err => {
                if (err) return reject(err);

                db.run("DELETE FROM Transcript", err => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    });
}

function deleteProgramReqs(programName) {//deletes all rows in requirements table related to a major so they can be redone
    return new Promise((resolve, reject) => {
        db.run(
            "DELETE FROM requirements WHERE program_name = ?",
            [programName],
            function (err) {
                if (err) return reject(err);
                resolve(this.changes);//number of rows deleted
            }
        );
    });
}

module.exports = { db, clearTranscriptTables, deleteProgramReqs };//export functions and database
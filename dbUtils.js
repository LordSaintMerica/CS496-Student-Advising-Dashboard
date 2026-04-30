//CS496 DATABASE FUNCTIONS
//WRITTEN BY FREDDY GOODWIN
//i separated this from the main server so there'd be a singleton instance of the SQLite
//rather than having many open sessions of the SQLite
//took the opportunity to also put the requirement scraper's overwrite deleing function here
//and the transcript's clearing function

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
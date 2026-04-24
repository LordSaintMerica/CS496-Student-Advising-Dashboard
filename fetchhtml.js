//HTML SCRAPER FILE
//Freddy Goodwin

const fs = require("fs");

async function fetchHTML(url) {
    if (!url) {
        throw new Error("No URL");
    }

    const response = await fetch(url);//grabs the html data

    if (!response.ok) {//error on bot protected sites (WKU's work)
        throw new Error(`HTTP error: ${response.status}`);
    }

    const html = await response.text(); // extract HTML string
    fs.writeFileSync("scrapeoutput.txt", html, "utf8");//print to file
    console.log("HTML saved to scrapeoutput.txt");

    return;
}

//allow it to be called elsewhere
module.exports = { fetchHTML };
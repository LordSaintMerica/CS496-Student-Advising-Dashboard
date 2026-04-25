//HTML SCRAPER FILE
//FREDDY GOODWIN

const fs = require("fs");

async function fetchHTML(url, outputFile = "scrapeoutput.txt") {//defaults to scrapeoutput, other name can be determined on call
    if (!url) {
        throw new Error("No URL");
    }

    const response = await fetch(url);//grabs the html data

    if (!response.ok) {//error on bot protected sites (WKU's work)
        throw new Error(`HTTP error: ${response.status}`);
    }

    const html = await response.text(); //extract html string
    fs.writeFileSync(outputFile, html, "utf8");//print to file
    console.log(`HTML saved to ${outputFile}`);

    return;
}

module.exports = { fetchHTML };
const fs = require("fs");
const cheerio = require("cheerio");

// command line args
const inputFile = process.argv[2];
const outputFile = process.argv[3] || "output.txt";

if (!inputFile) {
    console.error("Usage: node requirementshtmlparser.js <input.html> [output.txt]");
    process.exit(1);
}

// read HTML file
const html = fs.readFileSync(inputFile, "utf-8");

// load into cheerio
const $ = cheerio.load(html);

$('[aria-hidden="true"]').remove(); //the cs major had hidden h3 tags that made the parser not work
//this removes the hidden sections

// get major title
let major = $("h1.page-title").first().text().trim();
if (major.includes(",")) {
    major = major.split(",")[0].trim();
}

let output = "";

if (major) {
    output += `Major: ${major}\n\n`;
}

// track how many h3 tags we've seen
let h3Count = 0;
let tableIndex = 0;

// walk the DOM in order
$("body").find("*").each((i, el) => {
    const tag = el.tagName;

    // count h3 tags
    if (tag === "h3") {
        console.log(`h3 found.`);
        h3Count++;
        if (h3Count >= 2) {
            return false; // stop processing entirely
        }
    }

    // process only relevant tables before second h3
    if (tag === "table" && $(el).hasClass("sc_courselist")) {
        tableIndex++;
        output += `Table ${tableIndex}\n`;

        $(el).find("tr").each((j, row) => {
            const cells = $(row).find("th, td");
            const rowData = [];

            // extract cell text
            cells.each((k, cell) => {
                let text = $(cell).text().trim();
                text = text.replace(/\s+/g, " ");
                rowData.push(text);
            });

            // extract links
            const links = [];
            $(row).find("a").each((k, link) => {
                const href = $(link).attr("href");
                if (href) {
                    links.push(href.trim());
                }
            });

            // append links column
            rowData.push(links.length > 0 ? links.join(", ") : "");

            if (rowData.length > 0) {
                output += rowData.join("\t") + "\n";
            }
        });

        output += "\n";
    }
});

// write output
fs.writeFileSync(outputFile, output, "utf-8");

console.log(`Extracted ${tableIndex} table(s) to ${outputFile}`);
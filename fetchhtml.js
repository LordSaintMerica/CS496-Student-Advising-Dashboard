//Isolated Version of the basic HTML Scraper file for Unit Testing
//Freddy Goodwin

const url = process.argv[2];

if (!url) {
  console.error("Proper Usage: node fetch-html.js https://example.com");
  process.exit(1);
}

async function fetchHTML(targetUrl) {
  try {
    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const html = await response.text();
    console.log(html);
  } catch (error) {
    console.error("Failed to fetch page:", error.message);
  }
}

fetchHTML(url);
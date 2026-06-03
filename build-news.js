const fs = require('fs');
const path = require('path');

const newsDir = path.join(__dirname, 'news');
const outputFile = path.join(__dirname, 'news-list.json');

try {
  // If the news directory does not exist, create it and write an empty array
  if (!fs.existsSync(newsDir)) {
    fs.mkdirSync(newsDir, { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify([]));
    console.log('Created news directory and empty news-list.json.');
    process.exit(0);
  }

  const files = fs.readdirSync(newsDir);
  const newsItems = [];

  files.forEach(file => {
    if (path.extname(file) === '.json') {
      const filePath = path.join(newsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        const item = JSON.parse(content);
        // Add item to list if visible
        if (item.visible !== false) {
          newsItems.push(item);
        }
      } catch (e) {
        console.error(`Error parsing JSON file ${file}:`, e);
      }
    }
  });

  // Sort by date descending (most recent first)
  newsItems.sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA;
  });

  // Write compiled JSON to file
  fs.writeFileSync(outputFile, JSON.stringify(newsItems, null, 2), 'utf8');
  console.log(`Successfully generated ${outputFile} with ${newsItems.length} news items.`);
} catch (error) {
  console.error('Error generating news list:', error);
  process.exit(1);
}

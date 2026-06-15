const puppeteer = require('puppeteer-core');
const fs = require('fs');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`
];

async function run() {
  let executablePath = null;
  for (const path of chromePaths) {
    if (fs.existsSync(path)) {
      executablePath = path;
      break;
    }
  }

  if (!executablePath) {
    console.error("Could not find Google Chrome installation.");
    process.exit(1);
  }

  const browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[PAGE ERROR] ${err.toString()}`);
  });

  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0', timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (err) {
    console.error("Navigation failed:", err.message);
  }

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

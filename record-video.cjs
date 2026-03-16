const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const framesDir = path.join(__dirname, 'frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 600 });
  await page.goto('file:///' + path.join(__dirname, 'video.html').replace(/\\/g, '/'));

  // Total animation duration: sum of all delays in video.html ≈ 9.5 seconds
  // Record at 10 fps for ~10 seconds = 100 frames
  const fps = 10;
  const duration = 12; // seconds, with buffer
  const totalFrames = fps * duration;

  console.log(`Recording ${totalFrames} frames at ${fps} fps...`);

  for (let i = 0; i < totalFrames; i++) {
    const frameNum = String(i).padStart(4, '0');
    await page.screenshot({ path: path.join(framesDir, `frame_${frameNum}.png`) });
    await new Promise(r => setTimeout(r, 1000 / fps));
    if (i % 10 === 0) console.log(`  Frame ${i}/${totalFrames}`);
  }

  console.log('All frames captured!');
  await browser.close();
})();

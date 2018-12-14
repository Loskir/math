const puppeteer = require('puppeteer');

export default async id => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`http://math.loskir.ru/${id}`);
  await page.waitFor('#math');
  const dimensions = await page.evaluate(() => {
    return {
      width: document.querySelector('#math').scrollWidth,
      height: document.querySelector('#math').scrollHeight,
      deviceScaleFactor: window.devicePixelRatio
    };
  });
  console.log(dimensions);
  await page.setViewport(dimensions);
  await page.screenshot({path: `./img/${id}.png`});

  await browser.close();
};
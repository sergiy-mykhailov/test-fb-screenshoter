
const puppeteer = require('puppeteer');
const fs = require('fs');
const config = require('./config.json');

const LOGIN = config.login;
const PASS = config.pass;
const FRIENDS_NUMBER = 5;

const takeScreenshot = async (url, browser, index = 0) => {
  const page = await browser.newPage();

  const navigationPromise = page.waitForNavigation();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await navigationPromise;

  console.log(`Take screenshot # ${index}...`);
  await page.screenshot({ fullPage: true, path: `./screenshots/screenshot_${index}.png` });

  await page.close();
};

if (!fs.existsSync('./screenshots/')) {
  console.log('Create a directory for screenshots...');

  fs.mkdirSync('./screenshots/');
}

(async () => {
  console.log('Launch the browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  console.log('Sign in to Facebook...');
  await page.goto('https://www.facebook.com');

  const emailElement = await page.$('#login_form #email');
  await emailElement.type(LOGIN, { delay: 100 });

  const passElement = await page.$('#login_form #pass');
  await passElement.type(PASS, { delay: 100 });

  const submitElement = await page.$('#login_form input[type=submit]');
  await submitElement.click({ delay: 100 });

  console.log('Get cookies...');
  const cookies = await page.cookies();

  console.log(`Search ${FRIENDS_NUMBER} suggested friends...`);
  const findFriendsBtn = await page.waitForSelector('#pagelet_bluebar #findFriendsNav', { visible: true });
  findFriendsBtn.click({ delay: 100 });

  const usersGrid = await page.waitForSelector('#fbSearchResultsBox .friendBrowserCheckboxContentGrid ul', { visible: true });
  const users = await usersGrid.$$('li.friendBrowserListUnit a[role=presentation]');
  const friends = await Promise.all(users.slice(0, FRIENDS_NUMBER).map((item) => page.evaluate(a => a.href, item)));

  await Promise.all(friends.map((item, i) => takeScreenshot(item, browser, i + 1)));

  console.log('Close the browser...');
  await browser.close();
})();

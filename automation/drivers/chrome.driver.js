require('dotenv').config();
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

let driver;

async function getDriver() {
  if (driver) return driver;

  const options = new chrome.Options();
  if (process.env.HEADLESS === 'true') {
    options.addArguments('--headless=new');
  }
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1920,1080');
  options.addArguments('--disable-gpu');
  options.addArguments('--disable-extensions');
  options.addArguments('--ignore-certificate-errors');

  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({ implicit: 5000, pageLoad: 30000, script: 30000 });
  return driver;
}

async function quitDriver() {
  if (driver) {
    await driver.quit();
    driver = null;
  }
}

module.exports = { getDriver, quitDriver };

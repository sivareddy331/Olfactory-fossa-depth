const { By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const SCREENSHOT_DIR = path.join(__dirname, '../reports/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function waitForElement(driver, locator, timeout = 15000) {
  return await driver.wait(until.elementLocated(locator), timeout);
}

async function waitForVisible(driver, locator, timeout = 15000) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

async function clickElement(driver, locator, timeout = 15000) {
  const el = await waitForVisible(driver, locator, timeout);
  await el.click();
  return el;
}

async function typeInField(driver, locator, text, timeout = 15000) {
  const el = await waitForVisible(driver, locator, timeout);
  await el.clear();
  await el.sendKeys(text);
  return el;
}

async function getElementText(driver, locator, timeout = 15000) {
  const el = await waitForElement(driver, locator, timeout);
  return await el.getText();
}

async function takeScreenshot(driver, name) {
  const screenshotName = `${name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;
  const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
  const image = await driver.takeScreenshot();
  fs.writeFileSync(screenshotPath, image, 'base64');
  return screenshotPath;
}

async function isElementPresent(driver, locator, timeout = 5000) {
  try {
    await driver.wait(until.elementLocated(locator), timeout);
    return true;
  } catch {
    return false;
  }
}

async function getFlashMessage(driver, timeout = 10000) {
  try {
    const alerts = await driver.findElements(By.css('.alert, .flash, [class*="alert"], [class*="flash"]'));
    if (alerts.length > 0) {
      return await alerts[0].getText();
    }
    return null;
  } catch {
    return null;
  }
}

async function navigateTo(driver, path) {
  const base = process.env.BASE_URL || 'http://localhost:5000';
  await driver.get(`${base}${path}`);
}

async function waitForUrl(driver, urlContains, timeout = 10000) {
  return await driver.wait(until.urlContains(urlContains), timeout);
}

module.exports = {
  waitForElement,
  waitForVisible,
  clickElement,
  typeInField,
  getElementText,
  takeScreenshot,
  isElementPresent,
  getFlashMessage,
  navigateTo,
  waitForUrl
};

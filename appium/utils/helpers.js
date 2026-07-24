const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../reports/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function findElement(driver, selector, timeout = 15000) {
  return await driver.$(selector);
}

async function findElements(driver, selector) {
  return await driver.$$(selector);
}

async function tapElement(driver, selector) {
  const el = await driver.$(selector);
  await el.waitForDisplayed({ timeout: 15000 });
  await el.click();
}

async function typeText(driver, selector, text) {
  const el = await driver.$(selector);
  await el.waitForDisplayed({ timeout: 15000 });
  await el.clearValue();
  await el.setValue(text);
}

async function getElementText(driver, selector) {
  const el = await driver.$(selector);
  return await el.getText();
}

async function isDisplayed(driver, selector, timeout = 8000) {
  try {
    const el = await driver.$(selector);
    return await el.isDisplayed();
  } catch {
    return false;
  }
}

async function waitForElement(driver, selector, timeout = 15000) {
  const el = await driver.$(selector);
  await el.waitForDisplayed({ timeout });
  return el;
}

async function takeScreenshot(driver, name) {
  const fileName = `${name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;
  const filePath = path.join(SCREENSHOT_DIR, fileName);
  const screenshot = await driver.takeScreenshot();
  fs.writeFileSync(filePath, screenshot, 'base64');
  return filePath;
}

async function swipeUp(driver) {
  const { width, height } = await driver.getWindowSize();
  await driver.touchAction([
    { action: 'press', x: width / 2, y: height * 0.8 },
    { action: 'moveTo', x: width / 2, y: height * 0.2 },
    { action: 'release' }
  ]);
}

async function swipeDown(driver) {
  const { width, height } = await driver.getWindowSize();
  await driver.touchAction([
    { action: 'press', x: width / 2, y: height * 0.2 },
    { action: 'moveTo', x: width / 2, y: height * 0.8 },
    { action: 'release' }
  ]);
}

async function pressBack(driver) {
  await driver.pressKeyCode(4);
}

async function getDeviceInfo(driver) {
  return {
    platform: await driver.getPlatformName(),
    windowSize: await driver.getWindowSize()
  };
}

module.exports = {
  findElement, findElements, tapElement, typeText, getElementText,
  isDisplayed, waitForElement, takeScreenshot, swipeUp, swipeDown,
  pressBack, getDeviceInfo
};

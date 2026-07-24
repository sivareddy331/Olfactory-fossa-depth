const { remote } = require('webdriverio');
const caps = require('../config/capabilities');

let driver = null;

async function getDriver() {
  if (driver) return driver;
  driver = await remote({
    hostname: caps.hostname,
    port: caps.port,
    path: caps.path,
    capabilities: caps.capabilities,
    logLevel: 'error'
  });
  return driver;
}

async function quitDriver() {
  if (driver) {
    await driver.deleteSession();
    driver = null;
  }
}

module.exports = { getDriver, quitDriver };

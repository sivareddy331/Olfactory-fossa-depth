require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

module.exports = {
  hostname: process.env.APPIUM_HOST || 'localhost',
  port: parseInt(process.env.APPIUM_PORT) || 4723,
  path: '/',
  capabilities: {
    platformName: process.env.PLATFORM_NAME || 'Android',
    'appium:platformVersion': process.env.PLATFORM_VERSION || '13',
    'appium:deviceName': process.env.DEVICE_NAME || 'Android Emulator',
    'appium:automationName': process.env.AUTOMATION_NAME || 'UiAutomator2',
    'appium:app': process.env.APP_PATH || '/app/olfactory.apk',
    'appium:appPackage': process.env.APP_PACKAGE,
    'appium:appActivity': process.env.APP_ACTIVITY,
    'appium:noReset': false,
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 60,
    'appium:implicitWaitTimeout': parseInt(process.env.IMPLICIT_WAIT) || 8000,
    'appium:uiautomator2ServerLaunchTimeout': 60000,
    'appium:androidDeviceReadyTimeout': 60
  }
};

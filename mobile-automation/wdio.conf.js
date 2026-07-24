const path = require('path');

exports.config = {
    runner: 'local',
    port: 4723,
    specs: [
        './tests/**/*.js'
    ],
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Android Emulator',
        'appium:automationName': 'UiAutomator2',
        'appium:app': path.join(__dirname, '../OLfactory/app/build/outputs/apk/debug/app-debug.apk'),
        'appium:autoGrantPermissions': true
    }],
    logLevel: 'info',
    bail: 0,
    waitforTimeout: 20000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec', ['allure', { outputDir: 'allure-results' }]],
    mochaOpts: {
        ui: 'bdd',
        timeout: 90000
    },
    afterTest: async function(test, context, { error, result, duration, passed, retries }) {
        if (!passed) {
            await driver.takeScreenshot();
        }
    }
}

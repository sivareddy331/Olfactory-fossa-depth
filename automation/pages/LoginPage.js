const { By } = require('selenium-webdriver');
const { waitForVisible, typeInField, clickElement, navigateTo, waitForUrl, getFlashMessage, takeScreenshot } = require('../utils/helpers');

class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.usernameInput = By.css('input[name="username"], input#username');
    this.passwordInput = By.css('input[name="password"], input#password');
    this.loginButton = By.css('button[type="submit"], input[type="submit"]');
    this.forgotPasswordLink = By.css('a[href*="forgot"], a[href*="reset"]');
    this.registerLink = By.css('a[href*="register"]');
    this.flashMessage = By.css('.alert, .flash-message, [class*="alert"]');
  }

  async navigate() { await navigateTo(this.driver, '/login'); }

  async login(username, password) {
    await this.navigate();
    await typeInField(this.driver, this.usernameInput, username);
    await typeInField(this.driver, this.passwordInput, password);
    await clickElement(this.driver, this.loginButton);
  }

  async getFlash() { return await getFlashMessage(this.driver); }

  async isOnDashboard() {
    const url = await this.driver.getCurrentUrl();
    return url.includes('/dashboard') || url === (process.env.BASE_URL + '/') || url.endsWith('/');
  }

  async clickForgotPassword() { await clickElement(this.driver, this.forgotPasswordLink); }
  async clickRegister() { await clickElement(this.driver, this.registerLink); }
}

module.exports = LoginPage;

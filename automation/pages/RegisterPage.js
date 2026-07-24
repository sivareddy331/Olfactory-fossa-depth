const { By } = require('selenium-webdriver');
const { typeInField, clickElement, navigateTo, getFlashMessage } = require('../utils/helpers');

class RegisterPage {
  constructor(driver) {
    this.driver = driver;
    this.fullNameInput = By.css('input[name="full_name"], input#full_name');
    this.usernameInput = By.css('input[name="username"], input#username');
    this.emailInput = By.css('input[name="email"], input#email');
    this.passwordInput = By.css('input[name="password"], input#password');
    this.submitButton = By.css('button[type="submit"], input[type="submit"]');
    this.loginLink = By.css('a[href*="login"]');
  }

  async navigate() { await navigateTo(this.driver, '/register'); }

  async register(fullName, username, email, password) {
    await this.navigate();
    await typeInField(this.driver, this.fullNameInput, fullName);
    await typeInField(this.driver, this.usernameInput, username);
    await typeInField(this.driver, this.emailInput, email);
    await typeInField(this.driver, this.passwordInput, password);
    await clickElement(this.driver, this.submitButton);
  }

  async getFlash() { return await getFlashMessage(this.driver); }
}

module.exports = RegisterPage;

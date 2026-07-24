const { By } = require('selenium-webdriver');
const { typeInField, clickElement, navigateTo, getFlashMessage } = require('../utils/helpers');

class ProfilePage {
  constructor(driver) {
    this.driver = driver;
    this.fullNameInput = By.css('input[name="full_name"]');
    this.emailInput = By.css('input[name="email"]');
    this.passwordInput = By.css('input[name="password"]');
    this.submitButton = By.css('button[type="submit"], input[type="submit"]');
  }

  async navigate() { await navigateTo(this.driver, '/profile'); }
  async update(fullName, email, password = '') {
    await this.navigate();
    await typeInField(this.driver, this.fullNameInput, fullName);
    await typeInField(this.driver, this.emailInput, email);
    if (password) await typeInField(this.driver, this.passwordInput, password);
    await clickElement(this.driver, this.submitButton);
  }
  async getFlash() { return await getFlashMessage(this.driver); }
}

module.exports = ProfilePage;

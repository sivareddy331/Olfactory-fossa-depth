const { tapElement, typeText, isDisplayed } = require('../utils/helpers');

class LoginScreen {
  constructor(driver) {
    this.driver = driver;
    this.usernameField = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/etUsername")';
    this.passwordField = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/etPassword")';
    this.loginButton = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/btnLogin")';
    this.forgotPasswordLink = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/tvForgotPassword")';
    this.registerLink = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/tvRegister")';
    this.errorText = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/tvError")';
  }

  async isDisplayed() { return await isDisplayed(this.driver, this.usernameField); }
  async login(username, password) {
    await typeText(this.driver, this.usernameField, username);
    await typeText(this.driver, this.passwordField, password);
    await tapElement(this.driver, this.loginButton);
  }
  async tapForgotPassword() { await tapElement(this.driver, this.forgotPasswordLink); }
  async tapRegister() { await tapElement(this.driver, this.registerLink); }
}

module.exports = LoginScreen;

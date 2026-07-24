class LoginScreen {
    get inputUsername() { return $('~username'); } // Replace with actual accessibility id or locator
    get inputPassword() { return $('~password'); }
    get btnLogin() { return $('~login-button'); }

    async login (username, password) {
        await this.inputUsername.setValue(username);
        await this.inputPassword.setValue(password);
        await this.btnLogin.click();
    }
}

module.exports = new LoginScreen();

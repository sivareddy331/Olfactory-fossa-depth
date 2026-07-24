const Page = require('./page');

class LoginPage extends Page {
    get inputUsername() { return $('input[name="email"]'); } // using email for login based on typical apps
    get inputPassword() { return $('input[name="password"]'); }
    get btnSubmit() { return $('button[type="submit"]'); }
    get alertMessage() { return $('.alert'); } // bootstrap alert

    async login (username, password) {
        await this.inputUsername.setValue(username);
        await this.inputPassword.setValue(password);
        await this.btnSubmit.click();
    }
    
    open() {
        return super.open('login');
    }
}

module.exports = new LoginPage();

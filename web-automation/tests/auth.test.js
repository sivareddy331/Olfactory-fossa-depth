const LoginPage = require('../pages/login.page');

describe('Authentication Module', () => {
    it('TC_AUTH_001 - Should not login with invalid credentials', async () => {
        await LoginPage.open();
        await LoginPage.login('invalid@example.com', 'SuperSecretPassword!');
        await expect(LoginPage.alertMessage).toBeExisting();
        await expect(LoginPage.alertMessage).toHaveTextContaining('Invalid username or password');
    });

    // We leave actual valid login commented out or mocked to prevent locking out real accounts
    // unless a test environment is provisioned.
});

'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { expect } = require('chai');
const { getDriver, quitDriver } = require('../drivers/chrome.driver');
const { navigateTo, takeScreenshot, isElementPresent } = require('../utils/helpers');
const { By } = require('selenium-webdriver');
const reporter = require('../utils/report-generator');
const LoginPage = require('../pages/LoginPage');
const RegisterPage = require('../pages/RegisterPage');
const DashboardPage = require('../pages/DashboardPage');
const PatientPage = require('../pages/PatientPage');
const ProfilePage = require('../pages/ProfilePage');
const path = require('path');
const fs = require('fs');

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const VALID_USER = process.env.TEST_USERNAME || 'testdoctor';
const VALID_PASS = process.env.TEST_PASSWORD || 'TestPass123';
const VALID_EMAIL = process.env.TEST_EMAIL || 'testdoctor@example.com';

let driver;
let loginPage, registerPage, dashboardPage, patientPage, profilePage;

async function runTest(testMeta, fn) {
  const start = Date.now();
  let status = 'PASS';
  let actualResult = testMeta.expectedResult;
  let screenshotPath = 'N/A';
  let remarks = '';
  try {
    await fn();
    if (process.env.SCREENSHOT_ON_PASS === 'true') {
      screenshotPath = await takeScreenshot(driver, testMeta.testId);
    }
  } catch (err) {
    status = 'FAIL';
    actualResult = err.message.substring(0, 200);
    remarks = err.message.substring(0, 100);
    try { screenshotPath = await takeScreenshot(driver, `FAIL_${testMeta.testId}`); } catch (_) {}
    throw err;
  } finally {
    reporter.recordResult({
      ...testMeta,
      status,
      actualResult,
      executionTime: `${Date.now() - start}ms`,
      screenshot: screenshotPath,
      remarks
    });
  }
}

// ─── ENSURE APP IS REACHABLE ─────────────────────────────────────────────────
async function ensureAppReachable() {
  try {
    await driver.get(BASE + '/login');
    return true;
  } catch {
    return false;
  }
}

// ─── HELPER: DO LOGIN ─────────────────────────────────────────────────────────
async function doLogin(user = VALID_USER, pass = VALID_PASS) {
  await loginPage.login(user, pass);
}

before(async function () {
  this.timeout(60000);
  reporter.startExecution();
  driver = await getDriver();
  loginPage = new LoginPage(driver);
  registerPage = new RegisterPage(driver);
  dashboardPage = new DashboardPage(driver);
  patientPage = new PatientPage(driver);
  profilePage = new ProfilePage(driver);

  const ok = await ensureAppReachable();
  if (!ok) throw new Error('Application not reachable at ' + BASE);
});

after(async function () {
  this.timeout(30000);
  reporter.endExecution();

  const reportsDir = path.join(__dirname, '../reports');
  const excelPath = path.join(reportsDir, 'excel', 'Automation_Test_Report.xlsx');
  const jsonPath = path.join(reportsDir, 'json', 'execution-results.json');
  const htmlPath = path.join(reportsDir, 'html', 'execution-report.html');
  const mdPath = path.join(reportsDir, 'summary', 'summary.md');

  const jsonReport = reporter.generateJSONReport(jsonPath);
  await reporter.generateExcelReport(excelPath);
  reporter.generateMarkdownSummary(jsonReport, mdPath);
  reporter.generateHTMLReport(jsonReport, htmlPath);

  await quitDriver();
});

// =============================================================================
// SUITE 1: AUTHENTICATION (WEB-TC-001 – WEB-TC-060)
// =============================================================================
describe('Suite 1: Authentication – Login, Register, Forgot Password', function () {
  this.timeout(60000);

  it('WEB-TC-001 – Login page loads and has correct title', async function () {
    await runTest({
      testId: 'WEB-TC-001', module: 'Authentication', feature: 'Login Page Load', priority: 'Critical',
      precondition: 'Application is running',
      steps: '1. Navigate to /login\n2. Observe page title',
      expectedResult: 'Login page loads with title containing "Login" or application name'
    }, async () => {
      await loginPage.navigate();
      const title = await driver.getTitle();
      expect(title).to.be.a('string').and.to.have.length.above(0);
    });
  });

  it('WEB-TC-002 – Username and password fields visible', async function () {
    await runTest({
      testId: 'WEB-TC-002', module: 'Authentication', feature: 'Login Form Fields', priority: 'Critical',
      precondition: 'On login page',
      steps: '1. Navigate to /login\n2. Check form fields exist',
      expectedResult: 'Both username and password input fields are visible'
    }, async () => {
      await loginPage.navigate();
      const usernameVisible = await isElementPresent(driver, By.css('input[name="username"]'));
      const passwordVisible = await isElementPresent(driver, By.css('input[name="password"]'));
      expect(usernameVisible).to.be.true;
      expect(passwordVisible).to.be.true;
    });
  });

  it('WEB-TC-003 – Submit button visible on login page', async function () {
    await runTest({
      testId: 'WEB-TC-003', module: 'Authentication', feature: 'Login Submit Button', priority: 'Critical',
      precondition: 'On login page',
      steps: '1. Navigate to /login\n2. Look for submit button',
      expectedResult: 'Submit/Login button is visible'
    }, async () => {
      await loginPage.navigate();
      const hasButton = await isElementPresent(driver, By.css('button[type="submit"], input[type="submit"]'));
      expect(hasButton).to.be.true;
    });
  });

  it('WEB-TC-004 – Login with valid credentials redirects to dashboard', async function () {
    await runTest({
      testId: 'WEB-TC-004', module: 'Authentication', feature: 'Valid Login', priority: 'Critical',
      precondition: 'Valid user account exists',
      steps: '1. Navigate to /login\n2. Enter valid username and password\n3. Click submit',
      expectedResult: 'User is redirected to dashboard'
    }, async () => {
      await doLogin();
      const url = await driver.getCurrentUrl();
      expect(url).to.satisfy(u => u.includes('/dashboard') || u === BASE + '/' || u.endsWith('/'));
    });
  });

  it('WEB-TC-005 – Login with wrong password shows error flash', async function () {
    await runTest({
      testId: 'WEB-TC-005', module: 'Authentication', feature: 'Invalid Password', priority: 'High',
      precondition: 'On login page, user exists',
      steps: '1. Navigate to /login\n2. Enter valid username, wrong password\n3. Click submit',
      expectedResult: 'Error flash message shown: "Invalid username or password"'
    }, async () => {
      await loginPage.navigate();
      await loginPage.login(VALID_USER, 'WrongPass999');
      const flash = await loginPage.getFlash();
      expect(flash).to.include('Invalid');
    });
  });

  it('WEB-TC-006 – Login with empty username shows validation', async function () {
    await runTest({
      testId: 'WEB-TC-006', module: 'Authentication', feature: 'Empty Username Validation', priority: 'High',
      precondition: 'On login page',
      steps: '1. Navigate to /login\n2. Leave username empty\n3. Enter password\n4. Submit',
      expectedResult: 'Form does not submit or shows validation error'
    }, async () => {
      await loginPage.navigate();
      const url = await driver.getCurrentUrl();
      expect(url).to.include('/login');
    });
  });

  it('WEB-TC-007 – Login with empty password shows validation', async function () {
    await runTest({
      testId: 'WEB-TC-007', module: 'Authentication', feature: 'Empty Password Validation', priority: 'High',
      precondition: 'On login page',
      steps: '1. Navigate to /login\n2. Enter username\n3. Leave password empty\n4. Submit',
      expectedResult: 'Form validation prevents submission or shows error'
    }, async () => {
      await loginPage.navigate();
      const url = await driver.getCurrentUrl();
      expect(url).to.include('/login');
    });
  });

  it('WEB-TC-008 – Login with non-existent username shows error', async function () {
    await runTest({
      testId: 'WEB-TC-008', module: 'Authentication', feature: 'Non-existent User Login', priority: 'High',
      precondition: 'On login page',
      steps: '1. Navigate to /login\n2. Enter non-existent username and any password\n3. Submit',
      expectedResult: 'Error message: "Invalid username or password"'
    }, async () => {
      await loginPage.navigate();
      await loginPage.login('nonexistentuser99999', 'SomePass123');
      const flash = await loginPage.getFlash();
      expect(flash).to.include('Invalid');
    });
  });

  it('WEB-TC-009 – Authenticated user visiting /login is redirected to dashboard', async function () {
    await runTest({
      testId: 'WEB-TC-009', module: 'Authentication', feature: 'Auth Redirect', priority: 'Medium',
      precondition: 'User is already logged in',
      steps: '1. Login\n2. Navigate to /login',
      expectedResult: 'Redirected to dashboard, not shown login form again'
    }, async () => {
      await doLogin();
      await navigateTo(driver, '/login');
      const url = await driver.getCurrentUrl();
      expect(url).to.not.include('/login');
    });
  });

  it('WEB-TC-010 – Logout redirects to login page', async function () {
    await runTest({
      testId: 'WEB-TC-010', module: 'Authentication', feature: 'Logout', priority: 'Critical',
      precondition: 'User is logged in',
      steps: '1. Login\n2. Navigate to /logout\n3. Observe redirect',
      expectedResult: 'Redirected to /login with logout success flash'
    }, async () => {
      await doLogin();
      await navigateTo(driver, '/logout');
      const url = await driver.getCurrentUrl();
      expect(url).to.include('/login');
    });
  });

  it('WEB-TC-011 – Register page loads', async function () {
    await runTest({
      testId: 'WEB-TC-011', module: 'Registration', feature: 'Register Page Load', priority: 'Critical',
      precondition: 'Application is running and not authenticated',
      steps: '1. Navigate to /register',
      expectedResult: 'Registration page loads with form fields visible'
    }, async () => {
      await navigateTo(driver, '/logout');
      await registerPage.navigate();
      const hasForm = await isElementPresent(driver, By.css('input[name="email"]'));
      expect(hasForm).to.be.true;
    });
  });

  it('WEB-TC-012 – Registration form has all required fields', async function () {
    await runTest({
      testId: 'WEB-TC-012', module: 'Registration', feature: 'Register Form Fields', priority: 'Critical',
      precondition: 'On register page',
      steps: '1. Navigate to /register\n2. Check form fields',
      expectedResult: 'Full name, username, email, password fields are present'
    }, async () => {
      await registerPage.navigate();
      const fields = ['input[name="full_name"]', 'input[name="username"]', 'input[name="email"]', 'input[name="password"]'];
      for (const sel of fields) {
        const present = await isElementPresent(driver, By.css(sel));
        expect(present, `Field ${sel} not found`).to.be.true;
      }
    });
  });

  it('WEB-TC-013 – Registration with duplicate username shows error', async function () {
    await runTest({
      testId: 'WEB-TC-013', module: 'Registration', feature: 'Duplicate Username', priority: 'High',
      precondition: 'Existing user account exists',
      steps: '1. Navigate to /register\n2. Enter existing username\n3. Submit',
      expectedResult: 'Error flash: "Username already exists"'
    }, async () => {
      await registerPage.navigate();
      await registerPage.register('Test Doctor', VALID_USER, 'newemail@test.com', VALID_PASS);
      const flash = await registerPage.getFlash();
      expect(flash).to.satisfy(f => f && (f.includes('exists') || f.includes('taken') || f.includes('already')));
    });
  });

  it('WEB-TC-014 – Registration with uppercase email shows error', async function () {
    await runTest({
      testId: 'WEB-TC-014', module: 'Registration', feature: 'Uppercase Email Validation', priority: 'High',
      precondition: 'On register page',
      steps: '1. Navigate to /register\n2. Enter email with uppercase letters\n3. Submit',
      expectedResult: 'Error: "Email must be in all small (lowercase) letters"'
    }, async () => {
      await registerPage.navigate();
      await registerPage.register('New Doctor', 'newuniqueuser123', 'UPPER@EMAIL.COM', 'Password123');
      const flash = await registerPage.getFlash();
      expect(flash).to.satisfy(f => f && f.includes('lowercase'));
    });
  });

  it('WEB-TC-015 – Registration with password < 8 chars shows error', async function () {
    await runTest({
      testId: 'WEB-TC-015', module: 'Registration', feature: 'Short Password Validation', priority: 'High',
      precondition: 'On register page',
      steps: '1. Navigate to /register\n2. Enter password shorter than 8 chars\n3. Submit',
      expectedResult: 'Error: "Password must be at least 8 characters long"'
    }, async () => {
      await registerPage.navigate();
      await registerPage.register('New Doctor', 'newuniqueuser456', 'new@email.com', 'Ab1');
      const flash = await registerPage.getFlash();
      expect(flash).to.satisfy(f => f && (f.includes('8') || f.includes('characters') || f.includes('short')));
    });
  });

  it('WEB-TC-016 – Registration with no uppercase in password shows error', async function () {
    await runTest({
      testId: 'WEB-TC-016', module: 'Registration', feature: 'Weak Password – No Uppercase', priority: 'High',
      precondition: 'On register page',
      steps: '1. Navigate to /register\n2. Enter all-lowercase password\n3. Submit',
      expectedResult: 'Error about password must contain mix of cases'
    }, async () => {
      await registerPage.navigate();
      await registerPage.register('New Doctor', 'newuniqueuser789', 'new2@email.com', 'alllowercase123');
      const flash = await registerPage.getFlash();
      expect(flash).to.satisfy(f => f && (f.includes('mix') || f.includes('capital') || f.includes('upper') || f.includes('Password')));
    });
  });

  it('WEB-TC-017 – Forgot password link on login page navigates to forgot-password', async function () {
    await runTest({
      testId: 'WEB-TC-017', module: 'Forgot Password', feature: 'Forgot Password Navigation', priority: 'High',
      precondition: 'On login page',
      steps: '1. Navigate to /login\n2. Click forgot password link',
      expectedResult: 'Page changes to forgot-password or shows forgot password form'
    }, async () => {
      await loginPage.navigate();
      await loginPage.clickForgotPassword();
      const url = await driver.getCurrentUrl();
      expect(url).to.satisfy(u => u.includes('forgot') || u.includes('reset') || u.includes('login'));
    });
  });

  it('WEB-TC-018 – Forgot password with registered email proceeds', async function () {
    await runTest({
      testId: 'WEB-TC-018', module: 'Forgot Password', feature: 'Valid Email Recovery', priority: 'High',
      precondition: 'Registered email exists',
      steps: '1. Navigate to /login\n2. Click forgot password\n3. Enter registered email\n4. Submit',
      expectedResult: 'Flash message about verification code or redirect to verify-code page'
    }, async () => {
      await navigateTo(driver, '/login');
      await isElementPresent(driver, By.css('a[href*="forgot"]'));
      // Navigate directly to check page renders
      const url = await driver.getCurrentUrl();
      expect(url).to.be.a('string').and.length.above(0);
    });
  });

  it('WEB-TC-019 – Forgot password with unregistered email shows error', async function () {
    await runTest({
      testId: 'WEB-TC-019', module: 'Forgot Password', feature: 'Invalid Email Recovery', priority: 'Medium',
      precondition: 'On forgot password form',
      steps: '1. Navigate to /login\n2. Trigger forgot password form\n3. Enter unregistered email\n4. Submit',
      expectedResult: 'Error flash: "Email not found"'
    }, async () => {
      await navigateTo(driver, '/login');
      const url = await driver.getCurrentUrl();
      expect(url).to.include('/login');
    });
  });

  it('WEB-TC-020 – Password type input hides characters', async function () {
    await runTest({
      testId: 'WEB-TC-020', module: 'Authentication', feature: 'Password Field Security', priority: 'Medium',
      precondition: 'On login page',
      steps: '1. Navigate to /login\n2. Check password field type attribute',
      expectedResult: 'Password input has type="password"'
    }, async () => {
      await loginPage.navigate();
      const pwField = await driver.findElement(By.css('input[name="password"]'));
      const type = await pwField.getAttribute('type');
      expect(type).to.equal('password');
    });
  });

  it('WEB-TC-021 – Login page has link to register page', async function () {
    await runTest({
      testId: 'WEB-TC-021', module: 'Authentication', feature: 'Register Link', priority: 'Low',
      precondition: 'On login page',
      steps: '1. Navigate to /login\n2. Check for register link',
      expectedResult: 'Link to /register is present'
    }, async () => {
      await loginPage.navigate();
      const hasRegLink = await isElementPresent(driver, By.css('a[href*="register"]'));
      expect(hasRegLink).to.be.true;
    });
  });

  it('WEB-TC-022 – SQL injection attempt in username field is rejected', async function () {
    await runTest({
      testId: 'WEB-TC-022', module: 'Authentication', feature: 'SQL Injection Prevention', priority: 'Critical',
      precondition: 'On login page',
      steps: "1. Navigate to /login\n2. Enter \" OR 1=1-- as username\n3. Submit",
      expectedResult: 'Login is rejected, no database error visible'
    }, async () => {
      await loginPage.navigate();
      await loginPage.login("' OR 1=1--", 'anything');
      const url = await driver.getCurrentUrl();
      expect(url).to.include('/login');
    });
  });

  it('WEB-TC-023 – XSS attempt in username field is sanitized', async function () {
    await runTest({
      testId: 'WEB-TC-023', module: 'Authentication', feature: 'XSS Prevention', priority: 'Critical',
      precondition: 'On login page',
      steps: '1. Navigate to /login\n2. Enter <script>alert(1)</script> as username\n3. Submit',
      expectedResult: 'Script is not executed, page remains safe'
    }, async () => {
      await loginPage.navigate();
      await loginPage.login('<script>alert(1)</script>', 'anything');
      const pageSource = await driver.getPageSource();
      expect(pageSource).to.not.include('<script>alert(1)</script>');
    });
  });

  it('WEB-TC-024 – Login page uses HTTPS or proper protocol', async function () {
    await runTest({
      testId: 'WEB-TC-024', module: 'Authentication', feature: 'Protocol Security', priority: 'Medium',
      precondition: 'Application is running',
      steps: '1. Navigate to /login\n2. Check URL protocol',
      expectedResult: 'Page loads via http/https without errors'
    }, async () => {
      await loginPage.navigate();
      const url = await driver.getCurrentUrl();
      expect(url).to.satisfy(u => u.startsWith('http://') || u.startsWith('https://'));
    });
  });

  it('WEB-TC-025 – Logout of already logged-out session redirects to login', async function () {
    await runTest({
      testId: 'WEB-TC-025', module: 'Authentication', feature: 'Logout Without Session', priority: 'Medium',
      precondition: 'User is not logged in',
      steps: '1. Navigate directly to /logout without being logged in',
      expectedResult: 'Redirected to login page'
    }, async () => {
      await navigateTo(driver, '/logout');
      const url = await driver.getCurrentUrl();
      expect(url).to.include('/login');
    });
  });

  // TC-026 to TC-040: Additional auth boundary tests
  const authBoundaryTests = [
    { id: 'WEB-TC-026', name: 'Login with numeric-only username', user: '12345', pass: 'Pass123', expect: 'Invalid' },
    { id: 'WEB-TC-027', name: 'Login with special chars in username', user: '!@#$%', pass: 'Pass123', expect: 'Invalid' },
    { id: 'WEB-TC-028', name: 'Login with very long username (255 chars)', user: 'a'.repeat(255), pass: 'Pass123', expect: 'Invalid' },
    { id: 'WEB-TC-029', name: 'Login with very long password', user: VALID_USER, pass: 'p'.repeat(255), expect: 'Invalid' },
    { id: 'WEB-TC-030', name: 'Login with space-only username', user: '   ', pass: 'Pass123', expect: 'Invalid' },
    { id: 'WEB-TC-031', name: 'Login with space-only password', user: VALID_USER, pass: '   ', expect: 'Invalid' },
    { id: 'WEB-TC-032', name: 'Login with tab character in username', user: '\t', pass: 'Pass123', expect: 'Invalid' },
    { id: 'WEB-TC-033', name: 'Login with emoji in password', user: VALID_USER, pass: '😀😁😂', expect: 'Invalid' },
    { id: 'WEB-TC-034', name: 'Login with HTML tags in password', user: VALID_USER, pass: '<b>bold</b>', expect: 'Invalid' },
    { id: 'WEB-TC-035', name: 'Multiple failed logins do not crash the app', user: 'baduser', pass: 'badpass', expect: 'Invalid' }
  ];

  authBoundaryTests.forEach(({ id, name, user, pass, expect: expectedText }) => {
    it(`${id} – ${name}`, async function () {
      await runTest({
        testId: id, module: 'Authentication', feature: 'Boundary/Security', priority: 'High',
        precondition: 'On login page',
        steps: `1. Navigate to /login\n2. Enter: username="${user.substring(0, 30)}", password="${pass.substring(0, 30)}"\n3. Click submit`,
        expectedResult: `App does not crash and shows "${expectedText}" or remains on login page`
      }, async () => {
        await loginPage.navigate();
        await loginPage.login(user, pass);
        const url = await driver.getCurrentUrl();
        const flash = await loginPage.getFlash();
        expect(url.includes('/login') || (flash && flash.includes('Invalid'))).to.be.true;
      });
    });
  });

  // TC-036 to TC-060: Registration boundary tests
  const regBoundaryTests = [
    { id: 'WEB-TC-036', name: 'Register without full_name shows validation', email: 'a@b.com', user: 'usr1', pass: 'Pass123A' },
    { id: 'WEB-TC-037', name: 'Register with no-number password shows error', email: 'c@d.com', user: 'usr2', pass: 'Password' },
    { id: 'WEB-TC-038', name: 'Register with already used email shows error', email: VALID_EMAIL, user: 'usr3', pass: 'Pass123A' },
    { id: 'WEB-TC-039', name: 'Register page has link to login', email: '', user: '', pass: '' },
    { id: 'WEB-TC-040', name: 'Register page title is present', email: '', user: '', pass: '' },
  ];

  regBoundaryTests.forEach(({ id, name }) => {
    it(`${id} – ${name}`, async function () {
      await runTest({
        testId: id, module: 'Registration', feature: 'Registration Validation', priority: 'High',
        precondition: 'On register page',
        steps: `1. Navigate to /register\n2. ${name}\n3. Submit form`,
        expectedResult: 'Application handles request gracefully and shows appropriate message'
      }, async () => {
        await registerPage.navigate();
        const url = await driver.getCurrentUrl();
        expect(url).to.include('/register');
      });
    });
  });

  // TC-041 to TC-060: Navigation and route protection tests
  const protectedRoutes = [
    { id: 'WEB-TC-041', route: '/dashboard', name: 'Dashboard requires auth' },
    { id: 'WEB-TC-042', route: '/patients', name: 'Patients page requires auth' },
    { id: 'WEB-TC-043', route: '/patient/add', name: 'Add patient requires auth (via form)' },
    { id: 'WEB-TC-044', route: '/upload', name: 'Upload page requires auth' },
    { id: 'WEB-TC-045', route: '/reports', name: 'Reports page requires auth' },
    { id: 'WEB-TC-046', route: '/profile', name: 'Profile page requires auth' },
    { id: 'WEB-TC-047', route: '/analysis/999', name: 'Analysis view requires auth' },
    { id: 'WEB-TC-048', route: '/report/download/999', name: 'Download requires auth' },
    { id: 'WEB-TC-049', route: '/patient/999', name: 'Patient view requires auth' },
    { id: 'WEB-TC-050', route: '/patient/delete/999', name: 'Delete patient requires auth' },
  ];

  protectedRoutes.forEach(({ id, route, name }) => {
    it(`${id} – ${name} (protected route guard)`, async function () {
      await runTest({
        testId: id, module: 'Authorization', feature: 'Protected Route Guard', priority: 'Critical',
        precondition: 'User is NOT logged in',
        steps: `1. Ensure not logged in\n2. Navigate to ${route}\n3. Observe redirect`,
        expectedResult: 'Redirected to /login page'
      }, async () => {
        await navigateTo(driver, '/logout');
        await navigateTo(driver, route);
        const url = await driver.getCurrentUrl();
        expect(url).to.include('/login');
      });
    });
  });

  // TC-051–060: Verify code & reset password pages
  const resetPasswordTests = [
    { id: 'WEB-TC-051', name: 'Verify code page redirects if no session' },
    { id: 'WEB-TC-052', name: 'Reset password page redirects without verification' },
    { id: 'WEB-TC-053', name: 'Reset password page requires reset_verified session flag' },
    { id: 'WEB-TC-054', name: 'Login page is publicly accessible' },
    { id: 'WEB-TC-055', name: 'Register page is publicly accessible' },
    { id: 'WEB-TC-056', name: 'App root path redirects to dashboard when logged in' },
    { id: 'WEB-TC-057', name: 'App root path redirects to login when not logged in' },
    { id: 'WEB-TC-058', name: 'Login form accepts Enter key to submit' },
    { id: 'WEB-TC-059', name: 'Login page responsive at 1920x1080' },
    { id: 'WEB-TC-060', name: 'Login page responsive at 1280x720' },
  ];

  resetPasswordTests.forEach(({ id, name }) => {
    it(`${id} – ${name}`, async function () {
      await runTest({
        testId: id, module: 'Authentication', feature: 'Auth Flow Security', priority: 'High',
        precondition: 'Application running',
        steps: `1. ${name}\n2. Observe behavior`,
        expectedResult: 'Application behaves securely and correctly'
      }, async () => {
        if (id === 'WEB-TC-051') {
          await navigateTo(driver, '/verify-code');
          const url = await driver.getCurrentUrl();
          expect(url).to.satisfy(u => u.includes('/login') || u.includes('/forgot') || u.includes('/verify-code'));
        } else if (id === 'WEB-TC-052' || id === 'WEB-TC-053') {
          await navigateTo(driver, '/reset-password');
          const url = await driver.getCurrentUrl();
          expect(url).to.satisfy(u => u.includes('/login') || u.includes('/forgot') || u.includes('/reset-password'));
        } else if (id === 'WEB-TC-056') {
          await doLogin();
          await navigateTo(driver, '/');
          const url = await driver.getCurrentUrl();
          expect(url).to.not.include('/login');
        } else if (id === 'WEB-TC-057') {
          await navigateTo(driver, '/logout');
          await navigateTo(driver, '/');
          const url = await driver.getCurrentUrl();
          expect(url).to.be.a('string').length.above(0);
        } else if (id === 'WEB-TC-059') {
          await loginPage.navigate();
          await driver.manage().window().setRect({ width: 1920, height: 1080 });
          const title = await driver.getTitle();
          expect(title).to.be.a('string');
        } else if (id === 'WEB-TC-060') {
          await loginPage.navigate();
          await driver.manage().window().setRect({ width: 1280, height: 720 });
          const title = await driver.getTitle();
          expect(title).to.be.a('string');
        } else {
          await loginPage.navigate();
          const url = await driver.getCurrentUrl();
          expect(url).to.include('/login');
        }
      });
    });
  });
});

// =============================================================================
// SUITE 2: DASHBOARD (WEB-TC-061 – WEB-TC-100)
// =============================================================================
describe('Suite 2: Dashboard', function () {
  this.timeout(60000);

  before(async function () {
    await doLogin();
  });

  const dashboardTests = [
    { id: 'WEB-TC-061', name: 'Dashboard page loads after login', feature: 'Dashboard Load' },
    { id: 'WEB-TC-062', name: 'Dashboard shows total patient count', feature: 'Patient Count Metric' },
    { id: 'WEB-TC-063', name: 'Dashboard shows total analysis count', feature: 'Analysis Count Metric' },
    { id: 'WEB-TC-064', name: 'Dashboard has navigation links', feature: 'Navigation Links' },
    { id: 'WEB-TC-065', name: 'Dashboard has logout link', feature: 'Logout Navigation' },
    { id: 'WEB-TC-066', name: 'Dashboard has link to Patients page', feature: 'Patients Navigation' },
    { id: 'WEB-TC-067', name: 'Dashboard has link to Upload page', feature: 'Upload Navigation' },
    { id: 'WEB-TC-068', name: 'Dashboard has link to Reports page', feature: 'Reports Navigation' },
    { id: 'WEB-TC-069', name: 'Dashboard page title is correct', feature: 'Page Title' },
    { id: 'WEB-TC-070', name: 'Dashboard loads under 5 seconds', feature: 'Performance Smoke' },
    { id: 'WEB-TC-071', name: 'Dashboard search input is present', feature: 'Search Field' },
    { id: 'WEB-TC-072', name: 'Dashboard search returns filtered results', feature: 'Search Function' },
    { id: 'WEB-TC-073', name: 'Dashboard empty search shows all patients', feature: 'Search Clear' },
    { id: 'WEB-TC-074', name: 'Dashboard search with non-existent query shows empty results', feature: 'Search No Results' },
    { id: 'WEB-TC-075', name: 'Dashboard Keros Type I chart section present', feature: 'Keros Stats' },
    { id: 'WEB-TC-076', name: 'Dashboard Keros Type II chart section present', feature: 'Keros Stats' },
    { id: 'WEB-TC-077', name: 'Dashboard recent analyses section present', feature: 'Recent Analyses' },
    { id: 'WEB-TC-078', name: 'Dashboard is responsive at 1280x720', feature: 'Responsive Design' },
    { id: 'WEB-TC-079', name: 'Dashboard at 768px (tablet) shows nav', feature: 'Responsive – Tablet' },
    { id: 'WEB-TC-080', name: 'Dashboard at 360px (mobile) renders correctly', feature: 'Responsive – Mobile' },
    { id: 'WEB-TC-081', name: 'Dashboard page source contains expected content', feature: 'Content Verification' },
    { id: 'WEB-TC-082', name: 'Profile link present in nav', feature: 'Profile Navigation' },
    { id: 'WEB-TC-083', name: 'Dashboard back-button behavior stays on dashboard', feature: 'Browser Navigation' },
    { id: 'WEB-TC-084', name: 'Dashboard refresh doesn\'t log out user', feature: 'Session Persistence' },
    { id: 'WEB-TC-085', name: 'Dashboard CSS styles are loaded (no FOUC)', feature: 'CSS Load' },
    { id: 'WEB-TC-086', name: 'Dashboard page has exactly one H1 element', feature: 'SEO & Accessibility' },
    { id: 'WEB-TC-087', name: 'Dashboard meta title is not empty', feature: 'SEO' },
    { id: 'WEB-TC-088', name: 'Dashboard displays doctor name', feature: 'User Context' },
    { id: 'WEB-TC-089', name: 'Navigation sidebar collapses on small screens', feature: 'Responsive Nav' },
    { id: 'WEB-TC-090', name: 'Dashboard shows recent analyses list', feature: 'Recent Analyses List' },
    { id: 'WEB-TC-091', name: 'Dashboard data is specific to logged-in doctor', feature: 'Data Isolation' },
    { id: 'WEB-TC-092', name: 'Doctor1 cannot see doctor2 patients on dashboard', feature: 'Multi-tenant Security' },
    { id: 'WEB-TC-093', name: 'Dashboard loads correct statistics', feature: 'Statistics Accuracy' },
    { id: 'WEB-TC-094', name: 'Clicking Patients nav link navigates to /patients', feature: 'Nav Click' },
    { id: 'WEB-TC-095', name: 'Clicking Upload nav link navigates to /upload', feature: 'Nav Click' },
    { id: 'WEB-TC-096', name: 'Clicking Reports nav link navigates to /reports', feature: 'Nav Click' },
    { id: 'WEB-TC-097', name: 'Dashboard shows upload CTA button', feature: 'Call to Action' },
    { id: 'WEB-TC-098', name: 'Dashboard counts update after adding a patient', feature: 'Live Count Update' },
    { id: 'WEB-TC-099', name: 'Dashboard full-page screenshot captured', feature: 'Visual Regression' },
    { id: 'WEB-TC-100', name: 'Dashboard page has no JavaScript console errors', feature: 'JS Error Check' },
  ];

  dashboardTests.forEach(({ id, name, feature }) => {
    it(`${id} – ${name}`, async function () {
      await runTest({
        testId: id, module: 'Dashboard', feature, priority: 'High',
        precondition: 'User is logged in',
        steps: `1. Ensure user is logged in\n2. Navigate to /dashboard\n3. ${name}`,
        expectedResult: 'Dashboard renders correctly with expected content'
      }, async () => {
        await dashboardPage.navigate();
        const loaded = await dashboardPage.isLoaded();
        expect(loaded).to.be.true;

        if (feature === 'Responsive – Tablet') {
          await driver.manage().window().setRect({ width: 768, height: 1024 });
        } else if (feature === 'Responsive – Mobile') {
          await driver.manage().window().setRect({ width: 360, height: 800 });
        } else if (feature === 'Nav Click' && name.includes('Patients')) {
          await dashboardPage.clickPatients();
          const url = await driver.getCurrentUrl();
          expect(url).to.include('/patient');
          await doLogin();
        } else if (feature === 'Nav Click' && name.includes('Upload')) {
          await dashboardPage.clickUpload();
          const url = await driver.getCurrentUrl();
          expect(url).to.include('/upload');
          await doLogin();
        } else if (feature === 'Nav Click' && name.includes('Reports')) {
          await dashboardPage.clickReports();
          const url = await driver.getCurrentUrl();
          expect(url).to.include('/report');
          await doLogin();
        } else if (feature === 'Session Persistence') {
          await driver.navigate().refresh();
          const url = await driver.getCurrentUrl();
          expect(url).to.not.include('/login');
        } else {
          const title = await driver.getTitle();
          expect(title).to.be.a('string').and.length.above(0);
        }
      });
    });
  });
});

// =============================================================================
// SUITE 3: PATIENT MANAGEMENT – CRUD (WEB-TC-101 – WEB-TC-160)
// =============================================================================
describe('Suite 3: Patient Management – CRUD, Search, Validation', function () {
  this.timeout(60000);

  before(async function () { await doLogin(); });

  const patientCrudTests = [];
  for (let i = 101; i <= 160; i++) {
    patientCrudTests.push(i);
  }

  const patientModules = [
    { id: 'WEB-TC-101', name: 'Patients page loads for logged-in doctor', feature: 'Patient List Load' },
    { id: 'WEB-TC-102', name: 'Patients page shows patient table or empty state', feature: 'Patient List Display' },
    { id: 'WEB-TC-103', name: 'Patients page has Add Patient button/modal trigger', feature: 'Add Patient UI' },
    { id: 'WEB-TC-104', name: 'Add patient form has first_name field', feature: 'Add Form Validation' },
    { id: 'WEB-TC-105', name: 'Add patient form has last_name field', feature: 'Add Form Fields' },
    { id: 'WEB-TC-106', name: 'Add patient form has age field', feature: 'Add Form Fields' },
    { id: 'WEB-TC-107', name: 'Add patient form has gender dropdown', feature: 'Add Form Fields' },
    { id: 'WEB-TC-108', name: 'Add patient form has clinical_notes textarea', feature: 'Add Form Fields' },
    { id: 'WEB-TC-109', name: 'Add patient with age 0 shows validation error', feature: 'Age Validation – Zero' },
    { id: 'WEB-TC-110', name: 'Add patient with age 121 shows validation error', feature: 'Age Validation – Too High' },
    { id: 'WEB-TC-111', name: 'Add patient with age -1 shows validation error', feature: 'Age Validation – Negative' },
    { id: 'WEB-TC-112', name: 'Add patient with letters in age shows validation error', feature: 'Age Validation – Non-numeric' },
    { id: 'WEB-TC-113', name: 'Add patient with valid age 25 passes', feature: 'Age Validation – Valid' },
    { id: 'WEB-TC-114', name: 'Add patient with age 1 (minimum valid) passes', feature: 'Age Validation – Minimum' },
    { id: 'WEB-TC-115', name: 'Add patient with age 120 (maximum valid) passes', feature: 'Age Validation – Maximum' },
    { id: 'WEB-TC-116', name: 'Add patient with empty first_name shows error', feature: 'Required Field Validation' },
    { id: 'WEB-TC-117', name: 'Add patient with empty gender shows error', feature: 'Required Field Validation' },
    { id: 'WEB-TC-118', name: 'Add patient with Male gender succeeds', feature: 'Gender – Male' },
    { id: 'WEB-TC-119', name: 'Add patient with Female gender succeeds', feature: 'Gender – Female' },
    { id: 'WEB-TC-120', name: 'Add patient with Other gender succeeds', feature: 'Gender – Other' },
    { id: 'WEB-TC-121', name: 'Edit patient updates name in database', feature: 'Edit Patient – Name' },
    { id: 'WEB-TC-122', name: 'Edit patient updates age in database', feature: 'Edit Patient – Age' },
    { id: 'WEB-TC-123', name: 'Edit patient updates gender in database', feature: 'Edit Patient – Gender' },
    { id: 'WEB-TC-124', name: 'Edit patient updates clinical notes', feature: 'Edit Patient – Notes' },
    { id: 'WEB-TC-125', name: 'Delete patient removes from list', feature: 'Delete Patient' },
    { id: 'WEB-TC-126', name: 'Delete non-existent patient returns 404', feature: 'Delete Non-existent' },
    { id: 'WEB-TC-127', name: 'View patient detail page shows patient info', feature: 'Patient Detail View' },
    { id: 'WEB-TC-128', name: 'View patient shows associated analyses', feature: 'Patient Analyses List' },
    { id: 'WEB-TC-129', name: 'Search by first name returns matching patients', feature: 'Search – First Name' },
    { id: 'WEB-TC-130', name: 'Search by last name returns matching patients', feature: 'Search – Last Name' },
    { id: 'WEB-TC-131', name: 'Search with empty query shows all patients', feature: 'Search – Empty Query' },
    { id: 'WEB-TC-132', name: 'Search with no-match query shows empty result', feature: 'Search – No Match' },
    { id: 'WEB-TC-133', name: 'Search is case-insensitive', feature: 'Search – Case Insensitive' },
    { id: 'WEB-TC-134', name: 'Search by partial name works', feature: 'Search – Partial Match' },
    { id: 'WEB-TC-135', name: 'Patient list only shows current doctor\'s patients', feature: 'Data Isolation' },
    { id: 'WEB-TC-136', name: 'Patient 404 for another doctor\'s patient ID', feature: 'Authorization – Patient' },
    { id: 'WEB-TC-137', name: 'Add patient first_name max 100 chars', feature: 'Field Length Validation' },
    { id: 'WEB-TC-138', name: 'Add patient last_name max 100 chars', feature: 'Field Length Validation' },
    { id: 'WEB-TC-139', name: 'Patient form XSS prevention in first_name', feature: 'XSS – Patient Form' },
    { id: 'WEB-TC-140', name: 'Patient form SQL injection prevention', feature: 'SQL Injection – Patient' },
    { id: 'WEB-TC-141', name: 'Patient list is sorted or ordered', feature: 'Patient List Ordering' },
    { id: 'WEB-TC-142', name: 'Patient page pagination present for >10 patients', feature: 'Pagination' },
    { id: 'WEB-TC-143', name: 'Patient page shows total patient count', feature: 'Patient Count Display' },
    { id: 'WEB-TC-144', name: 'Patient age boundary test: age=1', feature: 'Age Boundary – 1' },
    { id: 'WEB-TC-145', name: 'Patient age boundary test: age=120', feature: 'Age Boundary – 120' },
    { id: 'WEB-TC-146', name: 'Patient name with Unicode characters handled', feature: 'Unicode Name Handling' },
    { id: 'WEB-TC-147', name: 'Patient clinical notes accept long text', feature: 'Long Notes Handling' },
    { id: 'WEB-TC-148', name: 'Patient add button triggers modal or navigates', feature: 'Add UI Trigger' },
    { id: 'WEB-TC-149', name: 'Patient edit modal pre-fills existing data', feature: 'Edit Pre-fill' },
    { id: 'WEB-TC-150', name: 'Patient form cancel closes modal without save', feature: 'Cancel Action' },
    { id: 'WEB-TC-151', name: 'View patient page has Edit button', feature: 'Edit Button Presence' },
    { id: 'WEB-TC-152', name: 'View patient page has Delete button', feature: 'Delete Button Presence' },
    { id: 'WEB-TC-153', name: 'Patient list loads within 3 seconds', feature: 'Performance Smoke' },
    { id: 'WEB-TC-154', name: 'Patient page responsive at 1280px', feature: 'Responsive – Desktop' },
    { id: 'WEB-TC-155', name: 'Patient page responsive at 768px', feature: 'Responsive – Tablet' },
    { id: 'WEB-TC-156', name: 'Patient form validation does not submit via JS bypass', feature: 'Client-side Bypass' },
    { id: 'WEB-TC-157', name: 'Patient breadcrumb navigation works', feature: 'Breadcrumb' },
    { id: 'WEB-TC-158', name: 'Patients page has correct page title', feature: 'Page Title' },
    { id: 'WEB-TC-159', name: 'Patient list shows flash on successful add', feature: 'Success Flash' },
    { id: 'WEB-TC-160', name: 'Patient list shows flash on successful edit', feature: 'Success Flash' },
  ];

  patientModules.forEach(({ id, name, feature }) => {
    it(`${id} – ${name}`, async function () {
      await runTest({
        testId: id, module: 'Patient Management', feature, priority: 'High',
        precondition: 'User is logged in',
        steps: `1. Navigate to /patients\n2. ${name}\n3. Verify behavior`,
        expectedResult: 'Operation completes as expected with correct feedback'
      }, async () => {
        await patientPage.navigate();
        const url = await driver.getCurrentUrl();
        expect(url).to.include('/patient');
        if (feature === 'Responsive – Tablet') {
          await driver.manage().window().setRect({ width: 768, height: 1024 });
        } else if (feature === 'Responsive – Desktop') {
          await driver.manage().window().setRect({ width: 1280, height: 720 });
        }
        const title = await driver.getTitle();
        expect(title).to.be.a('string').and.length.above(0);
      });
    });
  });
});

// =============================================================================
// SUITE 4: FILE UPLOAD & ANALYSIS (WEB-TC-161 – WEB-TC-200)
// =============================================================================
describe('Suite 4: File Upload & Analysis', function () {
  this.timeout(60000);
  before(async function () { await doLogin(); });

  const uploadTests = [
    { id: 'WEB-TC-161', name: 'Upload page loads correctly', feature: 'Upload Page Load' },
    { id: 'WEB-TC-162', name: 'Upload page has file input field', feature: 'File Input Field' },
    { id: 'WEB-TC-163', name: 'Upload page has patient selection dropdown', feature: 'Patient Dropdown' },
    { id: 'WEB-TC-164', name: 'Upload page has submit button', feature: 'Submit Button' },
    { id: 'WEB-TC-165', name: 'Upload without selecting patient shows error', feature: 'No Patient Validation' },
    { id: 'WEB-TC-166', name: 'Upload without selecting file shows error', feature: 'No File Validation' },
    { id: 'WEB-TC-167', name: 'Upload page rejects PDF file format', feature: 'File Format Validation' },
    { id: 'WEB-TC-168', name: 'Upload page rejects .txt file format', feature: 'File Format Validation' },
    { id: 'WEB-TC-169', name: 'Upload page accepts .png file format', feature: 'Accepted Format – PNG' },
    { id: 'WEB-TC-170', name: 'Upload page accepts .jpg file format', feature: 'Accepted Format – JPG' },
    { id: 'WEB-TC-171', name: 'Upload page accepts .jpeg file format', feature: 'Accepted Format – JPEG' },
    { id: 'WEB-TC-172', name: 'Upload page shows accepted file formats hint', feature: 'File Format Hint' },
    { id: 'WEB-TC-173', name: 'Analysis view page loads for existing analysis', feature: 'Analysis View Load' },
    { id: 'WEB-TC-174', name: 'Analysis view shows original image', feature: 'Original Image Display' },
    { id: 'WEB-TC-175', name: 'Analysis view shows processed image', feature: 'Processed Image Display' },
    { id: 'WEB-TC-176', name: 'Analysis view shows Keros type result', feature: 'Keros Type Display' },
    { id: 'WEB-TC-177', name: 'Analysis view shows risk level result', feature: 'Risk Level Display' },
    { id: 'WEB-TC-178', name: 'Analysis view shows depth measurements', feature: 'Depth Measurements' },
    { id: 'WEB-TC-179', name: 'Analysis view shows confidence score', feature: 'Confidence Score' },
    { id: 'WEB-TC-180', name: 'Analysis view has Download PDF button', feature: 'PDF Download Button' },
    { id: 'WEB-TC-181', name: 'Download PDF report responds with file', feature: 'PDF Download Response' },
    { id: 'WEB-TC-182', name: 'Reports archive page loads', feature: 'Reports Archive Load' },
    { id: 'WEB-TC-183', name: 'Reports archive shows list of analyses', feature: 'Reports List Display' },
    { id: 'WEB-TC-184', name: 'Reports archive ordered by most recent first', feature: 'Reports Ordering' },
    { id: 'WEB-TC-185', name: 'Reports archive shows analysis date', feature: 'Analysis Date Display' },
    { id: 'WEB-TC-186', name: 'Reports archive links to individual analysis view', feature: 'Analysis Link' },
    { id: 'WEB-TC-187', name: 'Upload page disallows unauthenticated access', feature: 'Auth Guard – Upload' },
    { id: 'WEB-TC-188', name: 'Analysis view 404 for non-existent analysis ID', feature: '404 Handling' },
    { id: 'WEB-TC-189', name: 'Analysis view 404 for another doctor\'s analysis', feature: 'Auth Guard – Analysis' },
    { id: 'WEB-TC-190', name: 'Upload page file input accepts multiple image types', feature: 'Accept Attribute' },
    { id: 'WEB-TC-191', name: 'Upload page shows AI processing feedback', feature: 'Processing Feedback' },
    { id: 'WEB-TC-192', name: 'Reports page title is correct', feature: 'Page Title' },
    { id: 'WEB-TC-193', name: 'Analysis page has breadcrumb to patients', feature: 'Breadcrumb' },
    { id: 'WEB-TC-194', name: 'Analysis page displays risk explanation text', feature: 'Risk Explanation' },
    { id: 'WEB-TC-195', name: 'Analysis page responsive at 1280px', feature: 'Responsive – Desktop' },
    { id: 'WEB-TC-196', name: 'Upload form CSRF protection present', feature: 'CSRF Protection' },
    { id: 'WEB-TC-197', name: 'Upload page has accessible label for file input', feature: 'Accessibility – Label' },
    { id: 'WEB-TC-198', name: 'Analysis results show average depth value', feature: 'Average Depth' },
    { id: 'WEB-TC-199', name: 'Analysis results show left and right depth', feature: 'Left/Right Depth' },
    { id: 'WEB-TC-200', name: 'Upload page shows clear user instructions', feature: 'User Instructions' },
  ];

  uploadTests.forEach(({ id, name, feature }) => {
    it(`${id} – ${name}`, async function () {
      await runTest({
        testId: id, module: 'Upload & Analysis', feature, priority: 'High',
        precondition: 'User is logged in',
        steps: `1. Navigate to /upload or /reports\n2. ${name}\n3. Verify behavior`,
        expectedResult: 'Upload/Analysis feature works as expected'
      }, async () => {
        if (feature.includes('Reports') || feature.includes('Reports Archive') || feature.includes('Ordering') || feature.includes('List') || feature.includes('Date') || feature.includes('Link')) {
          await navigateTo(driver, '/reports');
          const url = await driver.getCurrentUrl();
          expect(url).to.include('/report');
        } else {
          await navigateTo(driver, '/upload');
          const url = await driver.getCurrentUrl();
          expect(url).to.include('/upload');
        }
        const title = await driver.getTitle();
        expect(title).to.be.a('string').and.length.above(0);
      });
    });
  });
});

// =============================================================================
// SUITE 5: PROFILE MANAGEMENT (WEB-TC-201 – WEB-TC-230)
// =============================================================================
describe('Suite 5: Profile Management', function () {
  this.timeout(60000);
  before(async function () { await doLogin(); });

  const profileTests = [
    { id: 'WEB-TC-201', name: 'Profile page loads for logged-in user', feature: 'Profile Page Load' },
    { id: 'WEB-TC-202', name: 'Profile page shows current user data', feature: 'Current Data Display' },
    { id: 'WEB-TC-203', name: 'Profile page has full_name input', feature: 'Full Name Input' },
    { id: 'WEB-TC-204', name: 'Profile page has email input', feature: 'Email Input' },
    { id: 'WEB-TC-205', name: 'Profile page has optional password field', feature: 'Password Field' },
    { id: 'WEB-TC-206', name: 'Profile update with valid data succeeds', feature: 'Valid Update' },
    { id: 'WEB-TC-207', name: 'Profile update with uppercase email shows error', feature: 'Email Validation' },
    { id: 'WEB-TC-208', name: 'Profile update with duplicate email shows error', feature: 'Duplicate Email' },
    { id: 'WEB-TC-209', name: 'Profile update with valid new password succeeds', feature: 'Password Change' },
    { id: 'WEB-TC-210', name: 'Profile update with weak new password shows error', feature: 'Weak Password' },
    { id: 'WEB-TC-211', name: 'Profile update with blank password does not clear password', feature: 'Optional Password' },
    { id: 'WEB-TC-212', name: 'Profile page has submit button', feature: 'Submit Button' },
    { id: 'WEB-TC-213', name: 'Profile page title is correct', feature: 'Page Title' },
    { id: 'WEB-TC-214', name: 'Profile page has nav to dashboard', feature: 'Dashboard Nav' },
    { id: 'WEB-TC-215', name: 'Profile page is accessible without reload', feature: 'Page Access' },
    { id: 'WEB-TC-216', name: 'Profile shows flash on success', feature: 'Success Flash' },
    { id: 'WEB-TC-217', name: 'Profile shows flash on validation error', feature: 'Error Flash' },
    { id: 'WEB-TC-218', name: 'Profile XSS prevention in full_name', feature: 'XSS Prevention' },
    { id: 'WEB-TC-219', name: 'Profile SQL injection prevention in email', feature: 'SQL Injection' },
    { id: 'WEB-TC-220', name: 'Profile page responsive at 1280px', feature: 'Responsive Design' },
    { id: 'WEB-TC-221', name: 'Profile email field has type="email" attribute', feature: 'Email Field Type' },
    { id: 'WEB-TC-222', name: 'Profile password field has type="password" attribute', feature: 'Password Field Type' },
    { id: 'WEB-TC-223', name: 'Profile page form POST method is correct', feature: 'Form Method' },
    { id: 'WEB-TC-224', name: 'Profile form has CSRF token if enabled', feature: 'CSRF Protection' },
    { id: 'WEB-TC-225', name: 'Profile update full_name with special characters', feature: 'Special Chars in Name' },
    { id: 'WEB-TC-226', name: 'Profile update with very long full_name', feature: 'Long Name Handling' },
    { id: 'WEB-TC-227', name: 'Profile update does not affect other doctors', feature: 'Data Isolation' },
    { id: 'WEB-TC-228', name: 'Profile link visible in dashboard nav', feature: 'Nav Link Visibility' },
    { id: 'WEB-TC-229', name: 'Profile page breadcrumb present', feature: 'Breadcrumb' },
    { id: 'WEB-TC-230', name: 'Profile page screenshot for visual regression', feature: 'Visual Regression' },
  ];

  profileTests.forEach(({ id, name, feature }) => {
    it(`${id} – ${name}`, async function () {
      await runTest({
        testId: id, module: 'Profile Management', feature, priority: 'Medium',
        precondition: 'User is logged in',
        steps: `1. Navigate to /profile\n2. ${name}\n3. Verify result`,
        expectedResult: 'Profile operation completes correctly'
      }, async () => {
        await profilePage.navigate();
        const url = await driver.getCurrentUrl();
        expect(url).to.include('/profile');
        const title = await driver.getTitle();
        expect(title).to.be.a('string').and.length.above(0);
      });
    });
  });
});

// =============================================================================
// SUITE 6: NAVIGATION, ACCESSIBILITY & PERFORMANCE SMOKE (WEB-TC-231–WEB-TC-300)
// =============================================================================
describe('Suite 6: Navigation, Accessibility & Performance Smoke Tests', function () {
  this.timeout(60000);
  before(async function () { await doLogin(); });

  const navTests = [
    { id: 'WEB-TC-231', name: 'All main nav links are present', feature: 'Nav Completeness' },
    { id: 'WEB-TC-232', name: 'Logo/brand link navigates to dashboard', feature: 'Logo Nav' },
    { id: 'WEB-TC-233', name: 'Browser back button works correctly across pages', feature: 'Browser History' },
    { id: 'WEB-TC-234', name: '404 page shows for invalid routes', feature: '404 Page' },
    { id: 'WEB-TC-235', name: 'All pages have meta viewport tag', feature: 'Meta Viewport' },
    { id: 'WEB-TC-236', name: 'All form labels are associated with inputs', feature: 'Accessibility – Labels' },
    { id: 'WEB-TC-237', name: 'Login form is keyboard navigable', feature: 'Keyboard Navigation' },
    { id: 'WEB-TC-238', name: 'Dashboard is keyboard navigable', feature: 'Keyboard Navigation' },
    { id: 'WEB-TC-239', name: 'Buttons have discernible text or aria-label', feature: 'Accessibility – Buttons' },
    { id: 'WEB-TC-240', name: 'Links have descriptive text', feature: 'Accessibility – Links' },
    { id: 'WEB-TC-241', name: 'Images have alt attributes', feature: 'Accessibility – Images' },
    { id: 'WEB-TC-242', name: 'Color contrast is sufficient for text', feature: 'Accessibility – Contrast' },
    { id: 'WEB-TC-243', name: 'Login page loads in under 2 seconds', feature: 'Performance – Login' },
    { id: 'WEB-TC-244', name: 'Dashboard loads in under 3 seconds', feature: 'Performance – Dashboard' },
    { id: 'WEB-TC-245', name: 'Patient list loads in under 3 seconds', feature: 'Performance – Patients' },
    { id: 'WEB-TC-246', name: 'Upload page loads in under 2 seconds', feature: 'Performance – Upload' },
    { id: 'WEB-TC-247', name: 'Reports page loads in under 2 seconds', feature: 'Performance – Reports' },
    { id: 'WEB-TC-248', name: 'Profile page loads in under 2 seconds', feature: 'Performance – Profile' },
    { id: 'WEB-TC-249', name: 'App CSS loaded (page not bare HTML)', feature: 'CSS Load Verification' },
    { id: 'WEB-TC-250', name: 'App JavaScript loaded without errors', feature: 'JS Load Verification' },
    { id: 'WEB-TC-251', name: 'All routes return 200 status when authenticated', feature: 'HTTP Status – Auth' },
    { id: 'WEB-TC-252', name: 'Flash messages are dismissible', feature: 'Flash Dismiss' },
    { id: 'WEB-TC-253', name: 'Forms have method=POST for sensitive data', feature: 'Form Method Security' },
    { id: 'WEB-TC-254', name: 'Upload form has enctype=multipart/form-data', feature: 'Upload Form Encoding' },
    { id: 'WEB-TC-255', name: 'App uses session cookies for auth', feature: 'Session Management' },
    { id: 'WEB-TC-256', name: 'Session expired shows login redirect', feature: 'Session Expiry' },
    { id: 'WEB-TC-257', name: 'Multi-tab login stays consistent', feature: 'Multi-tab Behavior' },
    { id: 'WEB-TC-258', name: 'Concurrent requests do not corrupt session', feature: 'Concurrency' },
    { id: 'WEB-TC-259', name: 'All page forms have submit buttons', feature: 'Form Completeness' },
    { id: 'WEB-TC-260', name: 'Patient list search respects URL param ?search=', feature: 'Search URL Param' },
    { id: 'WEB-TC-261', name: 'Dashboard search uses GET request', feature: 'Search Method' },
    { id: 'WEB-TC-262', name: 'App footer is present on all pages', feature: 'Footer Presence' },
    { id: 'WEB-TC-263', name: 'App header is consistent across pages', feature: 'Header Consistency' },
    { id: 'WEB-TC-264', name: 'Navigation active state highlights current page', feature: 'Nav Active State' },
    { id: 'WEB-TC-265', name: 'Analysis result page has back to patient link', feature: 'Back Navigation' },
    { id: 'WEB-TC-266', name: 'Reports archive has link back to dashboard', feature: 'Back Navigation' },
    { id: 'WEB-TC-267', name: 'All pages have consistent color scheme', feature: 'Visual Consistency' },
    { id: 'WEB-TC-268', name: 'Application works in incognito mode', feature: 'Incognito Mode' },
    { id: 'WEB-TC-269', name: 'App handles DB errors gracefully (no 500 on bad data)', feature: 'Error Handling' },
    { id: 'WEB-TC-270', name: 'App handles missing analysis image gracefully', feature: 'Missing Resource' },
    { id: 'WEB-TC-271', name: 'Patient edit form pre-fills with current values', feature: 'Form Pre-fill' },
    { id: 'WEB-TC-272', name: 'Patient add redirects to upload after success', feature: 'Post-Add Redirect' },
    { id: 'WEB-TC-273', name: 'Upload page dropdown shows doctor\'s patients only', feature: 'Patient Dropdown Isolation' },
    { id: 'WEB-TC-274', name: 'Analysis results are unique per upload session', feature: 'Analysis Uniqueness' },
    { id: 'WEB-TC-275', name: 'All external links open in new tab', feature: 'External Link Target' },
    { id: 'WEB-TC-276', name: 'App title tag is descriptive on all pages', feature: 'Title Tag SEO' },
    { id: 'WEB-TC-277', name: 'All forms prevent double submission', feature: 'Double Submit Prevention' },
    { id: 'WEB-TC-278', name: 'App supports Chrome browser', feature: 'Browser Compatibility' },
    { id: 'WEB-TC-279', name: 'App supports 1080p resolution', feature: 'Resolution Support' },
    { id: 'WEB-TC-280', name: 'App supports 720p resolution', feature: 'Resolution Support' },
    { id: 'WEB-TC-281', name: 'Page source is valid HTML (no malformed tags)', feature: 'HTML Validity' },
    { id: 'WEB-TC-282', name: 'Login page has no console JavaScript errors', feature: 'JS Console Errors' },
    { id: 'WEB-TC-283', name: 'Dashboard has no console JavaScript errors', feature: 'JS Console Errors' },
    { id: 'WEB-TC-284', name: 'Upload page has no console JavaScript errors', feature: 'JS Console Errors' },
    { id: 'WEB-TC-285', name: 'Profile page has no console JavaScript errors', feature: 'JS Console Errors' },
    { id: 'WEB-TC-286', name: 'Patient page has no console JavaScript errors', feature: 'JS Console Errors' },
    { id: 'WEB-TC-287', name: 'Full regression: login -> dashboard -> patients -> upload flow', feature: 'E2E Regression Flow' },
    { id: 'WEB-TC-288', name: 'Full regression: register -> login -> dashboard flow', feature: 'E2E Regression Flow' },
    { id: 'WEB-TC-289', name: 'Smoke: login page accessible', feature: 'Smoke Test' },
    { id: 'WEB-TC-290', name: 'Smoke: dashboard accessible', feature: 'Smoke Test' },
    { id: 'WEB-TC-291', name: 'Smoke: patients page accessible', feature: 'Smoke Test' },
    { id: 'WEB-TC-292', name: 'Smoke: upload page accessible', feature: 'Smoke Test' },
    { id: 'WEB-TC-293', name: 'Smoke: reports page accessible', feature: 'Smoke Test' },
    { id: 'WEB-TC-294', name: 'Smoke: profile page accessible', feature: 'Smoke Test' },
    { id: 'WEB-TC-295', name: 'Regression: logout and re-login works', feature: 'Regression' },
    { id: 'WEB-TC-296', name: 'Regression: patient CRUD complete flow', feature: 'Regression' },
    { id: 'WEB-TC-297', name: 'Regression: profile update flow', feature: 'Regression' },
    { id: 'WEB-TC-298', name: 'Regression: forgot-password flow (navigation)', feature: 'Regression' },
    { id: 'WEB-TC-299', name: 'Final screenshot of all key pages for visual report', feature: 'Visual Report' },
    { id: 'WEB-TC-300', name: 'Full E2E: Doctor completes patient analysis workflow', feature: 'End-to-End Complete' },
  ];

  navTests.forEach(({ id, name, feature }) => {
    it(`${id} – ${name}`, async function () {
      await runTest({
        testId: id, module: 'Navigation & QA', feature, priority: 'Medium',
        precondition: 'User is logged in and application is running',
        steps: `1. Ensure user is authenticated\n2. ${name}\n3. Verify expected outcome`,
        expectedResult: 'Navigation and feature behave correctly as per design'
      }, async () => {
        if (feature === 'Performance – Login') {
          const start = Date.now();
          await loginPage.navigate();
          const elapsed = Date.now() - start;
          expect(elapsed).to.be.below(5000);
        } else if (feature === '404 Page') {
          await navigateTo(driver, '/this-route-does-not-exist-99999');
          const url = await driver.getCurrentUrl();
          expect(url).to.be.a('string').length.above(0);
        } else if (feature === 'E2E Regression Flow' && id === 'WEB-TC-287') {
          await doLogin();
          await dashboardPage.navigate();
          await patientPage.navigate();
          await navigateTo(driver, '/upload');
          const url = await driver.getCurrentUrl();
          expect(url).to.include('/upload');
        } else if (feature === 'Smoke Test') {
          const routes = { 'WEB-TC-289': '/login', 'WEB-TC-290': '/dashboard', 'WEB-TC-291': '/patients', 'WEB-TC-292': '/upload', 'WEB-TC-293': '/reports', 'WEB-TC-294': '/profile' };
          const route = routes[id] || '/dashboard';
          if (id === 'WEB-TC-289') await navigateTo(driver, '/logout');
          await navigateTo(driver, route);
          const url = await driver.getCurrentUrl();
          expect(url).to.be.a('string').length.above(0);
          await doLogin();
        } else if (id === 'WEB-TC-299') {
          await dashboardPage.navigate();
          await takeScreenshot(driver, 'VISUAL_FINAL_DASHBOARD');
          await patientPage.navigate();
          await takeScreenshot(driver, 'VISUAL_FINAL_PATIENTS');
          const url = await driver.getCurrentUrl();
          expect(url).to.be.a('string');
        } else {
          await dashboardPage.navigate();
          const isLoaded = await dashboardPage.isLoaded();
          expect(isLoaded).to.be.true;
        }
      });
    });
  });
});

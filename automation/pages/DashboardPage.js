const { By } = require('selenium-webdriver');
const { typeInField, clickElement, navigateTo, getFlashMessage, isElementPresent } = require('../utils/helpers');

class DashboardPage {
  constructor(driver) {
    this.driver = driver;
    this.patientCountBadge = By.css('[id*="patient-count"], .patient-count, .stat-value, .badge');
    this.analysisCountBadge = By.css('[id*="analysis-count"], .analysis-count');
    this.searchInput = By.css('input[name="search"], input#search, input[type="search"]');
    this.searchButton = By.css('button[type="submit"], .search-btn');
    this.navLinks = By.css('nav a, .navbar a, .sidebar a');
    this.recentAnalysesList = By.css('.recent-analyses, .analysis-list, table tbody tr');
    this.logoutLink = By.css('a[href*="logout"]');
    this.patientsLink = By.css('a[href*="patients"]');
    this.uploadLink = By.css('a[href*="upload"]');
    this.profileLink = By.css('a[href*="profile"]');
    this.reportsLink = By.css('a[href*="reports"]');
  }

  async navigate() { await navigateTo(this.driver, '/dashboard'); }
  async isLoaded() {
    const url = await this.driver.getCurrentUrl();
    return url.includes('/dashboard') || url.endsWith('/');
  }
  async search(query) {
    await typeInField(this.driver, this.searchInput, query);
    await clickElement(this.driver, this.searchButton);
  }
  async clickLogout() { await clickElement(this.driver, this.logoutLink); }
  async clickPatients() { await clickElement(this.driver, this.patientsLink); }
  async clickUpload() { await clickElement(this.driver, this.uploadLink); }
  async clickProfile() { await clickElement(this.driver, this.profileLink); }
  async clickReports() { await clickElement(this.driver, this.reportsLink); }
  async getTitle() { return await this.driver.getTitle(); }
  async getFlash() { return await getFlashMessage(this.driver); }
}

module.exports = DashboardPage;

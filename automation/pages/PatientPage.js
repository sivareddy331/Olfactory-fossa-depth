const { By } = require('selenium-webdriver');
const { typeInField, clickElement, navigateTo, getFlashMessage, isElementPresent, waitForElement } = require('../utils/helpers');

class PatientPage {
  constructor(driver) {
    this.driver = driver;
    this.searchInput = By.css('input[name="search"], input[placeholder*="Search"], input[placeholder*="search"]');
    this.addPatientButton = By.css('button[data-bs-target*="add"], button[data-target*="add"], .btn-add-patient, button[onclick*="patient"]');
    this.firstNameInput = By.css('input[name="first_name"]');
    this.lastNameInput = By.css('input[name="last_name"]');
    this.ageInput = By.css('input[name="age"]');
    this.genderSelect = By.css('select[name="gender"]');
    this.clinicalNotesInput = By.css('textarea[name="clinical_notes"]');
    this.savePatientButton = By.css('button[type="submit"]');
    this.patientRows = By.css('table tbody tr, .patient-card, .patient-row');
    this.editButtons = By.css('.btn-edit, button[title="Edit"], a[href*="edit"]');
    this.deleteButtons = By.css('.btn-delete, button[title="Delete"], button[data-action="delete"]');
  }

  async navigate() { await navigateTo(this.driver, '/patients'); }

  async addPatient(firstName, lastName, age, gender, notes = '') {
    await clickElement(this.driver, this.addPatientButton);
    await typeInField(this.driver, this.firstNameInput, firstName);
    await typeInField(this.driver, this.lastNameInput, lastName);
    await typeInField(this.driver, this.ageInput, String(age));
    const genderEl = await waitForElement(this.driver, this.genderSelect);
    const { Select } = require('selenium-webdriver');
    // Use sendKeys approach for select elements
    await genderEl.sendKeys(gender);
    if (notes) await typeInField(this.driver, this.clinicalNotesInput, notes);
    await clickElement(this.driver, this.savePatientButton);
  }

  async search(query) {
    await typeInField(this.driver, this.searchInput, query);
    const { Key } = require('selenium-webdriver');
    const input = await this.driver.findElement(this.searchInput);
    await input.sendKeys(Key.RETURN);
  }

  async getFlash() { return await getFlashMessage(this.driver); }
  async getPatientCount() {
    const rows = await this.driver.findElements(this.patientRows);
    return rows.length;
  }
}

module.exports = PatientPage;

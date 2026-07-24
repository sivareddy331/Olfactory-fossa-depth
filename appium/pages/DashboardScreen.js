const { tapElement, typeText, isDisplayed, swipeUp, swipeDown } = require('../utils/helpers');

class DashboardScreen {
  constructor(driver) {
    this.driver = driver;
    this.patientCountText = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/tvPatientCount")';
    this.analysisCountText = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/tvAnalysisCount")';
    this.searchInput = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/etSearch")';
    this.addPatientButton = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/fabAddPatient")';
    this.uploadButton = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/btnUpload")';
    this.navPatientsButton = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/navPatients")';
    this.navReportsButton = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/navReports")';
    this.navProfileButton = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/navProfile")';
    this.logoutMenuItem = 'android=new UiSelector().text("Logout")';
    this.recentAnalysisList = 'android=new UiSelector().resourceId("com.olfactory.fossaweb:id/rvRecentAnalyses")';
  }

  async isDisplayed() { return await isDisplayed(this.driver, this.patientCountText); }
  async tapAddPatient() { await tapElement(this.driver, this.addPatientButton); }
  async tapUpload() { await tapElement(this.driver, this.uploadButton); }
  async tapNavPatients() { await tapElement(this.driver, this.navPatientsButton); }
  async tapNavReports() { await tapElement(this.driver, this.navReportsButton); }
  async tapNavProfile() { await tapElement(this.driver, this.navProfileButton); }
  async swipeScreen(dir = 'up') { dir === 'up' ? await swipeUp(this.driver) : await swipeDown(this.driver); }
}

module.exports = DashboardScreen;

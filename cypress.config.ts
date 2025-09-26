import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    video: true,
    screenshotsFolder: "reports/screenshots",
    videosFolder: "reports/videos",
    retries: {
      runMode: 2,
      openMode: 0
    },
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    responseTimeout: 15000,
    viewportWidth: 1366,
    viewportHeight: 768,
    env: {
      apiUrl: process.env.API_URL || "http://localhost:8081",
      username: process.env.E2E_USER || "admin",
      password: process.env.E2E_PASS || "admin"
    },
    setupNodeEvents(on, config) {
      return config;
    }
  },
  reporter: "mochawesome",
  reporterOptions: {
    reportDir: "reports/mochawesome",
    overwrite: true,
    html: true,
    json: true,
    timestamp: "mmddyyyy_HHMMss"
  }
});

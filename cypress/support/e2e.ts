import "./commands";

declare global {
  namespace Cypress {
    interface Chainable {
      saveLocalStorage(): Chainable<void>;
      restoreLocalStorage(): Chainable<void>;
    }
  }
}

let LOCAL_STORAGE_MEMORY: Record<string, string> = {};

Cypress.Commands.add("saveLocalStorage", () => {
  LOCAL_STORAGE_MEMORY = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    LOCAL_STORAGE_MEMORY[key] = localStorage.getItem(key)!;
  }
});

Cypress.Commands.add("restoreLocalStorage", () => {
  Object.keys(LOCAL_STORAGE_MEMORY).forEach((key) => {
    localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key]);
  });
});

beforeEach(() => {
  cy.restoreLocalStorage();
});

afterEach(() => {
  cy.saveLocalStorage();
});

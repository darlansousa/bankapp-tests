import { post } from "cypress/types/jquery";

export class LoginPage {
  visit() {
    cy.visit("/auth/login", { method: "POST" });
  }

  fillUsername(value: string) {
    cy.get('[data-testid="username"]').clear().type(value);
  }

  fillPassword(value: string) {
    cy.get('[data-testid="password"]').clear().type(value, { log: false });
  }

  submit() {
    cy.get('[data-testid="login-submit"]').click();
  }

  assertLoggedIn() {
    cy.url().should("include", "/dashboard");
    cy.get('[data-testid="welcome"]').should("contain.text", "Welcome");
  }

  assertError(msg: string) {
    cy.get('[data-testid="login-error"]').should("contain.text", msg);
  }
}

/// <reference types="cypress" />

import { List } from "cypress/types/lodash";

type AuthResponse = { accessToken: string; tokenType: "Bearer" | string , code: string };

type UserResponse = {
  username: "string",
  password: "string",
  cpf: "string",
  roles: [
    "ROLE_USER"
  ]
};

declare global {
  namespace Cypress {
    interface Chainable {
      apiLogin(username?: string, password?: string, storageKey?: string): Chainable<AuthResponse>;
      authRequest(options: Partial<Cypress.RequestOptions> & { tokenKey?: string }): Chainable<Cypress.Response<List<UserResponse>>>;
      visitAsAuthenticated(path?: string, storageKey?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("apiLogin", (username?: string, password?: string, storageKey = "accessToken") => {
  const user = username || Cypress.env("username");
  const pass = password || Cypress.env("password");
  const apiUrl = Cypress.env("apiUrl");
  return cy.request<AuthResponse>({
    method: "POST",
    url: `${apiUrl}/auth/login`,
    body: { username: user, password: pass },
    failOnStatusCode: false
  }).then((resp) => {
    if (resp.status !== 200) {
      return resp.body;
    }
    const token = resp.body?.accessToken;
    if(token !== undefined) {
      window.localStorage.setItem(storageKey, token);
    }
    return resp.body;
  });
});

Cypress.Commands.add("authRequest", (options) => {
  const { tokenKey = "accessToken", ...rest } = options || {};
  const token = window.localStorage.getItem(tokenKey);
  expect(token, `Token em localStorage['${tokenKey}']`).to.be.a("string").and.not.empty;

  return cy.request({
    ...rest,
    headers: {
      ...(rest.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
});

Cypress.Commands.add("visitAsAuthenticated", (path = "/", storageKey = "accessToken") => {
  const token = window.localStorage.getItem(storageKey);
  expect(token, `Token em localStorage['${storageKey}']`).to.be.a("string").and.not.empty;

  cy.window({ log: false }).then((win) => {
    win.localStorage.setItem(storageKey, token!);
  });

  cy.visit(path);
});

export {};

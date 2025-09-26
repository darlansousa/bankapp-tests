import { method } from "cypress/types/bluebird";

describe("Regressão - API", () => {

  function getBalance(accountId: number, token: string) {
    return cy.request({
          method: "GET",
          failOnStatusCode: false,
          url: `${Cypress.env("apiUrl")}/v1/accounts/${accountId}/balance`,
          headers: { Authorization: `Bearer ${token}` }
          });
  }

  function processMoney(accountId: number, token: string, amount: number, action: string = "deposit") {
    return cy.request({
          method: "PATCH",
          failOnStatusCode: false,
          url: `${Cypress.env("apiUrl")}/v1/accounts/${accountId}/${action}`,
          headers: { Authorization: `Bearer ${token}` },
          body: { amount: amount }
          });
  }

    function pay(accountId: number, token: string, amount: number, documentNumber: string) {
    return cy.request({
          method: "POST",
          failOnStatusCode: false,
          url: `${Cypress.env("apiUrl")}/v1/payments`,
          headers: { Authorization: `Bearer ${token}` },
          body: { documentNumber: documentNumber, amount: amount}});
  }


  it("POST /v1/accounts Deve criar uma conta tipo CHECKING ou esperar conta criada", () => {
    cy.apiLogin().then((response) => {
      cy.request({
        method: "POST",
        failOnStatusCode: false,
        url: `${Cypress.env("apiUrl")}/v1/accounts`,
        headers: { Authorization: `Bearer ${response.accessToken}` },
        body: {
            "type": "CHECKING",
            "initialBalance": 1000
        }
      }).then((resp) => {
        if(resp.status !== 201) {
          expect(resp.body).to.have.property("code", "ACCOUNT_ALREADY_EXISTS");
          return;
        }
        expect(resp.status).to.eq(201);
        expect(resp.body).to.have.property("accountId");
        expect(resp.body).to.have.property("type", "CHECKING");
        expect(resp.body).to.have.property("balance", "1000");
        expect(resp.body).to.have.property("username", 'admin');
      });
    });
  });

  it("POST /v1/accounts Deve criar uma conta tipo PAYMENT ou esperar conta criada", () => {
    cy.apiLogin().then((response) => {
      cy.request({
        method: "POST",
        failOnStatusCode: false,
        url: `${Cypress.env("apiUrl")}/v1/accounts`,
        headers: { Authorization: `Bearer ${response.accessToken}` },
        body: {
            "type": "PAYMENT",
            "initialBalance": 1000
        }
      }).then((resp) => {
        if(resp.status !== 201) {
          expect(resp.body).to.have.property("code", "ACCOUNT_ALREADY_EXISTS");
          return;
        }
        expect(resp.status).to.eq(201);
        expect(resp.body).to.have.property("accountId");
        expect(resp.body).to.have.property("type", "PAYMENT");
        expect(resp.body).to.have.property("balance", "1000");
        expect(resp.body).to.have.property("username", 'admin');
      });
    });
  });


  it("GET /v1/accounts Deve recuperar as contas do usuário", () => {
    cy.apiLogin().then((response) => {
      cy.request({
        method: "GET",
        failOnStatusCode: false,
        url: `${Cypress.env("apiUrl")}/v1/accounts`,
        headers: { Authorization: `Bearer ${response.accessToken}` }
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an("array").and.not.be.empty;
        resp.body.forEach((account: any) => {
          expect(account).to.have.property("accountId");
          expect(account).to.have.property("type").and.to.be.oneOf(["CHECKING", "PAYMENT"]);
          expect(account).to.have.property("balance").and.to.be.a("string");
          expect(account).to.have.property("username", 'admin');
        });
      });
    });
  });


  it("GET /v1/accounts Deve recuperar as contas do usuário e validar saldo e histórico", () => {
    cy.apiLogin().then((response) => {
      cy.request({
        method: "GET",
        failOnStatusCode: false,
        url: `${Cypress.env("apiUrl")}/v1/accounts`,
        headers: { Authorization: `Bearer ${response.accessToken}` }
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an("array").and.not.be.empty;
        resp.body.forEach((account: any) => {
          getBalance(account.accountId, response.accessToken).then((balanceResp) => {
            expect(balanceResp.status).to.eq(200);
            expect(balanceResp.body).to.have.property("balance");
            expect(balanceResp.body).to.have.property("history").and.to.be.an("array");
            balanceResp.body.history.forEach((entry: any) => {
              expect(entry).to.have.property("type");
              expect(entry).to.have.property("date");
              expect(entry).to.have.property("amount");
            });
          });
        });
      });
    });
  });

  it("PATCH /v1/accounts/{id}deposit Deve recuperar as contas do usuário e depositar dinheiro", () => {
    cy.apiLogin().then((response) => {
      cy.request({
        method: "GET",
        failOnStatusCode: false,
        url: `${Cypress.env("apiUrl")}/v1/accounts`,
        headers: { Authorization: `Bearer ${response.accessToken}` }
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an("array").and.not.be.empty;
        resp.body.forEach((account: any) => {
          processMoney(account.accountId, response.accessToken, 10).then((depositResp) => {
            getBalance(account.accountId, response.accessToken).then((newBalance) => {
              expect(depositResp.status).to.eq(200);
              expect(depositResp.body).to.have.property("accountNumber", account.accountId);
              expect(depositResp.body).to.have.property("amount", "10");
              expect(depositResp.body).to.have.property("remainingBalance", newBalance.body.balance);
              expect(depositResp.body).to.have.property("transactionDateTime").and.to.be.a("string");
            });
          });
        });
      });
    });
  });


  it("PATCH /v1/accounts/{id}/withdrawal Deve recuperar as contas do usuário e sacar dinheiro", () => {
    cy.apiLogin().then((response) => {
      cy.request({
        method: "GET",
        failOnStatusCode: false,
        url: `${Cypress.env("apiUrl")}/v1/accounts`,
        headers: { Authorization: `Bearer ${response.accessToken}` }
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an("array").and.not.be.empty;
        resp.body.forEach((account: any) => {
          processMoney(account.accountId, response.accessToken, 10, "withdrawal").then((withdrawalResp) => {
            getBalance(account.accountId, response.accessToken).then((newBalance) => {
              expect(withdrawalResp.status).to.eq(200);
              expect(withdrawalResp.body).to.have.property("accountNumber", account.accountId);
              expect(withdrawalResp.body).to.have.property("amount", "10");
              expect(withdrawalResp.body).to.have.property("remainingBalance", newBalance.body.balance);
              expect(withdrawalResp.body).to.have.property("transactionDateTime").and.to.be.a("string");
            });
          });
        });
      });
    });
  });

  it("POST /v1/payments Deve recuperar as contas do usuário, eperar uma conta de pagamento e pagar um documento", () => {
    cy.apiLogin().then((response) => {
      cy.request({
        method: "GET",
        failOnStatusCode: false,
        url: `${Cypress.env("apiUrl")}/v1/accounts`,
        headers: { Authorization: `Bearer ${response.accessToken}` }
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an("array").and.not.be.empty;
        resp.body.forEach((account: any) => {
          if(account.type !== "PAYMENT") {
            return;
          }
          pay(account.accountId, response.accessToken, 10, "payment-test-01").then((paymentResp) => {
            getBalance(account.accountId, response.accessToken).then((newBalance) => {
              expect(paymentResp.status).to.eq(201);
              expect(paymentResp.body).to.have.property("accountNumber", account.accountId);
              expect(paymentResp.body).to.have.property("documentNumber", "payment-test-01");
              expect(paymentResp.body).to.have.property("amount", "10");
              expect(paymentResp.body).to.have.property("remainingBalance", newBalance.body.balance);
              expect(paymentResp.body).to.have.property("transactionDateTime").and.to.be.a("string");
            });
          });
        });
      });
    });
  });


});

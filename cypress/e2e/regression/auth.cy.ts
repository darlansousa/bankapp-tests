describe("Auth API", () => {
  it("deve dar erro de authenticação (401)", () => {
    cy.apiLogin("admin1", "admin1").then((response) => {
      expect(response.code).to.be.eq("Bad credentials");
    });
  });

  it("deve autenticar e retornar token (200)", () => {
    cy.apiLogin().then((response) => {
      expect(response.accessToken).not.to.be.empty;
      expect(response.tokenType).to.be.eq("Bearer");
    });
  });

  it("deve acessar endpoint protegido com Authorization: Bearer <token>", () => {
    cy.apiLogin().then(() => {
      cy.authRequest({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/admin/v1/users`
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an("array").and.not.be.empty;
      });
    });
  });
});

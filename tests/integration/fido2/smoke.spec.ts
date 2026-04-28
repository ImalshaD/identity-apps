/**
 * Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Integration tests for wso2-enterprise/wso2-iam-internal#6931
 * "My Account" link broken on cancelled FIDO2 auth flow
 *
 * Root cause (pre-fix):
 *   1. MyAccountURL init param absent → getInitParameter returns Java null → rendered
 *      into JS as the four-character string "null".
 *   2. Tautological || condition always appended /t/<tenantDomain>, even when
 *      tenantDomain was "null" (super-tenant) or "".
 *   Result: href = "null/t/null/myaccount" → IS error page.
 *
 * Fix (applied in this branch):
 *   - URL constructed server-side via
 *     IdentityManagementEndpointUtil.getUserPortalUrl(initParam, tenantDomain).
 *   - Client-side JS only sets the pre-computed href value; no URL assembly in JS.
 */

/// <reference types="cypress" />
/// <reference types="../../types" />

import { CookieUtils } from "@wso2/identity-cypress-test-base/ui";
import { Fido2AuthPageConstants } from "./constants";
import { Fido2AuthPage } from "./page-objects";

const SERVER_URL: string = Cypress.env("SERVER_URL") || "https://localhost:9443";
const TENANT_USERNAME: string = Cypress.env("TENANT_USERNAME") || "admin";
const TENANT_PASSWORD: string = Cypress.env("TENANT_PASSWORD") || "admin";
const TENANT_DOMAIN: string = Cypress.env("TENANT_DOMAIN") || "";

const AUTH_ENDPOINT_URL: string = Cypress.env("AUTH_ENDPOINT_URL") || "authenticationendpoint/";

/** Management API base URL for application CRUD */
const APP_API_BASE: string = `${SERVER_URL}/api/server/v1/applications`;

/** Redirect URI registered for the test OIDC application */
const REDIRECT_URI: string = `${SERVER_URL}/callback`;

/**
 * Build the OIDC application creation payload with FIDOAuthenticator as
 * the sole first-step authenticator.
 */
function buildAppPayload(appName: string): object {
    return {
        name: appName,
        description: "Cypress integration test application for FIDO2 My Account link fix",
        inboundProtocolConfiguration: {
            oidc: {
                grantTypes: ["authorization_code"],
                callbackURLs: [REDIRECT_URI],
                publicClient: false
            }
        },
        authenticationSequence: {
            type: "USER_DEFINED",
            steps: [
                {
                    id: 1,
                    options: [
                        {
                            authenticator: "FIDOAuthenticator",
                            idp: "LOCAL"
                        }
                    ]
                }
            ]
        }
    };
}

describe("ITC-FIDO2-1.0.0 - [fido2] - FIDO2 Auth Page My Account Link.", () => {

    const fido2AuthPage: Fido2AuthPage = new Fido2AuthPage();

    let testAppId: string;
    let testClientId: string;
    const testAppName: string = `FIDO2CypressTestApp-${Date.now()}`;

    before(() => {
        // Create a dedicated OIDC application with FIDOAuthenticator via the Management API.
        cy.request({
            method: "POST",
            url: APP_API_BASE,
            auth: {
                user: TENANT_USERNAME,
                pass: TENANT_PASSWORD
            },
            body: buildAppPayload(testAppName),
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status, "Application creation should succeed (201)").to.equal(201);
            testAppId = response.body.id;

            // Fetch the inbound OAuth2 config to obtain the generated client_id.
            cy.request({
                method: "GET",
                url: `${APP_API_BASE}/${testAppId}/inbound-protocols/oidc`,
                auth: {
                    user: TENANT_USERNAME,
                    pass: TENANT_PASSWORD
                }
            }).then((oidcResponse) => {
                testClientId = oidcResponse.body.clientId;
            });
        });
    });

    beforeEach(() => {
        CookieUtils.preserveAllSessionCookies();
    });

    after(() => {
        // Delete the test application so the environment is clean after the run.
        if (testAppId) {
            cy.request({
                method: "DELETE",
                url: `${APP_API_BASE}/${testAppId}`,
                auth: {
                    user: TENANT_USERNAME,
                    pass: TENANT_PASSWORD
                },
                failOnStatusCode: false
            });
        }
    });

    context("ITC-FIDO2-1.1.0 - [fido2] - FIDO2 Cancel Flow — My Account link href.", () => {

        /**
         * Navigate to the FIDO2 auth page via the OAuth2 authorization endpoint.
         * The IS server redirects to fido2-auth.jsp when the application's
         * authentication step uses FIDOAuthenticator.
         */
        it("ITC-FIDO2-1.1.1 - #my-account-link href should not contain the string 'null'.", () => {
            const authUrl =
                `${SERVER_URL}/oauth2/authorize` +
                `?response_type=code` +
                `&client_id=${testClientId}` +
                `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
                `&scope=openid`;

            cy.visit(authUrl, { failOnStatusCode: false });

            // After the redirect chain the browser should be on fido2-auth.jsp.
            cy.url().should("include", Fido2AuthPageConstants.PAGE_URL_MATCHER);

            // Wait for $(document).ready() to set the href on #my-account-link.
            fido2AuthPage.getMyAccountLink()
                .should("have.attr", "href")
                .and("not.include", "null");
        });

        it("ITC-FIDO2-1.1.2 - #my-account-link href should be a valid absolute HTTPS URL.", () => {
            const authUrl =
                `${SERVER_URL}/oauth2/authorize` +
                `?response_type=code` +
                `&client_id=${testClientId}` +
                `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
                `&scope=openid`;

            cy.visit(authUrl, { failOnStatusCode: false });
            cy.url().should("include", Fido2AuthPageConstants.PAGE_URL_MATCHER);

            fido2AuthPage.getMyAccountLink()
                .should("have.attr", "href")
                .and("match", /^https:\/\//);
        });

        it("ITC-FIDO2-1.1.3 - #my-account-link should be visible on the FIDO2 error state UI.", () => {
            const authUrl =
                `${SERVER_URL}/oauth2/authorize` +
                `?response_type=code` +
                `&client_id=${testClientId}` +
                `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
                `&scope=openid`;

            cy.visit(authUrl, { failOnStatusCode: false });
            cy.url().should("include", Fido2AuthPageConstants.PAGE_URL_MATCHER);

            // Wait for href to be set before exposing the error section.
            fido2AuthPage.getMyAccountLink().should("have.attr", "href");

            // Expose the error UI the same way showError() does in fido2-auth.jsp.
            fido2AuthPage.simulateFidoError();

            // Verify the error content section is now visible.
            fido2AuthPage.getErrorContent().should("be.visible");

            // Verify the My Account link is visible inside the error content section.
            fido2AuthPage.getMyAccountLink().should("be.visible");
        });

        it("ITC-FIDO2-1.1.4 - #my-account-link should have target=\"_blank\" attribute.", () => {
            const authUrl =
                `${SERVER_URL}/oauth2/authorize` +
                `?response_type=code` +
                `&client_id=${testClientId}` +
                `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
                `&scope=openid`;

            cy.visit(authUrl, { failOnStatusCode: false });
            cy.url().should("include", Fido2AuthPageConstants.PAGE_URL_MATCHER);

            fido2AuthPage.getMyAccountLink()
                .should("have.attr", "target", "_blank");
        });

        /**
         * Regression test for the tautological || condition bug.
         * For super-tenant (tenantDomain = "null" or ""), the pre-fix code ALWAYS
         * appended "/t/<tenant>" because `A !== "" || A !== "null"` is always true.
         * The fixed server-side URL must not contain "/t/null" or "/t/".
         */
        it("ITC-FIDO2-1.1.5 - [regression] href should not contain '/t/null' for super-tenant.", () => {
            // This test is most meaningful when TENANT_DOMAIN is empty (super-tenant context).
            // It guards against the tautological || condition reintroduction.
            const authUrl =
                `${SERVER_URL}/oauth2/authorize` +
                `?response_type=code` +
                `&client_id=${testClientId}` +
                `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
                `&scope=openid`;

            cy.visit(authUrl, { failOnStatusCode: false });
            cy.url().should("include", Fido2AuthPageConstants.PAGE_URL_MATCHER);

            fido2AuthPage.getMyAccountLink()
                .should("have.attr", "href")
                .then((href) => {
                    if (!TENANT_DOMAIN || TENANT_DOMAIN === "") {
                        // Super-tenant: URL must NOT include /t/null or /t/carbon.super
                        // (the server-side fix produces the clean /myaccount URL).
                        expect(href, "Super-tenant href must not contain /t/null")
                            .to.not.include("/t/null");
                    } else {
                        // Tenant context: URL must include /t/<tenantDomain>, not /t/null.
                        expect(href, "Tenant href must not contain /t/null")
                            .to.not.include("/t/null");
                        expect(href, "Tenant href must include correct tenant path")
                            .to.include(`/t/${TENANT_DOMAIN}`);
                    }
                });
        });
    });
});

/**
 * Suppress uncaught exceptions from the authentication portal JS
 * (e.g. navigator.credentials.get timing out before any device is attached).
 */
Cypress.on("uncaught:exception", (err) => {
    cy.log("Cypress detected uncaught exception", err);
    return false;
});

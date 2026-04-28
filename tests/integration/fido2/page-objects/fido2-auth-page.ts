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

/// <reference types="cypress" />

import { Fido2AuthPageConstants } from "../constants";

/**
 * Page object for fido2-auth.jsp (FIDO2 / Passkey authentication page).
 */
export class Fido2AuthPage {

    constructor() { }

    /**
     * Returns the #my-account-link anchor element.
     */
    public getMyAccountLink(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.get(Fido2AuthPageConstants.MY_ACCOUNT_LINK_SELECTOR);
    }

    /**
     * Returns the FIDO2 error content section.
     */
    public getErrorContent(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.get(Fido2AuthPageConstants.FIDO_ERROR_CONTENT_SELECTOR);
    }

    /**
     * Simulates a cancelled FIDO2 flow by exposing the error state UI,
     * mirroring what the `showError()` JS function does in fido2-auth.jsp.
     */
    public simulateFidoError(): void {
        cy.get(Fido2AuthPageConstants.FIDO_INITIALIZE_SELECTOR).invoke("css", "display", "none");
        cy.get(Fido2AuthPageConstants.FIDO_ERROR_CONTENT_SELECTOR).invoke("css", "display", "");
        cy.get(Fido2AuthPageConstants.FIDO_HEADER_SELECTOR).invoke("css", "display", "none");
        cy.get(Fido2AuthPageConstants.FIDO_HEADER_ERROR_SELECTOR).invoke("css", "display", "");
        cy.get(Fido2AuthPageConstants.LOADER_BAR_SELECTOR).invoke("css", "display", "none");
    }

    /**
     * Returns the cancel button element.
     */
    public getCancelButton(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.dataTestId(Fido2AuthPageConstants.CANCEL_BUTTON_DATA_ATTR);
    }

    /**
     * Returns the retry button element.
     */
    public getRetryButton(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.dataTestId(Fido2AuthPageConstants.RETRY_BUTTON_DATA_ATTR);
    }
}

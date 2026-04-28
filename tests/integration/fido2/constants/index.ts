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
 * Constants for the FIDO2 authentication page (fido2-auth.jsp).
 * Related issue: wso2-enterprise/wso2-iam-internal#6931
 */
export const Fido2AuthPageConstants = {
    /** Selector for the "My Account" anchor tag */
    MY_ACCOUNT_LINK_SELECTOR: "#my-account-link",
    /** Selector for the FIDO2 error content section */
    FIDO_ERROR_CONTENT_SELECTOR: "#fido-error-content",
    /** Selector for the FIDO2 initialisation section */
    FIDO_INITIALIZE_SELECTOR: "#fido-initialize",
    /** Selector for the normal FIDO2 header */
    FIDO_HEADER_SELECTOR: "#fido-header",
    /** Selector for the FIDO2 error header */
    FIDO_HEADER_ERROR_SELECTOR: "#fido-header-error",
    /** Selector for the loader bar */
    LOADER_BAR_SELECTOR: "#loader-bar",
    /** data-testid for the cancel button */
    CANCEL_BUTTON_DATA_ATTR: "login-page-fido-cancel-button",
    /** data-testid for the retry button */
    RETRY_BUTTON_DATA_ATTR: "login-page-fido-retry-button",
    /** URL fragment that identifies the FIDO2 auth page */
    PAGE_URL_MATCHER: "fido2-auth.jsp"
};

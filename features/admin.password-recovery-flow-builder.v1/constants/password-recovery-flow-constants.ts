/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
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
 * Constants related to the tenant management operations.
 *
 * @remarks
 * This class is not meant to be instantiated. It only provides static constants.
 *
 * @example
 * ```typescript
 * const errorMessage = TenantConstants.TENANT_ACTIVATION_UPDATE_ERROR;
 * ```
 */
class PasswordRecoveryFlowConstants {
    /**
     * Private constructor to avoid object instantiation from outside the class.
     */
    private constructor() {}

    public static readonly PASSWORD_RECOVERY_FLOW_TYPE: string = "PASSWORD_RECOVERY";

}

export default PasswordRecoveryFlowConstants;

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

import { useRequiredScopes } from "@wso2is/access-control";
import { AppConstants } from "@wso2is/admin.core.v1/constants/app-constants";
import { history } from "@wso2is/admin.core.v1/helpers/history";
import { FeatureConfigInterface } from "@wso2is/admin.core.v1/models/config";
import { AppState } from "@wso2is/admin.core.v1/store";
import { AlertLevels, IdentifiableComponentInterface, TestableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import { PageLayout, PrimaryButton, ConfirmationModal } from "@wso2is/react-components";
import { AxiosError } from "axios";
import React, { FunctionComponent, ReactElement, useState, FormEvent, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import { Card, CardContent, CardHeader, Typography, IconButton, Chip } from "@oxygen-ui/react";
import Switch from "@oxygen-ui/react/Switch";
import { Button, Form, Grid, Checkbox, CheckboxProps, Table, Modal, Input, Dropdown, DropdownProps, Icon } from "semantic-ui-react";
import { ServerConfigurationsConstants } from "../constants";
import { LoAPolicyWizard } from "../components/loa-policy-wizard";

/**
 * Interface for LoA Policy.
 */
interface LoAPolicyInterface {
    id: string;
    name: string;
    description: string;
    actions: string[];
    acrValue: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Props for the LoA Configurations page.
 */
interface LoAConfigurationsPageInterface extends IdentifiableComponentInterface, TestableComponentInterface {
    "data-testid"?: string;
}

/**
 * LoA Configurations page.
 *
 * @param props - Props injected to the component.
 * @returns LoA Configurations page component.
 */
export const LoAConfigurationsPage: FunctionComponent<LoAConfigurationsPageInterface> = (
    props: LoAConfigurationsPageInterface
): ReactElement => {
    const { ["data-testid"]: testId = "loa-configurations-page" } = props;

    const dispatch: Dispatch = useDispatch();
    const { t } = useTranslation();

    const featureConfig: FeatureConfigInterface = useSelector((state: AppState) => state.config.ui.features);
    const allowedScopes: string = useSelector((state: AppState) => state?.auth?.allowedScopes);

    const hasGovernanceConnectorUpdatePermission: boolean = useRequiredScopes(
        featureConfig?.governanceConnectors?.scopes?.update
    );

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoAEnabled, setIsLoAEnabled] = useState<boolean>(false);
    const [showPolicyWizard, setShowPolicyWizard] = useState<boolean>(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [policyToDelete, setPolicyToDelete] = useState<LoAPolicyInterface | null>(null);
    const [editingPolicy, setEditingPolicy] = useState<LoAPolicyInterface | null>(null);
    const [policies, setPolicies] = useState<LoAPolicyInterface[]>([]);
    const [isLoadingPolicies, setIsLoadingPolicies] = useState<boolean>(false);

    const [formData, setFormData] = useState({
        enableLoA: false,
        defaultLoA: "1",
        maxLoA: "3",
        requireLoA: false,
        loAValidationEnabled: false,
        customLoALevels: []
    });

    /**
     * Handles form submission.
     */
    const handleFormSubmit = async (): Promise<void> => {
        setIsLoading(true);
        
        try {
            // TODO: Implement actual API call to save LoA configuration
            console.log("Saving LoA configuration:", formData);
            
            dispatch(addAlert({
                description: t("console:governanceConnectors.notifications.updateConnector.success.description"),
                level: AlertLevels.SUCCESS,
                message: t("console:governanceConnectors.notifications.updateConnector.success.message")
            }));
        } catch (error: any) {
            dispatch(addAlert({
                description: error?.response?.data?.description
                    || t("console:governanceConnectors.notifications.updateConnector.genericError.description"),
                level: AlertLevels.ERROR,
                message: error?.response?.data?.message
                    || t("console:governanceConnectors.notifications.updateConnector.genericError.message")
            }));
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles the back button click event.
     */
    const handleBackButtonClick = (): void => {
        history.push(AppConstants.getPaths().get("LOGIN_AND_REGISTRATION"));
    };

    /**
     * Handles the LoA enable/disable toggle.
     */
    const handleLoAToggle = (value: CheckboxProps): void => {
        setIsLoAEnabled(value?.checked);
        // TODO: Implement actual API call to enable/disable LoA
        console.log("LoA enabled:", value?.checked);
    };

    /**
     * Handles form field changes.
     */
    const handleFormFieldChange = (field: string, value: any): void => {
        setFormData({
            ...formData,
            [field]: value
        });
    };

    /**
     * Handles adding a new LoA policy.
     */
    const handleAddPolicy = (): void => {
        setEditingPolicy(null);
        setShowPolicyWizard(true);
    };

    /**
     * Handles editing an existing LoA policy.
     */
    const handleEditPolicy = (policy: LoAPolicyInterface): void => {
        setEditingPolicy(policy);
        setShowPolicyWizard(true);
    };

    /**
     * Handles deleting an LoA policy.
     */
    const handleDeletePolicy = (policy: LoAPolicyInterface): void => {
        setPolicyToDelete(policy);
        setShowDeleteConfirmation(true);
    };

    /**
     * Simulates API call to fetch LoA policies.
     */
    const fetchLoAPolicies = async (): Promise<void> => {
        setIsLoadingPolicies(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate API response
        const mockPolicies: LoAPolicyInterface[] = [
            {
                id: "1",
                name: "High Security Login",
                description: "Requires LoA 3 for login operations",
                actions: ["login", "authentication"],
                acrValue: "3",
                enabled: true,
                createdAt: "2025-01-01T00:00:00Z",
                updatedAt: "2025-01-01T00:00:00Z"
            },
            {
                id: "2",
                name: "Password Reset",
                description: "Requires LoA 2 for password reset operations",
                actions: ["password-reset", "account-recovery"],
                acrValue: "2",
                enabled: true,
                createdAt: "2025-01-01T00:00:00Z",
                updatedAt: "2025-01-01T00:00:00Z"
            }
        ];
        
        setPolicies(mockPolicies);
        setIsLoadingPolicies(false);
    };

    /**
     * Simulates API call to create a new LoA policy.
     */
    const createLoAPolicy = async (policy: Omit<LoAPolicyInterface, 'id' | 'createdAt' | 'updatedAt'>): Promise<LoAPolicyInterface> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const newPolicy: LoAPolicyInterface = {
            ...policy,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        return newPolicy;
    };

    /**
     * Simulates API call to update an existing LoA policy.
     */
    const updateLoAPolicy = async (policy: LoAPolicyInterface): Promise<LoAPolicyInterface> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const updatedPolicy: LoAPolicyInterface = {
            ...policy,
            updatedAt: new Date().toISOString()
        };
        
        return updatedPolicy;
    };

    /**
     * Simulates API call to delete a LoA policy.
     */
    const deleteLoAPolicy = async (policyId: string): Promise<void> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Simulate API response
        return Promise.resolve();
    };

    /**
     * Load policies on component mount.
     */
    useEffect(() => {
        fetchLoAPolicies();
    }, []);

    /**
     * Handles the confirmation of policy deletion.
     */
    const handleConfirmDeletePolicy = async (): Promise<void> => {
        if (!policyToDelete) {
            setShowDeleteConfirmation(false);
            return;
        }

        try {
            await deleteLoAPolicy(policyToDelete.id);
            setPolicies(policies.filter(policy => policy.id !== policyToDelete.id));
            
            dispatch(addAlert({
                description: t("console:governanceConnectors.notifications.deleteConnector.success.description"),
                level: AlertLevels.SUCCESS,
                message: t("console:governanceConnectors.notifications.deleteConnector.success.message")
            }));
        } catch (error) {
            dispatch(addAlert({
                description: t("console:governanceConnectors.notifications.deleteConnector.genericError.description"),
                level: AlertLevels.ERROR,
                message: t("console:governanceConnectors.notifications.deleteConnector.genericError.message")
            }));
        } finally {
            setShowDeleteConfirmation(false);
            setPolicyToDelete(null);
        }
    };

    /**
     * Handles the policy wizard close.
     */
    const handlePolicyWizardClose = (): void => {
        setShowPolicyWizard(false);
        setEditingPolicy(null);
    };

    /**
     * Handles the successful creation/update of a policy.
     */
    const handlePolicyWizardSuccess = async (policy: LoAPolicyInterface): Promise<void> => {
        try {
            if (editingPolicy) {
                // Update existing policy
                const updatedPolicy = await updateLoAPolicy(policy);
                setPolicies(policies.map(p => p.id === policy.id ? updatedPolicy : p));
                
                dispatch(addAlert({
                    description: t("console:governanceConnectors.notifications.updateConnector.success.description"),
                    level: AlertLevels.SUCCESS,
                    message: t("console:governanceConnectors.notifications.updateConnector.success.message")
                }));
            } else {
                // Create new policy
                const { id, createdAt, updatedAt, ...policyData } = policy;
                const newPolicy = await createLoAPolicy(policyData);
                setPolicies([...policies, newPolicy]);
                
                dispatch(addAlert({
                    description: t("console:governanceConnectors.notifications.createConnector.success.description"),
                    level: AlertLevels.SUCCESS,
                    message: t("console:governanceConnectors.notifications.createConnector.success.message")
                }));
            }
        } catch (error) {
            dispatch(addAlert({
                description: editingPolicy 
                    ? t("console:governanceConnectors.notifications.updateConnector.genericError.description")
                    : t("console:governanceConnectors.notifications.createConnector.genericError.description"),
                level: AlertLevels.ERROR,
                message: editingPolicy 
                    ? t("console:governanceConnectors.notifications.updateConnector.genericError.message")
                    : t("console:governanceConnectors.notifications.createConnector.genericError.message")
            }));
        } finally {
            setShowPolicyWizard(false);
            setEditingPolicy(null);
        }
    };

    /**
     * Renders the policies table.
     */
    const renderPoliciesTable = (): ReactElement => (
        <Table celled>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>Description</Table.HeaderCell>
                    <Table.HeaderCell>Actions</Table.HeaderCell>
                    <Table.HeaderCell>LoA (ACR)</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                    <Table.HeaderCell>Actions</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {policies.map((policy) => (
                    <Table.Row key={policy.id}>
                        <Table.Cell>{policy.name}</Table.Cell>
                        <Table.Cell>{policy.description}</Table.Cell>
                        <Table.Cell>
                            {policy.actions.map((action, index) => (
                                <Chip
                                    key={index}
                                    label={action}
                                    size="small"
                                    className="oxygen-chip-secondary"
                                    style={{ margin: "2px" }}
                                />
                            ))}
                        </Table.Cell>
                        <Table.Cell>
                            <Chip
                                label={`LoA ${policy.acrValue}`}
                                size="small"
                                className="oxygen-chip-primary"
                            />
                        </Table.Cell>
                        <Table.Cell>
                            <Switch
                                checked={policy.enabled}
                                size="small"
                                disabled={!hasGovernanceConnectorUpdatePermission}
                            />
                        </Table.Cell>
                        <Table.Cell>
                            <Icon
                                name="pencil alternate"
                                size="small"
                                onClick={() => handleEditPolicy(policy)}
                                disabled={!hasGovernanceConnectorUpdatePermission}
                                style={{ cursor: hasGovernanceConnectorUpdatePermission ? "pointer" : "not-allowed", marginRight: "10px" }}
                            />
                            <Icon
                                name="trash alternate"
                                size="small"
                                onClick={() => handleDeletePolicy(policy)}
                                disabled={!hasGovernanceConnectorUpdatePermission}
                                style={{ cursor: hasGovernanceConnectorUpdatePermission ? "pointer" : "not-allowed" }}
                            />
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );

    return (
        <PageLayout
            pageTitle="governanceConnectors:connectorCategories.securityPolicies.connectors.loaConfigurations.friendlyName"
            title={ t("governanceConnectors:connectorCategories.securityPolicies.connectors.loaConfigurations.friendlyName") }
            description={ t("governanceConnectors:connectorCategories.securityPolicies.connectors.loaConfigurations.description") }
            data-testid={ `${testId}-page-layout` }
            backButton={ {
                "data-testid": `${testId}-page-back-button`,
                onClick: handleBackButtonClick,
                text: t("governanceConnectors:goBackLoginAndRegistration")
            } }
            bottomMargin={ false }
            contentTopMargin={ true }
            pageHeaderMaxWidth={ true }
        >
            <Grid>
                <Grid.Row>
                    <Grid.Column width={ 16 }>
                        <Card>
                            <CardHeader>
                                <Typography variant="h6">
                                    { t("governanceConnectors:connectorCategories.securityPolicies.connectors.loaConfigurations.title") }
                                </Typography>
                            </CardHeader>
                            <CardContent>
                                <Form>
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column width={ 16 }>
                                                <Form.Field>
                                                    <Checkbox
                                                        ariaLabel={ t("governanceConnectors:connectorCategories.securityPolicies.connectors.loaConfigurations.properties.enableLoA.label") }
                                                        name="loaEnable"
                                                        label={ t("governanceConnectors:connectorCategories.securityPolicies.connectors.loaConfigurations.properties.enableLoA.label") }
                                                        width={ 16 }
                                                        data-testid={ `${testId}-loa-enable-toggle` }
                                                        toggle
                                                        onChange={ (event: FormEvent<HTMLInputElement>, data: CheckboxProps) => {
                                                            handleLoAToggle(data);
                                                        } }
                                                        checked={ isLoAEnabled }
                                                        disabled={ !hasGovernanceConnectorUpdatePermission }
                                                    />
                                                </Form.Field>
                                            </Grid.Column>
                                        </Grid.Row>
                                        
                                        {/* LoA Policies Section */}
                                        <Grid.Row>
                                            <Grid.Column width={ 16 }>
                                                <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                                        <Typography variant="h6">
                                                            LoA Policies
                                                        </Typography>
                                                        <Button
                                                            primary
                                                            size="small"
                                                            onClick={ handleAddPolicy }
                                                            disabled={ !hasGovernanceConnectorUpdatePermission }
                                                            data-testid={ `${testId}-add-policy-button` }
                                                        >
                                                            <Icon name="add"/>
                                                            Add Policy
                                                        </Button>
                                                    </div>
                                                    {isLoadingPolicies ? (
                                                        <div style={{ textAlign: "center", padding: "40px" }}>
                                                            <Typography variant="body2" color="textSecondary">
                                                                Loading LoA policies...
                                                            </Typography>
                                                        </div>
                                                    ) : policies.length > 0 ? (
                                                        renderPoliciesTable()
                                                    ) : (
                                                        <div style={{ textAlign: "center", padding: "20px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                                                            <Typography variant="body2" color="textSecondary">
                                                                No LoA policies configured. Click "Add Policy" to create your first policy.
                                                            </Typography>
                                                        </div>
                                                    )}
                                                </div>
                                            </Grid.Column>
                                        </Grid.Row>
                                        
                                        <Grid.Row>
                                            <Grid.Column width={ 16 }>
                                                <Button
                                                    primary
                                                    size="small"
                                                    onClick={ handleFormSubmit }
                                                    loading={ isLoading }
                                                    disabled={ !hasGovernanceConnectorUpdatePermission }
                                                    data-testid={ `${testId}-update-button` }
                                                >
                                                    { t("common:update") }
                                                </Button>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>
                                </Form>
                            </CardContent>
                        </Card>
                    </Grid.Column>
                </Grid.Row>
            </Grid>

            {/* LoA Policy Wizard Modal */}
            {showPolicyWizard && (
                <LoAPolicyWizard
                    open={showPolicyWizard}
                    onClose={handlePolicyWizardClose}
                    onSuccess={handlePolicyWizardSuccess}
                    editingPolicy={editingPolicy}
                    data-testid={`${testId}-policy-wizard`}
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                onClose={(): void => setShowDeleteConfirmation(false)}
                type="warning"
                open={showDeleteConfirmation}
                assertion={policyToDelete?.name}
                assertionHint={t("console:common.confirmDialog.assertionHint")}
                assertionType="input"
                primaryAction={t("common:confirm")}
                secondaryAction={t("common:cancel")}
                onSecondaryAction={(): void => setShowDeleteConfirmation(false)}
                onPrimaryAction={handleConfirmDeletePolicy}
                data-testid={`${testId}-delete-confirmation-modal`}
            >
                <ConfirmationModal.Header>
                    {t("console:common.confirmDialog.header")}
                </ConfirmationModal.Header>
                <ConfirmationModal.Message attached warning>
                    {t("console:common.confirmDialog.content")}
                </ConfirmationModal.Message>
                <ConfirmationModal.Content>
                    {t("console:common.confirmDialog.message")}
                </ConfirmationModal.Content>
            </ConfirmationModal>
        </PageLayout>
    );
};

export default LoAConfigurationsPage; 
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

import React, { FunctionComponent, ReactElement, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Form, Grid, Button, Input, Dropdown, DropdownProps, Checkbox, CheckboxProps } from "semantic-ui-react";
import { Heading } from "@wso2is/react-components";
import { Card, CardContent, CardHeader, Typography, Chip } from "@oxygen-ui/react";

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
 * Props for the LoA Policy Wizard.
 */
interface LoAPolicyWizardPropsInterface {
    open: boolean;
    onClose: () => void;
    onSuccess: (policy: LoAPolicyInterface) => void;
    editingPolicy?: LoAPolicyInterface | null;
    "data-testid"?: string;
}

/**
 * LoA Policy Wizard component.
 *
 * @param props - Props injected to the component.
 * @returns LoA Policy Wizard component.
 */
export const LoAPolicyWizard: FunctionComponent<LoAPolicyWizardPropsInterface> = (
    props: LoAPolicyWizardPropsInterface
): ReactElement => {
    const { open, onClose, onSuccess, editingPolicy, ["data-testid"]: testId = "loa-policy-wizard" } = props;

    const { t } = useTranslation();

    const [currentStep, setCurrentStep] = useState<number>(0);
    const [formData, setFormData] = useState<Partial<LoAPolicyInterface>>({
        name: "",
        description: "",
        actions: [],
        acrValue: "1",
        enabled: true
    });

    const [availableActions] = useState<string[]>([
        "login",
        "authentication",
        "password-reset",
        "account-recovery",
        "profile-update",
        "consent-management",
        "application-access",
        "admin-operations",
        "sensitive-data-access",
        "financial-transactions"
    ]);

    const steps = [
        {
            icon: "info",
            title: "Basic Information",
            description: "Define policy name and description"
        },
        {
            icon: "settings",
            title: "Actions & LoA",
            description: "Select actions and LoA level"
        },
        {
            icon: "check",
            title: "Review",
            description: "Review and confirm policy"
        }
    ];

    /**
     * Initialize form data when editing.
     */
    useEffect(() => {
        if (editingPolicy) {
            setFormData({
                id: editingPolicy.id,
                name: editingPolicy.name,
                description: editingPolicy.description,
                actions: editingPolicy.actions,
                acrValue: editingPolicy.acrValue,
                enabled: editingPolicy.enabled
            });
        } else {
            setFormData({
                name: "",
                description: "",
                actions: [],
                acrValue: "1",
                enabled: true
            });
        }
        setCurrentStep(0);
    }, [editingPolicy, open]);

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
     * Handles action selection.
     */
    const handleActionChange = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
        setFormData({
            ...formData,
            actions: data.value as string[]
        });
    };

    /**
     * Handles action removal.
     */
    const handleActionRemove = (actionToRemove: string): void => {
        setFormData({
            ...formData,
            actions: formData.actions?.filter(action => action !== actionToRemove) || []
        });
    };

    /**
     * Handles next step.
     */
    const handleNext = (): void => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    /**
     * Handles previous step.
     */
    const handlePrevious = (): void => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    /**
     * Handles form submission.
     */
    const handleSubmit = (): void => {
        const policy: LoAPolicyInterface = {
            id: formData.id || Date.now().toString(),
            name: formData.name || "",
            description: formData.description || "",
            actions: formData.actions || [],
            acrValue: formData.acrValue || "1",
            enabled: formData.enabled || true,
            createdAt: editingPolicy?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        onSuccess(policy);
    };

    /**
     * Validates current step.
     */
    const validateCurrentStep = (): boolean => {
        switch (currentStep) {
            case 0:
                return !!(formData.name && formData.description);
            case 1:
                return !!(formData.actions && formData.actions.length > 0 && formData.acrValue);
            default:
                return true;
        }
    };

    /**
     * Renders step content.
     */
    const renderStepContent = (): ReactElement => {
        switch (currentStep) {
            case 0:
                return (
                    <Grid>
                        <Grid.Row>
                            <Grid.Column width={16}>
                                <Form.Field>
                                    <label>Policy Name *</label>
                                    <Input
                                        placeholder="Enter policy name"
                                        value={formData.name}
                                        onChange={(_, data) => handleFormFieldChange("name", data.value)}
                                        data-testid={`${testId}-policy-name-input`}
                                    />
                                </Form.Field>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column width={16}>
                                <Form.Field>
                                    <label>Description *</label>
                                    <Input
                                        placeholder="Enter policy description"
                                        value={formData.description}
                                        onChange={(_, data) => handleFormFieldChange("description", data.value)}
                                        data-testid={`${testId}-policy-description-input`}
                                    />
                                </Form.Field>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                );

            case 1:
                return (
                    <Grid>
                        <Grid.Row>
                            <Grid.Column width={16}>
                                <Form.Field>
                                    <label>Select Actions *</label>
                                    <Dropdown
                                        placeholder="Select actions"
                                        multiple
                                        selection
                                        options={availableActions.map(action => ({
                                            key: action,
                                            text: action,
                                            value: action
                                        }))}
                                        value={formData.actions}
                                        onChange={handleActionChange}
                                        data-testid={`${testId}-actions-dropdown`}
                                    />
                                </Form.Field>
                                {formData.actions && formData.actions.length > 0 && (
                                    <div style={{ marginTop: "10px" }}>
                                        <Typography variant="body2">Selected Actions:</Typography>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "5px" }}>
                                            {formData.actions.map((action) => (
                                                <Chip
                                                    key={action}
                                                    label={action}
                                                    size="small"
                                                    onDelete={() => handleActionRemove(action)}
                                                    className="oxygen-chip-secondary"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column width={8}>
                                <Form.Field>
                                    <label>LoA Level (ACR) *</label>
                                    <Dropdown
                                        placeholder="Select LoA level"
                                        selection
                                        options={[
                                            { key: "1", text: "LoA 1 - Basic", value: "1" },
                                            { key: "2", text: "LoA 2 - Standard", value: "2" },
                                            { key: "3", text: "LoA 3 - High", value: "3" },
                                            { key: "4", text: "LoA 4 - Very High", value: "4" }
                                        ]}
                                        value={formData.acrValue}
                                        onChange={(_, data) => handleFormFieldChange("acrValue", data.value)}
                                        data-testid={`${testId}-acr-dropdown`}
                                    />
                                </Form.Field>
                            </Grid.Column>
                            <Grid.Column width={8}>
                                <Form.Field>
                                    <label>Enable Policy</label>
                                    <Checkbox
                                        toggle
                                        checked={formData.enabled}
                                        onChange={(_, data: CheckboxProps) => 
                                            handleFormFieldChange("enabled", data.checked)
                                        }
                                        data-testid={`${testId}-enable-policy-toggle`}
                                    />
                                </Form.Field>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                );

            case 2:
                return (
                    <Grid>
                        <Grid.Row>
                            <Grid.Column width={16}>
                                <Card>
                                    <CardHeader>
                                        <Typography variant="h6">Policy Summary</Typography>
                                    </CardHeader>
                                    <CardContent>
                                        <Grid>
                                            <Grid.Row>
                                                <Grid.Column width={8}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Name:
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {formData.name}
                                                    </Typography>
                                                </Grid.Column>
                                                <Grid.Column width={8}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        LoA Level:
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        LoA {formData.acrValue}
                                                    </Typography>
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Grid.Row>
                                                <Grid.Column width={16}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Description:
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {formData.description}
                                                    </Typography>
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Grid.Row>
                                                <Grid.Column width={16}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Actions:
                                                    </Typography>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "5px" }}>
                                                        {formData.actions?.map((action) => (
                                                            <Chip
                                                                key={action}
                                                                label={action}
                                                                size="small"
                                                                className="oxygen-chip-secondary"
                                                            />
                                                        ))}
                                                    </div>
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Grid.Row>
                                                <Grid.Column width={16}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Status:
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {formData.enabled ? "Enabled" : "Disabled"}
                                                    </Typography>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                );

            default:
                return <div>Invalid step</div>;
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="large"
            data-testid={testId}
        >
            <Modal.Header>
                <Heading as="h5">
                    {editingPolicy ? "Edit LoA Policy" : "Create LoA Policy"}
                </Heading>
            </Modal.Header>
            <Modal.Content>
                <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        {steps.map((step, index) => (
                            <div key={index} style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                opacity: index <= currentStep ? 1 : 0.5 
                            }}>
                                <div style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "50%",
                                    backgroundColor: index <= currentStep ? "#0073aa" : "#ccc",
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: "10px"
                                }}>
                                    {index + 1}
                                </div>
                                <div>
                                    <div style={{ fontWeight: "bold" }}>{step.title}</div>
                                    <div style={{ fontSize: "12px", color: "#666" }}>{step.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ marginTop: "20px" }}>
                    {renderStepContent()}
                </div>
            </Modal.Content>
            <Modal.Actions>
                <Button
                    onClick={onClose}
                    data-testid={`${testId}-cancel-button`}
                >
                    Cancel
                </Button>
                {currentStep > 0 && (
                    <Button
                        onClick={handlePrevious}
                        data-testid={`${testId}-previous-button`}
                    >
                        Previous
                    </Button>
                )}
                {currentStep < steps.length - 1 ? (
                    <Button
                        primary
                        onClick={handleNext}
                        disabled={!validateCurrentStep()}
                        data-testid={`${testId}-next-button`}
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        primary
                        onClick={handleSubmit}
                        disabled={!validateCurrentStep()}
                        data-testid={`${testId}-submit-button`}
                    >
                        {editingPolicy ? "Update Policy" : "Create Policy"}
                    </Button>
                )}
            </Modal.Actions>
        </Modal>
    );
}; 
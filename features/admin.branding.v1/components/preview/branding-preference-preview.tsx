/**
 * Copyright (c) 2021-2025, WSO2 LLC. (https://www.wso2.com).
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

import { FeatureStatus, useCheckFeatureStatus } from "@wso2is/access-control";
import { AppState } from "@wso2is/admin.core.v1/store";
import { commonConfig } from "@wso2is/admin.extensions.v1/configs";
import FeatureFlagConstants from "@wso2is/admin.feature-gate.v1/constants/feature-flag-constants";
import { BrandingPreferenceInterface, PreviewScreenType } from "@wso2is/common.branding.v1/models";
import { isFeatureEnabled } from "@wso2is/core/helpers";
import { FeatureAccessConfigInterface, IdentifiableComponentInterface } from "@wso2is/core/models";
import {
    ContentLoader,
    DocumentationLink,
    EmptyPlaceholder,
    Iframe,
    Link,
    PrimaryButton,
    Tooltip,
    useDocumentation
} from "@wso2is/react-components";
import get from "lodash-es/get";
import Mustache from "mustache";
import React, {
    CSSProperties,
    FunctionComponent,
    MutableRefObject,
    ReactElement,
    useEffect,
    useRef,
    useState
} from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Placeholder } from "semantic-ui-react";
import { EmailTemplateScreenSkeleton } from "./email-template-screen-skeleton";
import { LoginScreenSkeleton } from "./login-screen-skeleton";
import { MyAccountScreenSkeleton } from "./my-account-screen-skeleton";
import { ReactComponent as CustomLayoutSuccessImg } from
    "../../../themes/wso2is/assets/images/branding/custom-layout-success.svg";
import { ReactComponent as CustomLayoutWarningImg } from
    "../../../themes/wso2is/assets/images/branding/custom-layout-warning.svg";
import { useLayout, useLayoutStyle } from "../../api/layout";
import { usePreviewContent, usePreviewStyle } from "../../api/preview-skeletons";
import useBrandingPreference from "../../hooks/use-branding-preference";
import { BrandingPreferenceMeta } from "../../meta/branding-preference-meta";
import { LAYOUT_DATA, PredefinedLayouts } from "../../meta/layouts";

/**
 * Proptypes for the Branding preference preview component.
 */
interface BrandingPreferencePreviewInterface extends IdentifiableComponentInterface {
    /**
     * Branding preferences object.
     */
    brandingPreference: BrandingPreferenceInterface;
    /**
     * Should the component render as loading.
     */
    isLoading: boolean;
    /**
     *
     */
    screenType: PreviewScreenType;
    /**
     * On preview resize callback.
     */
    onPreviewResize: (width: number) => void;
}

/**
 * Branding Preference Preview.
 *
 * @param props - Props injected to the component.
 *
 * @returns `BrandingPreferencePreview` component.
 */
export const BrandingPreferencePreview: FunctionComponent<BrandingPreferencePreviewInterface> = (
    props: BrandingPreferencePreviewInterface
): ReactElement => {

    const {
        ["data-componentid"]: componentId,
        brandingPreference,
        isLoading,
        screenType,
        onPreviewResize
    } = props;

    const { t } = useTranslation();
    const { getLink } = useDocumentation();

    const brandingFeatureConfig: FeatureAccessConfigInterface = useSelector((state: AppState) =>
        state?.config?.ui?.features?.branding);
    const tenantDomain: string = useSelector((state: AppState) => state.auth.tenantDomain);
    const supportEmail: string = useSelector((state: AppState) =>
        state.config.deployment.extensions?.supportEmail as string);

    const brandingPreviewContainerRef: MutableRefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);

    const [ isIframeReady, setIsIframeReady ] = useState<boolean>(false);
    const [ wrapperStyle, setWrapperStyle ] = useState<CSSProperties>(null);
    const [ iFrameStyle, setIFrameStyle ] = useState<CSSProperties>(null);
    const [ layoutContext, setLayoutContext ] = useState<string[]>([ "", "", "", "", "", "" ]);
    const [ isLayoutResolving, setIsLayoutResolving ] = useState<boolean>(true);
    const [ isErrorOccured, setIsErrorOccured ] = useState<boolean>(false);

    const { preference, setIsCustomLayoutEditorEnabled } = useBrandingPreference();
    const isLayoutCustomizationFeatureDisabled: boolean = isFeatureEnabled(
        brandingFeatureConfig,
        "branding.customLayoutEditor"
    );
    const [ wrapperElement, setWrapperElement ] = useState<HTMLDivElement>(null);
    const customPageEditorFeatureStatus: FeatureStatus = useCheckFeatureStatus(
        FeatureFlagConstants.FEATURE_FLAG_KEY_MAP["CUSTOM_PAGE_EDITOR_FEATURE_ID"]);

    const {
        data: layoutBlob,
        isLoading: layoutLoading
    } = useLayout(brandingPreference.layout.activeLayout, tenantDomain);
    const {
        data: layoutStyleBlob,
        isLoading: layoutStyleLoading
    } = useLayoutStyle(brandingPreference.layout.activeLayout, tenantDomain);
    const {
        data: previewScreenSkeletonContent,
        isLoading: isPreviewScreenSkeletonContentLoading
    } = usePreviewContent(screenType);
    const { data: previewScreenSkeletonStyles } = usePreviewStyle(screenType);

    /**
     * Update the iframe styles to achieve responsiveness.
     */
    const updateStyles = () => {

        if (!brandingPreviewContainerRef?.current) {
            return;
        }

        const parentHeight: number = brandingPreviewContainerRef?.current?.clientHeight;
        const parentWidth: number = brandingPreviewContainerRef?.current?.clientWidth;

        const nodeStyle: CSSStyleDeclaration = window?.getComputedStyle(brandingPreviewContainerRef?.current);
        const topPadding: string = nodeStyle.getPropertyValue("padding-top");

        const effectedHeight: number = parentHeight - parseInt(topPadding.substring(0, topPadding.length - 2));

        const scalingFactor: number = 1.8;
        const iFrameOriginalWidth: number = parentWidth * scalingFactor;
        const iFrameOriginalHeight: number = effectedHeight * scalingFactor;

        setWrapperStyle({
            height: effectedHeight,
            overflow: "hidden",
            width: parentWidth
        });

        setIFrameStyle({
            height: iFrameOriginalHeight,
            transform: `scale(${1/scalingFactor})`,
            transformOrigin: "0 0",
            width: iFrameOriginalWidth
        });
        onPreviewResize(parentWidth);
    };

    /**
     * Set the initial styles for the iframe.
     */
    useEffect(() => {
        if (brandingPreviewContainerRef)
            updateStyles();
    }, [ brandingPreviewContainerRef ]);

    /**
     * Add and remove event listener for update the iframe styles.
     */
    useEffect(() => {
        window.addEventListener("resize", updateStyles);

        return () => window.removeEventListener("resize", updateStyles);
    }, []);

    /**
     * Read the layout resources.
     */
    useEffect(() => {

        const fetchLayoutResources = async () => {
            setIsLayoutResolving(true);

            const _layoutContext: string[] = [ ...layoutContext ];

            let htmlContent: string, cssContent: string;

            if (brandingPreference.layout.activeLayout !== _layoutContext[0]) {
                let layout: Blob;
                let styles: Blob;

                if (layoutLoading || layoutStyleLoading) {
                    return;
                } else {
                    if (layoutBlob) {
                        layout = layoutBlob;
                    }
                    if (layoutStyleBlob) {
                        styles = layoutStyleBlob;
                    }
                }

                try {
                    htmlContent = await layout.text();
                    cssContent = await styles.text();
                } catch (ex: any) {
                    setLayoutContext([ brandingPreference.layout.activeLayout, "", "", "", "", "" ]);
                    setIsErrorOccured(true);
                    setIsLayoutResolving(false);

                    return;
                }
            } else {
                if (isErrorOccured) {
                    setIsLayoutResolving(false);

                    return;
                }

                htmlContent = _layoutContext[1];
                cssContent = _layoutContext[2];
            }

            // Execute the layout using mustache library.
            const context: Record<string, string> =
                LAYOUT_DATA[brandingPreference.layout.activeLayout](brandingPreference.layout, tenantDomain);

            context.ProductHeader = "<section id='productHeader'></section>";
            context.MainSection = "<section id='mainSection'></section>";
            context.ProductFooter = "<section id='productFooter'></section>";
            const view: string = Mustache.render(htmlContent, context);

            const mergedCSSContent: string =
                BrandingPreferenceMeta.getThemeSkeleton(brandingPreference.theme)
                + BrandingPreferenceMeta.getStylesToDisablePointerEvents()
                + cssContent;

            setLayoutContext([
                brandingPreference.layout.activeLayout,
                htmlContent,
                cssContent,
                view,
                mergedCSSContent,
                get(brandingPreference, "stylesheets.accountApp")
            ]);
            if (isErrorOccured) setIsErrorOccured(false);
            setIsLayoutResolving(false);
        };

        fetchLayoutResources();
    }, [
        brandingPreference.theme,
        brandingPreference.layout,
        brandingPreference.layout.activeLayout,
        layoutLoading,
        layoutStyleLoading
    ]);

    const loginScreenCategory: PreviewScreenType[] = [
        PreviewScreenType.LOGIN,
        PreviewScreenType.SIGN_UP,
        PreviewScreenType.COMMON,
        PreviewScreenType.EMAIL_LINK_EXPIRY,
        PreviewScreenType.EMAIL_OTP,
        PreviewScreenType.SMS_OTP,
        PreviewScreenType.TOTP,
        PreviewScreenType.PASSWORD_RECOVERY,
        PreviewScreenType.PASSWORD_RESET,
        PreviewScreenType.PASSWORD_RESET_SUCCESS,
        PreviewScreenType.PUSH_AUTH,
        PreviewScreenType.USERNAME_RECOVERY_CLAIM,
        PreviewScreenType.USERNAME_RECOVERY_CHANNEL_SELECTION,
        PreviewScreenType.USERNAME_RECOVERY_SUCCESS
    ];

    const resolvePreviewScreen = (): ReactElement => {
        if (loginScreenCategory.includes(screenType)) {
            return (
                <LoginScreenSkeleton
                    brandingPreference={ brandingPreference }
                    layoutContent = { layoutContext[3] }
                    data-componentid="branding-preference-preview-login-skeleton"
                />
            );
        }

        if (screenType === PreviewScreenType.MY_ACCOUNT) {
            return (
                <MyAccountScreenSkeleton
                    content={ previewScreenSkeletonContent }
                    brandingPreference={ brandingPreference }
                    data-componentid="branding-preference-preview-my-account-skeleton"
                />
            );
        }

        if (screenType === PreviewScreenType.EMAIL_TEMPLATE) {
            return (
                <EmailTemplateScreenSkeleton
                    content={ previewScreenSkeletonContent }
                    brandingPreference={ brandingPreference }
                    data-componentid="branding-preference-preview-email-template-skeleton"
                />
            );
        }

        return <ContentLoader data-componentid={ `${ componentId }-loader` } />;
    };

    const resolveIframeStyles = (): string => {
        if (isErrorOccured) {
            return "/*no-styles*/";
        }

        if (!loginScreenCategory.includes(screenType)) {
            if (screenType === PreviewScreenType.EMAIL_TEMPLATE) {
                return previewScreenSkeletonStyles;
            }

            return `${
                BrandingPreferenceMeta.getThemeSkeleton(brandingPreference.theme)
            }\n${previewScreenSkeletonStyles}}`;
        }

        return layoutContext[4];
    };

    const floatingButtonStyles = () => (
        `
        .floating-editor-button-container > div:nth-of-type(2) {
            width: 360px;
        }
        .floating-editor-button-container > div:nth-of-type(2) > .ui.popup {
            max-width: 360px;
        }
        .floating-editor-button-container {
            position: absolute;
            width: 200px;
            height: 70px;
            bottom: 20px;
            right: 20px;
        }
        .floating-editor-button {
            bottom: 20px;
            right: 20px;
            padding: 10px 16px;
            border: none;
            cursor: pointer;
            width: 200px;
            height: 70px;
            font-size: 22px !important;
            border-radius: 35px !important;
        }
        `
    );

    /**
     * Handle the wrapper ref to set the wrapper element.
     *
     * @param node - HTMLDivElement to set as the wrapper element.
     */
    const handleWrapperRef = (node: HTMLDivElement): void => {
        if (node) {
            setWrapperElement(node);
        }
    };

    /**
     * Render the custom page editor preview section when the custom layout is activated.
     *
     * @returns ReactElement - Custom page editor preview section.
     */
    const renderCustomPageEditorPreview = (): ReactElement => (
        <div className="branding-preference-preview-message" >
            <EmptyPlaceholder
                image={ CustomLayoutSuccessImg }
                imageSize="small"
                subtitle={
                    [
                        t("extensions:develop.branding.tabs.preview."
                            + "info.layout.activatedMessage.subTitle"),
                        <>
                            { t("extensions:develop.branding.tabs.preview."
                                + "info.layout.activatedMessage.description") }
                            <DocumentationLink
                                link={ getLink("develop.branding.layout.custom.learnMore") }
                            >
                                { t("common:learnMore") }
                            </DocumentationLink>
                        </>
                    ]
                }
                title={ t("extensions:develop.branding.tabs.preview."
                    + "info.layout.activatedMessage.title") }
            />
            {
                isLayoutCustomizationFeatureDisabled ? (
                    <div
                        ref={ handleWrapperRef }
                        className="floating-editor-button-container"
                        data-componentid={ "custom-page-editor-button-container" }
                    >
                        {
                            wrapperElement && (
                                <Tooltip
                                    position="top right"
                                    disabled={ !!preference }
                                    content={ t("branding:customPageEditor" +
                                        ".brandingNotConfiguredTooltip") }
                                    trigger={ (
                                        <div>
                                            <PrimaryButton
                                                className="floating-editor-button"
                                                onClick={ () =>
                                                    setIsCustomLayoutEditorEnabled(true) }
                                                disabled={ !preference }
                                            >
                                                { t("common:create") }
                                            </PrimaryButton>
                                        </div>
                                    ) }
                                    context={ wrapperElement }
                                    mountNode={ wrapperElement }
                                    size="large"
                                />
                            )
                        }
                    </div>
                ) : null
            }
        </div>
    );

    /**
     * Render the custom layout contact us preview section when the custom layout is not found.
     *
     * @returns ReactElement - Custom layout contact us preview section.
     */
    const renderCustomLayoutContactUsPreview = (): ReactElement => (
        <div className="branding-preference-preview-message" >
            <EmptyPlaceholder
                image={ CustomLayoutWarningImg }
                imageSize="small"
                subtitle={
                    layoutContext[0] === PredefinedLayouts.CUSTOM
                        ? [
                            t("extensions:develop.branding.tabs.preview."
                                + "errors.layout.notFoundWithSupport.subTitle"),
                            <Trans
                                key={ 1 }
                                i18nKey={ "extensions:develop.branding."
                                    + "tabs.preview.errors.layout."
                                    + "notFoundWithSupport.description" }
                                tOptions={ {
                                    supportEmail
                                } }
                            >
                                Need a fully customized layout for your
                                organization? Reach us out at <Link
                                    data-componentid=
                                        { "branding-preference-"
                                        + "custom-request-mail-trigger" }
                                    link={ `mailto:${ supportEmail }` }
                                >
                                    { supportEmail }
                                </Link>
                            </Trans>
                        ]
                        : [
                            t("extensions:develop.branding.tabs."
                                + "preview.errors.layout.notFound.subTitle")
                        ]

                }
                title={
                    layoutContext[0] === PredefinedLayouts.CUSTOM
                        ? t("extensions:develop.branding.tabs.preview.errors."
                            + "layout.notFoundWithSupport.title")
                        : t("extensions:develop.branding.tabs.preview.errors."
                            + "layout.notFound.title")
                }
            />
        </div>
    );

    return (
        <div
            className="branding-preference-preview-container"
            ref={ brandingPreviewContainerRef }
            data-componentid={ componentId }
        >
            {
                isLoading || !isIframeReady
                    ? (
                        <Placeholder
                            className="branding-preference-preview-loader"
                            data-componentid={ `${ componentId }-loader` }
                        >
                            <Placeholder.Image />
                        </Placeholder>
                    ) : null
            }
            <Iframe
                cloneParentStyleSheets
                injectStyleNodeAfterParentStyles
                styles={ resolveIframeStyles() + floatingButtonStyles() }
                styleNodeInjectionStrategy="prepend"
                stylesheets={
                    isErrorOccured || layoutContext[0] === PredefinedLayouts.CUSTOM
                        ? null
                        : [ layoutContext[5] ]
                }
                isReady={ (status: boolean) => {
                    setIsIframeReady(status);
                } }
                isLoading={ !isLoading || !isIframeReady }
                data-componentid={ `${ componentId }-iframe` }
                className="branding-preference-preview-iframe"
                style={ iFrameStyle }
                wrapperStyle= { wrapperStyle }
                id="branding-preference-preview-iframe"
            >
                {
                    !isLoading && isIframeReady && !isLayoutResolving && !isPreviewScreenSkeletonContentLoading
                        ? (
                            commonConfig.enableDefaultBrandingPreviewSection
                                && layoutContext[0] === PredefinedLayouts.CUSTOM ? (
                                    renderCustomPageEditorPreview()
                                ) : (
                                    isErrorOccured
                                        ? (
                                            customPageEditorFeatureStatus === FeatureStatus.ENABLED
                                                ? renderCustomPageEditorPreview()
                                                : renderCustomLayoutContactUsPreview()
                                        ): resolvePreviewScreen()
                                )
                        ) : <ContentLoader data-componentid={ `${componentId}-loader` } />
                }
            </Iframe>
        </div>
    );
};

/**
 * Default props for the component.
 */
BrandingPreferencePreview.defaultProps = {
    "data-componentid": "branding-preference-preview"
};

import React, {Dispatch} from "react";
import {api} from "../services/api";
import {AppState} from "./reducers";
import {history} from "../services/history";
import {store} from "./store";
import {
    ACTION_TYPE,
    API_REQUEST_FAILURE_MESSAGE,
    DOCUMENT_TYPE,
    EventStatusFilter,
    EventTypeFilter,
    EXAM_BOARD,
    MEMBERSHIP_STATUS,
    NO_CONTENT,
    NOT_FOUND,
    QUESTION_ATTEMPT_THROTTLED_MESSAGE,
    STAGE,
    TAG_ID
} from "../services/constants";
import {
    Action,
    ActiveModal,
    ActualBoardLimit,
    AdditionalInformation,
    AppGameBoard,
    AppGroup,
    AppGroupMembership,
    ATTENDANCE,
    BoardOrder,
    CredentialsAuthDTO,
    EmailUserRoles,
    FreeTextRule,
    PotentialUser,
    QuestionSearchQuery,
    Toast,
    UserPreferencesDTO,
    UserSnapshot,
    ValidatedChoice,
    ValidationUser,
} from "../../IsaacAppTypes";
import {
    AssignmentDTO,
    AuthenticationProvider,
    ChoiceDTO,
    EmailVerificationStatus,
    GameboardDTO,
    GlossaryTermDTO,
    GraphChoiceDTO,
    IsaacQuestionPageDTO,
    QuestionDTO,
    RegisteredUserDTO,
    Role,
    TestCaseDTO,
    UserGroupDTO,
    UserSummaryDTO,
    UserSummaryWithEmailAddressDTO
} from "../../IsaacApiTypes";
import {
    releaseAllConfirmationModal,
    releaseConfirmationModal,
    revocationConfirmationModal,
    tokenVerificationModal
} from "../components/elements/modals/TeacherConnectionModalCreators";
import * as persistence from "../services/localStorage";
import {KEY} from "../services/localStorage";
import {
    additionalManagerRemovalModal,
    groupInvitationModal,
    groupManagersModal
} from "../components/elements/modals/GroupsModalCreators";
import {ThunkDispatch} from "redux-thunk";
import {selectors} from "./selectors";
import {isFirstLoginInPersistence} from "../services/firstLogin";
import {AxiosError} from "axios";
import {isTeacher} from "../services/user";
import ReactGA from "react-ga";
import {augmentEvent} from "../services/events";
import {EventOverviewFilter} from "../components/elements/panels/EventOverviews";
import {atLeastOne} from "../services/validation";
import {isaacBooksModal} from "../components/elements/modals/IsaacBooksModal";
import {aLevelBookChoiceModal} from "../components/elements/modals/ALevelBookChoiceModal";
import {groupEmailModal} from "../components/elements/modals/GroupEmailModal";
import {isDefined} from "../services/miscUtils";

// Utility functions
function isAxiosError(e: Error): e is AxiosError {
    return 'isAxiosError' in e && (e as AxiosError).isAxiosError;
}

export function extractMessage(e: Error) {
    if (isAxiosError(e) && e.response && e.response.data && e.response.data.errorMessage) {
        return e.response.data.errorMessage;
    }
    return API_REQUEST_FAILURE_MESSAGE;
}

// Toasts
const removeToast = (toastId: string) => (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.TOASTS_REMOVE, toastId});
};

export const hideToast = (toastId: string) => (dispatch: any) => {
    dispatch({type: ACTION_TYPE.TOASTS_HIDE, toastId});
    setTimeout(() => {
        dispatch(removeToast(toastId));
    }, 1000);
};

let nextToastId = 0;
export const showToast = (toast: Toast) => (dispatch: any) => {
    const toastId = toast.id = "toast" + nextToastId++;
    if (toast.timeout) {
        setTimeout(() => {
            dispatch(hideToast(toastId));
        }, toast.timeout);
    }
    if (toast.closable === undefined) toast.closable = true;
    toast.showing = true;
    dispatch({type: ACTION_TYPE.TOASTS_SHOW, toast});
    return toastId;
};

export function showErrorToastIfNeeded(error: string, e: any) {
    if (e) {
        if (e.response) {
            if (e.response.status < 500) {
                return showToast({
                    color: "danger", title: error, timeout: 5000,
                    body: extractMessage(e),
                }) as any;
            }
        } else {
            ReactGA.exception({
                description: `load_fail: ${error}`
            });
            return showToast({
                color: "danger", title: error, timeout: 5000,
                body: API_REQUEST_FAILURE_MESSAGE
            });
        }
    }
    return {type: ACTION_TYPE.TEST_ACTION};
}

// ActiveModal
export const openActiveModal = (activeModal: ActiveModal) => ({type: ACTION_TYPE.ACTIVE_MODAL_OPEN, activeModal});

export const closeActiveModal = () => ({type: ACTION_TYPE.ACTIVE_MODAL_CLOSE});

// Generic log action:
export const logAction = (eventDetails: object) => {
    api.logger.log(eventDetails); // We do not care whether this completes or not
    return {type: ACTION_TYPE.LOG_EVENT, eventDetails: eventDetails};
};

// User authentication
export const getUserAuthSettings = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_AUTH_SETTINGS_REQUEST});
    try {
        const authenticationSettings = await api.authentication.getCurrentUserAuthSettings();
        dispatch({type: ACTION_TYPE.USER_AUTH_SETTINGS_RESPONSE_SUCCESS, userAuthSettings: authenticationSettings.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_AUTH_SETTINGS_RESPONSE_FAILURE, errorMessage: extractMessage(e)});
    }
};

export const getChosenUserAuthSettings = (userId: number) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.SELECTED_USER_AUTH_SETTINGS_REQUEST});
    try {
        const authenticationSettings = await api.authentication.getSelectedUserAuthSettings(userId);
        dispatch({type: ACTION_TYPE.SELECTED_USER_AUTH_SETTINGS_RESPONSE_SUCCESS, selectedUserAuthSettings: authenticationSettings.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.SELECTED_USER_AUTH_SETTINGS_RESPONSE_FAILURE, errorMessage: extractMessage(e)});
    }
};

export const linkAccount = (provider: AuthenticationProvider) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_AUTH_LINK_REQUEST});
    try {
        const redirectResponse = await api.authentication.linkAccount(provider);
        const redirectUrl = redirectResponse.data.redirectUrl;
        dispatch({type: ACTION_TYPE.USER_AUTH_LINK_RESPONSE_SUCCESS, provider, redirectUrl: redirectUrl});
        window.location.href = redirectUrl;
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_AUTH_LINK_RESPONSE_FAILURE, errorMessage: extractMessage(e)});
        dispatch(showErrorToastIfNeeded("Failed to link account", e));
    }
};

export const unlinkAccount = (provider: AuthenticationProvider) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_AUTH_UNLINK_REQUEST});
    try {
        await api.authentication.unlinkAccount(provider);
        dispatch({type: ACTION_TYPE.USER_AUTH_UNLINK_RESPONSE_SUCCESS, provider});
        await Promise.all([
            dispatch(getUserAuthSettings() as any)
        ]);
        dispatch(showToast({
            title: "Account unlinked",
            body: "Your account settings were updated successfully.",
            color: "success",
            timeout: 5000,
            closable: false,
        }) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_AUTH_UNLINK_RESPONSE_FAILURE, errorMessage: extractMessage(e)});
        dispatch(showErrorToastIfNeeded("Failed to unlink account", e));
    }
};

export const getNewTotpSecret = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_AUTH_MFA_NEW_SECRET_REQUEST});
    try {
        const mfaSetupResponse = await api.authentication.getNewMFASecret();
        dispatch({type: ACTION_TYPE.USER_AUTH_MFA_NEW_SECRET_SUCCESS, totpSharedSecretDTO: mfaSetupResponse.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_AUTH_MFA_NEW_SECRET_FAILURE, errorMessage: extractMessage(e)});
        dispatch(showErrorToastIfNeeded("Failed to get 2FA secret", e));
    }
};

export const setupAccountMFA = (sharedSecret: string, mfaVerificationCode: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_AUTH_MFA_SETUP_REQUEST});
    try {
        await api.authentication.setupMFAOnAccount(sharedSecret, mfaVerificationCode);
        dispatch({type: ACTION_TYPE.USER_AUTH_MFA_SETUP_SUCCESS});
        dispatch(showToast({
            color: "success", title: "2FA Configured", body: "You have enabled 2FA on your account!"}) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_AUTH_MFA_SETUP_FAILURE, errorMessage: extractMessage(e)});
        dispatch(showErrorToastIfNeeded("Failed to setup 2FA on account", e));
    }
};

export const submitTotpChallengeResponse = (mfaVerificationCode: string, rememberMe: boolean) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_AUTH_MFA_CHALLENGE_REQUEST});
    try {
        const afterAuthPath = persistence.load(KEY.AFTER_AUTH_PATH) || '/';
        const result = await api.authentication.mfaCompleteLogin(mfaVerificationCode, rememberMe);

        await dispatch(requestCurrentUser() as any); // Request user preferences
        dispatch({type: ACTION_TYPE.USER_AUTH_MFA_CHALLENGE_SUCCESS});
        dispatch({type: ACTION_TYPE.USER_LOG_IN_RESPONSE_SUCCESS, user: result.data});
        persistence.remove(KEY.AFTER_AUTH_PATH);

        history.push(afterAuthPath);

    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_AUTH_MFA_CHALLENGE_FAILURE, errorMessage: extractMessage(e)});
        dispatch(showErrorToastIfNeeded("Error with verification code.", e));
    }
    dispatch(requestCurrentUser() as any)
};

export const disableTotpForAccount = (userId: number) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_AUTH_MFA_DISABLE_REQUEST});
    try {
        await api.authentication.disableMFAOnAccount(userId);
        dispatch({type: ACTION_TYPE.USER_AUTH_MFA_DISABLE_SUCCESS});
        dispatch(showToast({
            color: "success", title: "2FA Disabled", body: "You have disabled 2FA on this account!"}) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_AUTH_MFA_DISABLE_FAILURE, errorMessage: extractMessage(e)});
        dispatch(showErrorToastIfNeeded("Failed to disable 2FA on account.", e));
    }
};

export const getUserPreferences = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_PREFERENCES_REQUEST});
    try {
        const userPreferenceSettings = await api.users.getPreferences();
        dispatch({type: ACTION_TYPE.USER_PREFERENCES_RESPONSE_SUCCESS, userPreferences: userPreferenceSettings.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_PREFERENCES_RESPONSE_FAILURE, errorMessage: extractMessage(e)});
    }
};

export const requestCurrentUser = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_UPDATE_REQUEST});
    try {
        // Request the user
        const currentUser = await api.users.getCurrent();
        // Now with that information request auth settings and preferences asynchronously
        await Promise.all([
            dispatch(getUserAuthSettings() as any),
            dispatch(getUserPreferences() as any)
        ]);
        dispatch({type: ACTION_TYPE.USER_UPDATE_RESPONSE_SUCCESS, user: currentUser.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_UPDATE_RESPONSE_FAILURE});
    }
};


export const partiallyUpdateUserSnapshot = (newUserSnapshot: UserSnapshot) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_SNAPSHOT_PARTIAL_UPDATE, userSnapshot: newUserSnapshot});
};

// TODO scope for pulling out a separate registerUser method from this
export const updateCurrentUser = (
    updatedUser: ValidationUser,
    updatedUserPreferences: UserPreferencesDTO,
    passwordCurrent: string | null,
    currentUser: PotentialUser
) => async (dispatch: Dispatch<Action>) => {
    // Confirm email change
    if (currentUser.loggedIn && currentUser.id == updatedUser.id) {
        if (currentUser.loggedIn && currentUser.email !== updatedUser.email) {
            const emailChangeConfirmed = window.confirm(
                "You have edited your email address. Your current address will continue to work until you verify your " +
                "new address by following the verification link sent to it via email. Continue?"
            );
            if (!emailChangeConfirmed) {
                dispatch(showToast({
                    title: "Account settings not updated",
                    body: "Your account settings update was cancelled.",
                    color: "danger",
                    timeout: 5000,
                    closable: false,
                }) as any);
                return; //early
            }
        }
    }

    const editingOtherUser = currentUser.loggedIn && currentUser.id != updatedUser.id;

    try {
        dispatch({type: ACTION_TYPE.USER_DETAILS_UPDATE_REQUEST});
        const currentUser = await api.users.updateCurrent(updatedUser, updatedUserPreferences, passwordCurrent);
        dispatch({type: ACTION_TYPE.USER_DETAILS_UPDATE_RESPONSE_SUCCESS, user: currentUser.data});
        await dispatch(requestCurrentUser() as any);

        const isFirstLogin = isFirstLoginInPersistence() || false;
        if (isFirstLogin) {
            const afterAuthPath = persistence.load(KEY.AFTER_AUTH_PATH) || '';
            persistence.remove(KEY.AFTER_AUTH_PATH);
            if ((afterAuthPath).includes('account')) {
                history.push(afterAuthPath, {firstLogin: isFirstLogin});
            }
            history.push('/account', {firstLogin: isFirstLogin});
        }

        if (!editingOtherUser) {
            dispatch(showToast({
                title: "Account settings updated",
                body: "Your account settings were updated successfully.",
                color: "success",
                timeout: 5000,
                closable: false,
            }) as any);
        }
        if (editingOtherUser) {
            history.push('/');
            dispatch(showToast({
                title: "Account settings updated",
                body: "The user's account settings were updated successfully.",
                color: "success",
                timeout: 5000,
                closable: false,
            }) as any);
        }
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_DETAILS_UPDATE_RESPONSE_FAILURE, errorMessage: extractMessage(e)});
    }
};

export function setTransientStagePreference(stage: STAGE) {
    return {type: ACTION_TYPE.TRANSIENT_USER_CONTEXT_SET_STAGE, stage};
}
export function setTransientExamBoardPreference(examBoard: EXAM_BOARD) {
    return {type: ACTION_TYPE.TRANSIENT_USER_CONTEXT_SET_EXAM_BOARD, examBoard};
}

export function setTransientShowOtherContentPreference(showOtherContent: boolean) {
    return {type: ACTION_TYPE.TRANSIENT_USER_CONTEXT_SET_SHOW_OTHER_CONTENT, showOtherContent};
}

export const getMyProgress = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.MY_PROGRESS_REQUEST});
    try {
        const response = await api.users.getProgress();
        dispatch({type: ACTION_TYPE.MY_PROGRESS_RESPONSE_SUCCESS, myProgress: response.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.MY_PROGRESS_RESPONSE_FAILURE});
    }
};

export const getUserProgress = (userIdOfInterest?: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_PROGRESS_REQUEST});
    try {
        const response = await api.users.getProgress(userIdOfInterest);
        dispatch({type: ACTION_TYPE.USER_PROGRESS_RESPONSE_SUCCESS, userProgress: response.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_PROGRESS_RESPONSE_FAILURE});
    }
};

export const getSnapshot = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_SNAPSHOT_REQUEST});
    try {
        const response = await api.users.getSnapshot();
        dispatch({type: ACTION_TYPE.USER_SNAPSHOT_RESPONSE_SUCCESS, snapshot: response.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_SNAPSHOT_RESPONSE_FAILURE});
    }
};

export const logOutUser = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_LOG_OUT_REQUEST});
    try {
        await api.authentication.logout();
        dispatch({type: ACTION_TYPE.USER_LOG_OUT_RESPONSE_SUCCESS});
    } catch (e) {
        dispatch(showErrorToastIfNeeded("Logout failed", e));
    }
};

export const logOutUserEverywhere = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_LOG_OUT_EVERYWHERE_REQUEST});
    try {
        await api.authentication.logoutEverywhere();
        dispatch({type: ACTION_TYPE.USER_LOG_OUT_EVERYWHERE_RESPONSE_SUCCESS});
    } catch (e) {
        dispatch(showErrorToastIfNeeded("Logout everywhere failed", e));
    }
};

export const logInUser = (provider: AuthenticationProvider, credentials: CredentialsAuthDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_LOG_IN_REQUEST, provider});
    const afterAuthPath = persistence.load(KEY.AFTER_AUTH_PATH) || '/';

    try {
        const result = await api.authentication.login(provider, credentials);

        if (result.status === 202) {
            // indicates MFA is required for this user and user isn't logged in yet.
            dispatch({type: ACTION_TYPE.USER_AUTH_MFA_CHALLENGE_REQUIRED});
            return;
        }

        await dispatch(requestCurrentUser() as any); // Request user preferences
        dispatch({type: ACTION_TYPE.USER_LOG_IN_RESPONSE_SUCCESS, user: result.data});
        persistence.remove(KEY.AFTER_AUTH_PATH);
        history.push(afterAuthPath);

    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_LOG_IN_RESPONSE_FAILURE, errorMessage: extractMessage(e)})
    }
    dispatch(requestCurrentUser() as any)
};

export const resetPassword = (params: {email: string}) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_PASSWORD_RESET_REQUEST});
    try {
        await api.users.passwordReset(params);
        dispatch({type: ACTION_TYPE.USER_PASSWORD_RESET_RESPONSE_SUCCESS});
    } catch (e) {
        dispatch(showErrorToastIfNeeded("Password reset failed", e));
    }
};

export const verifyPasswordReset = (token: string | null) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.USER_INCOMING_PASSWORD_RESET_REQUEST});
        await api.users.verifyPasswordReset(token);
        dispatch({type: ACTION_TYPE.USER_INCOMING_PASSWORD_RESET_SUCCESS});
    } catch(e) {
        dispatch({type:ACTION_TYPE.USER_INCOMING_PASSWORD_RESET_FAILURE, errorMessage: extractMessage(e)});
    }
};

export const handlePasswordReset = (params: {token: string; password: string}) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.USER_PASSWORD_RESET_REQUEST});
        await api.users.handlePasswordReset(params);
        dispatch({type: ACTION_TYPE.USER_PASSWORD_RESET_RESPONSE_SUCCESS});
        history.push('/login');
        dispatch(showToast({color: "success", title: "Password reset successful", body: "Please log in with your new password.", timeout: 5000}) as any);
    } catch(e) {
        dispatch({type:ACTION_TYPE.USER_INCOMING_PASSWORD_RESET_FAILURE, errorMessage: extractMessage(e)});
    }
};

export const handleProviderLoginRedirect = (provider: AuthenticationProvider) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.AUTHENTICATION_REQUEST_REDIRECT, provider});
    try {
        const redirectResponse = await api.authentication.getRedirect(provider);
        const redirectUrl = redirectResponse.data.redirectUrl;
        dispatch({type: ACTION_TYPE.AUTHENTICATION_REDIRECT, provider, redirectUrl: redirectUrl});
        window.location.href = redirectUrl;
    } catch (e) {
        dispatch(showErrorToastIfNeeded("Login redirect failed", e));
    }
    // TODO MT handle case when user is already logged in
};

export const handleProviderCallback = (provider: AuthenticationProvider, parameters: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.AUTHENTICATION_HANDLE_CALLBACK});
    try {
        const providerResponse = await api.authentication.checkProviderCallback(provider, parameters);
        await dispatch(requestCurrentUser() as any); // Request user preferences
        dispatch({type: ACTION_TYPE.USER_LOG_IN_RESPONSE_SUCCESS, user: providerResponse.data});
        let nextPage = persistence.load(KEY.AFTER_AUTH_PATH);
        persistence.remove(KEY.AFTER_AUTH_PATH);
        nextPage = nextPage || "/";
        nextPage = nextPage.replace("#!", "");
        if (providerResponse.data.firstLogin && !nextPage.includes("account")) {
            ReactGA.event({
                category: 'user',
                action: 'registration',
                label: `Create Account (${provider})`,
            });
            history.push('/account');
        } else {
            history.push(nextPage);
        }
    } catch (error) {
        history.push({pathname: "/auth_error", state: {errorMessage: extractMessage(error)}});
        dispatch(showErrorToastIfNeeded("Login Failed", error));
    }
};

export const requestEmailVerification = () => async (dispatch: any, getState: () => AppState) => {
    const state = getState();
    const user: RegisteredUserDTO | null = state && state.user && state.user.loggedIn && state.user || null;
    let error = "";
    if (user && user.email) {
        dispatch({type: ACTION_TYPE.USER_REQUEST_EMAIL_VERIFICATION_REQUEST});
        try {
            const response = await api.users.requestEmailVerification({email: user.email});
            if (response.status == 200) {
                dispatch(showToast({
                    color: "success", title: "Email verification request succeeded.",
                    body: "Please follow the verification link given in the email sent to your address.",
                    timeout: 10000
                }));
                dispatch({type: ACTION_TYPE.USER_REQUEST_EMAIL_VERIFICATION_RESPONSE_SUCCESS});
                return;
            }
            error = response.data || "Error sending request";
        } catch (e) {
            error = e.message || "Error sending request";
        }
    } else {
        error = "You are not logged in or don't have an e-mail address to verify.";
    }

    dispatch(showToast({color: "danger", title: "Email verification request failed.",
        body: "Sending an email to your address failed with error message: " + error
    }));
    dispatch({type: ACTION_TYPE.USER_REQUEST_EMAIL_VERIFICATION_RESPONSE_FAILURE});
};

export const handleEmailAlter = (params: ({userid: string | null; token: string | null})) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EMAIL_AUTHENTICATION_REQUEST});
        await api.email.verify(params);
        dispatch({type: ACTION_TYPE.EMAIL_AUTHENTICATION_RESPONSE_SUCCESS});
        dispatch(requestCurrentUser() as any);
        dispatch(showToast({
            title: "Email address verified",
            body: "The email address has been verified",
            color: "success",
            timeout: 5000,
            closable: false,
        }) as any);
    } catch(e) {
        dispatch({type:ACTION_TYPE.EMAIL_AUTHENTICATION_RESPONSE_FAILURE, errorMessage: extractMessage(e)});
    }
};

// User error
export const getUserIdSchoolLookup = (eventIds: number[]) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.USER_SCHOOL_LOOKUP_REQUEST});
        const response = await api.users.getUserIdSchoolLookup(eventIds);
        dispatch({type: ACTION_TYPE.USER_SCHOOL_LOOKUP_RESPONSE_SUCCESS, schoolLookup: response.data});
    } catch (error) {
        dispatch({type: ACTION_TYPE.USER_SCHOOL_LOOKUP_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to load user school lookup details", error) as any);
    }
};

// Contact us
export const submitMessage = (params: {firstName: string; lastName: string; emailAddress: string; subject: string; message: string }) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.CONTACT_FORM_SEND_REQUEST});
    try {
        await api.contactForm.send(params);
        dispatch({type: ACTION_TYPE.CONTACT_FORM_SEND_RESPONSE_SUCCESS})
    } catch (e) {
        const errorMessage = extractMessage(e);
        dispatch({type: ACTION_TYPE.CONTACT_FORM_SEND_RESPONSE_FAILURE, errorMessage: errorMessage});
        dispatch(showErrorToastIfNeeded(errorMessage, e));
    }
};

// Teacher connections
export const getActiveAuthorisations = (userId?: number) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_ACTIVE_REQUEST});
        const authorisationsResponse = await (userId ? api.authorisations.adminGet(userId) : api.authorisations.get());
        dispatch({
            type: ACTION_TYPE.AUTHORISATIONS_ACTIVE_RESPONSE_SUCCESS,
            authorisations: authorisationsResponse.data
        });
    } catch (e) {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_ACTIVE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Loading authorised teachers failed", e));
    }
};

export const authenticateWithTokenAfterPrompt = (userId: number, userSubmittedAuthenticationToken: string | null) => async (dispatch: Dispatch<Action>) => {
    if (!userSubmittedAuthenticationToken) {
        dispatch(showToast({
            color: "danger", title: "No group code provided", body: "You have to enter a group code!"}) as any);
        return;
    }

    try {
        // Some users paste the URL in the token box, so remove the token from the end if they do.
        // Tokens so far are also always uppercase; this is hardcoded in the API, so safe to assume here:
        let authenticationToken = userSubmittedAuthenticationToken.split("?authToken=").pop() as string;
        authenticationToken = authenticationToken.toUpperCase().replace(/ /g,'');

        dispatch({type: ACTION_TYPE.AUTHORISATIONS_TOKEN_OWNER_REQUEST});
        const result = await api.authorisations.getTokenOwner(authenticationToken);
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_TOKEN_OWNER_RESPONSE_SUCCESS});
        const usersToGrantAccess = result.data;

        // TODO can use state (second thunk param) to highlight teachers who have already been granted access
        // const toGrantIds = usersToGrantAccess && usersToGrantAccess.map(u => u.id);
        // const state = getState();
        // const usersAlreadyAuthorised = (state && state.activeAuthorisations && state.activeAuthorisations
        //     .filter((currentAuthorisation) => (toGrantIds as number[]).includes(currentAuthorisation.id as number)));

        dispatch(openActiveModal(tokenVerificationModal(userId, authenticationToken, usersToGrantAccess)) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_TOKEN_OWNER_RESPONSE_FAILURE});
        if (e.status == 429) {
            dispatch(showToast({
                color: "danger", title: "Too many attempts", timeout: 5000,
                body: "You have entered too many group codes. Please check your code with your teacher and try again later!"
            }) as any);
        } else {
            dispatch(showToast({
                color: "danger", title: "Teacher connection failed", timeout: 5000,
                body: "The code may be invalid or the group may no longer exist. Codes are usually uppercase and 6-8 characters in length."
            }) as any);
        }
    }
};
export const authenticateWithToken = (authToken: string) => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    try {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_TOKEN_APPLY_REQUEST});
        await api.authorisations.useToken(authToken);
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_TOKEN_APPLY_RESPONSE_SUCCESS});
        dispatch(getActiveAuthorisations() as any);
        dispatch(getGroupMemberships() as any);
        dispatch(showToast({
            color: "success", title: "Granted access", timeout: 5000,
            body: "You have granted access to your data."
        }) as any);
        const state = getState();
        // TODO currently this is not necessary because we are not on the correct tab after being told to log in
        // user.firstLogin is set correctly using SSO, but not with Segue: check session storage too:
        if (state && state.user && state.user.loggedIn && state.user.firstLogin || isFirstLoginInPersistence()) {
            // If we've just signed up and used a group code immediately, change back to the main settings page:
            history.push("/account");
        }
        // /TODO
        dispatch(closeActiveModal() as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_TOKEN_APPLY_RESPONSE_FAILURE});
        dispatch(showToast({
            color: "danger", title: "Teacher connection failed", timeout: 5000,
            body: "The code may be invalid or the group may no longer exist. Codes are usually uppercase and 6-8 characters in length."
        }) as any);
    }
};
export const openALevelBookChoiceModal = () => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(aLevelBookChoiceModal()) as any);
};
export const openIsaacBooksModal = () => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(isaacBooksModal()) as any);
};
export const revokeAuthorisationAfterPrompt = (userId: number, otherUser: UserSummaryWithEmailAddressDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(revocationConfirmationModal(userId, otherUser)) as any);
};
export const revokeAuthorisation = (userId: number, userToRevoke: UserSummaryWithEmailAddressDTO) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_REVOKE_REQUEST});
        await api.authorisations.revoke(userToRevoke.id as number);
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_REVOKE_RESPONSE_SUCCESS});
        dispatch(showToast({
            color: "success", title: "Access revoked", timeout: 5000,
            body: "You have revoked access to your data."
        }) as any);
        dispatch(getActiveAuthorisations(userId) as any);
        dispatch(closeActiveModal() as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_REVOKE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Revoke operation failed", e));
    }
};

// Student/other Connections
export const getStudentAuthorisations = (userId?: number) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_OTHER_USERS_REQUEST});
        const otherUserAuthorisationsResponse = await (userId ? api.authorisations.adminGetOtherUsers(userId) : api.authorisations.getOtherUsers());
        dispatch({
            type: ACTION_TYPE.AUTHORISATIONS_OTHER_USERS_RESPONSE_SUCCESS,
            otherUserAuthorisations: otherUserAuthorisationsResponse.data
        });
    } catch (e) {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_OTHER_USERS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Loading authorised students failed", e));
    }
};

export const releaseAuthorisationAfterPrompt = (userId: number, student: UserSummaryDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(releaseConfirmationModal(userId, student)) as any);
};
export const releaseAuthorisation = (userId: number, student: UserSummaryDTO) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_RELEASE_USER_REQUEST});
        await api.authorisations.release(student.id as number);
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_RELEASE_USER_RESPONSE_SUCCESS});
        dispatch(getStudentAuthorisations(userId) as any);
        dispatch(closeActiveModal() as any);
        dispatch(showToast({
            color: "success", title: "Access removed", timeout: 5000,
            body: "You have ended your access to your student's data."
        }) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_RELEASE_USER_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Revoke operation failed", e));
    }
};

export const releaseAllAuthorisationsAfterPrompt = (userId: number) => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(releaseAllConfirmationModal(userId)) as any);
};
export const releaseAllAuthorisations = (userId: number) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_RELEASE_ALL_USERS_REQUEST});
        await api.authorisations.releaseAll();
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_RELEASE_ALL_USERS_RESPONSE_SUCCESS});
        dispatch(getStudentAuthorisations(userId) as any);
        dispatch(closeActiveModal() as any);
        dispatch(showToast({
            color: "success", title: "Access removed", timeout: 5000,
            body: "You have ended your access to all of your students' data."
        }) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_RELEASE_ALL_USERS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Revoke operation failed", e));
    }
};

// Constants
export const requestConstantsUnits = () => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    // Don't request this again if it has already been fetched successfully
    const state = getState();
    if (state && state.constants && state.constants.units) {
        return;
    }

    dispatch({type: ACTION_TYPE.CONSTANTS_UNITS_REQUEST});
    try {
        const units = await api.constants.getUnits();
        dispatch({type: ACTION_TYPE.CONSTANTS_UNITS_RESPONSE_SUCCESS, units: units.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.CONSTANTS_UNITS_RESPONSE_FAILURE});
    }
};

export const requestConstantsSegueVersion = () => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    // Don't request this again if it has already been fetched successfully
    const state = getState();
    if (state && state.constants && state.constants.segueVersion) {
        return;
    }
    dispatch({type: ACTION_TYPE.CONSTANTS_SEGUE_VERSION_REQUEST});
    try {
        const version = await api.constants.getSegueVersion();
        dispatch({type: ACTION_TYPE.CONSTANTS_SEGUE_VERSION_RESPONSE_SUCCESS, ...version.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.CONSTANTS_SEGUE_VERSION_RESPONSE_FAILURE});
    }
};

export const requestConstantsSegueEnvironment = () => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    const state = getState();
    if (state && state.constants && state.constants.segueEnvironment) {
        return;
    }
    dispatch({type: ACTION_TYPE.CONSTANTS_SEGUE_ENVIRONMENT_REQUEST});
    try {
        const environment = await api.constants.getSegueEnvironment();
        dispatch({type: ACTION_TYPE.CONSTANTS_SEGUE_ENVIRONMENT_RESPONSE_SUCCESS, ...environment.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.CONSTANTS_SEGUE_ENVIRONMENT_RESPONSE_FAILURE});
    }
};

export const requestNotifications = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.NOTIFICATIONS_REQUEST});
    try {
        const response = await api.notifications.get();
        dispatch({type: ACTION_TYPE.NOTIFICATIONS_RESPONSE_SUCCESS, notifications: response.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.NOTIFICATIONS_RESPONSE_FAILURE});
    }
}

// Document & topic fetch
export const fetchDoc = (documentType: DOCUMENT_TYPE, pageId: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.DOCUMENT_REQUEST, documentType: documentType, documentId: pageId});
    let apiEndpoint;
    switch (documentType) {
        case DOCUMENT_TYPE.CONCEPT: apiEndpoint = api.concepts; break;
        case DOCUMENT_TYPE.QUESTION: apiEndpoint = api.questions; break;
        case DOCUMENT_TYPE.GENERIC: default: apiEndpoint = api.pages; break;
    }
    try {
        const response = await apiEndpoint.get(pageId);
        dispatch({type: ACTION_TYPE.DOCUMENT_RESPONSE_SUCCESS, doc: response.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.DOCUMENT_RESPONSE_FAILURE});
    }
};

export const fetchTopicSummary = (topicName: TAG_ID) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.TOPIC_REQUEST, topicName});
    try {
        const response = await api.topics.get(topicName);
        dispatch({type: ACTION_TYPE.TOPIC_RESPONSE_SUCCESS, topic: response.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.TOPIC_RESPONSE_FAILURE});
    }
};

// Page fragments
export const fetchFragment = (id: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.FRAGMENT_REQUEST, id});
    try {
        const response = await api.fragments.get(id);
        dispatch({type: ACTION_TYPE.FRAGMENT_RESPONSE_SUCCESS, id, doc: response.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.FRAGMENT_RESPONSE_FAILURE, id});
    }
};

// Glossary Terms
export const fetchGlossaryTerms = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GLOSSARY_TERMS_REQUEST});
    try {
        const response = await api.glossary.getTerms();
        dispatch({type: ACTION_TYPE.GLOSSARY_TERMS_RESPONSE_SUCCESS, terms: response.data.results as GlossaryTermDTO[]});
    } catch (e) {
        dispatch({type: ACTION_TYPE.GLOSSARY_TERMS_RESPONSE_FAILURE});
    }
};

// Questions
export const registerQuestion = (question: QuestionDTO, accordionClientId?: string) => (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.QUESTION_REGISTRATION, question, accordionClientId});
};

export const deregisterQuestion = (questionId: string) => (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.QUESTION_DEREGISTRATION, questionId});
};

interface Attempt {
    attempts: number;
    timestamp: number;
}
const attempts: {[questionId: string]: Attempt} = {};

export const attemptQuestion = (questionId: string, attempt: ChoiceDTO) => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    const state = getState();
    const isAnonymous = !(state && state.user && state.user.loggedIn);
    const timePeriod = isAnonymous ? 5 * 60 * 1000 : 15 * 60 * 1000;

    try {
        dispatch({type: ACTION_TYPE.QUESTION_ATTEMPT_REQUEST, questionId, attempt});
        const response = await api.questions.answer(questionId, attempt);
        dispatch({type: ACTION_TYPE.QUESTION_ATTEMPT_RESPONSE_SUCCESS, questionId, response: response.data});

        // This mirrors the soft limit checking on the server
        let lastAttempt = attempts[questionId];
        if (lastAttempt && lastAttempt.timestamp + timePeriod > Date.now()) {
            lastAttempt.attempts++;
            lastAttempt.timestamp = Date.now();
        } else {
            lastAttempt = {
                attempts: 1,
                timestamp: Date.now()
            };
            attempts[questionId] = lastAttempt;
        }
        const softLimit = isAnonymous ? 3 : 10;
        if (lastAttempt.attempts >= softLimit && !response.data.correct) {
            dispatch(showToast({
                color: "warning", title: "Approaching attempts limit", timeout: 10000,
                body: "You have entered several guesses for this question; soon it will be temporarily locked."
            }) as any);
        }
    } catch (e) {
        if (e.response && e.response.status === 429) {
            const errorMessage = e.response?.data?.errorMessage || QUESTION_ATTEMPT_THROTTLED_MESSAGE;
            const lock = new Date((new Date()).getTime() + timePeriod);

            dispatch({type: ACTION_TYPE.QUESTION_ATTEMPT_RESPONSE_FAILURE, questionId, lock});
            dispatch(showToast({
                color: "danger", title: "Too many attempts", timeout: 10000,
                body: errorMessage
            }) as any);
            setTimeout( () => {
                dispatch({type: ACTION_TYPE.QUESTION_UNLOCK, questionId});
            }, timePeriod);
        } else {
            dispatch({type: ACTION_TYPE.QUESTION_ATTEMPT_RESPONSE_FAILURE, questionId});
            dispatch(showToast({
                color: "danger", title: "Question attempt failed", timeout: 5000,
                body: "Your answer could not be checked. Please try again."
            }) as any);
        }
    }
};

export const setCurrentAttempt = (questionId: string, attempt: ChoiceDTO|ValidatedChoice<ChoiceDTO>) => (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.QUESTION_SET_CURRENT_ATTEMPT, questionId, attempt});
};

let questionSearchCounter = 0;

export const searchQuestions = (query: QuestionSearchQuery) => async (dispatch: Dispatch<Action>) => {
    const searchCount = ++questionSearchCounter;
    dispatch({type: ACTION_TYPE.QUESTION_SEARCH_REQUEST});
    try {
        const questionsResponse = await api.questions.search(query);
        // Because some searches might take longer to return that others, check this is the most recent search still.
        // Otherwise, we just discard the data.
        if (searchCount === questionSearchCounter) {
            dispatch({type: ACTION_TYPE.QUESTION_SEARCH_RESPONSE_SUCCESS, questions: questionsResponse.data.results});
        }
    } catch (e) {
        dispatch({type: ACTION_TYPE.QUESTION_SEARCH_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to search for questions", e));
    }
};

export const clearQuestionSearch = async (dispatch: Dispatch<Action>) => {
    questionSearchCounter++;
    dispatch({type: ACTION_TYPE.QUESTION_SEARCH_RESPONSE_SUCCESS, questions: []});
};

export const getMyAnsweredQuestionsByDate = (userId: number | string, fromDate: number, toDate: number, perDay: boolean) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.MY_QUESTION_ANSWERS_BY_DATE_REQUEST});
    try {
        const myAnsweredQuestionsByDate = await api.questions.answeredQuestionsByDate(userId, fromDate, toDate, perDay);
        dispatch({type: ACTION_TYPE.MY_QUESTION_ANSWERS_BY_DATE_RESPONSE_SUCCESS, myAnsweredQuestionsByDate: myAnsweredQuestionsByDate.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.MY_QUESTION_ANSWERS_BY_DATE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to get my answered question activity data", e));
    }
};

export const getUserAnsweredQuestionsByDate = (userId: number | string, fromDate: number, toDate: number, perDay: boolean) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_QUESTION_ANSWERS_BY_DATE_REQUEST});
    try {
        const userAnsweredQuestionsByDate = await api.questions.answeredQuestionsByDate(userId, fromDate, toDate, perDay);
        dispatch({type: ACTION_TYPE.USER_QUESTION_ANSWERS_BY_DATE_RESPONSE_SUCCESS, userAnsweredQuestionsByDate: userAnsweredQuestionsByDate.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_QUESTION_ANSWERS_BY_DATE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to get user answered question activity data", e));
    }
};

export const goToSupersededByQuestion = (page: IsaacQuestionPageDTO) => async (dispatch: Dispatch<Action>) =>  {
    if (page.supersededBy) {
        dispatch(logAction({
            type: "VIEW_SUPERSEDED_BY_QUESTION", questionId: page.id, supersededBy: page.supersededBy
        }) as any);
        history.push(`/questions/${page.supersededBy}`);
    }
};

// Quizzes
const generatePostQuizUrl = (quizId: string) => `/pages/post_${quizId}`;

export const submitQuizPage = (quizId: string) => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    const currentState: AppState = getState();
    try {
        dispatch({type: ACTION_TYPE.QUIZ_SUBMISSION_REQUEST, quizId});
        if (currentState && currentState.questions) {
            await Promise.all(currentState.questions.questions.map(
                question => {
                    if (question.id && question.currentAttempt) {
                        dispatch(attemptQuestion(question.id, question.currentAttempt) as any);
                    }
                }
            ));
            dispatch({type: ACTION_TYPE.QUIZ_SUBMISSION_RESPONSE_SUCCESS});
            dispatch(showToast({color: "success", title: "Quiz submitted", body: "Quiz submitted successfully", timeout: 3000}) as any);
            history.push(generatePostQuizUrl(quizId));
        }
    } catch (e) {
        dispatch({type: ACTION_TYPE.QUIZ_SUBMISSION_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Error submitting quiz", e));
    }
};

export const redirectForCompletedQuiz = (quizId: string) => (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal({
        closeAction: () => {dispatch(closeActiveModal() as any)},
        title: "Quiz already submitted",
        body: <div className="text-center my-5 pb-4">
            <strong>A submission has already been recorded for this quiz by your account.</strong>
        </div>
    }) as any);
    history.push(generatePostQuizUrl(quizId));
};

export const getQuizAssignmentResultsSummaryCSV = (assignmentId: number) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.QUIZ_ASSIGNMENT_RESULTS_CSV_REQUEST, assignmentId});
        const response = await api.quizzes.getQuizAssignmentResultsSummaryCSV(assignmentId);
        dispatch({type: ACTION_TYPE.QUIZ_ASSIGNMENT_RESULTS_CSV_RESPONSE_SUCCESS, assignmentResultsCSV: response.data});
    } catch (error) {
        dispatch({type: ACTION_TYPE.QUIZ_ASSIGNMENT_RESULTS_CSV_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to load quiz assignment results csv", error) as any);
    }
};

// Question testing
export const testQuestion = (questionChoices: FreeTextRule[], testCases: TestCaseDTO[]) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.TEST_QUESTION_REQUEST});
        const testResponse = await api.questions.testFreeTextQuestion(questionChoices, testCases);
        dispatch({type: ACTION_TYPE.TEST_QUESTION_RESPONSE_SUCCESS, testCaseResponses: testResponse.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.TEST_QUESTION_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to test question", e));
    }
};

// Generate answer spec for graph sketcher
export const generateSpecification = (graphChoice: GraphChoiceDTO) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.GRAPH_SKETCHER_GENERATE_SPECIFICATION_REQUEST});
        const specResponse = await api.questions.generateSpecification(graphChoice);
        dispatch({type: ACTION_TYPE.GRAPH_SKETCHER_GENERATE_SPECIFICATION_RESPONSE_SUCCESS, specResponse: specResponse.data });
    } catch (e) {
        dispatch({type: ACTION_TYPE.GRAPH_SKETCHER_GENERATE_SPECIFICATION_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("There was a problem generating a graph specification", e));
    }
}

// Current gameboard
export const loadGameboard = (gameboardId: string|null) => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    const state = getState();
    if (state && state.currentGameboard && state.currentGameboard !== NOT_FOUND && 'inflight' in state.currentGameboard && state.currentGameboard.id === gameboardId) return;
    dispatch({type: ACTION_TYPE.GAMEBOARD_REQUEST, gameboardId});
    try {
        // TODO MT handle local storage load if gameboardId == null
        // TODO MT handle requesting new gameboard if local storage is also null
        if (gameboardId) {
            const gameboardResponse = await api.gameboards.get(gameboardId);
            dispatch({type: ACTION_TYPE.GAMEBOARD_RESPONSE_SUCCESS, gameboard: gameboardResponse.data});
        }
    } catch (e) {
        dispatch({type: ACTION_TYPE.GAMEBOARD_RESPONSE_FAILURE, gameboardId});
    }
};

export const addGameboard = (gameboardId: string, user: PotentialUser, redirectOnSuccess?: boolean) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.GAMEBOARD_ADD_REQUEST});
        await api.gameboards.save(gameboardId);
        dispatch({type: ACTION_TYPE.GAMEBOARD_ADD_RESPONSE_SUCCESS, gameboardId: gameboardId});
        if (redirectOnSuccess) {
            if (isTeacher(user)) {
                history.push(`/set_assignments#${gameboardId}`);
            } else {
                history.push(`/my_gameboards#${gameboardId}`);
            }
        }
    } catch (e) {
        dispatch({type: ACTION_TYPE.GAMEBOARD_ADD_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Error saving gameboard", e));
    }
};

export const createGameboard = (gameboard: GameboardDTO, previousId?: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GAMEBOARD_CREATE_REQUEST});
    try {
        const response = await api.gameboards.create(gameboard);
        dispatch({type: ACTION_TYPE.GAMEBOARD_CREATE_RESPONSE_SUCCESS, gameboardId: response.data.id});
        if (previousId) {
            dispatch(logAction({type: "CLONE_GAMEBOARD", gameboardId: previousId, newGameboardId: response.data.id})as any);
        }
    } catch (e) {
        dispatch({type: ACTION_TYPE.GAMEBOARD_CREATE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Error creating gameboard", e));
    }
};

export const getWildcards = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GAMEBOARD_WILDCARDS_REQUEST});
    try {
        const response = await api.gameboards.getWildcards();
        dispatch({type: ACTION_TYPE.GAMEBOARD_WILDCARDS_RESPONSE_SUCCESS, wildcards: response.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.GAMEBOARD_WILDCARDS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Error loading wildcards", e));
    }
};

export const generateTemporaryGameboard = (params: {[key: string]: string}) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GAMEBOARD_CREATE_REQUEST});
    try {
        const gameboardResponse = await api.gameboards.generateTemporary(params);
        if (gameboardResponse.status === NO_CONTENT) {
            dispatch({type: ACTION_TYPE.GAMEBOARD_RESPONSE_NO_CONTENT});
        } else {
            dispatch({type: ACTION_TYPE.GAMEBOARD_RESPONSE_SUCCESS, gameboard: gameboardResponse.data});
        }
    } catch (e) {
        dispatch({type: ACTION_TYPE.GAMEBOARD_CREATE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Error creating temporary gameboard", e));
    }
};

// Assignments
export const loadMyAssignments = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.ASSIGNMENTS_REQUEST});
    const assignmentsResponse = await api.assignments.getMyAssignments();
    dispatch({type: ACTION_TYPE.ASSIGNMENTS_RESPONSE_SUCCESS, assignments: assignmentsResponse.data});
    // Generic error handling covers errors here
};

export const loadAssignmentsOwnedByMe = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.ASSIGNMENTS_BY_ME_REQUEST});
    const assignmentsResponse = await api.assignments.getAssignmentsOwnedByMe();
    dispatch({type: ACTION_TYPE.ASSIGNMENTS_BY_ME_RESPONSE_SUCCESS, assignments: assignmentsResponse.data});
};

export const loadProgress = (assignment: AssignmentDTO) => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    // Don't request this again if it has already been fetched successfully
    const state = getState();
    if (state && state.progress && (assignment._id as number) in state.progress) {
        return;
    }

    dispatch({type: ACTION_TYPE.PROGRESS_REQUEST, assignment});
    try {
        const result = await api.assignments.getProgressForAssignment(assignment);
        dispatch({type: ACTION_TYPE.PROGRESS_RESPONSE_SUCCESS, assignment, progress: result.data});
    } catch {
        dispatch({type: ACTION_TYPE.PROGRESS_RESPONSE_FAILURE, assignment});
    }
};

// Content version
export const getContentVersion = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.CONTENT_VERSION_GET_REQUEST});
    try {
        const version = await api.contentVersion.getLiveVersion();
        dispatch({type: ACTION_TYPE.CONTENT_VERSION_GET_RESPONSE_SUCCESS, ...version.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.CONTENT_VERSION_GET_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to get content version", e));
    }
};

export const setContentVersion = (version: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.CONTENT_VERSION_SET_REQUEST, version});
    try {
        await api.contentVersion.setLiveVersion(version);
        dispatch({type: ACTION_TYPE.CONTENT_VERSION_SET_RESPONSE_SUCCESS, newVersion: version});
    } catch (e) {
        dispatch({type: ACTION_TYPE.CONTENT_VERSION_SET_RESPONSE_FAILURE});
    }
};

// Search
export const fetchSearch = (query: string, types: string | undefined) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.SEARCH_REQUEST, query, types});
    try {
        if (query === "") {
            return;
        }
        const searchResponse = await api.search.get(query, types);
        dispatch({type: ACTION_TYPE.SEARCH_RESPONSE_SUCCESS, searchResults: searchResponse.data});
    } catch (e) {
        dispatch(showErrorToastIfNeeded("Search failed", e));
    }
};

// Admin
export const adminUserSearch = (queryParams: {}) => async (dispatch: Dispatch<Action|((d: Dispatch<Action>) => void)>) => {
    dispatch({type: ACTION_TYPE.ADMIN_USER_SEARCH_REQUEST});
    try {
        const searchResponse = await api.admin.userSearch.get(queryParams);
        dispatch({type: ACTION_TYPE.ADMIN_USER_SEARCH_RESPONSE_SUCCESS, users: searchResponse.data});
        const resultElement = window.document.getElementById("admin-search-results");
        if (resultElement) {
            resultElement.scrollIntoView({behavior: "smooth"});
        }
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_USER_SEARCH_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("User search failed", e));
    }
};

export const adminUserGet = (userid: number | undefined) => async (dispatch: Dispatch<Action|((d: Dispatch<Action>) => void)>) => {
    dispatch({type: ACTION_TYPE.ADMIN_USER_GET_REQUEST});
    try {
        const searchResponse = await api.admin.userGet.get(userid);
        dispatch({type: ACTION_TYPE.ADMIN_USER_GET_RESPONSE_SUCCESS, getUsers: Object.assign({}, searchResponse.data)});
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_USER_GET_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("User Get Failed", e));
    }
};

export const adminUserDelete = (userid: number | undefined) => async (dispatch: Dispatch<Action|((d: Dispatch<Action>) => void)>) => {
    try {
        let confirmDeletion = window.confirm("Are you sure you want to delete this user?");
        if (confirmDeletion) {
            dispatch({type: ACTION_TYPE.ADMIN_USER_DELETE_REQUEST});
            await api.admin.userDelete.delete(userid);
            dispatch({type: ACTION_TYPE.ADMIN_USER_DELETE_RESPONSE_SUCCESS});
            dispatch(showToast({
                title: "User deleted",
                body: "The selected user was successfully deleted.",
                color: "success",
                timeout: 5000,
                closable: false,
            }) as any);
        }
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_USER_DELETE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("User deletion failed", e));
    }
};

export const adminModifyUserRoles = (role: Role, userIds: number[]) => async (dispatch: Dispatch<Action|((d: Dispatch<Action>) => void)>) => {
    dispatch({type: ACTION_TYPE.ADMIN_MODIFY_ROLES_REQUEST});
    try {
        await api.admin.modifyUserRoles.post(role, userIds);
        dispatch({type: ACTION_TYPE.ADMIN_MODIFY_ROLES_RESPONSE_SUCCESS});
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_MODIFY_ROLES_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("User role modification failed", e));
    }
};

export const adminModifyUserEmailVerificationStatuses = (status: EmailVerificationStatus, emails: string[]) => async (dispatch: Dispatch<Action|((d: Dispatch<Action>) => void)>) => {
    dispatch({type: ACTION_TYPE.ADMIN_MODIFY_EMAIL_VERIFICATION_STATUSES_REQUEST});
    try {
        await api.admin.modifyUserEmailVerificationStatuses.post(status, emails);
        dispatch({type: ACTION_TYPE.ADMIN_MODIFY_EMAIL_VERIFICATION_STATUSES_RESPONSE_SUCCESS});
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_MODIFY_EMAIL_VERIFICATION_STATUSES_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Email verification status modification failed", e));
    }
};

export const getAdminSiteStats = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.ADMIN_STATS_REQUEST});
    try {
        const version = await api.admin.getSiteStats();
        dispatch({type: ACTION_TYPE.ADMIN_STATS_RESPONSE_SUCCESS, stats: version.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_STATS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to get Admin statistics", e));
    }
};

export const getEmailTemplate = (contentid: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.ADMIN_EMAIL_TEMPLATE_REQUEST});
    try {
        const email = await api.email.getTemplateEmail(contentid);
        dispatch({type: ACTION_TYPE.ADMIN_EMAIL_TEMPLATE_RESPONSE_SUCCESS, email: email.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_EMAIL_TEMPLATE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to get email template", e));
    }
};

export const sendAdminEmail = (contentid: string, emailType: string, roles: EmailUserRoles) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_REQUEST});
    try {
        await api.email.sendAdminEmail(contentid, emailType, roles);
        dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_RESPONSE_SUCCESS});
        dispatch(showToast({color: "success", title: "Email sent", body: "Email sent successfully", timeout: 3000}) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Sending email failed", e));
    }
};

export const sendAdminEmailWithIds = (contentid: string, emailType: string, ids: number[]) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_WITH_IDS_REQUEST});
    try {
        await api.email.sendAdminEmailWithIds(contentid, emailType, ids);
        dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_WITH_IDS_RESPONSE_SUCCESS});
        dispatch(showToast({color: "success", title: "Email sent", body: "Email sent successfully", timeout: 3000}) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_WITH_IDS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Sending email with ids failed", e));
    }
};

export const mergeUsers = (targetId: number, sourceId: number) => async (dispatch: Dispatch<Action>) => {
    let confirmMerge = window.confirm(`Are you sure you want to merge user ${sourceId} into user ${targetId}? This will delete user ${sourceId}.`);
    if (confirmMerge) {
        dispatch({type: ACTION_TYPE.ADMIN_MERGE_USERS_REQUEST});
        try {
            await api.admin.mergeUsers(targetId, sourceId);
            dispatch({type: ACTION_TYPE.ADMIN_MERGE_USERS_RESPONSE_SUCCESS});
            dispatch(showToast({
                color: "success",
                title: "Users merged",
                body: `User with id: ${sourceId} was merged into user with id: ${targetId}`,
                timeout: 3000
            }) as any);
        } catch (e) {
            dispatch({type: ACTION_TYPE.ADMIN_MERGE_USERS_RESPONSE_FAILURE});
            dispatch(showErrorToastIfNeeded("Merging users failed", e));
        }
    }
};

// Groups
export const loadGroups = (archivedGroupsOnly: boolean) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_REQUEST});
    try {
        const groups = await api.groups.get(archivedGroupsOnly);
        dispatch({type: ACTION_TYPE.GROUPS_RESPONSE_SUCCESS, groups: groups.data, archivedGroupsOnly});
    } catch (e) {
        dispatch(showErrorToastIfNeeded("Loading groups failed", e));
    }
};

export const selectGroup = (group: UserGroupDTO | null) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_SELECT, group});
};

export const createGroup = (groupName: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_CREATE_REQUEST});
    try {
        const newGroup = await api.groups.create(groupName);
        dispatch({type: ACTION_TYPE.GROUPS_CREATE_RESPONSE_SUCCESS, newGroup: newGroup.data});
        return newGroup.data as AppGroup;
    } catch (e) {
        dispatch(showErrorToastIfNeeded("Group creation failed", e));
        throw e;
    }
};

export const deleteGroup = (group: UserGroupDTO) => async (dispatch: Dispatch<any>) => {
    dispatch({type: ACTION_TYPE.GROUPS_DELETE_REQUEST});
    try {
        await api.groups.delete(group);
        dispatch({type: ACTION_TYPE.GROUPS_DELETE_RESPONSE_SUCCESS, deletedGroup: group});
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUPS_DELETE_RESPONSE_FAILURE, deletedGroup: group});
        dispatch(showErrorToastIfNeeded("Group deletion failed", e));
    }
};

export const updateGroup = (updatedGroup: UserGroupDTO, message?: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_UPDATE_REQUEST});
    try {
        await api.groups.update(updatedGroup);
        dispatch({type: ACTION_TYPE.GROUPS_UPDATE_RESPONSE_SUCCESS, updatedGroup: updatedGroup});
        dispatch(showToast({color: "success", title: "Group saved successfully", body: message, timeout: 3000}) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUPS_UPDATE_RESPONSE_FAILURE, updatedGroup: updatedGroup});
        dispatch(showErrorToastIfNeeded("Group saving failed", e));
    }
};

export const getGroupMembers = (group: UserGroupDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_REQUEST, group});
    try {
        const result = await api.groups.getMembers(group);
        dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_RESPONSE_SUCCESS, group: group, members: result.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_RESPONSE_FAILURE, group: group});
        dispatch(showErrorToastIfNeeded("Loading group members failed", e));
    }
};

export const getGroupToken = (group: AppGroup) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_TOKEN_REQUEST, group});
    try {
        const result = await api.authorisations.getToken(group.id as number);
        dispatch({type: ACTION_TYPE.GROUPS_TOKEN_RESPONSE_SUCCESS, group: group, token: result.data.token});
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUPS_TOKEN_RESPONSE_FAILURE, group: group});
        dispatch(showErrorToastIfNeeded("Loading group token failed", e));
    }
};

export const getGroupInfo = (group: AppGroup) => async (dispatch: ThunkDispatch<AppState, void, Action>) => {
    dispatch(getGroupMembers(group));
    dispatch(getGroupToken(group));
};

export const resetMemberPassword = (member: AppGroupMembership) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_RESET_PASSWORD_REQUEST, member});
    try {
        await api.users.passwordResetById(member.groupMembershipInformation.userId as number);
        dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_RESET_PASSWORD_RESPONSE_SUCCESS, member});
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_RESET_PASSWORD_RESPONSE_FAILURE, member});
        dispatch(showErrorToastIfNeeded("Failed to send password reset", e));
    }
};

export const deleteMember = (member: AppGroupMembership) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_DELETE_REQUEST, member});
    try {
        await api.groups.deleteMember(member);
        dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_DELETE_RESPONSE_SUCCESS, member});
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_DELETE_RESPONSE_FAILURE, member});
        dispatch(showErrorToastIfNeeded("Failed to delete member", e));
    }
};

export const addGroupManager = (group: AppGroup, managerEmail: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_MANAGER_ADD_REQUEST, group, managerEmail});
    try {
        const result = await api.groups.addManager(group, managerEmail);
        dispatch({type: ACTION_TYPE.GROUPS_MANAGER_ADD_RESPONSE_SUCCESS, group, managerEmail, newGroup: result.data});
        return true;
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUPS_MANAGER_ADD_RESPONSE_FAILURE, group, managerEmail});
        dispatch(showErrorToastIfNeeded("Group manager addition failed", e));
        return false;
    }
};

export const deleteGroupManager = (group: AppGroup, manager: UserSummaryWithEmailAddressDTO, showArchived?: boolean) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_MANAGER_DELETE_REQUEST, group, manager});
    try {
        await api.groups.deleteManager(group, manager);
        dispatch({type: ACTION_TYPE.GROUPS_MANAGER_DELETE_RESPONSE_SUCCESS, group, manager});
        if (isDefined(showArchived)) {
            dispatch(loadGroups(showArchived) as any);
        }
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUPS_MANAGER_DELETE_RESPONSE_FAILURE, group, manager});
        dispatch(showErrorToastIfNeeded("Group manager removal failed", e));
    }
};

export const showGroupEmailModal = (users?: number[]) => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(groupEmailModal(users)) as any);
};

export const showGroupInvitationModal = (firstTime: boolean) => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(groupInvitationModal(firstTime)) as any);
};

export const showAdditionalManagerSelfRemovalModal = (groupToModify: AppGroup, user: RegisteredUserDTO, showArchived: boolean) => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(additionalManagerRemovalModal({groupToModify, user, showArchived})) as any);
};

export const showGroupManagersModal = () => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    const state = getState();
    const group = selectors.groups.current(state);
    const user = state && state.user && state.user.loggedIn && state.user || null;
    const userIsOwner = group && user && group.ownerId == user.id || false;
    dispatch(openActiveModal(groupManagersModal(userIsOwner)) as any);
};

export const getGroupMemberships = (userId?: number) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.GROUP_GET_MEMBERSHIPS_REQUEST});
        const groupMembershipsResponse = await (userId ? api.groups.adminGetMemberships(userId) : api.groups.getMemberships());
        dispatch({
            type: ACTION_TYPE.GROUP_GET_MEMBERSHIPS_RESPONSE_SUCCESS,
            groupMemberships: groupMembershipsResponse.data
        });
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUP_GET_MEMBERSHIPS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Loading group memberships failed", e));
    }
};

export const changeMyMembershipStatus = (groupId: number, newStatus: MEMBERSHIP_STATUS) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.GROUP_CHANGE_MEMBERSHIP_STATUS_REQUEST});
        await api.groups.changeMyMembershipStatus(groupId, newStatus);
        dispatch({type: ACTION_TYPE.GROUP_CHANGE_MEMBERSHIP_STATUS_RESPONSE_SUCCESS, groupId, newStatus});
        dispatch(showToast({
            color: "success", title: "Status Updated", timeout: 5000,
            body: "You have updated your membership status."
        }) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUP_CHANGE_MEMBERSHIP_STATUS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Membership status update failed", e));
    }
};

export const getGroupProgress = (group: UserGroupDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUP_PROGRESS_REQUEST});
    try {
        const result = await api.groups.groupProgress(group);
        dispatch({type: ACTION_TYPE.GROUP_PROGRESS_RESPONSE_SUCCESS, groupId: group.id || 0, progress: result.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUP_PROGRESS_RESPONSE_FAILURE, groupId: group.id || 0});
        dispatch(showErrorToastIfNeeded("Loading group members failed", e));
    }
};

// Gameboards
export const loadBoards = (startIndex: number, limit: ActualBoardLimit, sort: BoardOrder) => async (dispatch: Dispatch<Action>) => {
    const accumulate = startIndex != 0;
    dispatch({type: ACTION_TYPE.BOARDS_REQUEST, accumulate});
    try {
        const boards = await api.boards.get(startIndex, limit, sort);
        dispatch({type: ACTION_TYPE.BOARDS_RESPONSE_SUCCESS, boards: boards.data, accumulate});
    } catch (e) {
        dispatch(showErrorToastIfNeeded("Loading gameboards failed", e));
    }
};

export const loadGroupsForBoard = (board: GameboardDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.BOARDS_GROUPS_REQUEST, board});
    try {
        const result = await api.boards.getGroupsForBoard(board);
        dispatch({type: ACTION_TYPE.BOARDS_GROUPS_RESPONSE_SUCCESS, board, groups: result.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.BOARDS_GROUPS_RESPONSE_FAILURE, board});
        dispatch(showErrorToastIfNeeded("Loading groups for gameboard failed", e));
    }
};

export const deleteBoard = (board: AppGameBoard) => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    const reduxState = getState();
    dispatch({type: ACTION_TYPE.BOARDS_DELETE_REQUEST, board});
    try {
        await loadGroupsForBoard(board);
        const hasAssignedGroups = board.assignedGroups && board.assignedGroups.length > 0;
        if (hasAssignedGroups) {
            if (reduxState && reduxState.user && reduxState.user.loggedIn && (reduxState.user.role == "ADMIN" || reduxState.user.role == "EVENT_MANAGER")) {
                if (!confirm(`Warning: You currently have groups assigned to ${board.title}. If you delete this your groups will still be assigned but you won't be able to unassign them or see the gameboard in your assigned gameboards or 'My gameboards' page.`)) {
                    return;
                }
            } else {
                showToast({color: "failure", title: "Gameboard Deletion Not Allowed", body: `You have groups assigned to ${board.title}. To delete this gameboard, you must unassign all groups.`, timeout: 5000});
                return;
            }
        }
        await api.boards.delete(board);
        dispatch({type: ACTION_TYPE.BOARDS_DELETE_RESPONSE_SUCCESS, board});
        dispatch(showToast({color: "success", title: "Gameboard deleted", body: "You have deleted gameboard " + board.title, timeout: 5000}) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.BOARDS_DELETE_RESPONSE_FAILURE, board});
        dispatch(showErrorToastIfNeeded("Gameboard deletion failed", e));
    }
};

export const unassignBoard = (board: GameboardDTO, group: UserGroupDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.BOARDS_UNASSIGN_REQUEST, board, group});
    try {
        await api.boards.unassign(board, group);
        dispatch({type: ACTION_TYPE.BOARDS_UNASSIGN_RESPONSE_SUCCESS, board, group});
        dispatch(showToast({color: "success", title: "Assignment deleted", body: "This assignment has been unset successfully.", timeout: 5000}) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.BOARDS_UNASSIGN_RESPONSE_FAILURE, board, group});
        dispatch(showErrorToastIfNeeded("Assignment deletion failed", e));
    }
};

export const assignBoard = (board: GameboardDTO, groupId?: number, dueDate?: Date, notes?: string) => async (dispatch: Dispatch<Action>) => {
    if (groupId == null) {
        dispatch(showToast({color: "danger", title: "Board assignment failed", body: "Error: Please choose a group.", timeout: 5000}) as any);
        return false;
    }

    let dueDateUTC = undefined;
    if (dueDate != undefined) {
        dueDateUTC = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        let today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if ((dueDateUTC - today.valueOf()) < 0) {
            dispatch(showToast({color: "danger", title: "Gameboard assignment failed", body: "Error: Due date cannot be in the past.", timeout: 5000}) as any);
            return false;
        }
    }

    const assignment = {board, groupId, dueDate: dueDateUTC, notes};

    dispatch({type: ACTION_TYPE.BOARDS_ASSIGN_REQUEST, ...assignment});
    try {
        await api.boards.assign(board, groupId, dueDateUTC, notes);
        dispatch({type: ACTION_TYPE.BOARDS_ASSIGN_RESPONSE_SUCCESS, ...assignment});
        dispatch(showToast({color: "success", title: "Assignment saved", body: "This assignment has been saved successfully.", timeout: 5000}) as any);
        return true;
    } catch (e) {
        dispatch({type: ACTION_TYPE.BOARDS_ASSIGN_RESPONSE_FAILURE, ...assignment});
        dispatch(showErrorToastIfNeeded("Gameboard assignment failed", e));
        return false;
    }
};

export const loadBoard = (boardId: string) => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    const state = getState();
    if (state && state.boards && state.boards.boards && state.boards.boards.boards) {
        const board = state.boards.boards.boards.find(board => board.id == boardId);
        if (board && board.questions && board.questions.every(q => q.questionPartsTotal !== undefined)) {
            // Don't load the board if it is already available and questions have been loaded
            return;
        }
    }
    const accumulate = true;
    dispatch({type: ACTION_TYPE.BOARDS_REQUEST, accumulate});
    const board = await api.boards.getById(boardId);
    dispatch({
        type: ACTION_TYPE.BOARDS_RESPONSE_SUCCESS,
        boards: {totalResults: undefined, results: [board.data]},
        accumulate
    });
};

// Events
export const clearEventsList = {type: ACTION_TYPE.EVENTS_CLEAR};

export const getEvent = (eventId: string) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EVENT_REQUEST});
        const augmentedEvent = augmentEvent((await api.events.get(eventId)).data);
        dispatch({type: ACTION_TYPE.EVENT_RESPONSE_SUCCESS, augmentedEvent});
    } catch (e) {
        dispatch({type: ACTION_TYPE.EVENT_RESPONSE_FAILURE});
    }
};

export const getEventsList = (startIndex: number, eventsPerPage: number, typeFilter: EventTypeFilter, statusFilter: EventStatusFilter) => async (dispatch: Dispatch<Action>) => {
    const filterTags = typeFilter !== EventTypeFilter["All events"] ? typeFilter : null;
    const showActiveOnly = statusFilter === EventStatusFilter["Upcoming events"];
    const showBookedOnly = statusFilter === EventStatusFilter["My booked events"];
    const showReservedOnly = statusFilter === EventStatusFilter["My event reservations"];
    const showInactiveOnly = false;
    try {
        dispatch({type: ACTION_TYPE.EVENTS_REQUEST});
        const response = await api.events.getEvents(startIndex, eventsPerPage, filterTags, showActiveOnly, showInactiveOnly, showBookedOnly, showReservedOnly);
        const augmentedEvents = response.data.results.map(event => augmentEvent(event));
        dispatch({type: ACTION_TYPE.EVENTS_RESPONSE_SUCCESS, augmentedEvents: augmentedEvents, total: response.data.totalResults});
    } catch (e) {
        dispatch({type: ACTION_TYPE.EVENTS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Events request failed", e));
    }
};

export const getEventsPodList = (numberOfEvents: number) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch(clearEventsList as any);
        dispatch({type: ACTION_TYPE.EVENTS_REQUEST});
        const getActive = true;
        const eventsResponse = await api.events.getFirstN(numberOfEvents, getActive);
        if (eventsResponse.data.totalResults < numberOfEvents) {
            const numberOfRemainingEvents = numberOfEvents - eventsResponse.data.totalResults;
            const inactiveEventsResponse = await api.events.getFirstN(numberOfRemainingEvents, !getActive);
            eventsResponse.data.results.push(...inactiveEventsResponse.data.results);
        }
        const augmentedEvents = eventsResponse.data.results.map(event => augmentEvent(event));
        dispatch({type: ACTION_TYPE.EVENTS_RESPONSE_SUCCESS, augmentedEvents: augmentedEvents, total: augmentedEvents.length});
    } catch (e) {
        dispatch({type: ACTION_TYPE.EVENTS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Unable to display events", e));
    }
};

export const getNewsPodList = (subject: string) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.NEWS_REQUEST});
        const response = await api.news.get(subject);
        const newsList = response.data.results;
        dispatch({type: ACTION_TYPE.NEWS_RESPONSE_SUCCESS, theNews: newsList})
    } catch (e) {
        dispatch({type: ACTION_TYPE.NEWS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Unable to display news", e));
    }
};

export const getEventOverviews = (eventOverviewFilter: EventOverviewFilter) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EVENT_OVERVIEWS_REQUEST});
        const response = await api.events.getEventOverviews(eventOverviewFilter);
        // We ignore response.data.total because we do not currently page the results of event overviews
        dispatch({type: ACTION_TYPE.EVENT_OVERVIEWS_RESPONSE_SUCCESS, eventOverviews: response.data.results});
    } catch (error) {
        dispatch({type: ACTION_TYPE.EVENT_OVERVIEWS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to load event overviews", error) as any);
    }
};

export const getEventMapData = (startIndex: number, eventsPerPage: number, typeFilter: EventTypeFilter, statusFilter: EventStatusFilter) => async (dispatch: Dispatch<Action>) => {
    const filterTags = typeFilter !== EventTypeFilter["All events"] ? typeFilter : null;
    const showActiveOnly = statusFilter === EventStatusFilter["Upcoming events"];
    const showBookedOnly = statusFilter === EventStatusFilter["My booked events"];
    const showInactiveOnly = false;
    try {
        dispatch({type: ACTION_TYPE.EVENT_MAP_DATA_REQUEST});
        const response = await api.events.getEventMapData(startIndex, eventsPerPage, filterTags, showActiveOnly, showInactiveOnly, showBookedOnly);
        dispatch({
            type: ACTION_TYPE.EVENT_MAP_DATA_RESPONSE_SUCCESS,
            eventMapData: response.data.results,
            total: response.data.totalResults
        });
    } catch (e) {
        dispatch({type: ACTION_TYPE.EVENT_MAP_DATA_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Event map data request failed", e));
    }
};

export const getEventBookings = (eventId: string) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EVENT_BOOKINGS_REQUEST});
        const response = await api.eventBookings.getEventBookings(eventId);
        dispatch({type: ACTION_TYPE.EVENT_BOOKINGS_RESPONSE_SUCCESS, eventBookings: response.data});
        const userIds = response.data.map(booking => booking.userBooked && booking.userBooked.id) as number[];
        if (atLeastOne(userIds.length)) {
            dispatch(getUserIdSchoolLookup(userIds) as any);
        }
    } catch (error) {
        dispatch({type: ACTION_TYPE.EVENT_BOOKINGS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to load event bookings", error) as any);
    }
};

export const getEventBookingsForGroup = (eventId: string, groupId: number) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EVENT_BOOKINGS_FOR_GROUP_REQUEST});
        const response = await api.eventBookings.getEventBookingsForGroup(eventId, groupId);
        dispatch({type: ACTION_TYPE.EVENT_BOOKINGS_FOR_GROUP_RESPONSE_SUCCESS, eventBookingsForGroup: response.data});
    } catch (error) {
        dispatch({type: ACTION_TYPE.EVENT_BOOKINGS_FOR_GROUP_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to load event bookings", error) as any);
    }
};

export const getEventBookingsForAllGroups = (eventId: string) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EVENT_BOOKINGS_FOR_ALL_GROUPS_REQUEST});
        const response = await api.eventBookings.getEventBookingsForAllGroups(eventId);
        dispatch({type: ACTION_TYPE.EVENT_BOOKINGS_FOR_ALL_GROUPS_RESPONSE_SUCCESS, eventBookingsForAllGroups: response.data});
    } catch (error) {
        dispatch({type: ACTION_TYPE.EVENT_BOOKINGS_FOR_ALL_GROUPS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to load event bookings", error) as any);
    }
};

export const getEventBookingCSV = (eventId: string) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_CSV_REQUEST});
        const response = await api.eventBookings.getEventBookingCSV(eventId);
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_CSV_RESPONSE_SUCCESS, eventBookingCSV: response.data});
    } catch (error) {
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_CSV_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to load event booking csv", error) as any);
    }
};

export const bookMyselfOnEvent = (eventId: string, additionalInformation: AdditionalInformation) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_REQUEST});
        await api.eventBookings.bookMyselfOnEvent(eventId, additionalInformation);
        await dispatch(getEvent(eventId) as any);
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_RESPONSE_SUCCESS});
        dispatch(showToast({
            title: "Event booking confirmed", body: "You have been successfully booked onto this event.",
            color: "success", timeout: 5000, closable: false,
        }) as any);
    } catch (error) {
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Event booking failed", error) as any);
    }
};

export const reserveUsersOnEvent = (eventId: string, userIds: number[], groupId: number) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EVENT_RESERVATION_REQUEST});
        await api.eventBookings.reserveUsersOnEvent(eventId, userIds);
        await dispatch(getEventBookingsForGroup(eventId, groupId) as any);
        await dispatch(getEvent(eventId) as any);
        dispatch({type: ACTION_TYPE.EVENT_RESERVATION_RESPONSE_SUCCESS});
        dispatch(showToast({
            title: "Reservations confirmed", body: "You have successfully reserved students onto this event.",
            color: "success", timeout: 5000, closable: false,
        }) as any);
    } catch (error) {
        dispatch({type: ACTION_TYPE.EVENT_RESERVATION_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Reservation failed", error) as any);
    }
};

export const cancelReservationsOnEvent = (eventId: string, userIds: number[], groupId: number | undefined) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({ type: ACTION_TYPE.CANCEL_EVENT_RESERVATIONS_REQUEST});
        await api.eventBookings.cancelUsersReservationsOnEvent(eventId, userIds);
        if (isDefined(groupId)) {
            await dispatch(getEventBookingsForGroup(eventId, groupId) as any);
        } else {
            await dispatch(getEventBookingsForAllGroups(eventId) as any);
        }
        await dispatch(getEvent(eventId) as any);
        dispatch({ type: ACTION_TYPE.CANCEL_EVENT_RESERVATIONS_RESPONSE_SUCCESS});
        dispatch(showToast({
            title: "Reservations cancelled", body: "You have successfully cancelled students reservations for this event.",
            color: "success", timeout: 5000, closable: false,
        }) as any);
    } catch (error) {
        dispatch({ type: ACTION_TYPE.CANCEL_EVENT_RESERVATIONS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Unable to cancel some of the reservations", error) as any);
    }
};

export const addMyselfToWaitingList = (eventId: string, additionalInformation: AdditionalInformation) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_WAITING_LIST_REQUEST});
        await api.eventBookings.addMyselfToWaitingList(eventId, additionalInformation);
        await dispatch(getEvent(eventId) as any);
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_WAITING_LIST_RESPONSE_SUCCESS});
        dispatch(showToast({
            title: "Waiting list booking confirmed", body: "You have been successfully added to the waiting list for this event.",
            color: "success", timeout: 5000, closable: false,
        }) as any);
        dispatch(getEvent(eventId) as any);
    } catch (error) {
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_WAITING_LIST_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Event booking failed", error) as any);
    }
};

export const cancelMyBooking = (eventId: string) => async (dispatch: Dispatch<Action>) => {
    let cancel = window.confirm('Are you sure you want to cancel your booking on this event. You may not be able to re-book, especially if there is a waiting list.');
    if (cancel) {
        try {
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_SELF_CANCELLATION_REQUEST});
            await api.eventBookings.cancelMyBooking(eventId);
            await dispatch(getEvent(eventId) as any);
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_SELF_CANCELLATION_RESPONSE_SUCCESS});
            dispatch(showToast({
                title: "Your booking has been cancelled", body: "Your booking has successfully been cancelled.",
                color: "success", timeout: 5000, closable: false,
            }) as any);
            dispatch(getEvent(eventId) as any);
        } catch (error) {
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_SELF_CANCELLATION_RESPONSE_FAILURE});
            dispatch(showErrorToastIfNeeded("Event booking cancellation failed", error) as any);
        }
    }
};

export const bookUserOnEvent = (eventBookingId: string, userId: number, additionalInformation: AdditionalInformation) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_USER_REQUEST});
        await api.eventBookings.bookUserOnEvent(eventBookingId, userId, additionalInformation);
        dispatch(getEventBookings(eventBookingId) as any);
        dispatch(closeActiveModal() as any);
        dispatch(showToast({
            title: "Booking successful", body: `A booking has been created.`,
            color: "success", timeout: 5000, closable: false,
        }) as any);
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_USER_RESPONSE_SUCCESS});
    } catch (error) {
        dispatch({type: ACTION_TYPE.EVENT_BOOKING_USER_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Event booking failed", error) as any);
    }
};

export const resendUserConfirmationEmail = (eventBookingId: string, userId?: number) => async (dispatch: Dispatch<Action>) => {
    const resendEmail = window.confirm('Are you sure you want to resend the confirmation email for this booking?');
    if (resendEmail && userId) {
        try {
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_RESEND_EMAIL_REQUEST});
            await api.eventBookings.resendUserConfirmationEmail(eventBookingId, userId);
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_RESEND_EMAIL_RESPONSE_SUCCESS});
            dispatch(showToast({
                color: "success", closable: false, timeout: 5000,
                title: "Event email sent", body: `Email sent to ${userId}`
            }) as any);
        } catch (error) {
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_RESEND_EMAIL_RESPONSE_FAILURE});
            dispatch(showErrorToastIfNeeded("Failed to resend email for event booking", error) as any);
        }
    }
};

export const promoteUserBooking = (eventBookingId: string, userId?: number) => async (dispatch: Dispatch<Action>) => {
    const promote = window.confirm('Are you sure you want to convert this to a confirmed booking?');
    if (promote && userId) {
        try {
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_PROMOTION_REQUEST});
            await api.eventBookings.promoteUserBooking(eventBookingId, userId);
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_PROMOTION_RESPONSE_SUCCESS});
            dispatch(getEventBookings(eventBookingId) as any);
        } catch (error) {
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_PROMOTION_RESPONSE_FAILURE});
            dispatch(showErrorToastIfNeeded("Failed to promote event booking", error) as any);
        }
    }
};

export const cancelUserBooking = (eventBookingId: string, userId?: number) => async (dispatch: Dispatch<Action>) => {
    const cancelBooking = window.confirm('Are you sure you want to cancel this booking?');
    if (cancelBooking && userId) {
        try {
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_CANCELLATION_REQUEST});
            await api.eventBookings.cancelUserBooking(eventBookingId, userId);
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_CANCELLATION_RESPONSE_SUCCESS});
            dispatch(getEventBookings(eventBookingId) as any);
        } catch (error) {
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_CANCELLATION_RESPONSE_FAILURE});
            dispatch(showErrorToastIfNeeded("Failed to cancel event booking", error) as any);
        }
    }
};

export const deleteUserBooking = (eventBookingId: string, userId?: number) => async (dispatch: Dispatch<Action>) => {
    const deleteBooking = window.confirm('Are you sure you want to delete this booking permanently?');
    if (deleteBooking && userId) {
        try {
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_DELETION_REQUEST});
            await api.eventBookings.deleteUserBooking(eventBookingId, userId);
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_DELETION_RESPONSE_SUCCESS});
            dispatch(getEventBookings(eventBookingId) as any);
        } catch (error) {
            dispatch({type: ACTION_TYPE.EVENT_BOOKING_DELETION_RESPONSE_FAILURE});
            dispatch(showErrorToastIfNeeded("Failed to un-book user from event", error) as any);
        }
    }
};

export const recordEventAttendance = (eventId: string, userId: number, attendance: ATTENDANCE) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.EVENT_RECORD_ATTENDANCE_REQUEST});
        await api.eventBookings.recordEventAttendance(eventId, userId, attendance);
        dispatch({type: ACTION_TYPE.EVENT_RECORD_ATTENDANCE_RESPONSE_SUCCESS});
        dispatch(getEventBookings(eventId) as any);
    } catch (error) {
        dispatch({type: ACTION_TYPE.EVENT_RECORD_ATTENDANCE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to record event attendance", error) as any);
    }
};

// Content errors
export const getAdminContentErrors = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.ADMIN_CONTENT_ERRORS_REQUEST});
    try {
        const errorsResponse = await api.admin.getContentErrors();
        dispatch({type: ACTION_TYPE.ADMIN_CONTENT_ERRORS_RESPONSE_SUCCESS, errors: errorsResponse.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_CONTENT_ERRORS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Loading Content Errors Failed", e));
    }
};

export const setPrintingHints = (hintsEnabled: boolean) => (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.PRINTING_SET_HINTS, hintsEnabled});
};

// Concepts
export const fetchConcepts = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.CONCEPTS_REQUEST});
    try {
        const concepts = await api.concepts.list();
        dispatch({type: ACTION_TYPE.CONCEPTS_RESPONSE_SUCCESS, concepts: concepts.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.CONCEPTS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Loading Concepts Failed", e));
    }};

// Fasttrack concepts
export const fetchFasttrackConcepts = (gameboardId: string, concept: string, upperQuestionId: string) => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    dispatch({type: ACTION_TYPE.FASTTRACK_CONCEPTS_REQUEST});
    try {
        const concepts = await api.fasttrack.concepts(gameboardId, concept, upperQuestionId);
        dispatch({type: ACTION_TYPE.FASTTRACK_CONCEPTS_RESPONSE_SUCCESS, concepts: {gameboardId, concept, items: concepts.data}});
    } catch (e) {
        dispatch({type: ACTION_TYPE.FASTTRACK_CONCEPTS_RESPONSE_FAILURE});
    }};

// Main anchor
export const setMainContentId = (id: string) => ({type: ACTION_TYPE.SET_MAIN_CONTENT_ID, id});

// SERVICE ACTIONS (w/o dispatch)
export const changePage = (path: string) => {
    history.push(path);
};

export const registerPageChange = (path: string) => {
    store.dispatch({type: ACTION_TYPE.ROUTER_PAGE_CHANGE, path});
};

export const handleServerError = () => {
    store.dispatch({type: ACTION_TYPE.API_SERVER_ERROR});
};

export const handleApiGoneAway = () => {
    store.dispatch({type: ACTION_TYPE.API_GONE_AWAY});
};

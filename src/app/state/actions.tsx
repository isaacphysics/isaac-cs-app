import {api} from "../services/api";
import {Dispatch} from "react";
import {AppState} from "./reducers";
import {history} from "../services/history";
import {store} from "./store";
import {
    ACTION_TYPE,
    API_REQUEST_FAILURE_MESSAGE,
    DOCUMENT_TYPE,
    MEMBERSHIP_STATUS,
    TAG_ID
} from "../services/constants";
import {
    Action,
    ActiveModal,
    ActualBoardLimit,
    AppGroup,
    AppGroupMembership,
    BoardOrder,
    EmailUserRoles,
    LoggedInUser,
    LoggedInValidationUser,
    Toast,
    UserPreferencesDTO,
    ValidatedChoice,
} from "../../IsaacAppTypes";
import {
    AssignmentDTO,
    AuthenticationProvider,
    ChoiceDTO,
    GameboardDTO,
    QuestionDTO,
    RegisteredUserDTO,
    Role,
    UserGroupDTO,
    UserSummaryDTO,
    UserSummaryWithEmailAddressDTO
} from "../../IsaacApiTypes";
import {
    releaseAllConfirmationModal,
    releaseConfirmationModal,
    revocationConfirmationModal,
    tokenVerificationModal
} from "../components/elements/TeacherConnectionModalCreators";
import * as persistence from "../services/localStorage";
import {KEY} from "../services/localStorage";
import {groupInvitationModal, groupManagersModal} from "../components/elements/GroupsModalCreators";
import {ThunkDispatch} from "redux-thunk";
import {groups} from "./selectors";
import {isFirstLoginInPersistence} from "../services/firstLogin";
import {AxiosError} from "axios";
import {isTeacher} from "../services/user";
import ReactGA from "react-ga";

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

function showErrorToastIfNeeded(error: string, e: any) {
    if (e) {
        if (e.response) {
            if (e.response.status < 500) {
                return showToast({
                    color: "danger", title: error, timeout: 5000,
                    body: extractMessage(e),
                }) as any;
            }
        } else {
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

function isAxiosError(e: Error): e is AxiosError {
    return 'isAxiosError' in e && (e as AxiosError).isAxiosError;
}

function extractMessage(e: Error) {
    if (isAxiosError(e)) {
        if (e.response) {
            return e.response.data.errorMessage;
        }
    }
    return API_REQUEST_FAILURE_MESSAGE;
}

// User Authentication
export const getUserAuthSettings = () => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_AUTH_SETTINGS_REQUEST});
    try {
        const authenticationSettings = await api.authentication.getCurrentUserAuthSettings();
        dispatch({type: ACTION_TYPE.USER_AUTH_SETTINGS_RESPONSE_SUCCESS, userAuthSettings: authenticationSettings.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_AUTH_SETTINGS_RESPONSE_FAILURE, errorMessage: extractMessage(e)});
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

export const setAnonUserPreferences = (userPreferences: UserPreferencesDTO) => {
    return {type: ACTION_TYPE.USER_PREFERENCES_SET_FOR_ANON, userPreferences};
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

// TODO scope for pulling out a separate registerUser method from this
export const updateCurrentUser = (
    updatedUser: LoggedInValidationUser,
    updatedUserPreferences: UserPreferencesDTO,
    passwordCurrent: string | null,
    currentUser: LoggedInUser
) => async (dispatch: Dispatch<Action>) => {
    // Confirm email change
    if (currentUser.loggedIn && updatedUser.loggedIn && currentUser.email !== updatedUser.email) {
        const emailChangeConfirmed = window.confirm(
            "You have edited your email address. Your current address will continue to work until you verify your " +
            "new address by following the verification link sent to it via email. Continue?"
        );
        if (!emailChangeConfirmed) {
            dispatch(showToast({
                title: "Account settings not updated", body: "Your account settings update was cancelled.", color: "danger", timeout: 5000, closable: false,
            }) as any);
            return; //early
        }
    }

    try {
        dispatch({type: ACTION_TYPE.USER_DETAILS_UPDATE_REQUEST});
        const currentUser = await api.users.updateCurrent(updatedUser, updatedUserPreferences, passwordCurrent);
        dispatch({type: ACTION_TYPE.USER_DETAILS_UPDATE_RESPONSE_SUCCESS, user: currentUser.data});
        await dispatch(requestCurrentUser() as any);

        const isFirstLogin = updatedUser.loggedIn && isFirstLoginInPersistence() || false;
        if (isFirstLogin) {
            const afterAuthPath = persistence.load(KEY.AFTER_AUTH_PATH) || '';
            persistence.remove(KEY.AFTER_AUTH_PATH);
            if ((afterAuthPath).includes('account')) {
                history.push(afterAuthPath, {firstLogin: isFirstLogin})
            }
            history.push('/account', {firstLogin: isFirstLogin});
        }
        dispatch(showToast({
            title: "Account settings updated",
            body: "Your account settings were updated successfully.",
            color: "success",
            timeout: 5000,
            closable: false,
        }) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_DETAILS_UPDATE_RESPONSE_FAILURE, errorMessage: extractMessage(e)});
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

export const logInUser = (provider: AuthenticationProvider, params: {email: string; password: string}) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.USER_LOG_IN_REQUEST, provider});
    const afterAuthPath = persistence.load(KEY.AFTER_AUTH_PATH) || '/';
    persistence.remove(KEY.AFTER_AUTH_PATH);
    try {
        const result = await api.authentication.login(provider, params);
        await dispatch(requestCurrentUser() as any); // Request user preferences
        dispatch({type: ACTION_TYPE.USER_LOG_IN_RESPONSE_SUCCESS, user: result.data});
        history.push(afterAuthPath);
    } catch (e) {
        dispatch({type: ACTION_TYPE.USER_LOG_IN_RESPONSE_FAILURE, errorMessage: (e.response) ? extractMessage(e) : API_REQUEST_FAILURE_MESSAGE})
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
        const response = await api.users.verifyPasswordReset(token);
        dispatch({type: ACTION_TYPE.USER_INCOMING_PASSWORD_RESET_SUCCESS});
    } catch(e) {
        dispatch({type:ACTION_TYPE.USER_INCOMING_PASSWORD_RESET_FAILURE, errorMessage: extractMessage(e)});
    }
};

export const handlePasswordReset = (params: {token: string | null; password: string | null}) => async (dispatch: Dispatch<Action>) => {
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
            history.push('/account')
        } else {
            history.push(nextPage);
        }
    } catch (error) {
        history.push({pathname: "/auth_error", state: {errorMessage: isAxiosError(error) ? extractMessage(error) : API_REQUEST_FAILURE_MESSAGE}});
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
    } catch(e) {
        dispatch({type:ACTION_TYPE.EMAIL_AUTHENTICATION_RESPONSE_FAILURE, errorMessage: extractMessage(e)});
    }
};

// Contact Us
export const submitMessage = (extra: any, params: {firstName: string; lastName: string; emailAddress: string; subject: string; message: string }) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.CONTACT_FORM_SEND_REQUEST});
    try {
        await api.contactForm.send(extra, params);
        dispatch({type: ACTION_TYPE.CONTACT_FORM_SEND_RESPONSE_SUCCESS})
    } catch (e) {
        const errorMessage = extractMessage(e);
        dispatch({type: ACTION_TYPE.CONTACT_FORM_SEND_RESPONSE_FAILURE, errorMessage: errorMessage});
        dispatch(showErrorToastIfNeeded(errorMessage, e));
    }
};

// Teacher Connections
export const getActiveAuthorisations = () => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_ACTIVE_REQUEST});
        const authorisationsResponse = await api.authorisations.get();
        dispatch({
            type: ACTION_TYPE.AUTHORISATIONS_ACTIVE_RESPONSE_SUCCESS,
            authorisations: authorisationsResponse.data
        });
    } catch (e) {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_ACTIVE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Loading authorised teachers failed", e));
    }
};

export const authenticateWithTokenAfterPrompt = (userSubmittedAuthenticationToken: string | null) => async (dispatch: Dispatch<Action>) => {
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

        dispatch({type: ACTION_TYPE.AUTHORISATIONS_TOKEN_OWNER_REQUEST})
        const result = await api.authorisations.getTokenOwner(authenticationToken);
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_TOKEN_OWNER_RESPONSE_SUCCESS});
        const usersToGrantAccess = result.data;

        // TODO can use state (second thunk param) to highlight teachers who have already been granted access
        // const toGrantIds = usersToGrantAccess && usersToGrantAccess.map(u => u.id);
        // const state = getState();
        // const usersAlreadyAuthorised = (state && state.activeAuthorisations && state.activeAuthorisations
        //     .filter((currentAuthorisation) => (toGrantIds as number[]).includes(currentAuthorisation.id as number)));

        dispatch(openActiveModal(tokenVerificationModal(authenticationToken, usersToGrantAccess)) as any);
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
        dispatch(getMyGroupMemberships() as any);
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

export const revokeAuthorisationAfterPrompt = (user: UserSummaryWithEmailAddressDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(revocationConfirmationModal(user)) as any);
};
export const revokeAuthorisation = (userToRevoke: UserSummaryWithEmailAddressDTO) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_REVOKE_REQUEST});
        await api.authorisations.revoke(userToRevoke.id as number);
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_REVOKE_RESPONSE_SUCCESS});
        dispatch(showToast({
            color: "success", title: "Access revoked", timeout: 5000,
            body: "You have revoked access to your data."
        }) as any)
        dispatch(getActiveAuthorisations() as any);
        dispatch(closeActiveModal() as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_REVOKE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Revoke operation failed", e));
    }
};

// Student/Other Connections
export const getStudentAuthorisations = () => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_OTHER_USERS_REQUEST});
        const otherUserAuthorisationsResponse = await api.authorisations.getOtherUsers();
        dispatch({
            type: ACTION_TYPE.AUTHORISATIONS_OTHER_USERS_RESPONSE_SUCCESS,
            otherUserAuthorisations: otherUserAuthorisationsResponse.data
        });
    } catch (e) {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_OTHER_USERS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Loading authorised students failed", e));
    }
};

export const releaseAuthorisationAfterPrompt = (student: UserSummaryDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(releaseConfirmationModal(student)) as any);
};
export const releaseAuthorisation = (student: UserSummaryDTO) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_RELEASE_USER_REQUEST});
        await api.authorisations.release(student.id as number);
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_RELEASE_USER_RESPONSE_SUCCESS});
        dispatch(getStudentAuthorisations() as any);
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

export const releaseAllAuthorisationsAfterPrompt = () => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(releaseAllConfirmationModal()) as any);
};
export const releaseAllAuthorisations = () => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_RELEASE_ALL_USERS_REQUEST});
        await api.authorisations.releaseAll();
        dispatch({type: ACTION_TYPE.AUTHORISATIONS_RELEASE_ALL_USERS_RESPONSE_SUCCESS});
        dispatch(getStudentAuthorisations() as any);
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
}

// Document & Topic Fetch
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


// Questions
export const registerQuestion = (question: QuestionDTO) => (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.QUESTION_REGISTRATION, question});
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
        if (e.response && e.response.status == 429) {
            const lock = new Date((new Date()).getTime() + timePeriod);

            dispatch({type: ACTION_TYPE.QUESTION_ATTEMPT_RESPONSE_FAILURE, questionId, lock});
            dispatch(showToast({
                color: "danger", title: "Too many attempts", timeout: 10000,
                body: "You have made too many attempts at this question. Please try again later!"
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

// Current Gameboard
export const loadGameboard = (gameboardId: string|null) => async (dispatch: Dispatch<Action>) => {
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

export const addGameboard = (gameboardId: string, user: LoggedInUser) => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.GAMEBOARD_ADD_REQUEST});
        await api.gameboards.save(gameboardId);
        dispatch({type: ACTION_TYPE.GAMEBOARD_ADD_RESPONSE_SUCCESS});
        if (isTeacher(user)) {
            history.push(`/set_assignments#${gameboardId}`);
        } else {
            // FIXME - update this to be correct when My Boards is launched!
            history.push(`/gameboards#${gameboardId}`);
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error saving gameboard.");
        dispatch({type: ACTION_TYPE.GAMEBOARD_ADD_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Error saving gameboard", e));
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
        dispatch(showErrorToastIfNeeded("Failed to get Content Version", e));
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
export const fetchSearch = (query: string, types: string) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.SEARCH_REQUEST, query, types});
    try {
        if (query === "") {
            return;
        }
        const searchResponse = await api.search.get(query, types);
        dispatch({type: ACTION_TYPE.SEARCH_RESPONSE_SUCCESS, searchResults: searchResponse.data});
    } catch (e) {
        dispatch(showErrorToastIfNeeded("Search Failed", e));
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
        dispatch(showErrorToastIfNeeded("User Search Failed", e));
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
                title: "User Deleted",
                body: "The selected user was successfully deleted.",
                color: "success",
                timeout: 5000,
                closable: false,
            }) as any);
        }
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_USER_DELETE_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("User Deletion Failed", e));
    }
};

export const adminModifyUserRoles = (role: Role, userIds: number[]) => async (dispatch: Dispatch<Action|((d: Dispatch<Action>) => void)>) => {
    dispatch({type: ACTION_TYPE.ADMIN_MODIFY_ROLES_REQUEST});
    try {
        await api.admin.modifyUserRoles.post(role, userIds);
        dispatch({type: ACTION_TYPE.ADMIN_MODIFY_ROLES_RESPONSE_SUCCESS});
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_MODIFY_ROLES_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("User Role Modification Failed", e));
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
        dispatch({type: ACTION_TYPE.ADMIN_EMAIL_TEMPLATE_REQUEST_SUCCESS, email: email.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_EMAIL_TEMPLATE_REQUEST_FAILURE});
        dispatch(showErrorToastIfNeeded("Failed to get email template", e));
    }
};

export const sendAdminEmail = (contentid: string, emailType: string, roles: EmailUserRoles) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_REQUEST});
    try {
        await api.email.sendAdminEmail(contentid, emailType, roles);
        dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_REQUEST_SUCCESS});
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_REQUEST_FAILURE});
        dispatch(showErrorToastIfNeeded("Sending mail failed", e));
    }
};

export const sendAdminEmailWithIds = (contentid: string, emailType: string, ids: number[]) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_WITH_IDS_REQUEST});
    try {
        await api.email.sendAdminEmailWithIds(contentid, emailType, ids);
        dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_WITH_IDS_REQUEST_SUCCESS});
    } catch (e) {
        dispatch({type: ACTION_TYPE.ADMIN_SEND_EMAIL_WITH_IDS_REQUEST_FAILURE});
        dispatch(showErrorToastIfNeeded("Sending mail with ids failed", e));
    }
};

// Groups

export const loadGroups = (archivedGroupsOnly: boolean) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_REQUEST});
    try {
        const groups = await api.groups.get(archivedGroupsOnly);
        dispatch({type: ACTION_TYPE.GROUPS_RESPONSE_SUCCESS, groups: groups.data, archivedGroupsOnly});
    } catch (e) {
        dispatch(showErrorToastIfNeeded("Loading Groups Failed", e));
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
        dispatch(showErrorToastIfNeeded("Creating a Group Failed", e));
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
        dispatch(showErrorToastIfNeeded("Deleting a Group Failed", e));
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
        dispatch(showErrorToastIfNeeded("Group Saving Failed", e));
    }
};

export const getGroupMembers = (group: UserGroupDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_REQUEST, group});
    try {
        const result = await api.groups.getMembers(group);
        dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_RESPONSE_SUCCESS, group: group, members: result.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUPS_MEMBERS_RESPONSE_FAILURE, group: group});
        dispatch(showErrorToastIfNeeded("Loading Group Members Failed", e));
    }
};

export const getGroupToken = (group: AppGroup) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_TOKEN_REQUEST, group});
    try {
        const result = await api.authorisations.getToken(group.id as number);
        dispatch({type: ACTION_TYPE.GROUPS_TOKEN_RESPONSE_SUCCESS, group: group, token: result.data.token});
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUPS_TOKEN_RESPONSE_FAILURE, group: group});
        dispatch(showErrorToastIfNeeded("Loading Group Token Failed", e));
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
        dispatch(showErrorToastIfNeeded("Group Manager Addition Failed", e));
        return false;
    }
};

export const deleteGroupManager = (group: AppGroup, manager: UserSummaryWithEmailAddressDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.GROUPS_MANAGER_DELETE_REQUEST, group, manager});
    try {
        await api.groups.deleteManager(group, manager);
        dispatch({type: ACTION_TYPE.GROUPS_MANAGER_DELETE_RESPONSE_SUCCESS, group, manager});
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUPS_MANAGER_DELETE_RESPONSE_FAILURE, group, manager});
        dispatch(showErrorToastIfNeeded("Group Manager Removal Failed", e));
    }
};

export const showGroupInvitationModal = (firstTime: boolean) => async (dispatch: Dispatch<Action>) => {
    dispatch(openActiveModal(groupInvitationModal(firstTime)) as any);
};

export const showGroupManagersModal = () => async (dispatch: Dispatch<Action>, getState: () => AppState) => {
    const state = getState();
    const group = groups.current(state);
    const user = state && state.user && state.user.loggedIn && state.user || null;
    const userIsOwner = group && user && group.ownerId == user.id || false;
    dispatch(openActiveModal(groupManagersModal(userIsOwner)) as any);
};

export const getMyGroupMemberships = () => async (dispatch: Dispatch<Action>) => {
    try {
        dispatch({type: ACTION_TYPE.GROUP_GET_MEMBERSHIPS_REQUEST});
        const groupMembershipsResponse = await api.groups.getMyMemberships();
        dispatch({
            type: ACTION_TYPE.GROUP_GET_MEMBERSHIPS_RESPONSE_SUCCESS,
            groupMemberships: groupMembershipsResponse.data
        });
    } catch (e) {
        dispatch({type: ACTION_TYPE.GROUP_GET_MEMBERSHIPS_RESPONSE_FAILURE});
        dispatch(showErrorToastIfNeeded("Loading Group Memberships Failed", e));
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
        dispatch(showErrorToastIfNeeded("Membership Status Update Failed", e));
    }
};

// boards

export const loadBoards = (startIndex: number, limit: ActualBoardLimit, sort: BoardOrder) => async (dispatch: Dispatch<Action>) => {
    const accumulate = startIndex != 0;
    dispatch({type: ACTION_TYPE.BOARDS_REQUEST, accumulate});
    try {
        const boards = await api.boards.get(startIndex, limit, sort);
        dispatch({type: ACTION_TYPE.BOARDS_RESPONSE_SUCCESS, boards: boards.data, accumulate});
    } catch (e) {
        dispatch(showErrorToastIfNeeded("Loading Gameboards Failed", e));
    }
};

export const loadGroupsForBoard = (board: GameboardDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.BOARDS_GROUPS_REQUEST, board});
    try {
        const result = await api.boards.getGroupsForBoard(board);
        dispatch({type: ACTION_TYPE.BOARDS_GROUPS_RESPONSE_SUCCESS, board, groups: result.data});
    } catch (e) {
        dispatch({type: ACTION_TYPE.BOARDS_GROUPS_RESPONSE_FAILURE, board});
        dispatch(showErrorToastIfNeeded("Loading Groups for Gameboard Failed", e));
    }
};

export const deleteBoard = (board: GameboardDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.BOARDS_DELETE_REQUEST, board});
    try {
        await api.boards.delete(board);
        dispatch({type: ACTION_TYPE.BOARDS_DELETE_RESPONSE_SUCCESS, board});
        dispatch(showToast({color: "success", title: "Gameboard Deleted", body: "You have deleted gameboard " + board.title, timeout: 5000}) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.BOARDS_DELETE_RESPONSE_FAILURE, board});
        dispatch(showErrorToastIfNeeded("Delete Gameboard Failed", e));
    }
};

export const unassignBoard = (board: GameboardDTO, group: UserGroupDTO) => async (dispatch: Dispatch<Action>) => {
    dispatch({type: ACTION_TYPE.BOARDS_UNASSIGN_REQUEST, board, group});
    try {
        await api.boards.unassign(board, group);
        dispatch({type: ACTION_TYPE.BOARDS_UNASSIGN_RESPONSE_SUCCESS, board, group});
        dispatch(showToast({color: "success", title: "Assignment Deleted", body: "This assignment has been unset successfully.", timeout: 5000}) as any);
    } catch (e) {
        dispatch({type: ACTION_TYPE.BOARDS_UNASSIGN_RESPONSE_FAILURE, board, group});
        dispatch(showErrorToastIfNeeded("Board Unassignment Failed", e));
    }
};

export const assignBoard = (board: GameboardDTO, groupId?: number, dueDate?: Date) => async (dispatch: Dispatch<Action>) => {
    if (groupId == null) {
        dispatch(showToast({color: "danger", title: "Board Assignment Failed", body: "Error: Please choose a group.", timeout: 5000}) as any);
        return false;
    }

    let dueDateUTC = undefined;
    if (dueDate != undefined) {
        dueDateUTC = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        let today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if ((dueDateUTC - today.valueOf()) < 0) {
            dispatch(showToast({color: "danger", title: "Board Assignment Failed", body: "Error: Due date cannot be in the past.", timeout: 5000}) as any);
            return false;
        }
    }

    const assignment = {board, groupId, dueDate: dueDateUTC};

    dispatch({type: ACTION_TYPE.BOARDS_ASSIGN_REQUEST, ...assignment});
    try {
        await api.boards.assign(board, groupId, dueDateUTC);
        dispatch({type: ACTION_TYPE.BOARDS_ASSIGN_RESPONSE_SUCCESS, ...assignment});
        dispatch(showToast({color: "success", title: "Assignment Saved", body: "This assignment has been saved successfully.", timeout: 5000}) as any);
        return true;
    } catch (e) {
        dispatch({type: ACTION_TYPE.BOARDS_ASSIGN_RESPONSE_FAILURE, ...assignment});
        dispatch(showErrorToastIfNeeded("Gameboard Assignment Failed", e));
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

// Content Errors
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

// Generic log action:
export const logAction = (eventDetails: object) => {
    api.logger.log(eventDetails); // We do not care whether this completes or not
    return {type: ACTION_TYPE.LOG_EVENT, eventDetails: eventDetails};
};

// SERVICE ACTIONS (w/o dispatch)
// Page change
export const changePage = (path: string) => {
    store.dispatch({type: ACTION_TYPE.ROUTER_PAGE_CHANGE, path});
};

export const handleServerError = () => {
    store.dispatch({type: ACTION_TYPE.API_SERVER_ERROR});
};

export const handleApiGoneAway = () => {
    store.dispatch({type: ACTION_TYPE.API_GONE_AWAY});
};

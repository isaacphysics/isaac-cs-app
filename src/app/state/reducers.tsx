import {combineReducers} from "redux";
import {
    Action,
    ActiveModal,
    AdminStatsResponse,
    AppAssignmentProgress,
    AppGroup,
    AppGroupMembership,
    AppQuestionDTO,
    AugmentedEvent,
    Concepts,
    ContentErrorsResponse,
    EventMapData,
    EventOverview,
    GroupMembershipDetailDTO,
    isValidatedChoice,
    PotentialUser,
    NOT_FOUND_TYPE,
    PrintingSettings,
    TemplateEmail,
    Toast,
    UserPreferencesDTO,
    UserProgress,
    UserSchoolLookup
} from "../../IsaacAppTypes";
import {
    AnsweredQuestionsByDate,
    AssignmentDTO,
    ContentDTO,
    ContentSummaryDTO,
    EventBookingDTO,
    GameboardDTO, GameboardItem,
    GameboardListDTO,
    GlossaryTermDTO,
    IsaacPodDTO,
    IsaacTopicSummaryPageDTO,
    IsaacWildcard,
    RegisteredUserDTO,
    ResultsWrapper,
    TestCaseDTO,
    UserAuthenticationSettingsDTO,
    UserGroupDTO,
    UserSummaryDTO,
    UserSummaryForAdminUsersDTO,
    UserSummaryWithEmailAddressDTO,
    UserSummaryWithGroupMembershipDTO,
    TOTPSharedSecretDTO
} from "../../IsaacApiTypes";
import {ACTION_TYPE, ContentVersionUpdatingStatus, EXAM_BOARD, NOT_FOUND} from "../services/constants";
import {difference, differenceBy, mapValues, union, unionWith, without} from "lodash";
import tags from "../services/tags";

type UserState = PotentialUser | null;
export const user = (user: UserState = null, action: Action): UserState => {
    switch (action.type) {
        case ACTION_TYPE.USER_LOG_IN_RESPONSE_SUCCESS:
        case ACTION_TYPE.USER_UPDATE_RESPONSE_SUCCESS:
        case ACTION_TYPE.USER_DETAILS_UPDATE_RESPONSE_SUCCESS:
            return {loggedIn: true, ...action.user};
        case ACTION_TYPE.USER_UPDATE_RESPONSE_FAILURE:
        case ACTION_TYPE.USER_LOG_OUT_RESPONSE_SUCCESS:
        case ACTION_TYPE.USER_LOG_OUT_EVERYWHERE_RESPONSE_SUCCESS:
            return {loggedIn: false};
        default:
            return user;
    }
};

type UserAuthSettingsState = UserAuthenticationSettingsDTO | null;
export const userAuthSettings = (userAuthSettings: UserAuthSettingsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.USER_AUTH_SETTINGS_RESPONSE_SUCCESS:
            return action.userAuthSettings;
        default:
            return userAuthSettings;
    }
};

type SelectedUserAuthSettingsState = UserAuthenticationSettingsDTO | null;
export const selectedUserAuthSettings = (selectedUserAuthSettings: SelectedUserAuthSettingsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.SELECTED_USER_AUTH_SETTINGS_RESPONSE_SUCCESS:
            return action.selectedUserAuthSettings;
        default:
            return selectedUserAuthSettings;
    }
};

type UserPreferencesState = UserPreferencesDTO | null;
export const userPreferences = (userPreferences: UserPreferencesState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.USER_PREFERENCES_RESPONSE_SUCCESS:
            return {...action.userPreferences};
        default:
            return userPreferences;
    }
};

type TotpSharedSecretState = TOTPSharedSecretDTO | null;
export const totpSharedSecret = (totpSharedSecret: TotpSharedSecretState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.USER_AUTH_MFA_NEW_SECRET_SUCCESS:
            return {...action.totpSharedSecretDTO};
        case ACTION_TYPE.USER_AUTH_MFA_SETUP_SUCCESS:
            return null;
        default:
            return totpSharedSecret;
    }
};

type TotpChallengePendingState = boolean | null;
export const totpChallengePending = (totpChallengePending: TotpChallengePendingState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.USER_AUTH_MFA_CHALLENGE_REQUIRED:
            return true;
        case ACTION_TYPE.USER_AUTH_MFA_CHALLENGE_SUCCESS:
            return false;
        default:
            return totpChallengePending;
    }
};

export type UserSchoolLookupState = UserSchoolLookup | null;
export const userSchoolLookup = (userSchoolLookup: UserSchoolLookupState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.USER_SCHOOL_LOOKUP_REQUEST:
            return null;
        case ACTION_TYPE.USER_SCHOOL_LOOKUP_RESPONSE_SUCCESS:
            return {...action.schoolLookup};
        default:
            return userSchoolLookup;
    }
};

export type UserProgressState = UserProgress | null;
export const userProgress = (userProgress: UserProgressState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.USER_PROGRESS_RESPONSE_SUCCESS:
            return action.progress;
        case ACTION_TYPE.USER_PROGRESS_RESPONSE_FAILURE:
            return null;
        default:
            return userProgress;
    }
};

export type AdminUserSearchState = UserSummaryForAdminUsersDTO[] | null;
export const adminUserSearch = (adminUserSearch: AdminUserSearchState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.ADMIN_USER_SEARCH_REQUEST:
            return null;
        case ACTION_TYPE.ADMIN_USER_SEARCH_RESPONSE_SUCCESS:
            return action.users;
        default:
            return adminUserSearch;
    }
};

export type AdminUserGetState = RegisteredUserDTO | null;
export const adminUserGet = (adminUserGet: AdminUserGetState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.ADMIN_USER_GET_REQUEST:
            return null;
        case ACTION_TYPE.ADMIN_USER_GET_RESPONSE_SUCCESS:
            return action.getUsers;
        default:
            return adminUserGet;
    }
};

export type AdminContentErrorsState = ContentErrorsResponse | null;
export const adminContentErrors = (adminContentErrors: AdminContentErrorsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.ADMIN_CONTENT_ERRORS_REQUEST:
            return null;
        case ACTION_TYPE.ADMIN_CONTENT_ERRORS_RESPONSE_SUCCESS:
            return action.errors;
        default:
            return adminContentErrors;
    }
};

export type AdminStatsState = AdminStatsResponse | null;
export const adminStats = (adminSiteStats: AdminStatsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.ADMIN_STATS_REQUEST:
            return null;
        case ACTION_TYPE.ADMIN_STATS_RESPONSE_SUCCESS:
            return action.stats;
        default:
            return adminSiteStats;
    }
};

export type AdminEmailTemplateState = TemplateEmail | null;
export const adminEmailTemplate = (adminEmailTemplate: AdminEmailTemplateState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.ADMIN_EMAIL_TEMPLATE_REQUEST:
            return null;
        case ACTION_TYPE.ADMIN_EMAIL_TEMPLATE_RESPONSE_SUCCESS:
            return action.email;
        default:
            return adminEmailTemplate;
    }
};

export type ActiveAuthorisationsState = UserSummaryWithEmailAddressDTO[] | null;
export const activeAuthorisations = (activeAuthorisations: ActiveAuthorisationsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.AUTHORISATIONS_ACTIVE_RESPONSE_SUCCESS:
            return [...action.authorisations];
        default:
            return activeAuthorisations;
    }
};

export type OtherUserAuthorisationsState = UserSummaryDTO[] | null;
export const otherUserAuthorisations = (otherUserAuthorisations: OtherUserAuthorisationsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.AUTHORISATIONS_OTHER_USERS_RESPONSE_SUCCESS:
            return [...action.otherUserAuthorisations];
        default:
            return otherUserAuthorisations;
    }
};

const groupMembership = (groupMembership: GroupMembershipDetailDTO, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.GROUP_CHANGE_MEMBERSHIP_STATUS_RESPONSE_SUCCESS:
            return {membershipStatus: action.newStatus, group: groupMembership.group};
        default:
            return groupMembership;
    }
};

export type GroupMembershipsState = GroupMembershipDetailDTO[] | null;
export const groupMemberships = (groupMemberships: GroupMembershipsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.GROUP_GET_MEMBERSHIPS_RESPONSE_SUCCESS:
            return [...action.groupMemberships];
        // delegate to group membership reducer
        case ACTION_TYPE.GROUP_CHANGE_MEMBERSHIP_STATUS_RESPONSE_SUCCESS:
            return groupMemberships &&
                groupMemberships.map(m => m.group.id === action.groupId ? groupMembership(m, action) : m);
        default:
            return groupMemberships;
    }
};

type ConstantsState = {units?: string[]; segueVersion?: string; segueEnvironment?: string} | null;
export const constants = (constants: ConstantsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.CONSTANTS_UNITS_RESPONSE_SUCCESS:
            return {...constants, units: action.units};
        case ACTION_TYPE.CONSTANTS_SEGUE_VERSION_RESPONSE_SUCCESS:
            return {...constants, segueVersion: action.segueVersion};
        case ACTION_TYPE.CONSTANTS_SEGUE_ENVIRONMENT_RESPONSE_SUCCESS:
            return {...constants, segueEnvironment: action.segueEnvironment};
        default:
            return constants;
    }
};

type NotificationsState = {notifications?: any[]} | null;
export const notifications = (notifications: NotificationsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.NOTIFICATIONS_RESPONSE_SUCCESS:
            return {notifications: Array.from(action.notifications)};
        default:
            return notifications;
    }
};

type DocState = ContentDTO | NOT_FOUND_TYPE | null;
export const doc = (doc: DocState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.DOCUMENT_REQUEST:
            return null;
        case ACTION_TYPE.DOCUMENT_RESPONSE_SUCCESS:
            return {...tags.augmentDocWithSubject(action.doc)};
        case ACTION_TYPE.ROUTER_PAGE_CHANGE:
            return null;
        case ACTION_TYPE.DOCUMENT_RESPONSE_FAILURE:
            return NOT_FOUND;
        default:
            return doc;
    }
};

type FragmentsState = {[name: string]: (ContentDTO | NOT_FOUND_TYPE)} | null;
export const fragments = (fragments: FragmentsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.FRAGMENT_RESPONSE_SUCCESS:
            return {...fragments, [action.id]: action.doc};
        case ACTION_TYPE.FRAGMENT_RESPONSE_FAILURE:
            return {...fragments, [action.id]: NOT_FOUND};
        default:
            return fragments;
    }
};

type GlossaryTermsState = GlossaryTermDTO[] | null;
export const glossaryTerms = (glossaryTerms: GlossaryTermsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.GLOSSARY_TERMS_RESPONSE_SUCCESS:
            return action.terms;
        case ACTION_TYPE.GLOSSARY_TERMS_RESPONSE_FAILURE:
        default:
            return glossaryTerms;
    }
};

export const question = (question: AppQuestionDTO, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.QUESTION_SET_CURRENT_ATTEMPT:
            if (isValidatedChoice(action.attempt)) {
                return {...question, currentAttempt: action.attempt.choice, canSubmit: action.attempt.frontEndValidation, validationResponse: undefined};
            } else {
                return {...question, currentAttempt: action.attempt, canSubmit: true, validationResponse: undefined};
            }
        case ACTION_TYPE.QUESTION_ATTEMPT_REQUEST:
            return {...question, canSubmit: false};
        case ACTION_TYPE.QUESTION_ATTEMPT_RESPONSE_SUCCESS:
            return (!question.bestAttempt || !question.bestAttempt.correct) ?
                {...question, validationResponse: action.response, bestAttempt: action.response} :
                {...question, validationResponse: action.response};
        case ACTION_TYPE.QUESTION_ATTEMPT_RESPONSE_FAILURE:
            return {...question, locked: action.lock, canSubmit: true};
        case ACTION_TYPE.QUESTION_UNLOCK:
            return {...question, locked: undefined};
        default:
            return question;
    }
};

type QuestionsState = {questions: AppQuestionDTO[]; pageCompleted: boolean} | null;
function augmentQuestions(questions: AppQuestionDTO[]): QuestionsState {
    return {
        questions,
        pageCompleted: questions.every(q => q.validationResponse && q.validationResponse.correct)
    }
}
export const questions = (qs: QuestionsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.QUESTION_REGISTRATION: {
            const currentQuestions = qs !== null ? [...qs.questions] : [];
            const bestAttempt = action.question.bestAttempt;
            const newQuestion: AppQuestionDTO = bestAttempt ?
                {...action.question, validationResponse: bestAttempt, currentAttempt: bestAttempt.answer, accordionClientId: action.accordionClientId} :
                {...action.question, accordionClientId: action.accordionClientId};
            const newQuestions = [...currentQuestions, newQuestion];
            return augmentQuestions(newQuestions);
        }
        case ACTION_TYPE.QUESTION_DEREGISTRATION: {
            const filteredQuestions = qs && qs.questions.filter((q) => q.id != action.questionId);
            return filteredQuestions && filteredQuestions.length ? augmentQuestions(filteredQuestions) : null;
        }
        // Delegate processing the question matching action.questionId to the question reducer
        case ACTION_TYPE.QUESTION_SET_CURRENT_ATTEMPT:
        case ACTION_TYPE.QUESTION_ATTEMPT_REQUEST:
        case ACTION_TYPE.QUESTION_UNLOCK:
        case ACTION_TYPE.QUESTION_ATTEMPT_RESPONSE_FAILURE:
        case ACTION_TYPE.QUESTION_ATTEMPT_RESPONSE_SUCCESS: {
            return qs && augmentQuestions(qs.questions.map((q) => q.id === action.questionId ? question(q, action) : q));
        }
        default: {
            return qs;
        }
    }
};

// TODO Move this into questions to make it consistent?
type GraphSpecState = string[] | null;
export const graphSketcherSpec = (p: GraphSpecState = null, action: Action) => {
    switch(action.type) {
        case ACTION_TYPE.GRAPH_SKETCHER_GENERATE_SPECIFICATION_REQUEST:
            return null;
        case ACTION_TYPE.GRAPH_SKETCHER_GENERATE_SPECIFICATION_RESPONSE_SUCCESS:
            return { ...action.specResponse.results };
        case ACTION_TYPE.GRAPH_SKETCHER_GENERATE_SPECIFICATION_RESPONSE_FAILURE:
        default:
            return p;
    }
}

type TestQuestionsState = TestCaseDTO[] | null;
export const testQuestions = (testQuestions: TestQuestionsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.TEST_QUESTION_RESPONSE_SUCCESS: {
            return action.testCaseResponses;
        }
        default: {
            return testQuestions;
        }
    }
};

type AnsweredQuestionsByDateState = AnsweredQuestionsByDate | null;
export const answeredQuestionsByDate = (answeredQuestionsByDateState: AnsweredQuestionsByDateState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.QUESTION_ANSWERS_BY_DATE_REQUEST: {
            return null;
        }
        case ACTION_TYPE.QUESTION_ANSWERS_BY_DATE_RESPONSE_SUCCESS: {
            return action.answeredQuestionsByDate;
        }
        default: {
            return answeredQuestionsByDateState;
        }
    }
};

type MostRecentAttemptedQuestionsState = GameboardItem[] | null;
export const mostRecentAttemptedQuestions = (mostRecentAttemptedQuestionsState: MostRecentAttemptedQuestionsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.QUESTION_MOST_RECENT_REQUEST: {
            return null;
        }
        case ACTION_TYPE.QUESTION_MOST_RECENT_RESPONSE_SUCCESS: {
            return action.questions;
        }
        default: {
            return mostRecentAttemptedQuestionsState;
        }
    }
};

type EasiestUnsolvedQuestionsState = GameboardItem[] | null;
export const easiestUnsolvedQuestions = (easiestUnsolvedQuestionsState: EasiestUnsolvedQuestionsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.QUESTION_EASIEST_UNSOLVED_REQUEST: {
            return null;
        }
        case ACTION_TYPE.QUESTION_EASIEST_UNSOLVED_RESPONSE_SUCCESS: {
            return action.questions;
        }
        default: {
            return easiestUnsolvedQuestionsState;
        }
    }
};

type GameboardEditorQuestionsState = ContentSummaryDTO[] | null;
export const gameboardEditorQuestions = (gameboardEditorQuestions: GameboardEditorQuestionsState = null, action: Action) => {
    switch(action.type) {
        case ACTION_TYPE.QUESTION_SEARCH_RESPONSE_SUCCESS: {
            return action.questions.map((question) => {
                return {...question, url: question.url && question.url.replace("/isaac-api/api/pages","")}
            });
        }
        case ACTION_TYPE.QUESTION_SEARCH_RESPONSE_FAILURE: {
            return null;
        }
        default: {
            return gameboardEditorQuestions;
        }
    }
};

type AssignmentsState = AssignmentDTO[] | null;
export const assignments = (assignments: AssignmentsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.ASSIGNMENTS_REQUEST:
            return null;
        case ACTION_TYPE.ASSIGNMENTS_RESPONSE_SUCCESS:
            return action.assignments;
        default:
            return assignments;
    }
};

export const assignmentsByMe = (assignments: AssignmentsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.ASSIGNMENTS_BY_ME_REQUEST:
            return null;
        case ACTION_TYPE.ASSIGNMENTS_BY_ME_RESPONSE_SUCCESS:
            return action.assignments;
        default:
            return assignments;
    }
};

export type ProgressState = {[assignmentId: number]: AppAssignmentProgress[]} | null;
export const progress = (progress: ProgressState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.PROGRESS_RESPONSE_SUCCESS:
            return {...progress, [action.assignment._id as number]: action.progress};
        default:
            return progress;
    }
};

export type CurrentGameboardState = GameboardDTO | NOT_FOUND_TYPE | null | {inflight: true; id: string | null};
export const currentGameboard = (currentGameboard: CurrentGameboardState = null, action: Action): CurrentGameboardState => {
    switch (action.type) {
        case ACTION_TYPE.GAMEBOARD_REQUEST:
            return {inflight: true, id: action.gameboardId} as {inflight: true; id: string | null};
        case ACTION_TYPE.GAMEBOARD_RESPONSE_SUCCESS:
            return action.gameboard;
        case ACTION_TYPE.GAMEBOARD_CREATE_RESPONSE_SUCCESS:
            return {id: action.gameboardId};
        case ACTION_TYPE.GAMEBOARD_RESPONSE_NO_CONTENT:
        case ACTION_TYPE.GAMEBOARD_RESPONSE_FAILURE:
            return NOT_FOUND;
        case ACTION_TYPE.ROUTER_PAGE_CHANGE:
            return null;
        default:
            return currentGameboard;
    }
};

export type TempExamBoardState = EXAM_BOARD | null;
export const tempExamBoard = (tempExamBoard: TempExamBoardState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.EXAM_BOARD_SET_TEMP:
            return action.examBoard;
        default:
            return tempExamBoard;
    }
};


export type WildcardsState = IsaacWildcard[] | NOT_FOUND_TYPE | null;
export const wildcards = (wildcards: WildcardsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.GAMEBOARD_WILDCARDS_REQUEST:
            return null;
        case ACTION_TYPE.GAMEBOARD_WILDCARDS_RESPONSE_SUCCESS:
            return action.wildcards;
        case ACTION_TYPE.GAMEBOARD_WILDCARDS_RESPONSE_FAILURE:
            return NOT_FOUND;
        default:
            return wildcards;
    }
};

export type CurrentTopicState = IsaacTopicSummaryPageDTO | NOT_FOUND_TYPE | null;
export const currentTopic = (currentTopic: CurrentTopicState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.TOPIC_REQUEST:
            return null;
        case ACTION_TYPE.TOPIC_RESPONSE_SUCCESS:
            return action.topic;
        case ACTION_TYPE.TOPIC_RESPONSE_FAILURE:
            return NOT_FOUND;
        case ACTION_TYPE.ROUTER_PAGE_CHANGE:
            return null;
        default:
            return currentTopic;
    }
};

type EventsState = {events: AugmentedEvent[]; total: number} | null;
export const events = (events: EventsState = null, action: Action) => {
    const currentEvents = events ? events.events : [];
    switch (action.type) {
        case ACTION_TYPE.EVENTS_RESPONSE_SUCCESS:
            return {events: Array.from(new Set([...currentEvents, ...action.augmentedEvents])), total: action.total};
        case ACTION_TYPE.EVENTS_CLEAR:
            return null;
        default:
            return events;
    }
};

type NewsState = {news: IsaacPodDTO[]} | null;
export const news = (news: NewsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.NEWS_RESPONSE_SUCCESS:
            return {news: Array.from(action.theNews)};
        default:
            return news;
    }
};

export type CurrentEventState = AugmentedEvent | NOT_FOUND_TYPE | null;
export const currentEvent = (currentEvent: CurrentEventState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.EVENT_RESPONSE_SUCCESS:
            return {...action.augmentedEvent};
        case ACTION_TYPE.EVENT_RESPONSE_FAILURE:
            return NOT_FOUND;
        case ACTION_TYPE.ROUTER_PAGE_CHANGE:
        case ACTION_TYPE.EVENT_REQUEST:
            return null;
        default:
            return currentEvent;
    }
};

export type EventBookingsState = EventBookingDTO[] | null;
export const eventBookings = (eventBookings: EventBookingsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.EVENT_BOOKINGS_RESPONSE_SUCCESS:
            return [...action.eventBookings];
        case ACTION_TYPE.EVENT_BOOKING_REQUEST:
            return null;
        default:
            return eventBookings;
    }
};

export const eventBookingsForGroup = (eventBookingsForGroup: EventBookingsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.EVENT_BOOKINGS_FOR_GROUP_RESPONSE_SUCCESS:
            return [...action.eventBookingsForGroup];
        case ACTION_TYPE.EVENT_BOOKINGS_FOR_GROUP_REQUEST:
            return null;
        default:
            return eventBookingsForGroup;
    }
};

type EventOverviewsState = EventOverview[] | null;
export const eventOverviews = (eventOverviews: EventOverviewsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.EVENT_OVERVIEWS_REQUEST:
            return null;
        case ACTION_TYPE.EVENT_OVERVIEWS_RESPONSE_SUCCESS:
            return [...action.eventOverviews];
        default:
            return eventOverviews;
    }
};

type EventMapDataState = EventMapData[] | null;
export const eventMapData = (eventMapData: EventMapDataState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.EVENT_MAP_DATA_REQUEST:
            return null;
        case ACTION_TYPE.EVENT_MAP_DATA_RESPONSE_SUCCESS:
            return [...action.eventMapData];
        default:
            return eventMapData;
    }
};


export type ErrorState = {type: "generalError"; generalError: string} | {type: "consistencyError"} | {type: "serverError"} | {type: "goneAwayError"} | null;
export const error = (error: ErrorState = null, action: Action): ErrorState => {
    switch (action.type) {
        case ACTION_TYPE.USER_LOG_IN_RESPONSE_FAILURE:
        case ACTION_TYPE.USER_DETAILS_UPDATE_RESPONSE_FAILURE:
        case ACTION_TYPE.EMAIL_AUTHENTICATION_RESPONSE_FAILURE:
        case ACTION_TYPE.USER_INCOMING_PASSWORD_RESET_FAILURE:
        case ACTION_TYPE.USER_PASSWORD_RESET_RESPONSE_FAILURE:
        case ACTION_TYPE.USER_AUTH_SETTINGS_RESPONSE_FAILURE:
        case ACTION_TYPE.USER_PREFERENCES_RESPONSE_FAILURE:
            return {type: "generalError", generalError: action.errorMessage};
        case ACTION_TYPE.USER_CONSISTENCY_ERROR:
            return {type: "consistencyError"};
        case ACTION_TYPE.API_SERVER_ERROR:
            return {type: "serverError"};
        case ACTION_TYPE.API_GONE_AWAY:
            return {type: "goneAwayError"};
        case ACTION_TYPE.ROUTER_PAGE_CHANGE:
            return null;
        default:
            return error;
    }
};

type SearchState = {searchResults: ResultsWrapper<ContentSummaryDTO> | null} | null;
export const search = (search: SearchState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.SEARCH_REQUEST:
            return {...search, searchResults: null};
        case ACTION_TYPE.SEARCH_RESPONSE_SUCCESS:
            return {...search, searchResults: action.searchResults};
        default:
            return search;
    }
};

export type ContentVersionState = {liveVersion?: string; updateState?: ContentVersionUpdatingStatus; updatingVersion?: string} | null;
export const contentVersion = (contentVersion: ContentVersionState = null, action: Action): ContentVersionState => {
    switch (action.type) {
        case ACTION_TYPE.CONTENT_VERSION_GET_RESPONSE_SUCCESS:
            return {...contentVersion, liveVersion: action.liveVersion};
        case ACTION_TYPE.CONTENT_VERSION_SET_REQUEST:
            return {...contentVersion, updateState: ContentVersionUpdatingStatus.UPDATING, updatingVersion: action.version};
        case ACTION_TYPE.CONTENT_VERSION_SET_RESPONSE_SUCCESS:
            return {...contentVersion, updateState: ContentVersionUpdatingStatus.SUCCESS, liveVersion: action.newVersion};
        case ACTION_TYPE.CONTENT_VERSION_SET_RESPONSE_FAILURE:
            return {...contentVersion, updateState: ContentVersionUpdatingStatus.FAILURE};
        default:
            return contentVersion;
    }
};

export type ToastsState = Toast[] | null;
export const toasts = (toasts: ToastsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.TOASTS_SHOW:
            toasts = toasts || [];
            return [...toasts, action.toast];
        case ACTION_TYPE.TOASTS_HIDE:
            toasts = toasts || [];
            return toasts.map(toast => toast.id == action.toastId ? {...toast, showing: false} : toast);
        case ACTION_TYPE.TOASTS_REMOVE:
            toasts = toasts || [];
            return toasts.filter(toast => toast.id != action.toastId);
        default:
            return toasts;
    }
};

export type ActiveModalsState = ActiveModal[] | null;
export const activeModals = (activeModals: ActiveModalsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.ACTIVE_MODAL_OPEN:
            activeModals = activeModals || [];
            return [...activeModals, action.activeModal];
        case ACTION_TYPE.ACTIVE_MODAL_CLOSE:
            return activeModals && activeModals.length > 1 ? activeModals.slice(0, activeModals.length - 1) : null;
        default:
            return activeModals;
    }
};

function updateGroupsCache(groups: GroupsState | undefined, newGroups: AppGroup[]): GroupsState {
    const cache: {[groupId: number]: AppGroup} = {...(groups && groups.cache)};
    newGroups.forEach(group => {
        if (!group.id) return;
        if (group.id in cache) {
            const existing = cache[group.id];
            cache[group.id] = {
                ...group,
                token: group.token || existing.token,
                members: group.members || existing.members
            };
        } else {
            cache[group.id] = group;
        }
    });
    return {
        ...groups,
        cache
    };
}

function groupsProcessor(groups: GroupsState, updater: (group: AppGroup) => AppGroup) {
    if (groups === null) return groups;
    return {
        ...groups,
        cache: mapValues(groups.cache, (value) => updater(value))
    };
}

function remove(groups: GroupsState, what: AppGroup) {
    const cache: {[groupId: number]: AppGroup}  = {...groups && groups.cache};
    delete cache[what.id as number];
    return {
        ...groups,
        cache: cache,
        active: without(groups && groups.active, what.id as number),
        archived: without(groups && groups.archived, what.id as number)
    };
}

function updateToken(from: GroupsState, group: AppGroup, token: string) {
    return groupsProcessor(from, (g) => {
        if (g && g.id == group.id) {
            return {...g, token: token}
        }
        return g;
    });
}

function updateMembers(from: GroupsState, group: AppGroup, members: UserSummaryWithGroupMembershipDTO[]) {
    return groupsProcessor(from, (g) => {
        if (g && g.id == group.id) {
            return {...g, members: members as AppGroupMembership[]}
        }
        return g;
    });
}

function deleteMember(from: GroupsState, member: AppGroupMembership) {
    return groupsProcessor(from, (g) => {
        if (g && g.id == member.groupMembershipInformation.groupId) {
            return {...g, members: g.members && g.members.filter(m => m.groupMembershipInformation.userId != member.groupMembershipInformation.userId)};
        }
        return g;
    });
}

function addManager(groups: GroupsState, group: AppGroup, newGroup: UserGroupDTO) {
    return groupsProcessor(groups, (g) => {
        if (g && g.id == group.id) {
            return {
                ...g,
                additionalManagers: newGroup.additionalManagers
            };
        }
        return g;
    });
}

function removeManager(groups: GroupsState, group: AppGroup, manager: UserSummaryWithEmailAddressDTO) {
    return groupsProcessor(groups, (g) => {
        if (g && g.id == group.id) {
            return {
                ...g,
                additionalManagers: g.additionalManagers && g.additionalManagers.filter(am => am.id != manager.id)
            };
        }
        return g;
    });
}

function update(groups: GroupsState, what: AppGroup) {
    groups = updateGroupsCache(groups, [what]);
    const active = groups && groups.active || [];
    const archived = groups && groups.archived || [];
    return {
        ...groups,
        active: what.archived ? active : union(active, [what.id as number]),
        archived: what.archived ? union(archived, [what.id as number]) : archived
    };
}

export type GroupsState = {active?: number[]; archived?: number[]; cache?: {[groupId: number]: AppGroup}; selectedGroupId?: number} | null;

export const groups = (groups: GroupsState = null, action: Action): GroupsState => {
    switch (action.type) {
        case ACTION_TYPE.GROUPS_RESPONSE_SUCCESS: {
            groups = updateGroupsCache(groups, action.groups);
            if (action.archivedGroupsOnly) {
                return {...groups, archived: action.groups.map(g => g.id as number)};
            } else {
                return {...groups, active: action.groups.map(g => g.id as number)};
            }
        }
        case ACTION_TYPE.GROUPS_SELECT:
            return {...groups, selectedGroupId: action.group && action.group.id || undefined};
        case ACTION_TYPE.GROUPS_CREATE_RESPONSE_SUCCESS:
            return update(groups, action.newGroup);
        case ACTION_TYPE.GROUPS_UPDATE_RESPONSE_SUCCESS:
            return update(groups, action.updatedGroup);
        case ACTION_TYPE.GROUPS_DELETE_RESPONSE_SUCCESS:
            return remove(groups, action.deletedGroup);
        case ACTION_TYPE.GROUPS_TOKEN_RESPONSE_SUCCESS:
            return updateToken(groups, action.group, action.token);
        case ACTION_TYPE.GROUPS_MANAGER_ADD_RESPONSE_SUCCESS:
            return addManager(groups, action.group, action.newGroup);
        case ACTION_TYPE.GROUPS_MANAGER_DELETE_RESPONSE_SUCCESS:
            return removeManager(groups, action.group, action.manager);
        case ACTION_TYPE.GROUPS_MEMBERS_RESPONSE_SUCCESS:
            return updateMembers(groups, action.group, action.members);
        case ACTION_TYPE.GROUPS_MEMBERS_DELETE_RESPONSE_SUCCESS:
            return deleteMember(groups, action.member);
        case ACTION_TYPE.BOARDS_GROUPS_RESPONSE_SUCCESS:
            // You might be wondering what this doing here.
            // Basically, it updates the cache with groups that are loaded because they are assigned to gameboards
            // even if those groups have not been loaded (e.g. they are archived), they are still needed here.
            return updateGroupsCache(groups, Object.values(action.groups).flat(1));
        default:
            return groups;
    }
};

export interface Boards {
    boards: GameboardDTO[];
    totalResults: number;
}

export interface BoardAssignees {
    boardAssignees?: {[key: string]: number[]};
}

export type BoardsState = {boards?: Boards} & BoardAssignees | null;

function mergeBoards(boards: Boards, additional: GameboardListDTO) {
    return {
        ...boards,
        totalResults: additional.totalResults || boards.totalResults,
        boards: unionWith(additional.results, boards.boards, function(a, b) {return a.id == b.id})
    };
}

export const boards = (boards: BoardsState = null, action: Action): BoardsState => {
    function modifyBoards(modify: (current: GameboardDTO[]) => GameboardDTO[], tweak?: (boards: Boards) => void) {
        if (boards && boards.boards) {
            const result = {...boards, boards: {...boards.boards, boards: modify(boards.boards.boards)}};
            if (tweak) tweak(result.boards);
            return result;
        }
        return boards;
    }

    switch (action.type) {
        case ACTION_TYPE.BOARDS_REQUEST:
            if (!action.accumulate) {
                return {
                    boardAssignees: boards && boards.boardAssignees || undefined
                };
            }
            return boards;
        case ACTION_TYPE.BOARDS_RESPONSE_SUCCESS:
            if (boards && boards.boards && action.accumulate) {
                return {...boards, boards: mergeBoards(boards.boards, action.boards)};
            } else {
                return {...boards, boards: {boards: action.boards.results as GameboardDTO[], totalResults: action.boards.totalResults as number}};
            }
        case ACTION_TYPE.BOARDS_DELETE_RESPONSE_SUCCESS:
            return modifyBoards(existing => differenceBy(existing, [action.board], board => board.id),
                boards => {boards.totalResults--;});
        case ACTION_TYPE.BOARDS_GROUPS_RESPONSE_SUCCESS:
            if (boards) {
                return {
                    ...boards,
                    boardAssignees: {...boards.boardAssignees, ...(mapValues(action.groups, groups => groups.map(g => g.id as number)))}
                };
            }
            return boards;
        case ACTION_TYPE.BOARDS_UNASSIGN_RESPONSE_SUCCESS:
            if (boards) {
                return {
                    ...boards,
                    boardAssignees: mapValues(boards.boardAssignees, (value, key) => key == action.board.id ? difference(value, [action.group.id as number]) : value)
                };
            }
            return boards;
        case ACTION_TYPE.BOARDS_ASSIGN_RESPONSE_SUCCESS:
            if (boards) {
                const boardId = action.board.id as string;
                const assignees = union(boards.boardAssignees && boards.boardAssignees[boardId], [action.groupId]);
                return {
                    ...boards,
                    boardAssignees: {...boards.boardAssignees, [boardId]: assignees}
                };
            }
            return boards;
        default:
            return boards;
    }
};

export type PrintingSettingsState = PrintingSettings | null;
export const printingSettings = (printingSettingsState: PrintingSettingsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.PRINTING_SET_HINTS: {
            return {...printingSettingsState, hintsEnabled: action.hintsEnabled};
        }
        default: {
            return printingSettingsState;
        }
    }
};

export type ConceptsState = Concepts | null;
export const concepts = (concepts: ConceptsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.CONCEPTS_RESPONSE_SUCCESS:
            return action.concepts;
        default:
            return concepts;
    }
};

export type FasttrackConceptsState = {gameboardId: string; concept: string; items: GameboardItem[]} | null;
export const fasttrackConcepts = (state: FasttrackConceptsState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.FASTTRACK_CONCEPTS_RESPONSE_SUCCESS:
            return action.concepts;
        default:
            return state;
    }
};

type MainContentIdState = string | null;
export const mainContentId = (state: MainContentIdState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.SET_MAIN_CONTENT_ID:
            return action.id;
        case ACTION_TYPE.ROUTER_PAGE_CHANGE:
            return null;
        default:
            return state;
    }
};

const appReducer = combineReducers({
    adminUserGet,
    user,
    userAuthSettings,
    userPreferences,
    userProgress,
    adminUserSearch,
    adminContentErrors,
    adminStats,
    adminEmailTemplate,
    userSchoolLookup,
    activeAuthorisations,
    otherUserAuthorisations,
    totpSharedSecret,
    totpChallengePending,
    groupMemberships,
    constants,
    notifications,
    doc,
    questions,
    answeredQuestionsByDate,
    mostRecentAttemptedQuestions,
    easiestUnsolvedQuestions,
    currentTopic,
    currentGameboard,
    tempExamBoard,
    wildcards,
    gameboardEditorQuestions,
    assignments,
    contentVersion,
    search,
    error,
    toasts,
    activeModals,
    groups,
    boards,
    assignmentsByMe,
    progress,
    events,
    news,
    currentEvent,
    eventOverviews,
    eventMapData,
    eventBookings,
    eventBookingsForGroup,
    fragments,
    glossaryTerms,
    testQuestions,
    printingSettings,
    concepts,
    fasttrackConcepts,
    graphSketcherSpec,
    mainContentId
});

export type AppState = undefined | {
    adminUserGet: AdminUserGetState;
    user: UserState;
    selectedUserAuthSettings: SelectedUserAuthSettingsState;
    userAuthSettings: UserAuthSettingsState;
    userPreferences: UserPreferencesState;
    userProgress: UserProgressState;
    adminUserSearch: AdminUserSearchState;
    adminContentErrors: AdminContentErrorsState;
    adminStats: AdminStatsState;
    adminEmailTemplate: AdminEmailTemplateState;
    userSchoolLookup: UserSchoolLookupState;
    activeAuthorisations: ActiveAuthorisationsState;
    otherUserAuthorisations: OtherUserAuthorisationsState;
    totpSharedSecret: TotpSharedSecretState;
    totpChallengePending: TotpChallengePendingState;
    groupMemberships: GroupMembershipsState;
    doc: DocState;
    questions: QuestionsState;
    answeredQuestionsByDate: AnsweredQuestionsByDateState;
    mostRecentAttemptedQuestions: MostRecentAttemptedQuestionsState;
    easiestUnsolvedQuestions: EasiestUnsolvedQuestionsState;
    currentTopic: CurrentTopicState;
    currentGameboard: CurrentGameboardState;
    tempExamBoard: TempExamBoardState;
    wildcards: WildcardsState;
    gameboardEditorQuestions: GameboardEditorQuestionsState;
    assignments: AssignmentsState;
    contentVersion: ContentVersionState;
    search: SearchState;
    constants: ConstantsState;
    notifications: NotificationsState;
    error: ErrorState;
    toasts: ToastsState;
    activeModals: ActiveModalsState;
    groups: GroupsState;
    boards: BoardsState;
    assignmentsByMe: AssignmentsState;
    progress: ProgressState;
    events: EventsState;
    news: NewsState;
    currentEvent: CurrentEventState;
    eventOverviews: EventOverviewsState;
    eventMapData: EventMapDataState;
    eventBookings: EventBookingsState;
    eventBookingsForGroup: EventBookingsState;
    fragments: FragmentsState;
    printingSettings: PrintingSettingsState;
    glossaryTerms: GlossaryTermsState;
    testQuestions: TestQuestionsState;
    concepts: ConceptsState;
    fasttrackConcepts: FasttrackConceptsState;
    graphSketcherSpec: GraphSpecState;
    mainContentId: MainContentIdState;
}

export const rootReducer = (state: AppState, action: Action) => {
    if (action.type === ACTION_TYPE.USER_LOG_OUT_RESPONSE_SUCCESS || action.type === ACTION_TYPE.USER_LOG_OUT_EVERYWHERE_RESPONSE_SUCCESS || action.type === ACTION_TYPE.USER_CONSISTENCY_ERROR) {
        state = undefined;
    }
    return appReducer(state, action);
};

import React, {useEffect} from 'react';
import "../../services/scrollManager"; // important
import "../../services/polyfills"; // important
import {useDispatch, useSelector} from "react-redux";
import {Route, Router, Switch} from "react-router-dom";
import {Footer} from "./Footer";
import {Question} from "../pages/Question";
import {Concept} from "../pages/Concept";
import {Contact} from "../pages/Contact";
import {TeacherRequest} from "../pages/TeacherRequest";
import {LogIn} from "../pages/LogIn";
import {Registration} from "../pages/Registration";
import {LogOutHandler} from "../handlers/LogOutHandler";
import {EmailAlterHandler} from "../handlers/EmailAlterHandler";
import {ProviderCallbackHandler} from "../handlers/ProviderCallbackHandler";
import {MyAccount} from "../pages/MyAccount";
import {MyAssignments} from "../pages/MyAssignments";
import {Gameboard} from "../pages/Gameboard";
import {NotFound} from "../pages/NotFound";
import {
    fetchGlossaryTerms,
    openActiveModal,
    requestConstantsSegueEnvironment,
    requestCurrentUser,
    requestNotifications
} from "../../state/actions";
import {AppState} from "../../state/reducers";
import {TrackedRoute} from "./TrackedRoute";
import {ResetPasswordHandler} from "../handlers/PasswordResetHandler";
import {Admin} from "../pages/Admin";
import {history} from "../../services/history"
import {Generic} from "../pages/Generic";
import {ServerError} from "../pages/ServerError";
import {AuthError} from "../pages/AuthError";
import {SessionExpired} from "../pages/SessionExpired";
import {ConsistencyErrorModal} from "./ConsistencyErrorModal";
import {Search} from "../pages/Search";
import {CookieBanner} from "./CookieBanner";
import {EmailVerificationBanner} from "./EmailVerificationBanner";
import {Toasts} from "./Toasts";
import {AdminUserManager} from "../pages/AdminUserManager";
import {AdminStats} from "../pages/AdminStats";
import {AdminContentErrors} from "../pages/AdminContentErrors";
import {isAdmin, isAdminOrEventManager, isEventLeader, isLoggedIn, isStaff, isTeacher} from "../../services/user";
import {ActiveModals} from "../elements/modals/ActiveModals";
import {Groups} from "../pages/Groups";
import {Equality} from '../pages/Equality';
import {SetAssignments} from "../pages/SetAssignments";
import {RedirectToGameboard} from './RedirectToGameboard';
import {Support} from "../pages/Support";
import {AddGameboard} from "../handlers/AddGameboard";
import {isTest} from "../../services/constants";
import {AdminEmails} from "../pages/AdminEmails";
import {Events} from "../pages/Events";
import {RedirectToEvent} from "./RedirectToEvent";
import {EventDetails} from "../pages/EventDetails";
import {EventManager} from "../pages/EventManager";
import {MyGameboards} from "../pages/MyGameboards";
import {GameboardBuilder} from "../pages/GameboardBuilder";
import {Quiz} from "../pages/Quiz";
import {FreeTextBuilder} from "../pages/FreeTextBuilder";
import {MyProgress} from "../pages/MyProgress";
import {MarkdownBuilder} from "../pages/MarkdownBuilder";
import SiteSpecific from "../site/siteSpecific";
import StaticPageRoute from "./StaticPageRoute";
import {Redirect} from "react-router";
import {UnsupportedBrowserBanner} from "./UnsupportedBrowserWarningBanner";
import {notificationModal} from "../elements/modals/NotificationModal";
import {showNotification} from "../../services/notificationChecker";
import * as persistence from "../../services/localStorage";
import {KEY} from "../../services/localStorage";
import {Glossary} from '../pages/Glossary';
import {DowntimeWarningBanner} from "./DowntimeWarningBanner";
import {ErrorBoundary} from "react-error-boundary";
import {ClientError} from "../pages/ClientError";
import {checkForWebSocket} from "../../services/websockets";

export const IsaacApp = () => {
    // Redux state and dispatch
    const dispatch = useDispatch();
    const consistencyError = useSelector((state: AppState) => state && state.error && state.error.type == "consistencyError" || false);
    const serverError = useSelector((state: AppState) => state && state.error && state.error.type == "serverError" || false);
    const goneAwayError = useSelector((state: AppState) => state && state.error && state.error.type == "goneAwayError" || false);
    const segueEnvironment = useSelector((state: AppState) => state && state.constants && state.constants.segueEnvironment || "unknown");
    const notifications = useSelector((state: AppState) => state && state.notifications && state.notifications.notifications || []);
    const user = useSelector((state: AppState) => state && state.user || null);

    // Run once on component mount
    useEffect(() => {
        dispatch(requestCurrentUser());
        dispatch(requestConstantsSegueEnvironment());
        dispatch(fetchGlossaryTerms());
    }, [dispatch]);

    useEffect(() => {
        if (isLoggedIn(user)) {
            dispatch(requestNotifications());
            checkForWebSocket();
        }
    }, [dispatch, user]);

    useEffect(() => {
        const dateNow = new Date();
        if (showNotification(user) && notifications && notifications.length > 0) {
            dispatch(openActiveModal(notificationModal(notifications[0])));
            persistence.save(KEY.LAST_NOTIFICATION_TIME, dateNow.toString())
        }
    }, [dispatch, user, notifications]);

    // Render
    return <Router history={history}>
        <SiteSpecific.Header />
        <Toasts />
        <ActiveModals />
        <CookieBanner />
        <UnsupportedBrowserBanner />
        <DowntimeWarningBanner />
        <EmailVerificationBanner />
        <main id="main" role="main" className="flex-fill content-body">
            <ErrorBoundary FallbackComponent={ClientError}>
                <Switch>
                    {/* Errors; these paths work but aren't really used */}
                    <Route exact path={serverError ? undefined : "/error"} component={ServerError} />
                    <Route exact path={goneAwayError ? undefined : "/error_stale"} component={SessionExpired} />
                    <TrackedRoute exact path={"/auth_error"} component={AuthError} />

                    {/* Site specific pages */}
                    {SiteSpecific.Routes}

                    {/* Special case */}
                    <TrackedRoute exact path="/questions/:questionId(_regression_test_)" component={segueEnvironment !== "PROD" || isTest ? Question : NotFound} />

                    {/* Application pages */}
                    <TrackedRoute exact path="/" component={SiteSpecific.Homepage} />
                    <Redirect exact from="/home" to="/" /> {/* historic route which might get reintroduced with the introduction of dashboards */}
                    <TrackedRoute exact path="/account" ifUser={isLoggedIn} component={MyAccount} />
                    <TrackedRoute exact path="/search" component={Search} />

                    <TrackedRoute exact path="/pages/:pageId" component={Generic} />
                    <TrackedRoute exact path="/concepts/:conceptId" component={Concept} />
                    <TrackedRoute exact path="/questions/:questionId" component={Question} />
                    <TrackedRoute exact path="/quizzes/:quizId" ifUser={isLoggedIn} component={Quiz} />

                    <TrackedRoute exact path="/gameboards" component={Gameboard} />
                    <TrackedRoute exact path="/my_gameboards" ifUser={isLoggedIn} component={MyGameboards} />
                    <TrackedRoute exact path="/gameboard_builder" ifUser={isTeacher} component={GameboardBuilder} />
                    <TrackedRoute exact path="/assignment/:gameboardId" ifUser={isLoggedIn} component={RedirectToGameboard} />
                    <TrackedRoute exact path="/add_gameboard/:gameboardId" ifUser={isLoggedIn} component={AddGameboard} />

                    <TrackedRoute exact path='/events' component={Events}/>
                    <TrackedRoute exact path='/events/:eventId' component={EventDetails}/>
                    <TrackedRoute exact path='/eventbooking/:eventId' ifUser={isLoggedIn} component={RedirectToEvent} />

                    {/* Student pages */}
                    <TrackedRoute exact path="/assignments" ifUser={isLoggedIn} component={MyAssignments} />
                    <TrackedRoute exact path="/progress" ifUser={isLoggedIn} component={MyProgress} />
                    <TrackedRoute exact path="/progress/:userIdOfInterest" ifUser={isLoggedIn} component={MyProgress} />

                    {/* Teacher pages */}
                    <TrackedRoute exact path="/groups" ifUser={isTeacher} component={Groups} />
                    <TrackedRoute exact path="/set_assignments" ifUser={isTeacher} component={SetAssignments} />

                    {/* Admin */}
                    <TrackedRoute exact path="/admin" ifUser={isStaff} component={Admin} />
                    <TrackedRoute exact path="/admin/usermanager" ifUser={isAdminOrEventManager} component={AdminUserManager} />
                    <TrackedRoute exact path="/admin/events" ifUser={user => isAdminOrEventManager(user) || isEventLeader(user)} component={EventManager} />
                    <TrackedRoute exact path="/admin/stats" ifUser={isStaff} component={AdminStats} />
                    <TrackedRoute exact path="/admin/content_errors" ifUser={user => segueEnvironment === "DEV" || isStaff(user)} component={AdminContentErrors} />
                    <TrackedRoute exact path="/admin/emails" ifUser={isAdmin} component={AdminEmails} />

                    {/* Authentication */}
                    <TrackedRoute exact path="/login" component={LogIn} />
                    <TrackedRoute exact path="/logout" component={LogOutHandler} />
                    <TrackedRoute exact path="/register" component={Registration} />
                    <TrackedRoute exact path="/auth/:provider/callback" component={ProviderCallbackHandler} />
                    <TrackedRoute exact path="/resetpassword/:token" component={ResetPasswordHandler}/>
                    <TrackedRoute exact path="/verifyemail" component={EmailAlterHandler}/>

                    {/* Static pages */}
                    <TrackedRoute exact path="/contact" component={Contact}/>
                    <TrackedRoute exact path="/teacher_account_request" ifUser={isLoggedIn} component={TeacherRequest}/>
                    <StaticPageRoute exact path="/privacy" pageId="privacy_policy" />
                    <StaticPageRoute exact path="/terms" pageId="terms_of_use" />
                    <StaticPageRoute exact path="/cookies" pageId="cookie_policy" />
                    <StaticPageRoute exact path="/accessibility" pageId="accessibility_statement" />
                    <StaticPageRoute exact path="/cyberessentials" />

                    <TrackedRoute exact path="/glossary" component={Glossary} />

                    {/*
                    // TODO: schools and other admin stats
                    */}

                    {/* Builder pages */}
                    <TrackedRoute exact path="/equality" component={Equality} />
                    <TrackedRoute exact path="/markdown" ifUser={isStaff} component={MarkdownBuilder} />
                    <TrackedRoute exact path="/free_text" ifUser={isStaff} component={FreeTextBuilder} />

                    {/* Support pages */}
                    <TrackedRoute exact path="/support/:type?/:category?" component={Support} />

                    {/* Error pages */}
                    <TrackedRoute component={NotFound} />
                </Switch>
            </ErrorBoundary>
        </main>
        <Footer />
        <ConsistencyErrorModal consistencyError={consistencyError} />
    </Router>;
};

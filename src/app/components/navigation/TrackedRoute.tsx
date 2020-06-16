import React, {useEffect} from "react";
import {Redirect, Route, RouteComponentProps, RouteProps} from "react-router";
import ReactGA, {FieldsObject} from "react-ga";
import {LoggedInUser} from "../../../IsaacAppTypes";
import {ShowLoading} from "../handlers/ShowLoading";
import {useSelector} from "react-redux";
import * as persistence from "../../services/localStorage";
import {KEY} from "../../services/localStorage";
import {Unauthorised} from "../pages/Unauthorised";
import {isTeacher} from "../../services/user";
import {selectors} from "../../state/selectors";
import {GOOGLE_ANALYTICS_ACCOUNT_ID} from "../../services/constants";

ReactGA.initialize(GOOGLE_ANALYTICS_ACCOUNT_ID);
ReactGA.set({ anonymizeIp: true });

const trackPage = (page: string, options?: FieldsObject) => {
    ReactGA.set({ page, ...options });
    ReactGA.pageview(page);
};

interface UserFilterProps {
    ifUser?: (user: LoggedInUser) => boolean;
}

type TrackedRouteProps = RouteProps & {trackingOptions?: FieldsObject; componentProps?: FieldsObject} & UserFilterProps;
type TrackedRouteComponentProps = RouteComponentProps & {
    component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
    trackingOptions?: FieldsObject;
};

const WrapperComponent = function({component: Component, trackingOptions, ...props}: TrackedRouteComponentProps) {
    useEffect(() => {
        trackPage(props.location.pathname, trackingOptions);
    }, [props.location.pathname, trackingOptions]);
    return <Component {...props} />;
};

export const TrackedRoute = function({component, trackingOptions, componentProps, ...rest}: TrackedRouteProps) {
    const user = useSelector(selectors.user.orNull);
    if (component) {
        if (rest.ifUser !== undefined) {
            const {ifUser, ...rest$} = rest;
            return <Route {...rest$} render={props => {
                const propsWithUser = {user, ...props};
                return <ShowLoading until={user}>
                    {user && ifUser(user) ?
                        <WrapperComponent component={component} trackingOptions={trackingOptions} {...propsWithUser} {...componentProps} /> :
                        user && !user.loggedIn && !isTeacher(user) && rest.ifUser && rest.ifUser.name === isTeacher.name ? // TODO we should try to find a more robust way than this
                            persistence.save(KEY.AFTER_AUTH_PATH, props.location.pathname + props.location.search) && <Redirect to="/login"/>
                            :
                            user && !isTeacher(user) && rest.ifUser && rest.ifUser.name === isTeacher.name ? // TODO we should try to find a more robust way than this
                                <Redirect to="/pages/teacher_accounts"/>
                                :
                                user && user.loggedIn && !ifUser(user) ?
                                    <Unauthorised/>
                                    :
                                    persistence.save(KEY.AFTER_AUTH_PATH, props.location.pathname + props.location.search) && <Redirect to="/login"/>
                    }
                </ShowLoading>;
            }}/>;
        } else {
            return <Route {...rest} render={props => {
                return <WrapperComponent component={component} trackingOptions={trackingOptions} {...props} {...componentProps} />;
            }}/>;
        }
    } else {
        throw new Error("TrackedRoute only works on components, got: " + JSON.stringify(rest));
    }
};

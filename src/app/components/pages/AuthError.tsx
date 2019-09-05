import React from "react";
import {Link} from "react-router-dom";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import * as RS from "reactstrap";

export const AuthError = ({location: {state: {errorMessage}}}: {location: {state: {errorMessage: string}}}) => {

    return <RS.Container>
        <TitleAndBreadcrumb currentPageTitle="Authentication error" breadcrumbTitleOverride="Authentication error" />
        <RS.Row className="pt-4">
            <RS.Col md={{size: 8, offset: 2}}>
                <h3>
                    {errorMessage}
                </h3>
                <p>
                    An error occurred while attempting to log in.
                    <br />
                    You may want to return to the <Link to="/home"> home page</Link> and try again, {" "}
                    check <Link to="/support/student/general#login_issues">this FAQ</Link>
                    , or <Link to="/contact">contact us</Link> if this keeps happening.
                </p>
            </RS.Col>
        </RS.Row>
    </RS.Container>
};

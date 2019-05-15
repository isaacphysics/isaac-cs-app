import React, {Dispatch, useEffect, useState} from 'react';
import {connect} from "react-redux";
import {withRouter} from 'react-router-dom';
import {verifyPasswordReset, handlePasswordReset} from "../../state/actions";
import {RegisteredUserDTO} from "../../../IsaacApiTypes";
import {Button, Col, FormFeedback, Input, Label, Row, Card, CardBody, Form, FormGroup, CardFooter} from "reactstrap";
import {AppState} from "../../state/reducers";
import history from "../../services/history";
const stateToProps = (state: AppState) => ({
    user: state ? state.user : null,
    errorMessage: state ? state.error : null
});
const dispatchToProps = {
    handleResetPassword: handlePasswordReset,
    verifyPasswordReset: verifyPasswordReset
};

interface PasswordResetHandlerProps {
    user: RegisteredUserDTO | null,
    handleResetPassword: (params: {token: string | null, password: string | null}) => void,
    verifyPasswordReset: (token: string | null) => void,
    errorMessage: string | null
}

const ResetPasswordHandlerComponent = ({user, handleResetPassword, verifyPasswordReset, errorMessage}: PasswordResetHandlerProps) => {
    const resetToken = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);

    const [isValidPassword, setValidPassword] = useState(true);
    const [currentPassword, setCurrentPassword] = useState("");

    useEffect(() => {
        console.log("useeffect in reset password");
        setTimeout(function(){verifyPasswordReset(resetToken)},10);
    }, []);

    return <div id="email-verification">
        <div>
            <h3>Password Change</h3>
            <Card>
                <CardBody>
                    <Form name="passwordReset">
                        <Row>
                            <FormGroup>
                                <Label htmlFor="password-input">New Password</Label>
                                <Input id="password" type="password" name="password" required/>
                            </FormGroup>
                        </Row>
                        <Row>
                            <FormGroup>
                                <Label htmlFor="password-confirm">Re-enter New Password</Label>
                                <Input invalid={!isValidPassword} id="password-confirm" type="password" name="password" onBlur={(e: any) => {(
                                    (e.target.value == (document.getElementById("password") as HTMLInputElement).value) &&
                                    ((document.getElementById("password") as HTMLInputElement).value != undefined) &&
                                    ((document.getElementById("password") as HTMLInputElement).value.length > 5)) ? setValidPassword(true) : setValidPassword(false);
                                    (e.target.value == (document.getElementById("password") as HTMLInputElement).value) ? setCurrentPassword(e.target.value) : null}
                                } required/>
                                <FormFeedback>{(!isValidPassword) ? "Password must be at least 6 characters long" : null}</FormFeedback>
                            </FormGroup>
                        </Row>
                    </Form>
                </CardBody>
                <CardFooter>
                    <h4 role="alert" className="text-danger text-center mb-0">
                        {errorMessage}
                    </h4>
                    <Button color="secondary" className="mb-2" block onClick={(e: any) => (isValidPassword && !errorMessage) ? handleResetPassword({token: resetToken, password: currentPassword}) : null}>Change Password</Button>
                </CardFooter>
            </Card>
        </div>
    </div>;
};

export const ResetPasswordHandler = connect(stateToProps, dispatchToProps)(ResetPasswordHandlerComponent);

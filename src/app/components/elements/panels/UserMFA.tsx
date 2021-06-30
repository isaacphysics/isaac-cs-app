import {Button, CardBody, Col, Form, FormGroup, Input, Label, Row} from "reactstrap";
import React, {useMemo, useState} from "react";
import {ValidationUser} from "../../../../IsaacAppTypes";
import {UserAuthenticationSettingsDTO} from "../../../../IsaacApiTypes";
import {useDispatch, useSelector} from "react-redux";
import {SITE, SITE_SUBJECT, SITE_SUBJECT_TITLE} from "../../../services/siteConstants";
import {disableTotpForAccount, getNewTotpSecret, setupAccountMFA} from "../../../state/actions";
import QRCode from 'qrcode'
import {AppState} from "../../../state/reducers";
import {selectors} from "../../../state/selectors";

interface UserMFAProps {
    userToUpdate: ValidationUser;
    userAuthSettings: UserAuthenticationSettingsDTO | null;
    editingOtherUser: boolean;
}

export const UserMFA = ({userToUpdate, userAuthSettings, editingOtherUser}: UserMFAProps) => {
    const dispatch = useDispatch();
    const segueEnvironment = useSelector(selectors.segue.environmentOrUnknown);
    const totpSharedSecret = useSelector((state: AppState) => state?.totpSharedSecret?.sharedSecret);
    const [updateMFARequest, setUpdateMFARequest] = useState(false);
    const [successfulMFASetup, setSuccessfulMFASetup] = useState(false);
    const [mfaVerificationCode, setMFAVerificationCode] = useState<string | undefined>(undefined);
    const [qrCodeStringBase64SVG, setQrCodeStringBase64SVG] = useState<string | undefined>(undefined);

    const authenticatorURL: string | null = useMemo(() => {
        if (totpSharedSecret) {
            let issuer = encodeURIComponent(`Isaac ${SITE_SUBJECT_TITLE}`);
            if (segueEnvironment === "DEV") {
                issuer += encodeURIComponent(` (${window.location.host})`);
            }
            const authenticatorURL = `otpauth://totp/${userToUpdate.email}?secret=${totpSharedSecret}&issuer=${issuer}`;
            QRCode.toString(authenticatorURL, {type:'svg'}, function (err, val) {
                if (err) {
                    console.error(err);
                    return;
                }
                setQrCodeStringBase64SVG(new Buffer(val).toString('base64'));
            });
            return authenticatorURL;
        }
        return null;
    }, [totpSharedSecret]);

    if (totpSharedSecret == null && mfaVerificationCode) {
        // assume we have just completed a successful configuration of MFA as secret is clear and tidy up
        setUpdateMFARequest(false);
        setMFAVerificationCode(undefined);
        setSuccessfulMFASetup(true);
    }

    function setupMFA(event?: React.FormEvent<HTMLFormElement>) {
        if (event) {event.preventDefault(); event.stopPropagation();}
        if (totpSharedSecret && mfaVerificationCode) {
            dispatch(setupAccountMFA(totpSharedSecret, mfaVerificationCode));
        }
    }

    return <CardBody className="pt-0">
        <Row>
            <Col md={{size: 6, offset: 3}}>
                <hr className="text-center" />
                <h4>Two-factor Authentication (2FA)</h4>
            </Col>
        </Row>
        {!editingOtherUser && userAuthSettings && userAuthSettings.hasSegueAccount ?
            <Row>
                <Col>

                    <Row>
                        <Col md={{size: 6, offset: 3}}>
                            <p><strong>2FA Status: </strong>{userAuthSettings.mfaStatus || successfulMFASetup ? "Enabled" : "Disabled"}</p>
                        </Col>
                    </Row>
                    {updateMFARequest ?
                        <Form onSubmit={setupMFA}>
                            <Row>
                                <Col md={{size: 6, offset: 3}}>
                                    <h5>Configure Two-factor Authentication (2FA)</h5>
                                    <p><strong>Step 1:</strong> Scan the QRcode below on your phone</p>
                                    <div className="qrcode-mfa vertical-center">
                                        {qrCodeStringBase64SVG && <img
                                            src={'data:image/svg+xml;base64,' + qrCodeStringBase64SVG}
                                            alt={"Follow this URL to setup 2FA: " + authenticatorURL}
                                        />}
                                    </div>

                                    <FormGroup>
                                        <p><strong>Step 2:</strong> Enter the code provided by your app</p>
                                        <Label htmlFor="setup-verification-code">Verification Code</Label>
                                        <Input
                                            id="setup-verification-code" type="text" name="setup-verification-code"
                                            value={mfaVerificationCode || ""}
                                            onChange={e => setMFAVerificationCode(e.target.value.replace(/ /g, ""))}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Button
                                            className="btn-secondary"
                                            disabled={!mfaVerificationCode}
                                            type="submit"
                                        >
                                            {userAuthSettings.mfaStatus ? "Change 2FA Device" : "Enable 2FA"}
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Form>
                        :
                        <Row>
                            <Col md={{size: 6, offset: 3}}>
                                <FormGroup>
                                    <Button
                                        className="btn-secondary"
                                        onClick={() => {setUpdateMFARequest(true); dispatch(getNewTotpSecret())}}
                                    >
                                        {userAuthSettings.mfaStatus ? "Change 2FA Device" : "Enable 2FA"}
                                    </Button>
                                </FormGroup>
                            </Col>
                        </Row>

                    }
                </Col>
            </Row>
            :   <React.Fragment>
                <Row className="pt-4">
                    <Col className="text-center">
                        {!editingOtherUser && userAuthSettings && userAuthSettings.linkedAccounts && <p>
                            You do not currently have a password set for this account; you
                            sign in using {" "}
                            {(userAuthSettings.linkedAccounts).map((linked, index) => {
                                return <span key={index} className="text-capitalize">{linked.toLowerCase()}</span>;
                            })}.
                        </p>}
                    </Col>
                </Row>
            </React.Fragment>
        }
        {editingOtherUser &&
            <React.Fragment>
                <Row className="pt-4">
                    <Col className="text-center">
                        {userAuthSettings && <p>
                            <FormGroup>
                                <Button
                                    className="btn-secondary"
                                    onClick={() => {userToUpdate.id && dispatch(disableTotpForAccount(userToUpdate.id))}}
                                >
                                    Disable 2FA for user
                                </Button>
                            </FormGroup>
                        </p>}
                    </Col>
                </Row>
            </React.Fragment>
        }

    </CardBody>
};

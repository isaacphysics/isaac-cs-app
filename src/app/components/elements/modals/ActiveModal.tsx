import React, {useEffect, useState} from "react";
import * as RS from "reactstrap";
import * as AppTypes from "../../../../IsaacAppTypes";
import {store} from "../../../state/store";
import {closeActiveModal} from "../../../state/actions";

interface ActiveModalProps {
    activeModal?: AppTypes.ActiveModal | null;
}

export const ActiveModal = ({activeModal}: ActiveModalProps) => {
    const ModalBody = activeModal && activeModal.body;
    const [isOpen, setIsOpen] = useState(true);

    const toggle = () => {
        const isNowOpen = !isOpen;
        setIsOpen(isNowOpen);
    };

    useEffect(() => {
        if (!isOpen) {
            store.dispatch(closeActiveModal());
        }
    }, [isOpen]);

    return <RS.Modal toggle={toggle} isOpen={isOpen} size={(activeModal && activeModal.size) || "lg"}>
        {activeModal && <React.Fragment>
            <RS.ModalHeader
                className="h-title pb-5 mb-4"
                close={
                    activeModal.closeAction ?
                        <button className="close" onClick={activeModal.closeAction}>Close</button> : null
                }
            >
                {activeModal.title}
            </RS.ModalHeader>
            <RS.ModalBody className="px-1 pb-2 mx-4">
                <RS.Col>
                    {typeof ModalBody === "function" ? <ModalBody /> : ModalBody}
                </RS.Col>
            </RS.ModalBody>
            {activeModal.buttons &&
                <RS.ModalFooter className="mb-4 mx-2 align-self-center">
                    {activeModal.buttons}
                </RS.ModalFooter>
            }
        </React.Fragment>}
    </RS.Modal>
};

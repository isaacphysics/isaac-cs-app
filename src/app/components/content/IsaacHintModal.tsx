import React, {useState} from "react";
import {Button, Modal, ModalBody, ModalHeader} from "reactstrap";
import {IsaacContent} from "./IsaacContent";
import {ContentDTO} from "../../../IsaacApiTypes";
import {useDispatch} from "react-redux";
import {logAction} from "../../state/actions";

interface HintModalProps {
    label: string;
    title: string;
    body: ContentDTO;
    scrollable: boolean;
    questionPartId: string;
    hintIndex: number;
}
export const IsaacHintModal = (props: HintModalProps) => {
    const dispatch = useDispatch();
    const {questionPartId, hintIndex, label, title, body, ...restOfProps} = props;
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => {
        const isNowOpen = !isOpen;
        setIsOpen(isNowOpen);
        if (isNowOpen) {
            const eventDetails = {type: "VIEW_HINT", questionId: questionPartId, hintIndex: hintIndex};
            dispatch(logAction(eventDetails));
        }
    };

    const closeButton = <button className="close" onClick={toggle}>Close</button>;

    return <div>
        <Button color="link" size="sm" className="a-alt" onClick={toggle}>
            {label}
        </Button>

        <Modal isOpen={isOpen} toggle={toggle} size={"lg"} {...restOfProps}>
            <ModalHeader close={closeButton}>
                {title}
            </ModalHeader>
            <ModalBody>
                <IsaacContent doc={body} />
            </ModalBody>
        </Modal>
    </div>
};

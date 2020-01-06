import React, {useEffect} from 'react';
import {useSelector} from "react-redux";
import {withRouter} from "react-router-dom";
import {Col, Row} from "reactstrap";
import {AppState} from "../../state/reducers";
import {GlossaryTermDTO} from "../../../IsaacApiTypes";
import {IsaacContent} from "./IsaacContent";
import {scrollVerticallyIntoView} from "../../services/scrollManager";
import {determineExamBoardFrom} from "../../services/examBoard";

interface IsaacGlossaryTermProps {
    doc: GlossaryTermDTO;
    location: {hash: string};
}

// TODO add figure counting and linking
const IsaacGlossaryTermComponent = ({doc, location: {hash}}: IsaacGlossaryTermProps) => {
    let anchorId: string | undefined = doc.id && doc.id.split('|')[1];
    const userPreferences = useSelector((state: AppState) => state && state.userPreferences || null);
    const examBoard = determineExamBoardFrom(userPreferences);

    useEffect(() => {
        if (hash.includes("#")) {
            const hashAnchor = hash.slice(1);
            const element = document.getElementById(hashAnchor);
            if (element && anchorId) { // exists on page
                if (anchorId.indexOf(hashAnchor) === 0) {
                    scrollVerticallyIntoView(element);
                }
            }
        }
    }, [hash, anchorId]);

    return <React.Fragment>
        {(doc.examBoard == '' || examBoard === doc.examBoard) && <Row className="glossary_term">
            <Col md={3}>
                <p id={anchorId}><strong>{doc.value}</strong></p>
            </Col>
            <Col>
                {doc.explanation && <IsaacContent doc={doc.explanation} />}
            </Col>
        </Row>}
    </React.Fragment>;
};

export const IsaacGlossaryTerm = withRouter(IsaacGlossaryTermComponent);
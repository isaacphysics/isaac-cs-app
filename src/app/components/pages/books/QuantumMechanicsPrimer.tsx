import {Col, Container} from "reactstrap";
import React from "react";
import {TitleAndBreadcrumb} from "../../elements/TitleAndBreadcrumb";
import {PageFragment} from "../../elements/PageFragment";

export const QuantumMechanicsPrimer = () => {

    const pageHelp = <span>
        The Isaac Physics Quantum Mechanics Primer
    </span>;

    return <Container className="physics">
        <Col>
            <div className="book-intro">
                <TitleAndBreadcrumb className="mb-5" currentPageTitle="Quantum Mechanics Primer" />
                <PageFragment fragmentId="quantum_mechanics_primer_intro"/>
            </div>
        </Col>
    </Container>
};

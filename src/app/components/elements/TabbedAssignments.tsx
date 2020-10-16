import React, {MouseEvent, useState} from "react";
import {AssignmentDTO} from "../../../IsaacApiTypes";
import {Col, Nav, NavItem, NavLink, Row} from 'reactstrap';
import {ifKeyIsEnter} from "../../services/navigation";
import {Assignments} from "./Assignments";

interface TabbedAssignmentsProps {
    myAssignments: {
        inProgressRecent: AssignmentDTO[],
        inProgressOld: AssignmentDTO[],
        completed: AssignmentDTO[]
    }
}

export const TabbedAssignments = ({myAssignments}: TabbedAssignmentsProps) => {
    const [activeTab, setActiveTab] = useState(0);

    const showOld = myAssignments.inProgressRecent.length == 0 && myAssignments.inProgressOld.length > 0 && function(event: MouseEvent) {
        setActiveTab(1);
        event.preventDefault();
    } || undefined;

    const tabs: [React.ReactElement, AssignmentDTO[]][] = [
        [<span key={1}><span className="d-none d-md-inline">Assignments </span>To&nbsp;Do</span>, myAssignments.inProgressRecent],
        [<span key={2}>Older<span className="d-none d-md-inline"> Assignments</span></span>, myAssignments.inProgressOld],
        [<span key={3}><span className="d-none d-md-inline">Completed Assignments</span><span className="d-inline d-md-none">Done</span></span>, myAssignments.completed]
    ];

    return <>
        <Nav className="mt-4 mb-3" tabs>
            {tabs.map(([tabTitle, tabItems], mapIndex) => {
                const tabIndex = mapIndex;
                const classes = activeTab === tabIndex ? "active" : "";
                return <NavItem key={tabIndex} className="px-3">
                    <NavLink
                        className={classes} tabIndex={0} onClick={() => setActiveTab(tabIndex)}
                        onKeyDown={ifKeyIsEnter(() => setActiveTab(tabIndex))}
                    >
                        {tabTitle} ({tabItems.length || 0})
                    </NavLink>
                </NavItem>;
            })}
        </Nav>
        <Row>
            <Col sm="12">
                <Assignments assignments={tabs[activeTab][1]} showOld={showOld} />
            </Col>
        </Row>
    </>;
};

import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {loadMyAssignments, logAction} from "../../state/actions";
import {ShowLoading} from "../handlers/ShowLoading";
import {AppState} from "../../state/reducers";
import {Card, CardBody, Container} from 'reactstrap';
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {filterAssignmentsByStatus} from "../../services/assignments";
import {TabbedAssignments} from "../elements/TabbedAssignments";

export const MyAssignments = () => {
    const dispatch = useDispatch();
    useEffect(() => {dispatch(loadMyAssignments())}, [dispatch]);
    useEffect(() => {dispatch(logAction({type: "VIEW_MY_ASSIGNMENTS"}))}, [dispatch]);

    const assignments = useSelector((state: AppState) => state?.assignments || null);
    const myAssignments = filterAssignmentsByStatus(assignments);

    const pageHelp = <span>
        Any assignments you have been set will appear here.<br />
        Unfinished overdue assignments will show in Assignments To Do for 5 days after they are due, after which they move to Older Assignments.
    </span>;

    return <Container>
        <TitleAndBreadcrumb currentPageTitle="My assignments" help={pageHelp} />
        <Card className="my-5">
            <CardBody className="pt-0">
                <ShowLoading until={assignments}>
                    <TabbedAssignments myAssignments={myAssignments}/>
                </ShowLoading>
            </CardBody>
        </Card>
    </Container>;
};

import React, {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from "react-redux";
import * as RS from "reactstrap";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {
    getAnsweredQuestionsByDate,
    getEasiestUnsolvedQuestions,
    getMostRecentAttemptedQuestionPages,
    getProgress, loadMyAssignments, logAction
} from "../../state/actions";
import {AppState} from "../../state/reducers";
import {isTeacher} from "../../services/user";
import {withRouter} from "react-router-dom";
import {PotentialUser} from "../../../IsaacAppTypes";
import {Unauthorised} from "./Unauthorised";
import {AggregateQuestionStats} from "../elements/panels/AggregateQuestionStats";
import {DailyStreakPanel} from "../elements/panels/DailyStreakPanel";
import {Tabs} from "../elements/Tabs";
import {FlushableRef, QuestionProgressCharts} from "../elements/views/QuestionProgressCharts";
import {HUMAN_QUESTION_TAGS, HUMAN_QUESTION_TYPES} from "../../services/questions";
import {ProgressBar} from "../elements/views/ProgressBar";
import {safePercentage} from "../../services/validation";
import {TeacherAchievement} from "../elements/TeacherAchievement";
import {SITE, SITE_SUBJECT} from "../../services/siteConstants";
import {QuestionLinkRow} from "../elements/QuestionLinkRow";
import {ProgressHeatmap} from "../elements/views/ProgressHeatmap";
import {filterAssignmentsByStatus} from "../../services/assignments";
import {TabbedAssignments} from "../elements/TabbedAssignments";

export const siteSpecific = {
    [SITE.PHY]: {
        questionTypeStatsList: [
            "isaacMultiChoiceQuestion", "isaacNumericQuestion", "isaacSymbolicQuestion", "isaacSymbolicChemistryQuestion"
        ],
        questionTagsStatsList: [
            "maths_book", "physics_skills_14", "physics_skills_19", "phys_book_gcse", "chemistry_16"
        ],
        typeColWidth: "col-lg-6",
        tagColWidth: "col-lg-12"
    },
    [SITE.CS]: {
        questionTypeStatsList: [
            "isaacMultiChoiceQuestion", "isaacItemQuestion", "isaacParsonsQuestion", "isaacNumericQuestion",
            "isaacStringMatchQuestion", "isaacFreeTextQuestion", "isaacSymbolicLogicQuestion"
        ],
        questionTagsStatsList: [] as string[],
        typeColWidth: "col-lg-4",
        tagColWidth: "col-lg-12"
    }
}[SITE_SUBJECT];


interface MyProgressProps {
    user: PotentialUser;
    match: {params: {userIdOfInterest: string}};
}
export const MyProgress = withRouter(({user, match: {params: {userIdOfInterest}}}: MyProgressProps) => {
    const viewingOwnData = userIdOfInterest === undefined || (user.loggedIn && parseInt(userIdOfInterest) === user.id);

    const dispatch = useDispatch();
    const userProgress = useSelector((state: AppState) => state?.userProgress);
    const achievements = useSelector((state: AppState) => state?.userProgress?.userSnapshot?.achievementsRecord);
    const answeredQuestionsByDate = useSelector((state: AppState) => state?.answeredQuestionsByDate);
    const mostRecentQuestions = useSelector((state: AppState) => state?.mostRecentAttemptedQuestions);
    const easiestUnsolvedQuestions = useSelector((state: AppState) => state?.easiestUnsolvedQuestions);
    const assignments = useSelector((state: AppState) => state?.assignments || null);
    const myAssignments = filterAssignmentsByStatus(assignments);

    useEffect(() => {
        if (viewingOwnData && user.loggedIn) {
            dispatch(getProgress());
            dispatch(getAnsweredQuestionsByDate(user.id as number, 0, Date.now(), true));
            dispatch(getMostRecentAttemptedQuestionPages(user.id as number, 5));
            dispatch(getEasiestUnsolvedQuestions(user.id as number, false, 5));
            dispatch(loadMyAssignments());
            dispatch(logAction({type: "VIEW_MY_ASSIGNMENTS"}));
        } else if (isTeacher(user)) {
            dispatch(getProgress(userIdOfInterest));
            dispatch(getAnsweredQuestionsByDate(userIdOfInterest, 0, Date.now(), true));
            dispatch(getMostRecentAttemptedQuestionPages(userIdOfInterest, 5));
            dispatch(getEasiestUnsolvedQuestions(userIdOfInterest, false, 5));
        }
    }, [dispatch, userIdOfInterest, viewingOwnData, user]);

    const tabRefs: FlushableRef[] = [useRef(), useRef()];

    if (!viewingOwnData && !isTeacher(user)) {
        return <Unauthorised />
    }

    return <RS.Container id="my-progress" className="mb-5">
        <TitleAndBreadcrumb currentPageTitle="My progress" />
        <RS.Card className="mt-4">
            <RS.CardBody>
                <Tabs>{{
                    "Question activity": <div>
                        <RS.Row>
                            <RS.Col>
                                <AggregateQuestionStats userProgress={userProgress} />
                            </RS.Col>
                            {SITE_SUBJECT === SITE.PHY && <RS.Col className="align-self-center" xs={12} md={3}>
                                <DailyStreakPanel userProgress={userProgress} />
                            </RS.Col>}
                        </RS.Row>

                        <RS.Card className="mt-4">
                            <RS.CardBody>
                                <Tabs tabContentClass="mt-4" onActiveTabChange={(tabIndex) => {
                                    const flush = tabRefs[tabIndex - 1].current;
                                    if (flush) {
                                        // Don't call the flush in an event handler that causes the render, that's too early.
                                        // Call it once that's done.
                                        requestAnimationFrame(() => {
                                            flush();
                                            // You'd think this wouldn't do anything, but it fixes the vertical position of the
                                            // legend. I'm beginning to dislike this library.
                                            flush();
                                        });
                                    }
                                }}>
                                    {{
                                        "Correct questions": <QuestionProgressCharts
                                            subId="correct"
                                            questionsByTag={(userProgress?.correctByTag) || {}}
                                            questionsByLevel={(userProgress?.correctByLevel) || {}}
                                            flushRef={tabRefs[0]} />,
                                        "Attempted questions": <QuestionProgressCharts
                                            subId="attempted"
                                            questionsByTag={(userProgress?.attemptsByTag) || {}}
                                            questionsByLevel={(userProgress?.attemptsByLevel) || {}}
                                            flushRef={tabRefs[1]}/>
                                    }}
                                </Tabs>
                            </RS.CardBody>
                        </RS.Card>

                        <div className="mt-4">
                            <h4>Question parts correct by Type</h4>
                            <RS.Row>
                                {siteSpecific.questionTypeStatsList.map((qType: string) => {
                                    const correct = userProgress?.correctByType?.[qType] || null;
                                    const attempts = userProgress?.attemptsByType?.[qType] || null;
                                    const percentage = safePercentage(correct, attempts);
                                    return <RS.Col key={qType} className={`${siteSpecific.typeColWidth} mt-2 type-progress-bar`}>
                                        <div className={"px-2"}>
                                            {HUMAN_QUESTION_TYPES.get(qType)} questions correct
                                        </div>
                                        <div className={"px-2"}>
                                            <ProgressBar percentage={percentage || 0}>
                                                {percentage == null ? "No data" : `${correct} of ${attempts}`}
                                            </ProgressBar>
                                        </div>
                                    </RS.Col>;
                                })}
                            </RS.Row>
                        </div>

                        {SITE_SUBJECT === SITE.PHY && <div className="mt-4">
                            <h4>Isaac Books</h4>
                            <RS.Row>
                                {siteSpecific.questionTagsStatsList.map((qType: string) => {
                                    const correct = userProgress?.correctByTag?.[qType] || null;
                                    const attempts = userProgress?.attemptsByTag?.[qType] || null;
                                    const percentage = safePercentage(correct, attempts);
                                    return <RS.Col key={qType} className={`${siteSpecific.tagColWidth} mt-2 type-progress-bar`}>
                                        <div className={"px-2"}>
                                            {HUMAN_QUESTION_TAGS.get(qType)} questions completed correctly of those attempted
                                        </div>
                                        <div className={"px-2"}>
                                            <ProgressBar percentage={percentage || 0} type={qType}>
                                                {percentage == null ? "No data" : `${correct} of ${attempts}`}
                                            </ProgressBar>
                                        </div>
                                    </RS.Col>;
                                })}
                            </RS.Row>
                        </div>}

                        {answeredQuestionsByDate && <div className="mt-4">
                            <h4>Question attempts over time</h4>
                            <ProgressHeatmap answeredQuestionsByDate={answeredQuestionsByDate} />
                        </div>}

                        <RS.Row>
                            {mostRecentQuestions && <RS.Col md={12} lg={SITE_SUBJECT === SITE.PHY ? 12 : 6} className="mt-4">
                                <h4>Most recently attempted questions</h4>
                                <RS.ListGroup className="link-list list-group-links list-gameboard">
                                    {mostRecentQuestions.map((question,i) =>
                                        <QuestionLinkRow key={i} question={question}/>
                                    )}
                                </RS.ListGroup>
                            </RS.Col>}
                            {easiestUnsolvedQuestions && <RS.Col md={12} lg={SITE_SUBJECT === SITE.PHY ? 12 : 6} className="mt-4">
                                <h4>Easiest unsolved questions</h4>
                                <RS.ListGroup className="link-list list-group-links list-gameboard">
                                    {easiestUnsolvedQuestions.map((question,i) =>
                                        <QuestionLinkRow key={i} question={question}/>
                                    )}
                                </RS.ListGroup>
                            </RS.Col>}
                        </RS.Row>

                        {myAssignments && <div className="mt-4">
                            <h4>Your assignments</h4>
                            <TabbedAssignments myAssignments={myAssignments}/>
                        </div>}
                    </div>,
                    ...(viewingOwnData && isTeacher(user) && SITE_SUBJECT == SITE.PHY && {"Teacher Activity": <div>
                        <TeacherAchievement
                            verb="created"
                            count={achievements && achievements.TEACHER_GROUPS_CREATED}
                            item="group"
                            createMoreText="Manage groups"
                            createMoreLink="/groups"
                            iconClassName="group-badge"/>

                        <TeacherAchievement
                            verb="set"
                            count={achievements && achievements.TEACHER_ASSIGNMENTS_SET}
                            item="assignment"
                            createMoreText="Set assignments"
                            createMoreLink="/set_assignments"
                            iconClassName="assignment-badge"/>

                        <TeacherAchievement
                            verb="created"
                            count={achievements && achievements.TEACHER_GAMEBOARDS_CREATED}
                            item="gameboard"
                            createMoreText="Board builder"
                            createMoreLink="/gameboard_builder"
                            iconClassName="gameboard-badge"/>

                        <TeacherAchievement
                            verb="set"
                            count={achievements && achievements.TEACHER_BOOK_PAGES_SET}
                            item="book page assignment"
                            createMoreText="Set assignments"
                            createMoreLink="/set_assignments"
                            iconClassName="book-page-badge"/>

                        <TeacherAchievement
                            verb="visited"
                            count={achievements && achievements.TEACHER_CPD_EVENTS_ATTENDED}
                            item="CPD event"
                            createMoreText="Events"
                            createMoreLink="/events"
                            iconClassName="cpd-badge"/>
                    </div>}),
                }}</Tabs>
            </RS.CardBody>
        </RS.Card>
    </RS.Container>
});

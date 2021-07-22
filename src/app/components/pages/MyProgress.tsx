import React, {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from "react-redux";
import * as RS from "reactstrap";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {
    getMyAnsweredQuestionsByDate,
    getMyProgress,
    getUserAnsweredQuestionsByDate,
    getUserProgress
} from "../../state/actions";
import {AppState} from "../../state/reducers";
import {isTeacher} from "../../services/user";
import {withRouter} from "react-router-dom";
import {PotentialUser} from "../../../IsaacAppTypes";
import {Unauthorised} from "./Unauthorised";
import {AggregateQuestionStats} from "../elements/panels/AggregateQuestionStats";
import {StreakPanel} from "../elements/panels/StreakPanel";
import {Tabs} from "../elements/Tabs";
import {FlushableRef, QuestionProgressCharts} from "../elements/views/QuestionProgressCharts";
import {HUMAN_QUESTION_TAGS, HUMAN_QUESTION_TYPES} from "../../services/questions";
import {ActivityGraph} from "../elements/views/ActivityGraph";
import {ProgressBar} from "../elements/views/ProgressBar";
import {safePercentage} from "../../services/validation";
import {TeacherAchievement} from "../elements/TeacherAchievement";
import {SITE, SITE_SUBJECT} from "../../services/siteConstants";
import {LinkToContentSummaryList} from "../elements/list-groups/ContentSummaryListGroupItem";

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
    const myProgress = useSelector((state: AppState) => state?.myProgress);
    const userProgress = useSelector((state: AppState) => state?.userProgress);
    const achievements = useSelector((state: AppState) => state?.myProgress?.userSnapshot?.achievementsRecord);
    const myAnsweredQuestionsByDate = useSelector((state: AppState) => state?.myAnsweredQuestionsByDate);
    const userAnsweredQuestionsByDate = useSelector((state: AppState) => state?.userAnsweredQuestionsByDate);

    useEffect(() => {
        if (viewingOwnData && user.loggedIn) {
            dispatch(getMyProgress());
            dispatch(getMyAnsweredQuestionsByDate(user.id as number, 0, Date.now(), false));
        } else if (isTeacher(user)) {
            dispatch(getUserProgress(userIdOfInterest));
            dispatch(getUserAnsweredQuestionsByDate(userIdOfInterest, 0, Date.now(), false));
        }
    }, [dispatch, userIdOfInterest, viewingOwnData, user]);

    const tabRefs: FlushableRef[] = [useRef(), useRef()];

    if (!viewingOwnData && !isTeacher(user)) {
        return <Unauthorised />
    }

    const progress = (!viewingOwnData && isTeacher(user)) ? userProgress : myProgress;
    const answeredQuestionsByDate = (!viewingOwnData && isTeacher(user)) ? userAnsweredQuestionsByDate : myAnsweredQuestionsByDate;

    const userName = `${progress?.userDetails?.givenName || ""}${progress?.userDetails?.givenName ? " " : ""}${progress?.userDetails?.familyName || ""}`;
    const pageTitle = viewingOwnData ? "My progress" : `Progress for ${userName || "user"}`;

    return <RS.Container id="my-progress" className="mb-5">
        <TitleAndBreadcrumb currentPageTitle={pageTitle} />
        <RS.Card className="mt-4">
            <RS.CardBody>
                <Tabs>{{
                    "Question activity": <div>
                        <RS.Row>
                            <RS.Col>
                                <AggregateQuestionStats userProgress={progress} />
                            </RS.Col>
                            {SITE_SUBJECT === SITE.PHY && <RS.Col className="align-self-center" xs={12} md={3}>
                                <StreakPanel userProgress={progress} />
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
                                            questionsByTag={(progress?.correctByTag) || {}}
                                            questionsByLevel={(progress?.correctByLevel) || {}}
                                            flushRef={tabRefs[0]} />,
                                        "Attempted questions": <QuestionProgressCharts
                                            subId="attempted"
                                            questionsByTag={(progress?.attemptsByTag) || {}}
                                            questionsByLevel={(progress?.attemptsByLevel) || {}}
                                            flushRef={tabRefs[1]}/>
                                    }}
                                </Tabs>
                            </RS.CardBody>
                        </RS.Card>

                        <div className="mt-4">
                            <h4>Question parts correct by Type</h4>
                            <RS.Row>
                                {siteSpecific.questionTypeStatsList.map((qType: string) => {
                                    const correct = progress?.correctByType?.[qType] || null;
                                    const attempts = progress?.attemptsByType?.[qType] || null;
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
                                    const correct = progress?.correctByTag?.[qType] || null;
                                    const attempts = progress?.attemptsByTag?.[qType] || null;
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
                            <div>
                                <ActivityGraph answeredQuestionsByDate={answeredQuestionsByDate} />
                            </div>
                        </div>}
                        <RS.Row id="progress-questions">
                            {progress?.mostRecentQuestions && progress?.mostRecentQuestions.length > 0 && <RS.Col md={12} lg={6} className="mt-4">
                                <h4>Most recently answered questions</h4>
                                <LinkToContentSummaryList items={progress.mostRecentQuestions}/>
                            </RS.Col>}
                            {progress?.oldestIncompleteQuestions && progress?.oldestIncompleteQuestions.length > 0 && <RS.Col md={12} lg={6} className="mt-4">
                                <h4>Oldest unsolved questions</h4>
                                <LinkToContentSummaryList items={progress.oldestIncompleteQuestions}/>
                            </RS.Col>}
                        </RS.Row>
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

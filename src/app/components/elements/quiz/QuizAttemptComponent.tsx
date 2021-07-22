import {IsaacQuizDTO, IsaacQuizSectionDTO, QuestionDTO, QuizAttemptDTO} from "../../../../IsaacApiTypes";
import React from "react";
import {isDefined} from "../../../services/miscUtils";
import {extractTeacherName} from "../../../services/user";
import {Spacer} from "../Spacer";
import {formatDate} from "../DateString";
import {Link} from "react-router-dom";
import {QuizAttemptContext} from "../../content/QuizQuestion";
import {WithFigureNumbering} from "../WithFigureNumbering";
import {IsaacContent} from "../../content/IsaacContent";
import * as RS from "reactstrap";
import {TitleAndBreadcrumb} from "../TitleAndBreadcrumb";
import {showQuizSettingModal} from "../../../state/actions/quizzes";
import {useDispatch} from "react-redux";
import {Col, Row} from "reactstrap";
import {SITE, SITE_SUBJECT} from "../../../services/siteConstants";
import {UserContextPicker} from "../inputs/UserContextPicker";
import {below, useDeviceSize} from "../../../services/device";
import { TrustedMarkdown } from "../TrustedMarkdown";

type PageLinkCreator = (attempt: QuizAttemptDTO, page?: number) => string;

export interface QuizAttemptProps {
    attempt: QuizAttemptDTO;
    page: number | null;
    questions: QuestionDTO[];
    sections: { [id: string]: IsaacQuizSectionDTO };
    pageLink: PageLinkCreator;
    pageHelp: React.ReactElement;
    preview?: boolean;
}

function inSection(section: IsaacQuizSectionDTO, questions: QuestionDTO[]) {
    return questions.filter(q => q.id?.startsWith(section.id as string + "|"));
}

function QuizContents({attempt, sections, questions, pageLink}: QuizAttemptProps) {
    if (isDefined(attempt.completedDate)) {
        return attempt.feedbackMode === "NONE" ?
            <h4>No feedback available</h4>
            : attempt.feedbackMode === "OVERALL_MARK" ?
                <h4>Your mark is {attempt.quiz?.individualFeedback?.overallMark?.correct} / {attempt.quiz?.total}</h4>
                :
                <table className="quiz-marks-table">
                    <tbody>
                    <tr>
                        <th>Overall mark</th>
                        <td>{attempt.quiz?.individualFeedback?.overallMark?.correct} / {attempt.quiz?.total}</td>
                    </tr>
                    <tr>
                        <th colSpan={2}>Section mark breakdown</th>
                    </tr>
                    {Object.keys(sections).map((k, index) => {
                        const section = sections[k];
                        return <tr key={k}>
                            <td><Link replace to={pageLink(attempt, index + 1)}>{section.title}</Link></td>
                            <td>
                                {attempt.quiz?.individualFeedback?.sectionMarks?.[section.id as string]?.correct}
                                {" / "}
                                {attempt.quiz?.sectionTotals?.[section.id as string]}
                            </td>
                        </tr>;
                    })}
                    </tbody>
                </table>;
    } else {
        const anyStarted = questions.some(q => q.bestAttempt !== undefined);
        return <React.Fragment>
            <div><TrustedMarkdown markdown={(attempt.quiz as IsaacQuizDTO).rubric || ""}></TrustedMarkdown></div>
            <h4>Quiz sections</h4>
            <ul>
                {Object.keys(sections).map((k, index) => {
                    const section = sections[k];
                    const questionsInSection = inSection(section, questions);
                    const answerCount = questionsInSection.filter(q => q.bestAttempt !== undefined).length;
                    const completed = questionsInSection.length === answerCount;
                    return <li key={k}>
                        <Link replace to={pageLink(attempt, index + 1)}>{section.title}</Link>
                        {" "}
                        <small className="text-muted">{completed ? "Completed" : anyStarted ? `${answerCount} / ${questionsInSection.length}` : ""}</small>
                    </li>;
                })}
            </ul>
        </React.Fragment>;
    }
}

function QuizHeader({attempt, preview}: QuizAttemptProps) {
    const dispatch = useDispatch();
    const assignment = attempt.quizAssignment;
    if (preview) {
        return <p className="d-flex">
            <span>You are previewing this quiz.</span>
            <Spacer />
            <RS.Button onClick={() => dispatch(showQuizSettingModal(attempt.quiz as IsaacQuizDTO))}>Set Quiz</RS.Button>
        </p>;
    } else if (isDefined(assignment)) {
        return <p className="d-flex">
            <span>
                Set by: {extractTeacherName(assignment.assignerSummary ?? null)}
                {isDefined(attempt.completedDate) && <><br />Completed:&nbsp;{formatDate(attempt.completedDate)}</>}
            </span>
            {isDefined(assignment.dueDate) && <><Spacer/>{isDefined(attempt.completedDate) ? "Was due:" : "Due:"}&nbsp;{formatDate(assignment.dueDate)}</>}
        </p>;
    } else {
        return <p>You {attempt.completedDate ? "freely attempted" : "are freely attempting"} this quiz.</p>
    }
}

function QuizSection({attempt, page}: { attempt: QuizAttemptDTO, page: number }) {
    const sections = attempt.quiz?.children;
    const section = sections && sections[page - 1];
    return section ?
        <Row className="question-content-container">
            <Col md={{[SITE.CS]: {size: 8, offset: 2}, [SITE.PHY]: {size: 12}}[SITE_SUBJECT]} className="py-4 question-panel">
                <UserContextPicker className="no-print text-right"/>
                <WithFigureNumbering doc={section}>
                    <IsaacContent doc={section}/>
                </WithFigureNumbering>
            </Col>
        </Row>
    :
        <RS.Alert color="danger">Quiz section {page} not found</RS.Alert>
    ;
}

export const myQuizzesCrumbs = [{title: "My quizzes", to: `/quizzes`}];
export const teacherQuizzesCrumbs = [{title: "Set quizzes", to: `/set_quizzes`}];
const QuizTitle = ({attempt, page, pageLink, pageHelp, preview}: QuizAttemptProps) => {
    let quizTitle = attempt.quiz?.title || attempt.quiz?.id || "Quiz";
    if (isDefined(attempt.completedDate)) {
        quizTitle += " Feedback";
    }
    if (preview) {
        quizTitle += " Preview";
    }
    const crumbs = preview ? teacherQuizzesCrumbs : myQuizzesCrumbs;
    if (page === null) {
        return <TitleAndBreadcrumb currentPageTitle={quizTitle} help={pageHelp}
                                   intermediateCrumbs={crumbs}/>;
    } else {
        const sections = attempt.quiz?.children;
        const section = sections && sections[page - 1] as IsaacQuizSectionDTO;
        const sectionTitle = section?.title ?? "Section " + page;
        return <TitleAndBreadcrumb currentPageTitle={sectionTitle} help={pageHelp}
                                   intermediateCrumbs={[...crumbs, {title: quizTitle, replace: true, to: pageLink(attempt)}]}/>;
    }
};

interface QuizPaginationProps {
    page: number;
    finalLabel: string;
}

export function QuizPagination({attempt, page, sections, pageLink, finalLabel}: QuizAttemptProps & QuizPaginationProps) {
    const deviceSize = useDeviceSize();
    const sectionCount = Object.keys(sections).length;
    const backLink = pageLink(attempt, page > 1 ? page - 1 : undefined);
    const finalSection = page === sectionCount;
    const nextLink = pageLink(attempt, !finalSection ? page + 1 : undefined);

    return <div className="d-flex w-100 justify-content-between align-items-center">
        <RS.Button color="primary" outline size={below["sm"](deviceSize) ? "sm" : ""} tag={Link} replace to={backLink}>Back</RS.Button>
        <div className="d-none d-md-block">Section {page} / {sectionCount}</div>
        <RS.Button color="secondary" size={below["sm"](deviceSize) ? "sm" : ""} tag={Link} replace to={nextLink}>{finalSection ? finalLabel : "Next"}</RS.Button>
    </div>;
}

export function QuizAttemptComponent(props: QuizAttemptProps) {
    const {page} = props;
    return <QuizAttemptContext.Provider value={{quizAttempt: props.attempt}}>
        <QuizTitle {...props} />
        {page === null ?
            <div className="mt-4">
                <QuizHeader {...props} />
                <QuizContents {...props} />
            </div>
            :
            <QuizSection {...props} page={page}/>
        }
    </QuizAttemptContext.Provider>;
}

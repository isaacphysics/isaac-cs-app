import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {withRouter} from "react-router-dom";
import * as RS from "reactstrap";

import {ShowLoading} from "../../handlers/ShowLoading";
import {
    loadQuizAssignmentFeedback,
    returnQuizToStudent,
    updateQuizAssignmentFeedbackMode
} from "../../../state/actions/quizzes";
import {selectors} from "../../../state/selectors";
import {TitleAndBreadcrumb} from "../../elements/TitleAndBreadcrumb";
import {
    IsaacQuizSectionDTO,
    Mark,
    QuizAssignmentDTO,
    QuizFeedbackMode,
    QuizUserFeedbackDTO
} from "../../../../IsaacApiTypes";
import {AssignmentProgressLegend, formatMark, ICON} from '../AssignmentProgress';
import {usePageSettings} from "../../../services/progress";
import {PageSettings, QuizFeedbackModes} from "../../../../IsaacAppTypes";
import {teacherQuizzesCrumbs} from "../../elements/quiz/QuizAttemptComponent";
import {extractTeacherName} from "../../../services/user";
import {isDefined} from "../../../services/miscUtils";
import {formatDate} from "../../elements/DateString";
import {Spacer} from "../../elements/Spacer";
import {isQuestion} from "../../../services/questions";
import {API_PATH} from "../../../services/constants";
import { getQuizAssignmentResultsSummaryCSV } from "../../../state/actions";

interface QuizTeacherFeedbackProps {
    match: {params: {quizAssignmentId: string}}
}

const pageHelp = <span>
    See the feedback for your students for this quiz assignment.
</span>;

interface ResultsTableProps {
    assignment: QuizAssignmentDTO;
    pageSettings: PageSettings;
}

function questionsInSection(section?: IsaacQuizSectionDTO) {
    return section?.children?.filter(child => isQuestion(child)) || [];
}

const passMark = 0.75;
function markQuestionClasses(row: QuizUserFeedbackDTO, mark: Mark | undefined, totalOrUndefined: number | undefined) {
    if (!row.user?.authorisedFullAccess) {
        return "revoked";
    }

    const correct = mark?.correct as number;
    const incorrect = mark?.incorrect as number;
    const total = totalOrUndefined as number;

    if (correct === total) {
        return "completed";
    } else if ((correct / total) >= passMark) {
        return "passed";
    } else if ((incorrect / total) > (1 - passMark)) {
        return "failed";
    } else if (correct > 0 || incorrect > 0) {
        return "in-progress";
    } else {
        return "not-attempted";
    }
}

interface ResultRowProps {
    pageSettings: PageSettings;
    row: QuizUserFeedbackDTO;
    assignment: QuizAssignmentDTO;
}

function ResultRow({pageSettings, row, assignment}: ResultRowProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [working, setWorking] = useState(false);
    const dispatch = useDispatch();

    const toggle = () => setDropdownOpen(prevState => !prevState);

    const returnToStudent = async () => {
        try {
            setWorking(true);
            await dispatch(returnQuizToStudent(assignment.id as number, row.user?.id as number));
        } finally {
            setWorking(false);
        }
    };

    const quiz = assignment?.quiz;
    const sections: IsaacQuizSectionDTO[] = quiz?.children || [];

    let message;
    if (!row.user?.authorisedFullAccess) {
        message = "Not sharing";
    } else if (!row.feedback?.complete) {
        message = "Not completed";
    }
    const valid = message === undefined;
    return <tr className={`${row.user?.authorisedFullAccess ? "" : " not-authorised"}`} title={`${row.user?.givenName + " " + row.user?.familyName}`}>
        <th className="student-name">
            {valid ?
                <>
                    <RS.Button color="link" onClick={toggle} disabled={working}>
                        <div
                            tabIndex={0}
                            className="btn quiz-student-menu"
                            data-toggle="dropdown"
                            aria-expanded={dropdownOpen}
                        >
                            {row.user?.givenName}
                            <span className="d-none d-lg-inline"> {row.user?.familyName}</span>
                            <span className="quiz-student-menu-icon">
                            {working ? <RS.Spinner size="sm" /> : <img src="/assets/menu.svg" alt="Menu" />}
                        </span>
                        </div>
                    </RS.Button>
                    {!working && dropdownOpen && <div className="py-2 px-3">
                        <RS.Button size="sm" onClick={returnToStudent}>Return to student</RS.Button>
                    </div>}
                </>
            :   <>
                    {row.user?.givenName}
                    <span className="d-none d-lg-inline"> {row.user?.familyName}</span>
                </>
            }
        </th>
        {!valid && <td colSpan={sections.map(questionsInSection).flat().length + 1}>{message}</td>}
        {valid && <>
            {sections.map(section => {
                const mark = row.feedback?.sectionMarks?.[section.id as string];
                const outOf = quiz?.sectionTotals?.[section.id as string];
                return questionsInSection(section).map(question => {
                    const questionMark = row.feedback?.questionMarks?.[question.id as string] || {} as Mark;
                    const icon =
                        questionMark.correct === 1 ? ICON.correct :
                        questionMark.incorrect === 1 ? ICON.incorrect :
                        /* default */ ICON.notAttempted;
                    return <td key={question.id} className={markQuestionClasses(row, mark, outOf)}>
                        {icon}
                    </td>
                }).flat()
            })}
            <td className="total-column">
                {formatMark(row.feedback?.overallMark?.correct as number, quiz?.total as number, pageSettings.formatAsPercentage)}
            </td>
        </>}
    </tr>;
}

function ResultsTable({assignment, pageSettings}: ResultsTableProps) {
    const sections: IsaacQuizSectionDTO[] = assignment.quiz?.children || [];

    return <table className="progress-table w-100 mb-5 border">
        <tbody>
            <tr className="bg-white">
                <th>&nbsp;</th>
                {sections.map(section => <th key={section.id} colSpan={questionsInSection(section).length} className="border font-weight-bold">
                    {section.title}
                </th>)}
                <th rowSpan={2} className="border-bottom">Overall</th>
            </tr>
            <tr className="bg-white">
                <th className="bg-white border-bottom">&nbsp;</th>
                {sections.map(section => questionsInSection(section).map((question, index) => <th key={question.id} className="border">
                    {`Q${index + 1}`}
                </th>)).flat()}
            </tr>
            {assignment.userFeedback?.map(row =>
                <ResultRow key={row.user?.id} pageSettings={pageSettings} row={row} assignment={assignment} />
            )}
        </tbody>
    </table>;
}

const feedbackNames: Record<QuizFeedbackMode, string> = {
    NONE: "No feedback for students",
    OVERALL_MARK: "Overall mark only",
    SECTION_MARKS: "Section-by-section mark breakdown",
    DETAILED_FEEDBACK: "Detailed feedback on each question",
};

const QuizTeacherFeedbackComponent = ({match: {params: {quizAssignmentId}}}: QuizTeacherFeedbackProps) => {
    const pageSettings = usePageSettings();
    const assignmentState = useSelector(selectors.quizzes.assignment);

    const dispatch = useDispatch();

    const numericQuizAssignmentId = parseInt(quizAssignmentId, 10);
    useEffect(() => {
        dispatch(loadQuizAssignmentFeedback(numericQuizAssignmentId));
    }, [dispatch, numericQuizAssignmentId]);

    const [settingFeedbackMode, setSettingFeedbackMode] = useState(false);
    const setFeedbackMode = async (mode: QuizFeedbackMode) => {
        if (mode === assignment?.quizFeedbackMode) {
            return;
        }
        try {
            setSettingFeedbackMode(true);
            await dispatch(updateQuizAssignmentFeedbackMode(numericQuizAssignmentId, mode));
        } finally {
            setSettingFeedbackMode(false);
        }
    };

    const assignment = assignmentState && 'assignment' in assignmentState ? assignmentState.assignment : null;
    const error = assignmentState && 'error' in assignmentState ? assignmentState.error : null;
    const quizTitle = (assignment?.quiz?.title || assignment?.quiz?.id || "Quiz") + " results";

    return <RS.Container>
        <ShowLoading until={assignmentState}>
            {assignment && <>
                <TitleAndBreadcrumb currentPageTitle={quizTitle} help={pageHelp} intermediateCrumbs={teacherQuizzesCrumbs}/>
                <p className="d-flex">
                    <span>
                        Set by: {extractTeacherName(assignment.assignerSummary ?? null)} on {formatDate(assignment.creationDate)}
                    </span>
                    {isDefined(assignment.dueDate) && <><Spacer/>Due: {formatDate(assignment.dueDate)}</>}
                </p>
                <RS.Row>
                    <RS.Col>
                        <RS.Label for="feedbackMode" className="pr-1">Feedback mode:</RS.Label>
                        <RS.UncontrolledDropdown className="d-inline-block">
                            <RS.DropdownToggle color="dark" outline className="px-3" caret={!settingFeedbackMode} id="feedbackMode" disabled={settingFeedbackMode}>
                                {settingFeedbackMode ?
                                    <>Saving <RS.Spinner size="sm" className="quizFeedbackModeSpinner" /></>
                                :   feedbackNames[assignment.quizFeedbackMode as QuizFeedbackMode]}
                            </RS.DropdownToggle>
                            <RS.DropdownMenu>
                                {QuizFeedbackModes.map(mode =>
                                    <RS.DropdownItem key={mode}
                                                    onClick={() => setFeedbackMode(mode)}
                                                    active={mode === assignment?.quizFeedbackMode}>
                                        {feedbackNames[mode]}
                                    </RS.DropdownItem>
                                )}
                            </RS.DropdownMenu>
                        </RS.UncontrolledDropdown>
                    </RS.Col>
                    <RS.Col md={3} className="text-right">
                        <RS.Button
                            color="primary" outline className="btn-md mt-1"
                            href={`${API_PATH}/quiz/assignment/${assignment.id}/download`}
                            onClick={() => dispatch(getQuizAssignmentResultsSummaryCSV(assignment?.id || -1))}
                        >
                            Export as CSV
                        </RS.Button>
                    </RS.Col>
                </RS.Row>
                <div className={`assignment-progress-details bg-transparent ${pageSettings.colourBlind ? " colour-blind" : ""}`}>
                    <AssignmentProgressLegend pageSettings={pageSettings} showQuestionKey />
                    <ResultsTable assignment={assignment} pageSettings={pageSettings} />
                </div>
            </>}
            {error && <>
                <TitleAndBreadcrumb currentPageTitle={quizTitle} help={pageHelp} intermediateCrumbs={teacherQuizzesCrumbs}/>
                <RS.Alert color="danger">
                    <h4 className="alert-heading">Error loading quiz feedback</h4>
                    <p>{error}</p>
                </RS.Alert>
            </>}
        </ShowLoading>
    </RS.Container>;
};

export const QuizTeacherFeedback = withRouter(QuizTeacherFeedbackComponent);

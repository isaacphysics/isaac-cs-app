import React, {useEffect} from "react";
import {useDispatch} from "react-redux";
import {Link, withRouter} from "react-router-dom";
import * as RS from "reactstrap";

import {ShowLoading} from "../../handlers/ShowLoading";
import {clearQuizAttempt, loadQuizAttemptFeedback} from "../../../state/actions/quizzes";
import {isDefined} from "../../../services/miscUtils";
import {useCurrentQuizAttempt} from "../../../services/quiz";
import {
    myQuizzesCrumbs,
    QuizAttemptComponent,
    QuizAttemptProps,
    QuizPagination
} from "../../elements/quiz/QuizAttemptComponent";
import {QuizAttemptDTO} from "../../../../IsaacApiTypes";
import {Spacer} from "../../elements/Spacer";
import {TitleAndBreadcrumb} from "../../elements/TitleAndBreadcrumb";


interface QuizAttemptFeedbackProps {
    match: {params: {quizAttemptId: string, page: string}}
}

const pageLink = (attempt: QuizAttemptDTO, page?: number) => {
    if (page !== undefined) {
        return `/quiz/attempt/${attempt.id}/feedback/${page}`;
    } else {
        return `/quiz/attempt/${attempt.id}/feedback`;
    }
};


function QuizFooter(props: QuizAttemptProps) {
    const {attempt, page, pageLink} = props;

    let controls;
    let prequel = null;
    if (page === null) {
        prequel = <p className="mt-3">Click on a section title or click &lsquo;Next&rsquo; to look at your detailed feedback.</p>
        controls = <>
            <Spacer/>
            <RS.Button tag={Link} replace to={pageLink(attempt, 1)}>Next</RS.Button>
        </>;
    } else {
        controls = <QuizPagination {...props} page={page} finalLabel="Back to Overview" />;
    }

    return <>
        {prequel}
        <div className="d-flex border-top pt-2 my-2 align-items-center">
            {controls}
        </div>
    </>;
}

// TODO: Make this more specific to feedback mode.
const pageHelp = <span>
    See the feedback for this quiz attempt.
</span>;

const QuizAttemptFeedbackComponent = ({match: {params: {quizAttemptId, page}}}: QuizAttemptFeedbackProps) => {
    const {attempt, questions, sections, error} = useCurrentQuizAttempt();

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(loadQuizAttemptFeedback(parseInt(quizAttemptId, 10)));

        return () => {
            dispatch(clearQuizAttempt());
        };
    }, [dispatch, quizAttemptId]);

    const pageNumber = isDefined(page) ? parseInt(page, 10) : null;

    const subProps: QuizAttemptProps = {attempt: attempt as QuizAttemptDTO, page: pageNumber,
        questions, sections, pageLink, pageHelp};

    return <RS.Container className="mb-5">
        <ShowLoading until={attempt}>
            {attempt && <>
                <QuizAttemptComponent {...subProps} />
                {attempt.feedbackMode === 'DETAILED_FEEDBACK' && <QuizFooter {...subProps} />}
            </>}
            {error && <>
                <TitleAndBreadcrumb currentPageTitle="Quiz Feedback" intermediateCrumbs={myQuizzesCrumbs} />
                <RS.Alert color="danger">
                    <h4 className="alert-heading">Error loading your feedback!</h4>
                    <p>{error}</p>
                </RS.Alert>
            </>}
        </ShowLoading>
    </RS.Container>;
};

export const QuizAttemptFeedback = withRouter(QuizAttemptFeedbackComponent);

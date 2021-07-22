import React from "react";
import {useDispatch, useSelector} from "react-redux";
import {setCurrentAttempt} from "../../state/actions";
import {IsaacContentValueOrChildren} from "./IsaacContentValueOrChildren";
import {IsaacRegexMatchQuestionDTO} from "../../../IsaacApiTypes";
import {Input} from "reactstrap";
import {selectors} from "../../state/selectors";
import {selectQuestionPart} from "../../services/questions";


export const IsaacRegexMatchQuestion = ({doc, questionId, readonly}: {doc: IsaacRegexMatchQuestionDTO; questionId: string; readonly?: boolean}) => {
    const dispatch = useDispatch();
    const pageQuestions = useSelector(selectors.questions.getQuestions);
    const questionPart = selectQuestionPart(pageQuestions, questionId);
    const currentAttemptValue = questionPart?.currentAttempt?.value;

    return <div className="regexmatch-question">
        <div className="question-content">
            <IsaacContentValueOrChildren value={doc.value} encoding={doc.encoding}>
                {doc.children}
            </IsaacContentValueOrChildren>
        </div>
        <Input type={doc.multiLineEntry ? "textarea" : "text"} placeholder="Type your answer here."
            maxLength={doc.multiLineEntry ? 250 : 75}
            spellCheck={false} className="mb-4"
            rows={doc.multiLineEntry ? 3 : undefined}
            value={currentAttemptValue || ""}
            onChange={event =>
                dispatch(setCurrentAttempt(questionId, {type: "stringChoice", value: event.target.value}))
            }
            readOnly={readonly}
        />
    </div>;
};

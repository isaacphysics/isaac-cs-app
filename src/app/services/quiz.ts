import {useEffect, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";

import {isDefined} from "./miscUtils";
import {ContentDTO, IsaacQuizSectionDTO, QuestionDTO} from "../../IsaacApiTypes";
import {selectors} from "../state/selectors";
import {deregisterQuestion, registerQuestion} from "../state/actions";


// FIXME - this wasn't supposed to be hardcoded here, but circular dependency issues mean we cannot import ./questions!
function isQuestion(doc: ContentDTO) {
    return ["isaacMultiChoiceQuestion", "isaacItemQuestion", "isaacParsonsQuestion", "isaacNumericQuestion",
        "isaacSymbolicQuestion", "isaacSymbolicChemistryQuestion", "isaacStringMatchQuestion", "isaacFreeTextQuestion",
        "isaacSymbolicLogicQuestion", "isaacGraphSketcherQuestion"].indexOf(doc.type as string) >= 0;
}

export function extractQuestions(doc: ContentDTO | undefined): QuestionDTO[] {
    const qs: QuestionDTO[] = [];

    function walk(doc: ContentDTO) {
        if (isDefined(doc)) {
            if (isQuestion(doc)) {
                qs.push(doc as QuestionDTO);
            } else {
                if (doc.children) {
                    doc.children.forEach((c) => walk(c));
                }
            }
        }
    }

    if (doc) {
        walk(doc);
    }
    return qs;
}

export function useCurrentQuizAttempt() {
    const attemptState = useSelector(selectors.quizzes.currentQuizAttempt);
    const error = isDefined(attemptState) && 'error' in attemptState ? attemptState.error : null;
    const attempt = isDefined(attemptState) && 'attempt' in attemptState ? attemptState.attempt : null;
    const questions = useMemo(() => {
        return extractQuestions(attempt?.quiz);
    }, [attempt?.quiz]);
    const sections = useMemo(() => {
        const sections: { [id: string]: IsaacQuizSectionDTO } = {};
        attempt?.quiz?.children?.forEach(section => {
            sections[section.id as string] = section as IsaacQuizSectionDTO;
        });
        return sections;
    }, [attempt?.quiz]);

    const dispatch = useDispatch();

    useEffect( () => {
        questions.forEach(question => dispatch(registerQuestion(question)));
        const ids = questions.map(q => q.id as string);
        return () => {
            ids.forEach(id => dispatch(deregisterQuestion(id)));
        };
    }, [dispatch, questions]);

    return {attempt, questions, sections, error};
}

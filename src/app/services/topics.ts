import {ContentSummaryDTO} from "../../IsaacApiTypes";
import {ALL_TOPICS_CRUMB, DOCUMENT_TYPE, documentTypePathPrefix, EXAM_BOARD, NOT_FOUND} from "./constants";
import {CurrentTopicState} from "../state/reducers";
import {LinkInfo} from "./navigation";
import {filterOnExamBoard} from "./examBoard";

const filterForConcepts = (contents: ContentSummaryDTO[]) => {
    return contents.filter(content => content.type === DOCUMENT_TYPE.CONCEPT);
};

const filterForQuestions = (contents: ContentSummaryDTO[]) => {
    return contents.filter(content => content.type === DOCUMENT_TYPE.QUESTION);
};

export const filterAndSeparateRelatedContent = (contents: ContentSummaryDTO[], examBoard: EXAM_BOARD) => {
    const examBoardFilteredContent = filterOnExamBoard(contents, examBoard);
    const relatedConcepts = examBoardFilteredContent && filterForConcepts(examBoardFilteredContent);
    const relatedQuestions = examBoardFilteredContent && filterForQuestions(examBoardFilteredContent);
    return [relatedConcepts, relatedQuestions];
};

export const idIsPresent = (id: string, contents: {id?: string}[] | undefined) => {
    return contents && !!contents.filter((content) => content.id === id);
};

export const determineTopicHistory = (currentTopic: CurrentTopicState, currentDocId: string) => {
    const result: LinkInfo[] = [];
    if (currentTopic && currentTopic != NOT_FOUND && currentTopic.id && currentTopic.title && currentTopic.relatedContent) {
        const relatedContent: (string | undefined)[] = [];
        currentTopic.relatedContent.map(content => relatedContent.push(content.id));
        result.push(ALL_TOPICS_CRUMB);
        if (relatedContent.includes(currentDocId)) {
            result.push({title: currentTopic.title, to: `/topics/${currentTopic.id.slice("topic_summary_".length)}`});
        }
    }
    return result;
};

export const makeAttemptAtTopicHistory = () => {
    return [ALL_TOPICS_CRUMB]
};


export const determineNextTopicContentLink = (currentTopic: CurrentTopicState | undefined, contentId: string, examBoard: EXAM_BOARD) => {
    const relatedContent: (string | undefined)[] = [];
    if (currentTopic && currentTopic != NOT_FOUND && currentTopic.relatedContent) {
        currentTopic.relatedContent.map(content => relatedContent.push(content.id));
        if (relatedContent.includes(contentId)) {
            const [relatedConcepts, relatedQuestions] = filterAndSeparateRelatedContent(currentTopic.relatedContent, examBoard);
            const orderedRelatedContent = relatedConcepts.concat(relatedQuestions);
            const relatedContentIds = orderedRelatedContent.map((content) => content.id);
            const nextIndex = relatedContentIds.indexOf(contentId) + 1;
            if (nextIndex < relatedContentIds.length) {
                const nextContent = orderedRelatedContent[nextIndex];
                return {
                    title: nextContent.title as string,
                    to: `/${documentTypePathPrefix[nextContent.type as DOCUMENT_TYPE]}/${nextContent.id}`
                };
            }
        }
    }
};

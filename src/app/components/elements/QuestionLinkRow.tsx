import {GameboardItem} from "../../../IsaacApiTypes";
import * as RS from "reactstrap";
import {Link} from "react-router-dom";
import {SITE, SITE_SUBJECT} from "../../services/siteConstants";
import React from "react";
import tags from "../../services/tags";
import {TAG_ID} from "../../services/constants";

interface QuestionLinkRowProps {
    gameboardId?: string;
    question: GameboardItem;
}

function getTags(docTags?: string[]) {
    if (SITE_SUBJECT !== SITE.PHY) {
        return [];
    }
    if (!docTags) return [];

    return tags.getByIdsAsHeirarchy(docTags as TAG_ID[]);
}

export const QuestionLinkRow = ({question, gameboardId}: QuestionLinkRowProps) => {
    let itemClasses = "p-3 content-summary-link text-info bg-transparent";
    let icon = <img src="/assets/question.svg" alt=""/>;
    let tryAgain = false;

    switch (question.state) {
        case "PERFECT":
            itemClasses += " bg-success";
            icon = <img src="/assets/tick-rp.svg" alt=""/>;
            break;
        case "PASSED":
        case "IN_PROGRESS":
            icon = <img src="/assets/incomplete.svg" alt=""/>;
            break;
        case "FAILED":
            tryAgain = true;
            icon = <img src="/assets/cross-rp.svg" alt=""/>;
            break;
    }

    const tags = getTags(question.tags);

    return <RS.ListGroupItem key={question.id} className={itemClasses}>
        <Link to={`/questions/${question.id}${gameboardId ? `?board=${gameboardId}` : ""}`} className="align-items-center">
            <span>{icon}</span>
            <div className="flex-grow-1">{question.title}
                {tryAgain && <span className="try-again">try again!</span>}
                {tags && <div className="gameboard-tags">
                    {tags.map(tag => (<span className="gameboard-tag" key={tag.id}>{tag.title}</span>))}
                </div>}
            </div>
            {/*TODO CS Level*/}
            {SITE_SUBJECT === SITE.PHY && question.level !== undefined && question.level !== 0 &&
            <span className="gameboard-tags">Level {question.level}</span>}
        </Link>
    </RS.ListGroupItem>;
};
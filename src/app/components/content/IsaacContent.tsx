import React from "react";
import {AnvilApp} from "./AnvilApp"
import {IsaacContentValueOrChildren} from "./IsaacContentValueOrChildren";
import {IsaacQuestion} from "./IsaacQuestion";
import {IsaacVideo} from "./IsaacVideo";
import {IsaacImage} from "./IsaacImage";
import {IsaacFigure} from "./IsaacFigure";
import {IsaacGlossaryTerm} from "./IsaacGlossaryTerm";
import {ContentDTO} from "../../../IsaacApiTypes";
import {IsaacQuickQuestion} from "./IsaacQuickQuestion";
import {IsaacTabs} from "./IsaacTabs";
import {IsaacAccordion} from "./IsaacAccordion";
import {IsaacHorizontal} from "./IsaacHorizontal";
import {withRouter} from "react-router-dom";
import {IsaacQuizTabs} from "./IsaacQuizTabs";
import {QuestionContext} from "../../../IsaacAppTypes";
import {IsaacFeaturedProfile} from "./IsaacFeaturedProfile";

const classBasedLayouts = {
    left: "align-left",
    right: "align-right",
    righthalf: "align-right-half"
};

export const IsaacContent = withRouter((props: {doc: ContentDTO; match: {path: string}, contentIndex?: number}) => {
    const {doc: {type, layout, encoding, value, children}, match} = props;

    let selectedComponent;
    let tempSelectedComponent;
    switch (type) {
        case "figure": selectedComponent = <IsaacFigure {...props} />; break;
        case "image": selectedComponent = <IsaacImage {...props} />; break;
        case "video": selectedComponent = <IsaacVideo {...props} />; break;
        case "glossaryTerm": selectedComponent = <IsaacGlossaryTerm {...props} />; break;
        case "isaacFeaturedProfile": selectedComponent = <IsaacFeaturedProfile {...props} />; break;
        case "isaacQuestion": selectedComponent = <IsaacQuickQuestion {...props} />; break;
        case "anvilApp": selectedComponent = <AnvilApp {...props} />; break;
        case "isaacMultiChoiceQuestion":
        case "isaacNumericQuestion":
        case "isaacSymbolicQuestion":
        case "isaacSymbolicChemistryQuestion":
        case "isaacSymbolicLogicQuestion":
        case "isaacGraphSketcherQuestion":
        case "isaacAnvilQuestion":
        case "isaacStringMatchQuestion":
        case "isaacFreeTextQuestion":
        case "isaacItemQuestion":
        case "isaacParsonsQuestion":
            if (match.path.startsWith("/quizzes")) {
                tempSelectedComponent = <IsaacQuizTabs {...props} />;
            } else {
                tempSelectedComponent = <IsaacQuestion {...props} />;
            }
            selectedComponent = <QuestionContext.Provider value={props.doc.id}>{tempSelectedComponent}</QuestionContext.Provider>;
            break;
        default:
            switch (layout) {
                case "tabs": selectedComponent = <IsaacTabs {...props} />; break;
                case "accordion": selectedComponent = <IsaacAccordion {...props} />; break;
                case "horizontal": selectedComponent = <IsaacHorizontal {...props} />; break;
                default: selectedComponent =
                    <IsaacContentValueOrChildren encoding={encoding} value={value}>
                        {children}
                    </IsaacContentValueOrChildren>;
            }
    }

    if (layout && classBasedLayouts.hasOwnProperty(layout)) {
        // @ts-ignore because we do the check with hasOwnProperty
        return <div className={classBasedLayouts[layout]}>
            {selectedComponent}
        </div>;
    } else {
        return selectedComponent;
    }
});

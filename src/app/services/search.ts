import {History} from "history";
import {DOCUMENT_TYPE, TAG_ID} from "./constants";
import {ContentSummaryDTO} from "../../IsaacApiTypes";
import {isStaff} from "./user";
import {PotentialUser} from "../../IsaacAppTypes";

export const pushSearchToHistory = function(history: History, searchQuery: string, typesFilter: DOCUMENT_TYPE[]) {
    history.push({
        pathname: "/search",
        search: `?query=${encodeURIComponent(searchQuery)}${typesFilter.length ? `&types=${typesFilter.join(",")}` : ""}`,
    });
};

export function calculateConceptTypes(physics: boolean, maths: boolean, chemistry: boolean) {
    const typesArray = [];
    if (physics) {
        typesArray.push(TAG_ID.physics);
    }
    if (maths) {
        typesArray.push(TAG_ID.maths);
    }
    if (chemistry) {
        typesArray.push(TAG_ID.chemistry);
    }
    return typesArray.join(",");
}
export const pushConceptsToHistory = function(history: History, searchText: string, physics: boolean, maths: boolean, chemistry: boolean) {
    history.push({
        pathname: "/concepts",
        search: `?query=${encodeURIComponent(searchText)}&types=${calculateConceptTypes(physics, maths, chemistry)}`,
    });
};

export const searchResultIsPublic = function(content: ContentSummaryDTO, user?: PotentialUser | null) {
    const isPublic = (content.id != "_regression_test_" && (!content.tags || content.tags.indexOf("nofilter") < 0 && !content.supersededBy));
    return isPublic || isStaff(user);
};

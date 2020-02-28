import {BaseTag, Tag} from "../../IsaacAppTypes";
import {TAG_ID, TAG_LEVEL} from "./constants";
import {ContentDTO} from "../../IsaacApiTypes";

export abstract class AbstractBaseTagService {
    abstract getTagHierarchy(): TAG_LEVEL[];
    abstract getBaseTags(): BaseTag[];
    abstract augmentDocWithSubject(doc: ContentDTO): ContentDTO & {subjectId: string};

    // Augment base allTags
    public allTags: Tag[] = this.getBaseTags().map((baseTag) => {
        let depth = 0;
        let parentId = baseTag.parent;
        if (parentId) {
            let parent = this.getBaseTagById(parentId);
            depth++;
            while (parent.parent) {
                depth++;
                parent = this.getBaseTagById(parent.parent);
            }
        }
        return Object.assign(baseTag, {type: this.getTagHierarchy()[depth], level: depth})
    });
    public allTagIds = this.allTags.map((tag) => tag.id);

    public getBaseTagById(id: TAG_ID) {
        return this.getBaseTags().filter((tag) => tag.id === id)[0];
    }
    public getById(id: TAG_ID) {
        return this.allTags.filter((tag) => tag.id === id)[0];
    }
    public getSpecifiedTag(tagType: TAG_LEVEL, tagArray: TAG_ID[]) {
        // Return the first (as ordered in TAG_ID) TAG_ID an object has of a given type!
        if (tagArray != null) {
            for (let i in tagArray) {
                let tag = this.getById(tagArray[i]);
                if (tag != null && tag.type === tagType) {
                    return tag;
                }
            }
        }
        return null;
    }

    public getCategoryTag = this.getSpecifiedTag.bind(this, TAG_LEVEL.category);
    public getCategoryTags = this.getSpecifiedTags.bind(this, TAG_LEVEL.category);
    public allCategoryTags = this.getCategoryTags(this.allTagIds);

    public getSubcategoryTag = this.getSpecifiedTag.bind(this, TAG_LEVEL.subcategory);
    public getSubcategoryTags = this.getSpecifiedTags.bind(this, TAG_LEVEL.subcategory);

    public getTopicTag = this.getSpecifiedTag.bind(this, TAG_LEVEL.topic);
    public getTopicTags = this.getSpecifiedTags.bind(this, TAG_LEVEL.topic);

    public getDescendents(tagId: TAG_ID) {
        let descendents: Tag[] = [];
        for (let i in this.allTags) {
            if (this.allTags[i].parent == tagId) {
                descendents.push(this.allTags[i]);
                descendents = descendents.concat(this.getDescendents(this.allTags[i].id));
            }
        }
        return descendents;
    }

    protected getSpecifiedTags(tagType: TAG_LEVEL, tagArray: TAG_ID[]) {
        // Return all TAG_ID an object has of a given type!
        if (tagArray == null) return [];
        let tags = [];
        for (const i in tagArray) {
            let tag = this.getById(tagArray[i]);
            if (tag != null && tag.type === tagType) {
                tags.push(tag);
            }
        }
        return tags;
    }

    private getDeepestTag(tagArray: TAG_ID[]) {
        if (tagArray == null) return null;

        let deepestTag = null;
        for (let i in tagArray) {
            let tag = this.getById(tagArray[i]);
            if (tag != null && (deepestTag == null || tag.level > deepestTag.level)) {
                deepestTag = tag;
            }
        }
        return deepestTag;
    }
}
import React, {ReactElement} from "react";
import {PageTitle, PageTitleProps} from "./PageTitle";
import {Breadcrumb, BreadcrumbItem} from "reactstrap";
import {Link} from "react-router-dom";
import {HOME_CRUMB} from "../../services/constants";
import {CollectionType, LinkInfo} from "../../services/navigation";
import {LaTeX} from "./LaTeX";

interface BreadcrumbTrailProps {
    currentPageTitle: string;
    intermediateCrumbs?: LinkInfo[];
    collectionType?: CollectionType;
}

// BreadcrumbTrail has been pulled into TitleAndBreadcrumb so that it is the only place it is used.
// If you want to use it elsewhere, that is fine but you must consider the implications on the "Skip to main content"
// link which needs to skip all static navigational elements (i.e. breadcrumbs).
// We manage the ID of the "main content" with the mainContentId reducer.
const BreadcrumbTrail = ({currentPageTitle, intermediateCrumbs = [], collectionType}: BreadcrumbTrailProps) => {
    const breadcrumbHistory = [HOME_CRUMB as LinkInfo, ...intermediateCrumbs];

    // Copy and mask collection type title
    if (collectionType === "Gameboard") {
        const collectionBreadcrumb = breadcrumbHistory.splice(1, 1)[0];
        breadcrumbHistory.splice(1, 0,
            Object.assign({}, collectionBreadcrumb, {title: collectionType}));
    }

    return <Breadcrumb className="py-md-2 px-md-0 mb-3 mb-md-0 bread">
        {breadcrumbHistory.map((breadcrumb) => (
            <BreadcrumbItem key={breadcrumb.title}>
                {breadcrumb.to ?
                    <Link to={breadcrumb.to} replace={breadcrumb.replace}><LaTeX markup={breadcrumb.title} /></Link>
                    :
                    <LaTeX markup={breadcrumb.title} />
                }
            </BreadcrumbItem>
        ))}
        <BreadcrumbItem active>
            <LaTeX markup={currentPageTitle} />
        </BreadcrumbItem>
    </Breadcrumb>;
};

type TitleAndBreadcrumbProps = BreadcrumbTrailProps & PageTitleProps & {
    breadcrumbTitleOverride?: string;
    children?: ReactElement | boolean;
    modalId?: string;
};

export const TitleAndBreadcrumb = (props: TitleAndBreadcrumbProps) => {
    const breadcrumbProps = {...props, className: undefined};
    if (props.breadcrumbTitleOverride) {
        breadcrumbProps.currentPageTitle = props.breadcrumbTitleOverride;
    }
    return <React.Fragment>
        <BreadcrumbTrail {...breadcrumbProps} />
        {props.children}
        <PageTitle {...props} />
    </React.Fragment>;
};

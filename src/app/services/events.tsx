import {IsaacEventPageDTO} from "../../IsaacApiTypes";
import {apiHelper} from "./api";
import {AugmentedEvent} from "../../IsaacAppTypes";
import {DateString, FRIENDLY_DATE, TIME_ONLY} from "../components/elements/DateString";
import React from "react";
import {Link} from "react-router-dom";

export const studentOnlyEventMessage = (eventId?: string) => <React.Fragment>
    {"This event is aimed at students. If you are not a student but still wish to attend, please "}
    <Link to={`/contact?subject=${encodeURI("Non-student attendance at " + eventId)}`}>contact us</Link>.
</React.Fragment>;

export const augmentEvent = (event: IsaacEventPageDTO): AugmentedEvent => {
    const augmentedEvent: AugmentedEvent = Object.assign({}, event);
    if (event.date != null) {
        const startDate = new Date(event.date);
        const now = Date.now();
        if (event.endDate != null) {  // Non-breaking change; if endDate not specified, behaviour as before
            const endDate = new Date(event.endDate);
            augmentedEvent.isMultiDay = startDate.toDateString() != endDate.toDateString();
            augmentedEvent.hasExpired = now > endDate.getTime();
            augmentedEvent.isInProgress = startDate.getTime() <= now && now <= endDate.getTime();
        } else {
            augmentedEvent.hasExpired = now > startDate.getTime();
            augmentedEvent.isInProgress = false;
            augmentedEvent.isMultiDay = false;
        }
        augmentedEvent.isWithinBookingDeadline =
            !augmentedEvent.hasExpired &&
            (event.bookingDeadline ? now <= new Date(event.bookingDeadline).getTime() : true);
    }

    if (event.tags) {
        augmentedEvent.isATeacherEvent = event.tags.includes("teacher");
        augmentedEvent.isAStudentEvent = event.tags.includes("student");
        augmentedEvent.isVirtual = event.tags.includes("virtual");
        augmentedEvent.isRecurring = event.tags.includes("recurring");
        augmentedEvent.isStudentOnly = event.tags.includes("student_only");
        if (event.tags.includes("physics")) {
            augmentedEvent.field = "physics";
        }
        if (event.tags.includes("maths")) {
            augmentedEvent.field = "maths";
        }
    }

    augmentedEvent.isNotClosed = event.eventStatus !== "CLOSED";
    augmentedEvent.isWaitingListOnly = event.eventStatus === "WAITING_LIST_ONLY";

    // we have to fix the event image url.
    if(augmentedEvent.eventThumbnail && augmentedEvent.eventThumbnail.src) {
        augmentedEvent.eventThumbnail.src = apiHelper.determineImageUrl(augmentedEvent.eventThumbnail.src);
    } else {
        if (augmentedEvent.eventThumbnail == null) {
            augmentedEvent.eventThumbnail = {};
        }
        augmentedEvent.eventThumbnail.src = 'http://placehold.it/500x276';
        augmentedEvent.eventThumbnail.altText = 'placeholder image.';
    }

    return augmentedEvent;
};

export const formatEventDetailsDate = (event: AugmentedEvent) => {
    if (event.isRecurring) {
        return <span>Series starts <DateString>{event.date}</DateString></span>;
    } else if (event.isMultiDay) {
        return <><DateString>{event.date}</DateString>{" — "}<DateString>{event.endDate}</DateString></>;
    } else {
        return <><DateString>{event.date}</DateString>{" — "}<DateString formatter={TIME_ONLY}>{event.endDate}</DateString></>;
    }
};

export const formatEventCardDate = (event: AugmentedEvent, podView?: boolean) => {
    if (event.isRecurring) {
        return <span>Series starts <DateString formatter={FRIENDLY_DATE}>{event.date}</DateString><br />
            <DateString formatter={TIME_ONLY}>{event.date}</DateString> — <DateString formatter={TIME_ONLY}>{event.endDate}</DateString>
        </span>;
    } else if (event.isMultiDay) {
        return <>
            <DateString>{event.date}</DateString><br/>
            <DateString>{event.endDate}</DateString>
        </>;
    } else {
        return <>
            <DateString formatter={FRIENDLY_DATE}>{event.endDate}</DateString>{podView ? " " : <br />}
            <DateString formatter={TIME_ONLY}>{event.date}</DateString> — <DateString formatter={TIME_ONLY}>{event.endDate}</DateString>
        </>;
    }
};

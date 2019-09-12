import React, {useState} from "react";
import * as RS from "reactstrap";
import {Accordion} from "../Accordion";
import {useDispatch, useSelector} from "react-redux";
import {AppState} from "../../../state/reducers";
import {NOT_FOUND} from "../../../services/constants";
import {atLeastOne} from "../../../services/validation";
import {EventBookingDTO, UserSummaryWithEmailAddressDTO} from "../../../../IsaacApiTypes";
import {DateString} from "../DateString";
import {recordEventAttendance} from "../../../state/actions";
import {ATTENDANCE} from "../../../../IsaacAppTypes";

function displayAttendanceAsSymbol(status?: string) {
    switch (status) {
        case "ATTENDED": return "✔️";
        case "ABSENT": return "❌";
        default: return ""
    }
}

export const EventAttendance = ({eventId}: {eventId: string}) => {
    const dispatch = useDispatch();
    const selectedEvent = useSelector((state: AppState) => state && state.currentEvent !== NOT_FOUND && state.currentEvent || null);
    const bookings = useSelector((state: AppState) => state && state.eventBookings || []);
    const userIdToSchoolMapping = useSelector((state: AppState) => state && state.userSchoolLookup || {});

    const [sortPredicate, setSortPredicate] = useState("date");
    const [reverse, setReverse] = useState(true);
    const [familyNameFilter, setFamilyNameFilter] = useState("");
    // TODO handle "." in predicates
    function sortOnPredicateAndReverse(a: object, b: object) {
        // @ts-ignore
        if (a[sortPredicate] < b[sortPredicate]) {return reverse ? 1 : -1;}
        // @ts-ignore
        else if (a[sortPredicate] > b[sortPredicate]) {return reverse ? -1 : 1;}
        else {return 0;}
    }

    function filterOnSurname(booking: EventBookingDTO) {
        return booking.userBooked && booking.userBooked.familyName !== undefined &&
            booking.userBooked.familyName.toLocaleLowerCase().includes(familyNameFilter.toLocaleLowerCase());
    }

    let canRecordAttendance = false;
    if (selectedEvent && selectedEvent.date) {
        const morningOfEvent = new Date(selectedEvent.date);
        morningOfEvent.setHours(0, 0);
        canRecordAttendance = morningOfEvent <= new Date();
    }

    return <React.Fragment>
        {canRecordAttendance && atLeastOne(bookings.length) && <Accordion title="Record event attendance">
            <div className="overflow-auto">
                <RS.Table bordered className="mb-0 bg-white">
                    <thead>
                        <tr>
                            <th className="align-middle">
                                Actions
                            </th>
                            <th className="align-middle"><RS.Button color="link" onClick={() => {setSortPredicate('bookingStatus'); setReverse(!reverse);}}>
                                Attendance
                            </RS.Button></th>
                            <th className="align-middle">
                                <RS.Button color="link" onClick={() => {setSortPredicate('userBooked.familyName'); setReverse(!reverse);}}>
                                    Name
                                </RS.Button>
                                <RS.Input className="w-auto" value={familyNameFilter} onChange={e => setFamilyNameFilter(e.target.value)} placeholder="Surname filter" />
                            </th>
                            <th className="align-middle">
                                Job/year group
                            </th>
                            <th className="align-middle">
                                School
                            </th>
                            <th className="align-middle">
                                Account type
                            </th>
                            <th className="align-middle"><RS.Button color="link" onClick={() => {setSortPredicate('userBooked.email'); setReverse(!reverse);}}>
                                Email
                            </RS.Button></th>
                            <th className="align-middle"><RS.Button color="link" onClick={() => {setSortPredicate('bookingDate'); setReverse(!reverse);}}>
                                Booking created
                            </RS.Button></th>
                            <th className="align-middle"><RS.Button color="link" onClick={() => {setSortPredicate('updated'); setReverse(!reverse);}}>
                                Booking updated
                            </RS.Button></th>
                            <th className="align-middle">
                                Accessibility requirements
                            </th>
                            <th className="align-middle">
                                Medical requirements
                            </th>
                            <th className="align-middle">
                                Emergency name
                            </th>
                            <th className="align-middle">
                                Emergency telephone
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings
                            .sort(sortOnPredicateAndReverse)
                            .filter(filterOnSurname)
                            .map(booking => {
                                const userBooked = booking.userBooked as UserSummaryWithEmailAddressDTO;
                                const additionalInformation = booking.additionalInformation as {[index: string]: string};
                                const userSchool = booking.userBooked && userIdToSchoolMapping[booking.userBooked.id as number];

                                return <tr key={booking.bookingId}>
                                    <td className="align-middle">
                                        {booking.bookingStatus != 'ATTENDED' && <RS.Button color="primary" outline className="btn-sm mb-2"
                                            onClick={() => dispatch(recordEventAttendance(eventId, userBooked.id as number, ATTENDANCE.ATTENDED))}
                                        >
                                            Mark&nbsp;as Attended
                                        </RS.Button>}
                                        {booking.bookingStatus != 'ABSENT' && <RS.Button color="primary" outline className="btn-sm mb-2"
                                            onClick={() => dispatch(recordEventAttendance(eventId, userBooked.id as number, ATTENDANCE.ABSENT))}
                                        >
                                            Mark&nbsp;as Absent
                                        </RS.Button>}
                                    </td>
                                    <td className="align-middle text-center">{displayAttendanceAsSymbol(booking.bookingStatus)}</td>
                                    <td className="align-middle">{userBooked.familyName}, {userBooked.givenName}</td>
                                    <td className="align-middle">{additionalInformation.jobTitle ? additionalInformation.jobTitle : additionalInformation.yearGroup}</td>
                                    {(userSchool === undefined || !userSchool.urn) && <td className="align-middle">{userSchool ? userSchool.name : ""}</td>}
                                    {userSchool && userSchool.urn && <td className="align-middle">{userSchool.name}</td>} {/* In future can add link to school stats page */}
                                    <td className="align-middle">{userBooked.role}</td>
                                    <td className="align-middle">{userBooked.email}</td>
                                    <td className="align-middle"><DateString>{booking.bookingDate}</DateString></td>
                                    <td className="align-middle"><DateString>{booking.updated}</DateString></td>
                                    <td className="align-middle">{additionalInformation.accessibilityRequirements}</td>
                                    <td className="align-middle">{additionalInformation.medicalRequirements}</td>
                                    <td className="align-middle">{additionalInformation.emergencyName}</td>
                                    <td className="align-middle">{additionalInformation.emergencyNumber}</td>
                                </tr>
                            })
                        }
                    </tbody>
                </RS.Table>
            </div>
        </Accordion>}
    </React.Fragment>
};

import React, {useState} from "react";
import * as RS from "reactstrap";
import {Accordion} from "../Accordion";
import {useDispatch, useSelector} from "react-redux";
import {adminUserSearch, openActiveModal} from "../../../state/actions";
import {AppState} from "../../../state/reducers";
import {atLeastOne, zeroOrLess} from "../../../services/validation";
import {DateString} from "../DateString";
import {NOT_FOUND} from "../../../services/constants";
import {userBookingModal} from "../modals/UserBookingModal";



export const AddUsersToBookingPanel = () => {
    const dispatch = useDispatch();
    const userResults = useSelector((state: AppState) => state && state.adminUserSearch || []);
    const selectedEvent = useSelector((state: AppState) => state && state.currentEvent || null);
    const userBookings = useSelector((state: AppState) =>
        state && state.eventBookings && state.eventBookings.map(b => b.userBooked && b.userBooked.id) as number[] || []
    );

    const [searched, setSearched] = useState(false);
    const [queryParams, setQueryParams] = useState({familyName: null, email: null, role: null});

    function userSearch(formEvent: React.FormEvent<HTMLFormElement>) {
        if (formEvent) {formEvent.preventDefault()}
        setSearched(true);
        dispatch(adminUserSearch(queryParams));
    }

    function nullIfDefault(value: string, defaultValue: string) {
        return (value !== defaultValue) ? value : null;
    }

    return <Accordion title="Add users to booking">
        <RS.Form onSubmit={userSearch}>
            <div className="mb-3">
                <RS.Label htmlFor="user-search-familyName">Find a user by family name:</RS.Label>
                <RS.Input
                    id="user-search-familyName" type="text" placeholder="Enter user family name" value={queryParams.familyName || ""}
                    onChange={e => setQueryParams(Object.assign({}, queryParams, {familyName: nullIfDefault(e.target.value, "")}))}
                />
            </div>
            <div className="mb-3">
                <RS.Label htmlFor="user-search-email">Find a user by email:</RS.Label>
                <RS.Input
                    id="user-search-email" type="text" placeholder="Enter user email" value={queryParams.email || ""}
                    onChange={e => setQueryParams(Object.assign({}, queryParams, {email: nullIfDefault(e.target.value, "")}))}
                />
            </div>
            <div className="mb-3">
                <RS.Label htmlFor="user-search-role">Find by user role:</RS.Label>
                <RS.Input
                    type="select" id="user-search-role" value={queryParams.role || "NO_ROLE"}
                    onChange={e => setQueryParams(Object.assign({}, queryParams, {role: nullIfDefault(e.target.value, "NO_ROLE")}))}
                >
                    <option value="NO_ROLE">Any Role</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="CONTENT_EDITOR">Content Editor</option>
                    <option value="ADMIN">Admin</option>
                </RS.Input>
            </div>
            <RS.Input type="submit" className="btn btn-secondary mt-2" value="Find user" />
        </RS.Form>

        {searched && <hr className="text-center my-4" />}

        {atLeastOne(userResults.length) && <div className="overflow-auto">
            <RS.Table bordered className="mb-0">
                <thead>
                    <tr>
                        <th className="align-middle">Actions</th>
                        <th className="align-middle">Name</th>
                        <th className="align-middle">Email</th>
                        <th className="align-middle">User role</th>
                        <th className="align-middle">School set</th>
                        <th className="align-middle">Member since</th>
                        <th className="align-middle">Last seen</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedEvent && selectedEvent !== NOT_FOUND && userResults.map(result => <tr key={result.id}>
                        <td className="align-middle">
                            {!userBookings.includes(result.id as number) && selectedEvent.eventStatus != 'WAITING_LIST_ONLY' && atLeastOne(selectedEvent.placesAvailable) &&
                            <RS.Button color="tertiary" className="btn-sm" onClick={() => dispatch(openActiveModal(userBookingModal(result, selectedEvent, userBookings)))}>
                                Book
                            </RS.Button>
                            }
                            {!userBookings.includes(result.id as number) && (selectedEvent.eventStatus == 'WAITING_LIST_ONLY' || zeroOrLess(selectedEvent.placesAvailable)) &&
                            <RS.Button color="tertiary" className="btn-sm" onClick={() => dispatch(openActiveModal(userBookingModal(result, selectedEvent, userBookings)))}>
                                Add to WL
                            </RS.Button>
                            }
                            {userBookings.includes(result.id as number) && <span ng-show="">Booking exists</span>}
                        </td>
                        <td className="align-middle">{result.familyName}, {result.givenName}</td>
                        <td className="align-middle">{result.email}</td>
                        <td className="align-middle">{result.role}</td>
                        <td className="align-middle">{result.schoolId != null ? 'Yes' : result.schoolOther != null ? 'Yes (Other)' : 'None Set'}</td>
                        <td className="align-middle"><DateString>{result.registrationDate}</DateString></td>
                        <td className="align-middle"><DateString>{result.lastSeen}</DateString></td>
                    </tr>)}
                </tbody>
            </RS.Table>
        </div>}

        {searched && zeroOrLess(userResults.length) && <div className="text-center">
            <strong>No users returned from query</strong>
        </div>}
    </Accordion>
};

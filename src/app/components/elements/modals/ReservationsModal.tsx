import React, {useEffect, useState, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    closeActiveModal,
    getEventBookingsForGroup,
    getGroupMembers,
    loadGroups,
    reserveUsersOnEvent,
    selectGroup,
    cancelReservationsOnEvent
} from "../../../state/actions";
import {store} from "../../../state/store";
import {Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Col, CustomInput, Row, Table} from "reactstrap";
import {AppState} from "../../../state/reducers";
import {groups} from '../../../state/selectors';
import {ShowLoading} from "../../handlers/ShowLoading";
import {AppGroupMembership, AppGroup} from "../../../../IsaacAppTypes";
import {bookingStatusMap, NOT_FOUND} from "../../../services/constants";
import _orderBy from "lodash/orderBy";
import {RegisteredUserDTO} from "../../../../IsaacApiTypes";
import {isLoggedIn} from "../../../services/user";
import {Link} from "react-router-dom";

const ReservationsModal = () => {
    const dispatch = useDispatch();
    const user = useSelector((state: AppState) => isLoggedIn(state?.user) ? state?.user as RegisteredUserDTO : undefined);
    const activeGroups = useSelector(groups.active);
    const activeFilteredGroups = useMemo(() => activeGroups?.filter(group => !group.archived), [activeGroups])?.sort((a: AppGroup, b: AppGroup): number => {
        if (!a.groupName || !b.groupName || (a.groupName === b.groupName)) return 0;
        if (a.groupName > b.groupName) return 1;
        return -1;
    });
    const currentGroup = useSelector(groups.current);
    const selectedEvent = useSelector((state: AppState) => state && state.currentEvent !== NOT_FOUND && state.currentEvent || null);
    const eventBookingsForGroup = useSelector((state: AppState) => state && state.eventBookingsForGroup || []);
    const [unbookedUsers, setUnbookedUsers] = useState<AppGroupMembership[]>([]);
    const [userCheckboxes, setUserCheckboxes] = useState<{[key: number]: boolean}>({});
    const [checkAllCheckbox, setCheckAllCheckbox] = useState<boolean>(false);
    const [cancelReservationCheckboxes, setCancelReservationCheckboxes] = useState<{[key: number]: boolean}>({});
    const [checkAllCancelReservationsCheckbox, setCheckAllCancelReservationsCheckbox] = useState<boolean>();
    const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

    useEffect(() => {
        dispatch(loadGroups(false));
    }, [dispatch]);

    useEffect(() => {
        if (currentGroup && !currentGroup.members) {
            dispatch(getGroupMembers(currentGroup));
        }
        if (selectedEvent && selectedEvent.id && currentGroup && currentGroup.id) {
            dispatch(getEventBookingsForGroup(selectedEvent.id, currentGroup.id));
        }
    }, [dispatch, selectedEvent, currentGroup]);

    useEffect(() => {
        if (currentGroup && currentGroup.members) {
            const bookedUserIds = eventBookingsForGroup
                .filter(booking => booking.bookingStatus !== "CANCELLED")
                .map(booking => booking.userBooked && booking.userBooked.id);
            let newCancelReservationCheckboxes: boolean[] = [];
            for (const userId of bookedUserIds) {
                if (userId) {
                    newCancelReservationCheckboxes[userId] = false;
                }
            }
            setCancelReservationCheckboxes(newCancelReservationCheckboxes);
            const newUnbookedUsers = _orderBy(
                currentGroup.members.filter(member => !bookedUserIds.includes(member.id as number)),
                ['authorisedFullAccess', 'familyName', 'givenName'], ['desc', 'asc', 'asc']
            );
            let newUserCheckboxes: boolean[] = [];
            for (const user of newUnbookedUsers) {
                if (!user.id || !user.authorisedFullAccess) continue;
                newUserCheckboxes[user.id] = false;
            }
            setUserCheckboxes(newUserCheckboxes);
            setCheckAllCheckbox(false);
            setUnbookedUsers(newUnbookedUsers);
        }
    }, [currentGroup, eventBookingsForGroup]);

    const toggleCheckboxForUser = (userId?: number) => {
        if (!userId) return;
        let checkboxes = { ...userCheckboxes };
        checkboxes[userId] = !checkboxes[userId];
        setUserCheckboxes(checkboxes);
        if (!Object.values(checkboxes).every(v => v)) {
            setCheckAllCheckbox(false);
        }
    };

    const toggleAllUnbooked = () => {
        setCheckAllCheckbox(!checkAllCheckbox);
        let checkboxes = { ...userCheckboxes };
        for (const id in userCheckboxes) {
            checkboxes[id] = !checkAllCheckbox;
        }
        setUserCheckboxes(checkboxes);
    };

    const toggleCancelReservationCheckboxForUser = (userId?: number) => {
        if (!userId) return;
        let checkboxes = { ...cancelReservationCheckboxes };
        checkboxes[userId] = !checkboxes[userId];
        setCancelReservationCheckboxes(checkboxes);
        if (!Object.values(checkboxes).every(v => v)) {
            setCheckAllCancelReservationsCheckbox(false);
        }
    };

    const toggleAllCancelReservationCheckboxes = () => {
        setCheckAllCancelReservationsCheckbox(!checkAllCancelReservationsCheckbox);
        let checkboxes = { ...cancelReservationCheckboxes };
        for (const id in cancelReservationCheckboxes) {
            checkboxes[id] = !checkAllCancelReservationsCheckbox;
        }
        setCancelReservationCheckboxes(checkboxes);
    };

    const requestReservations = () => {
        if (selectedEvent && selectedEvent.id && currentGroup && currentGroup.id) {
            const reservableIds = Object.entries(userCheckboxes).filter(c => c[1]).map(c => parseInt(c[0]));
            dispatch(reserveUsersOnEvent(selectedEvent.id, reservableIds, currentGroup.id));
        }
        setCheckAllCheckbox(false);
    };

    const cancelReservations = () => {
        if (selectedEvent && selectedEvent.id && currentGroup && currentGroup.id) {
            const cancellableIds = Object.entries(cancelReservationCheckboxes).filter(c => c[1]).map(c => parseInt(c[0]));
            dispatch(cancelReservationsOnEvent(selectedEvent.id, cancellableIds, currentGroup.id));
        }
        setCheckAllCancelReservationsCheckbox(false);
    }

    const isReservationLimitReached = () => {
        if (selectedEvent && selectedEvent.groupReservationLimit) {
            const bookings = eventBookingsForGroup.filter(booking =>
                (booking.bookingStatus === "CONFIRMED" || booking.bookingStatus === "RESERVED" || booking.bookingStatus ==="WAITING_LIST")
                && booking.reservedById === user?.id
            );
            const candidateBookings = Object.values(userCheckboxes).filter(c => c);
            return (candidateBookings.length + bookings.length) > selectedEvent.groupReservationLimit;
        }
        // By default, return true to disable all the checkboxes: prevents awkward situations.
        return true;
    };

    return <React.Fragment>
        <div id="reservation-modal">
            {!selectedEvent?.allowGroupReservations && <p>This event does not allow group reservations.</p>}
            {selectedEvent?.allowGroupReservations && <Col>
                <Row className="mb-5">
                    <Col md={3}>
                        <ShowLoading until={activeFilteredGroups}>
                            {activeFilteredGroups && activeFilteredGroups.length > 0 && <Dropdown isOpen={groupDropdownOpen} toggle={() => setGroupDropdownOpen(!groupDropdownOpen)}>
                                <DropdownToggle caret color="primary">
                                    {currentGroup ? currentGroup.groupName : "Select group"}
                                </DropdownToggle>
                                <DropdownMenu>{
                                    activeFilteredGroups.map(group =>
                                        <DropdownItem onClick={() => dispatch(selectGroup(group))}
                                            key={group.id}
                                            active={currentGroup === group}
                                        >{group.groupName}</DropdownItem>
                                    )
                                }</DropdownMenu>
                            </Dropdown>}
                            &nbsp; {/* ShowLoading needs to contain something. */}
                        </ShowLoading>
                    </Col>
                    {activeFilteredGroups && activeFilteredGroups.length === 0 && <p>Create a groups from the <Link to="/groups" onClick={() => store.dispatch(closeActiveModal())}>Manage groups</Link> page to book your students onto an event</p>}
                    <Col cols={12} lg={{size: 8, offset: 1}} xl={{size: 9, offset: 0}}>
                        {activeFilteredGroups && activeFilteredGroups.length > 0 && (!currentGroup || !currentGroup.members) && <p>Select one of your groups from the dropdown menu to see its members.</p>}
                        {currentGroup && currentGroup.members && currentGroup.members.length == 0 && <p>This group has no members. Please select another group.</p>}
                        {currentGroup && currentGroup.members && currentGroup.members.length > 0 && <React.Fragment>
                            <Table bordered className="bg-white reserved">
                                <thead>
                                    <tr>
                                        <th className="align-middle checkbox">
                                            <CustomInput
                                                id="check_all_reserved"
                                                type="checkbox"
                                                label="All"
                                                checked={checkAllCancelReservationsCheckbox}
                                                onChange={() => toggleAllCancelReservationCheckboxes()}
                                            />
                                        </th>
                                        <th className="align-middle student-name">
                                            Student
                                        </th>
                                        <th className="align-middle booking-status">
                                            Booking Status
                                        </th>
                                        <th className="align-middle reserved-by">
                                            Reserved By
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventBookingsForGroup.filter(booking => booking.bookingStatus !== "CANCELLED").map(booking => {
                                        return (booking.userBooked && booking.userBooked.id && <tr key={booking.userBooked.id}>
                                            <td className="align-middle">
                                                {booking.userBooked &&
                                                (booking.reservedById === user?.id) &&
                                                (booking.bookingStatus === 'RESERVED') &&
                                                <CustomInput key={booking.userBooked.id}
                                                    id={`${booking.userBooked.id}`}
                                                    type="checkbox"
                                                    name={`reserved_student-${booking.userBooked.id}`}
                                                    checked={cancelReservationCheckboxes[booking.userBooked.id]}
                                                    // I'm including the full access autorisation here because we do the same in the next table
                                                    disabled={!booking.userBooked.authorisedFullAccess && booking.userBooked.emailVerificationStatus !== 'VERIFIED'}
                                                    onChange={() => toggleCancelReservationCheckboxForUser(booking.userBooked?.id)}
                                                />}
                                            </td>
                                            <td className="align-middle">{booking.userBooked && (booking.userBooked.givenName + " " + booking.userBooked.familyName)} {booking.userBooked.emailVerificationStatus !== 'VERIFIED' && <span className="text-danger pl-2">E-mail not verified</span>}</td>
                                            <td className="align-middle">{booking.bookingStatus && bookingStatusMap[booking.bookingStatus]}</td>
                                            <td className="align-middle">{!booking.reservedById ? '' : (booking.reservedById === user?.id ? 'You' : 'Someone else')}</td>
                                        </tr>);
                                    })}
                                    {eventBookingsForGroup.length == 0 && <tr><td colSpan={4}>None of the members of this group are booked in for this event.</td></tr>}
                                </tbody>
                            </Table>

                            <div className="text-center">
                                <Button color="primary" outline disabled={!Object.values(cancelReservationCheckboxes).some(v => v)} onClick={cancelReservations}>
                                    Cancel reservations
                                </Button>
                            </div>

                            <Table bordered className="mt-3 bg-white unreserved">
                                <thead>
                                    <tr>
                                        <th colSpan={2}>Other students in this group</th>
                                    </tr>
                                    <tr>
                                        <th className="w-auto text-nowrap align-middle checkbox">
                                            <CustomInput
                                                id="check_all_unbooked"
                                                type="checkbox"
                                                label="All"
                                                checked={checkAllCheckbox}
                                                onChange={() => toggleAllUnbooked()}
                                                disabled={unbookedUsers.filter(user => user.authorisedFullAccess).length === 0}
                                            />
                                        </th>
                                        <th className="w-100 align-middle student-name">
                                            Student
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unbookedUsers.length > 0 && unbookedUsers.map(user => {
                                        return (user.id && <tr key={user.id}>
                                            <td className="w-auto align-middle">
                                                <CustomInput
                                                    key={user.id}
                                                    id={`${user.id}`}
                                                    type="checkbox"
                                                    name={`unbooked_student-${user.id}`}
                                                    checked={userCheckboxes[user.id]}
                                                    disabled={!user.authorisedFullAccess && user.emailVerificationStatus !== 'VERIFIED'}
                                                    onChange={() => toggleCheckboxForUser(user.id)}
                                                />
                                            </td>
                                            <td className="w-100 align-middle">{user.givenName + " " + user.familyName} {user.emailVerificationStatus !== 'VERIFIED' && <span className="text-danger pl-2">E-mail not verified</span>}</td>
                                        </tr>)
                                    })}
                                </tbody>
                            </Table>

                            <Row className="toolbar">
                                <Col>
                                    {isReservationLimitReached() && <p className="text-danger">
                                        You can only reserve a maximum of {selectedEvent && selectedEvent.groupReservationLimit} group members onto this event.
                                    </p>}
                                    <div className="text-center">
                                        <Button color="primary" disabled={!Object.values(userCheckboxes).some(v => v) || isReservationLimitReached()} onClick={requestReservations}>
                                            Reserve places
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </React.Fragment>}
                    </Col>
                </Row>
            </Col>}
        </div>
    </React.Fragment>
};

export const reservationsModal = () => {
    return {
        closeAction: () => {store.dispatch(closeActiveModal())},
        size: 'xl',
        title: "Group reservations",
        body: <ReservationsModal />,
    }
};
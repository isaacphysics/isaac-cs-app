import React, {MutableRefObject, useEffect, useRef, useState} from "react";
import {connect, useSelector} from "react-redux";
import {
    Button,
    ButtonDropdown,
    Card,
    CardBody,
    Col,
    Container,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Form,
    Input,
    InputGroup,
    InputGroupAddon,
    Nav,
    NavItem,
    NavLink,
    Row,
    TabContent,
    TabPane,
    UncontrolledButtonDropdown,
    UncontrolledTooltip
} from "reactstrap"
import {Link} from "react-router-dom";
import {
    createGroup,
    deleteGroup,
    deleteMember,
    getGroupInfo,
    loadGroups,
    resetMemberPassword,
    selectGroup,
    showAdditionalManagerSelfRemovalModal,
    showGroupEmailModal,
    showGroupInvitationModal,
    showGroupManagersModal,
    updateGroup
} from "../../state/actions";
import {ShowLoading} from "../handlers/ShowLoading";
import {AppState} from "../../state/reducers";
import {sortBy} from "lodash";
import {AppGroup, AppGroupMembership} from "../../../IsaacAppTypes";
import {selectors} from "../../state/selectors";
import {RegisteredUserDTO, UserGroupDTO} from "../../../IsaacApiTypes";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {ifKeyIsEnter} from "../../services/navigation";
import {SITE, SITE_SUBJECT} from "../../services/siteConstants";
import {isStaff} from "../../services/user";

const stateFromProps = (state: AppState) => (state && {
    groups: selectors.groups.groups(state),
    group: selectors.groups.current(state),
    user: state.user as RegisteredUserDTO
});

const dispatchFromProps = {loadGroups, selectGroup, createGroup, deleteGroup, updateGroup, getGroupInfo, resetMemberPassword, deleteMember, showGroupInvitationModal, showGroupManagersModal, showGroupEmailModal, showAdditionalManagerSelfRemovalModal};

interface GroupsPageProps {
    groups: {active: AppGroup[] | null; archived: AppGroup[] | null};
    group: AppGroup | null;
    user: RegisteredUserDTO;
    loadGroups: (getArchived: boolean) => void;
    selectGroup: (group: UserGroupDTO | null) => void;
    createGroup: (groupName: string) => Promise<AppGroup>;
    deleteGroup: (group: AppGroup) => void;
    updateGroup: (newGroup: AppGroup, message?: string) => void;
    getGroupInfo: (group: AppGroup) => void;
    resetMemberPassword: (member: AppGroupMembership) => void;
    deleteMember: (member: AppGroupMembership) => void;
    showGroupInvitationModal: (firstTime: boolean) => void;
    showGroupManagersModal: () => void;
    showGroupEmailModal: (users?: number[]) => void;
    showAdditionalManagerSelfRemovalModal: (groupToModify: AppGroup, user: RegisteredUserDTO, showArchived: boolean) => void;
}

enum SortOrder {
    "Alphabetical" = "Alphabetical",
    "Date Created" = "Date Created"
}

interface GroupCreatorProps {
    createNewGroup: (groupName: string) => void;
}

type GroupEditorProps = GroupsPageProps & GroupCreatorProps & {
    groupNameRef?: MutableRefObject<HTMLInputElement | null>;
};

let tooltip = 0;
const Tooltip = ({children, tipText, ...props}: any) => {
    const [tooltipId] = useState("forTooltip-" + tooltip++);
    return <React.Fragment>
        <span id={tooltipId} {...props}>{children}</span>
        <UncontrolledTooltip target={`#${tooltipId}`}>{tipText}</UncontrolledTooltip>
    </React.Fragment>;
};

const canSendPasswordResetRequest = function(user: AppGroupMembership, passwordRequestSent: boolean) {
    return !passwordRequestSent && user.authorisedFullAccess && user.emailVerificationStatus != 'DELIVERY_FAILED';
};

const passwordResetInformation = function(member: AppGroupMembership, passwordRequestSent: boolean) {
    let message = 'Cannot send password reset request email.';
    if (canSendPasswordResetRequest(member, passwordRequestSent)) {
        message = 'Send a password reset request to this user\'s email address.';
    } else if (passwordRequestSent) {
        message = 'Password reset request sent.';
    } else if (member.emailVerificationStatus == 'DELIVERY_FAILED') {
        message = 'Password reset request cannot be sent because this user\'s account email address is either invalid or not accepting email.';
    }
    return message;
};

interface MemberInfoProps {
    member: AppGroupMembership;
    resetMemberPassword: (member: AppGroupMembership) => void;
    deleteMember: (member: AppGroupMembership) => void;
}
const MemberInfo = ({member, resetMemberPassword, deleteMember}: MemberInfoProps) => {
    const [passwordRequestSent, setPasswordRequestSent] = useState(false);

    function resetPassword() {
        setPasswordRequestSent(true);
        resetMemberPassword(member);
    }

    function confirmDeleteMember() {
        if (confirm("Are you sure you want to remove this user from the group?")) {
            deleteMember(member);
        }
    }

    return <div className="p-2 member-info-item d-flex justify-content-between">
        <div className="pt-1 d-flex flex-fill">
            <div>
                <span className="icon-group-table-person mt-2" />
            </div>
            <div>
                {member.authorisedFullAccess ?
                    <Link to={`/progress/${member.groupMembershipInformation.userId}`}
                          className={"align-text-top d-flex align-items-stretch"}>
                        <span className="pl-1">{member.givenName} {member.familyName}</span>
                    </Link> :
                    <span className="not-authorised"><span className="pl-1 struck-out">{member.givenName} {member.familyName}</span> (Not Sharing)</span>
                }
            </div>
            <div>
                {member.emailVerificationStatus == "DELIVERY_FAILED" &&
                    <Tooltip tipText={<React.Fragment>This user&apos;s account email address is invalid or not accepting email.<br />They will not be able to reset their password or receive update emails. Ask them to login and update it, or contact us to help resolve the issue.</React.Fragment>} className="icon-email-status failed" />
                }
                {member.emailVerificationStatus == "NOT_VERIFIED" &&
                    <Tooltip tipText="This user has not yet verified their email." className="icon-email-status unverified" />
                }
                {member.groupMembershipInformation && member.groupMembershipInformation.status == "INACTIVE" &&
                    <Tooltip tipText="This user has set their status to inactive for this group. This means they will no longer see new assignments."> (inactive in group)</Tooltip>
                }
            </div>
        </div>
        <div className="d-flex justify-content-between">
            <Tooltip tipText={passwordResetInformation(member, passwordRequestSent)} className="text-right d-none d-sm-block">
                <Button color="link" size="sm" onClick={resetPassword} disabled={!canSendPasswordResetRequest(member, passwordRequestSent)}>
                    {!passwordRequestSent? 'Reset Password': 'Reset email sent'}
                </Button>
            </Tooltip>
            {"  "}
            <button className="ml-2 close" onClick={confirmDeleteMember} aria-label="Remove member">
                ×
            </button>
        </div>
    </div>;
};

const GroupEditor = ({group, selectGroup, updateGroup, createNewGroup, groupNameRef, resetMemberPassword, deleteMember, showGroupInvitationModal, showGroupManagersModal, showGroupEmailModal, showArchived, showAdditionalManagerSelfRemovalModal}: GroupEditorProps & {showArchived: boolean}) => {
    const [isExpanded, setExpanded] = useState(false);

    const initialGroupName = group ? group.groupName : "";
    const [newGroupName, setNewGroupName] = useState(initialGroupName);

    const user = useSelector((state: AppState) => state && state.user || null);
    const isUserGroupOwner = user?.loggedIn && user.id === group?.ownerId;

    useEffect(() => {
        setExpanded(false);
        setNewGroupName(initialGroupName);
    }, [group]);

    function saveUpdatedGroup(event: React.FormEvent) {
        if (event) {
            event.preventDefault();
        }
        if (group) {
            const newGroup = {...group, groupName: newGroupName};
            updateGroup(newGroup);
        } else {
            if (newGroupName) {
                createNewGroup(newGroupName);
            }
        }
    }

    function toggleArchived() {
        if (group) {
            const newGroup = {...group, archived: !group.archived};
            updateGroup(newGroup, "Group " + group.groupName + (newGroup.archived ? " archived" : " unarchived"));
            selectGroup(null);
        }
    }

    function groupUserIds(group: AppGroup | null) {
        let groupUserIdList: number[] = [];
        group && group.members && group.members.map((member: AppGroupMembership) =>
            member.groupMembershipInformation.userId && member.authorisedFullAccess &&
            member.groupMembershipInformation.status == "ACTIVE" &&
            groupUserIdList.push(member.groupMembershipInformation.userId)
        );
        return groupUserIdList;
    }

    const bigGroup = group && group.members && group.members.length > 100;

    const usersInGroup = groupUserIds(group);

    return <Card>
        <CardBody>
            <Row className="mt-2">
                <Col xs={5} sm={6} md={group ? 3 : 12} lg={group ? 3 : 12}><h4>{group ? "Edit group" : "Create group"}</h4></Col>
                {group && <Col xs={7} sm={6} md={9} lg={9} className="text-right">
                    <Button className="d-none d-sm-inline" size="sm" color="tertiary" onClick={() => showGroupManagersModal()}>
                        Add / remove<span className="d-none d-xl-inline">{" "}group</span>{" "}managers
                    </Button>
                    <span className="d-none d-lg-inline-block">&nbsp;or&nbsp;</span>
                    <span className="d-inline-block d-md-none">&nbsp;</span>
                    <Button
                        size="sm" className={SITE_SUBJECT === SITE.CS ? "text-white" : "" + " d-none d-sm-inline"}
                        color={{[SITE.PHY]: "primary", [SITE.CS]: "secondary"}[SITE_SUBJECT]}
                        onClick={() => showGroupInvitationModal(false)}
                    >
                        Invite users
                    </Button>
                    {isStaff(user) && usersInGroup.length > 0 &&
                        <span className="d-none d-lg-inline-block">&nbsp;or&nbsp;
                            <Button
                                size="sm" className={SITE_SUBJECT === SITE.CS ? "text-white" : ""}
                                color={{[SITE.PHY]: "primary", [SITE.CS]: "secondary"}[SITE_SUBJECT]}
                                onClick={() => showGroupEmailModal(usersInGroup)}
                            >
                                Email users
                            </Button>
                        </span>}
                </Col>}
            </Row>
            <Form inline onSubmit={saveUpdatedGroup} className="pt-3">
                <InputGroup className="w-100">
                    <Input
                        innerRef={groupNameRef} length={50} placeholder="Group name" value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)} aria-label="Group Name" disabled={!isUserGroupOwner && group !== null}
                    />
                    {(isUserGroupOwner || group === null) && <InputGroupAddon addonType="append">
                        <Button
                            color={{[SITE.PHY]: "secondary", [SITE.CS]: "primary"}[SITE_SUBJECT]}
                            className="p-0 border-dark" disabled={newGroupName == "" || initialGroupName == newGroupName}
                            onClick={saveUpdatedGroup}
                        >
                            {group ? "Update" : "Create"}
                        </Button>
                    </InputGroupAddon>}
                </InputGroup>
            </Form>
            <Row className="pt-1 mb-3">
                <Col className="text-right text-muted">
                    *Group name is shared with students
                </Col>
            </Row>
            {group && <React.Fragment>
                <Row>
                    <Col>
                        {isUserGroupOwner && <Button block color="tertiary" onClick={toggleArchived}>
                            {group.archived ? "Unarchive this group" : "Archive this group"}
                        </Button>}
                    </Col>
                </Row>
                <Row className="mt-4">
                    <Col>
                        <ShowLoading until={group.members}>
                            {group.members && <div>
                                <Row>
                                    <Col>
                                        {group.members.length} users in this group {" "}
                                        {bigGroup && !isExpanded &&
                                            <ButtonDropdown className="float-right" toggle={() => setExpanded(true)}>
                                                <DropdownToggle caret>Show</DropdownToggle>
                                            </ButtonDropdown>
                                        }
                                    </Col>
                                </Row>
                                <div>
                                    {(!bigGroup || isExpanded) && group.members.map((member: AppGroupMembership) => (
                                        <MemberInfo
                                            key={member.groupMembershipInformation.userId}
                                            {...{member, resetMemberPassword, deleteMember}}
                                        />
                                    ))}
                                </div>
                            </div>}
                        </ShowLoading>
                    </Col>
                </Row>
            </React.Fragment>}
        </CardBody>
    </Card>;
};

const MobileGroupCreatorComponent = ({createNewGroup, ...props}: GroupCreatorProps & {className: string}) => {
    const [newGroupName, setNewGroupName] = useState("");

    function saveUpdatedGroup() {
        createNewGroup(newGroupName);
        setNewGroupName("");
    }
    return <Row {...props}>
        <Col size={12} className="mt-2">
            <h6>Create New Group</h6>
        </Col>
        <Col size={12} className="mb-2">
            <Input length={50} placeholder="Enter the name of your group here" value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)} aria-label="Group Name"/>
        </Col>
        <Col size={12}>
            <Button block color="primary" onClick={saveUpdatedGroup} disabled={newGroupName == ""}>
                Create group
            </Button>
        </Col>
    </Row>;
};

const GroupsPageComponent = (props: GroupsPageProps) => {
    const {group, groups, user, loadGroups, getGroupInfo, selectGroup, createGroup, deleteGroup, showGroupInvitationModal, showAdditionalManagerSelfRemovalModal} = props;

    const [showArchived, setShowArchived] = useState(false);

    const tabs = [
        {
            name: "Active",
            data: groups && groups.active,
            active: () => !showArchived,
            activate: () => setShowArchived(false)
        },
        {
            name: "Archived",
            data: groups && groups.archived,
            active: () => showArchived,
            activate: () => setShowArchived(true)
        }
    ];
    const activeTab = tabs.find(tab => tab.active());

    const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Alphabetical);

    let data = activeTab && activeTab.data;
    if (data) {
        switch(sortOrder) {
            case SortOrder.Alphabetical:
                data.sort((a, b) => {
                    if (a.groupName && b.groupName) return (a.groupName.localeCompare(b.groupName, undefined, { numeric: true, sensitivity: 'base' }));
                    return 1;
                });
                break;
            case SortOrder["Date Created"]:
                data = sortBy(data, g => g.created).reverse();
                break;
        }
    }

    const createNewGroup = async (newGroupName: string) => {
        setShowArchived(false);
        const group = await createGroup(newGroupName);
        selectGroup(group);
        showGroupInvitationModal(true);
    };

    const confirmDeleteGroup = (groupToDelete: AppGroup) => {
        if (user.id === groupToDelete.ownerId) {
            if (confirm("Are you sure you want to permanently delete the group '" + groupToDelete.groupName + "' and remove all associated assignments?\n\nTHIS ACTION CANNOT BE UNDONE!")) {
                deleteGroup(groupToDelete);
                if (group && group.id == groupToDelete.id) {
                    selectGroup(null);
                }
            }
        } else {
            if (confirm("You cannot delete this group, because you are not the group owner.  Do you want to remove yourself as a manager of '" + groupToDelete.groupName + "'?")) {
                showAdditionalManagerSelfRemovalModal(groupToDelete, user, showArchived);
            }
        }
    };

    useEffect(() => {
        loadGroups(showArchived);
        // Clear the selected group when switching between tabs
        selectGroup(null);
    }, [showArchived]);

    const groupId = group && group.id;

    useEffect(() => {
        if (group) {
            getGroupInfo(group);
        }
    }, [groupId]); // This can't just be group, because group changes when the members change, causing an infinite reload loop


    const groupNameRef = useRef<HTMLInputElement>(null);

    const pageHelp = <span>
        Use this page to manage groups. You can add users to a group by giving them the group code and asking them paste it into their account settings page.
        <br />
        You can find the code for an existing group by selecting the group and clicking <i>Invite Users</i>.
    </span>;

    return <Container>
        <TitleAndBreadcrumb currentPageTitle="Manage groups" className="mb-4" help={pageHelp} modalId="groups_help" />
        <Row className="mb-5">
            <Col md={4}>
                <ShowLoading until={activeTab}>
                    {activeTab && <Card>
                        <CardBody className="mt-2">
                            <Nav tabs className="d-flex flex-wrap">
                                {tabs.map((tab, index) => {
                                    const classes = tab.active() ? "active" : "";
                                    return <NavItem key={index} className="mx-2">
                                        <NavLink
                                            className={`text-center ${classes}`} tabIndex={0}
                                            onClick={tab.activate} onKeyDown={ifKeyIsEnter(tab.activate)}
                                        >
                                            {tab.name}
                                        </NavLink>
                                    </NavItem>;
                                })}
                            </Nav>
                            <TabContent activeTab="thisOne">
                                <TabPane tabId="thisOne">
                                    <ShowLoading until={data}>
                                        <Row className="align-items-center pt-4 pb-3 d-none d-md-flex">
                                            <Col>
                                                <strong>Groups:</strong>
                                            </Col>
                                            <Col className="text-right">
                                                <UncontrolledButtonDropdown size="sm">
                                                    <DropdownToggle color="tertiary" caret>
                                                        {sortOrder}
                                                    </DropdownToggle>
                                                    <DropdownMenu>
                                                        {Object.values(SortOrder).map(item =>
                                                            <DropdownItem key={item} onClick={() => setSortOrder(item)}>{item}</DropdownItem>
                                                        )}
                                                    </DropdownMenu>
                                                </UncontrolledButtonDropdown>
                                            </Col>
                                        </Row>
                                        <MobileGroupCreatorComponent className="d-block d-md-none" createNewGroup={createNewGroup}/>
                                        {group && <Row className="d-none d-md-block mb-3">
                                            <Col>
                                                <Button block color="primary" outline onClick={() => {
                                                    selectGroup(null);
                                                    if (groupNameRef.current) {
                                                        groupNameRef.current.focus();
                                                    }
                                                }}>Create new group</Button>
                                            </Col>
                                        </Row>}
                                        <Row className="mt-3 mt-md-0">
                                            <Col>
                                                {data && data.map((g: AppGroup) =>
                                                    <div key={g.id} className="group-item p-2">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <Button color="link text-left" className="flex-fill" onClick={() => selectGroup(g)}>
                                                                {g.groupName}
                                                            </Button>
                                                            <button
                                                                onClick={(e) => {e.stopPropagation(); confirmDeleteGroup(g);}}
                                                                aria-label="Delete group" className="close ml-1"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                        {group && group.id == g.id && <div className="d-md-none py-2">
                                                            <GroupEditor {...props} createNewGroup={createNewGroup} showArchived={showArchived}/>
                                                        </div>}
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>
                                    </ShowLoading>
                                </TabPane>
                            </TabContent>
                        </CardBody>
                    </Card>}
                </ShowLoading>
            </Col>
            <Col md={8} className="d-none d-md-block">
                <GroupEditor {...props} createNewGroup={createNewGroup} groupNameRef={groupNameRef} showArchived={showArchived} />
            </Col>
        </Row>
    </Container>;
};

export const Groups = connect(stateFromProps, dispatchFromProps)(GroupsPageComponent); // Cannot remove connect here yet because we depend on an dispatched action's result

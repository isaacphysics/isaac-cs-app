import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {Link, withRouter} from "react-router-dom"
import {loadGameboard, logAction} from "../../state/actions";
import * as RS from "reactstrap"
import {Container} from "reactstrap"
import {ShowLoading} from "../handlers/ShowLoading";
import {GameboardDTO} from "../../../IsaacApiTypes";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {NOT_FOUND} from "../../services/constants";
import {isTeacher} from "../../services/user";
import {Redirect} from "react-router";
import {SITE, SITE_SUBJECT} from "../../services/siteConstants";
import {selectors} from "../../state/selectors";
import {QuestionLinkRow} from "../elements/QuestionLinkRow";

export const GameboardViewer = ({gameboard, className}: {gameboard: GameboardDTO; className?: string}) => {
    return <RS.Row className={className}>
        <RS.Col lg={{size: 10, offset: 1}}>
            <RS.ListGroup className="link-list list-group-links list-gameboard">
                {gameboard && gameboard.questions && gameboard.questions.map((question, i) =>
                    <QuestionLinkRow key={i} gameboardId={gameboard.id} question={question}/>
                )}
            </RS.ListGroup>
        </RS.Col>
    </RS.Row>;
};

export const Gameboard = withRouter(({location: {hash}}: {location: {hash: string}}) => {
    const dispatch = useDispatch();
    const gameboard = useSelector(selectors.board.currentGameboardOrNotFound);
    const user = useSelector(selectors.user.orNull);
    const gameboardId = hash ? hash.slice(1) : null;

    useEffect(() => {dispatch(loadGameboard(gameboardId))}, [dispatch, gameboardId]);

    // Only log a gameboard view when we have a gameboard loaded:
    useEffect(() => {
        if (gameboard !== null && gameboard !== NOT_FOUND) {
            dispatch(logAction({type: "VIEW_GAMEBOARD_BY_ID", gameboardId: gameboard.id}));
        }
    }, [dispatch, gameboard]);

    const userButtons = user && isTeacher(user) ?
        <RS.Row className="col-8 offset-2">
            <RS.Col className="mt-4">
                <RS.Button tag={Link} to={`/add_gameboard/${gameboardId}`} color="primary" outline className="btn-block">
                    Set as assignment
                </RS.Button>
            </RS.Col>
            <RS.Col className="mt-4">
                <RS.Button tag={Link} to={{pathname: "/gameboard_builder", search: `?base=${gameboardId}`}} color="primary" block outline>
                    Duplicate and edit
                </RS.Button>
            </RS.Col>
        </RS.Row>
        :
        <RS.Row className="col-4 offset-2 offset-md-4">
            <RS.Col className="mt-4">
                <RS.Button tag={Link} to={`/add_gameboard/${gameboardId}`} color="primary" outline className="btn-block">
                    Save to My gameboards
                </RS.Button>
            </RS.Col>
        </RS.Row>;

    const notFoundComponent = <Container>
        <TitleAndBreadcrumb breadcrumbTitleOverride="Gameboard" currentPageTitle="Gameboard not found" />
        <h3 className="my-4">
            <small>
                {"We're sorry, we were not able to find a gameboard with the id "}<code>{gameboardId}</code>{"."}
            </small>
            {SITE.PHY === SITE_SUBJECT && <div className="mt-4 text-center">
                <RS.Button tag={Link} to={`/gameboards/new`} color="primary" outline className="btn-lg">
                    Generate a new gameboard
                </RS.Button>
            </div>}
        </h3>
    </Container>;

    return gameboardId ?
        <RS.Container className="mb-5">
            <ShowLoading
                until={gameboard}
                thenRender={gameboard => <React.Fragment>
                    <TitleAndBreadcrumb currentPageTitle={gameboard && gameboard.title || "Filter Generated Gameboard"}/>
                    <GameboardViewer gameboard={gameboard} className="mt-4 mt-lg-5" />
                    {userButtons}
                </React.Fragment>}
                ifNotFound={notFoundComponent}
            />
        </RS.Container>
        :
        <Redirect to={{[SITE.PHY]: "/gameboards/new", [SITE.CS]: "/gameboards#example-gameboard"}[SITE_SUBJECT]} />
});

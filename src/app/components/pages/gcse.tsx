import React from "react";
import {Col, Container, Row} from "reactstrap";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";

export const Gcse = () => {
    return<Container>
        <Row className="pb-4">
            <Col>
                <TitleAndBreadcrumb currentPageTitle={"GCSE Resources"} breadcrumbTitleOverride="GCSE Resources" />
            </Col>
        </Row>
        <Row className="teacher-feature-body">
            <Col md="auto"/>
            <Col md="auto">
                <a href="/gcsebook" className="hexagon">
                    <img className="hexagon-field" src="/assets/key_stage_sprite.svg#skills-book-cover" alt="Isaac hexagon"></img>
                    <div className="hexagon-title">
                        Physics Skills Mastery
                    </div>
                </a>
            </Col>
            <Col md="auto">
                <a href="/gameboards?filter=true#de583d25-93c9-4600-a6e3-6ae144b105fd" className="hexagon">
                    <img className="hexagon-field" src="/assets/key_stage_sprite.svg#question" alt="Isaac hexagon"></img>
                    <div className="hexagon-title">
                        Problem Solving
                    </div>
                </a>
            </Col>
            <Col md="auto">
                <a href="/pages/mentor_menu" className="hexagon">
                    <img className="hexagon-field" src="/assets/key_stage_sprite.svg#teacher-hat" alt="Isaac hexagon"></img>
                    <div className="hexagon-title">
                        Mentoring Schemes
                    </div>
                </a>
            </Col>
            <Col md="auto">
                <a href="/pages/pre_made_gameboards#gcse_to_alevel" className="hexagon">
                    <img className="hexagon-field" src="/assets/key_stage_sprite.svg#question" alt="Isaac hexagon"></img>
                    <div className="hexagon-title">
                        Preparation for A Level
                    </div>
                </a>
            </Col>
            <Col md="auto"/>
        </Row>
        <Row className="teacher-feature-body">
            <Col className="hexagon-offset hexagon-offset-large" md="auto">
                <a href="/pages/gcse_quizzes" className="hexagon">
                    <img className="hexagon-field" src="/assets/key_stage_sprite.svg#question" alt="Isaac hexagon"></img>
                    <div className="hexagon-title">
                        Quick Quizzes
                    </div>
                </a>
            </Col>
            <Col className="hexagon-offset-large" md="auto">
                <a href="/events?types=student" className="hexagon">
                    <img className="hexagon-field" src="/assets/key_stage_sprite.svg#groups" alt="Isaac hexagon"></img>
                    <div className="hexagon-title">
                        Workshops
                    </div>
                </a>
            </Col>
        </Row>
    </Container>
};

import React from "react";
import {Col, Container, Row} from "reactstrap";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {IsaacCard} from "../content/IsaacCard";

export const Alevel = () => {

    return <Container>
        <Row className="pb-4">
            <Col>
                <TitleAndBreadcrumb currentPageTitle={"A Level Resources"} />
            </Col>
        </Row>
        <Row className="card-deck isaac-cards-body my-3">
            <IsaacCard doc={{title: "Question Finder", subtitle: "Practise your problem solving skills.",
                clickUrl: "/gameboards/new", image: {src: "/assets/phy/key_stage_sprite.svg#question"}
            }}/>
            <IsaacCard doc={{title: "Physics Skills Mastery Book", subtitle: "Interactive questions from our Mastering Essential Pre-University Physics book.",
                clickUrl: "/books/physics_skills_19", image: {src: "/assets/phy/key_stage_sprite.svg#skills-book-cover"}
            }}/>
            <IsaacCard doc={{title: "Virtual Lessons", subtitle: "Learn and practise physics.",
                clickUrl: "/pages/a_level_topic_index", image: {src: "/assets/phy/key_stage_sprite.svg#teacher-hat"}
            }}/>
        </Row>
        <Row className="card-deck isaac-cards-body my-3">
            <IsaacCard doc={{title: "Practise Maths", subtitle: "Practise A Level (or equivalent) exam questions by topic.",
                clickUrl: " /pages/maths_practice", image: {src: "/assets/phy/key_stage_sprite.svg#teacher-hat"}
            }}/>
            <IsaacCard doc={{title: "Maths for Sciences Book", subtitle: "Interactive questions from our pre-university Maths book.",
                clickUrl: "/books/pre_uni_maths", image: {src: "/assets/phy/key_stage_sprite.svg#skills-book-cover"}
            }}/>
            <IsaacCard doc={{title: "Mentoring Schemes", subtitle: "Weekly gameboards guided by an experienced teacher.",
                clickUrl: "/pages/isaac_mentor", image: {src: "/assets/phy/key_stage_sprite.svg#teacher-hat"}
            }}/>
        </Row>
        <Row className="my-4">
            <Col>
                <h3 className="h-title text-center">Additional Resources</h3>
            </Col>
        </Row>
        <Row className="card-deck isaac-cards-body my-3">
            <IsaacCard doc={{title: "Physical Chemistry Mastery Book", subtitle: "Interactive questions from our Mastering Essential Pre-University Physical Chemistry book.",
                clickUrl: "/books/chemistry_16", image: {src: "/assets/phy/key_stage_sprite.svg#skills-book-cover"}
            }}/>
            <IsaacCard doc={{title: "Events", subtitle: "Find one of our face-to-face or virtual events.",
                clickUrl: "/events?types=student", image: {src: "/assets/phy/teacher_features_sprite.svg#calendar"}
            }}/>
            <IsaacCard doc={{title: "Extraordinary Problems", subtitle: "Apply your physics skills to model real, complex situations.",
                clickUrl: "/extraordinary_problems", image: {src: "/assets/phy/key_stage_sprite.svg#question"}
            }}/>
        </Row>
        <Row className="card-deck isaac-cards-body mb-5 mt-3">
            <IsaacCard doc={{title: "Solving Physics Problems Book", subtitle: "Our printed guide to solving unfamiliar problems using pre-university Physics.",
                clickUrl: "/books/solve_physics_problems", image: {src: "/assets/phy/key_stage_sprite.svg#skills-book-cover"}
            }}/>
            <IsaacCard doc={{title: "Senior Physics Challenge", subtitle: "Apply for our popular residential summer school.",
                clickUrl: "/pages/spc", image: {src: "/assets/phy/key_stage_sprite.svg#groups"}
            }}/>
            <IsaacCard doc={{title: "Quantum Mechanics Primer Book", subtitle: "Interactive questions from a first year university introduction to quantum mechanics.",
                clickUrl: "/books/quantum_mechanics_primer", image: {src: "/assets/phy/key_stage_sprite.svg#skills-book-cover"}
            }}/>
        </Row>
    </Container>
};

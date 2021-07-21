import {Col, Row, Container} from "reactstrap";
import React from "react";
import {TitleAndBreadcrumb} from "../../elements/TitleAndBreadcrumb";
import {PageFragment} from "../../elements/PageFragment";
import {BookChapter} from "../../elements/BookChapter";

export const PhysicsSkills19 = () => {

    const pageHelp = <span>
        The Isaac Physics Mastering Essential Pre-University Physics book 3rd edition
    </span>;

    return <Container>
        <Col>
            <div className="book-intro">
                <TitleAndBreadcrumb className="mb-5" currentPageTitle="Mastering Essential Pre-University Physics" help={pageHelp} modalId="physics_skills_19_help" />
                <img className="book-cover" src="/assets/phy/books/physics_skills_19.jpg" alt="Cover of the book."/>
                <PageFragment fragmentId="physics_skills_19_intro"/>
            </div>
            <div className="book-levels">
                <Col>
                    <h4>AS-Level (or equivalent)</h4>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_a_boards'} chapterTitle={'General Questions'} chapterIcon={'A'}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_b_boards'} chapterTitle={'Mechanics'} chapterIcon={'B'}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_c_boards'} chapterTitle={'Electric Circuits'} chapterIcon={'C'}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_d_boards'} chapterTitle={'Waves'} chapterIcon={'D'}/>
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_e_boards'} chapterTitle={'Uncertainties'} chapterIcon={'E'}/>
                        </Col>
                    </Row>
                    <h4>A2-Level (or equivalent)</h4>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_f_boards'} chapterTitle={'Mechanics'} chapterIcon={'F'}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_g_boards'} chapterTitle={'Gases'} chapterIcon={'G'}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_h_boards'} chapterTitle={'Fields'} chapterIcon={'H'}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_i_boards'} chapterTitle={'Capacitors'} chapterIcon={'I'}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_j_boards'} chapterTitle={'Nuclear Physics'} chapterIcon={'J'}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_k_boards'} chapterTitle={'Modelling the Universe'} chapterIcon={'K'}/>
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'phys19_l_boards'} chapterTitle={'Fact Sheets'} chapterIcon={'L'}/>
                        </Col>
                    </Row>
                </Col>
            </div>
        </Col>
    </Container>
};

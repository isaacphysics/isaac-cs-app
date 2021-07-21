import {Col, Row, Container} from "reactstrap";
import React from "react";
import {TitleAndBreadcrumb} from "../../elements/TitleAndBreadcrumb";
import {PageFragment} from "../../elements/PageFragment";
import {BookChapter} from "../../elements/BookChapter";

export const PhysicsSkills14 = () => {

    const pageHelp = <span>
        The Isaac Physics Mastering Essential Pre-University Physics book 2nd edition
    </span>;

    return <Container>
        <Col>
            <div className="book-intro">
                <TitleAndBreadcrumb className="mb-5" currentPageTitle="Mastering Essential Pre-University Physics" help="This book is now deprecated." />
                <img className="book-cover" src="/assets/phy/books/physics_skills_14.jpg" alt="Cover of the book."/>
                <PageFragment fragmentId="physics_skills_14_intro"/>
            </div>
            <div className="book-levels">
                <Col>
                    <h4>AS-Level (or equivalent)</h4>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_a_boards'} chapterTitle={'General Questions'} chapterIcon={'A'}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_b_boards'} chapterTitle={'Mechanics'} chapterIcon={'B'}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_c_boards'} chapterTitle={'Electric Circuits'} chapterIcon={'C'}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_d_boards'} chapterTitle={'Waves'} chapterIcon={'D'}/>
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_e_boards'} chapterTitle={'Uncertainties'} chapterIcon={'E'}/>
                        </Col>
                    </Row>
                    <h4>A2-Level (or equivalent)</h4>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_f_boards'} chapterTitle={'Mechanics'} chapterIcon={'F'}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_g_boards'} chapterTitle={'Gases'} chapterIcon={'G'}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_h_boards'} chapterTitle={'Fields'} chapterIcon={'H'}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_i_boards'} chapterTitle={'Capacitors'} chapterIcon={'I'}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_j_boards'} chapterTitle={'Nuclear Physics'} chapterIcon={'J'}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_k_boards'} chapterTitle={'Modelling the Universe'} chapterIcon={'K'}/>
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'ch_l_boards'} chapterTitle={'Fact Sheets'} chapterIcon={'L'}/>
                        </Col>
                    </Row>
                </Col>
            </div>
        </Col>
    </Container>
};

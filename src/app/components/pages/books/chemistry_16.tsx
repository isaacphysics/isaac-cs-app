import {Col, Row, Container} from "reactstrap";
import React from "react";
import {TitleAndBreadcrumb} from "../../elements/TitleAndBreadcrumb";
import {SUBJECTS} from "../../../services/constants";
import {PageFragment} from "../../elements/PageFragment";
import {BookChapter} from "../../elements/BookChapter";

export const Chemistry16 = () => {

    const pageHelp = <span>
        The Isaac Physics Mastering essential pre-university chemistry book
    </span>;

    return <Container className="chemistry">
        <Col>
            <div className="book-intro">
                <TitleAndBreadcrumb className="mb-5" currentPageTitle="Mastering essential pre-university chemistry" help={pageHelp} modalId="chemistry_book_help"/>
                <img className="book-cover" src="/assets/phy/books/chemistry_16.jpg" alt="Cover of the book."/>
                <PageFragment fragmentId="chemistry_16_intro"/>
            </div>
            <div className="book-levels">
                <Col>
                    <h4>Chapters:</h4>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_a_boards'} chapterTitle={'Formulae & Equations'} chapterIcon={'A'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_b_boards'} chapterTitle={'Amount of Substance'} chapterIcon={'B'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_c_boards'} chapterTitle={'Gas Laws'} chapterIcon={'C'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_d_boards'} chapterTitle={'Atomic Structure'} chapterIcon={'D'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_e_boards'} chapterTitle={'Electronic Spectroscopy'} chapterIcon={'E'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_f_boards'} chapterTitle={'Enthalpy Changes'} chapterIcon={'F'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_g_boards'} chapterTitle={'Entropy'} chapterIcon={'G'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_h_boards'} chapterTitle={'Free Energy'} chapterIcon={'H'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_i_boards'} chapterTitle={'Equilibrium'} chapterIcon={'I'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_j_boards'} chapterTitle={'Acids & Bases'} chapterIcon={'J'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_k_boards'} chapterTitle={'Redox'} chapterIcon={'K'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_l_boards'} chapterTitle={'Electrochemistry'} chapterIcon={'L'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'chem_16_m_boards'} chapterTitle={'Rate Laws, Graphs & Half-life'} chapterIcon={'M'} chapterSubject={SUBJECTS.CHEMISTRY}/>
                        </Col>
                    </Row>
                </Col>
            </div>
        </Col>
    </Container>
};

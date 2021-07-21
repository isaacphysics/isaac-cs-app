import {Col, Row, Container} from "reactstrap";
import React from "react";
import {TitleAndBreadcrumb} from "../../elements/TitleAndBreadcrumb";
import {SUBJECTS} from "../../../services/constants";
import {PageFragment} from "../../elements/PageFragment";
import {BookChapter} from "../../elements/BookChapter";

export const PreUniMaths = () => {

    const pageHelp = <span>
        The Isaac Physics Pre-University Mathematics for Sciences book
    </span>;

    return <Container className="maths">
        <Col>
            <div className="book-intro">
                <TitleAndBreadcrumb className="mb-5" currentPageTitle="Pre-University Mathematics for Sciences" help={pageHelp} modalId="maths_book_help"/>
                <img className="book-cover" src="/assets/phy/books/pre_uni_maths.jpg" alt="Cover of the book."/>
                <PageFragment fragmentId="pre_uni_maths_intro"/>
            </div>
            <div className="book-levels">
                <Col>
                    <h4>Chapters:</h4>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'pre_uni_maths_lvl1_boards'} chapterTitle={'Level 1'} chapterIcon={'1'} chapterSubject={SUBJECTS.MATHS}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'pre_uni_maths_lvl2_boards'} chapterTitle={'Level 2'} chapterIcon={'2'} chapterSubject={SUBJECTS.MATHS}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'pre_uni_maths_lvl3_boards'} chapterTitle={'Level 3'} chapterIcon={'3'} chapterSubject={SUBJECTS.MATHS}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'pre_uni_maths_lvl4_boards'} chapterTitle={'Level 4'} chapterIcon={'4'} chapterSubject={SUBJECTS.MATHS}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'pre_uni_maths_lvl5_boards'} chapterTitle={'Level 5'} chapterIcon={'5'} chapterSubject={SUBJECTS.MATHS}/>
                        </Col>
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'pre_uni_maths_lvl6_boards'} chapterTitle={'Level 6'} chapterIcon={'6'} chapterSubject={SUBJECTS.MATHS}/>
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col md={6} className="p-2">
                            <BookChapter chapterId={'pre_uni_maths_lvl7_boards'} chapterTitle={'Level 7'} chapterIcon={'7'} chapterSubject={SUBJECTS.MATHS}/>
                        </Col>
                    </Row>
                </Col>
            </div>
        </Col>
    </Container>
};

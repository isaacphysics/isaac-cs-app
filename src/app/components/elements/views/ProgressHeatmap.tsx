import React from 'react';
import {AnsweredQuestionsByDate} from "../../../../IsaacApiTypes";
import {
    HEATMAP_COLUMNS,
    HEATMAP_LEGEND_COLOURS,
    PRIMARY_COLOUR_RGB,
    SHORT_DAYS,
    SHORT_MONTHS
} from "../../../services/constants";
import {HeatMapGrid} from "react-grid-heatmap/dist";
import {NUMERIC_DATE} from "../DateString";
import {overflowModulus} from "../../../services/miscUtils";
import * as RS from "reactstrap";

export const ProgressHeatmap = ({answeredQuestionsByDate}: {answeredQuestionsByDate: AnsweredQuestionsByDate}) => {
    const yLabels = SHORT_DAYS;

    const findDiffWeeks = (a: Date, b: Date): number => {
        // Determine the difference between two dates in weeks by setting the date to the monday of that week
        // then compare the time difference
        const aBeginning = new Date(a);
        const bBeginning = new Date(b);
        aBeginning.setDate(a.getDate() - overflowModulus(aBeginning.getDay() - 1, 7));
        bBeginning.setDate(b.getDate() - overflowModulus(bBeginning.getDay() - 1, 7));
        return Math.floor(Math.round((aBeginning.getTime() - bBeginning.getTime()) / (24 * 3600 * 1000)) / 7)
    }

    const isBeginningOfMonth = (weekOffset: number): number | null => {
        // Determine if a specific number of weeks ago the week contained the first of the month
        const date = new Date();
        date.setDate(date.getDate() - (weekOffset * 7) - overflowModulus(date.getDay() - 1, 7) + 6);
        return date.getDate() <= 7 ? date.getMonth() : null
    }

    const foundDates = Object.keys(answeredQuestionsByDate);
    const heatmapData: number[][] = Array(yLabels.length).fill(0).map(() => Array(HEATMAP_COLUMNS).fill(0));
    const maxDate = new Date();
    const minDate = new Date();
    minDate.setDate(-HEATMAP_COLUMNS * 7);
    foundDates.forEach(dateString => {
        const date = new Date(dateString);
        const diffWeeks = findDiffWeeks(maxDate, date);
        if (diffWeeks < HEATMAP_COLUMNS) {
            heatmapData[overflowModulus(date.getDay() - 1, 7)][diffWeeks] = answeredQuestionsByDate[dateString] || 0;
        }
    })

    const xLabels = new Array(HEATMAP_COLUMNS).fill(0).map((_, i) => {
        const month = isBeginningOfMonth(i)
        return month != null ? SHORT_MONTHS[month] : `${i}`;
    });

    const lookupDateFromPos = (x: number, y: number): Date => {
        const date = new Date();
        date.setDate(date.getDate() - (overflowModulus(date.getDay() - 1, 7) - x) - (7 * y));
        return date;
    }

    return <div className="heatmap">
        <HeatMapGrid
            yLabels={yLabels}
            xLabels={xLabels}
            xLabelsPos={"bottom"}
            xLabelsStyle={(i) => ({
                color: isBeginningOfMonth(i) ? "#000000" : "transparent",
                height: isBeginningOfMonth(i) ? "" : "0px"
            })}
            data={heatmapData}
            cellHeight='2rem'
            cellStyle={(x, y, ratio) => ({
                background: ratio > 0 ? `rgba(${PRIMARY_COLOUR_RGB}, ${ratio * 0.8 + 0.2})` : "rgb(245, 245, 245)",
                fontSize: "11px",
            })}
            cellRender={(x, y, value) => (
                <div className={"h-100"} key={`${x}-${y}`} title={`${value} questions answered on ${NUMERIC_DATE.format(lookupDateFromPos(x, y))}`}/>
            )}
            square
        />
        <RS.Row>
            <HeatMapGrid data={[Array(HEATMAP_LEGEND_COLOURS).fill(0).map((_, i) => HEATMAP_LEGEND_COLOURS - i)]}
                         cellHeight='2rem'
                         cellStyle={(x, y, ratio) => ({
                             background: ratio > 0 ?
                                 `rgba(${PRIMARY_COLOUR_RGB}, ${Math.floor(ratio * 0.8 * (HEATMAP_LEGEND_COLOURS - 1)) / (HEATMAP_LEGEND_COLOURS - 1) + 0.2})` :
                                 "rgb(245, 245, 245)",
                         })}
                         yLabels={["More"]}
                         xLabels={Array(HEATMAP_LEGEND_COLOURS).fill(0).map((_, i) => `${i}`)}
                         xLabelsPos={"bottom"}
                         xLabelsStyle={() => ({height: "0px"})}
                         square
            />
            <div className={"ml-1 mt-1"}>Fewer</div>
        </RS.Row>
    </div>
};

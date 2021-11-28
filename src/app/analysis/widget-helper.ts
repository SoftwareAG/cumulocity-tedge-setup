import { interpolateInferno, interpolateRainbow } from "d3-scale-chromatic"
import { RawListItem } from "../property.model";

const colorScale = interpolateRainbow;
const colorRangeInfo = {
    colorStart: 0,
    colorEnd: 1,
    useEndAsStart: false,
}

const calculatePoint = function (i, intervalSize, colorRangeInfo) {
    var { colorStart, colorEnd, useEndAsStart } = colorRangeInfo;
    return (useEndAsStart
        ? (colorEnd - (i * intervalSize))
        : (colorStart + (i * intervalSize)));
}

export const generateNextColor = function (index) {
    var { colorStart, colorEnd } = colorRangeInfo;
    var colorRange = colorEnd - colorStart;
    // accomadate 20 colors
    //var intervalSize = colorRange / dataLength;
    var intervalSize = colorRange / 10;
    //console.log("Color", index)
    let colorPoint = calculatePoint(index, intervalSize, colorRangeInfo);
    return colorScale(colorPoint);
}


export const rangeUnits: RawListItem[] = [
    // { isGroup:false , id: -1, text: "Dates" },
    { id: 0, text: "measurements", format: "h:mm:ss.SSS a" },
    { id: 1, text: "second", format: "h:mm:ss a" },
    { id: 60, text: "minute", format: "h:mm a" },
    { id: 3600, text: "hour", format: "hA" },
    { id: 86400, text: "day", format: "MMM D" },
    { id: 604800, text: "week", format: "week ll" },
    { id: 2592000, text: "month", format: "MMM YYYY" },
    { id: 7776000, text: "quarter", format: "[Q]Q - YYYY" },
    { id: 31536000, text: "year", format: "YYYY" },
];
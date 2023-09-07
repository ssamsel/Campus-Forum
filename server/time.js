export function compare(a, b) {
    return b.time - a.time;
}

export function convertToRecencyString(time) {
    let diff = (Date.now() - time) / (1000 * 60) >> 0;

    if (diff === 0) {
        return "Just now";
    }
    if (diff < 60) {
        return message("minute", diff);
    }
    diff /= 60;
    diff >>= 0; // This is to round down, supposedly ~20% faster than Math.floor
    if (diff < 24) {
        return message("hour", diff);
    }
    diff /= 24;
    diff >>= 0;
    if (diff < 7) {
        return message("day", diff);
    }
    diff /= 7;
    diff >>= 0;
    if (diff < 5) {
        return message("week", diff);
    }
    diff /= 12;
    diff >>= 0;
    return message("year", diff);
}

function message(unit, num) {
    return num.toString() + " " + unit + (num != 1 ? "s" : "") + " ago";
}
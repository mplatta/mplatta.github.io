function convertFunctionPositionXToDisplay(x) {
	return Math.round(((x + Math.abs(functionInterval.min.x)) / Math.abs(functionInterval.max.x - functionInterval.min.x)) * ctx.canvas.width);
}

function convertFunctionPositionYToDisplay(y) {
	return Math.round(((1 - (y + Math.abs(functionInterval.min.y)) / Math.abs(functionInterval.max.y - functionInterval.min.y))) * ctx.canvas.height);
}

function convertDisplayXPositionToFunction(x, interval) {
	return (x / canvas.width) * (Math.abs(interval.max.x - interval.min.x)) + interval.min.x;
}

function convertDisplayYPositionToFunction(y, interval) {
	return (1 - (y / canvas.height)) * (Math.abs(interval.max.y - interval.min.y)) + interval.min.y;
}
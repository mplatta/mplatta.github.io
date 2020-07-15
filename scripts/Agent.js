function Agent(x, y, value, valueToShow) {
	this.x = x;
	this.y = y;
	this.value = value;
	this.valueToShow = valueToShow;
	this.velocity = {
		x : 0.0,
		y : 0.0
	};
}
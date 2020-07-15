// CSS particle
function ParticleCSS(x, y, value, valueToShow) {
	Agent.call(this, x, y, value, valueToShow);

	this.q = 0;							// electric charge

	this.calculateCharge = function(bestValue, worstValue) {
		// check if function is constant
		if (bestValue != worstValue)
			this.q = ((this.value - worstValue) / (bestValue - worstValue));
		else this.q = 0.5;
	}

	this.calculateVelocity = function(velocityX, velocityY) {
		this.velocity.x = (velocityX - this.x);
		this.velocity.y = (velocityY - this.y);
	}
}
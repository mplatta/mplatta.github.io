// GSA particle
function ParticleGSA(x, y, value, valueToShow) {		
	Agent.call(this, x, y, value, valueToShow);

	this.M = 0;							// particle inertia mass
	this.mj = 0;						// particle mass 
	this.acceleration = {				// acceleration of particle
		x : 0.0,
		y : 0.0
	};

	this.calculateInertiaMass = function(sumOfMj) {
		this.M = this.mj / sumOfMj;
	}

	this.calculateMass = function(bestValue, worstValue) {
		// check if function is constant
		if (bestValue != worstValue)
			this.mj = ((this.value - worstValue) / (bestValue - worstValue));
		else this.mj = 0.5;
	}

	this.calculateAcceleration = function(force) {
		let e = 0.00000001;
		
		this.acceleration.x = force.x / (this.M + e);
		this.acceleration.y = force.y / (this.M + e);
	}

	this.calculateVelocity = function() {
		let rand = Math.random();

		this.velocity.x = (rand * this.velocity.x) + this.acceleration.x;
		this.velocity.y = (rand * this.velocity.y) + this.acceleration.y;
	}
}
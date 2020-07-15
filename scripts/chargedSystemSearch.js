importScripts('../libraries/math.min.js');
importScripts('testFunctions.js');
importScripts('Agent.js');
importScripts('ParticleCSS.js');

// wait for data from main thread
self.addEventListener('message', function(msg) {
	//	data format:
	//	data = { 
	//		functionId: int,
	// 		numberOfAgents: int,
	//		seekingTheMaxmimum : boolean,
	// 		iterations: int,
	// 		expression : string,
	// 		interval: {
	//			max : {
	//			 	x : double,
	//			 	y : double
	//			 },
	//			 min : {
	//			 	x : double,
	//			 	y : double
	//			}
	//		}
	//	}
	var dataToAlgorithm = msg.data;
	chargedSystemSearch(JSON.parse(dataToAlgorithm));

	self.close();
}, false);

//	main algortihm
function chargedSystemSearch(data) {
	const startTime = performance.now();
	const radius = calculateRadius(data.interval);

	var agents = [];
	var best, worst;
	var firstTime = true;
	var pij;
	
	// algortithm always searches for the maximum
	// if user wont the minimum algorithm reverses function

	// init agents with random start positions
	for (let i = 0; i < data.numberOfAgents; i++) {
		let posX = Math.random() * (data.interval.max.x - data.interval.min.x) + data.interval.min.x;
		let posY = Math.random() * (data.interval.max.y - data.interval.min.y) + data.interval.min.y; 

		let value = testFunctions(data.functionId, posX, posY, data.expression);
		let valueToShow = value;
		if (!data.seekingTheMaxmimum) value = -value;

		// create new agent and push it to array
		ParticleCSS.prototype = Object.create(Agent.prototype);
		ParticleCSS.prototype.constructor = ParticleCSS;

		let particle = new ParticleCSS(posX, posY, value, valueToShow);
		agents.push(particle);

		// if it first lap set best and worst agent to first agent
		if (firstTime) {
			best = particle;
			worst = particle;
			firstTime = false;
		}

		// find best and worst agent
		if (particle.value > best.value) best = JSON.parse(JSON.stringify(particle));
		else if (particle.value < worst.value) worst = JSON.parse(JSON.stringify(particle));
	}

	// send init iteration
	let done = (i === data.iterations - 2) ? true : false;
	let dataToPost = {
		done : done,
		best : best,
		agents : agents,
		durationTime : null
	};
	
	self.postMessage(JSON.stringify(dataToPost));

	// next iterations without init iteration
	for (var i = 0; i < data.iterations - 1; i++) {
		// calculate charge
		for (let j = 0; j < data.numberOfAgents; j++) {
			agents[j].calculateCharge(best.value, worst.value);
		}

		// calculate new position and velocity for all paritcles
		for (var j = 0; j < data.numberOfAgents; j++) {
			var force = {
				x : 0.0,
				y : 0.0
			};

			// calculate sum force acting on j-th paritcle
			for (var k = 0; k < data.numberOfAgents; k++) {
				if (k === j) { continue };

				var distance = calculateDistance(agents[j], agents[k], best);
				var scalarForce = 0.0;

				// calculate scalar force
				if (agents[k].value > agents[j].value) {
					if (distance >= radius) { scalarForce = (agents[k].q / Math.pow(distance, 2)); }
					else { scalarForce = (agents[k].q / Math.pow(radius, 3)) * distance; }
				}

				force.x += (scalarForce * (agents[k].x - agents[j].x));
				force.y += (scalarForce * (agents[k].y - agents[j].y));
			}

			let rand1 = Math.random();
			let rand2 = Math.random();

			// exploration (kv) and exploitation (ka) controls
			let ka = (1 / 2) * (1 + (i / data.iterations));
			let kv = (1 / 2) * (1 - (i / data.iterations));

			// calculate new particle postion
			let tmpX = agents[j].x + (rand1 * ka * force.x) + (rand2 * kv * agents[j].velocity.x);
			let tmpY = agents[j].y + (rand1 * ka * force.y) + (rand2 * kv * agents[j].velocity.y);

			// chech if new position is in interval				
			if (tmpX > data.interval.max.x) tmpX = data.interval.max.x;
			else if (tmpX < data.interval.min.x) tmpX = data.interval.min.x;

			if (tmpY > data.interval.max.y) tmpY = data.interval.max.y;
			else if (tmpY < data.interval.min.y) tmpY = data.interval.min.y;

			// calculate new velocity
			agents[j].calculateVelocity(tmpX, tmpY);
			
			// set new postion
			agents[j].x = tmpX;
			agents[j].y = tmpY;

			// calculate new value
			agents[j].valueToShow = testFunctions(data.functionId, agents[j].x, agents[j].y, data.expression);
			if (!data.seekingTheMaxmimum) agents[j].value = -agents[j].valueToShow;
			
			// find best and worst agent
			if (agents[j].value > best.value) best = JSON.parse(JSON.stringify(agents[j]));
			else if (agents[j].value < worst.value) worst = JSON.parse(JSON.stringify(agents[j]));
		}

		// send results to main thread
		let dataToPost = {
			done : false,
			best : best,
			agents : agents,
			durationTime : null
		};

		if ((i % 10 === 0) || (i === data.iterations - 2)) self.postMessage(JSON.stringify(dataToPost));
	}

	var endTime = performance.now() - startTime;
	
	dataToPost = {
		done : true,
		best : best,
		agents : agents,
		durationTime : endTime
	};

	self.postMessage(JSON.stringify(dataToPost));
}

function calculateDistance(agent1, agent2, best) {
	let epsilon = 0.000000001;			// small positive number to avoid singularities
	let numerator = Math.sqrt(Math.pow((agent1.x - agent2.x), 2) 
		+ Math.pow((agent1.y - agent2.y), 2));
	let denominator = Math.sqrt(Math.pow(((agent1.x + agent2.x) * 1/2) - best.x, 2) 
		+ Math.pow(((agent1.y + agent2.y) * 1/2) - best.y, 2));

	return numerator / (denominator + epsilon); 
}

function calculateRadius(interval) {
	let radiusX = 0.1 * (interval.max.x - interval.min.x);
	let radiusY = 0.1 * (interval.max.y - interval.min.y);

	return Math.max(radiusX, radiusY);
}
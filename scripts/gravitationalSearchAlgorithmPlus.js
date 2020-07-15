importScripts('../libraries/math.min.js');
importScripts('testFunctions.js');
importScripts('Agent.js');
importScripts('ParticleGSA.js');

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
	gravitationalSearchAlgorithmPlus(JSON.parse(dataToAlgorithm));
	
	self.close();
}, false);

//	main algortihm
function gravitationalSearchAlgorithmPlus(data) {
	const startTime = performance.now();
	const G = calculateGravitationalConstant(data.interval);
	const alfa = 5;
	const radius = calculateRadius(data.interval);

	var agents = [];
	var best, worst;
	var firstTime = true;

	// algortithm always searches for the maximum
	// if user wont the minimum algorithm reverses function

	// init agents with random start positions
	for (let i = 0; i < data.numberOfAgents; ++i) {
		let posX = Math.random() * (data.interval.max.x - data.interval.min.x) + data.interval.min.x;
		let posY = Math.random() * (data.interval.max.y - data.interval.min.y) + data.interval.min.y; 
		
		let value = testFunctions(data.functionId, posX, posY, data.expression);
		let valueToShow = value;
		if (!data.seekingTheMaxmimum) value = -value;

		// create new agent and push it to array
		ParticleGSA.prototype = Object.create(Agent.prototype);
		ParticleGSA.prototype.constructor = ParticleGSA;

		let particle = new ParticleGSA(posX, posY, value, valueToShow);
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

	// send init iteration to main thread
	let dataToPost = {
		done : false,
		best : best,
		agents : agents,
		durationTime : null
	};
	
	self.postMessage(JSON.stringify(dataToPost));

	// next iterations without init iteration
	for (var i = 0; i < data.iterations - 1; ++i) {
		var sumOfMj = 0;
		var gInTime = G * Math.exp(-alfa * ((i + 1) / data.iterations));

		// calculate mj
		for (let j = 0; j < data.numberOfAgents; ++j) {
			agents[j].calculateMass(best.value, worst.value);
			sumOfMj += agents[j].mj;
		}

		for (let j = 0; j < data.numberOfAgents; ++j) { 
			agents[j].calculateInertiaMass(sumOfMj);

			if (agents[j].M === 0) {
				agents[j].x = Math.random() * (data.interval.max.x - data.interval.min.x) + data.interval.min.x;
				agents[j].y = Math.random() * (data.interval.max.y - data.interval.min.y) + data.interval.min.y;
			}
		}

		// calculate new position and velocity for all paritcles
		for (var j = 0; j < data.numberOfAgents; ++j) {
			var force = {
				x : 0.0,
				y : 0.0
			};
			var rand = Math.random();
			
			// calculate sum force acting on j-th paritcle
			for (var k = 0; k < data.numberOfAgents; ++k) {
				if (k === j) { continue };

				let distance = calculateDistance(agents[j], agents[k]);
				let scalarForce = 0.0;
				let pij = 1;

				if (distance >= radius) scalarForce = ((agents[j].M * agents[k].M) / distance);
				else scalarForce = ((agents[k].M) / Math.pow(radius, 3)) * distance;

				if (agents[k].value < agents[j].value) pij = 0.00001;

				force.x += (pij * gInTime * scalarForce * (agents[k].x - agents[j].x) * rand);
				force.y += (pij * gInTime * scalarForce * (agents[k].y - agents[j].y) * rand);
			}
			
			agents[j].calculateAcceleration(force);
			agents[j].calculateVelocity();

			// calculate new particle postion
			let tmpX = agents[j].x + agents[j].velocity.x;
			let tmpY = agents[j].y + agents[j].velocity.y;

			// chech if new position is in interval				
			if (tmpX > data.interval.max.x) tmpX = data.interval.max.x;
			else if (tmpX < data.interval.min.x) tmpX = data.interval.min.x;

			if (tmpY > data.interval.max.y) tmpY = data.interval.max.y;
			else if (tmpY < data.interval.min.y) tmpY = data.interval.min.y;
			
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

		if ((i % 10 === 0) || (i === data.iterations - 2)) { self.postMessage(JSON.stringify(dataToPost)); }
	}

	const endTime = performance.now() - startTime;
	
	dataToPost = {
		done : true,
		best : best,
		agents : agents,
		durationTime : endTime
	};

	self.postMessage(JSON.stringify(dataToPost));
}

function calculateDistance(agent1, agent2) {
	var e = 0.00000001;

	return Math.sqrt(Math.pow((agent2.x - agent1.x), 2) + Math.pow((agent2.y - agent1.y), 2)) + e;
}

function calculateRadius(interval) {
	let radiusX = 0.1 * (interval.max.x - interval.min.x);
	let radiusY = 0.1 * (interval.max.y - interval.min.y);

	return Math.max(radiusX, radiusY);
}

function calculateGravitationalConstant(interval) {
	let rangeX = (interval.max.x - interval.min.x);
	let rangeY = (interval.max.y - interval.min.y);

	return Math.max(rangeX, rangeY) / 2;
}
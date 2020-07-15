importScripts('../libraries/math.min.js');
importScripts('testFunctions.js');
importScripts('Agent.js');
importScripts('ParticleGSA.js');

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
// wait for data from main thread
self.addEventListener('message', function(msg) {
	var dataToAlgorithm = msg.data;
	gravitationalSearchAlgorithm(JSON.parse(dataToAlgorithm));
	
	self.close();
}, false);

//	main algortihm
function gravitationalSearchAlgorithm(data) {
	const startTime = performance.now();
	const G = 100;
	const alfa = 20
	const step = data.numberOfAgents / data.iterations;
	
	var quantityOfBest = data.numberOfAgents;
	var agents = [];
	var best, worst;

	// init agents with random start positions
	for (let i = 0; i < data.numberOfAgents; ++i) {
		let posX = Math.random() * (data.interval.max.x - data.interval.min.x) + data.interval.min.x;
		let posY = Math.random() * (data.interval.max.y - data.interval.min.y) + data.interval.min.y; 
		
		let value = testFunctions(data.functionId, posX, posY, data.expression);
		let valueToShow = value;

		// algortithm always searches for the maximum
		// if user wont the minimum algorithm reverses function
		if (!data.seekingTheMaxmimum) value = -value;

		// create new agent and push it to array
		ParticleGSA.prototype = Object.create(Agent.prototype);
		ParticleGSA.prototype.constructor = ParticleGSA;

		let particle = new ParticleGSA(posX, posY, value, valueToShow);
		agents.push(particle);

		// if it first lap, set best and worst agent to first agent
		if (i === 0) {
			best = particle;
			worst = particle;
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

		quantityOfBest -= step;
		if (quantityOfBest < 1) quantityOfBest = 1;

		// sort agents from best to worst fitness
		agents.sort(function(agent1, agent2) {
			if (agent1.value > agent2.value) return -1;
			else if (agent1.value < agent2.value) return 1;
			else return 0;
		});

		// calculate mj
		for (var j = 0; j < data.numberOfAgents; ++j) {
			agents[j].calculateMass(agents[0].value, agents[data.numberOfAgents - 1].value);
			sumOfMj += agents[j].mj;
		}

		for (var j = 0; j < data.numberOfAgents; ++j) { 
			agents[j].calculateInertiaMass(sumOfMj);

			// calculate new position for worst agents
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
			for (var k = 0; k < quantityOfBest; ++k) {
				if (k === j) { continue };

				let distance = calculateDistance(agents[j], agents[k]);
				let scalarForce = 0.0;

				scalarForce = gInTime * ((agents[j].M * agents[k].M) / distance);
				force.x += (scalarForce * (agents[k].x - agents[j].x) * rand);
				force.y += (scalarForce * (agents[k].y - agents[j].y) * rand);
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

		// send to main thread only ~10% iterations
		if ((i % 10 === 0) || (i === data.iterations - 2)) { self.postMessage(JSON.stringify(dataToPost)); }
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

function calculateDistance(agent1, agent2) {
	var e = 0.00000001;

	return Math.sqrt(Math.pow((agent2.x - agent1.x), 2) + Math.pow((agent2.y - agent1.y), 2)) + e;
}
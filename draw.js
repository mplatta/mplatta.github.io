const percentWidth = 0.69;
const percentHeight = 0.999;
const maxNumberOfIterations = 2000;
const maxNumberOfAgents = 200;

var canvas;
var ctx;
var queue = [];
var worker = null;
var functionInterval;
var displayIteration;
var reDraw = false;
var functionId;
var expression;
var done;

var dimZ = {
	max : 100,
	min : -10
};

var squareSize = 5;

function init() {
	canvas = document.getElementById("myCanvas");
	ctx = canvas.getContext("2d");
	
	ctx.canvas.width = window.innerWidth * percentWidth;
	ctx.canvas.height = window.innerHeight * percentHeight;

	displayIteration = 0;
	startDraw = false;
	done = false;

	window.requestAnimationFrame(draw);
}

function startStop() {
	if (worker === null) {
		setStartParams();
		startAlgorithm(); 
	} else stopAlgorithm();
}

function startAlgorithm() {
	// take value from html fields 	
	showLoader(true);
	let algorithmId = parseInt($('#algorithmId').val());
	let numberOfAgents = parseInt($('#numberOfAgents').val());
	let seekingTheMaxmimum = (parseInt($('#extreme').val()) === 0) ? false : true;
	let numberOfIteration = parseInt($('#numberOfIteration').val());
	
	if (numberOfAgents > maxNumberOfAgents) numberOfAgents = maxAgents;
	if (numberOfIteration > maxNumberOfIterations) numberOfIteration = maxNumberOfIterations;

	functionId = parseInt($('#functionId').val());
	expression = $("#expression").val().replace(/\s/g, ""); 				// take expression without blank space

	if(!validateExpression(expression)) return;

	// take ranges without blank space
	xRange = $("#inputXRange").val().replace(/\s/g, "").split(",");
	yRange = $("#inputYRange").val().replace(/\s/g, "").split(",");
	zRange = $("#inputZRange").val().replace(/\s/g, "").split(",");

	dimZ.min = Number(zRange[0]);
	dimZ.max = Number(zRange[1]);

	if(!checkIsNumericRange("x", xRange[0], xRange[1])) return;
	if(!checkIsNumericRange("y", yRange[0], yRange[1])) return;
	if(!checkIsNumericRange("z", zRange[0], zRange[1])) return;

	functionInterval = {
		max : {
			x : Number(xRange[1]),
			y : Number(yRange[1])
		},
		min : {
			x : Number(xRange[0]),
			y : Number(yRange[0])
		}
	}

	let postData = {  
		functionId: functionId,
		numberOfAgents: numberOfAgents,
		seekingTheMaxmimum : seekingTheMaxmimum,
		iterations: numberOfIteration,
		expression : expression,
		interval: functionInterval
	};

	if (expression != "") squareSize = 21;

	switch (algorithmId) {
		case 0: worker = new Worker("scripts/chargedSystemSearch.js");
		break;
		case 1: worker = new Worker("scripts/gravitationalSearchAlgorithm.js");
		break;
		case 2: worker = new Worker("scripts/gravitationalSearchAlgorithmPlus.js");
		break;
	}

	worker.postMessage(JSON.stringify(postData));
	worker.addEventListener('message', handleMessageFromWorker);

	window.requestAnimationFrame(draw);
}

function draw() {
	if ((ctx.canvas.width != parseInt(window.innerWidth * percentWidth)) || 
		(ctx.canvas.height != parseInt(window.innerHeight * percentHeight))) reDraw = true;

	ctx.canvas.width = window.innerWidth * percentWidth;
	ctx.canvas.height = window.innerHeight * percentHeight;

	if (queue.length > 0) {
		if (reDraw) {
			drawAFunctions();

			reDraw = false;

			// save draw function like img and set it to background
			let dataURL = canvas.toDataURL();
			$("#myCanvas").css("background-image", "url(" + dataURL + ")");
		}

		// draw agents
		for (let i = 0; i < queue[displayIteration].agents.length; i++) {
			let x = convertFunctionPositionXToDisplay(queue[displayIteration].agents[i].x);
			let y = convertFunctionPositionYToDisplay(queue[displayIteration].agents[i].y);

			ctx.beginPath();
			ctx.arc(x, y, 3, 0, 2 * Math.PI);
			ctx.fillStyle = "white";
			ctx.fill();
		}
		
		// draw best agent
		let bestX = convertFunctionPositionXToDisplay(queue[displayIteration].best.x);
		let bestY = convertFunctionPositionYToDisplay(queue[displayIteration].best.y);

		ctx.beginPath();
		ctx.arc(bestX, bestY, 3, 0, 2 * Math.PI);
		ctx.fillStyle = "red";
		ctx.fill();

		if (queue[displayIteration].done) done = true;
		if ((queue.length - 1) >= displayIteration + 1) displayIteration++;
	}

	if (!done) window.requestAnimationFrame(draw);
	else stopAlgorithm();
}

function drawAFunctions() {
	for (var i = 0; i <= (canvas.width + squareSize); i += squareSize) {
		for (var j = 0; j <= (canvas.height + squareSize); j += squareSize) {
			// convert pixel position to position in function
			let tmpX = convertDisplayXPositionToFunction(i + Math.ceil(squareSize / 2), functionInterval);
			let tmpY = convertDisplayYPositionToFunction(j + Math.ceil(squareSize / 2), functionInterval);

			let interval = Math.abs(dimZ.max - dimZ.min);
			let value = (testFunctions(functionId, tmpX, tmpY, expression) - dimZ.min) / interval;

			ctx.fillStyle = setColor(value);
			ctx.fillRect(i, j, i + squareSize, j + squareSize);
		}

		if(squareSize >= 3) {
			// draw vertital grid
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i, canvas.height);
			ctx.lineWidth = 0.3;
			ctx.stroke();
		}
	}

	//draw horizontal grid
	if(squareSize >= 3) {
		for (var i = 0; i <= (canvas.height + squareSize); i += squareSize) {
			ctx.beginPath();
			ctx.moveTo(0, i);
			ctx.lineTo(canvas.width, i);
			ctx.lineWidth = 0.3;
			ctx.stroke();
		}
	}

	// y axis
	for (var i = 1; i < 10; ++i) {
		if (i != 8) {
			ctx.beginPath();
			ctx.moveTo((canvas.width * 0.2) - 10, canvas.height * (i * 0.1));
			ctx.lineTo((canvas.width * 0.2) + 10, canvas.height * (i * 0.1));
			ctx.strokeStyle = "black";
			ctx.lineWidth = 2;
			ctx.stroke();

			ctx.fillStyle = "black";
			ctx.textAlign = "right";
			ctx.font = "15px Arial";

			var yValue = convertDisplayYPositionToFunction(canvas.height * (i * 0.1), functionInterval);

			ctx.fillText(round(yValue, 2), (canvas.width * 0.2) - 30, canvas.height * (i * 0.1) + 7);
		} else {
			ctx.beginPath();
			ctx.moveTo(0, canvas.height * 0.8);
			ctx.lineTo(canvas.width, canvas.height * 0.8);
			ctx.strokeStyle = "black";
			ctx.lineWidth = 2;
			ctx.stroke();
		}
	}

	// x axis
	for (var i = 1; i < 10; ++i) {
		if (i != 2) {
			ctx.beginPath();
			ctx.moveTo(canvas.width * (i * 0.1), (canvas.height * 0.8) - 10);
			ctx.lineTo(canvas.width * (i * 0.1), (canvas.height * 0.8) + 10);
			ctx.strokeStyle = "black";
			ctx.lineWidth = 2;
			ctx.stroke();

			ctx.save();
			ctx.translate(canvas.width * (i * 0.1) + 7, (canvas.height * 0.8) + 30);
			ctx.rotate(-Math.PI / 2);
			ctx.fillStyle = "black";
			ctx.textAlign = "right";
			ctx.font = "15px Arial";

			var xValue = convertDisplayXPositionToFunction(canvas.width * (i * 0.1), functionInterval);

			ctx.fillText(round(xValue, 2), 0, 0);
			ctx.restore();
		} else {
			ctx.beginPath();
			ctx.moveTo(canvas.width * 0.2, 0);
			ctx.lineTo(canvas.width * 0.2, canvas.height);
			ctx.strokeStyle = "black";
			ctx.lineWidth = 2;
			ctx.stroke();
		}
	}

	showLoader(false);
}

function setStartParams() {
	displayIteration = 0;
	queue = [];
	
	squareSize = 5;
	reDraw = true;
	done = false;

	$("#resultContainer").show();
	$("#bestResult").text("");
	$("#bestPosX").text("");
	$("#bestPosY").text("");
	$("#durationTime").text("");

	$("#startButton").css("background-color", "#FF0000");
	$("#startButton").text("Stop");
	$("#iterationSlider").remove();
	$("#bestInIteration").hide();

	return;
}

function handleMessageFromWorker(msg) {
	let data = JSON.parse(msg.data)
	
	$("#bestResult").text(data.best.valueToShow);
	$("#bestPosX").text(data.best.x);
	$("#bestPosY").text(data.best.y);

	if (data.done) {
		console.log("Best value: " + data.best.valueToShow + 
		" for x=" + data.best.x + " y=" + data.best.y);

		if (data.durationTime != null) $("#durationTime").text(data.durationTime + " ms");
		addSlider(queue.length - 1);
	}
	
	queue.push(data);
}

function stopAlgorithm() {
	if (worker != null) {
		worker.terminate();
		worker = null;
	}
		
	done = true;
	reDraw = false;

	$("#startButton").css("background-color", "#4CAF50");
	$("#startButton").text("Start");
}

function addSlider(length) {
	$("#iterationSlider").remove();
	$("#sliderContainer").append("<input type=\"range\" min=\"0\" max=\"" + length + "\" value=\"" 
		+ length + "\" id=\"iterationSlider\" oninput=\"drawIteration();\"/>");
	$("#bestInIteration").show();
}

function drawIteration() {
	displayIteration = $("#iterationSlider").val();
	$("#iterationFromSlider").text(displayIteration);
	$("#iterationBest").text(queue[displayIteration].best.valueToShow);

	window.requestAnimationFrame(draw);
}

function round(n, k) {
	var factor = Math.pow(10, k);
	return Math.round(n * factor) / factor;
}

function showLoader(show) {
	if (show) $("#loadScreen").show();
	else $("#loadScreen").hide();
}

init();
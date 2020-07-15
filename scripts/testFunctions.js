function testFunctions(id, x, y, expression) {
	var result;
	var scope = {
		x : x,
		y : y
	};

	if ((expression != "") && (expression != null)) return math.eval(expression, scope);

	switch (id) {
		case 0:
			// Himmelblaus function
			result = Math.pow(((x * x) + y - 11), 2) + Math.pow((x + (y * y) - 7), 2); 
			break;
		case 1:
			// Rosenbrock function
			result = Math.pow((1 - x), 2) + 100 * Math.pow((y - (x * x)), 2);
			break;
		case 2:
			// Matyas function
			result = 0.26 * (x * x + y * y) - 0.48 * x * y;
			break;
		case 3:
			// Bukkin function No 6
			result = 100 * Math.sqrt(Math.abs(y - 0.01 * (x * x))) + 0.01 * Math.abs(x + 10);
			break;
		case 4:
			// Three-hump camel function
			result = 2 * (x * x) - 1.05 * Math.pow(x, 4) + (Math.pow(x, 6) / 6) + (x * y) + (y * y);
			// result = 2 * x ^ 2 - 1.05 *x ^ 4 + x^ 6/6+x*y+y^2
			break;
		case 5:
			// Rastrigin function
			result = 20 + ((x * x) - 10 * Math.cos(2 * Math.PI * x)) + ((y * y) - 10 * Math.cos(2 * Math.PI * y));
			break;
		default: result = 0;
	}

	return result;
}

function getExpressionTestFunctions(id) {
	var result;

	switch (id) {
		case 0:
			// Himmelblaus function
			result = "(x^2+y-11)^2+(x+y^2-7)^2"; 
			break;
		case 1:
			// Rosenbrock function
			result = "((1-x)^2)+100*(y-x^2)^2";
			break;
		case 2:
			// Matyas function
			result = "0.26*(x^2+y^2)-0.48*x*y";
			break;
		case 3:
			// Bukkin function No 6
			result = "100*sqrt(abs(y-0.01*x^2))+0.01*abs(x+10)";
			break;
		case 4:
			// Three-hump camel function
			result = "2*x^2-1.05*x^4+(x^6/6)+x*y+y^2";
			break;
		case 5:
			result = "20+(x^2-10*cos(2*pi*x))+(y^2-10*cos(2*pi*y))";
			break;
		default: result = "";
	}

	return result;
}
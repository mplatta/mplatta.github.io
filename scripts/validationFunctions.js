function checkIsNumericRange(axis, rangeMin, rangeMax) {
	if (!$.isNumeric(rangeMin) || !$.isNumeric(rangeMax)) {
		stopAlgorithm();
		showLoader(false);
		$("#resultContainer").hide();
		alert("Źle wprowadzony przedział w osi " + axis + "!");

		return false;
	} else {
		if (Number(rangeMax) < Number(rangeMin)) {
			stopAlgorithm();
			showLoader(false);
			$("#resultContainer").hide();
			alert("Minimum nie może być większe od maksimum w przedziale osi " + axis + "!");

			return false;
		}
	}

	return true;
}

function validateExpression(expression) {
	try {
		math.eval(expression, { x: 1, y: 1 });

		return true;
	} catch (err) {
		stopAlgorithm();
		showLoader(false);
		$("#resultContainer").hide();
		alert("Coś jest nie tak ze wzorem!")

		return false;
	}
}
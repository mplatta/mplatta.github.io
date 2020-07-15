function RGB(r, g, b) {
	this.r = r;
	this.g = g;
	this.b = b;
}

RGB.prototype.toString = function() {
	return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
};

function HSV(H, S, V) {
	this.H = H;
	this.S = S;
	this.V = V;
}

function RGBtoHSV(color) {
	var R = color.r / 255;
	var G = color.g / 255;
	var B = color.b / 255;

	var min = Math.min(R, G, B);
	var max = Math.max(R, G, B);
	var delMax = max - min;
	var HH = 0;
		SS = 0;
		VV = 0;

	VV = max;

	if (delMax === 0) HH = SS = 0;
	else {
		SS = delMax / max;

		let delR = (max - R) / 6 / delMax + 1 / 2 ;
		let delG = (max - G) / 6 / delMax + 1 / 2 ;
		let delB = (max - B) / 6 / delMax + 1 / 2 ;

		if (R === max) HH = delB - delG;
		else if (G === max) HH = (1 / 3) + delR - delB;
		else if (B === max) HH = (2 / 3) + delG - delR;

		if (HH < 0) HH += 1;
		else if (HH > 1) HH -= 1;
	}

	return new HSV(HH, SS, VV);
}

function HSVtoRGB(color) {
	var R, G, B;
	var RR, GG, BB;

	if (color.S === 0) {
		RR = color.V * 255;
		GG = color.V * 255;
		BB = color.V * 255;
	} else {
		var h = ((color.H) * 6 === 6) ? 0 : (color.H * 6);
		var i = Math.floor(h);
		var var1 = color.V * (1 - color.S);
		var var2 = color.V * (1 - color.S * (h - i));
		var var3 = color.V * (1 - color.S * (1 - (h - i)));

		switch (i % 6) {
			case 0 : R = color.V;	G = var3;		B = var1; break;
			case 1 : R = var2;		G = color.V; 	B = var1; break;
			case 2 : R = var1;		G = color.V; 	B = var3; break;
			case 3 : R = var1;		G = var2;		B = color.V; break;
			case 4 : R = var3; 		G = var1;		B = color.V; break;
			case 5 : R = color.V;	G = var1;		B = var2; break;
		}

		RR = Math.round(R * 255);
		GG = Math.round(G * 255);
		BB = Math.round(B * 255);
	}

	return new RGB(RR, GG, BB);
}

function interpolateRGB(startRGB, endRGB, a) {
	var rgb = {
		r: Math.round(startRGB.r + (endRGB.r - startRGB.r) * a),
		g: Math.round(startRGB.g + (endRGB.g - startRGB.g) * a),
		b: Math.round(startRGB.b + (endRGB.b - startRGB.b) * a)
	}
  
	return new RGB(rgb.r, rgb.g, rgb.b);
}

function interpolateHSV(startHSV, endHSV, a) {
	var h;
	var delta = endHSV.H - startHSV.H;
	var startH = startHSV.H;
	var endH = endHSV.H;
	var t = a;

	if (delta > 0.5) {
		startH += 1;
		h = (startH + t * (endH - startH)) % 1;
	} else {
		h = startH + t * delta;
	}

	var hsv = {
		h: h,
		s: startHSV.S + t * (endHSV.S - startHSV.S),
		v: startHSV.V + t * (endHSV.V - startHSV.V)
	}
  
	return new HSV(hsv.h, hsv.s, hsv.v);
}

var colors = [
	new RGB(255, 0, 208),
	new RGB(0, 0, 255),       // minimum color - blue
	new RGB(0, 255, 255),     // transition from blue to green - ligth blue
	new RGB(0, 255, 0),       // midlle color - green
	new RGB(255, 255, 0),     // transition from green to red - yellow
	new RGB(255, 0, 0),       // end color - red
	new RGB(100, 0, 0)        // after end - brown
];

function setColor(value) {
	if (value > 2) return colors[6].toString();
	else if ((value > 1) && (value <= 2)) return interpolateRGB(colors[5], colors[6], value - 1);
	else if ((value <= 1) && (value >= 0)) return HSVtoRGB(interpolateHSV(RGBtoHSV(colors[1]), RGBtoHSV(colors[5]), value)).toString();
	else if ((value < 0) && (value >= -1)) return interpolateRGB(colors[0], colors[1], value + 1);
	else return colors[0];
}
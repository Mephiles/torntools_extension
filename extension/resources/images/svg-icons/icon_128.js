// noinspection JSCheckFunctionSignatures

function ttSvg() {
	const svgNS = "http://www.w3.org/2000/svg";

	const svg = document.createElementNS(svgNS, "svg");
	svg.setAttributeNS(null, "viewBox", "0 0 128 128");
	svg.setAttributeNS(null, "class", "tt-svg");

	const g1 = document.createElementNS(svgNS, "g");
	g1.setAttributeNS(null, "class", "tt-svg-upper");
	g1.setAttributeNS(null, "aria-label", "T");

	const g1Rect1 = document.createElementNS(svgNS, "rect");
	g1Rect1.setAttributeNS(null, "height", 19);
	g1Rect1.setAttributeNS(null, "width", 72);
	g1Rect1.setAttributeNS(null, "x", 17);
	g1Rect1.setAttributeNS(null, "y", 19);
	g1.appendChild(g1Rect1);

	const g1Rect2 = document.createElementNS(svgNS, "rect");
	g1Rect2.setAttributeNS(null, "height", 63);
	g1Rect2.setAttributeNS(null, "width", 22);
	g1Rect2.setAttributeNS(null, "x", 42);
	g1Rect2.setAttributeNS(null, "y", 38);
	g1.appendChild(g1Rect2);

	svg.appendChild(g1);

	const g2 = document.createElementNS(svgNS, "g");
	g2.setAttributeNS(null, "class", "tt-svg-lower");
	g2.setAttributeNS(null, "aria-label", "t");

	const g2Rect1 = document.createElementNS(svgNS, "rect");
	g2Rect1.setAttributeNS(null, "height", 8);
	g2Rect1.setAttributeNS(null, "width", 35);
	g2Rect1.setAttributeNS(null, "x", 65);
	g2Rect1.setAttributeNS(null, "y", 54);
	g2.appendChild(g2Rect1);

	const g2Rect2 = document.createElementNS(svgNS, "rect");
	g2Rect2.setAttributeNS(null, "height", 45);
	g2Rect2.setAttributeNS(null, "width", 10);
	g2Rect2.setAttributeNS(null, "x", 75);
	g2Rect2.setAttributeNS(null, "y", 46);
	g2.appendChild(g2Rect2);

	const path = document.createElementNS(svgNS, "path");
	path.setAttributeNS(
		null,
		"d",
		"M 93.012 90.33 C 94.793 90.479 97.256 92.004 97.559 94.062 C 98.036 97.301 94.147 100.385 90.652 100.453 C 89.036 100.484 84.043 100.357 81.64 99.762 C 80.525 99.486 74.674 94.466 75.002 91.017 C 75.179 89.16 84.406 88.356 85.191 89.439 C 88.846 91.67 91.231 90.181 93.012 90.33 Z"
	);
	g2.appendChild(path);

	svg.appendChild(g2);

	return svg;
}

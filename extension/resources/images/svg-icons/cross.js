function crossSvg() {
	const svgNS = "http://www.w3.org/2000/svg";

	const svg = document.createElementNS(svgNS, "svg");
	svg.setAttributeNS(null, "class", "tt-cross");
	svg.setAttributeNS(null, "viewBox", "0 0 5 5");
	svg.setAttributeNS(null, "title", "Blocked by TornTools");

	const rect1 = document.createElementNS(svgNS, "rect");
	rect1.setAttributeNS(null, "x", "0.5");
	rect1.setAttributeNS(null, "y", "-0.5");
	rect1.setAttributeNS(null, "width", "6");
	rect1.setAttributeNS(null, "height", "1");
	rect1.setAttributeNS(null, "transform", "rotate(45)");
	rect1.setAttributeNS(null, "fill", "#627e0d");
	svg.appendChild(rect1);

	const rect2 = document.createElementNS(svgNS, "rect");
	rect2.setAttributeNS(null, "x", "-3");
	rect2.setAttributeNS(null, "y", "3");
	rect2.setAttributeNS(null, "width", "6");
	rect2.setAttributeNS(null, "height", "1");
	rect2.setAttributeNS(null, "transform", "rotate(-45)");
	rect2.setAttributeNS(null, "fill", "#627e0d");
	svg.appendChild(rect2);

	return svg;
}

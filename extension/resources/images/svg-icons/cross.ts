function crossSvg() {
	const svgNS = "http://www.w3.org/2000/svg";

	const svg = document.createElementNS(svgNS, "svg");
	svg.setAttributeNS(null, "class", "tt-cross");
	svg.setAttributeNS(null, "viewBox", "0 0 30 30");
	svg.setAttributeNS(null, "fill", "#627e0d");
	svg.setAttributeNS(null, "height", "30");
	svg.setAttributeNS(null, "width", "30");
	svg.setAttributeNS(null, "title", "Blocked by TornTools");

	const path = document.createElementNS(svgNS, "path");
	path.setAttributeNS(null, "d", "M 0 1 L 12.061 15 L 0 29 L 1 30 L 15 18.06 L 29 30 L 30 29 L 17.94 15 L 30 1 L 29 0 L 15 11.94 L 1 0 L 0 1 Z");
	svg.appendChild(path);

	return svg;
}

function backSvg() {
	const svgNS = "http://www.w3.org/2000/svg";

	const svg = document.createElementNS(svgNS, "svg");
	svg.setAttributeNS(null, "viewBox", "0 0 16 13");

	const path = document.createElementNS(svgNS, "path");
	path.setAttributeNS(null, "d", "M16,13S14.22,4.41,6.42,4.41V1L0,6.7l6.42,5.9V8.75c4.24,0,7.37.38,9.58,4.25");
	path.setAttributeNS(null, "fill", "var(--tt-svg-back-fill)");
	svg.appendChild(path);

	return svg;
}

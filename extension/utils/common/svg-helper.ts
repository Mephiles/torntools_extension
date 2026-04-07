import { elementBuilder, isSVGElement } from "@/utils/common/functions/dom";

export interface SvgAttributes {
	[key: string]: string | number | boolean;
}

type SVGFactory = (attributes?: SvgAttributes) => SVGElement;

export function svgImport(svgImport: string): SVGFactory {
	if (typeof svgImport !== "string") {
		return () => createFallbackElement();
	}

	if (svgImport.startsWith("data:image/svg+xml")) {
		const encodedData = svgImport.substring("data:image/svg+xml,".length);

		let svgContent: string;
		try {
			svgContent = decodeURIComponent(encodedData);
		} catch (error) {
			console.error("Failed to decode SVG data URL", error);
			return () => createFallbackElement();
		}

		return (attributes: SvgAttributes = {}) => createSvgElement(svgContent, attributes);
	}

	return (attributes: SvgAttributes = {}) => createSvgElement(svgImport, attributes);
}

function createFallbackElement(): SVGElement {
	const svgNS = "http://www.w3.org/2000/svg";
	const svg = document.createElementNS(svgNS, "svg");
	svg.setAttribute("width", "24");
	svg.setAttribute("height", "24");
	svg.setAttribute("viewBox", "0 0 24 24");

	const rect = document.createElementNS(svgNS, "rect");
	rect.setAttribute("x", "0");
	rect.setAttribute("y", "0");
	rect.setAttribute("width", "24");
	rect.setAttribute("height", "24");
	rect.setAttribute("fill", "red");
	svg.appendChild(rect);

	return svg;
}

function createSvgElement(svgContent: string, attributes: SvgAttributes = {}): SVGElement {
	const fullAttributes: SvgAttributes = {
		width: "1em",
		height: "1em",
		...attributes,
	};

	const template = elementBuilder({ type: "template", html: svgContent.trim() });
	const svg = template.content.firstChild;

	if (!isSVGElement(svg)) {
		return createFallbackElement();
	}

	Object.entries(fullAttributes)
		.filter(([, value]) => value !== false && value !== null && value !== undefined)
		.map(([key, value]) => svg.setAttribute(key, String(value)));

	return svg;
}

import { type BasicSourceMapConsumer, type NullableMappedPosition, type RawSourceMap, SourceMapConsumer } from "source-map";

export interface SourceLocation {
	rawPath: string;
	path: string;
	file: string;
	line: number;
	column: number;
}

export class SourceService {
	private static readonly CHROME_METHOD_STACK_LINE =
		/^\s*at (?<method>.*) \(chrome-extension:\/\/.*\/content-scripts\/extension\.js:(?<line>\d+):(?<column>\d+)\)$/;
	private static readonly CHROME_STACK_LINE = /^\s*at chrome-extension:\/\/.*\/content-scripts\/extension\.js:(?<line>\d+):(?<column>\d+)$/;
	private static readonly FIREFOX_METHOD_STACK_LINE = /^(?<method>.+)@moz-extension:\/\/.*\/content-scripts\/extension\.js:(?<line>\d+):(?<column>\d+)$/;
	private static readonly FIREFOX_STACK_LINE = /^@moz-extension:\/\/.*\/content-scripts\/extension\.js:(?<line>\d+):(?<column>\d+)$/;

	private sourceMapConsumer: BasicSourceMapConsumer | null = null;

	constructor() {
		this.initializeSourceMap().catch((err) => console.error(err));
	}

	private async initializeSourceMap() {
		// Initialize the WASM module first
		// @ts-expect-error For some reason this isn't properly typed.
		SourceMapConsumer.initialize({
			"lib/mappings.wasm": "https://unpkg.com/source-map@0.7.6/lib/mappings.wasm",
		});

		// @ts-expect-error SourceMaps aren't included in the automatic typing
		const name = browser.runtime.getURL("/content-scripts/extension.js.map");
		const content: RawSourceMap = await fetch(name).then((res) => res.json());

		this.sourceMapConsumer = await new SourceMapConsumer(content);
	}

	mappedStack(stack?: string) {
		if (!stack) return "";
		if (!this.sourceMapConsumer) return stack;

		return stack
			.split("\n")
			.map((stackLine) => {
				const generatedFrame = SourceService.parseGeneratedSourceStackFrame(stackLine);
				if (!generatedFrame) return stackLine;

				const location = this.fromSource(generatedFrame.line, generatedFrame.column);
				if (!location) return stackLine;

				return SourceService.formatMappedStackFrame(generatedFrame, location);
			})
			.join("\n");
	}

	fromSource(line: number, column: number): SourceLocation {
		if (!this.sourceMapConsumer) return null;

		const position = this.sourceMapConsumer.originalPositionFor({ line, column });

		return SourceService.convertSourceLocation(position);
	}

	static parseGeneratedSourceStackFrame(stackLine: string): { method: string | null; line: number; column: number } | null {
		const chromeMethodFrame = stackLine.match(SourceService.CHROME_METHOD_STACK_LINE);
		if (chromeMethodFrame) {
			return SourceService.convertStackFrameGroups(chromeMethodFrame.groups);
		}

		const chromeFrame = stackLine.match(SourceService.CHROME_STACK_LINE);
		if (chromeFrame) {
			return SourceService.convertStackFrameGroups(chromeFrame.groups);
		}

		const firefoxMethodFrame = stackLine.match(SourceService.FIREFOX_METHOD_STACK_LINE);
		if (firefoxMethodFrame) {
			return SourceService.convertStackFrameGroups(firefoxMethodFrame.groups);
		}

		const firefoxFrame = stackLine.match(SourceService.FIREFOX_STACK_LINE);
		if (firefoxFrame) {
			return SourceService.convertStackFrameGroups(firefoxFrame.groups);
		}

		return null;
	}

	private static convertStackFrameGroups(groups: Record<string, string>): { method: string | null; line: number; column: number } | null {
		if (!groups.line || !groups.column) return null;

		return {
			method: groups.method ?? null,
			line: parseInt(groups.line, 10),
			column: parseInt(groups.column, 10),
		};
	}

	static formatMappedStackFrame(frame: { method: string | null }, location: SourceLocation): string {
		const mappedLocation = `${location.path}:${location.line}:${location.column}`;
		if (frame.method) return `    at ${frame.method} (${mappedLocation})`;

		return `    at ${mappedLocation}`;
	}

	static convertSourceLocation(raw: NullableMappedPosition): SourceLocation | null {
		if (raw.source === null || raw.line === null || raw.column === null) return null;

		const splitPath = raw.source.split("/");
		const cleanedPath = `/${splitPath.filter((p) => p !== "..").join("/")}`;

		return {
			rawPath: raw.source,
			path: cleanedPath,
			file: splitPath[splitPath.length - 1],
			line: raw.line,
			column: raw.column,
		};
	}
}

import { BasicSourceMapConsumer, NullableMappedPosition, RawSourceMap, SourceMapConsumer } from "source-map";

export interface SourceLocation {
	rawPath: string;
	path: string;
	file: string;
	line: number;
	column: number;
}

export class SourceService {
	private sourceMapConsumer: BasicSourceMapConsumer | null = null;

	constructor() {
		this.initializeSourceMap().then(() => {});
	}

	private async initializeSourceMap() {
		// Initialize the WASM module first
		// @ts-expect-error For some reason this isn't properly types.
		SourceMapConsumer.initialize({
			"lib/mappings.wasm": "https://unpkg.com/source-map@0.7.6/lib/mappings.wasm",
		});

		// @ts-expect-error SourceMaps aren't included in the automatic typing
		const name = browser.runtime.getURL("/content-scripts/extension.js.map");
		const content: RawSourceMap = await fetch(name).then((res) => res.json());

		this.sourceMapConsumer = await new SourceMapConsumer(content);
	}

	mappedStack(stack: string) {
		return stack
			.split("\n")
			.map((line) => {
				if (line.trimStart().startsWith("at")) {
					const matched = line.match(/at (.*) \(chrome-extension:\/\/.*\/content-scripts\/extension.js:(\d+):(\d+)\)/);
					if (matched) {
						const [, method, lineString, columnString] = matched;
						const line = parseInt(lineString);
						const column = parseInt(columnString);

						const location = this.fromSource(line, column);

						if (location) {
							return `    at ${method} (${location.path}:${location.line}:${location.column})`;
						}
					}
				}

				return line;
			})
			.join("\n");
	}

	fromSource(line: number, column: number): SourceLocation {
		const position = this.sourceMapConsumer.originalPositionFor({ line, column });

		return this.convertLocation(position)!;
	}

	private convertLocation(raw: NullableMappedPosition): SourceLocation | null {
		if (raw.source === null || raw.line === null || raw.column === null) return null;

		const splitPath = raw.source.split("/");
		const cleanedPath = "/" + splitPath.filter((p) => p !== "..").join("/");

		return {
			rawPath: raw.source,
			path: cleanedPath,
			file: splitPath[splitPath.length - 1],
			line: raw.line,
			column: raw.column,
		};
	}
}

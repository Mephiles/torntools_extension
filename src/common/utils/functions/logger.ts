export type LogLevel = "error" | "warn" | "info" | "debug";

const LEVEL_PRIORITY: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const DEFAULT_LEVEL: LogLevel = typeof __TT_DEV__ !== "undefined" && __TT_DEV__ ? "debug" : "warn";
const USERSCRIPT_NAME_PREFIX = "TORN: TornTools - ";

let currentLevel: LogLevel = DEFAULT_LEVEL;

export function isLogLevel(value: unknown): value is LogLevel {
	return value === "error" || value === "warn" || value === "info" || value === "debug";
}

export function setLogLevel(level: unknown): void {
	currentLevel = isLogLevel(level) ? level : DEFAULT_LEVEL;
}

export function getLogLevel(): LogLevel {
	return currentLevel;
}

function isEnabled(level: LogLevel): boolean {
	return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[currentLevel];
}

function getContextLabel(section: string | null): string {
	const parts = ["TornTools"];

	const scriptName = getUserscriptName();
	if (scriptName) parts.push(scriptName);
	if (section) parts.push(section);

	return `[${parts.join(" - ")}]`;
}

function getUserscriptName(): string | null {
	if (typeof __TT_SCRIPT_NAME__ !== "undefined") {
		return __TT_SCRIPT_NAME__.startsWith(USERSCRIPT_NAME_PREFIX) ? __TT_SCRIPT_NAME__.slice(USERSCRIPT_NAME_PREFIX.length) : __TT_SCRIPT_NAME__;
	}

	try {
		if (typeof GM === "undefined") return null;

		const name = GM.info?.script?.name;
		if (typeof name !== "string") return null;

		return name.startsWith(USERSCRIPT_NAME_PREFIX) ? name.slice(USERSCRIPT_NAME_PREFIX.length) : name;
	} catch {
		return null;
	}
}

function withPrefix(section: string | null, args: unknown[]): unknown[] {
	const [first, ...rest] = args;
	if (typeof first === "string") return [`${getContextLabel(section)} ${first}`, ...rest];

	return [getContextLabel(section), ...args];
}

interface LoggerOptions {
	section: string | null;
	force: boolean;
}

function write(level: LogLevel, method: "error" | "warn" | "log" | "debug", { force, section }: LoggerOptions, args: unknown[]): void {
	if (!force && !isEnabled(level)) return;

	console[method](...withPrefix(section, args));
}

function createLogger(options: LoggerOptions): Logger {
	return {
		error: (...args: unknown[]) => write("error", "error", options, args),
		warn: (...args: unknown[]) => write("warn", "warn", options, args),
		info: (...args: unknown[]) => write("info", "log", options, args),
		debug: (...args: unknown[]) => write("debug", "debug", options, args),
		withSection: (section: string) => createLogger({ ...options, section }),
		get force() {
			return createLogger({ ...options, force: true });
		},
	};
}

export interface Log {
	error(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	info(...args: unknown[]): void;
	debug(...args: unknown[]): void;
}

export interface Logger extends Log {
	/** Returns a logger that appends the given section to the prefix. */
	withSection(section: string): Logger;

	/**
	 * Returns a logger whose calls bypass the log level filter and are always emitted, e.g. `logger.force.info(...)`.
	 * Composes with sections: `logger.withSection("FeatureManager").force.info(...)`.
	 */
	readonly force: Logger;
}

export const logger: Logger = createLogger({ section: null, force: false });

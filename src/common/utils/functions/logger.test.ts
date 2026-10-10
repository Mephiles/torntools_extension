import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { getLogLevel, isLogLevel, logger, setLogLevel } from "./logger";

function captureConsole() {
	return {
		log: spyOn(console, "log").mockImplementation(() => {}),
		warn: spyOn(console, "warn").mockImplementation(() => {}),
		error: spyOn(console, "error").mockImplementation(() => {}),
		debug: spyOn(console, "debug").mockImplementation(() => {}),
	};
}

describe("logger", () => {
	afterEach(() => {
		setLogLevel("warn");
		mock.restore();
	});

	describe("isLogLevel", () => {
		it("should accept known levels", () => {
			expect(isLogLevel("error")).toBe(true);
			expect(isLogLevel("warn")).toBe(true);
			expect(isLogLevel("info")).toBe(true);
			expect(isLogLevel("debug")).toBe(true);
		});

		it("should reject unknown levels", () => {
			expect(isLogLevel("trace")).toBe(false);
			expect(isLogLevel(undefined)).toBe(false);
			expect(isLogLevel(5)).toBe(false);
		});
	});

	describe("setLogLevel", () => {
		it("should default to warn", () => {
			setLogLevel(undefined);
			expect(getLogLevel()).toBe("warn");
		});

		it("should ignore invalid levels", () => {
			setLogLevel("nonsense");
			expect(getLogLevel()).toBe("warn");
		});

		it("should accept valid levels", () => {
			setLogLevel("debug");
			expect(getLogLevel()).toBe("debug");
		});
	});

	describe("level filtering", () => {
		it("should only emit the selected severity and above", () => {
			const spies = captureConsole();
			setLogLevel("warn");

			logger.debug("d");
			logger.info("i");
			logger.warn("w");
			logger.error("e");

			expect(spies.debug).not.toHaveBeenCalled();
			expect(spies.log).not.toHaveBeenCalled();
			expect(spies.warn).toHaveBeenCalledTimes(1);
			expect(spies.error).toHaveBeenCalledTimes(1);
		});

		it("should emit everything at debug level", () => {
			const spies = captureConsole();
			setLogLevel("debug");

			logger.debug("d");
			logger.info("i");
			logger.warn("w");
			logger.error("e");

			expect(spies.debug).toHaveBeenCalledTimes(1);
			expect(spies.log).toHaveBeenCalledTimes(1);
			expect(spies.warn).toHaveBeenCalledTimes(1);
			expect(spies.error).toHaveBeenCalledTimes(1);
		});

		it("should only emit errors at error level", () => {
			const spies = captureConsole();
			setLogLevel("error");

			logger.debug("d");
			logger.info("i");
			logger.warn("w");
			logger.error("e");

			expect(spies.debug).not.toHaveBeenCalled();
			expect(spies.log).not.toHaveBeenCalled();
			expect(spies.warn).not.toHaveBeenCalled();
			expect(spies.error).toHaveBeenCalledTimes(1);
		});
	});

	describe("formatting", () => {
		it("should prefix the first string argument", () => {
			const spies = captureConsole();
			setLogLevel("debug");

			logger.error("boom", new Error("x"));

			expect(spies.error).toHaveBeenCalledWith("[TornTools] boom", expect.any(Error));
		});

		it("should add the prefix as its own argument for non-string first arguments", () => {
			const spies = captureConsole();
			setLogLevel("debug");

			const error = new Error("x");
			logger.error(error);

			expect(spies.error).toHaveBeenCalledWith("[TornTools]", error);
		});

		it("should work as a direct callback", async () => {
			const spies = captureConsole();
			setLogLevel("debug");

			const error = new Error("x");
			await Promise.reject(error).catch(logger.error);

			expect(spies.error).toHaveBeenCalledWith("[TornTools]", error);
		});
	});

	describe("sections", () => {
		it("should append the section to the prefix", () => {
			const spies = captureConsole();
			setLogLevel("debug");

			logger.withSection("FeatureManager").info("Registered new feature.");

			expect(spies.log).toHaveBeenCalledWith("[TornTools - FeatureManager] Registered new feature.");
		});

		it("should not affect the base logger", () => {
			const spies = captureConsole();
			setLogLevel("debug");

			logger.withSection("FeatureManager").info("x");
			logger.info("y");

			expect(spies.log).toHaveBeenCalledWith("[TornTools] y");
		});

		it("should combine with the userscript name", () => {
			const spies = captureConsole();
			setLogLevel("debug");
			(globalThis as any).GM = { info: { script: { name: "TORN: TornTools - City Items" } } };

			try {
				logger.withSection("FeatureManager").warn("something");

				expect(spies.warn).toHaveBeenCalledWith("[TornTools - City Items - FeatureManager] something");
			} finally {
				delete (globalThis as any).GM;
			}
		});
	});

	describe("force", () => {
		it("should emit regardless of the log level", () => {
			const spies = captureConsole();
			setLogLevel("error");

			logger.force.info("forced");
			logger.force.debug("also forced");

			expect(spies.log).toHaveBeenCalledWith("[TornTools] forced");
			expect(spies.debug).toHaveBeenCalledWith("[TornTools] also forced");
		});

		it("should still respect the arguments and prefix", () => {
			const spies = captureConsole();
			setLogLevel("error");

			logger.force.warn("boom", new Error("x"));

			expect(spies.warn).toHaveBeenCalledWith("[TornTools] boom", expect.any(Error));
		});

		it("should compose with sections", () => {
			const spies = captureConsole();
			setLogLevel("error");

			logger.withSection("FeatureManager").force.info("forced");
			logger.force.withSection("FeatureManager").info("forced the other way");

			expect(spies.log).toHaveBeenCalledWith("[TornTools - FeatureManager] forced");
			expect(spies.log).toHaveBeenCalledWith("[TornTools - FeatureManager] forced the other way");
		});
	});
});

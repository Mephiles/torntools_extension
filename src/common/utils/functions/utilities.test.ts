import { afterEach, describe, expect, it } from "bun:test";
import {
	arraysEquals,
	calculateDatePeriod,
	getTypedKeyOf,
	groupBy,
	isIntNumber,
	isSameUTCDay,
	objectsEquals,
	readableErrorMessage,
	speakText,
	toCorrectType,
	toNumericVersion,
	toRecord,
} from "./utilities";

describe("utilities", () => {
	describe("arraysEquals", () => {
		it("should return true for equal arrays", () => {
			expect(arraysEquals([1, 2, 3], [1, 2, 3])).toBe(true);
			expect(arraysEquals([], [])).toBe(true);
		});

		it("should return false for different arrays", () => {
			expect(arraysEquals([1, 2], [1, 3])).toBe(false);
			expect(arraysEquals([1], [1, 2])).toBe(false);
			expect(arraysEquals(["a"], [1])).toBe(false);
		});

		it("should compare nested arrays", () => {
			expect(arraysEquals([[1], [2]], [[1], [2]])).toBe(true);
			expect(arraysEquals([[1], [2]], [[1], [3]])).toBe(false);
		});

		it("should compare objects inside arrays", () => {
			expect(arraysEquals([{ a: 1 }], [{ a: 1 }])).toBe(true);
			expect(arraysEquals([{ a: 1 }], [{ a: 2 }])).toBe(false);
		});
	});

	describe("objectsEquals", () => {
		it("should return true for equal objects", () => {
			expect(objectsEquals({ a: 1, b: "x" }, { a: 1, b: "x" })).toBe(true);
			expect(objectsEquals({}, {})).toBe(true);
		});

		it("should return false for different values", () => {
			expect(objectsEquals({ a: 1 }, { a: 2 })).toBe(false);
		});

		it("should return false for different key sets", () => {
			expect(objectsEquals({ a: 1 }, { b: 1 })).toBe(false);
			expect(objectsEquals({ a: 1 }, { a: 1, b: 2 })).toBe(false);
		});

		it("should return false for mismatched types", () => {
			expect(objectsEquals({ a: 1 }, { a: "1" })).toBe(false);
		});

		it("should compare nested objects and arrays", () => {
			expect(objectsEquals({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
			expect(objectsEquals({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
			expect(objectsEquals({ a: [1, 2] }, { a: [1, 2] })).toBe(true);
			expect(objectsEquals({ a: [1, 2] }, { a: [1, 3] })).toBe(false);
		});
	});

	describe("isIntNumber", () => {
		it("should return true for integer strings", () => {
			expect(isIntNumber("123")).toBe(true);
			expect(isIntNumber("-42")).toBe(true);
			expect(isIntNumber("0")).toBe(true);
		});

		it("should return false for non-integers", () => {
			expect(isIntNumber("12.5")).toBe(false);
			expect(isIntNumber("abc")).toBe(false);
			expect(isIntNumber("12a")).toBe(false);
			expect(isIntNumber("")).toBe(false);
			expect(isIntNumber(null)).toBe(false);
		});
	});

	describe("isSameUTCDay", () => {
		it("should return true for the same UTC day", () => {
			expect(isSameUTCDay("2026-08-31T00:00:00Z", "2026-08-31T23:59:59Z")).toBe(true);
			expect(isSameUTCDay(new Date("2026-12-31T12:00:00Z"), new Date("2026-12-31T12:00:00Z"))).toBe(true);
		});

		it("should return false for different UTC days", () => {
			expect(isSameUTCDay("2026-08-31T23:59:59Z", "2026-09-01T00:00:00Z")).toBe(false);
			expect(isSameUTCDay("2026-12-31T23:00:00Z", "2027-01-01T01:00:00Z")).toBe(false);
		});
	});

	describe("toCorrectType", () => {
		it("should convert numeric strings, booleans and keep other values", () => {
			expect(toCorrectType({ a: "123", b: "true", c: "false", d: "hello", e: 5 })).toEqual({
				a: 123,
				b: true,
				c: false,
				d: "hello",
				e: 5,
			});
		});

		it("should not mutate the input object", () => {
			const input = { a: "123" };
			toCorrectType(input);
			expect(input).toEqual({ a: "123" });
		});
	});

	describe("toNumericVersion", () => {
		it("should convert versions to comparable numbers", () => {
			expect(toNumericVersion("9.2.1")).toBe(9002001);
			expect(toNumericVersion("1.0.0")).toBe(1000000);
			expect(toNumericVersion("0.0.1")).toBe(1);
			expect(toNumericVersion("12.3.4")).toBe(12003004);
		});

		it("should pad partial versions", () => {
			expect(toNumericVersion("9.2")).toBe(9002999);
		});
	});

	describe("calculateDatePeriod", () => {
		it("should return zeroes for the same date", () => {
			expect(calculateDatePeriod(new Date(2026, 0, 1), new Date(2026, 0, 1))).toEqual({ years: 0, months: 0, days: 0 });
		});

		it("should calculate full years", () => {
			expect(calculateDatePeriod(new Date(2026, 0, 1), new Date(2027, 0, 1))).toEqual({ years: 1, months: 0, days: 0 });
		});

		it("should calculate months", () => {
			expect(calculateDatePeriod(new Date(2026, 0, 15), new Date(2026, 2, 15))).toEqual({ years: 0, months: 2, days: 0 });
		});

		it("should calculate days within a month", () => {
			expect(calculateDatePeriod(new Date(2026, 0, 1), new Date(2026, 0, 31))).toEqual({ years: 0, months: 0, days: 30 });
		});

		it("should combine years and months", () => {
			expect(calculateDatePeriod(new Date(2025, 0, 1), new Date(2026, 6, 1))).toEqual({ years: 1, months: 6, days: 0 });
		});

		it("should swap dates that are in the wrong order", () => {
			expect(calculateDatePeriod(new Date(2026, 5, 1), new Date(2025, 5, 1))).toEqual({ years: 1, months: 0, days: 0 });
		});
	});

	describe("toRecord", () => {
		it("should build a record from an array", () => {
			expect(
				toRecord(
					[
						{ id: 1, name: "a" },
						{ id: 2, name: "b" },
					],
					(item) => [String(item.id), item.name],
				),
			).toEqual({ 1: "a", 2: "b" });
		});
	});

	describe("groupBy", () => {
		it("should group array items by the returned key", () => {
			expect(groupBy([1, 2, 3, 4], (n) => [String(n % 2), n * 10])).toEqual({ 1: [10, 30], 0: [20, 40] });
		});
	});

	describe("getTypedKeyOf", () => {
		it("should return the value for the given key", () => {
			expect(getTypedKeyOf<{ name: string; age: number }, string>({ name: "x", age: 5 }, "name")).toBe("x");
			expect(getTypedKeyOf<{ name: string; age: number }, number>({ name: "x", age: 5 }, "age")).toBe(5);
		});
	});

	describe("readableErrorMessage", () => {
		it("should format Error instances", () => {
			expect(readableErrorMessage(new Error("boom"))).toBe("Error: boom");
		});

		it("should pass through strings", () => {
			expect(readableErrorMessage("plain")).toBe("plain");
		});

		it("should extract message and error properties", () => {
			expect(readableErrorMessage({ message: "m" })).toBe("m");
			expect(readableErrorMessage({ error: "e" })).toBe("e");
		});

		it("should stringify unknown values", () => {
			expect(readableErrorMessage(42)).toBe("Unknown error, this should be reported: 42");
			expect(readableErrorMessage([1, 2])).toBe("Unknown error, this should be reported: [1,2]");
			expect(readableErrorMessage({})).toBe("Unknown error, this should be reported: {}");
		});

		it("should report falsy errors", () => {
			expect(readableErrorMessage(null)).toBe("Unknown error, this should be reported: null");
		});
	});

	describe("speakText", () => {
		class FakeSynthesis {
			voices: any[] = [];
			spoken: any[] = [];
			private listeners = new Set<() => void>();

			getVoices() {
				return this.voices;
			}

			speak(utterance: any) {
				this.spoken.push(utterance);
			}

			addEventListener(_event: string, listener: () => void) {
				this.listeners.add(listener);
			}

			removeEventListener(_event: string, listener: () => void) {
				this.listeners.delete(listener);
			}

			loadVoices(voices: any[]) {
				this.voices = voices;
				this.listeners.forEach((listener) => listener());
			}
		}

		let synthesis: FakeSynthesis;

		function setup() {
			synthesis = new FakeSynthesis();
			(globalThis as any).SpeechSynthesisUtterance = class {
				voice = null;
				volume = 1;
				rate = 1;
				constructor(public text: string) {}
			};
			(globalThis as any).window = { speechSynthesis: synthesis };
			return synthesis;
		}

		afterEach(() => {
			delete (globalThis as any).SpeechSynthesisUtterance;
			delete (globalThis as any).window;
		});

		it("should speak with the matching voice when voices are already loaded", async () => {
			const synthesis = setup();
			synthesis.voices = [{ name: "Alex", lang: "en-US" }];

			await speakText("hello", { volume: 0.5, voice: "Alex (en-US)", rate: 2 });

			expect(synthesis.spoken).toHaveLength(1);
			expect(synthesis.spoken[0].text).toBe("hello");
			expect(synthesis.spoken[0].volume).toBe(0.5);
			expect(synthesis.spoken[0].rate).toBe(2);
			expect(synthesis.spoken[0].voice).toBe(synthesis.voices[0]);
		});

		it("should wait for voiceschanged when the voice list is not loaded yet", async () => {
			const synthesis = setup();
			const speaking = speakText("hello", { volume: 1, voice: "Alex (en-US)", rate: 1 });

			expect(synthesis.spoken).toHaveLength(0);
			synthesis.loadVoices([{ name: "Alex", lang: "en-US" }]);
			await speaking;

			expect(synthesis.spoken[0].voice).toBe(synthesis.voices[0]);
		});

		it("should fall back to the default voice when the configured voice is missing", async () => {
			const synthesis = setup();
			const speaking = speakText("hello", { volume: 1, voice: "Missing (en-GB)", rate: 1 });

			synthesis.loadVoices([{ name: "Alex", lang: "en-US" }]);
			await speaking;

			expect(synthesis.spoken[0].voice).toBeNull();
		});

		it("should not speak when speech synthesis is unavailable", async () => {
			const synthesis = setup();
			delete (globalThis as any).SpeechSynthesisUtterance;

			await speakText("hello", { volume: 1, voice: "default", rate: 1 });

			expect(synthesis.spoken).toHaveLength(0);
		});
	});
});

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { noop } from "@common/utils/functions/utilities";
import { requireCondition } from "./requires";

const FIREFOX_UA = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0";
const CHROME_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
let dispatched: { type: string; reason: unknown; promise: Promise<unknown> }[] = [];

function useUserAgent(userAgent: string) {
	Object.defineProperty(globalThis, "navigator", { value: { userAgent }, configurable: true });
}

function useFirefox() {
	useUserAgent(FIREFOX_UA);
}

/** Fails after ~3ms instead of waiting for the real defaults. */
function requireNothing() {
	return requireCondition(() => false, { delay: 1, maxCycles: 1 });
}

async function waitForReport() {
	await new Promise((resolve) => setTimeout(resolve, 25));
}

describe("require", () => {
	beforeEach(() => {
		dispatched = [];
		(globalThis as any).window = { setTimeout, dispatchEvent: (event: any) => dispatched.push(event) };
		(globalThis as any).PromiseRejectionEvent = class {
			constructor(
				public type: string,
				public init: { reason: unknown; promise: Promise<unknown> },
			) {
				Object.assign(this, init);
			}
		};
	});

	afterEach(() => {
		if (navigatorDescriptor) Object.defineProperty(globalThis, "navigator", navigatorDescriptor);

		delete (globalThis as any).window;
		delete (globalThis as any).PromiseRejectionEvent;
	});

	describe("unhandled rejections", () => {
		it("should report a rejection nobody handles, since Firefox doesn't fire unhandledrejection for content scripts", async () => {
			useFirefox();

			const promise = requireNothing();

			await waitForReport();

			expect(dispatched).toHaveLength(1);
			expect(dispatched[0].type).toBe("unhandledrejection");
			expect(dispatched[0].promise).toBe(promise);
			expect((dispatched[0].reason as Error).message).toBe("Maximum cycles reached.");
			expect((dispatched[0].reason as Error).stack).toContain("requires.test.ts");
		});

		it("should not report a rejection that is caught", async () => {
			useFirefox();

			requireNothing().catch(noop);

			await waitForReport();

			expect(dispatched).toHaveLength(0);
		});

		it("should not report a rejection that is awaited", async () => {
			useFirefox();

			void (async () => {
				try {
					await requireNothing();
				} catch {
					// Expected.
				}
			})();

			await waitForReport();

			expect(dispatched).toHaveLength(0);
		});

		it("should leave the reporting to the browser outside of Firefox", () => {
			useUserAgent(CHROME_UA);

			const promise = requireNothing();
			promise.catch(noop);

			expect(promise.constructor).toBe(Promise);
		});
	});
});

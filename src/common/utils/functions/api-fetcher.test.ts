import { describe, expect, it, mock } from "bun:test";

mock.module("../data/database", () => ({
	settings: { apiUsage: { comment: "" }, formatting: {} },
	api: { torn: { key: "" }, tornstats: { key: "" }, yata: { key: "" }, ffScouter: { key: "" } },
	torndata: {},
	userdata: {},
}));

import type { FetchOptions } from "./api-fetcher";
import { buildFetchRequest, HTTPException } from "./api-fetcher";

const BASE_OPTIONS: FetchOptions = {
	section: "",
	id: undefined,
	selections: [],
	legacySelections: [],
	key: undefined,
	action: undefined,
	method: "GET",
	body: undefined,
	silent: false,
	includeKey: false,
	relay: false,
	params: {},
};

describe("api-fetcher", () => {
	describe("HTTPException", () => {
		it("should resolve known HTTP codes", () => {
			expect(new HTTPException(404).message).toBe("Not Found");
			expect(new HTTPException(429).message).toBe("Too Many Requests");
			expect(new HTTPException(200).message).toBe("OK");
		});

		it("should describe unknown codes", () => {
			expect(new HTTPException(999).message).toBe("Unknown code (999)");
		});

		it("should stringify with the code", () => {
			expect(new HTTPException(404).toString()).toBe("HTTP 404: Not Found");
		});

		it("should expose the error as an object", () => {
			expect(new HTTPException(403).asObject()).toEqual({ code: 403, message: "Forbidden", http: true });
		});
	});

	describe("buildFetchRequest", () => {
		it("should build a tornv2 request with selections and auth header", () => {
			const request = buildFetchRequest("tornv2", {
				...BASE_OPTIONS,
				section: "user",
				selections: ["profile", "bars"],
				legacySelections: ["profile"],
				key: "abc",
			});

			expect(request).toEqual({
				url: "https://api.torn.com/v2/user/?selections=profile%2Cbars%2Cprofile&legacy=profile",
				method: "GET",
				headers: { Authorization: "ApiKey abc" },
			});
		});

		it("should build a POST request with a JSON body", () => {
			const request = buildFetchRequest("tornv2", {
				...BASE_OPTIONS,
				section: "user",
				selections: ["user", "profile"],
				key: "abc",
				method: "POST",
				body: { a: 1 },
			});

			if (request.method !== "POST") throw new Error("expected POST request");

			expect(request.body).toBe('{"a":1}');
			expect(request.headers["content-type"]).toBe("application/json");
			expect(request.url).toBe("https://api.torn.com/v2/user/?selections=user%2Cprofile&legacy=");
		});

		it("should append custom params", () => {
			const request = buildFetchRequest("tornv2", {
				...BASE_OPTIONS,
				section: "user",
				params: { limit: "100" },
			});

			expect(request.url).toBe("https://api.torn.com/v2/user/?selections=&legacy=&limit=100");
		});

		it("should build a yata request with a trailing slash", () => {
			const request = buildFetchRequest("yata", {
				...BASE_OPTIONS,
				section: "item",
				id: 1,
			});

			expect(request.url).toBe("https://yata.yt/api/v1/item/1/");
			expect(request.headers).toEqual({});
		});

		it("should build a tornstats request with the api key", () => {
			const request = buildFetchRequest("tornstats", {
				...BASE_OPTIONS,
				section: "user",
				id: 5,
				key: "k",
			});

			expect(request.url).toBe("https://www.tornstats.com/api/v2/k/user/5");
		});

		it("should build an ffscouter request with the key param", () => {
			const request = buildFetchRequest("ffscouter", {
				...BASE_OPTIONS,
				section: "player",
				key: "fkey",
				includeKey: true,
			});

			expect(request.url).toBe("https://ffscouter.com/api/v1/player?key=fkey");
		});
	});
});

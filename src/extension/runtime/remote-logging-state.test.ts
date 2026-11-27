import { beforeEach, describe, expect, it, mock } from "bun:test";

const permissions = {
	contains: mock(async (_permissions: unknown): Promise<boolean> => true),
	getAll: mock(async (): Promise<Record<string, unknown>> => ({ permissions: [], origins: [] })),
	request: mock(async (_permissions: unknown): Promise<boolean> => true),
};

mock.module("wxt/browser", () => ({ browser: { permissions } }));

import { REMOTE_LOGGING_ORIGIN } from "@common/utils/functions/remote-logging";
import { hasRemoteLoggingPermissions, requestRemoteLoggingPermissions } from "./remote-logging-state";

beforeEach(() => {
	permissions.contains.mockClear();
	permissions.contains.mockResolvedValue(true);
	permissions.getAll.mockClear();
	permissions.getAll.mockResolvedValue({ permissions: [], origins: [] });
	permissions.request.mockClear();
	permissions.request.mockResolvedValue(true);
});

describe("hasRemoteLoggingPermissions", () => {
	it("is false without the logging origin", async () => {
		permissions.contains.mockResolvedValue(false);

		expect(await hasRemoteLoggingPermissions()).toBe(false);
		expect(permissions.getAll).not.toHaveBeenCalled();
	});

	it("ignores data collection where the browser does not report it", async () => {
		expect(await hasRemoteLoggingPermissions()).toBe(true);
	});

	it("is false while technicalAndInteraction is not granted", async () => {
		permissions.getAll.mockResolvedValue({ permissions: [], origins: [], data_collection: [] });

		expect(await hasRemoteLoggingPermissions()).toBe(false);
	});

	it("is true once technicalAndInteraction is granted", async () => {
		permissions.getAll.mockResolvedValue({ permissions: [], origins: [], data_collection: ["technicalAndInteraction"] });

		expect(await hasRemoteLoggingPermissions()).toBe(true);
	});
});

describe("requestRemoteLoggingPermissions", () => {
	it("does not ask for data collection where the browser has none", async () => {
		expect(await requestRemoteLoggingPermissions()).toBe(true);
		expect(permissions.request).toHaveBeenCalledWith({ origins: [REMOTE_LOGGING_ORIGIN] });
	});

	it("asks for technicalAndInteraction where the browser reports data collection", async () => {
		permissions.getAll.mockResolvedValueOnce({ permissions: [], origins: [], data_collection: [] });
		permissions.getAll.mockResolvedValue({ permissions: [], origins: [], data_collection: ["technicalAndInteraction"] });

		expect(await requestRemoteLoggingPermissions()).toBe(true);
		expect(permissions.request).toHaveBeenCalledWith({
			origins: [REMOTE_LOGGING_ORIGIN],
			data_collection: ["technicalAndInteraction"],
		});
	});
});

import { OFFLOAD_SERVICE, ttStorage } from "@common/utils/context";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { UserBasicResponse } from "tornapi-typescript";

export async function checkAPIPermission(key: string) {
	try {
		const response = await fetchData("tornv2", { section: "key", selections: ["info"], key, silent: true });
		const { type, faction, company } = response.info.access;

		if (type === "Limited Access" || type === "Full Access") {
			return { access: true, faction, company };
		} else {
			return { access: false };
		}
	} catch (error) {
		throw error.error;
	}
}

export async function changeAPIKey(key: string): Promise<void> {
	try {
		const data = await fetchData<UserBasicResponse>("tornv2", { section: "user", selections: ["basic"], key, silent: true });
		await ttStorage.change({ api: { torn: { key, owner: data.profile.id } } });

		await OFFLOAD_SERVICE.initialize();
	} catch (error) {
		throw error.error;
	}
}

import { settings } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { FetchOptions } from "@common/utils/functions/api-fetcher";

export async function fetchTornW3B<R = any>(options: Omit<Partial<FetchOptions>, "key" | "includeKey" | "apiKey"> = {}): Promise<R> {
	const allowed = settings.external.tornw3b && settings.external.tornw3bSendKey;

	try {
		return await fetchData<R>("tornw3b", { ...options, includeKey: allowed });
	} catch (error) {
		throw mapTornW3BError(error, allowed);
	}
}

function mapTornW3BError(error: unknown, keySent: boolean): unknown {
	// shortcut: matches TornW3B's 401 body text, revisit if they reword it.
	if (!keySent || !error || typeof error !== "object" || !("error" in error) || error.error !== "Invalid API key") {
		return error;
	}

	return {
		error: "TornW3B rejected your API key. Log in at weav3r.dev with the used key or turn off key sending in Connections.",
	};
}

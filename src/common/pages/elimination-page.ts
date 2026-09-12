import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events.ts";
import { addFetchListener } from "@common/utils/functions/listeners.ts";

export function setupEliminationPage() {
	addFetchListener(async ({ detail: { page, json, fetch } }) => {
		if (page !== "page" || !json) return;

		const params = new URL(fetch.url).searchParams;
		const sid = params.get("sid");
		if (sid !== "competitionData") return;

		const step = params.get("step");

		if (isEliminationViewTeam(step, json)) {
			console.log("DKK  ELIMINATION__TEAM_DATA");
			triggerCustomListener(EVENT_CHANNELS.ELIMINATION__TEAM_DATA, { page: parseInt(params.get("p")!) });
		} else if (step === "headerTimers") {
			triggerCustomListener(EVENT_CHANNELS.ELIMINATION__MAIN);
		} else {
			console.log("DKK  unknown", sid, step);
		}
	});
	window.addEventListener("hashchange", () => {
		if (location.hash.includes("team/")) triggerCustomListener(EVENT_CHANNELS.ELIMINATION__TEAM);
	});

	if (location.hash === "#/") triggerCustomListener(EVENT_CHANNELS.ELIMINATION__MAIN);
	else if (location.hash.includes("team/")) triggerCustomListener(EVENT_CHANNELS.ELIMINATION__TEAM);
}

interface TornInternalEliminationViewTeam {
	members: {
		userID: number;
		playername: string;
		honorID: number;
		honorStyle: string;
		level: number;
		status: unknown[];
		icons: string;
		factionID: number;
		factionName: string;
		factionTag: string;
		factionImageUrl: string;
		factionRank: string;
		onlineStatus: string;
		isCaptain: 0 | 1;
		isViceCaptain: 0 | 1;
		is_captain: 0 | 1;
		is_vice_captain: 0 | 1;
		attacks: number;
		attack_link: string;
	}[];
	totalMembers: number;
	showAvailable: boolean;
	teamID: number;
	teamKey: string;
	teamName: string;
	textnames: 0;
	currentPage: number;
	totalPages: number;
	hasNextPage: boolean;
	pageSize: number;
}

function isEliminationViewTeam(step: string | null, _json: any): _json is TornInternalEliminationViewTeam {
	return step === "viewTeam";
}

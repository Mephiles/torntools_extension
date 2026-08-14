import { settings, storageListeners } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { checkDevice, findElementWithText } from "@common/utils/functions/dom";
import { requireSidebar } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { mount, unmount } from "svelte";
import { REMINDERS } from "./reminder-list";
import RemindersBox from "./reminders-box.svelte";

export interface ResolvedReminder {
	name: string;
	group?: string;
	url?: string;
	finished: boolean;
}

function resolveReminders(): ResolvedReminder[] {
	return REMINDERS.map<ResolvedReminder | null>((reminder) => {
		if (!reminder.enabled()) return null;

		const finished = reminder.finished();
		if (!settings.scripts.reminders.finished && finished) return null;

		return {
			name: reminder.name,
			group: reminder.group,
			url: reminder.url,
			finished,
		};
	})
		.filter((r) => r !== null)
		.sort((a, b) => {
			const groupA = (a.group ?? a.name).toUpperCase();
			const groupB = (b.group ?? b.name).toUpperCase();

			if (groupA !== groupB) return groupA.localeCompare(groupB);
			return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
		});
}

let reminders = $state<ResolvedReminder[]>([]);
let remindersBox: unknown;

async function startFeature() {
	updateReminders();

	if (remindersBox) return;

	await requireSidebar();

	const previousElement =
		findElementWithText("h2", "Areas")!.closest("[class*='sidebar-block_']") ?? document.querySelector("#sidebar [class*='userInformation___']")!;

	remindersBox = mount(RemindersBox, {
		target: previousElement.parentElement!,
		anchor: previousElement.nextSibling,
		props: {
			get reminders() {
				return reminders;
			},
		},
	});
}

function updateReminders() {
	reminders = resolveReminders();
}

function initialiseListeners() {
	storageListeners.settings.push(updateReminders);
	storageListeners.userdata.push(updateReminders);
}

function dispose() {
	if (remindersBox) {
		void unmount(remindersBox);
		remindersBox = undefined;
	}
}

export default class RemindersFeature extends Feature {
	constructor() {
		super("Reminders", "sidebar");
	}

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		if (!(await checkDevice()).hasSidebar) return "Not supported without sidebar!";

		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.scripts.reminders.show;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await startFeature();
	}

	cleanup() {
		dispose();
	}

	storageKeys() {
		return ["settings.scripts.reminders.show", "settings.scripts.reminders.finished"];
	}
}

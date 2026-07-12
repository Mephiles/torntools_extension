import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { createContainer, findContainer, removeContainer } from "@common/utils/functions/containers";
import { checkDevice, elementBuilder, findAllElements, findElementWithText } from "@common/utils/functions/dom";
import { requireSidebar } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { REMINDERS } from "@features/reminders/reminder-list";
import styles from "./reminders.module.css";

async function showReminders() {
	const existingContainer = findContainer("Reminders", { selector: ".content" });
	if (existingContainer) {
		updateReminders(existingContainer);
		return;
	}

	await requireSidebar();

	const reminders = resolveReminders();
	if (!reminders.length) {
		removeReminders();
		return;
	}

	const { content } = createContainer("Reminders", {
		class: styles.reminderContainer,
		applyRounding: false,
		contentBackground: false,
		compact: true,
		previousElement:
			findElementWithText("h2", "Areas")!.closest("[class*='sidebar-block_']") ?? document.querySelector("#sidebar [class*='userInformation___']")!,
	});

	reminders.map((r) => createReminderElement(r)).forEach((r) => content.appendChild(r));
}

interface ResolvedReminder {
	name: string;
	group?: string;
	url?: string;
	finished: boolean;
	order: number;
}

function resolveReminders() {
	return REMINDERS.map<Omit<ResolvedReminder, "order"> | null>((reminder) => {
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
		})
		.map<ResolvedReminder>((reminder, i) => ({ ...reminder, order: i + 1 }));
}

function updateReminders(existingContainer: HTMLElement) {
	const reminders = resolveReminders();
	if (!reminders.length) {
		removeReminders();
		return;
	}

	const reminderNames = reminders.map(({ name }) => name);
	const existingReminders = findAllElements(`.${styles.reminder}`).map((element) => ({ name: element.dataset.reminderName!, element }));
	const existingReminderNames = existingReminders.map(({ name }) => name);

	existingReminders
		.filter(({ name }) => !reminderNames.includes(name)) //
		.forEach(({ element }) => element.remove());
	existingReminders
		.filter(({ name }) => reminderNames.includes(name)) //
		.map(({ name, element }) => ({ element, reminder: reminders.find((r) => r.name === name) }))
		.forEach(({ element, reminder }) => element.replaceWith(createReminderElement(reminder)));
	reminders
		.filter(({ name }) => !existingReminderNames.includes(name)) //
		.forEach((reminder) => existingContainer.appendChild(createReminderElement(reminder)));
}

function createReminderElement(reminder: ResolvedReminder) {
	let text: string;
	if (reminder.finished) text = "Finished!";
	else text = "";

	return elementBuilder({
		type: reminder.url ? "a" : "div",
		class: [styles.reminder, reminder.finished ? styles.finished : null],
		text: text ? `${reminder.name}: ${text}` : reminder.name,
		href: reminder.url,
		attributes: { tabindex: "-1" },
		style: { order: reminder.order.toString() },
		dataset: { reminderName: reminder.name },
	});
}

function removeReminders() {
	removeContainer("Reminders");
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

	async execute() {
		await showReminders();
	}

	cleanup() {
		removeReminders();
	}

	storageKeys() {
		return ["settings.scripts.reminders.show", "settings.scripts.reminders.finished"];
	}
}

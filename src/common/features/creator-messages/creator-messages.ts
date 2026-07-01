import { elementBuilder, getHashParameters } from "@common/utils/functions/dom";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { TEAM } from "@common/utils/team";
import { Feature } from "@features/feature";
import styles from "./creator-messages.module.css";

async function startCreatorMessage() {
	const params = getHashParameters();
	if (params?.has("XID")) {
		const id = parseInt(params.get("XID"));

		await showCreatorMessageWarning(id);
	}

	requireElement(".user-id").then((wrapper) => {
		new MutationObserver(() => {
			const userInput = document.querySelector<HTMLInputElement>(".user-id");
			const inputValue = userInput.value.match(/.*\[(\d+)]/);
			if (!inputValue) return;

			showCreatorMessageWarning(parseInt(inputValue[1]));
		}).observe(wrapper, { attributes: true, attributeFilter: ["class"] });
	});
}

async function showCreatorMessageWarning(id: number) {
	const warning = document.querySelector(`.${styles.messageWarning}`);

	const creator = TEAM.find(({ torn }) => torn === id);
	if (!creator?.core) {
		warning?.remove();
		return;
	} else if (warning) return;

	const mailbox = await requireElement("#mailbox-wrapper");

	mailbox.insertAdjacentElement(
		"beforebegin",
		elementBuilder({
			type: "div",
			class: styles.messageWarning,
			children: [
				elementBuilder({ type: "span", text: "You are messaging a TornTools team member. Use our publicly available channels instead." }),
				elementBuilder("br"),
				elementBuilder({
					type: "span",
					children: [
						"Both our ",
						elementBuilder({ type: "a", text: "Discord server", href: "https://discord.gg/ukyK6f6", attributes: { target: "_blank" } }),
						" and ",
						elementBuilder({
							type: "a",
							text: "forum thread",
							href: "https://www.torn.com/forums.php#/p=threads&f=67&t=16243863",
							attributes: { target: "_blank" },
						}),
						" can be used for this.",
					],
				}),
			],
		}),
	);
}

export default class CreatorMessagesFeature extends Feature {
	constructor() {
		super("Creator Messages", "messages");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return true;
	}

	async execute() {
		await startCreatorMessage();
	}
}

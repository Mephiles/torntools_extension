import { elementBuilder } from "@utils/functions/dom";
import styles from "./profile-page.module.css";

function buildProfileTitleBar() {
	let element = document.querySelector(`.${styles.titleBar}`);
	if (!element) {
		element = elementBuilder({
			type: "div",
			class: styles.titleBar,
		});

		const title = document.querySelector(".content-title");
		title.insertAdjacentElement("afterend", element);

		element.insertAdjacentElement("afterend", elementBuilder({ type: "hr" }));
	}

	return element;
}

export function appendToBuildProfileTitleBar(element: Element) {
	buildProfileTitleBar().appendChild(element);
}

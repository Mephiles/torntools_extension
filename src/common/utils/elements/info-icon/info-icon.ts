import { elementBuilder } from "@common/utils/functions/dom";
import { getUUID } from "@common/utils/functions/utilities.ts";
import { PHBoldInfo } from "@common/utils/icons/phosphor-icons";

interface InfoIconOptions {
	description: string;
	class?: string;
}

export interface InfoIconObject {
	element: HTMLElement;
	id: string;
}

export function createInfoIcon(options: InfoIconOptions): InfoIconObject {
	const id = getUUID();

	const element = elementBuilder({
		id,
		type: "i",
		class: options.class,
		children: [PHBoldInfo()],
		attributes: { title: options.description },
		style: { height: "12px" },
	});

	return {
		element,
		id,
	};
}

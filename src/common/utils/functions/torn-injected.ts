import { getSidebarData } from "@common/utils/functions/torn";

export interface InformationRetriever {
	getStatusIcons(): Promise<StatusIcons>;
}

type StatusIcon = {
	title: string;
	subtitle?: string;
} & ({ timerExpiresAt: number; serverTimestamp: number; factionUpgrade: string | undefined } | object);
export type StatusIcons = Map<string, StatusIcon>;

interface InternalStatusIconsProps {
	icon: { iconID: string; title: string; subtitle?: string; link?: string } & (
		| { isShortFormatTimer: boolean; serverTimestamp: number; timerExpiresAt: number; factionUpgrade?: string }
		| object
	);
	iconKey: string;
}

export function getStatusIcons(): StatusIcons {
	const flyoutIcons = document.querySelector("[class*='statusIcons___']");
	if (flyoutIcons) {
		const reactProperties = getReactProperties(flyoutIcons);
		if (reactProperties) {
			return reactProperties.children.reduce<StatusIcons>((map, child) => {
				const props: InternalStatusIconsProps = child.props;

				let icon: StatusIcon;
				if ("timerExpiresAt" in props.icon) {
					icon = {
						title: props.icon.title,
						subtitle: props.icon.subtitle,
						timerExpiresAt: props.icon.timerExpiresAt,
						serverTimestamp: props.icon.serverTimestamp,
						factionUpgrade: props.icon.factionUpgrade,
					};
				} else {
					icon = { title: props.icon.title, subtitle: props.icon.subtitle };
				}

				map.set(props.iconKey, icon);
				return map;
			}, new Map());
		}
	}

	const legacySidebarData = getSidebarData();
	if (legacySidebarData?.statusIcons?.icons) {
		return Object.entries(legacySidebarData.statusIcons.icons).reduce<StatusIcons>((map, [key, data]) => {
			const propsIcon = data as InternalStatusIconsProps["icon"];

			let icon: StatusIcon;
			if ("timerExpiresAt" in propsIcon) {
				icon = {
					title: propsIcon.title,
					subtitle: propsIcon.subtitle,
					timerExpiresAt: propsIcon.timerExpiresAt,
					serverTimestamp: propsIcon.serverTimestamp,
					factionUpgrade: propsIcon.factionUpgrade,
				};
			} else {
				icon = { title: propsIcon.title, subtitle: propsIcon.subtitle };
			}

			map.set(key, icon);
			return map;
		}, new Map());
	}

	return null;
}

interface ReactProperties {
	children: {
		$$typeof: symbol;
		key: string;
		props: any;
		ref: unknown | null;
		type: unknown;
	}[];
	className: string;
	ref: unknown | null;
}

function getReactProperties(obj: any): ReactProperties {
	const property = Object.keys(obj).find((k) => k.startsWith("__reactProps"));
	if (!property) return null;

	return obj[property];
}

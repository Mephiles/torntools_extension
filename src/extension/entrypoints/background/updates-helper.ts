import type { FactionV1Crimes } from "@common/utils/functions/api-v1.types";

export function calculateOC(crimes: FactionV1Crimes, user: number) {
	return (
		Object.values(crimes)
			.reverse()
			.filter(({ initiated }) => !initiated)
			.filter(({ participants }) => participants.map((value) => parseInt(Object.keys(value)[0])).includes(user))
			.map(({ time_ready }) => time_ready * 1000)
			.find((time) => !!time) ?? -1
	);
}

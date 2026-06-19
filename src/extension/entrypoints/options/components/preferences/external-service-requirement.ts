export const SERVICE_DETAILS = {
	tornstats: {
		name: "TornStats",
		icon: "/images/svg-icons/tornstats.svg",
	},
	yata: {
		name: "YATA",
		icon: "/images/svg-icons/yata.svg",
	},
	tornw3b: {
		name: "TornW3B",
	},
	lzpt: {
		name: "LZPT",
	},
	prometheus: {
		name: "Prometheus",
	},
	ffScouter: {
		name: "FFScouter",
	},
	tornintel: {
		name: "Torn Intel",
	},
	playgroundTorntools: {
		name: "Playground TornTools",
	},
} as const;

export type ExternalService = keyof typeof SERVICE_DETAILS;

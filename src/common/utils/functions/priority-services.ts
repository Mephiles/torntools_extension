export abstract class PriorityService<TResult = unknown> {
	abstract readonly name: string;
	abstract enabled(): boolean;
	abstract priority(): number;
	abstract execute(): Promise<TResult>;
}

export interface ServiceError {
	service: string;
	message: string;
}

export interface ServiceOutcome<TResult> {
	result: TResult | null;
	errors: ServiceError[];
}

export async function executePriorityServices<TResult>(
	services: PriorityService<TResult>[],
	selectBest?: (a: TResult, b: TResult) => TResult,
): Promise<ServiceOutcome<TResult>> {
	const enabled = services.filter((service) => service.enabled()).sort((a, b) => a.priority() - b.priority());

	if (!enabled.length) return { result: null, errors: [] };

	const groups = new Map<number, PriorityService<TResult>[]>();
	enabled.forEach((service) => {
		const priority = service.priority();
		if (!groups.has(priority)) groups.set(priority, []);
		groups.get(priority)!.push(service);
	});

	const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => a - b);

	let best: TResult | null = null;
	const errors: ServiceError[] = [];

	for (const [, group] of sortedGroups) {
		if (selectBest) {
			best = await executeGroupAllSettled(group, selectBest, errors);
		} else {
			best = await executeGroupRace(group, errors);
		}

		if (best) break;
	}

	return { result: best, errors };
}

async function executeGroupAllSettled<TResult>(
	group: PriorityService<TResult>[],
	selectBest: (a: TResult, b: TResult) => TResult,
	errors: ServiceError[],
): Promise<TResult | null> {
	const settled = await Promise.allSettled(group.map((service) => service.execute()));

	let best: TResult | null = null;
	settled.forEach((result) => {
		if (result.status === "fulfilled") {
			best = best ? selectBest(best, result.value) : result.value;
		} else {
			errors.push(result.reason?.service ? result.reason : { service: "unknown", message: String(result.reason) });
		}
	});

	return best;
}

async function executeGroupRace<TResult>(group: PriorityService<TResult>[], errors: ServiceError[]): Promise<TResult | null> {
	const promises = group.map((s) => s.execute());

	Promise.allSettled(promises).then((settled) => {
		settled
			.filter((result) => result.status === "rejected")
			.forEach((result) => {
				errors.push(result.reason?.service ? result.reason : { service: "unknown", message: String(result.reason) });
			});
	});

	try {
		return await Promise.any(promises);
	} catch {
		return null;
	}
}

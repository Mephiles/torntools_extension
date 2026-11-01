import { ttStorage } from "@common/utils/context";
import { companydata, setCompanydata, userdata } from "@common/utils/data/database";
import type { StoredCompanydata, StoredCompanydataBasic, StoredCompanydataNoAccess } from "@common/utils/data/default-database";
import { COMPANY_ACCESS } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { hasTimePassed, TO_MILLIS } from "@common/utils/functions/utilities";
import type { CompanyEmployeeExtended, CompanyEmployeeFull, CompanyProfileExtendedResponse, CompanyProfileResponse } from "tornapi-typescript";

export type FetchedCompanydataBasic = CompanyProfileResponse & { employees: CompanyEmployeeExtended[] };
export type FetchedCompanydataWithAccess = CompanyProfileExtendedResponse & { employees: CompanyEmployeeFull[] };

export async function updateCompanydata() {
	if (!userdata?.job || userdata.job.type !== "company") {
		setCompanydata({ access: COMPANY_ACCESS.none, date: 0 });
	} else if (userdata.job.position === "Director" && shouldAttemptDirectorAccess()) {
		setCompanydata(await updateAccess());
	} else {
		setCompanydata(await updateBasic());
	}

	await ttStorage.set({ companydata });
}

function shouldAttemptDirectorAccess() {
	if (!companydata || companydata.access !== COMPANY_ACCESS.basic) return true;

	return ("retry" in companydata && !!companydata.retry) || ("date" in companydata && hasTimePassed(companydata.date, TO_MILLIS.HOURS * 6));
}

async function updateAccess(): Promise<StoredCompanydata> {
	try {
		const data = await fetchData<FetchedCompanydataWithAccess>("tornv2", {
			section: "company",
			selections: ["profile", "employees", "stock"],
			silent: true,
		});
		if (typeof data.profile.trains !== "number") {
			// We got a response, but it doesn't contain the fields a director would have.
			return {
				...data,
				access: COMPANY_ACCESS.basic,
				date: Date.now(),
			};
		}

		return {
			...data,
			access: COMPANY_ACCESS.director,
			date: Date.now(),
		};
	} catch (error) {
		if ((error as { code?: number } | null)?.code === 7) {
			const data = await updateBasic();

			return { ...data, retry: Date.now() };
		}

		return { error, access: COMPANY_ACCESS.none, date: 0 };
	}
}

async function updateBasic(): Promise<(StoredCompanydataBasic | StoredCompanydataNoAccess) & { date: number }> {
	try {
		const data = await fetchData<FetchedCompanydataBasic>("tornv2", {
			section: "company",
			selections: ["profile"],
			silent: true,
		});

		return {
			...data,
			access: COMPANY_ACCESS.basic,
			date: Date.now(),
		};
	} catch (error) {
		return { error, access: COMPANY_ACCESS.none, date: 0 };
	}
}

import { beforeEach, describe, expect, it, mock } from "bun:test";

const state: { userdata: any; companydata?: any; response?: any; error?: any } = { userdata: {} };

mock.module("@common/utils/data/database", () => ({
	userdata: state.userdata,
	companydata: undefined,
	setCompanydata(value: any) {
		state.companydata = value;
	},
}));

mock.module("@common/utils/context", () => ({
	ttStorage: { set: async () => {} },
}));

mock.module("@common/utils/functions/api-fetcher", () => ({
	fetchData: async (_location: string, options: { selections: string[] }) => {
		if (state.error && options.selections.includes("stock")) throw state.error;
		return state.response;
	},
}));

import { updateCompanydata } from "./companydata";

const PROFILE = { profile: { id: 1, name: "Company" } };
const EXTENDED_PROFILE = { profile: { id: 1, name: "Company", trains: 3 } };
const EMPLOYEES = { employees: [{ id: 2, name: "Employee" }] };
const STOCK = { stock: [{ id: 3, name: "Item" }] };

describe("updateCompanydata", () => {
	beforeEach(() => {
		state.userdata.job = { type: "company", id: 1, position: "Employee" };
		state.companydata = undefined;
		state.response = PROFILE;
		state.error = undefined;
	});

	it("should store no access when the user is not employed at a company", async () => {
		state.userdata.job = { type: "job", name: "Army" };

		await updateCompanydata();

		expect(state.companydata.access).toBe("none");
		expect(state.companydata.date).toBe(0);
	});

	it("should only fetch the profile for non-directors", async () => {
		await updateCompanydata();

		expect(state.companydata.access).toBe("basic");
		expect(state.companydata.profile).toEqual(PROFILE.profile);
		expect(state.companydata.employees).toBeUndefined();
	});

	it("should store the full data for directors", async () => {
		state.userdata.job.position = "Director";
		state.response = { ...EXTENDED_PROFILE, ...EMPLOYEES, ...STOCK };

		await updateCompanydata();

		expect(state.companydata.access).toBe("director");
		expect(state.companydata.employees).toEqual(EMPLOYEES.employees);
		expect(state.companydata.stock).toEqual(STOCK.stock);
	});

	it("should store basic data when the profile lacks the director fields", async () => {
		state.userdata.job.position = "Director";
		state.response = { ...PROFILE, ...EMPLOYEES, ...STOCK };

		await updateCompanydata();

		expect(state.companydata.access).toBe("basic");
	});

	it("should downgrade to basic with a retry when director access is refused", async () => {
		state.userdata.job.position = "Director";
		state.error = { code: 7 };

		await updateCompanydata();

		expect(state.companydata.access).toBe("basic");
		expect(state.companydata.retry).toBeNumber();
	});
});

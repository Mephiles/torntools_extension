import { settings } from "@common/utils/data/database";

export interface UserAlias {
	userId: number;
	userName: string | null;
	alias: string;
}
export interface EligibleUserAlias {
	userId: number;
	userName: string;
	alias: string;
}

export function getUserAliasById(id: number): UserAlias | null {
	return settings.userAlias.find(({ userId }) => userId === id) ?? null;
}

export function getUserAliasByName(name: string): EligibleUserAlias | null {
	return (
		settings.userAlias
			.filter((alias): alias is EligibleUserAlias => alias.userName !== null)
			.find((alias) => alias.userName.trim().toLowerCase() === name.trim().toLowerCase()) ?? null
	);
}

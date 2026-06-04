import { settings } from "@common/utils/data/database";

export interface UserAlias {
	userId: number;
	userName: string | null;
	alias: string;
}

export function getUserAliasById(id: number): UserAlias | null {
	return settings.userAlias.find(({ userId }) => userId === id) ?? null;
}

export function getUserAliasByName(name: string): UserAlias | null {
	return settings.userAlias.filter(({ userName }) => !!userName).find(({ userName }) => userName.trim().toLowerCase() === name.trim().toLowerCase()) ?? null;
}

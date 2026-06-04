import { ttStorage } from "@common/utils/context";
import type { Database, DatabaseKey, RecursivePartial } from "@common/utils/data/database";

type StorageLeaf = string | number | boolean | null | undefined | readonly unknown[];
type KnownStringKey<T> = Extract<
	{
		[K in keyof T]: string extends K ? never : number extends K ? never : K;
	}[keyof T],
	string
>;
type JoinPath<Prefix extends string, Key extends string> = Prefix extends "" ? Key : `${Prefix}.${Key}`;

export type DatabaseStoragePath<T, Prefix extends string = ""> = T extends StorageLeaf
	? never
	: T extends object
		? {
				[Key in KnownStringKey<T>]: T[Key] extends StorageLeaf
					? JoinPath<Prefix, Key>
					: T[Key] extends object
						? DatabaseStoragePath<T[Key], JoinPath<Prefix, Key>>
						: JoinPath<Prefix, Key>;
			}[KnownStringKey<T>]
		: never;

type PreferenceStorageRoot = Pick<Database, "settings" | "api">;
export type PreferenceStorageSource = { [Key in keyof PreferenceStorageRoot]?: PreferenceStorageRoot[Key] | undefined };

export type PreferenceStoragePath = DatabaseStoragePath<PreferenceStorageRoot>;
type PreferenceStorageValue<Path extends PreferenceStoragePath> = PathValue<PreferenceStorageRoot, Path>;
type PreferenceStoragePathByValue<Value> = {
	[Path in PreferenceStoragePath]: Extract<PreferenceStorageValue<Path>, Value> extends never ? never : Path;
}[PreferenceStoragePath];

export type BooleanPreferenceStoragePath = PreferenceStoragePathByValue<boolean>;
export type NumberPreferenceStoragePath = PreferenceStoragePathByValue<number>;
export type StringPreferenceStoragePath = PreferenceStoragePathByValue<string>;

type PathValue<T, Path extends string> = Path extends `${infer Key}.${infer Rest}`
	? Key extends keyof T
		? PathValue<T[Key], Rest>
		: never
	: Path extends keyof T
		? T[Path]
		: never;

export function getPreferenceValue(source: PreferenceStorageSource, path: PreferenceStoragePath) {
	return path.split(".").reduce<unknown>((value, key) => {
		if (!value || typeof value !== "object") {
			return undefined;
		}

		return (value as Record<string, unknown>)[key];
	}, source);
}

export async function updatePreferenceValue(path: PreferenceStoragePath, value: unknown) {
	const [rootKey, ...pathSegments] = path.split(".") as [DatabaseKey, ...string[]];
	const patch = buildPatch(pathSegments, value);

	await ttStorage.change({ [rootKey]: patch } as RecursivePartial<Database>);
}

function buildPatch(pathSegments: string[], value: unknown): unknown {
	const [key, ...remainingSegments] = pathSegments;

	if (!key) {
		return value;
	}

	return {
		[key]: buildPatch(remainingSegments, value),
	};
}

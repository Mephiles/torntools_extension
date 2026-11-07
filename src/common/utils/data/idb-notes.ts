import type { DatabaseNotes } from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import { createIndexedDBStore } from "@common/utils/data/idb";
import { browser } from "wxt/browser";

const store = createIndexedDBStore("tt-notes", "notes", 1);

const SIDEBAR_KEY = "sidebar";
const PROFILE_PREFIX = "profile:";

export const NOTES_VERSION_KEY = "notesVersion";
export const FALLBACK_NOTES_KEY = "notes-fallback";

type StoredNote = DatabaseNotes["sidebar"];

interface StoredNoteEntry {
	key: string;
	notes: StoredNote;
}

let notesVersionCounter = 0;

export async function bumpNotesVersion(): Promise<void> {
	await browser.storage.local.set({ [NOTES_VERSION_KEY]: `${Date.now()}-${++notesVersionCounter}` });
}

function flattenNotes(notes: DatabaseNotes): Map<string, StoredNote> {
	const entries = new Map<string, StoredNote>([[SIDEBAR_KEY, notes.sidebar]]);
	for (const [userId, note] of Object.entries(notes.profile)) {
		entries.set(`${PROFILE_PREFIX}${userId}`, note);
	}
	return entries;
}

export function toNotes(entries: StoredNoteEntry[]): DatabaseNotes {
	const notes = getDefaultStorage({ notes: DEFAULT_STORAGE.notes }).notes as DatabaseNotes;
	notes.profile = {};

	for (const { key, notes: note } of entries) {
		if (key === SIDEBAR_KEY) notes.sidebar = note;
		else if (key.startsWith(PROFILE_PREFIX)) notes.profile[key.slice(PROFILE_PREFIX.length)] = note;
	}

	return notes;
}

function sameNote(left: StoredNote | undefined, right: StoredNote): boolean {
	return left?.text === right.text && left?.height === right.height;
}

export function planNoteChanges(existing: StoredNoteEntry[], notes: DatabaseNotes) {
	const entries = flattenNotes(notes);
	const existingNotes = new Map(existing.map(({ key, notes: note }) => [key, note]));

	const updates = Array.from(entries)
		.filter(([key, note]) => !sameNote(existingNotes.get(key), note))
		.map(([key, notes]) => ({ key, notes }) satisfies StoredNoteEntry);
	const removals = Array.from(existingNotes.keys()).filter((key) => !entries.has(key));

	return { updates, removals };
}

export async function getNotes(): Promise<DatabaseNotes | undefined> {
	try {
		const entries = await store.run("readonly", (notesStore) => notesStore.getAll() as IDBRequest<StoredNoteEntry[]>);
		if (entries.length) return toNotes(entries);
	} catch (error) {
		if (store.isAvailable) throw error;
	}

	return (await browser.storage.local.get(FALLBACK_NOTES_KEY))[FALLBACK_NOTES_KEY] as DatabaseNotes | undefined;
}

export async function setNotes(notes: DatabaseNotes): Promise<void> {
	try {
		await store.run("readwrite", (notesStore) => {
			const request = notesStore.getAll() as IDBRequest<StoredNoteEntry[]>;
			request.addEventListener("success", () => {
				const { updates, removals } = planNoteChanges(request.result, notes);

				for (const { key, notes: note } of updates) notesStore.put({ key, notes: note }, key);
				for (const key of removals) notesStore.delete(key);
			});

			return request;
		});
	} catch (error) {
		if (store.isAvailable) throw error;
		await browser.storage.local.set({ [FALLBACK_NOTES_KEY]: notes });
	}
}

export async function removeNotes(): Promise<void> {
	try {
		await store.run("readwrite", (notesStore) => notesStore.clear());
	} catch (error) {
		if (store.isAvailable) throw error;
	}

	await browser.storage.local.remove(FALLBACK_NOTES_KEY);
}

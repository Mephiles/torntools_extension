export interface IndexedDBStore {
	readonly isAvailable: boolean;

	run<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T> | T): Promise<T>;
}

export function createIndexedDBStore(databaseName: string, storeName: string, version: number): IndexedDBStore {
	let databasePromise: Promise<IDBDatabase> | null = null;
	let idbAvailable = true;

	function openDatabase(): Promise<IDBDatabase> {
		if (databasePromise) return databasePromise;
		if (!idbAvailable) return Promise.reject(new Error("IndexedDB is unavailable."));

		databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
			let openRequest: IDBOpenDBRequest | undefined;
			try {
				openRequest = indexedDB.open(databaseName, version);
			} catch (error) {
				idbAvailable = false;
				databasePromise = null;
				reject(error);
				return;
			}
			const request = openRequest!;

			request.onupgradeneeded = () => {
				const database = request.result;
				if (!database.objectStoreNames.contains(storeName)) {
					database.createObjectStore(storeName);
				}
			};
			request.addEventListener("success", () => {
				const database = request.result;
				database.addEventListener("close", () => {
					databasePromise = null;
				});
				resolve(database);
			});
			request.addEventListener("error", () => {
				idbAvailable = false;
				databasePromise = null;
				reject(request.error);
			});
		});

		return databasePromise;
	}

	function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			request.addEventListener("success", () => resolve(request.result));
			request.addEventListener("error", () => reject(request.error));
		});
	}

	function transactionDone(transaction: IDBTransaction): Promise<void> {
		return new Promise((resolve, reject) => {
			transaction.addEventListener("complete", () => resolve());
			transaction.addEventListener("error", () => reject(transaction.error));
			transaction.addEventListener("abort", () => reject(transaction.error));
		});
	}

	return {
		get isAvailable() {
			return idbAvailable;
		},

		async run<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T> | T): Promise<T> {
			const database = await openDatabase();
			const transaction = database.transaction(storeName, mode);
			const result = operation(transaction.objectStore(storeName));
			const value = result instanceof IDBRequest ? await requestToPromise(result) : result;
			await transactionDone(transaction);
			return value;
		},
	};
}

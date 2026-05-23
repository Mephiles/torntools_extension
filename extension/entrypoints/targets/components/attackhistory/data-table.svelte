<script lang="ts">
	import { createSvelteTable, FlexRender } from "@svelte/components/ui/data-table";
	import * as Table from "@svelte/components/ui/table";
	import { cn } from "@svelte/utils";
	import { type ColumnDef, getCoreRowModel, getSortedRowModel, type SortingState } from "@tanstack/table-core";
	import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
	import CaretUpIcon from "phosphor-svelte/lib/CaretUpIcon";
	import type { HistoryRow } from "./columns";

	type DataTableProps = {
		data: HistoryRow[];
		columns: ColumnDef<HistoryRow>[];
	};

	let { data, columns }: DataTableProps = $props();
	let sorting = $state<SortingState>([{ id: "lastAttack", desc: true }]);

	const table = createSvelteTable({
		get data() {
			return data;
		},
		get columns() {
			return columns;
		},
		getRowId: (row) => row.id,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			get sorting() {
				return sorting;
			},
		},
		onSortingChange: (updater) => {
			sorting = typeof updater === "function" ? updater(sorting) : updater;
		},
	});

	function getHeaderAlignment(columnId: string) {
		return columnId === "name" || columnId === "lastAttack" ? "text-left" : "text-center";
	}

	function getHeaderClass(columnId: string) {
		return cn([
			getHeaderAlignment(columnId),
			"h-6",
			"py-1",
			{
				"px-0": !["id", "name", "lastAttack"].includes(columnId),
				"px-1": ["id", "name", "lastAttack"].includes(columnId),
				"pl-1": ["win", "lose", "respect"].includes(columnId),
				"pr-1": ["fair_fight"].includes(columnId),
				"border-l": ["win", "lose", "respect"].includes(columnId),
			},
		]);
	}

	function getCellClass(columnId: string) {
		return cn([
			getHeaderAlignment(columnId),
			"py-1",
			{
				"px-0": !["id", "name", "lastAttack"].includes(columnId),
				"px-1": ["id", "name", "lastAttack"].includes(columnId),
				"pl-1": ["win", "lose", "respect"].includes(columnId),
				"pr-1": ["fair_fight"].includes(columnId),
				"border-l": ["win", "lose", "respect"].includes(columnId),
				"text-emerald-500": ["win", "mug", "leave", "hospitalise", "arrest", "special", "stealth", "assist", "defend"].includes(columnId),
				"text-red-400": ["lose", "stalemate", "escapes", "defend_lost"].includes(columnId),
			},
		]);
	}

	function toggleSorting(columnId: string) {
		table.getColumn(columnId)?.toggleSorting(undefined, false);
	}
</script>

<div class="overflow-hidden rounded-sm border bg-card">
	<Table.Root class="text-xs">
		<Table.Header class="bg-muted">
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head colspan={header.colSpan} class={getHeaderClass(header.column.id)}>
							{#if !header.isPlaceholder}
								<button
									class="flex items-center gap-0.5 font-medium leading-none hover:text-primary disabled:pointer-events-none"
									type="button"
									disabled={!header.column.getCanSort()}
									onclick={() => toggleSorting(header.column.id)}
								>
									<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
									{#if header.column.getIsSorted()}
										<span class="flex items-center justify-center">
											{#if header.column.getIsSorted() === "asc"}
												<CaretUpIcon class="size-2.5" weight="fill" />
											{:else if header.column.getIsSorted() === "desc"}
												<CaretDownIcon class="size-2.5" weight="fill" />
											{/if}
										</span>
									{/if}
								</button>
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell class={getCellClass(cell.column.id)}>
							{#if cell.column.id === "id"}
								<a class="hover:underline" href={`https://www.torn.com/profiles.php?XID=${row.original.id}`} target="_blank" rel="noreferrer">
									{row.original.id}
								</a>
							{:else if cell.column.id === "name"}
								<a class="hover:underline" href={`https://www.torn.com/profiles.php?XID=${row.original.id}`} target="_blank" rel="noreferrer">
									{row.original.name}
								</a>
							{:else if cell.column.id === "lastAttack" && row.original.lastAttackCode}
								<a
									class="hover:underline"
									href={`https://www.torn.com/page.php?sid=attackLog&ID=${row.original.lastAttackCode}`}
									target="_blank"
									rel="noreferrer"
								>
									{row.original.lastAttackLabel}
								</a>
							{:else}
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							{/if}
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="p-4 text-center text-muted-foreground">No attack history stored.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

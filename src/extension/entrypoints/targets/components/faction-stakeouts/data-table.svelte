<script lang="ts">
	import { Badge } from "@svelte/components/ui/badge";
	import { Button } from "@svelte/components/ui/button";
	import { createSvelteTable, FlexRender } from "@svelte/components/ui/data-table";
	import { Input } from "@svelte/components/ui/input";
	import * as Table from "@svelte/components/ui/table";
	import { cn } from "@svelte/utils";
	import { type ColumnDef, getCoreRowModel } from "@tanstack/table-core";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import AlertCheckbox from "./AlertCheckbox.svelte";
	import type { BooleanAlertKey, FactionStakeoutRow, NumberAlertKey } from "./columns";

	type DataTableProps = {
		data: FactionStakeoutRow[];
		columns: ColumnDef<FactionStakeoutRow>[];
		onRemove: (id: number) => void;
		onBooleanAlertChange: (id: number, key: BooleanAlertKey, value: boolean) => void;
		onNumberAlertChange: (id: number, key: NumberAlertKey, value: string) => void;
	};

	let { data, columns, onRemove, onBooleanAlertChange, onNumberAlertChange }: DataTableProps = $props();

	const table = createSvelteTable({
		get data() {
			return data;
		},
		get columns() {
			return columns;
		},
		getRowId: (row) => String(row.id),
		getCoreRowModel: getCoreRowModel(),
	});

	function getHeaderClass(columnId: string) {
		return columnId === "id" || columnId === "remove" ? "px-2 py-2 text-center" : "px-2 py-2 text-left";
	}

	function getCellClass(columnId: string) {
		return cn([
			"px-2",
			{
				"py-1.5": columnId !== "notifications",
				"py-2": columnId === "notifications",
				"text-center": columnId === "id" || columnId === "remove"
			},
		]);
	}
</script>

<div class="overflow-hidden rounded-lg border bg-card">
	<Table.Root>
		<Table.Header class="bg-muted/60">
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head colspan={header.colSpan} class={getHeaderClass(header.column.id)}>
							{#if !header.isPlaceholder}
								<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as tableRow (tableRow.id)}
				{@const row = tableRow.original}
				<Table.Row data-id={row.id}>
					{#each tableRow.getVisibleCells() as cell (cell.id)}
						<Table.Cell class={getCellClass(cell.column.id)}>
							{#if cell.column.id === "id"}
								<a class="hover:underline" href={`https://www.torn.com/factions.php?step=profile&ID=${row.id}`} target="_blank" rel="noreferrer">{row.id}</a>
							{:else if cell.column.id === "name"}
								{#if row.info?.name}
									<a class="hover:underline" href={`https://www.torn.com/factions.php?step=profile&ID=${row.id}`} target="_blank" rel="noreferrer">{row.info.name}</a>
								{:else}
									<span class="text-muted-foreground">{row.isNew ? "Pending save" : "Unknown"}</span>
								{/if}
							{:else if cell.column.id === "chain"}
								{#if row.info && row.info.chain > 0}
									<Badge variant="secondary">{row.info.chain} chain</Badge>
								{:else}
									<Badge variant="outline">No chain</Badge>
								{/if}
							{:else if cell.column.id === "members"}
								{#if row.info?.members}
									<span>{row.info.members.current}/{row.info.members.maximum}</span>
								{:else}
									<span class="text-muted-foreground">N/A</span>
								{/if}
							{:else if cell.column.id === "respect"}
								{#if row.info && row.info.respect > 0}
									<Badge variant="secondary">{row.info.respect}</Badge>
								{:else if row.info}
									<Badge variant="destructive" class="uppercase">destroyed</Badge>
								{:else}
									<span class="text-muted-foreground">N/A</span>
								{/if}
							{:else if cell.column.id === "remove"}
								<Button variant="ghost" size="icon" aria-label={`Remove faction ${row.id}`} onclick={() => onRemove(row.id)}>
									<TrashIcon class="size-4 text-destructive" aria-hidden="true" />
								</Button>
							{:else if cell.column.id === "notifications"}
								<div class="grid grid-cols-2 gap-x-2 gap-y-0.5">
									<label class="flex items-center gap-1 text-xs">
										<span>chain reaches</span>
										<Input
											class="h-5 w-12 px-1 text-xs"
											type="number" pattern="\d*" inputmode="numeric"
											min="0"
											value={row.alerts.chainReaches === false ? "" : row.alerts.chainReaches}
											oninput={(event) => onNumberAlertChange(row.id, "chainReaches", event.currentTarget.value)}
										/>
									</label>
									<label class="flex items-center gap-1 text-xs">
										<span>members drop below</span>
										<Input
											class="h-5 w-12 px-1 text-xs with-number-wheel"
											type="number" pattern="\d*" inputmode="numeric"
											min="0"
											value={row.alerts.memberCountDrops === false ? "" : row.alerts.memberCountDrops}
											oninput={(event) => onNumberAlertChange(row.id, "memberCountDrops", event.currentTarget.value)}
										/>
									</label>
									<AlertCheckbox
										id={`rankedWarStarts-${row.id}`}
										label="ranked war starts"
										checked={row.alerts.rankedWarStarts}
										onchange={(value) => onBooleanAlertChange(row.id, "rankedWarStarts", value)}
									/>
									<AlertCheckbox
										id={`inRaid-${row.id}`}
										label="is in raid"
										checked={row.alerts.inRaid}
										onchange={(value) => onBooleanAlertChange(row.id, "inRaid", value)}
									/>
									<AlertCheckbox
										id={`inTerritoryWar-${row.id}`}
										label="in territory war"
										checked={row.alerts.inTerritoryWar}
										onchange={(value) => onBooleanAlertChange(row.id, "inTerritoryWar", value)}
									/>
								</div>
							{/if}
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="p-4 text-center text-muted-foreground">No faction stakeouts configured.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

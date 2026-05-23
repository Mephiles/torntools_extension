<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { createSvelteTable, FlexRender } from "@svelte/components/ui/data-table";
	import { Input } from "@svelte/components/ui/input";
	import * as Table from "@svelte/components/ui/table";
	import { cn } from "@svelte/utils";
	import { type ColumnDef, getCoreRowModel } from "@tanstack/table-core";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import AlertCheckbox from "../todo/AlertCheckbox.svelte";
	import type { BooleanAlertKey, NumberAlertKey, StakeoutInfo, StakeoutRow } from "./columns";

	type DataTableProps = {
		data: StakeoutRow[];
		columns: ColumnDef<StakeoutRow>[];
		onRemove: (id: string) => void;
		onLabelChange: (id: string, label: string) => void;
		onBooleanAlertChange: (id: string, key: BooleanAlertKey, value: boolean) => void;
		onNumberAlertChange: (id: string, key: NumberAlertKey, value: string) => void;
	};

	let { data, columns, onRemove, onLabelChange, onBooleanAlertChange, onNumberAlertChange }: DataTableProps = $props();

	const table = createSvelteTable({
		get data() {
			return data;
		},
		get columns() {
			return columns;
		},
		getRowId: (row) => row.id,
		getCoreRowModel: getCoreRowModel(),
	});

	function getStatusSortValue(info: StakeoutInfo | null) {
		switch (info?.last_action.status.toLowerCase()) {
			case "online":
				return 1;
			case "idle":
				return 2;
			case "offline":
				return 3;
			default:
				return 0;
		}
	}

	function getStatusDotClass(status: string) {
		const normalizedStatus = status.toLowerCase();
		if (normalizedStatus === "online") return "bg-green-500";
		if (normalizedStatus === "idle") return "bg-orange-400";
		return "bg-white";
	}

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
								<a class="hover:underline" href={`https://www.torn.com/profiles.php?XID=${row.id}`} target="_blank" rel="noreferrer">{row.id}</a>
							{:else if cell.column.id === "name"}
								{#if row.info?.name}
									<a class="hover:underline" href={`https://www.torn.com/profiles.php?XID=${row.id}`} target="_blank" rel="noreferrer">{row.info.name}</a>
								{:else}
									<span class="text-muted-foreground">{row.isNew ? "Pending save" : "Unknown"}</span>
								{/if}
							{:else if cell.column.id === "label"}
								<Input value={row.label} placeholder="label..." oninput={(event) => onLabelChange(row.id, event.currentTarget.value)} />
							{:else if cell.column.id === "status"}
								<div data-value={getStatusSortValue(row.info)}>
									{#if row.info?.last_action.status}
										{@const lastActionStatus = row.info.last_action.status}
										<span class="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs">
											<span class={`size-2.5 rounded-full ${getStatusDotClass(lastActionStatus)}`}></span>
											{row.info.last_action.status}
										</span>
									{/if}
								</div>
							{:else if cell.column.id === "lastAction"}
								{row.info?.last_action.relative ?? ""}
							{:else if cell.column.id === "remove"}
								<Button variant="ghost" size="icon" aria-label={`Remove ${row.id}`} onclick={() => onRemove(row.id)}>
									<TrashIcon class="size-4 text-destructive" aria-hidden="true" />
								</Button>
							{:else if cell.column.id === "notifications"}
								<div class="grid grid-cols-2 gap-x-2 gap-y-0.5">
									<AlertCheckbox id={`okay-${row.id}`} label="is okay" checked={row.alerts.okay} onchange={(value) => onBooleanAlertChange(row.id, "okay", value)} />
									<AlertCheckbox
										id={`hospital-${row.id}`}
										label="is in hospital"
										checked={row.alerts.hospital}
										onchange={(value) => onBooleanAlertChange(row.id, "hospital", value)}
									/>
									<AlertCheckbox id={`landing-${row.id}`} label="lands" checked={row.alerts.landing} onchange={(value) => onBooleanAlertChange(row.id, "landing", value)} />
									<AlertCheckbox
										id={`online-${row.id}`}
										label="comes online"
										checked={row.alerts.online}
										onchange={(value) => onBooleanAlertChange(row.id, "online", value)}
									/>
									<label class="flex items-center gap-1 text-xs">
										<span>life drops below</span>
										<Input
											class="h-5 w-12 px-1 text-xs"
											type="number"
											min="1"
											max="100"
											value={row.alerts.life || ""}
											oninput={(event) => onNumberAlertChange(row.id, "life", event.currentTarget.value)}
										/>
										<span>%</span>
									</label>
									<label class="flex items-center gap-1 text-xs">
										<span>offline over</span>
										<Input
											class="h-5 w-12 px-1 text-xs"
											type="number"
											min="1"
											value={row.alerts.offline || ""}
											oninput={(event) => onNumberAlertChange(row.id, "offline", event.currentTarget.value)}
										/>
										<span>hours</span>
									</label>
									<AlertCheckbox
										id={`revivable-${row.id}`}
										label="is revivable"
										checked={row.alerts.revivable}
										onchange={(value) => onBooleanAlertChange(row.id, "revivable", value)}
									/>
								</div>
							{/if}
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="p-4 text-center text-muted-foreground">No stakeouts configured.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

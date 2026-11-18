<script lang="ts" generics="T extends Record<string, any>">
	import type { TableCells, TableColumn, TableSummary } from "./table.types";
	import styles from "./table.module.css";

	interface TableProps {
		columns: TableColumn<T>[];
		data: T[];
		cells?: TableCells<T>;
		summary?: TableSummary<T>;
		rowClass?: (row: T) => string;
		stretchColumns?: boolean;
		compact?: boolean;
	}

	let { columns, data, cells, summary, rowClass, stretchColumns = false, compact = false }: TableProps = $props();

	function sizeStyle(column: TableColumn<T>) {
		return stretchColumns ? `min-width: ${column.width}px; flex: 1;` : `width: ${column.width}px;`;
	}
</script>

<div class={`${styles.table} ${compact ? styles.compact : ""}`}>
	<div class={styles.header}>
		{#each columns as column (column.id)}
			<div class={`${styles.headerCell} ${column.class ?? ""}`} style={sizeStyle(column)}>
				<span class={styles.headerCellTitle}>{column.title}</span>
			</div>
		{/each}
	</div>
	<div class={styles.body}>
		{#if summary}
			<div class={`${styles.row} ${styles.summaryRow}`}>
				{#each columns as column (column.id)}
					<div class={`${styles.rowCell} ${column.class ?? ""}`} style={sizeStyle(column)}>{summary![column.id] ?? ""}</div>
				{/each}
			</div>
		{/if}
		{#each data as row, index (index)}
			<div class={`${styles.row} ${rowClass?.(row) ?? ""}`}>
				{#each columns as column (column.id)}
					{@const cell = cells?.[column.id]}
					<div class={`${styles.rowCell} ${column.class ?? ""}`} style={sizeStyle(column)}>
						{#if cell}
							{@render cell(row[column.id], row)}
						{:else}
							{row[column.id]}
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>

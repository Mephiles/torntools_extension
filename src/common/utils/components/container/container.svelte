<script lang="ts">
	import { ttStorage } from "@common/utils/context";
	import { filters } from "@common/utils/data/database";
	import { camelCase } from "@common/utils/functions/formatting";
	import { PHFillCaretDown } from "@common/utils/icons/phosphor-icons";
	import type { Snippet } from "svelte";
	import styles from "./container.module.css";

	interface ContainerProps {
		children: Snippet;
		title: string;
		class?: string;
		compact?: boolean;
		showHeader?: boolean;
		collapsible?: boolean;
		applyRounding?: boolean;
		onlyHeader?: boolean;
		contentBackground?: boolean;
	}

	let {
		children,
		title,
		class: className,
		compact = false,
		showHeader = true,
		collapsible = true,
		applyRounding = true,
		onlyHeader = false,
		contentBackground = true,
	}: ContainerProps = $props();
	let id = $derived(camelCase(title));
	let collapsed = $derived.by(() => onlyHeader || (collapsible && (filters.containers[id] ?? false)));

	function headerClicked() {
		collapsed = !collapsed;
		ttStorage.change({ filters: { containers: { [id]: collapsed } } });
	}
</script>

<div
	class={`${styles.container} ${className ?? ""} ${compact ? styles.compact : ""} ${collapsible ? styles.collapsible : ""} ${applyRounding ? styles.rounding : ""}`}
>
	{#if showHeader}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class={`${styles.title} ${collapsed ? styles.collapsed : ""}`} onclick={headerClicked}>
			<div class={styles.text}>{title}</div>
			{#if collapsible}
				{@html PHFillCaretDown({ class: "icon" }).outerHTML}
			{/if}
		</div>
	{/if}
	{#if !collapsed}
		<main class={`${contentBackground ? styles.background : ""}`}>
			{@render children()}
		</main>
	{/if}
</div>

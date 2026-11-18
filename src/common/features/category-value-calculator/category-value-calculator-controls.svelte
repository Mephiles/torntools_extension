<script lang="ts">
	import { ITEM_TYPES } from "@common/utils/functions/torn";
	import { PHBoldInfo } from "@common/utils/icons/phosphor-icons";
	import type { PriceMode } from "@features/category-value-calculator/category-value-calculation";
	import styles from "./category-value-calculator-controls.module.css";

	interface CategoryValueCalculatorControlsProps {
		category: string;
		mode: PriceMode;
		loading: boolean;
		onCalculate: () => void;
	}

	let { category = $bindable(), mode = $bindable(), loading, onCalculate }: CategoryValueCalculatorControlsProps = $props();

	const categories = ITEM_TYPES.filter((type) => type !== "Book").map((type) => ({ value: type.toLowerCase(), label: type }));
</script>

<div class={styles.controls}>
	<label class={styles.control}>
		Category
		<select bind:value={category}>
			{#each categories as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</label>

	<div class={styles.modes}>
		<label class={styles.radio}>
			<input type="radio" value="combo" bind:group={mode} />
			Combo
			<span
				class={styles.info}
				title="Uses the best price between the market value and the sell value."
				aria-label="Uses the best price between the market value and the sell value."
			>
				{@html PHBoldInfo({ width: 12, height: 12 }).outerHTML}
			</span>
		</label>
		<label class={styles.radio}>
			<input type="radio" value="market" bind:group={mode} />
			Market value
		</label>
		<label class={styles.radio}>
			<input type="radio" value="sell" bind:group={mode} />
			Sell value
		</label>
	</div>

	<button type="button" class={styles.calculate} onclick={onCalculate} disabled={loading}>
		{loading ? "Calculating…" : "Calculate"}
	</button>
</div>

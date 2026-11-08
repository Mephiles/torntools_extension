<script lang="ts">
	import { ALL_ICONS } from "@common/utils/functions/torn";

	interface IconPickerProps {
		value: string[];
		onchange: (next: string[]) => void;
	}

	let { value, onchange }: IconPickerProps = $props();

	function toggle(icon: string) {
		onchange(value.includes(icon) ? value.filter((entry) => entry !== icon) : [...value, icon]);
	}
</script>

<div class="icons">
	{#each ALL_ICONS as icon (icon.icon)}
		<button
			type="button"
			class="icon"
			class:selected={value.includes(icon.icon)}
			title={icon.description}
			aria-label={icon.description}
			aria-pressed={value.includes(icon.icon)}
			onclick={() => toggle(icon.icon)}
		>
			<span class="sprite" style="background-position: {-((icon.id - 1) * 18)}px 0"></span>
		</button>
	{/each}
</div>

<style>
	.icons {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.icon {
		cursor: pointer;
		box-sizing: border-box;
		background: var(--input-background-color, transparent);
		background-image: none;
		border: 1px solid var(--input-border-color, rgba(128, 128, 128, 0.45));
		border-radius: 4px;
		padding: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 24px;
		width: 24px;

		&:hover {
			border-color: currentColor;
		}

		&.selected {
			border-color: var(--tt-settings-accent, var(--primary, #6e8820));
			box-shadow: inset 0 0 0 1px var(--tt-settings-accent, var(--primary, #6e8820));
		}
	}

	.sprite {
		background: url(https://torn.com/images/v2/svg_icons/sprites/user_status_icons_sprite.svg);
		height: 16px;
		width: 16px;
	}
</style>

<script lang="ts">
	import Container from "@common/utils/components/container/container.svelte";
	import type { ResolvedReminder } from "./reminders.svelte.ts";
	import styles from "./reminders.module.css";

	interface RemindersBoxProps {
		reminders: ResolvedReminder[];
	}

	let { reminders }: RemindersBoxProps = $props();
</script>

{#if reminders.length}
	<div class={styles.reminderContainer}>
		<Container title="Reminders" compact={true} applyRounding={false} contentBackground={false}>
			{#each reminders as reminder (reminder.name)}
				<svelte:element
					this={reminder.url ? "a" : "div"}
					href={reminder.url}
					class={[styles.reminder, reminder.finished ? styles.finished : null]}
					tabindex="-1"
				>
					{reminder.name}{#if reminder.finished}: Finished!{/if}
				</svelte:element>
			{/each}
		</Container>
	</div>
{/if}

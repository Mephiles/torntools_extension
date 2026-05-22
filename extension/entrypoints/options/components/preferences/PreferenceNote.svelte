<script lang="ts">
	interface PreferenceNoteProps {
		text: string;
	}

	let { text }: PreferenceNoteProps = $props();
</script>

<span class="ml-2 mb-1 text-muted-foreground text-xs">{text}</span>
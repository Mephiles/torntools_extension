<script lang="ts">
	interface PreferenceNoteProps {
		text: string;
	}

	let { text }: PreferenceNoteProps = $props();
</script>

<span class="text-muted-foreground mb-1 ml-2 text-xs">{text}</span>

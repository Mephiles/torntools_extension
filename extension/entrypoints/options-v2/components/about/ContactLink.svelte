<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ContractLinkProps {
		children: Snippet;
		href: string;
	}
	const { href, children }: ContractLinkProps = $props();
</script>

<a class="text-primary underline-offset-1 hover:underline" {href} target="_blank" rel="noreferrer">
	{@render children?.()}
</a>
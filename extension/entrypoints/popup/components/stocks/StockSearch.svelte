<script lang="ts">
	import * as InputGroup from "@svelte/components/ui/input-group/index.js";
	import MagnifyingGlassIcon from "phosphor-svelte/lib/MagnifyingGlassIcon";


	interface StockSearchProps {
		query: string;
	}
	let { query = $bindable("") }: StockSearchProps = $props();
</script>

<div class="p-1 pb-0">
	<InputGroup.Root class="bg-input/30 border-input/30">
		<InputGroup.Input bind:value={query} placeholder="Search stocks..." class="text-sm" />
		<InputGroup.Addon>
			<MagnifyingGlassIcon class="size-4 opacity-50" />
		</InputGroup.Addon>
	</InputGroup.Root>
</div>

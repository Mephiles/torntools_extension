<script lang="ts">
	import { Badge } from "@svelte/components/ui/badge";
	import * as Tooltip from "@svelte/components/ui/tooltip";
	import { type ExternalService, SERVICE_DETAILS } from "./external-service-requirement";

	interface ExternalServiceRequirementProps {
		services: readonly ExternalService[];
	}

	let { services }: ExternalServiceRequirementProps = $props();

	const requiredServices = $derived(services.map((service) => SERVICE_DETAILS[service]));
	const serviceNames = $derived(requiredServices.map((service) => service.name).join(", "));
</script>

<Tooltip.Root>
	<Tooltip.Trigger
		type="button"
		class="flex items-center gap-1 rounded-md border border-dashed border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground"
	>
		<span class="text-[10px] uppercase">Requires</span>
		<span class="flex gap-1">
			{#each requiredServices as service (service.name)}
				<Badge variant="outline" class="h-4 px-1.5 text-[8px]">
					{#if "icon" in service}
						<img src={service.icon} alt={service.name} class="w-6" />
					{:else}
						{service.name}
					{/if}
				</Badge>
			{/each}
		</span>
	</Tooltip.Trigger>
	<Tooltip.Content>
		At least one of the following external services need to be enabled: {serviceNames}
	</Tooltip.Content>
</Tooltip.Root>

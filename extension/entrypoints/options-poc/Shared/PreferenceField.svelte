<script lang="ts">
	import { Switch } from "@/svelte/components/ui/switch";
	import type { PreferenceFieldDefinition } from "../types";

	let {
		field,
		value,
		disabled = false,
		onChange,
	}: {
		field: PreferenceFieldDefinition;
		value: unknown;
		disabled?: boolean;
		onChange: (value: unknown) => void;
	} = $props();

	function handleInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement | HTMLSelectElement;

		if (field.type === "toggle") {
			onChange((target as HTMLInputElement).checked);
			return;
		}

		if (field.type === "number") {
			if (target.value === "" && field.allowEmpty) {
				onChange("");
				return;
			}

			onChange(target.value === "" ? 0 : Number(target.value));
			return;
		}

		onChange(target.value);
	}
</script>

<div class="rounded-2xl border border-border/70 bg-background/70 p-4">
	<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
		<div class="min-w-0 flex-1">
			<p class="text-sm font-medium text-foreground">{field.label}</p>
			{#if field.description}
				<p class="mt-1 text-sm text-muted-foreground">{field.description}</p>
			{/if}
		</div>

		<div class="w-full md:w-auto md:min-w-56">
			{#if field.type === "toggle"}
				<label class="inline-flex cursor-pointer items-center gap-3 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium">
					<Switch checked={Boolean(value)} {disabled} onCheckedChange={onChange} />
					<span>{value ? "Enabled" : "Disabled"}</span>
				</label>
			{:else if field.type === "radio"}
				<div class="space-y-2">
					{#each field.options ?? [] as option (option.value)}
						<label class="flex items-start gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-sm">
							<input
								type="radio"
								name={field.id}
								value={option.value}
								checked={String(value) === option.value}
								disabled={disabled}
								onchange={handleInput}
							/>
							<span class="min-w-0">
								<span class="block font-medium">{option.label}</span>
								<!--{#if option.description}-->
								<!--	<span class="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>-->
								<!--{/if}-->
							</span>
						</label>
					{/each}
				</div>
			{:else if field.type === "select"}
				<select
					class="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm"
					value={String(value ?? "")}
					disabled={disabled}
					onchange={handleInput}
				>
					{#each field.options ?? [] as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			{:else}
				<input
					type={field.type}
					class="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm"
					value={String(value ?? "")}
					placeholder={field.placeholder}
					min={field.min}
					max={field.max}
					step={field.step}
					disabled={disabled}
					oninput={handleInput}
				/>
			{/if}
		</div>
	</div>
</div>

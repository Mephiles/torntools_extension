<script lang="ts">
	import { Kbd, KbdGroup } from "@svelte/components/ui/kbd";
	import { Separator } from "@svelte/components/ui/separator";
	import { TORNTOOLS_FORUM_POST } from "@utils/functions/torn";
	import ContactLink from "./ContactLink.svelte";
</script>

<section class="rounded-lg border border-border bg-card py-2 px-3">
	<h2 class="text-lg font-bold">Contact</h2>

	<div class="mt-2 space-y-1">
		<p>
			Our source code is available on <ContactLink href="https://github.com/Mephiles/torntools_extension">GitHub</ContactLink>
			and licensed under the GNU General Public Licence. Our terms of service can be found
			<ContactLink href={browser.runtime.getURL("/tos.html")}>here</ContactLink>.
		</p>
		<p>
			We can be contacted through our <ContactLink href="https://discord.gg/ukyK6f6">Discord</ContactLink>
			or <ContactLink href={TORNTOOLS_FORUM_POST}>our forum post</ContactLink>.
		</p>
		<Separator class="my-1" />
		<div>
			<p>
				Suggestions and bug reports are important to keep improving TornTools. When reporting a bug, include:
			</p>
			<ul class="mt-1 pl-4 list-disc text-muted-foreground">
				<li>Screenshots of the bug in action.</li>
				<li>
					Screenshots of the console output.
					<ul class="pl-4 list-disc">
						<li>
							Console access via
							<KbdGroup>
								<Kbd>Ctrl + Shift + J</Kbd>
								<Kbd>F12</Kbd>
							</KbdGroup>
							, or right click -> inspect -> console.
						</li>
					</ul>
				</li>
			</ul>
		</div>
	</div>
</section>
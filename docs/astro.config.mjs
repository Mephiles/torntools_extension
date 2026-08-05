import mdx from "@astrojs/mdx";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://mephiles.github.io",
	base: "/torntools_extension",
	integrations: [
		starlight({
			title: "TornTools",
			description: "Documentation for the TornTools browser extension",
			logo: {
				src: "/src/assets/icon.svg",
			},
			social: [
				{ icon: "github", label: "GitHub", href: "https://github.com/Mephiles/torntools_extension" },
				{ icon: "discord", label: "Discord", href: "https://discord.gg/ukyK6f6" },
			],
			editLink: {
				baseUrl: "https://github.com/Mephiles/torntools_extension/edit/master/docs/",
			},
			components: {
				Footer: "./src/components/AIDisclaimer.astro",
			},
			sidebar: [
				{
					label: "Getting Started",
					items: [{ autogenerate: { directory: "getting-started" } }],
				},
				{
					label: "Features",
					collapsed: true,
					items: [{ autogenerate: { directory: "features" } }],
				},
				{
					label: "Settings",
					items: [{ autogenerate: { directory: "settings" } }],
				},
			],
		}),
		mdx(),
	],
});

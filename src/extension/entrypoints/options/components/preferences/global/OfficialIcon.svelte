<script lang="ts">
	interface OfficialIconProps {
		icon: number;
	}

	let { icon }: OfficialIconProps = $props();

	let offset = $derived(-((icon - 1) * 18));
</script>

<span class="icon" style="background-position: {offset}px 0"></span>

<style>
	.icon {
		background: url(https://torn.com/images/v2/svg_icons/sprites/user_status_icons_sprite.svg);
		width: 16px;
		height: 16px;
	}
</style>

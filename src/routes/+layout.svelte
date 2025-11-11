<script lang="ts">
	import '$lib/styles/global.css';
</script>

<slot />

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}
</style>

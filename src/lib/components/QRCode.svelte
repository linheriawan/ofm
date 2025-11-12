<script lang="ts">
	import { onMount } from 'svelte';
	import QRCodeLib from 'qrcode';

	// Props
	let {
		value = '',
		size = 200,
		errorCorrectionLevel = 'M' as 'L' | 'M' | 'Q' | 'H',
		margin = 1,
		darkColor = '#000000',
		lightColor = '#ffffff'
	} = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let error = $state('');

	// Generate QR code whenever value changes
	$effect(() => {
		if (canvas && value) {
			generateQR();
		}
	});

	async function generateQR() {
		if (!canvas || !value) return;

		try {
			error = '';
			await QRCodeLib.toCanvas(canvas, value, {
				width: size,
				margin: margin,
				errorCorrectionLevel: errorCorrectionLevel,
				color: {
					dark: darkColor,
					light: lightColor
				}
			});
		} catch (err) {
			console.error('QR Code generation error:', err);
			error = 'Failed to generate QR code';
		}
	}

	onMount(() => {
		generateQR();
	});
</script>

{#if error}
	<div class="qr-error" style="width: {size}px; height: {size}px;">
		<span>⚠️</span>
		<span class="error-text">{error}</span>
	</div>
{:else}
	<canvas
		bind:this={canvas}
		width={size}
		height={size}
		style="display: block; width: 100%; height: 100%;"
	></canvas>
{/if}

<style>
	.qr-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #fee;
		border: 2px dashed #c00;
		border-radius: 8px;
		gap: 0.5rem;
		font-size: 2rem;
	}

	.error-text {
		font-size: 0.75rem;
		color: #c00;
		text-align: center;
	}
</style>

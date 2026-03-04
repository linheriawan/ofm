<script lang="ts">
	interface Props {
		images: string[];
		alt?: string;
		autoplay?: boolean;
		interval?: number;
		showDots?: boolean;
		showArrows?: boolean;
	}

	let {
		images,
		alt = 'Image',
		autoplay = true,
		interval = 3000,
		showDots = true,
		showArrows = true
	}: Props = $props();

	let currentIndex = $state(0);
	let autoplayTimer: ReturnType<typeof setInterval> | null = null;

	function goToSlide(index: number) {
		currentIndex = index;
		resetAutoplay();
	}

	function nextSlide() {
		currentIndex = (currentIndex + 1) % images.length;
		resetAutoplay();
	}

	function prevSlide() {
		currentIndex = (currentIndex - 1 + images.length) % images.length;
		resetAutoplay();
	}

	function startAutoplay() {
		if (autoplay && images.length > 1) {
			autoplayTimer = setInterval(() => {
				currentIndex = (currentIndex + 1) % images.length;
			}, interval);
		}
	}

	function stopAutoplay() {
		if (autoplayTimer) {
			clearInterval(autoplayTimer);
			autoplayTimer = null;
		}
	}

	function resetAutoplay() {
		stopAutoplay();
		startAutoplay();
	}

	$effect(() => {
		startAutoplay();
		return () => stopAutoplay();
	});
</script>

<div class="carousel-container" onmouseenter={stopAutoplay} onmouseleave={startAutoplay}>
	<div class="carousel-slides">
		{#each images as image, index}
			<div class="carousel-slide {index === currentIndex ? 'active' : ''}">
				<img src={image} alt="{alt} {index + 1}" />
			</div>
		{/each}
	</div>

	{#if showArrows && images.length > 1}
		<button class="carousel-arrow prev" onclick={prevSlide} aria-label="Previous image">
			‹
		</button>
		<button class="carousel-arrow next" onclick={nextSlide} aria-label="Next image">
			›
		</button>
	{/if}

	{#if showDots && images.length > 1}
		<div class="carousel-dots">
			{#each images as _, index}
				<button
					class="carousel-dot {index === currentIndex ? 'active' : ''}"
					onclick={() => goToSlide(index)}
					aria-label="Go to image {index + 1}"
				></button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.carousel-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border-radius: 8px;
	}

	.carousel-slides {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.carousel-slide {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: opacity 0.5s ease-in-out;
	}

	.carousel-slide.active {
		opacity: 1;
		z-index: 1;
	}

	.carousel-slide img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.carousel-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(0, 0, 0, 0.5);
		color: white;
		border: none;
		font-size: 2rem;
		width: 40px;
		height: 40px;
		cursor: pointer;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		transition: all 0.2s;
		padding: 0;
		line-height: 1;
	}

	.carousel-arrow:hover {
		background: rgba(0, 0, 0, 0.8);
		transform: translateY(-50%) scale(1.1);
	}

	.carousel-arrow.prev {
		left: 1rem;
	}

	.carousel-arrow.next {
		right: 1rem;
	}

	.carousel-dots {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.5rem;
		z-index: 10;
	}

	.carousel-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.5);
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		padding: 0;
	}

	.carousel-dot:hover {
		background: rgba(255, 255, 255, 0.8);
		transform: scale(1.2);
	}

	.carousel-dot.active {
		background: white;
		width: 24px;
		border-radius: 5px;
	}
</style>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	export let initialLat = -6.2088; // Jakarta default
	export let initialLng = 106.8456;
	export let label = 'Select Location';
	export let placeholder = 'Search or click on map...';
	export let selectedAddress = '';

	const dispatch = createEventDispatcher();

	let mapContainer: HTMLDivElement;
	let map: any;
	let marker: any;
	let L: any;
	let searchQuery = selectedAddress;
	let suggestions: any[] = [];
	let isSearching = false;

	onMount(async () => {
		// Dynamically import Leaflet
		L = (await import('leaflet')).default;

		// Initialize map
		map = L.map(mapContainer).setView([initialLat, initialLng], 13);

		// Add OpenStreetMap tiles
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors',
			maxZoom: 19
		}).addTo(map);

		// Add marker
		marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

		// Handle marker drag
		marker.on('dragend', async () => {
			const position = marker.getLatLng();
			await reverseGeocode(position.lat, position.lng);
		});

		// Handle map click
		map.on('click', async (e: any) => {
			marker.setLatLng(e.latlng);
			await reverseGeocode(e.latlng.lat, e.latlng.lng);
		});

		// Initial reverse geocode
		if (!selectedAddress) {
			await reverseGeocode(initialLat, initialLng);
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});

	async function reverseGeocode(lat: number, lng: number) {
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
			);
			const data = await response.json();
			selectedAddress = data.display_name || `${lat}, ${lng}`;
			searchQuery = selectedAddress;

			dispatch('select', {
				address: selectedAddress,
				lat,
				lng
			});
		} catch (error) {
			console.error('Reverse geocode error:', error);
			selectedAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
			searchQuery = selectedAddress;
		}
	}

	async function searchLocation() {
		if (!searchQuery.trim() || searchQuery.length < 3) {
			suggestions = [];
			return;
		}

		isSearching = true;
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=id`
			);
			suggestions = await response.json();
		} catch (error) {
			console.error('Search error:', error);
			suggestions = [];
		} finally {
			isSearching = false;
		}
	}

	function selectSuggestion(suggestion: any) {
		const lat = parseFloat(suggestion.lat);
		const lng = parseFloat(suggestion.lon);

		searchQuery = suggestion.display_name;
		selectedAddress = suggestion.display_name;
		suggestions = [];

		if (map && marker) {
			map.setView([lat, lng], 15);
			marker.setLatLng([lat, lng]);
		}

		dispatch('select', {
			address: selectedAddress,
			lat,
			lng
		});
	}

	async function useCurrentLocation() {
		if ('geolocation' in navigator) {
			try {
				const position = await new Promise<GeolocationPosition>((resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						enableHighAccuracy: true,
						timeout: 5000,
						maximumAge: 0
					});
				});

				const lat = position.coords.latitude;
				const lng = position.coords.longitude;

				if (map && marker) {
					map.setView([lat, lng], 15);
					marker.setLatLng([lat, lng]);
				}

				await reverseGeocode(lat, lng);
			} catch (error) {
				console.error('Geolocation error:', error);
				alert('Unable to get your location. Please enable location services.');
			}
		} else {
			alert('Geolocation is not supported by your browser.');
		}
	}

	let debounceTimer: NodeJS.Timeout;
	function handleSearchInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			searchLocation();
		}, 500);
	}
</script>

<div class="location-picker">
	<label>{label}</label>

	<div class="search-container">
		<input
			type="text"
			bind:value={searchQuery}
			on:input={handleSearchInput}
			placeholder={placeholder}
			class="search-input"
		/>
		<button type="button" class="btn-geolocation" on:click={useCurrentLocation} title="Use current location">
			📍
		</button>
	</div>

	{#if isSearching}
		<div class="loading">Searching...</div>
	{/if}

	{#if suggestions.length > 0}
		<div class="suggestions">
			{#each suggestions as suggestion}
				<button
					type="button"
					class="suggestion-item"
					on:click={() => selectSuggestion(suggestion)}
				>
					{suggestion.display_name}
				</button>
			{/each}
		</div>
	{/if}

	<div class="map-container" bind:this={mapContainer}></div>

	{#if selectedAddress}
		<div class="selected-address">
			<strong>Selected:</strong> {selectedAddress}
		</div>
	{/if}
</div>

<style>
	.location-picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 500;
		color: #333;
	}

	.search-container {
		display: flex;
		gap: 0.5rem;
	}

	.search-input {
		flex: 1;
		padding: 0.75rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
	}

	.search-input:focus {
		outline: none;
		border-color: #667eea;
	}

	.btn-geolocation {
		padding: 0.75rem 1rem;
		border: 2px solid #667eea;
		border-radius: 8px;
		background: white;
		font-size: 1.2rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-geolocation:hover {
		background: #667eea;
		transform: scale(1.05);
	}

	.loading {
		padding: 0.5rem;
		color: #666;
		font-size: 0.9rem;
	}

	.suggestions {
		background: white;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		max-height: 200px;
		overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	.suggestion-item {
		width: 100%;
		padding: 0.75rem;
		border: none;
		background: white;
		text-align: left;
		cursor: pointer;
		transition: background 0.2s;
		border-bottom: 1px solid #f0f0f0;
	}

	.suggestion-item:hover {
		background: #f0f4ff;
	}

	.suggestion-item:last-child {
		border-bottom: none;
	}

	.map-container {
		width: 100%;
		height: 300px;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		overflow: hidden;
	}

	.selected-address {
		padding: 0.75rem;
		background: #f0f4ff;
		border-radius: 8px;
		font-size: 0.9rem;
		color: #333;
		word-wrap: break-word;
	}

	/* Override Leaflet default styles */
	:global(.leaflet-container) {
		font-family: inherit;
	}

	:global(.leaflet-popup-content-wrapper) {
		border-radius: 8px;
	}
</style>

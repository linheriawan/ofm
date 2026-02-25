<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { MeetingRoom } from '$lib/types';
	import { uploadImage, deleteFromStorage, isStorageUrl } from '$lib/utils/imageUpload';
	import { page } from '$app/stores';

	let title = 'Meeting Rooms Management - OFM';
	let isModalOpen = $state(false);
	let editingRoom: MeetingRoom | null = $state(null);

	const accessibleCompanies = $derived(($page.data.accessibleCompanies as any[]) ?? []);
	const selectedCompanyId = $derived(($page.data.selectedCompanyId as string) ?? '');

	let locations = $state<any[]>([]);

	let formData = $state({
		roomId: '',
		companyId: '',
		locationId: '',
		roomName: '',
		roomNumber: '',
		floor: '',
		capacity: 10,
		roomType: 'meeting',
		facilities: [] as string[],
		hasVideoConference: false,
		tabletDeviceId: '',
		status: 'available',
		imageUrls: [] as string[],
		videoBackgroundIds: [] as string[]
	});

	const filteredLocations = $derived(
		formData.companyId ? locations.filter((l) => l.companyId === formData.companyId) : locations
	);

	let imagePreviews = $state<string[]>([]);
	let uploadError = $state('');
	let isUploading = $state(false);

	// Video background management
	let availableVideos = $state<any[]>([]);
	let loadingVideos = $state(false);

	const columns = [
		{ key: 'roomId', label: 'Room ID' },
		{ key: 'roomName', label: 'Room Name' },
		{ key: 'locationId', label: 'Location' },
		{ key: 'roomNumber', label: 'Room Number' },
		{ key: 'floor', label: 'Floor' },
		{ key: 'capacity', label: 'Capacity' },
		{ key: 'roomType', label: 'Type' },
		{ key: 'status', label: 'Status' },
		{
			key: 'imageUrls',
			label: 'Photos',
			render: (value: string[]) => {
				if (!value || value.length === 0) return '-';
				return value.length === 1 ? '📷' : `📷 ×${value.length}`;
			}
		}
	];

	async function loadLocations() {
		try {
			const response = await fetch('/api/v1/locations?limit=100');
			const result = await response.json();
			if (result.success) {
				locations = result.data || [];
			}
		} catch (error) {
			console.error('Failed to load locations:', error);
		}
	}

	async function loadAvailableVideos() {
		loadingVideos = true;
		try {
			const response = await fetch('/api/v1/videos?activeOnly=true&limit=100');
			const result = await response.json();
			if (result.success) {
				availableVideos = result.data || [];
			}
		} catch (error) {
			console.error('Failed to load videos:', error);
		} finally {
			loadingVideos = false;
		}
	}

	async function openAddModal() {
		editingRoom = null;
		resetForm();
		isModalOpen = true;
		await Promise.all([loadLocations(), loadAvailableVideos()]);
	}

	async function openEditModal(room: MeetingRoom) {
		editingRoom = room;
		formData = {
			roomId: room.roomId,
			companyId: room.companyId,
			locationId: room.locationId,
			roomName: room.roomName,
			roomNumber: room.roomNumber || '',
			floor: room.floor || '',
			capacity: room.capacity,
			roomType: room.roomType,
			facilities: room.facilities || [],
			hasVideoConference: room.hasVideoConference,
			tabletDeviceId: room.tabletDeviceId || '',
			status: room.status,
			imageUrls: room.imageUrls || (room.imageUrl ? [room.imageUrl] : []), // backward compatibility
			videoBackgroundIds: room.videoBackgroundIds || []
		};
		imagePreviews = room.imageUrls || (room.imageUrl ? [room.imageUrl] : []);
		uploadError = '';
		isModalOpen = true;
		await Promise.all([loadLocations(), loadAvailableVideos()]);
	}

	function resetForm() {
		formData = {
			roomId: '',
			companyId: selectedCompanyId,
			locationId: '',
			roomName: '',
			roomNumber: '',
			floor: '',
			capacity: 10,
			roomType: 'meeting',
			facilities: [],
			hasVideoConference: false,
			tabletDeviceId: '',
			status: 'available',
			imageUrls: []
		};
		imagePreviews = [];
		uploadError = '';
	}

	// Handle image upload - uploads to object storage
	// Images are automatically compressed to max 1200px and 80% quality
	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;

		if (!files || files.length === 0) return;

		// Check if adding these files would exceed the max limit (5 images)
		if (imagePreviews.length + files.length > 5) {
			uploadError = `Maximum 5 images allowed. You can add ${5 - imagePreviews.length} more.`;
			return;
		}

		uploadError = '';
		isUploading = true;

		// Process each file
		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			// Validate file type
			if (!file.type.startsWith('image/')) {
				uploadError = 'Please upload image files only (jpg, png, etc.)';
				continue;
			}

			try {
				// Upload to storage
				const { url, error } = await uploadImage(
					file,
					formData.roomId || 'temp',
					`${Date.now()}-${i}`
				);

				if (error) {
					uploadError = `Failed to upload "${file.name}": ${error}`;
					console.error('Upload error:', error);
					continue;
				}

				// Add to arrays
				formData.imageUrls = [...formData.imageUrls, url];
				imagePreviews = [...imagePreviews, url];

				console.log(`Uploaded "${file.name}" → ${url}`);
			} catch (error) {
				uploadError = `Failed to process image "${file.name}"`;
				console.error('Image upload error:', error);
			}
		}

		isUploading = false;

		// Reset input to allow re-uploading same files
		input.value = '';
	}

	async function removeImage(index: number) {
		const imageUrl = formData.imageUrls[index];

		// Delete from storage if it is a storage URL
		if (isStorageUrl(imageUrl)) {
			const deleted = await deleteFromStorage(imageUrl);
			if (!deleted) {
				console.warn('Failed to delete image from storage, removing from UI');
			}
		}

		// Remove from arrays
		formData.imageUrls = formData.imageUrls.filter((_, i) => i !== index);
		imagePreviews = imagePreviews.filter((_, i) => i !== index);
		uploadError = '';
	}

	function toggleVideoSelection(videoId: string) {
		if (formData.videoBackgroundIds.includes(videoId)) {
			// Remove video
			formData.videoBackgroundIds = formData.videoBackgroundIds.filter(id => id !== videoId);
		} else {
			// Add video
			formData.videoBackgroundIds = [...formData.videoBackgroundIds, videoId];
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		const url = editingRoom ? `/api/v1/rooms/${editingRoom._id}` : '/api/v1/rooms';
		const method = editingRoom ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const result = await response.json();
			if (result.success) {
				isModalOpen = false;
				window.location.reload();
			} else {
				alert(result.error || 'Failed to save room');
			}
		} catch (error) {
			alert('Failed to save room');
		}
	}

	function closeModal() {
		isModalOpen = false;
		editingRoom = null;
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="rooms-page">
	<DataTable
		title="Meeting Rooms"
		{columns}
		apiEndpoint="/api/v1/rooms"
		onAdd={openAddModal}
		onEdit={openEditModal}
	/>
</div>

<Modal bind:isOpen={isModalOpen} title={editingRoom ? 'Edit Room' : 'Add New Room'} onClose={closeModal}>
	<form onsubmit={handleSubmit}>
		<div class="form-grid">
			<div class="form-group">
				<label for="roomId">Room ID</label>
				<input type="text" id="roomId" bind:value={formData.roomId} placeholder="Auto-generated" />
			</div>

			<div class="form-group">
				<label for="roomName">Room Name *</label>
				<input type="text" id="roomName" bind:value={formData.roomName} required placeholder="Board Room A" />
			</div>

			<div class="form-group">
				<label for="companyId">Company *</label>
				<select id="companyId" bind:value={formData.companyId} required onchange={() => { formData.locationId = ''; }}>
					<option value="">Select Company</option>
					{#each accessibleCompanies as company}
						<option value={company.companyId}>{company.companyName}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="locationId">Location *</label>
				<select id="locationId" bind:value={formData.locationId} required>
					<option value="">Select Location</option>
					{#each filteredLocations as location}
						<option value={location.locationId}>{location.locationName} — {location.city}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="roomNumber">Room Number</label>
				<input type="text" id="roomNumber" bind:value={formData.roomNumber} placeholder="A-301" />
			</div>

			<div class="form-group">
				<label for="floor">Floor</label>
				<input type="text" id="floor" bind:value={formData.floor} placeholder="3" />
			</div>

			<div class="form-group">
				<label for="capacity">Capacity *</label>
				<input type="number" id="capacity" bind:value={formData.capacity} required min="1" max="100" />
			</div>

			<div class="form-group">
				<label for="roomType">Room Type *</label>
				<select id="roomType" bind:value={formData.roomType} required>
					<option value="boardroom">Boardroom</option>
					<option value="conference">Conference</option>
					<option value="meeting">Meeting</option>
					<option value="training">Training</option>
					<option value="huddle">Huddle</option>
				</select>
			</div>

			<div class="form-group">
				<label for="status">Status *</label>
				<select id="status" bind:value={formData.status} required>
					<option value="available">Available</option>
					<option value="occupied">Occupied</option>
					<option value="maintenance">Maintenance</option>
					<option value="inactive">Inactive</option>
				</select>
			</div>

			<div class="form-group">
				<label for="tabletDeviceId">Tablet Device ID</label>
				<input type="text" id="tabletDeviceId" bind:value={formData.tabletDeviceId} placeholder="TAB-A301" />
			</div>

			<div class="form-group checkbox-group">
				<label>
					<input type="checkbox" bind:checked={formData.hasVideoConference} />
					Has Video Conference
				</label>
			</div>
		</div>

		<!-- Room Photos Upload -->
		<div class="photo-section">
			<label class="photo-label">Room Photos (up to 5)</label>
			<p class="photo-hint">Upload photos of the meeting room. Images will be automatically compressed and uploaded to cloud storage. First photo will be used as primary.</p>

			<!-- Image Previews Grid -->
			{#if imagePreviews.length > 0}
				<div class="images-grid">
					{#each imagePreviews as preview, index}
						<div class="image-preview-item">
							<img src={preview} alt="Room preview {index + 1}" />
							<button type="button" class="btn-remove-image" onclick={() => removeImage(index)} title="Remove image">
								✕
							</button>
							{#if index === 0}
								<span class="primary-badge">Primary</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<!-- Upload Area (show if less than 5 images) -->
			{#if imagePreviews.length < 5}
				<div class="upload-area">
					<input
						type="file"
						id="roomImages"
						accept="image/*"
						multiple
						onchange={handleImageUpload}
						class="file-input"
						disabled={isUploading}
					/>
					<label for="roomImages" class="upload-label {isUploading ? 'uploading' : ''}">
						{#if isUploading}
							<span class="upload-icon">⏳</span>
							<span>Uploading images...</span>
						{:else}
							<span class="upload-icon">📷</span>
							<span>Click to upload room photos ({imagePreviews.length}/5)</span>
						{/if}
					</label>
				</div>
			{/if}

			{#if uploadError}
				<div class="upload-error">{uploadError}</div>
			{/if}
		</div>

		<!-- Background Videos Section -->
		<div class="form-section">
			<h3>Background Videos</h3>
			<p class="section-hint">Select videos to display on the room tablet. Videos will rotate automatically.</p>

			{#if loadingVideos}
				<div class="loading-videos">
					<span class="spinner-small"></span>
					<span>Loading available videos...</span>
				</div>
			{:else if availableVideos.length === 0}
				<div class="no-videos">
					<p>No active videos available.</p>
					<a href="/admin/videos" target="_blank" class="link-add-video">Upload videos →</a>
				</div>
			{:else}
				<div class="video-selector-grid">
					{#each availableVideos as video}
						<button
							type="button"
							class="video-selector-item {formData.videoBackgroundIds.includes(video._id) ? 'selected' : ''}"
							onclick={() => toggleVideoSelection(video._id)}
						>
							<div class="video-thumbnail">
								{#if video.thumbnailUrl}
									<img src={video.thumbnailUrl} alt={video.videoName} />
								{:else}
									<div class="video-placeholder">🎬</div>
								{/if}
								{#if formData.videoBackgroundIds.includes(video._id)}
									<div class="selected-badge">✓</div>
								{/if}
							</div>
							<div class="video-info">
								<div class="video-name">{video.videoName}</div>
								{#if video.duration}
									<div class="video-duration">
										{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
									</div>
								{/if}
							</div>
						</button>
					{/each}
				</div>

				{#if formData.videoBackgroundIds.length > 0}
					<p class="selected-count">{formData.videoBackgroundIds.length} video(s) selected</p>
				{/if}
			{/if}
		</div>

		<div class="form-actions">
			<button type="button" class="btn-secondary" onclick={closeModal}>Cancel</button>
			<button type="submit" class="btn-primary">{editingRoom ? 'Update' : 'Create'} Room</button>
		</div>
	</form>
</Modal>

<style>
	.rooms-page {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
	}

	.form-group input,
	.form-group select {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #667eea;
	}

	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.checkbox-group input[type='checkbox'] {
		width: auto;
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #333;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	/* Photo Upload Section */
	.photo-section {
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.photo-label {
		font-weight: 600;
		color: #333;
		font-size: 1rem;
		display: block;
		margin-bottom: 0.25rem;
	}

	.photo-hint {
		color: #666;
		font-size: 0.85rem;
		margin: 0 0 1rem 0;
	}

	.upload-area {
		position: relative;
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		transition: all 0.2s;
		background: #fafafa;
	}

	.upload-area:hover {
		border-color: #667eea;
		background: #f9fafb;
	}

	.file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		overflow: hidden;
	}

	.upload-label {
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: #666;
		font-weight: 500;
	}

	.upload-label.uploading {
		cursor: not-allowed;
		opacity: 0.7;
		color: #667eea;
	}

	.upload-icon {
		font-size: 2.5rem;
	}

	.images-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.image-preview-item {
		position: relative;
		border-radius: 8px;
		overflow: hidden;
		border: 2px solid #e2e8f0;
		aspect-ratio: 4/3;
		transition: all 0.2s;
	}

	.image-preview-item:hover {
		border-color: #667eea;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
	}

	.image-preview-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.btn-remove-image {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(239, 68, 68, 0.9);
		color: white;
		border: none;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		font-size: 1.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		line-height: 1;
		padding: 0;
		z-index: 10;
	}

	.btn-remove-image:hover {
		background: rgba(220, 38, 38, 1);
		transform: scale(1.1);
	}

	.primary-badge {
		position: absolute;
		bottom: 0.5rem;
		left: 0.5rem;
		background: rgba(16, 185, 129, 0.9);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		z-index: 10;
	}

	.upload-error {
		color: #ef4444;
		background: #fef2f2;
		padding: 0.75rem;
		border-radius: 6px;
		margin-top: 0.5rem;
		font-size: 0.9rem;
		border: 1px solid #fecaca;
	}

	/* Video Selector Styles */
	.form-section {
		grid-column: 1 / -1;
		margin-top: 1rem;
	}

	.form-section h3 {
		font-size: 1.1rem;
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.section-hint {
		color: #666;
		font-size: 0.85rem;
		margin: 0 0 1rem 0;
	}

	.video-selector-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}

	.video-selector-item {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		padding: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.video-selector-item:hover {
		border-color: #667eea;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
	}

	.video-selector-item.selected {
		border-color: #667eea;
		background: #f0f4ff;
	}

	.video-thumbnail {
		position: relative;
		width: 100%;
		aspect-ratio: 16/9;
		background: #f9fafb;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.video-thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.video-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
	}

	.selected-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 24px;
		height: 24px;
		background: #48bb78;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.9rem;
	}

	.video-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.video-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: #333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.video-duration {
		font-size: 0.75rem;
		color: #666;
	}

	.loading-videos {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 2rem;
		justify-content: center;
		color: #666;
	}

	.spinner-small {
		width: 20px;
		height: 20px;
		border: 2px solid #e0e7ff;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.no-videos {
		text-align: center;
		padding: 2rem;
		color: #666;
	}

	.link-add-video {
		color: #667eea;
		text-decoration: none;
		font-weight: 600;
	}

	.link-add-video:hover {
		text-decoration: underline;
	}

	.selected-count {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #f0f4ff;
		border-radius: 6px;
		color: #667eea;
		font-weight: 600;
		text-align: center;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { MeetingRoom } from '$lib/types';

	let title = 'Meeting Rooms Management - OFM';
	let isModalOpen = $state(false);
	let editingRoom: MeetingRoom | null = $state(null);
	let formData = $state({
		roomId: '',
		companyId: 'IAS',
		locationId: 'LOC-CGK',
		roomName: '',
		roomNumber: '',
		floor: '',
		capacity: 10,
		roomType: 'meeting',
		facilities: [] as string[],
		hasVideoConference: false,
		tabletDeviceId: '',
		status: 'available',
		imageUrl: ''
	});

	let imagePreview = $state('');
	let uploadError = $state('');

	const columns = [
		{ key: 'roomId', label: 'Room ID' },
		{ key: 'roomName', label: 'Room Name' },
		{ key: 'roomNumber', label: 'Room Number' },
		{ key: 'floor', label: 'Floor' },
		{ key: 'capacity', label: 'Capacity' },
		{ key: 'roomType', label: 'Type' },
		{ key: 'status', label: 'Status' },
		{
			key: 'imageUrl',
			label: 'Photo',
			render: (value: string) => value ? '📷' : '-'
		}
	];

	function openAddModal() {
		editingRoom = null;
		resetForm();
		isModalOpen = true;
	}

	function openEditModal(room: MeetingRoom) {
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
			imageUrl: room.imageUrl || ''
		};
		imagePreview = room.imageUrl || '';
		uploadError = '';
		isModalOpen = true;
	}

	function resetForm() {
		formData = {
			roomId: '',
			companyId: 'IAS',
			locationId: 'LOC-CGK',
			roomName: '',
			roomNumber: '',
			floor: '',
			capacity: 10,
			roomType: 'meeting',
			facilities: [],
			hasVideoConference: false,
			tabletDeviceId: '',
			status: 'available',
			imageUrl: ''
		};
		imagePreview = '';
		uploadError = '';
	}

	// Handle image upload - converts to base64 for MongoDB storage
	// TODO: Migrate to S3 storage later for better scalability
	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			uploadError = 'Please upload an image file (jpg, png, etc.)';
			return;
		}

		// Validate file size (max 500KB for base64 storage)
		const maxSize = 500 * 1024; // 500KB
		if (file.size > maxSize) {
			uploadError = `Image too large (${(file.size / 1024).toFixed(0)}KB). Please use an image smaller than 500KB.`;
			return;
		}

		uploadError = '';

		// Convert to base64
		const reader = new FileReader();
		reader.onload = (e) => {
			const base64 = e.target?.result as string;
			formData.imageUrl = base64;
			imagePreview = base64;
		};
		reader.onerror = () => {
			uploadError = 'Failed to read image file';
		};
		reader.readAsDataURL(file);
	}

	function removeImage() {
		formData.imageUrl = '';
		imagePreview = '';
		uploadError = '';
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

		<!-- Room Photo Upload -->
		<div class="photo-section">
			<label class="photo-label">Room Photo</label>
			<p class="photo-hint">Upload a photo of the meeting room (max 500KB, jpg/png)</p>

			{#if imagePreview}
				<div class="image-preview">
					<img src={imagePreview} alt="Room preview" />
					<button type="button" class="btn-remove-image" onclick={removeImage} title="Remove image">
						✕
					</button>
				</div>
			{:else}
				<div class="upload-area">
					<input
						type="file"
						id="roomImage"
						accept="image/*"
						onchange={handleImageUpload}
						class="file-input"
					/>
					<label for="roomImage" class="upload-label">
						<span class="upload-icon">📷</span>
						<span>Click to upload room photo</span>
					</label>
				</div>
			{/if}

			{#if uploadError}
				<div class="upload-error">{uploadError}</div>
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

	.upload-icon {
		font-size: 2.5rem;
	}

	.image-preview {
		position: relative;
		border-radius: 8px;
		overflow: hidden;
		max-width: 400px;
		border: 1px solid #e2e8f0;
	}

	.image-preview img {
		width: 100%;
		height: auto;
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
	}

	.btn-remove-image:hover {
		background: rgba(220, 38, 38, 1);
		transform: scale(1.1);
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

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

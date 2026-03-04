<script lang="ts">
	import { onMount } from 'svelte';
	import { uploadVideo, deleteFromStorage, isStorageUrl } from '$lib/utils/imageUpload';
	import DataTable from '$lib/components/DataTable.svelte';

	let title = 'Background Videos - OFM';
	let showUploadModal = $state(false);
	let uploading = $state(false);
	let uploadProgress = $state('');

	// Form state
	let formData = $state({
		videoName: '',
		description: '',
		areaTag: 'all',
		videoFile: null as File | null,
		isActive: true
	});

	const areaTags = [
		{ value: 'all', label: 'All Locations' },
		{ value: 'jakarta', label: 'Jakarta' },
		{ value: 'surabaya', label: 'Surabaya' },
		{ value: 'bandung', label: 'Bandung' },
		{ value: 'medan', label: 'Medan' }
	];

	const columns = [
		{
			key: 'videoName',
			label: 'Video Name',
			render: (value: string, row: any) => {
				return `<div style="display: flex; align-items: center; gap: 0.75rem;">
					<div style="width: 80px; height: 45px; background: #f0f4ff; border-radius: 6px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
						${row.thumbnailUrl ? `<img src="${row.thumbnailUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : '🎬'}
					</div>
					<div>
						<div style="font-weight: 600;">${value}</div>
						${row.description ? `<div style="font-size: 0.85rem; color: #666;">${row.description}</div>` : ''}
					</div>
				</div>`;
			}
		},
		{
			key: 'areaTag',
			label: 'Area',
			render: (value: string) => {
				const tag = areaTags.find(t => t.value === value);
				return tag ? tag.label : value;
			}
		},
		{
			key: 'duration',
			label: 'Duration',
			render: (value: number) => {
				if (!value) return '-';
				const minutes = Math.floor(value / 60);
				const seconds = value % 60;
				return `${minutes}:${seconds.toString().padStart(2, '0')}`;
			}
		},
		{
			key: 'fileSize',
			label: 'Size',
			render: (value: number) => {
				if (!value) return '-';
				return `${(value / 1024 / 1024).toFixed(1)} MB`;
			}
		},
		{
			key: 'isActive',
			label: 'Status',
			render: (value: boolean) => {
				return value ? '✅ Active' : '⚠️ Inactive';
			}
		},
		{
			key: 'createdAt',
			label: 'Created',
			render: (value: Date) => {
				return new Date(value).toLocaleDateString('id-ID');
			}
		}
	];

	function openUploadModal() {
		resetForm();
		showUploadModal = true;
	}

	function closeUploadModal() {
		showUploadModal = false;
		resetForm();
	}

	function resetForm() {
		formData = {
			videoName: '',
			description: '',
			areaTag: 'all',
			videoFile: null,
			isActive: true
		};
		uploadProgress = '';
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			formData.videoFile = target.files[0];

			// Auto-fill video name from filename if empty
			if (!formData.videoName) {
				const fileName = target.files[0].name.replace(/\.[^/.]+$/, ''); // Remove extension
				formData.videoName = fileName.replace(/[_-]/g, ' '); // Replace _ and - with spaces
			}
		}
	}

	async function handleUpload() {
		if (!formData.videoFile) {
			alert('Please select a video file');
			return;
		}

		if (!formData.videoName.trim()) {
			alert('Please enter a video name');
			return;
		}

		uploading = true;
		uploadProgress = 'Uploading video to storage...';

		try {
			// Upload video to storage
			const { url, error: uploadError } = await uploadVideo(
				formData.videoFile,
				'background-videos'
			);

			if (uploadError) {
				alert(`Upload failed: ${uploadError}`);
				uploading = false;
				return;
			}

			uploadProgress = 'Saving video metadata...';

			// Generate video ID
			const videoId = 'VID-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9).toUpperCase();

			// Get video metadata
			const videoElement = document.createElement('video');
			videoElement.src = URL.createObjectURL(formData.videoFile);

			await new Promise((resolve) => {
				videoElement.onloadedmetadata = resolve;
			});

			const duration = Math.floor(videoElement.duration);
			const fileSize = formData.videoFile.size;

			// Save to database
			const response = await fetch('/api/v1/videos', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					videoId,
					videoName: formData.videoName.trim(),
					description: formData.description.trim(),
					videoUrl: url,
					duration,
					fileSize,
					areaTag: formData.areaTag,
					isActive: formData.isActive
				})
			});

			const result = await response.json();

			if (result.success) {
				alert('Video uploaded successfully!');
				closeUploadModal();
				// Reload the table
				window.location.reload();
			} else {
				alert(`Failed to save video: ${result.error}`);
			}
		} catch (error) {
			console.error('Upload error:', error);
			alert('An error occurred during upload');
		} finally {
			uploading = false;
			uploadProgress = '';
		}
	}

	async function handleToggleActive(video: any) {
		try {
			const response = await fetch(`/api/v1/videos/${video._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					isActive: !video.isActive
				})
			});

			const result = await response.json();

			if (result.success) {
				alert(`Video ${!video.isActive ? 'activated' : 'deactivated'} successfully`);
				window.location.reload();
			} else {
				alert(`Failed to update video: ${result.error}`);
			}
		} catch (error) {
			console.error('Toggle error:', error);
			alert('An error occurred');
		}
	}

	async function handleDelete(video: any) {
		if (!confirm(`Delete video "${video.videoName}"? This action cannot be undone.`)) {
			return;
		}

		try {
			// Delete from database
			const response = await fetch(`/api/v1/videos/${video._id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				// Delete from storage
				if (isStorageUrl(video.videoUrl)) {
					await deleteFromStorage(video.videoUrl);
				}

				alert('Video deleted successfully');
				window.location.reload();
			} else {
				alert(`Failed to delete video: ${result.error}`);
			}
		} catch (error) {
			console.error('Delete error:', error);
			alert('An error occurred while deleting');
		}
	}

	const customActions = [
		{
			label: (row: any) => row.isActive ? 'Deactivate' : 'Activate',
			onClick: handleToggleActive
		},
		{
			label: 'Delete',
			onClick: handleDelete,
			className: 'danger'
		}
	];
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="videos-page">
	<div class="page-header">
		<div>
			<h1>Background Videos</h1>
			<p class="subtitle">Manage video backgrounds for room displays</p>
		</div>
		<button class="btn-primary" onclick={openUploadModal}>
			+ Upload Video
		</button>
	</div>

	<DataTable
		title="Video Library"
		{columns}
		apiEndpoint="/api/v1/videos"
		{customActions}
	/>
</div>

<!-- Upload Modal -->
{#if showUploadModal}
	<div class="modal-overlay" onclick={closeUploadModal}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Upload Background Video</h2>
				<button class="modal-close" onclick={closeUploadModal}>×</button>
			</div>

			<div class="modal-body">
				<div class="form-group">
					<label for="videoFile">Video File: *</label>
					<input
						type="file"
						id="videoFile"
						accept="video/*"
						onchange={handleFileSelect}
						disabled={uploading}
					/>
					<p class="help-text">Supported formats: MP4, WebM, MOV. Max size: 50MB</p>
				</div>

				<div class="form-group">
					<label for="videoName">Video Name: *</label>
					<input
						type="text"
						id="videoName"
						bind:value={formData.videoName}
						placeholder="e.g., Jakarta Skyline"
						disabled={uploading}
					/>
				</div>

				<div class="form-group">
					<label for="description">Description:</label>
					<textarea
						id="description"
						bind:value={formData.description}
						placeholder="Brief description of the video"
						rows="3"
						disabled={uploading}
					></textarea>
				</div>

				<div class="form-group">
					<label for="areaTag">Area Tag:</label>
					<select id="areaTag" bind:value={formData.areaTag} disabled={uploading}>
						{#each areaTags as tag}
							<option value={tag.value}>{tag.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={formData.isActive} disabled={uploading} />
						<span>Active (visible for room assignment)</span>
					</label>
				</div>

				{#if uploadProgress}
					<div class="upload-progress">
						<div class="spinner"></div>
						<p>{uploadProgress}</p>
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="btn-secondary" onclick={closeUploadModal} disabled={uploading}>
					Cancel
				</button>
				<button class="btn-primary" onclick={handleUpload} disabled={uploading || !formData.videoFile}>
					{uploading ? 'Uploading...' : 'Upload Video'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.videos-page {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #333;
	}

	.subtitle {
		color: #666;
		margin: 0.5rem 0 0 0;
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		width: 90%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 2rem;
		cursor: pointer;
		color: #666;
		line-height: 1;
		padding: 0;
		width: 32px;
		height: 32px;
	}

	.modal-close:hover {
		color: #333;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-footer {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.form-group input[type="text"],
	.form-group input[type="file"],
	.form-group textarea,
	.form-group select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus {
		outline: none;
		border-color: #667eea;
	}

	.form-group input:disabled,
	.form-group textarea:disabled,
	.form-group select:disabled {
		background: #f9fafb;
		cursor: not-allowed;
	}

	.help-text {
		font-size: 0.85rem;
		color: #666;
		margin: 0.5rem 0 0 0;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-weight: normal;
	}

	.checkbox-label input[type="checkbox"] {
		width: auto;
		cursor: pointer;
	}

	.btn-secondary {
		padding: 0.75rem 1.5rem;
		background: #f3f4f6;
		color: #333;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #e5e7eb;
	}

	.upload-progress {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #f0f4ff;
		border-radius: 8px;
		margin-top: 1rem;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid #e0e7ff;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.upload-progress p {
		margin: 0;
		color: #667eea;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			gap: 1rem;
		}

		.modal-content {
			width: 95%;
		}
	}
</style>

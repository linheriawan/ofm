<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import { goto } from '$app/navigation';

	let title = 'Device Management - OFM';

	const columns = [
		{ key: 'deviceId', label: 'Device ID' },
		{ key: 'deviceName', label: 'Device Name' },
		{
			key: 'roomId',
			label: 'Assigned Room',
			render: (value: string) => value || 'Not assigned'
		},
		{
			key: 'status',
			label: 'Status',
			render: (value: string) => {
				const statusMap: Record<string, string> = {
					active: '✓ Active',
					pending: '⏳ Pending',
					inactive: '⚠️ Inactive'
				};
				return statusMap[value] || value;
			}
		},
		{
			key: 'assignedAt',
			label: 'Assigned At',
			render: (value: Date) => {
				if (!value) return '-';
				return new Date(value).toLocaleString('id-ID');
			}
		},
		{
			key: 'lastSeen',
			label: 'Last Seen',
			render: (value: Date) => {
				if (!value) return '-';
				const diff = Date.now() - new Date(value).getTime();
				const minutes = Math.floor(diff / 60000);

				if (minutes < 1) return 'Just now';
				if (minutes < 60) return `${minutes}m ago`;

				const hours = Math.floor(minutes / 60);
				if (hours < 24) return `${hours}h ago`;

				const days = Math.floor(hours / 24);
				return `${days}d ago`;
			}
		}
	];

	function handleReassign(device: any) {
		goto(`/admin/devices/assign?deviceId=${device.deviceId}`);
	}

	async function handleUnassign(device: any) {
		if (!confirm(`Unassign device "${device.deviceName || device.deviceId}" from its room?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/v1/devices/${device.deviceId}/assignment`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				alert('Device unassigned successfully');
				window.location.reload();
			} else {
				alert(result.error || 'Failed to unassign device');
			}
		} catch (error) {
			alert('Failed to unassign device');
			console.error('Error unassigning device:', error);
		}
	}

	// Custom actions for DataTable
	const customActions = [
		{
			label: 'Reassign',
			onClick: handleReassign,
			condition: (device: any) => device.status !== 'inactive'
		},
		{
			label: 'Unassign',
			onClick: handleUnassign,
			condition: (device: any) => device.roomId
		}
	];
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="devices-page">
	<div class="page-header">
		<div>
			<h1>Device Management</h1>
			<p class="subtitle">Manage display devices assigned to meeting rooms</p>
		</div>
	</div>

	<div class="info-cards">
		<div class="info-card">
			<div class="card-icon">📱</div>
			<div class="card-content">
				<div class="card-label">Setup New Device</div>
				<div class="card-value">
					Open <code>/display/assign</code> on the device to see QR code
				</div>
			</div>
		</div>
		<div class="info-card">
			<div class="card-icon">📷</div>
			<div class="card-content">
				<div class="card-label">Assign Device</div>
				<div class="card-value">
					Scan the QR code to assign device to a room
				</div>
			</div>
		</div>
		<input type="text" placeholder="Device ID"/>
		
	</div>

	<DataTable
		title="Registered Devices"
		{columns}
		apiEndpoint="/api/v1/devices"
		{customActions}
	/>
</div>

<style>
	.devices-page {
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

	.info-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.info-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1.5rem;
		border-radius: 12px;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.card-icon {
		font-size: 3rem;
		opacity: 0.9;
	}

	.card-content {
		flex: 1;
	}

	.card-label {
		font-size: 0.9rem;
		opacity: 0.9;
		margin-bottom: 0.25rem;
	}

	.card-value {
		font-size: 1.1rem;
		font-weight: 600;
	}

	.card-value code {
		background: rgba(255, 255, 255, 0.2);
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
	}

	@media (max-width: 768px) {
		.info-cards {
			grid-template-columns: 1fr;
		}
	}
</style>

<script lang="ts">
	import { goto } from '$app/navigation';
	import DataTable from '$lib/components/DataTable.svelte';
	import type { TransportationBooking } from '$lib/types';

	let title = 'Transportation Bookings - OFM';

	// DataTable columns with custom rendering
	const columns = [
		{ key: 'requestNumber', label: 'Booking ID' },
		{
			key: 'scheduledTime',
			label: 'Date & Time',
			render: (val: Date | string) => {
				const date = new Date(val);
				const dateStr = date.toLocaleDateString('id-ID', {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				});
				const timeStr = date.toLocaleTimeString('id-ID', {
					hour: '2-digit',
					minute: '2-digit'
				});
				return `<div>${dateStr}<br/><small style="color: #888">${timeStr}</small></div>`;
			}
		},
		{
			key: 'pickup',
			label: 'From',
			format: (val: any) => val?.address || '-'
		},
		{
			key: 'destination',
			label: 'To',
			format: (val: any) => val?.address || '-'
		},
		{
			key: 'type',
			label: 'Vehicle',
			render: (val: string, row: any) => {
				if (val === 'voucher') {
					return `<span class="badge-type">Voucher</span>${row.voucherCode ? `<br/><small>${row.voucherCode}</small>` : ''}`;
				} else {
					return row.vehicleId || '-';
				}
			}
		},
		{
			key: 'driverId',
			label: 'Driver',
			format: (val: string, row: any) => {
				if (row.type === 'voucher') return '-';
				if (val) return val;
				return 'Self-Drive';
			}
		},
		{
			key: 'passengerCount',
			label: 'Passengers'
		},
		{
			key: 'status',
			label: 'Status',
			render: (val: string) => {
				const color = getStatusColor(val);
				return `<span class="status-badge status-${color}">${val}</span>`;
			}
		}
	];

	// DataTable filters
	const filters = [
		{
			key: 'status',
			label: 'Status',
			type: 'select' as const,
			options: [
				{ value: 'pending', label: 'Pending' },
				{ value: 'approved', label: 'Approved' },
				{ value: 'rejected', label: 'Rejected' },
				{ value: 'completed', label: 'Completed' },
				{ value: 'cancelled', label: 'Cancelled' }
			]
		},
		{
			key: 'date',
			label: 'Date Range',
			type: 'daterange' as const
		}
	];

	// DataTable actions
	const actions = [
		{
			label: 'Edit',
			class: 'btn-view',
			onClick: openEditRequest
		},
		{
			label: 'Cancel',
			class: 'btn-cancel',
			onClick: handleCancel,
			show: (booking: any) => booking.status === 'pending' || booking.status === 'approved'
		}
	];

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			pending: 'blue',
			approved: 'green',
			rejected: 'red',
			completed: 'gray',
			cancelled: 'red'
		};
		return colors[status] || 'gray';
	}

	function openCreateRequest() {
		goto('/transportation/request');
	}

	function openEditRequest(booking: TransportationBooking) {
		goto(`/transportation/request?id=${booking._id}`);
	}

	async function handleCancel(booking: any) {
		if (!confirm('Are you sure you want to cancel this booking?')) return;

		try {
			const response = await fetch(`/api/v1/transport/requests/${booking._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'cancel' })
			});

			const result = await response.json();
			if (result.success) {
				window.location.reload();
			} else {
				alert(result.error?.message || 'Failed to cancel booking');
			}
		} catch (err) {
			alert('An error occurred while canceling the booking');
			console.error(err);
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="bookings-page">
	<DataTable
		title="Transportation Requests"
		{columns}
		apiEndpoint="/api/v1/transport/requests"
		{filters}
		{actions}
		onAdd={openCreateRequest}
		addButtonLabel="New Request"
	/>
</div>


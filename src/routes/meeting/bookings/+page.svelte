<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import MeetingBookingForm from '$lib/components/MeetingBookingForm.svelte';

	let title = 'Meeting Bookings - OFM';

	// Modal state
	let showFormModal = $state(false);
	let selectedBooking: any | null = $state(null);

	// DataTable columns with custom rendering
	const columns = [
		{ key: 'requestNumber', label: 'Request #' },
		{ key: 'title', label: 'Meeting Title' },
		{ key: 'roomId', label: 'Room', format: (val: string) => val || '-' },
		{
			key: 'type',
			label: 'Type',
			render: (val: string) => `<span class="badge badge-type">${val}</span>`
		},
		{
			key: 'startTime',
			label: 'Start Time',
			format: (val: Date | string) =>
				new Date(val).toLocaleString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
		},
		{
			key: 'endTime',
			label: 'End Time',
			format: (val: Date | string) =>
				new Date(val).toLocaleString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
		},
		{
			key: 'status',
			label: 'Status',
			render: (val: string) => {
				const statusClass = getStatusClass(val);
				return `<span class="badge ${statusClass}">${val}</span>`;
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
			key: 'type',
			label: 'Meeting Type',
			type: 'select' as const,
			options: [
				{ value: 'offline', label: 'Offline' },
				{ value: 'online', label: 'Online' },
				{ value: 'hybrid', label: 'Hybrid' }
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
			onClick: openEditModal
		},
		{
			label: 'Cancel',
			class: 'btn-cancel',
			onClick: handleCancel,
			show: (booking: any) => booking.status === 'pending' || booking.status === 'approved'
		}
	];

	function getStatusClass(status: string) {
		switch (status) {
			case 'pending':
				return 'badge-scheduled';
			case 'approved':
				return 'badge-ongoing';
			case 'completed':
				return 'badge-completed';
			case 'cancelled':
			case 'rejected':
				return 'badge-cancelled';
			default:
				return '';
		}
	}

	function openCreateModal() {
		selectedBooking = null;
		showFormModal = true;
	}

	function openEditModal(booking: any) {
		selectedBooking = booking;
		showFormModal = true;
	}

	function handleFormSuccess() {
		showFormModal = false;
		selectedBooking = null;
		// DataTable will auto-refresh on next render
		window.location.reload();
	}

	function closeModal() {
		showFormModal = false;
		selectedBooking = null;
	}

	async function handleCancel(booking: any) {
		if (!confirm('Are you sure you want to cancel this booking?')) return;

		try {
			const response = await fetch(`/api/v1/meeting/requests/${booking._id}`, {
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

<div class="bookings-container">
	<DataTable
		title="Meeting Bookings"
		{columns}
		apiEndpoint="/api/v1/meeting/requests"
		{filters}
		{actions}
		onAdd={openCreateModal}
		addButtonLabel="New Booking"
	/>
</div>

<!-- Unified Form Modal (for Create/View/Edit) -->
{#if showFormModal}
	<Modal
		isOpen={showFormModal}
		title={selectedBooking ? 'Edit Meeting Booking' : 'Create Meeting Booking'}
		onClose={closeModal}
		width="80%"
	>
		<MeetingBookingForm
			booking={selectedBooking}
			onSuccess={handleFormSuccess}
			onCancel={closeModal}
		/>
	</Modal>
{/if}


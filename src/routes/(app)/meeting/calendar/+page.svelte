<script lang="ts">
	import { onMount } from 'svelte';

	const COLORS = ['#667eea','#48bb78','#f6ad55','#ed64a6','#4299e1','#9f7aea','#f56565','#38b2ac'];

	interface CalendarRoom    { id: string; name: string; color: string; locationId: string; }
	interface CalendarBooking { id: string; roomId: string; title: string; startTime: Date; endTime: Date; organizer: string; status: string; }
	interface CalLocation     { id: string; name: string; }

	let currentDate  = $state(new Date());
	let selectedRoom = $state('all');
	let selectedLoc  = $state('all');
	let selectedStatus = $state('active'); // 'active' = approved+pending, or specific status

	let rooms:    CalendarRoom[]    = $state([]);
	let bookings: CalendarBooking[] = $state([]);
	let locations: CalLocation[]    = $state([]);

	const STATUS_COLORS: Record<string, string> = {
		approved: '',   // uses room color
		pending:  '',   // uses room color with lower opacity + dashed border
		completed: '#94a3b8',
	};

	onMount(async () => {
		const [rRes, bRes, lRes] = await Promise.allSettled([
			fetch('/api/v1/rooms?limit=1000').then(r => r.json()),
			fetch(`/api/v1/meeting/requests?limit=1000`).then(r => r.json()),
			fetch('/api/v1/locations?limit=1000').then(r => r.json()),
		]);

		if (rRes.status === 'fulfilled' && rRes.value.success) {
			rooms = (rRes.value.data ?? []).map((r: any, i: number) => ({
				id: r.roomId || r._id,
				name: r.roomName || r.roomId,
				color: COLORS[i % COLORS.length],
				locationId: r.locationId || ''
			}));
		}
		if (bRes.status === 'fulfilled' && bRes.value.success) {
			bookings = (bRes.value.data ?? [])
				.filter((b: any) => b.roomId && !['rejected','cancelled'].includes(b.status))
				.map((b: any) => ({
					id: b._id,
					roomId: b.roomId,
					title: b.title,
					startTime: new Date(b.startTime),
					endTime: new Date(b.endTime),
					organizer: b.userName || b.userEmail || '',
					status: b.status || 'pending'
				}));
		}
		if (lRes.status === 'fulfilled' && lRes.value.success) {
			locations = (lRes.value.data ?? []).map((l: any) => ({
				id: l.locationId || l._id,
				name: l.locationName || l.name || l.locationId
			}));
		}
	});

	const filteredRooms = $derived(
		selectedLoc === 'all' ? rooms : rooms.filter(r => r.locationId === selectedLoc)
	);

	const visibleRoomIds = $derived(
		filteredRooms.map(r => r.id)
	);

	const filteredBookings = $derived((() => {
		let b = bookings.filter(b => visibleRoomIds.includes(b.roomId));
		if (selectedRoom !== 'all') b = b.filter(b => b.roomId === selectedRoom);
		if (selectedStatus !== 'active') b = b.filter(b => b.status === selectedStatus);
		// else b = b.filter(b => ['approved','pending','in_progress','completed'].includes(b.status));
		return b;
	})());

	const weekDays = $derived(getWeekDays(currentDate));
	const timeSlots = generateTimeSlots();

	function generateTimeSlots() {
		const slots = [];
		for (let h = 8; h <= 18; h++) slots.push(`${h.toString().padStart(2,'0')}:00`);
		return slots;
	}

	function getWeekDays(date: Date) {
		const days = [];
		const start = new Date(date);
		const day = start.getDay();
		start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
		for (let i = 0; i < 7; i++) {
			const d = new Date(start);
			d.setDate(start.getDate() + i);
			days.push(d);
		}
		return days;
	}

	function formatTime(date: Date) {
		return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(date: Date) {
		return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
	}

	function previousWeek() { currentDate = new Date(new Date(currentDate).setDate(currentDate.getDate() - 7)); }
	function nextWeek()     { currentDate = new Date(new Date(currentDate).setDate(currentDate.getDate() + 7)); }
	function today()        { currentDate = new Date(); }

	function getBookingsForSlot(time: string, day: Date, roomId: string) {
		const hour = parseInt(time.split(':')[0]);
		return filteredBookings.filter(b => {
			if (roomId !== 'all' && b.roomId !== roomId) return false;
			if (b.startTime.toDateString() !== day.toDateString()) return false;
			return b.startTime.getHours() <= hour && hour < b.endTime.getHours();
		});
	}

	function getRoomColor(roomId: string) {
		return rooms.find(r => r.id === roomId)?.color || '#999';
	}

	function getDuration(b: CalendarBooking) {
		return (b.endTime.getTime() - b.startTime.getTime()) / (1000 * 60 * 60);
	}

	function blockStyle(b: CalendarBooking) {
		const color = STATUS_COLORS[b.status] || getRoomColor(b.roomId);
		if (b.status === 'pending') {
			return `background: ${getRoomColor(b.roomId)}99; border: 2px dashed ${getRoomColor(b.roomId)}; height: ${getDuration(b) * 60}px;`;
		}
		if (b.status === 'completed') {
			return `background: #94a3b8; height: ${getDuration(b) * 60}px;`;
		}
		return `background: ${color}; height: ${getDuration(b) * 60}px;`;
	}

	const STATUS_LABEL: Record<string, string> = {
		approved: 'Approved', pending: 'Pending', completed: 'Completed',
		rejected: 'Rejected', cancelled: 'Cancelled'
	};
</script>

<svelte:head><title>Meeting Room Calendar</title></svelte:head>

<div class="calendar-page">
	<div class="header">
		<div>
			<h1>Meeting Room Calendar</h1>
			<p class="subtitle">View and manage room bookings</p>
		</div>
		<a href="/meeting/book" class="btn-primary">Book Room</a>
	</div>

	<!-- Controls -->
	<div class="controls">
		<div class="view-controls">
			<button class="btn-nav" onclick={previousWeek}>← Previous</button>
			<button class="btn-today" onclick={today}>Today</button>
			<button class="btn-nav" onclick={nextWeek}>Next →</button>
		</div>

		<div class="filter-controls">
			<!-- Location filter -->
			{#if locations.length > 0}
				<select bind:value={selectedLoc} class="room-filter" onchange={() => { selectedRoom = 'all'; }}>
					<option value="all">All Locations</option>
					{#each locations as loc}
						<option value={loc.id}>{loc.name}</option>
					{/each}
				</select>
			{/if}

			<!-- Room filter -->
			<select bind:value={selectedRoom} class="room-filter">
				<option value="all">All Rooms</option>
				{#each filteredRooms as room}
					<option value={room.id}>{room.name}</option>
				{/each}
			</select>

			<!-- Status filter -->
			<select bind:value={selectedStatus} class="room-filter">
				<option value="active">Approved + Pending</option>
				<option value="approved">Approved only</option>
				<option value="pending">Pending only</option>
				<option value="completed">Completed</option>
			</select>
		</div>
	</div>

	<!-- Calendar View -->
	<div class="calendar-container">
		<div class="week-view">
			<div class="calendar-header">
				<div class="time-column-header">Time</div>
				{#each weekDays as day}
					<div class="day-header {day.toDateString() === new Date().toDateString() ? 'today' : ''}">
						<div class="day-name">{formatDate(day)}</div>
					</div>
				{/each}
			</div>

			<div class="calendar-body">
				{#each timeSlots as timeSlot}
					<div class="time-row">
						<div class="time-label">{timeSlot}</div>
						{#each weekDays as day}
							<div class="time-cell">
								{#if selectedRoom === 'all'}
									{#each filteredRooms as room}
										{@const cellBookings = getBookingsForSlot(timeSlot, day, room.id)}
										{#each cellBookings as booking}
											{#if booking.startTime.getHours() === parseInt(timeSlot.split(':')[0])}
												<div class="booking-block" style={blockStyle(booking)} title="{booking.title} — {room.name} [{STATUS_LABEL[booking.status]}]">
													<div class="booking-title">{booking.title}</div>
													<div class="booking-room">{room.name}</div>
													<div class="booking-time">{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</div>
													<div class="booking-status">{STATUS_LABEL[booking.status]}</div>
												</div>
											{/if}
										{/each}
									{/each}
								{:else}
									{@const cellBookings = getBookingsForSlot(timeSlot, day, selectedRoom)}
									{#each cellBookings as booking}
										{#if booking.startTime.getHours() === parseInt(timeSlot.split(':')[0])}
											<div class="booking-block" style={blockStyle(booking)} title="{booking.title} [{STATUS_LABEL[booking.status]}]">
												<div class="booking-title">{booking.title}</div>
												<div class="booking-organizer">{booking.organizer}</div>
												<div class="booking-time">{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</div>
												<div class="booking-status">{STATUS_LABEL[booking.status]}</div>
											</div>
										{/if}
									{/each}
								{/if}
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Legend -->
	<div class="legend">
		<div class="legend-rooms">
			<h3>Rooms</h3>
			<div class="legend-items">
				{#each filteredRooms as room}
					<div class="legend-item">
						<span class="legend-color" style="background: {room.color}"></span>
						<span>{room.name}</span>
					</div>
				{/each}
			</div>
		</div>
		<div class="legend-statuses">
			<h3>Status</h3>
			<div class="legend-items">
				<div class="legend-item"><span class="legend-color" style="background:#48bb78"></span><span>Approved</span></div>
				<div class="legend-item"><span class="legend-color legend-pending"></span><span>Pending</span></div>
				<div class="legend-item"><span class="legend-color" style="background:#94a3b8"></span><span>Completed</span></div>
			</div>
		</div>
	</div>
</div>

<style>
	.calendar-page { animation: fadeIn 0.3s ease-in; }
	@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

	.header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2rem; }
	.header h1 { margin:0; font-size:2rem; color:#333; }
	.subtitle { color:#666; margin:0.5rem 0 0 0; }

	.btn-primary {
		padding:0.75rem 2rem; border-radius:8px; text-decoration:none; font-weight:500;
		background:linear-gradient(135deg,#48bb78 0%,#38a169 100%); color:white; transition:all 0.2s;
	}
	.btn-primary:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.15); }

	.controls {
		display:flex; justify-content:space-between; align-items:center;
		margin-bottom:2rem; padding:1.5rem; background:white; border-radius:12px;
		box-shadow:0 2px 8px rgba(0,0,0,0.08); gap:1rem; flex-wrap:wrap;
	}
	.view-controls { display:flex; gap:1rem; align-items:center; }
	.filter-controls { display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap; }

	.btn-nav, .btn-today {
		padding:0.75rem 1.5rem; border:2px solid #48bb78; border-radius:8px;
		background:white; color:#48bb78; font-weight:500; cursor:pointer; transition:all 0.2s;
	}
	.btn-today { background:#48bb78; color:white; }
	.btn-nav:hover, .btn-today:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.15); }

	.room-filter {
		padding:0.6rem 0.9rem; border:2px solid #e2e8f0; border-radius:8px;
		font-size:0.9rem; cursor:pointer; min-width:180px;
	}

	.calendar-container {
		background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.08);
		overflow-x:auto; margin-bottom:2rem;
	}
	.week-view { min-width:1000px; }

	.calendar-header {
		display:grid; grid-template-columns:80px repeat(7,1fr);
		border-bottom:2px solid #e2e8f0; background:#f9f9f9;
		position:sticky; top:0; z-index:10;
	}
	.time-column-header { padding:1rem; font-weight:600; color:#333; border-right:1px solid #e2e8f0; }
	.day-header { padding:1rem; text-align:center; border-right:1px solid #e2e8f0; }
	.day-header.today { background:#e6fffa; font-weight:600; }
	.day-name { font-size:0.95rem; color:#333; }

	.calendar-body { position:relative; }
	.time-row { display:grid; grid-template-columns:80px repeat(7,1fr); min-height:60px; border-bottom:1px solid #e2e8f0; }
	.time-label { padding:0.5rem; font-size:0.85rem; color:#666; border-right:1px solid #e2e8f0; background:#f9f9f9; }
	.time-cell { position:relative; border-right:1px solid #e2e8f0; padding:0.25rem; }

	.booking-block {
		position:absolute; left:0.25rem; right:0.25rem;
		padding:0.4rem 0.5rem; border-radius:6px; color:white;
		font-size:0.78rem; overflow:hidden; cursor:pointer; transition:all 0.2s; z-index:1;
	}
	.booking-block:hover { transform:scale(1.02); box-shadow:0 4px 12px rgba(0,0,0,0.2); z-index:2; }

	.booking-title  { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
	.booking-room, .booking-organizer, .booking-time, .booking-status {
		font-size:0.7rem; opacity:0.9; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
	}
	.booking-status { opacity:0.8; font-style:italic; }

	.legend { display:flex; gap:2rem; flex-wrap:wrap; padding:1.5rem; background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
	.legend h3 { margin:0 0 0.75rem 0; font-size:1rem; color:#333; }
	.legend-items { display:flex; flex-wrap:wrap; gap:1rem; }
	.legend-item { display:flex; align-items:center; gap:0.5rem; font-size:0.875rem; }
	.legend-color { width:18px; height:18px; border-radius:4px; display:inline-block; }
	.legend-pending { background:#48bb7899; border:2px dashed #48bb78; }

	@media (max-width:768px) {
		.header { flex-direction:column; gap:1rem; }
		.controls { flex-direction:column; }
		.view-controls { width:100%; justify-content:space-between; }
		.room-filter { width:100%; }
	}
</style>

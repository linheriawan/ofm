<script lang="ts">
	let title = 'Meeting Room Calendar';

	// Calendar state
	let currentDate = new Date();
	let selectedDate = new Date();
	let viewMode: 'day' | 'week' | 'month' = 'week';
	let selectedRoom = 'all';

	// Mock rooms
	let rooms = [
		{ id: 'ROOM-A301', name: 'Board Room A-301', color: '#667eea' },
		{ id: 'ROOM-A302', name: 'Conference Room A-302', color: '#48bb78' },
		{ id: 'ROOM-B101', name: 'Meeting Room B-101', color: '#f6ad55' },
		{ id: 'ROOM-B102', name: 'Meeting Room B-102', color: '#ed64a6' },
		{ id: 'ROOM-B205', name: 'Training Room B-205', color: '#4299e1' }
	];

	// Mock bookings
	let bookings = [
		{
			id: 'MTG-001',
			roomId: 'ROOM-A301',
			title: 'Board Meeting',
			startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 14, 0),
			endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 16, 0),
			organizer: 'John Smith',
			participants: 8
		},
		{
			id: 'MTG-002',
			roomId: 'ROOM-B102',
			title: 'Team Sync',
			startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 16, 30),
			endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 17, 30),
			organizer: 'Jane Doe',
			participants: 5
		},
		{
			id: 'MTG-003',
			roomId: 'ROOM-A302',
			title: 'Client Meeting',
			startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 10, 0),
			endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 11, 30),
			organizer: 'Bob Wilson',
			participants: 12
		}
	];

	$: filteredBookings = selectedRoom === 'all'
		? bookings
		: bookings.filter(b => b.roomId === selectedRoom);

	$: timeSlots = generateTimeSlots();
	$: weekDays = getWeekDays(currentDate);

	function generateTimeSlots() {
		const slots = [];
		for (let hour = 8; hour <= 18; hour++) {
			slots.push(`${hour.toString().padStart(2, '0')}:00`);
		}
		return slots;
	}

	function getWeekDays(date: Date) {
		const days = [];
		const startOfWeek = new Date(date);
		const day = startOfWeek.getDay();
		const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
		startOfWeek.setDate(diff);

		for (let i = 0; i < 7; i++) {
			const dayDate = new Date(startOfWeek);
			dayDate.setDate(startOfWeek.getDate() + i);
			days.push(dayDate);
		}
		return days;
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
	}

	function previousWeek() {
		currentDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
	}

	function nextWeek() {
		currentDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
	}

	function today() {
		currentDate = new Date();
	}

	function getBookingsForTimeSlot(time: string, dayDate: Date, roomId: string) {
		const [hour] = time.split(':').map(Number);
		return filteredBookings.filter(booking => {
			if (roomId !== 'all' && booking.roomId !== roomId) return false;
			if (selectedRoom !== 'all' && booking.roomId !== selectedRoom) return false;

			const bookingDate = booking.startTime.toDateString();
			const slotDate = dayDate.toDateString();

			if (bookingDate !== slotDate) return false;

			const bookingHour = booking.startTime.getHours();
			const bookingEndHour = booking.endTime.getHours();

			return bookingHour <= hour && hour < bookingEndHour;
		});
	}

	function getRoomColor(roomId: string): string {
		return rooms.find(r => r.id === roomId)?.color || '#999';
	}

	function getBookingDuration(booking: any): number {
		return (booking.endTime - booking.startTime) / (1000 * 60 * 60);
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

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
			<button class="btn-nav" on:click={previousWeek}>← Previous</button>
			<button class="btn-today" on:click={today}>Today</button>
			<button class="btn-nav" on:click={nextWeek}>Next →</button>
		</div>

		<div class="filter-controls">
			<select bind:value={selectedRoom} class="room-filter">
				<option value="all">All Rooms</option>
				{#each rooms as room}
					<option value={room.id}>{room.name}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Calendar View -->
	<div class="calendar-container">
		{#if viewMode === 'week'}
			<div class="week-view">
				<!-- Header with days -->
				<div class="calendar-header">
					<div class="time-column-header">Time</div>
					{#each weekDays as day}
						<div class="day-header {day.toDateString() === new Date().toDateString() ? 'today' : ''}">
							<div class="day-name">{formatDate(day)}</div>
						</div>
					{/each}
				</div>

				<!-- Time slots -->
				<div class="calendar-body">
					{#each timeSlots as timeSlot}
						<div class="time-row">
							<div class="time-label">{timeSlot}</div>
							{#each weekDays as day}
								<div class="time-cell">
									{#if selectedRoom === 'all'}
										<!-- Show all rooms' bookings -->
										{#each rooms as room}
											{@const cellBookings = getBookingsForTimeSlot(timeSlot, day, room.id)}
											{#each cellBookings as booking}
												{@const isStart = booking.startTime.getHours() === parseInt(timeSlot.split(':')[0])}
												{#if isStart}
													<div
														class="booking-block"
														style="background: {getRoomColor(booking.roomId)}; height: {getBookingDuration(booking) * 60}px;"
														title="{booking.title} - {room.name}"
													>
														<div class="booking-title">{booking.title}</div>
														<div class="booking-room">{rooms.find(r => r.id === booking.roomId)?.name}</div>
														<div class="booking-time">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
													</div>
												{/if}
											{/each}
										{/each}
									{:else}
										<!-- Show selected room's bookings -->
										{@const cellBookings = getBookingsForTimeSlot(timeSlot, day, selectedRoom)}
										{#each cellBookings as booking}
											{@const isStart = booking.startTime.getHours() === parseInt(timeSlot.split(':')[0])}
											{#if isStart}
												<div
													class="booking-block"
													style="background: {getRoomColor(booking.roomId)}; height: {getBookingDuration(booking) * 60}px;"
													title="{booking.title}"
												>
													<div class="booking-title">{booking.title}</div>
													<div class="booking-organizer">{booking.organizer}</div>
													<div class="booking-time">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
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
		{/if}
	</div>

	<!-- Legend -->
	<div class="legend">
		<h3>Rooms</h3>
		<div class="legend-items">
			{#each rooms as room}
				<div class="legend-item">
					<span class="legend-color" style="background: {room.color}"></span>
					<span>{room.name}</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.calendar-page {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
	}

	.header h1 {
		margin: 0;
		font-size: 2rem;
		color: #333;
	}

	.subtitle {
		color: #666;
		margin: 0.5rem 0 0 0;
	}

	.btn-primary {
		padding: 0.75rem 2rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
		color: white;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}

	.view-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.btn-nav, .btn-today {
		padding: 0.75rem 1.5rem;
		border: 2px solid #48bb78;
		border-radius: 8px;
		background: white;
		color: #48bb78;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-today {
		background: #48bb78;
		color: white;
	}

	.btn-nav:hover, .btn-today:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	}

	.room-filter {
		padding: 0.75rem 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		min-width: 250px;
	}

	.calendar-container {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		overflow-x: auto;
		margin-bottom: 2rem;
	}

	.week-view {
		min-width: 1000px;
	}

	.calendar-header {
		display: grid;
		grid-template-columns: 80px repeat(7, 1fr);
		border-bottom: 2px solid #e2e8f0;
		background: #f9f9f9;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.time-column-header {
		padding: 1rem;
		font-weight: 600;
		color: #333;
		border-right: 1px solid #e2e8f0;
	}

	.day-header {
		padding: 1rem;
		text-align: center;
		border-right: 1px solid #e2e8f0;
	}

	.day-header.today {
		background: #e6fffa;
		font-weight: 600;
	}

	.day-name {
		font-size: 0.95rem;
		color: #333;
	}

	.calendar-body {
		position: relative;
	}

	.time-row {
		display: grid;
		grid-template-columns: 80px repeat(7, 1fr);
		min-height: 60px;
		border-bottom: 1px solid #e2e8f0;
	}

	.time-label {
		padding: 0.5rem;
		font-size: 0.85rem;
		color: #666;
		border-right: 1px solid #e2e8f0;
		background: #f9f9f9;
	}

	.time-cell {
		position: relative;
		border-right: 1px solid #e2e8f0;
		padding: 0.25rem;
	}

	.booking-block {
		position: absolute;
		left: 0.25rem;
		right: 0.25rem;
		padding: 0.5rem;
		border-radius: 6px;
		color: white;
		font-size: 0.8rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s;
		z-index: 1;
	}

	.booking-block:hover {
		transform: scale(1.02);
		box-shadow: 0 4px 12px rgba(0,0,0,0.2);
		z-index: 2;
	}

	.booking-title {
		font-weight: 600;
		margin-bottom: 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.booking-room,
	.booking-organizer,
	.booking-time {
		font-size: 0.75rem;
		opacity: 0.9;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.legend {
		padding: 1.5rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}

	.legend h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #333;
	}

	.legend-items {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-color {
		width: 20px;
		height: 20px;
		border-radius: 4px;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: 1rem;
		}

		.controls {
			flex-direction: column;
			gap: 1rem;
		}

		.view-controls {
			width: 100%;
			justify-content: space-between;
		}

		.room-filter {
			width: 100%;
		}
	}
</style>

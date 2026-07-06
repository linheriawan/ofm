<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import DefaultPage from './default.svelte';
	import AdminPage from './admin.svelte';
	let title = 'Dashboard - OFM';

	const user = $page.data.user;
	let showCancelledMessage = false;
	let errorMessage = '';

	let stats = {
		transportation: { activeVehicles: 0, totalVehicles: 0, onDutyDrivers: 0, pendingRequests: 0, vouchersAvailable: 0 },
		meeting: { availableRooms: 0, totalRooms: 0, todayBookings: 0, ongoingMeetings: 0, activeLicenses: 0 }
	};
	let recentActivities: { type: string; message: string; time: string }[] = [];
	let upcomingBookings: { type: string; title: string; location: string; time: string }[] = [];
	let teammates: { _id: string; firstName: string; lastName: string; email: string; roleNames?: string[]; isActive: boolean }[] = $state([]);
	let departmentName = $state('');

	function timeAgo(date: Date): string {
		const diff = Date.now() - date.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins} min ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
		return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`;
	}

	async function loadStats() {
		const [vehiclesRes, driversRes, transportRes, voucherRes, roomsRes, meetingRes] = await Promise.allSettled([
			fetch('/api/v1/vehicles?limit=1000').then(r => r.json()),
			fetch('/api/v1/users?role=driver&limit=1000').then(r => r.json()),
			fetch('/api/v1/transport/requests?status=pending&limit=1').then(r => r.json()),
			fetch('/api/v1/vouchers/stats').then(r => r.json()),
			fetch('/api/v1/rooms?limit=1000').then(r => r.json()),
			fetch('/api/v1/meeting/requests?limit=1000').then(r => r.json()),
		]);

		if (vehiclesRes.status === 'fulfilled' && vehiclesRes.value.success) {
			const vehicles = vehiclesRes.value.data ?? [];
			stats.transportation.totalVehicles = vehicles.length;
			stats.transportation.activeVehicles = vehicles.filter((v: any) => v.status === 'available').length;
		}
		if (driversRes.status === 'fulfilled' && driversRes.value.success) {
			const drivers = driversRes.value.data ?? [];
			stats.transportation.onDutyDrivers = drivers.filter((d: any) => d.isActive).length;
		}
		if (transportRes.status === 'fulfilled' && transportRes.value.success) {
			stats.transportation.pendingRequests = transportRes.value.pagination?.total ?? 0;
		}
		if (voucherRes.status === 'fulfilled' && voucherRes.value.success) {
			stats.transportation.vouchersAvailable = voucherRes.value.data?.available ?? 0;
		}
		if (roomsRes.status === 'fulfilled' && roomsRes.value.success) {
			const rooms = roomsRes.value.data ?? [];
			stats.meeting.totalRooms = rooms.length;
			stats.meeting.availableRooms = rooms.filter((r: any) => r.status === 'available').length;
		}
		if (meetingRes.status === 'fulfilled' && meetingRes.value.success) {
			const meetings = meetingRes.value.data ?? [];
			const now = new Date();
			const todayStr = now.toDateString();
			stats.meeting.todayBookings = meetings.filter((m: any) => new Date(m.startTime).toDateString() === todayStr).length;
			stats.meeting.ongoingMeetings = meetings.filter((m: any) => {
				const s = new Date(m.startTime), e = new Date(m.endTime);
				return s <= now && now <= e;
			}).length;
		}
		stats = stats; // trigger reactivity
	}

	async function loadRecentAndUpcoming() {
		const [transportRes, meetingRes] = await Promise.allSettled([
			fetch('/api/v1/transport/requests?limit=5&sort=-createdAt').then(r => r.json()),
			fetch('/api/v1/meeting/requests?limit=5&sort=-createdAt').then(r => r.json()),
		]);

		const activities: typeof recentActivities = [];
		const upcoming: typeof upcomingBookings = [];
		const now = new Date();

		if (transportRes.status === 'fulfilled' && transportRes.value.success) {
			for (const t of transportRes.value.data ?? []) {
				activities.push({ type: 'transport', message: `Transport request: ${t.pickup?.address} → ${t.destination?.address}`, time: timeAgo(new Date(t.createdAt)) });
				const start = new Date(t.scheduledTime);
				if (start > now) upcoming.push({ type: 'Transport', title: t.purpose || 'Transport', location: t.destination?.address ?? '', time: start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) });
			}
		}
		if (meetingRes.status === 'fulfilled' && meetingRes.value.success) {
			for (const m of meetingRes.value.data ?? []) {
				activities.push({ type: 'meeting', message: `Meeting "${m.title}" booked`, time: timeAgo(new Date(m.createdAt)) });
				const start = new Date(m.startTime);
				if (start > now) upcoming.push({ type: 'Meeting', title: m.title, location: m.roomId ?? '', time: `${start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${new Date(m.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` });
			}
		}

		activities.sort((a, b) => a.time.localeCompare(b.time));
		recentActivities = activities.slice(0, 5);
		upcomingBookings = upcoming.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 5);
	}

	async function loadTeammates() {
		if (!user?.orgUnitId) return;
		try {

			const params = new URLSearchParams({ departmentId: user.orgUnitId, limit: '20', isActive: 'true' });
			const res = await fetch(`/api/v1/users?${params}`);
			const json = await res.json();
			if (json.success) {
				// exclude self
				teammates = (json.data ?? []).filter((u: any) => u.email !== user.email);
			}
			// resolve department name from org units
			const deptRes = await fetch(`/api/v1/departments?limit=200`);
			const deptJson = await deptRes.json();
			if (deptJson.success) {
				const match = (deptJson.data ?? []).find((d: any) => d._id === user.orgUnitId || d.departmentId === user.orgUnitId);
				departmentName = match?.departmentName ?? user.orgUnitName ?? '';
			}
		} catch (e) { console.error('Failed to load teammates', e); }
	}

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('cancelled') === 'true') {
			showCancelledMessage = true;
			window.history.replaceState({}, '', '/');
			setTimeout(() => { showCancelledMessage = false; }, 5000);
		} else if (urlParams.get('error')) {
			const err = urlParams.get('error');
			const errorMessages: Record<string, string> = {
				'invalid_request': 'Invalid authentication request. Please try again.',
				'server_error': 'Server error during authentication. Please try again.',
				'temporarily_unavailable': 'Authentication service is temporarily unavailable.',
				'unauthorized': 'You do not have permission to access that page.'
			};
			errorMessage = errorMessages[err || ''] || `Authentication error: ${err}`;
			window.history.replaceState({}, '', '/');
			setTimeout(() => { errorMessage = ''; }, 8000);
		}

		if (user) {
			loadStats();
			loadRecentAndUpcoming();
			loadTeammates();
		}
	});
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>
{#if showCancelledMessage}
<div class="alert-warning mb-4">
	<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
		<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
	</svg>
	<span>Login cancelled. Please sign in to continue.</span>
</div>
{/if}

{#if errorMessage}
<div class="alert-error mb-4">
	<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
		<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
	</svg>
	<span>{errorMessage}</span>
</div>
{/if}

{#if !user}
<DefaultPage />
{:else}
<AdminPage bind:stats={stats} user={user} departmentName={departmentName} teammates={teammates}
    upcomingBookings={upcomingBookings} recentActivities={recentActivities} />
{/if}

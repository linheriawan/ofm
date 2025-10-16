<script lang="ts">
	import { page } from '$app/stores';

	let isMenuOpen = false;
	let transportDropdownOpen = false;
	let meetingDropdownOpen = false;
	let adminDropdownOpen = false;

	// Get user from page data
	$: user = $page.data.user;
	$: isAuthenticated = !!user;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function toggleTransportDropdown() {
		transportDropdownOpen = !transportDropdownOpen;
		meetingDropdownOpen = false;
		adminDropdownOpen = false;
	}

	function toggleMeetingDropdown() {
		meetingDropdownOpen = !meetingDropdownOpen;
		transportDropdownOpen = false;
		adminDropdownOpen = false;
	}

	function toggleAdminDropdown() {
		adminDropdownOpen = !adminDropdownOpen;
		transportDropdownOpen = false;
		meetingDropdownOpen = false;
	}

	function closeDropdowns() {
		transportDropdownOpen = false;
		meetingDropdownOpen = false;
		adminDropdownOpen = false;
	}
</script>

<div class="app">
	{#if isAuthenticated}
	<header>
		<nav>
			<div class="nav-brand">
				<h1>OFM</h1>
				<span class="subtitle">Office Facility Management</span>
			</div>

			<button class="menu-toggle" onclick={toggleMenu}>
				☰
			</button>

			<ul class:open={isMenuOpen}>
				<li>
					<a href="/" class:active={$page.url.pathname === '/'} onclick={closeDropdowns}>
						Dashboard
					</a>
				</li>
				<li class="dropdown">
					<button
						class="dropdown-trigger {$page.url.pathname.startsWith('/transportation') ? 'active' : ''}"
						onclick={toggleTransportDropdown}
					>
						Transportation ▾
					</button>
					{#if transportDropdownOpen}
						<div class="dropdown-menu">
							<a href="/transportation" onclick={closeDropdowns}>Overview</a>
							<a href="/transportation/request" onclick={closeDropdowns}>Request Transport</a>
							<a href="/transportation/bookings" onclick={closeDropdowns}>All Requests</a>
							<a href="/transportation/tracking" onclick={closeDropdowns}>Track Vehicles</a>
						</div>
					{/if}
				</li>
				<li class="dropdown">
					<button
						class="dropdown-trigger {$page.url.pathname.startsWith('/meeting') ? 'active' : ''}"
						onclick={toggleMeetingDropdown}
					>
						Meeting Rooms ▾
					</button>
					{#if meetingDropdownOpen}
						<div class="dropdown-menu">
							<a href="/meeting" onclick={closeDropdowns}>Overview</a>
							<a href="/meeting/book" onclick={closeDropdowns}>Book Room</a>
							<a href="/meeting/bookings" onclick={closeDropdowns}>All Bookings</a>
							<a href="/meeting/calendar" onclick={closeDropdowns}>Calendar</a>
						</div>
					{/if}
				</li>
				<li class="dropdown">
					<button
						class="dropdown-trigger {$page.url.pathname.startsWith('/admin') ? 'active' : ''}"
						onclick={toggleAdminDropdown}
					>
						Admin ▾
					</button>
					{#if adminDropdownOpen}
						<div class="dropdown-menu">
							<a href="/admin" onclick={closeDropdowns}>Dashboard</a>
							<div class="dropdown-divider">Transportation</div>
							<a href="/admin/vehicles" onclick={closeDropdowns}>Vehicles</a>
							<a href="/admin/drivers" onclick={closeDropdowns}>Drivers</a>
							<a href="/admin/transport-companies" onclick={closeDropdowns}>Transport Companies</a>
							<a href="/admin/vouchers" onclick={closeDropdowns}>Vouchers</a>
							<a href="/admin/trip-purposes" onclick={closeDropdowns}>Trip Purposes</a>
							<div class="dropdown-divider">Meeting</div>
							<a href="/admin/rooms" onclick={closeDropdowns}>Meeting Rooms</a>
							<div class="dropdown-divider">System</div>
							<a href="/admin/users" onclick={closeDropdowns}>Users</a>
							<a href="/admin/locations" onclick={closeDropdowns}>Locations</a>
							<a href="/admin/room-displays" onclick={closeDropdowns}>Room Displays</a>
						</div>
					{/if}
				</li>
			</ul>

			<div class="user-menu">
				<span class="user-name">{user?.name || user?.email || 'User'}</span>
				<form method="POST" action="/auth/logout" style="display: inline;">
					<button type="submit" class="logout-btn">Logout</button>
				</form>
			</div>
		</nav>
	</header>
	{/if}

	<main class:no-header={!isAuthenticated}>
		<slot />
	</main>

	{#if isAuthenticated}
	<footer>
		<p>&copy; 2025 Office Facility Management System</p>
	</footer>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #f5f5f5;
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	nav {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		align-items: center;
		gap: 2rem;
		height: 70px;
	}

	.nav-brand {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.nav-brand h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.subtitle {
		font-size: 0.75rem;
		opacity: 0.9;
	}

	.menu-toggle {
		display: none;
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
	}

	nav ul {
		display: flex;
		list-style: none;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		flex: 1;
		align-items: center;
	}

	nav ul li a {
		color: white;
		text-decoration: none;
		padding: 0.75rem 1.25rem;
		border-radius: 6px;
		transition: all 0.2s;
		font-weight: 500;
	}

	nav ul li a:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	nav ul li a.active {
		background: rgba(255, 255, 255, 0.3);
	}

	/* Dropdown */
	.dropdown {
		position: relative;
	}

	.dropdown-trigger {
		background: none;
		border: none;
		color: white;
		padding: 0.75rem 1.25rem;
		border-radius: 6px;
		transition: all 0.2s;
		font-weight: 500;
		cursor: pointer;
		font-size: 1rem;
		font-family: inherit;
	}

	.dropdown-trigger:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.dropdown-trigger.active {
		background: rgba(255, 255, 255, 0.3);
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		padding: 0.5rem 0;
		min-width: 200px;
		z-index: 1000;
		animation: dropdownFade 0.2s ease-in;
	}

	@keyframes dropdownFade {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-menu a {
		display: block;
		padding: 0.75rem 1.25rem;
		color: #333;
		text-decoration: none;
		transition: background 0.2s;
	}

	.dropdown-menu a:hover {
		background: #f0f4ff;
		color: #667eea;
	}

	.user-menu {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-name {
		font-size: 0.9rem;
		opacity: 0.95;
	}

	.logout-btn {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
	}

	main {
		flex: 1;
		width: 100%;
		margin: 0 auto;
		padding: 2rem;
		box-sizing: border-box;
		overflow-x: hidden;
	}

	main.no-header {
		padding: 0;
	}

	main > * {
		max-width: 1400px;
		margin-left: auto;
		margin-right: auto;
	}

	footer {
		background: #333;
		color: white;
		text-align: center;
		padding: 1.5rem;
		margin-top: 3rem;
	}

	footer p {
		margin: 0;
		font-size: 0.9rem;
		opacity: 0.8;
	}

	@media (max-width: 768px) {
		.menu-toggle {
			display: block;
			margin-left: auto;
		}

		nav ul {
			position: absolute;
			top: 70px;
			left: 0;
			right: 0;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			flex-direction: column;
			padding: 1rem;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
			display: none;
		}

		nav ul.open {
			display: flex;
		}

		nav ul li a {
			display: block;
		}

		.user-menu {
			display: none;
		}

		main {
			padding: 1rem;
		}
	}
</style>

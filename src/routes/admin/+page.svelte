<script lang="ts">
	let title = 'Admin Dashboard - OFM';

	const adminLinks = [
		{
			title: 'Vehicles',
			description: 'Manage company vehicles and fleet',
			icon: '🚗',
			href: '/admin/vehicles',
			color: '#667eea'
		},
		{
			title: 'Drivers',
			description: 'Manage drivers and assignments',
			icon: '👨‍✈️',
			href: '/admin/drivers',
			color: '#48bb78'
		},
		{
			title: 'Meeting Rooms',
			description: 'Manage meeting rooms and facilities',
			icon: '🏢',
			href: '/admin/rooms',
			color: '#f6ad55'
		},
		{
			title: 'Users',
			description: 'Manage user accounts and permissions',
			icon: '👥',
			href: '/admin/users',
			color: '#9f7aea'
		},
		{
			title: 'Locations',
			description: 'Manage office locations',
			icon: '📍',
			href: '/admin/locations',
			color: '#ed64a6'
		},
		{
			title: 'Companies',
			description: 'Manage companies and subsidiaries',
			icon: '🏛️',
			href: '/admin/companies',
			color: '#4299e1'
		},
		{
			title: 'Vouchers',
			description: 'Manage transportation vouchers',
			icon: '🎫',
			href: '/admin/vouchers',
			color: '#38b2ac'
		},
		{
			title: 'Licenses',
			description: 'Manage meeting platform licenses',
			icon: '📄',
			href: '/admin/licenses',
			color: '#fc8181'
		},
		{
			title: 'Room Displays',
			description: 'QR codes and URLs for room tablets',
			icon: '📺',
			href: '/admin/room-displays',
			color: '#a78bfa'
		}
	];
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="admin-dashboard">
	<div class="header">
		<h1>Admin Dashboard</h1>
		<p class="subtitle">Manage your organization's master data</p>
	</div>

	<div class="admin-grid">
		{#each adminLinks as link}
			<a href={link.href} class="admin-card" style="--card-color: {link.color}">
				<div class="card-icon">{link.icon}</div>
				<div class="card-content">
					<h3>{link.title}</h3>
					<p>{link.description}</p>
				</div>
				<div class="card-arrow">→</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.admin-dashboard {
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

	.header {
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

	.admin-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.admin-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		border-left: 4px solid var(--card-color);
		position: relative;
		overflow: hidden;
	}

	.admin-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, var(--card-color) 0%, transparent 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.admin-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
	}

	.admin-card:hover::before {
		opacity: 0.05;
	}

	.card-icon {
		font-size: 3rem;
		flex-shrink: 0;
		z-index: 1;
	}

	.card-content {
		flex: 1;
		z-index: 1;
	}

	.card-content h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		color: #333;
	}

	.card-content p {
		margin: 0;
		font-size: 0.9rem;
		color: #666;
	}

	.card-arrow {
		font-size: 1.5rem;
		color: var(--card-color);
		transition: transform 0.3s ease;
		z-index: 1;
	}

	.admin-card:hover .card-arrow {
		transform: translateX(5px);
	}

	@media (max-width: 768px) {
		.admin-grid {
			grid-template-columns: 1fr;
		}

		.admin-card {
			padding: 1rem;
		}

		.card-icon {
			font-size: 2.5rem;
		}
	}
</style>

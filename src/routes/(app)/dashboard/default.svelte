<script lang="ts">
import './dashboard.css';
// interface Props {
//   unit?: any;
//   organizationOptions: { value: string; label: string }[];
// }
// let { unit = $bindable(), organizationOptions }: Props = $props();

</script>
<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
	<div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">Office Facility Management</h1>
			<p class="text-gray-600">Transportation & Meeting Room Booking System</p>
		</div>



		<div class="space-y-4">
			<a href="/auth/login"
				class="block w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition text-center font-semibold">
				Sign in with SSO
			</a>
		</div>

		<div class="mt-8 pt-6 border-t border-gray-200">
			<h2 class="text-sm font-semibold text-gray-700 mb-3">Features:</h2>
			<ul class="space-y-2 text-sm text-gray-600">
				<li class="flex items-center">
					<svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Transportation booking & voucher allocation
				</li>
				<li class="flex items-center">
					<svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Meeting room scheduling
				</li>
				<li class="flex items-center">
					<svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Online meeting integration
				</li>
				<li class="flex items-center">
					<svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Real-time tracking & analytics
				</li>
			</ul>
		</div>
	</div>
</div>

/**
 * API Testing Script
 * Run with: bun run scripts/test-api.ts
 *
 * Tests all API endpoints to ensure they work before building mobile apps
 */

const BASE_URL = 'http://localhost:5174/api/v1';
let sessionCookie = '';

interface TestResult {
	name: string;
	passed: boolean;
	error?: string;
	duration?: number;
}

const results: TestResult[] = [];

// Helper: Make API request
async function apiRequest(
	method: string,
	endpoint: string,
	body?: any,
	useAuth = true
): Promise<{ status: number; data: any }> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	if (useAuth && sessionCookie) {
		headers['Cookie'] = sessionCookie;
	}

	const options: RequestInit = {
		method,
		headers
	};

	if (body) {
		options.body = JSON.stringify(body);
	}

	const startTime = Date.now();
	const response = await fetch(BASE_URL + endpoint, options);
	const duration = Date.now() - startTime;

	const data = await response.json();

	return { status: response.status, data };
}

// Helper: Run test
async function runTest(name: string, testFn: () => Promise<void>) {
	console.log(`\n🧪 Testing: ${name}...`);
	const startTime = Date.now();

	try {
		await testFn();
		const duration = Date.now() - startTime;
		results.push({ name, passed: true, duration });
		console.log(`✅ PASSED (${duration}ms)`);
	} catch (error: any) {
		results.push({ name, passed: false, error: error.message });
		console.log(`❌ FAILED: ${error.message}`);
	}
}

// Helper: Assert
function assert(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

// ============================================
// TESTS
// ============================================

let createdTransportId = '';
let createdMeetingId = '';
let createdFacilityId = '';

// Test 1: Transportation - Create Request
await runTest('Transportation: Create company car request', async () => {
	const { status, data } = await apiRequest('POST', '/transport/requests', {
		type: 'company_car',
		pickup: {
			address: 'Jakarta Office',
			latitude: -6.2088,
			longitude: 106.8456
		},
		destination: {
			address: 'Bandung Office',
			latitude: -6.9175,
			longitude: 107.6191
		},
		scheduledTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
		isRoundTrip: false,
		passengerCount: 2,
		purpose: 'Client meeting',
		priority: 'medium'
	});

	assert(status === 201, `Expected 201, got ${status}`);
	assert(data.success === true, 'Response should be successful');
	assert(data.data._id, 'Should return request ID');
	assert(data.data.requestNumber, 'Should return request number');
	assert(data.data.requestNumber.startsWith('TR-'), 'Request number should start with TR-');

	createdTransportId = data.data._id;
	console.log(`   Request created: ${data.data.requestNumber}`);
});

// Test 2: Transportation - Create Voucher Request
await runTest('Transportation: Create voucher request', async () => {
	const { status, data } = await apiRequest('POST', '/transport/requests', {
		type: 'voucher',
		pickup: {
			address: 'Home'
		},
		destination: {
			address: 'Airport'
		},
		scheduledTime: new Date(Date.now() + 86400000).toISOString(),
		isRoundTrip: true,
		returnTime: new Date(Date.now() + 172800000).toISOString(), // 2 days later
		passengerCount: 1,
		purpose: 'Business trip',
		priority: 'high',
		voucherProvider: 'gojek'
	});

	assert(status === 201, `Expected 201, got ${status}`);
	assert(data.success === true, 'Response should be successful');
	console.log(`   Request created: ${data.data.requestNumber}`);
});

// Test 3: Transportation - List Requests
await runTest('Transportation: List all requests', async () => {
	const { status, data } = await apiRequest('GET', '/transport/requests?page=1&limit=10');

	assert(status === 200, `Expected 200, got ${status}`);
	assert(data.success === true, 'Response should be successful');
	assert(Array.isArray(data.data), 'Data should be an array');
	assert(data.meta, 'Should include pagination meta');
	assert(data.meta.total >= 0, 'Should include total count');

	console.log(`   Found ${data.data.length} requests (Total: ${data.meta.total})`);
});

// Test 4: Transportation - Get Single Request
await runTest('Transportation: Get request by ID', async () => {
	if (!createdTransportId) throw new Error('No request ID available');

	const { status, data } = await apiRequest('GET', `/transport/requests/${createdTransportId}`);

	assert(status === 200, `Expected 200, got ${status}`);
	assert(data.success === true, 'Response should be successful');
	assert(data.data._id === createdTransportId, 'Should return correct request');
	assert(data.data.status === 'pending', 'New request should be pending');
});

// Test 5: Transportation - Filter by Status
await runTest('Transportation: Filter by status', async () => {
	const { status, data } = await apiRequest('GET', '/transport/requests?status=pending');

	assert(status === 200, `Expected 200, got ${status}`);
	assert(data.success === true, 'Response should be successful');

	if (data.data.length > 0) {
		assert(data.data[0].status === 'pending', 'All requests should have pending status');
	}
});

// Test 6: Transportation - Validation (Missing fields)
await runTest('Transportation: Validation error handling', async () => {
	const { status, data } = await apiRequest('POST', '/transport/requests', {
		type: 'company_car'
		// Missing required fields
	});

	assert(status === 400, `Expected 400, got ${status}`);
	assert(data.success === false, 'Should return error');
	assert(data.error.code === 'VALIDATION_ERROR', 'Should be validation error');
});

// Test 7: Meeting - Create Request
await runTest('Meeting: Create meeting request', async () => {
	const startTime = new Date(Date.now() + 86400000); // Tomorrow
	const endTime = new Date(startTime.getTime() + 7200000); // 2 hours later

	const { status, data } = await apiRequest('POST', '/meeting/requests', {
		title: 'Board Meeting',
		description: 'Q4 Planning',
		type: 'hybrid',
		startTime: startTime.toISOString(),
		endTime: endTime.toISOString(),
		participantCount: 10,
		participants: ['user1@example.com', 'user2@example.com'],
		roomId: 'room123',
		platform: 'zoom',
		requiredFacilities: ['projector', 'whiteboard'],
		cateringRequired: true,
		cateringDetails: {
			type: 'lunch',
			itemCount: 12,
			notes: 'Vegetarian options'
		}
	});

	assert(status === 201, `Expected 201, got ${status}`);
	assert(data.success === true, 'Response should be successful');
	assert(data.data.requestNumber.startsWith('MR-'), 'Request number should start with MR-');

	createdMeetingId = data.data._id;
	console.log(`   Meeting created: ${data.data.requestNumber}`);
});

// Test 8: Meeting - Validation (Duration > 8 hours)
await runTest('Meeting: Reject meetings longer than 8 hours', async () => {
	const startTime = new Date(Date.now() + 86400000);
	const endTime = new Date(startTime.getTime() + 32400000); // 9 hours

	const { status, data } = await apiRequest('POST', '/meeting/requests', {
		title: 'Long Meeting',
		type: 'online',
		startTime: startTime.toISOString(),
		endTime: endTime.toISOString(),
		participants: ['user@example.com'],
		platform: 'zoom'
	});

	assert(status === 400, `Expected 400, got ${status}`);
	assert(data.success === false, 'Should reject long meetings');
});

// Test 9: Facility - Create Request
await runTest('Facility: Create facility request', async () => {
	const { status, data } = await apiRequest('POST', '/facility/requests', {
		type: 'atk',
		category: 'office_supplies',
		items: [
			{
				itemName: 'Ballpoint Pen',
				itemCode: 'PEN-001',
				quantity: 50,
				unit: 'pcs',
				estimatedPrice: 2000
			},
			{
				itemName: 'A4 Paper',
				itemCode: 'PAPER-001',
				quantity: 10,
				unit: 'ream',
				estimatedPrice: 35000
			}
		],
		deliveryLocation: 'Building A, Floor 3',
		urgency: 'medium',
		purpose: 'Monthly restocking'
	});

	assert(status === 201, `Expected 201, got ${status}`);
	assert(data.success === true, 'Response should be successful');
	assert(data.data.requestNumber.startsWith('FR-'), 'Request number should start with FR-');
	assert(data.data.estimatedCost === 450000, 'Should calculate total cost');

	createdFacilityId = data.data._id;
	console.log(`   Facility request created: ${data.data.requestNumber}`);
});

// Test 10: Facility - List Requests
await runTest('Facility: List facility requests', async () => {
	const { status, data } = await apiRequest('GET', '/facility/requests');

	assert(status === 200, `Expected 200, got ${status}`);
	assert(data.success === true, 'Response should be successful');
	assert(Array.isArray(data.data), 'Data should be an array');
});

// Test 11: Pagination Test
await runTest('Pagination: Large page number', async () => {
	const { status, data } = await apiRequest('GET', '/transport/requests?page=999&limit=20');

	assert(status === 200, `Expected 200, got ${status}`);
	assert(data.success === true, 'Should handle large page numbers');
	assert(Array.isArray(data.data), 'Should return empty array');
});

// Test 12: Pagination Test - Limit validation
await runTest('Pagination: Respect max limit (100)', async () => {
	const { status, data } = await apiRequest('GET', '/transport/requests?limit=1000');

	assert(status === 200, `Expected 200, got ${status}`);
	assert(data.meta.limit <= 100, 'Should cap limit at 100');
});

// ============================================
// RESULTS SUMMARY
// ============================================

console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(60));

const totalTests = results.length;
const passedTests = results.filter(r => r.passed).length;
const failedTests = results.filter(r => !r.passed).length;
const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / totalTests;

console.log(`\nTotal Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`⏱️  Average Duration: ${avgDuration.toFixed(2)}ms`);
console.log(`\nSuccess Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests > 0) {
	console.log('\n❌ FAILED TESTS:');
	results.filter(r => !r.passed).forEach(r => {
		console.log(`\n  • ${r.name}`);
		console.log(`    Error: ${r.error}`);
	});
}

console.log('\n' + '='.repeat(60));

// Exit with error code if tests failed
if (failedTests > 0) {
	process.exit(1);
}

console.log('\n✅ All tests passed! API is ready for mobile app development.\n');

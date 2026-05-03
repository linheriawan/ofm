import { getDB, collections } from '$lib/server/db/mongodb';

const INTERVAL_MS = 60_000;
let timer: ReturnType<typeof setInterval> | null = null;

export function startRoomSync() {
	if (timer) return;
	sync(); // run immediately on start
	timer = setInterval(sync, INTERVAL_MS);
}

export function stopRoomSync() {
	if (timer) { clearInterval(timer); timer = null; }
}

async function sync() {
	try {
		const db = getDB();
		const now = new Date();

		// approved → in_progress: meeting window has started
		const starting = await db
			.collection(collections.meetingRequests)
			.find({ status: 'approved', startTime: { $lte: now }, endTime: { $gt: now } })
			.toArray();

		for (const req of starting) {
			await db.collection(collections.meetingRequests).updateOne(
				{ _id: req._id },
				{ $set: { status: 'in_progress', updatedAt: now } }
			);
			if (req.roomId) {
				await db.collection(collections.meetingRooms).updateOne(
					{ roomId: req.roomId },
					{ $set: { status: 'occupied', updatedAt: now } }
				);
			}
		}

		// in_progress → completed: meeting window has ended
		const ending = await db
			.collection(collections.meetingRequests)
			.find({ status: 'in_progress', endTime: { $lte: now } })
			.toArray();

		for (const req of ending) {
			await db.collection(collections.meetingRequests).updateOne(
				{ _id: req._id },
				{ $set: { status: 'completed', updatedAt: now } }
			);
			if (req.roomId) {
				// Only free the room if no other meeting is currently running there
				const stillOccupied = await db.collection(collections.meetingRequests).findOne({
					roomId: req.roomId,
					status: 'in_progress',
					_id: { $ne: req._id }
				});
				if (!stillOccupied) {
					await db.collection(collections.meetingRooms).updateOne(
						{ roomId: req.roomId },
						{ $set: { status: 'available', updatedAt: now } }
					);
				}
			}
		}

		// approved but window fully missed (e.g. server was down) → complete without touching room
		await db.collection(collections.meetingRequests).updateMany(
			{ status: 'approved', endTime: { $lte: now } },
			{ $set: { status: 'completed', updatedAt: now } }
		);
	} catch (err) {
		console.error('[room-sync] sync error:', err);
	}
}

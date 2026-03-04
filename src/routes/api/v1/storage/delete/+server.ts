import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STORAGE_KEY_ID, STORAGE_SECRET_KEY, STORAGE_REGION } from '$env/static/private';
import { PUBLIC_STORAGE_BUCKET } from '$env/static/public';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
	region: STORAGE_REGION,
	credentials: {
		accessKeyId: STORAGE_KEY_ID,
		secretAccessKey: STORAGE_SECRET_KEY
	}
});

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	const { paths } = await request.json();

	if (!Array.isArray(paths) || paths.length === 0) {
		return json({ success: false, error: 'paths must be a non-empty array' }, { status: 400 });
	}

	const { Errors } = await s3.send(
		new DeleteObjectsCommand({
			Bucket: PUBLIC_STORAGE_BUCKET,
			Delete: { Objects: paths.map((Key: string) => ({ Key })) }
		})
	);

	if (Errors && Errors.length > 0) {
		console.error('S3 delete errors:', Errors);
		return json({ success: false, error: 'Some objects failed to delete' }, { status: 500 });
	}

	return json({ success: true });
};

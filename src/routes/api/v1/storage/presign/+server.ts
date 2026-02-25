import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STORAGE_KEY_ID, STORAGE_SECRET_KEY, STORAGE_REGION } from '$env/static/private';
import { PUBLIC_STORAGE_BUCKET } from '$env/static/public';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

	const { path, contentType } = await request.json();

	if (!path || !contentType) {
		return json({ success: false, error: 'path and contentType are required' }, { status: 400 });
	}

	const command = new PutObjectCommand({
		Bucket: PUBLIC_STORAGE_BUCKET,
		Key: path,
		ContentType: contentType
	});

	// Signed URL expires in 5 minutes — enough for any upload
	const url = await getSignedUrl(s3, command, { expiresIn: 300 });

	return json({ success: true, data: { url, path } });
};

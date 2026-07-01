import { Resend } from 'resend';
import { getDB, collections } from '$lib/server/db/mongodb';
import { getSetting } from '$lib/server/settings';

interface EmailConfig {
	apiKey: string;
	fromEmail: string;
	fromName: string;
}

async function getEmailConfig(): Promise<EmailConfig> {
	const [apiKey, fromEmail, fromName] = await Promise.all([
		getSetting('email.resend_api_key'),
		getSetting('email.from_address'),
		getSetting('email.from_name'),
	]);

	return {
		apiKey: apiKey || '',
		fromEmail: fromEmail || 'noreply@ofm.local',
		fromName: fromName || 'OFM System',
	};
}

export async function getUserInfo(userId: string): Promise<{ email: string; name: string } | null> {
	const db = getDB();
	// userId in requests may be the app userId OR the SSO sub (legacy bookings before the session fix)
	const user = await db.collection(collections.users).findOne({
		$or: [{ userId }, { ssoUserId: userId }]
	});
	if (!user) return null;
	const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
	return { email: user.email, name };
}

export async function getAdminEmails(companyId?: string): Promise<string[]> {
	const db = getDB();

	const roleQuery: any = { permission: 'admin', isActive: true };
	if (companyId) {
		roleQuery.$or = [{ companyIds: { $size: 0 } }, { companyIds: companyId }];
	}

	const adminRoles = await db.collection(collections.roles)
		.find(roleQuery)
		.project({ roleId: 1 })
		.toArray();

	if (!adminRoles.length) return [];

	const adminRoleIds = adminRoles.map((r: any) => r.roleId);

	const adminUsers = await db.collection(collections.users)
		.find({ roleIds: { $in: adminRoleIds }, isActive: true })
		.project({ email: 1 })
		.toArray();

	return adminUsers.map((u: any) => u.email).filter(Boolean);
}

interface SendEmailOptions {
	to: string | string[];
	subject: string;
	html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
	const config = await getEmailConfig();

	if (!config.apiKey) {
		console.warn('[Email] Resend API key not configured — skipping send');
		return;
	}

	const resend = new Resend(config.apiKey);
	const recipients = Array.isArray(options.to) ? options.to : [options.to];
	const validRecipients = recipients.filter(Boolean);

	if (!validRecipients.length) {
		console.warn('[Email] No valid recipients — skipping send');
		return;
	}

	const { error } = await resend.emails.send({
		from: `${config.fromName} <${config.fromEmail}>`,
		to: validRecipients,
		subject: options.subject,
		html: options.html,
	});

	if (error) {
		console.error('[Email] Send failed:', error);
	}
}

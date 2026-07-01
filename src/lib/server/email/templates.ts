function layout(content: string, appName = 'OFM'): string {
	return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin:0; padding:0; background:#f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width:600px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .header { background:linear-gradient(135deg,#667eea,#764ba2); padding:28px 32px; }
    .header h1 { margin:0; color:#fff; font-size:22px; font-weight:600; }
    .header p  { margin:4px 0 0; color:rgba(255,255,255,.8); font-size:14px; }
    .body { padding:32px; }
    .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; margin-bottom:20px; }
    .badge.approved  { background:#d1fae5; color:#065f46; }
    .badge.rejected  { background:#fee2e2; color:#991b1b; }
    .badge.cancelled { background:#fef3c7; color:#92400e; }
    .badge.submitted { background:#dbeafe; color:#1e40af; }
    .greeting { font-size:16px; color:#1f2937; margin-bottom:16px; }
    .detail-box { background:#f9fafb; border-radius:8px; padding:20px; margin:20px 0; }
    .detail-row { display:flex; gap:12px; margin-bottom:10px; font-size:14px; }
    .detail-row:last-child { margin-bottom:0; }
    .detail-label { color:#6b7280; min-width:140px; }
    .detail-value { color:#111827; font-weight:500; flex:1; }
    .reason-box { background:#fef3c7; border-left:4px solid #f59e0b; padding:14px 16px; border-radius:4px; font-size:14px; color:#92400e; margin:16px 0; }
    .footer { padding:20px 32px; border-top:1px solid #e5e7eb; font-size:12px; color:#9ca3af; text-align:center; }
    .footer a { color:#667eea; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>${appName}</h1>
      <p>Office Facility Management</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      Email ini dikirim otomatis oleh sistem ${appName}. Jangan membalas email ini.<br>
      &copy; ${new Date().getFullYear()} ${appName}
    </div>
  </div>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
	return `<div class="detail-row"><span class="detail-label">${label}</span><span class="detail-value">${value}</span></div>`;
}

function formatDate(d: Date | string): string {
	const date = typeof d === 'string' ? new Date(d) : d;
	return date.toLocaleString('id-ID', {
		weekday: 'long', year: 'numeric', month: 'long',
		day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
	});
}

// ── Meeting ──────────────────────────────────────────────────────────────────

export interface MeetingEmailData {
	requestId: string;
	title: string;
	type: string;
	startTime: Date | string;
	endTime: Date | string;
	roomName?: string;
	requesterName: string;
	approverName?: string;
	rejectionReason?: string;
	cancellationReason?: string;
}

export function meetingApprovedEmail(data: MeetingEmailData): { subject: string; html: string } {
	return {
		subject: `[OFM] Booking Meeting Disetujui: ${data.title}`,
		html: layout(`
      <span class="badge approved">✓ Disetujui</span>
      <p class="greeting">Halo <strong>${data.requesterName}</strong>,</p>
      <p>Permintaan booking meeting Anda telah <strong>disetujui</strong>.</p>
      <div class="detail-box">
        ${detailRow('Judul Meeting', data.title)}
        ${detailRow('Tipe', data.type)}
        ${detailRow('Waktu Mulai', formatDate(data.startTime))}
        ${detailRow('Waktu Selesai', formatDate(data.endTime))}
        ${data.roomName ? detailRow('Ruangan', data.roomName) : ''}
        ${data.approverName ? detailRow('Disetujui oleh', data.approverName) : ''}
      </div>
      <p style="color:#6b7280;font-size:14px;">Silakan persiapkan kebutuhan meeting Anda sesuai jadwal di atas.</p>
    `),
	};
}

export function meetingRejectedEmail(data: MeetingEmailData): { subject: string; html: string } {
	return {
		subject: `[OFM] Booking Meeting Ditolak: ${data.title}`,
		html: layout(`
      <span class="badge rejected">✗ Ditolak</span>
      <p class="greeting">Halo <strong>${data.requesterName}</strong>,</p>
      <p>Permintaan booking meeting Anda <strong>ditolak</strong>.</p>
      <div class="detail-box">
        ${detailRow('Judul Meeting', data.title)}
        ${detailRow('Tipe', data.type)}
        ${detailRow('Waktu Mulai', formatDate(data.startTime))}
        ${detailRow('Waktu Selesai', formatDate(data.endTime))}
        ${data.approverName ? detailRow('Ditolak oleh', data.approverName) : ''}
      </div>
      ${data.rejectionReason ? `<div class="reason-box"><strong>Alasan Penolakan:</strong><br>${data.rejectionReason}</div>` : ''}
      <p style="color:#6b7280;font-size:14px;">Anda dapat mengajukan permintaan baru dengan menyesuaikan kebutuhan.</p>
    `),
	};
}

export function meetingCancelledEmail(data: MeetingEmailData, cancelledByAdmin: boolean): { subject: string; html: string } {
	return {
		subject: `[OFM] Booking Meeting Dibatalkan: ${data.title}`,
		html: layout(`
      <span class="badge cancelled">⚠ Dibatalkan</span>
      <p class="greeting">Halo <strong>${data.requesterName}</strong>,</p>
      <p>Booking meeting Anda telah <strong>dibatalkan</strong>${cancelledByAdmin ? ' oleh admin' : ''}.</p>
      <div class="detail-box">
        ${detailRow('Judul Meeting', data.title)}
        ${detailRow('Tipe', data.type)}
        ${detailRow('Waktu Mulai', formatDate(data.startTime))}
        ${detailRow('Waktu Selesai', formatDate(data.endTime))}
      </div>
      ${data.cancellationReason ? `<div class="reason-box"><strong>Alasan Pembatalan:</strong><br>${data.cancellationReason}</div>` : ''}
      <p style="color:#6b7280;font-size:14px;">Hubungi admin jika Anda memerlukan informasi lebih lanjut.</p>
    `),
	};
}

export function meetingNewRequestEmail(data: MeetingEmailData): { subject: string; html: string } {
	return {
		subject: `[OFM] Permintaan Booking Meeting Baru: ${data.title}`,
		html: layout(`
      <span class="badge submitted">📋 Perlu Persetujuan</span>
      <p class="greeting">Ada permintaan booking meeting baru yang memerlukan persetujuan Anda.</p>
      <div class="detail-box">
        ${detailRow('Judul Meeting', data.title)}
        ${detailRow('Tipe', data.type)}
        ${detailRow('Waktu Mulai', formatDate(data.startTime))}
        ${detailRow('Waktu Selesai', formatDate(data.endTime))}
        ${detailRow('Diajukan oleh', data.requesterName)}
      </div>
      <p style="color:#6b7280;font-size:14px;">Login ke OFM untuk meninjau dan menyetujui permintaan ini.</p>
    `),
	};
}

// ── Transport ─────────────────────────────────────────────────────────────────

export interface TransportEmailData {
	requestId: string;
	purpose: string;
	scheduledTime: Date | string;
	pickup: string;
	destination: string;
	type: string;
	requesterName: string;
	approverName?: string;
	vehicleName?: string;
	driverName?: string;
	voucherCode?: string;
	rejectionReason?: string;
}

export function transportApprovedEmail(data: TransportEmailData): { subject: string; html: string } {
	return {
		subject: `[OFM] Permintaan Transportasi Disetujui`,
		html: layout(`
      <span class="badge approved">✓ Disetujui</span>
      <p class="greeting">Halo <strong>${data.requesterName}</strong>,</p>
      <p>Permintaan transportasi Anda telah <strong>disetujui</strong>.</p>
      <div class="detail-box">
        ${detailRow('Keperluan', data.purpose)}
        ${detailRow('Tipe', data.type)}
        ${detailRow('Jadwal', formatDate(data.scheduledTime))}
        ${detailRow('Penjemputan', data.pickup)}
        ${detailRow('Tujuan', data.destination)}
        ${data.vehicleName ? detailRow('Kendaraan', data.vehicleName) : ''}
        ${data.driverName ? detailRow('Driver', data.driverName) : ''}
        ${data.voucherCode ? detailRow('Voucher', data.voucherCode) : ''}
        ${data.approverName ? detailRow('Disetujui oleh', data.approverName) : ''}
      </div>
    `),
	};
}

export function transportRejectedEmail(data: TransportEmailData): { subject: string; html: string } {
	return {
		subject: `[OFM] Permintaan Transportasi Ditolak`,
		html: layout(`
      <span class="badge rejected">✗ Ditolak</span>
      <p class="greeting">Halo <strong>${data.requesterName}</strong>,</p>
      <p>Permintaan transportasi Anda <strong>ditolak</strong>.</p>
      <div class="detail-box">
        ${detailRow('Keperluan', data.purpose)}
        ${detailRow('Tipe', data.type)}
        ${detailRow('Jadwal', formatDate(data.scheduledTime))}
        ${detailRow('Penjemputan', data.pickup)}
        ${detailRow('Tujuan', data.destination)}
        ${data.approverName ? detailRow('Ditolak oleh', data.approverName) : ''}
      </div>
      ${data.rejectionReason ? `<div class="reason-box"><strong>Alasan Penolakan:</strong><br>${data.rejectionReason}</div>` : ''}
    `),
	};
}

export function transportCancelledEmail(data: TransportEmailData, cancelledByAdmin: boolean): { subject: string; html: string } {
	return {
		subject: `[OFM] Permintaan Transportasi Dibatalkan`,
		html: layout(`
      <span class="badge cancelled">⚠ Dibatalkan</span>
      <p class="greeting">Halo <strong>${data.requesterName}</strong>,</p>
      <p>Permintaan transportasi Anda telah <strong>dibatalkan</strong>${cancelledByAdmin ? ' oleh admin' : ''}.</p>
      <div class="detail-box">
        ${detailRow('Keperluan', data.purpose)}
        ${detailRow('Tipe', data.type)}
        ${detailRow('Jadwal', formatDate(data.scheduledTime))}
        ${detailRow('Penjemputan', data.pickup)}
        ${detailRow('Tujuan', data.destination)}
      </div>
      <p style="color:#6b7280;font-size:14px;">Hubungi admin jika Anda memerlukan informasi lebih lanjut.</p>
    `),
	};
}

export function transportNewRequestEmail(data: TransportEmailData): { subject: string; html: string } {
	return {
		subject: `[OFM] Permintaan Transportasi Baru dari ${data.requesterName}`,
		html: layout(`
      <span class="badge submitted">📋 Perlu Persetujuan</span>
      <p class="greeting">Ada permintaan transportasi baru yang memerlukan persetujuan Anda.</p>
      <div class="detail-box">
        ${detailRow('Keperluan', data.purpose)}
        ${detailRow('Tipe', data.type)}
        ${detailRow('Jadwal', formatDate(data.scheduledTime))}
        ${detailRow('Penjemputan', data.pickup)}
        ${detailRow('Tujuan', data.destination)}
        ${detailRow('Diajukan oleh', data.requesterName)}
      </div>
      <p style="color:#6b7280;font-size:14px;">Login ke OFM untuk meninjau dan menyetujui permintaan ini.</p>
    `),
	};
}

import { auth } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handler = auth.handler();

function shouldNormalizeEmail(url: URL): boolean {
	const path = url.pathname;
	return path.includes('/api/auth/sign-in/email')
		|| path.includes('/api/auth/sign-up/email')
		|| path.includes('/api/auth/email-otp/send-verification-otp')
		|| path.includes('/api/auth/forget-password');
}

async function normalizeEmailPayload(request: Request): Promise<Request> {
	if (request.method !== 'POST') return request;
	const contentType = request.headers.get('content-type') ?? '';
	if (!contentType.toLowerCase().includes('application/json')) return request;

	const url = new URL(request.url);
	if (!shouldNormalizeEmail(url)) return request;

	const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
	if (!payload || typeof payload !== 'object') return request;

	if (typeof payload.email === 'string') {
		payload.email = payload.email.trim().toLowerCase();
	}

	const headers = new Headers(request.headers);
	headers.delete('content-length');
	return new Request(request.url, {
		method: request.method,
		headers,
		body: JSON.stringify(payload),
	});
}

export const GET = handler.GET;
export async function POST(
	request: Request,
	context: { params: Promise<{ path: string[] }> },
) {
	const normalizedRequest = await normalizeEmailPayload(request);
	return handler.POST(normalizedRequest, context);
}
export const PUT = handler.PUT;
export const PATCH = handler.PATCH;
export const DELETE = handler.DELETE;

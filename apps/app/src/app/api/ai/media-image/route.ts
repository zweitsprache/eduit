import { del, put } from '@vercel/blob';
import { generateImage } from 'ai';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { aiGateway } from '@/lib/ai';
import { createUserMedia } from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const DEFAULT_IMAGE_MODEL = 'openai/gpt-image-1';

const requestSchema = z.object({
  prompt: z.string().trim().min(3).max(1500),
  alt: z.string().trim().max(500).default(''),
  name: z.string().trim().max(160).default('AI generated image'),
  width: z.number().int().min(512).max(1536).default(1024),
  height: z.number().int().min(512).max(1536).default(768),
});

function errorResponse(error: unknown, status = 400) {
  let message = 'Image generation failed.';
  if (typeof error === 'string') message = error;
  else if (error instanceof z.ZodError) {
    message = `Invalid image generation request: ${
      error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; ')
    }`;
  } else if (error instanceof Error) message = error.message;
  return NextResponse.json({ error: message }, { status });
}

function safeFilename(value: string, extension: string) {
  const base = value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/\.[^.]+$/, '')
    .slice(0, 140) || 'ai-generated-image';
  return `${base}.${extension}`;
}

function extensionForContentType(contentType: string) {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  return 'jpg';
}

function imageModelSize(width: number, height: number) {
  if (width === height) return '1024x1024';
  return width > height ? '1536x1024' : '1024x1536';
}

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return errorResponse('Unauthorized.', 401);

  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await request.json());
  } catch (error) {
    return errorResponse(error);
  }

  try {
    const { image } = await generateImage({
      model: aiGateway.image(process.env.AI_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL),
      prompt: input.prompt,
      size: imageModelSize(input.width, input.height),
      n: 1,
      abortSignal: request.signal,
    });
    const bytes = Buffer.from(image.uint8Array);
    const contentType = image.mediaType.toLowerCase();
    if (!contentType.startsWith('image/')) {
      throw new Error('The image model returned a non-image asset.');
    }
    const metadata = await sharp(bytes).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Generated image could not be read.');
    }

    const extension = extensionForContentType(contentType);
    const filename = safeFilename(input.name, extension);
    const blob = await put(`user-media/${user.id}/${filename}`, bytes, {
      access: 'private',
      addRandomSuffix: true,
      contentType,
      cacheControlMaxAge: 31_536_000,
    });

    try {
      const media = await createUserMedia(user.id, {
        blobPath: blob.pathname,
        filename,
        name: input.name || 'AI generated image',
        alt: input.alt || input.prompt.slice(0, 500),
        contentType,
        size: bytes.byteLength,
        width: metadata.width,
        height: metadata.height,
      });
      return NextResponse.json({ media }, { status: 201 });
    } catch (error) {
      await del(blob.pathname).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    return errorResponse(error, 502);
  }
}
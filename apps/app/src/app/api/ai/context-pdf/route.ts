import { extractText, getDocumentProxy } from 'unpdf';
import { getCurrentAppUser } from '@/lib/auth/authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_CONTEXT_CHARACTERS = 1_000_000;

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      throw new Error('Choose a PDF to upload.');
    }
    if (
      file.size === 0
      || file.size > MAX_FILE_BYTES
      || (file.type && file.type !== 'application/pdf')
      || !file.name.toLocaleLowerCase().endsWith('.pdf')
    ) {
      throw new Error('Upload a PDF smaller than 10 MB.');
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const signature = new TextDecoder('ascii').decode(bytes.slice(0, 5));
    if (signature !== '%PDF-') {
      throw new Error('The uploaded file is not a valid PDF.');
    }

    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: true });
    const fullText = String(extracted.text)
      .replaceAll('\u0000', '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (!fullText) {
      throw new Error(
        'No readable text was found. Scanned PDFs need OCR before upload.',
      );
    }

    return Response.json({
      name: file.name.trim().slice(0, 250),
      pageCount: extracted.totalPages,
      text: fullText.slice(0, MAX_CONTEXT_CHARACTERS),
      truncated: fullText.length > MAX_CONTEXT_CHARACTERS,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error
        ? error.message
        : 'Could not read the uploaded PDF.',
    }, { status: 400 });
  }
}

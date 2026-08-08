import { get } from '@vercel/blob';
import { serve } from '@upstash/workflow/nextjs';
import { sql } from '@/lib/neon';

export const runtime = 'nodejs';
export const maxDuration = 60;

type WorkflowPayload = {
  worksheetId: string;
  origin: string;
};

type Publication = {
  pdfPath: string;
};

export const { POST } = serve<WorkflowPayload>(async (context) => {
  const { worksheetId, origin } = context.requestPayload;

  await context.run('regenerate-dazit-metadata', async () => {
    const token = process.env.DAZIT_BLOB_READ_WRITE_TOKEN;
    const workflowToken = process.env.QSTASH_TOKEN;
    if (!token || !workflowToken) throw new Error('Dazit or workflow credentials are missing.');

    const rows = await sql`
      select
        pdf_path as "pdfPath"
      from dazit_publications
      where worksheet_id = ${worksheetId}
        and document_type = 'Lernkarten'
        and metadata_version < 3
    ` as Publication[];
    const publication = rows[0];
    if (!publication) return;

    const manifestPath = `library/${worksheetId}.json`;
    const [pdfBlob, manifestBlob] = await Promise.all([
      get(publication.pdfPath, { access: 'private', token, useCache: false }),
      get(manifestPath, { access: 'private', token, useCache: false }),
    ]);
    if (pdfBlob?.statusCode !== 200 || !pdfBlob.stream) {
      throw new Error('Published PDF not found.');
    }
    if (manifestBlob?.statusCode !== 200 || !manifestBlob.stream) {
      throw new Error('Dazit manifest not found.');
    }
    const metadata = await new Response(manifestBlob.stream).json() as Record<string, unknown>;
    const formData = new FormData();
    formData.set('mode', 'metadata-only');
    formData.set('metadata', JSON.stringify({ ...metadata, worksheetId }));
    if (metadata.worksheetSemanticManifest) {
      formData.set(
        'worksheetSemanticManifest',
        JSON.stringify(metadata.worksheetSemanticManifest),
      );
    }
    formData.set(
      'pdf',
      new File([await new Response(pdfBlob.stream).arrayBuffer()], 'worksheet.pdf', {
        type: 'application/pdf',
      }),
    );
    const response = await fetch(`${origin}/api/dazit/publish`, {
      method: 'POST',
      headers: { 'x-eduit-workflow-token': workflowToken },
      body: formData,
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(result?.error ?? 'Metadata republishing failed.');
    }
  });
});

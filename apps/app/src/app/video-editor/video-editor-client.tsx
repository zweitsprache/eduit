'use client';

import { useMemo } from 'react';
import { HttpRenderer } from '@/vendor/reactvideoeditor-repo/app/reactvideoeditor/pro/utils/http-renderer';
import { ReactVideoEditor } from '@/vendor/reactvideoeditor-repo/app/reactvideoeditor/pro/components/react-video-editor';
import { Toaster } from '@/vendor/reactvideoeditor-repo/app/reactvideoeditor/pro/components/ui/toaster';
import { COMP_NAME } from '@/vendor/reactvideoeditor-repo/app/constants';

const AVAILABLE_THEMES = [
  {
    id: 'rve',
    name: 'RVE',
    className: 'rve',
    color: '#3E8AF5',
  },
] as const;
export function VideoEditorClient() {
  const renderer = useMemo(() => new HttpRenderer('/api/latest/ssr', {
    type: 'ssr',
    entryPoint: '/api/latest/ssr',
  }), []);

  return (
    <div className="h-screen min-h-screen overflow-hidden bg-[#171717] text-white">
      <ReactVideoEditor
        projectId={COMP_NAME}
        renderer={renderer}
        fps={30}
        adaptors={{}}
        availableThemes={[...AVAILABLE_THEMES]}
        defaultTheme="dark"
        sidebarWidth="clamp(320px, 24vw, 480px)"
        sidebarIconWidth="57.6px"
        showIconTitles={false}
        sidebarLogo={<span className="text-xs font-semibold tracking-[0.32em] text-white">EDUIT</span>}
        sidebarFooterText="EDUIT"
      />
      <Toaster />
    </div>
  );
}
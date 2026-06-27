import { useState } from 'react';
import { Image, Video, Music, Upload, Search, FolderOpen, CloudUpload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

/* ── per-tab empty state config ── */
const EMPTY_STATES = {
  images: {
    icon: Image,
    title: 'No images yet',
    sub: 'Add images to bring your project to life',
  },
  videos: {
    icon: Video,
    title: 'No videos yet',
    sub: 'Import video clips to use in your timeline',
  },
  audio: {
    icon: Music,
    title: 'No audio yet',
    sub: 'Add music or sound effects to your project',
  },
} as const;

/* ── reusable empty state ── */
function EmptyAssetState({ tab }: { tab: keyof typeof EMPTY_STATES }) {
  const { icon: Icon, title, sub } = EMPTY_STATES[tab];
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full gap-4 px-4 text-center">
      <div className="w-10 h-10 rounded-studio-lg bg-studio-surface flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-studio-text-faint" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[12px] font-medium text-studio-text-secondary">{title}</p>
        <p className="text-[11px] text-studio-text-faint leading-relaxed">{sub}</p>
      </div>
      <button
        type="button"
        className="flex items-center justify-center gap-1.5 w-full h-8 px-3 text-[11px] font-medium text-studio-text-muted border border-studio-border rounded-studio-md hover:border-studio-border-strong hover:text-studio-text transition-colors duration-120"
      >
        <FolderOpen className="w-3 h-3" />
        Browse files
      </button>
    </div>
  );
}

/* ── upload tab ── */
function UploadTab() {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="flex flex-col flex-1 gap-3 px-3 py-4">
      {/* Drop zone */}
      <div
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => setDragging(false)}
        className={[
          'flex flex-col items-center justify-center gap-3 rounded-studio-lg border-2 border-dashed py-8 px-4 text-center transition-colors duration-120 cursor-pointer',
          dragging
            ? 'border-studio-accent bg-studio-accent-subtle'
            : 'border-studio-border hover:border-studio-border-strong hover:bg-studio-surface/40',
        ].join(' ')}
      >
        <div className={[
          'w-10 h-10 rounded-studio-lg flex items-center justify-center transition-colors duration-120',
          dragging ? 'bg-studio-accent-subtle' : 'bg-studio-surface',
        ].join(' ')}>
          <CloudUpload className={[
            'w-5 h-5 transition-colors duration-120',
            dragging ? 'text-studio-accent' : 'text-studio-text-faint',
          ].join(' ')} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[12px] font-medium text-studio-text-secondary">
            {dragging ? 'Drop to upload' : 'Drop files here'}
          </p>
          <p className="text-[11px] text-studio-text-faint">
            Images, videos, and audio
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-studio-border" />
        <span className="text-[10px] text-studio-text-faint uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-studio-border" />
      </div>

      {/* File type buttons */}
      <div className="flex flex-col gap-1.5">
        {[
          { icon: Image, label: 'Browse Images' },
          { icon: Video, label: 'Browse Videos' },
          { icon: Music, label: 'Browse Audio' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            className="flex items-center gap-2.5 h-8 px-3 rounded-studio-md bg-studio-surface border border-studio-border text-[12px] text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong transition-colors duration-120"
          >
            <Icon className="w-3.5 h-3.5 text-studio-text-faint" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── main component ── */
export default function AssetsPanel() {
  const [search, setSearch] = useState('');

  return (
    <div className="flex flex-col h-full bg-studio-panel overflow-hidden">

      {/* Header */}
      <div className="px-4 h-9 flex items-center border-b border-studio-border shrink-0">
        <span className="text-[11px] font-semibold text-studio-text-faint uppercase tracking-widest">
          Assets
        </span>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-studio-text-faint pointer-events-none" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-[12px] bg-studio-surface border-studio-border text-studio-text placeholder:text-studio-text-faint rounded-studio-md focus-visible:ring-studio-accent focus-visible:border-studio-accent-border"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="images" className="flex flex-col flex-1 min-h-0">
        <div className="px-3 pt-2 pb-3 shrink-0">
          <TabsList className="w-full grid grid-cols-4 h-14! bg-studio-surface rounded-studio-xl p-1">
            {([
              { value: 'images', label: 'Images', icon: Image },
              { value: 'videos', label: 'Videos', icon: Video },
              { value: 'audio',  label: 'Audio',  icon: Music },
              { value: 'upload', label: 'Upload', icon: Upload },
            ] as const).map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-full flex flex-col items-center justify-center gap-1.5 rounded-studio-lg px-0 text-studio-text-faint transition-all duration-120 data-[state=active]:bg-studio-overlay data-[state=active]:text-studio-text data-[state=active]:shadow-[0_1px_4px_oklch(0_0_0/40%)]"
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-[11px] font-medium leading-none">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Content */}
        <TabsContent value="images" className="flex-1 flex flex-col w-full mt-0 min-h-0">
          <EmptyAssetState tab="images" />
        </TabsContent>

        <TabsContent value="videos" className="flex-1 flex flex-col w-full mt-0 min-h-0">
          <EmptyAssetState tab="videos" />
        </TabsContent>

        <TabsContent value="audio" className="flex-1 flex flex-col w-full mt-0 min-h-0">
          <EmptyAssetState tab="audio" />
        </TabsContent>

        <TabsContent value="upload" className="flex-1 flex flex-col w-full mt-0 min-h-0 overflow-y-auto">
          <UploadTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

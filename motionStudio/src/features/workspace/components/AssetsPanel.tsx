import { useRef, useState } from 'react';
import { Image, Video, Music, Upload, Search, FolderOpen, CloudUpload, X, Play, Sparkle, Loader2, FileWarning } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAssetEngine, isUrlUsable } from '@/engines/asset';
import { useCanvasEngine } from '@/engines/canvas';
import { useEditorStore } from '@/engines/editor';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/apiClient';
import type { StockResult, StockType } from '@/lib/apiClient';
import type { Asset, AssetType } from '@/engines/asset';

type TabKey = 'images' | 'videos' | 'audio' | 'upload' | 'stock';

/* which asset type each media tab shows, and its accept filter */
const TAB_TYPE: Record<'images' | 'videos' | 'audio', { type: AssetType; accept: string }> = {
  images: { type: 'image', accept: 'image/*' },
  videos: { type: 'video', accept: 'video/*' },
  audio:  { type: 'audio', accept: 'audio/*' },
};

const EMPTY_STATES = {
  images: { icon: Image, title: 'No images yet', sub: 'Add images to bring your project to life' },
  videos: { icon: Video, title: 'No videos yet', sub: 'Import video clips to use in your timeline' },
  audio:  { icon: Music, title: 'No audio yet',  sub: 'Add music or sound effects to your project' },
} as const;

/* ── reusable empty state ── */
function EmptyAssetState({
  tab,
  onBrowse,
}: {
  tab: keyof typeof EMPTY_STATES;
  onBrowse: () => void;
}) {
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
        onClick={onBrowse}
        className="flex items-center justify-center gap-1.5 w-full h-8 px-3 text-[11px] font-medium text-studio-text-muted border border-studio-border rounded-studio-md hover:border-studio-border-strong hover:text-studio-text transition-colors duration-120"
      >
        <FolderOpen className="w-3 h-3" />
        Browse files
      </button>
    </div>
  );
}

/* ── one asset thumbnail ── */
function AssetCard({
  asset,
  onAdd,
  onRemove,
}: {
  asset: Asset;
  onAdd: () => void;
  onRemove: () => void;
}) {
  // The file's bytes aren't on this device and there's no cloud copy — its URL
  // points at a session that ended. The renderers already skip these, so
  // without a marker here the media would just silently vanish from the canvas
  // with no way to tell which file needs replacing.
  const missing = !isUrlUsable(asset.url);

  if (missing) {
    return (
      <div
        title={`${asset.name} — file not available on this device. Re-upload it to use it again.`}
        className="group relative aspect-video rounded-studio-md overflow-hidden border border-dashed border-amber-500/40 bg-amber-500/5 flex flex-col items-center justify-center gap-1 px-2"
      >
        <FileWarning className="w-4 h-4 text-amber-400/80" strokeWidth={1.5} />
        <span className="text-[9px] text-amber-300/80 text-center leading-tight">Re-upload needed</span>
        <span className="block w-full text-[10px] text-studio-text-faint truncate text-center">
          {asset.name}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Remove asset"
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-studio-xs bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity duration-120"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onAdd}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-motionstudio-asset', asset.id);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      title="Click or drag onto the canvas"
      className="group relative aspect-video rounded-studio-md overflow-hidden border border-studio-border bg-studio-surface cursor-pointer hover:border-studio-border-strong transition-colors duration-120"
    >
      {asset.type === 'image' && (
        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
      )}
      {asset.type === 'video' && (
        <>
          <video src={asset.url} muted preload="metadata" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-3 h-3 text-white" />
            </div>
          </div>
        </>
      )}
      {asset.type === 'audio' && (
        <div className="w-full h-full flex items-center justify-center">
          <Music className="w-5 h-5 text-studio-text-faint" strokeWidth={1.5} />
        </div>
      )}

      {/* name */}
      <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/70 to-transparent px-1.5 py-1">
        <span className="block text-[10px] text-white/90 truncate">{asset.name}</span>
      </div>

      {/* remove */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        title="Remove asset"
        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-studio-xs bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity duration-120"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ── grid for a media tab ── */
function AssetGrid({
  assets,
  tab,
  onBrowse,
  onAdd,
  onRemove,
}: {
  assets: Asset[];
  tab: keyof typeof EMPTY_STATES;
  onBrowse: () => void;
  onAdd: (asset: Asset) => void;
  onRemove: (id: string) => void;
}) {
  if (assets.length === 0) return <EmptyAssetState tab={tab} onBrowse={onBrowse} />;
  return (
    <div className="grid grid-cols-2 gap-2 px-3 pb-3">
      {assets.map((a) => (
        <AssetCard key={a.id} asset={a} onAdd={() => onAdd(a)} onRemove={() => onRemove(a.id)} />
      ))}
    </div>
  );
}

/* ── upload tab ── */
function UploadTab({
  onFiles,
  onBrowse,
}: {
  onFiles: (files: File[]) => void;
  onBrowse: (accept: string) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="flex flex-col flex-1 gap-3 px-3 py-4">
      {/* Drop zone */}
      <div
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => onBrowse('image/*,video/*,audio/*')}
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
          <p className="text-[11px] text-studio-text-faint">Images, videos, and audio</p>
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
          { icon: Image, label: 'Browse Images', accept: 'image/*' },
          { icon: Video, label: 'Browse Videos', accept: 'video/*' },
          { icon: Music, label: 'Browse Audio',  accept: 'audio/*' },
        ].map(({ icon: Icon, label, accept }) => (
          <button
            key={label}
            type="button"
            onClick={() => onBrowse(accept)}
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

/* ── stock tab: search Pexels, import a result into the asset library ── */
function StockTab({
  onImport,
}: {
  onImport: (file: File) => void;
}) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<StockType>('photo');
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(q: string, t: StockType) {
    if (!token) { setError('Sign in to search stock media'); return; }
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { results } = await api.searchStock(token, q.trim(), t);
      setResults(results);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(r: StockResult) {
    setImportingId(r.id);
    try {
      const res = await fetch(r.downloadUrl);
      const blob = await res.blob();
      const ext = r.type === 'video' ? 'mp4' : 'jpg';
      const file = new File([blob], `pexels-${r.id}.${ext}`, { type: blob.type });
      onImport(file);
    } catch {
      setError('Import failed — try again');
    } finally {
      setImportingId(null);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-col gap-2 px-3 pt-1 pb-3 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(query, type); }}
          className="relative"
        >
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-studio-text-faint pointer-events-none" />
          <Input
            placeholder="Search Pexels..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 pl-8 text-[12px] bg-studio-surface border-studio-border text-studio-text placeholder:text-studio-text-faint rounded-studio-md focus-visible:ring-studio-accent focus-visible:border-studio-accent-border"
          />
        </form>
        <div className="grid grid-cols-2 gap-1.5">
          {(['photo', 'video'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); if (query.trim()) runSearch(query, t); }}
              className={[
                'h-7 rounded-studio-sm text-[11px] font-medium capitalize transition-colors duration-120',
                type === t
                  ? 'bg-studio-overlay text-studio-text'
                  : 'bg-studio-surface text-studio-text-faint hover:text-studio-text-muted',
              ].join(' ')}
            >
              {t}s
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 text-studio-text-faint animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-[11px] text-red-400 px-1 py-2 leading-relaxed">{error}</p>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="w-10 h-10 rounded-studio-lg bg-studio-surface flex items-center justify-center">
              <Sparkle className="w-5 h-5 text-studio-text-faint" strokeWidth={1.5} />
            </div>
            <p className="text-[11px] text-studio-text-faint leading-relaxed px-2">
              Search free stock photos and videos from Pexels
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleImport(r)}
                disabled={importingId !== null}
                className="group relative w-full aspect-video rounded-studio-md overflow-hidden border border-studio-border bg-studio-surface disabled:opacity-60"
              >
                <img src={r.thumbnailUrl} alt="" className="w-full h-full object-cover" />

                {r.type === 'video' && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center pointer-events-none">
                    <Play className="w-2.5 h-2.5 text-white" />
                  </div>
                )}

                {/* photographer credit — visible by default, not hidden behind hover */}
                <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/70 to-transparent px-1.5 py-1 pointer-events-none">
                  <span className="block text-[10px] text-white/80 truncate">{r.photographer}</span>
                </div>

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-120 flex items-center justify-center">
                  {importingId === r.id ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <span className="opacity-0 group-hover:opacity-100 text-[11px] font-medium text-white transition-opacity duration-120">
                      Add to project
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── main component ── */
export default function AssetsPanel() {
  const { assets, uploadFiles, removeAsset } = useAssetEngine();
  const { addImage, addVideo, addAudio } = useCanvasEngine();
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('images');
  const inputRef = useRef<HTMLInputElement>(null);

  /* place an asset onto the canvas / timeline */
  function handleAdd(asset: Asset) {
    const el =
      asset.type === 'image' ? addImage(asset.id) :
      asset.type === 'video' ? addVideo(asset.id) :
      asset.type === 'audio' ? addAudio(asset.id) :
      null;
    if (el) setSelectedElement(el.id);
  }

  const q = search.trim().toLowerCase();
  const byType = (type: AssetType) =>
    assets.filter((a) => a.type === type && (!q || a.name.toLowerCase().includes(q)));

  function openPicker(accept: string) {
    const input = inputRef.current;
    if (!input) return;
    input.accept = accept;
    input.click();
  }

  async function handleFiles(files: File[]) {
    const created = await uploadFiles(files);
    if (created.length > 0) {
      const t = created[0].type;
      setActiveTab(t === 'image' ? 'images' : t === 'video' ? 'videos' : 'audio');
    }
  }

  async function handleStockImport(file: File) {
    await handleFiles([file]);
  }

  return (
    <div className="flex flex-col h-full bg-studio-panel overflow-hidden">
      {/* hidden file input shared by all browse actions */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(Array.from(e.target.files));
          e.target.value = ''; // allow re-picking the same file
        }}
      />

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
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabKey)}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="px-3 pt-2 pb-3 shrink-0">
          <TabsList className="w-full grid grid-cols-5 h-14! bg-studio-surface rounded-studio-xl p-1">
            {([
              { value: 'images', label: 'Images', icon: Image },
              { value: 'videos', label: 'Videos', icon: Video },
              { value: 'audio',  label: 'Audio',  icon: Music },
              { value: 'stock',  label: 'Stock',  icon: Sparkle },
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
        <TabsContent value="images" className="flex-1 flex flex-col w-full mt-0 min-h-0 overflow-y-auto">
          <AssetGrid assets={byType('image')} tab="images" onBrowse={() => openPicker(TAB_TYPE.images.accept)} onAdd={handleAdd} onRemove={removeAsset} />
        </TabsContent>

        <TabsContent value="videos" className="flex-1 flex flex-col w-full mt-0 min-h-0 overflow-y-auto">
          <AssetGrid assets={byType('video')} tab="videos" onBrowse={() => openPicker(TAB_TYPE.videos.accept)} onAdd={handleAdd} onRemove={removeAsset} />
        </TabsContent>

        <TabsContent value="audio" className="flex-1 flex flex-col w-full mt-0 min-h-0 overflow-y-auto">
          <AssetGrid assets={byType('audio')} tab="audio" onBrowse={() => openPicker(TAB_TYPE.audio.accept)} onAdd={handleAdd} onRemove={removeAsset} />
        </TabsContent>

        <TabsContent value="stock" className="flex-1 flex flex-col w-full mt-0 min-h-0 overflow-hidden">
          <StockTab onImport={handleStockImport} />
        </TabsContent>

        <TabsContent value="upload" className="flex-1 flex flex-col w-full mt-0 min-h-0 overflow-y-auto">
          <UploadTab onFiles={handleFiles} onBrowse={openPicker} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

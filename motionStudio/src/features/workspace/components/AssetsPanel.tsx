import { useEffect, useRef, useState } from 'react';
import { Music, Upload, Search, FolderOpen, X, Play, Sparkle, Loader2, FileWarning } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAssetEngine, isUrlUsable, assetTypeFromFile } from '@/engines/asset';
import { useCanvasEngine } from '@/engines/canvas';
import { useEditorStore } from '@/engines/editor';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/apiClient';
import { useFeedbackStore } from '@/lib/feedbackStore';
import type { StockResult, StockType } from '@/lib/apiClient';
import type { Asset, AssetType } from '@/engines/asset';

type TabKey = 'library' | 'stock';


/* ── empty library ──
   The old version was three near-identical "No images yet" cards, one per
   media tab, and none of them mentioned Upload or Stock — the only two ways
   to actually get content. This one names both routes. */
function EmptyLibraryState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full gap-4 px-4 py-10 text-center">
      <div className="w-10 h-10 rounded-studio-lg bg-studio-surface flex items-center justify-center shrink-0">
        <FolderOpen className="w-5 h-5 text-studio-text-faint" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[12px] font-medium text-studio-text-secondary">No media yet</p>
        <p className="text-[11px] text-studio-text-faint leading-relaxed">
          Add your own files, or browse free stock in the Stock tab.
        </p>
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
  const openFeedback = useFeedbackStore((s) => s.openFeedback);

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
        {/* If a file went missing without the user deleting it, that's worth
            hearing about — this is the moment they notice, and the only moment
            they still remember what they uploaded. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openFeedback(
              `Media went missing: "${asset.name}"\n\nIt shows "Re-upload needed" in the Assets panel.\n\nWhat I was doing:\n`,
            );
          }}
          className="text-[9px] text-amber-300/60 hover:text-amber-200 underline underline-offset-2 transition-colors"
        >
          Report this
        </button>
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

/* ── the library grid, with its two distinct empty states ── */
function LibraryGrid({
  assets,
  hasAnyAssets,
  filtered,
  onBrowse,
  onAdd,
  onRemove,
}: {
  assets: Asset[];
  hasAnyAssets: boolean;
  filtered: boolean;
  onBrowse: () => void;
  onAdd: (asset: Asset) => void;
  onRemove: (id: string) => void;
}) {
  // "nothing here yet" and "nothing matches your filter" need different
  // answers — offering a Browse button to someone who just mistyped a search
  // is unhelpful.
  if (assets.length === 0) {
    if (hasAnyAssets && filtered) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-1.5 px-4 py-10 text-center">
          <Search className="w-4 h-4 text-studio-text-faint" strokeWidth={1.5} />
          <p className="text-[12px] text-studio-text-muted">No matching assets</p>
          <p className="text-[11px] text-studio-text-faint">Try a different search or filter.</p>
        </div>
      );
    }
    return <EmptyLibraryState onBrowse={onBrowse} />;
  }

  return (
    <div className="grid grid-cols-2 gap-2 px-3 pb-3">
      {assets.map((a) => (
        <AssetCard key={a.id} asset={a} onAdd={() => onAdd(a)} onRemove={() => onRemove(a.id)} />
      ))}
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
      const { results } = await api.searchStock(q.trim(), t);
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
        {/* Stock needs an account, and the panel used to look fully usable
            when signed out — you only found out after submitting, as red text
            with no way to act on it. Say so up front instead. */}
        {!token && (
          <div className="rounded-studio-md border border-studio-border bg-studio-surface/60 px-2.5 py-2">
            <p className="text-[11px] text-studio-text-muted leading-relaxed">
              Sign in to search free Pexels photos and video.
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(query, type); }}
          className="flex items-center gap-1.5"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-studio-text-faint pointer-events-none" />
            <Input
              placeholder="Search Pexels..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!token}
              className="h-8 pl-8 text-[12px] bg-studio-surface border-studio-border text-studio-text placeholder:text-studio-text-faint rounded-studio-md focus-visible:ring-studio-accent focus-visible:border-studio-accent-border disabled:opacity-50"
            />
          </div>
          {/* Was Enter-only, with nothing on screen saying so. */}
          <button
            type="submit"
            disabled={!token || !query.trim()}
            title="Search"
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-studio-md bg-studio-surface border border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong disabled:opacity-40 transition-colors duration-120"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
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
  const [activeTab, setActiveTab] = useState<TabKey>('library');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
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
  const visibleAssets = assets.filter(
    (a) => (typeFilter === 'all' || a.type === typeFilter) && (!q || a.name.toLowerCase().includes(q)),
  );

  function openPicker(accept: string) {
    const input = inputRef.current;
    if (!input) return;
    input.accept = accept;
    input.click();
  }

  async function handleFiles(files: File[]) {
    // The engine silently skips files it can't type, so dropping a PDF used to
    // do nothing at all — no message, no rejected list. Work out what won't be
    // accepted up front so we can say so.
    const unsupported = files.filter((f) => !assetTypeFromFile(f));
    setRejected(unsupported.map((f) => f.name));

    const supported = files.filter((f) => assetTypeFromFile(f));
    if (supported.length === 0) return;

    setBusy(true);
    try {
      await uploadFiles(supported);
      // Deliberately does NOT switch tabs: it used to jump based on the first
      // file's type, moving the panel out from under you mid-drop.
      setActiveTab('library');
    } finally {
      setBusy(false);
    }
  }

  async function handleStockImport(file: File) {
    await handleFiles([file]);
  }

  /* Paste as a first-class way in.
     A screenshot is the single most common thing anyone puts in a video like
     this, and it starts life on the clipboard — going via a file picker means
     saving it to disk first, purely to find it again. Bound at the document so
     it works wherever you are in the editor rather than only inside this panel.

     Skipped while typing: a paste into the text content box or a number field
     is text, and hijacking it would break editing outright. */
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const el = document.activeElement as HTMLElement | null;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable) return;

      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length === 0) return;
      e.preventDefault();
      void handleFiles(files);
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  // handleFiles closes over state that changes every render; re-binding a
  // listener each time is cheaper than the alternatives and has no user effect.
  });

  return (
    <div
      className="relative flex flex-col h-full bg-studio-panel overflow-hidden"
      onDragEnter={(e) => { if (e.dataTransfer.types.includes('Files')) setDragging(true); }}
      onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); }}
      onDragLeave={(e) => {
        // Only clear when the pointer actually leaves the panel, not when it
        // crosses between children (dragleave fires on every child boundary).
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        setDragging(false);
        handleFiles(Array.from(e.dataTransfer.files));
      }}
    >
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

      {/* Adding media is the whole point of this panel on a new project, so it
          gets a permanent control rather than being one of five 40px tabs the
          user has to notice. */}
      <div className="px-3 pt-3 shrink-0">
        <button
          type="button"
          data-tour="add-media"
          onClick={() => openPicker('image/*,video/*,audio/*')}
          disabled={busy}
          className="w-full h-9 flex items-center justify-center gap-1.5 rounded-studio-md bg-studio-accent hover:bg-studio-accent-hover disabled:opacity-60 text-white text-[12px] font-medium transition-colors duration-120"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {busy ? 'Adding…' : 'Add media'}
        </button>
        <p className="mt-1.5 text-[10px] text-studio-text-faint text-center">
          or drop files anywhere · ⌘V to paste
        </p>
      </div>

      {rejected.length > 0 && (
        <div className="mx-3 mt-2 shrink-0 rounded-studio-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
          <p className="text-[10px] text-amber-300/90 leading-relaxed">
            Couldn’t add {rejected.join(', ')} — unsupported file type.
          </p>
          <button
            type="button"
            onClick={() => setRejected([])}
            className="mt-1 text-[10px] text-amber-300/70 hover:text-amber-200 underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabKey)}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="px-3 pt-3 pb-2 shrink-0">
          <TabsList className="w-full grid grid-cols-2 h-8 bg-studio-surface rounded-studio-lg p-1">
            {([
              { value: 'library', label: 'Library', icon: FolderOpen },
              { value: 'stock',   label: 'Stock',   icon: Sparkle },
            ] as const).map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                data-tour={`${value}-tab`}
                className="h-full flex items-center justify-center gap-1.5 rounded-studio-md text-[11px] font-medium text-studio-text-faint transition-all duration-120 data-[state=active]:bg-studio-overlay data-[state=active]:text-studio-text"
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="library" className="flex-1 flex flex-col w-full mt-0 min-h-0 overflow-hidden">
          {/* Search and the type filter live INSIDE Library — they only ever
              acted on it, but used to render over Stock and Upload too where
              typing produced no feedback at all. */}
          {assets.length > 0 && (
            <div className="px-3 pb-2 shrink-0 flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-studio-text-faint pointer-events-none" />
                <Input
                  placeholder="Search assets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-[12px] bg-studio-surface border-studio-border text-studio-text placeholder:text-studio-text-faint rounded-studio-md focus-visible:ring-studio-accent focus-visible:border-studio-accent-border"
                />
              </div>
              <div className="flex items-center gap-1">
                {([
                  { value: 'all',   label: 'All' },
                  { value: 'image', label: 'Images' },
                  { value: 'video', label: 'Videos' },
                  { value: 'audio', label: 'Audio' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTypeFilter(value)}
                    className={[
                      'flex-1 h-6 rounded-studio-sm text-[10px] font-medium transition-colors duration-120',
                      typeFilter === value
                        ? 'bg-studio-accent-subtle text-studio-accent'
                        : 'text-studio-text-faint hover:text-studio-text hover:bg-studio-surface',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto">
            <LibraryGrid
              assets={visibleAssets}
              hasAnyAssets={assets.length > 0}
              filtered={!!q || typeFilter !== 'all'}
              onBrowse={() => openPicker('image/*,video/*,audio/*')}
              onAdd={handleAdd}
              onRemove={removeAsset}
            />
          </div>
        </TabsContent>

        <TabsContent value="stock" className="flex-1 flex flex-col w-full mt-0 min-h-0 overflow-hidden">
          <StockTab onImport={handleStockImport} />
        </TabsContent>
      </Tabs>

      {/* Drop anywhere in the panel, not just on one tab's zone */}
      {dragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-studio-accent-subtle/80 border-2 border-dashed border-studio-accent pointer-events-none">
          <span className="text-[12px] font-medium text-studio-accent">Drop to add</span>
        </div>
      )}
    </div>
  );
}

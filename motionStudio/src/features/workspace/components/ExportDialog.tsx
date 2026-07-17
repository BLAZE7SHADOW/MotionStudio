import { useState, useEffect } from 'react';
import { Download, Loader2, MonitorDown, Cloud, LogIn, LogOut, User2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCompositionDimensions } from '@/engines/project';
import { exportComposition, downloadBlob, isExportSupported } from '@/engines/export';
import type { Project } from '@/engines/project';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/apiClient';
import type { QuotaResult } from '@/lib/apiClient';
import { track } from '@/lib/analytics';

const RESOLUTIONS = [
  { id: 'full', label: 'Full', scale: 1 },
  { id: 'high', label: '75%',  scale: 0.75 },
  { id: 'half', label: '50%',  scale: 0.5 },
] as const;

const QUALITIES = [
  { id: 'max',    label: 'Max',    bps: 40_000_000 },
  { id: 'high',   label: 'High',   bps: 20_000_000 },
  { id: 'medium', label: 'Medium', bps: 10_000_000 },
  { id: 'low',    label: 'Low',    bps: 5_000_000 },
] as const;

type Tab = 'browser' | 'cloud';

export default function ExportDialog({ project }: { project: Project }) {
  const { user, token, loading: authLoading, isAnonymous, signInWithGoogle, signInAsGuest, signOut } = useAuth();

  const [tab, setTab] = useState<Tab>('browser');

  // browser export state
  const [resolutionId, setResolutionId] = useState<string>('full');
  const [qualityId, setQualityId] = useState<string>('high');
  const [progress, setProgress] = useState<number | null>(null);
  const [browserError, setBrowserError] = useState<string | null>(null);

  // cloud render state
  const [quota, setQuota] = useState<QuotaResult | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'rendering' | 'done' | 'error'>('idle');
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // How many assets referenced by elements still lack a cloud storage URL
  const pendingAssets = (() => {
    const usedIds = new Set(
      project.canvas.elements
        .filter((e): e is Extract<typeof e, { assetId: string }> => 'assetId' in e)
        .map((e) => e.assetId),
    );
    return project.assets.filter((a) => usedIds.has(a.id) && !a.storageUrl).length;
  })();

  const dims = getCompositionDimensions(project.aspectRatio);
  const supported = isExportSupported();
  const exporting = progress !== null;

  // fetch quota whenever auth changes
  useEffect(() => {
    if (!token) { setQuota(null); return; }
    api.getQuota(token).then(setQuota).catch(() => setQuota(null));
  }, [token]);

  // reset cloud state on sign-out
  useEffect(() => {
    if (!user) {
      setCloudStatus('idle');
      setDownloadUrl(null);
      setCloudError(null);
    }
  }, [user]);

  async function handleBrowserExport() {
    const resolution = RESOLUTIONS.find((r) => r.id === resolutionId) ?? RESOLUTIONS[0];
    const quality = QUALITIES.find((q) => q.id === qualityId) ?? QUALITIES[0];
    setBrowserError(null);
    setProgress(0);
    track.exportBrowserStarted({ resolution: resolution.id, quality: quality.id, bps: quality.bps });
    const startedAt = Date.now();
    try {
      const { blob, extension } = await exportComposition(project, {
        resolutionScale: resolution.scale,
        videoBitsPerSecond: quality.bps,
        onProgress: (frame, total) => setProgress(Math.round((frame / total) * 100)),
      });
      downloadBlob(blob, `${project.name || 'video'}.${extension}`);
      track.exportBrowserCompleted(Date.now() - startedAt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Export failed';
      setBrowserError(msg);
      track.exportBrowserFailed(msg);
    } finally {
      setProgress(null);
    }
  }

  async function handleCloudRender() {
    if (!token) return;
    setCloudError(null);
    setCloudStatus('rendering');
    setDownloadUrl(null);
    track.exportCloudStarted();

    // Remap assets: Lambda needs public https:// URLs, not browser blob: URLs.
    // storageUrl is set by the background upload in the asset engine.
    // If an asset is still uploading (storageUrl missing), pass url as-is —
    // Lambda will fail on that asset, which is better than blocking the render.
    const assets = project.assets.map((a) => ({
      ...a,
      url: a.storageUrl ?? a.url,
    }));

    const inputProps = {
      elements: project.canvas.elements,
      assets,
      aspectRatio: project.aspectRatio,
      fps: project.fps,
      durationInFrames: project.durationInFrames,
    };

    try {
      const result = await api.startRender(token, inputProps);
      setDownloadUrl(result.url);
      setCloudStatus('done');
      track.exportCloudCompleted();
      api.getQuota(token).then(setQuota).catch(() => null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Render failed';
      setCloudError(msg);
      setCloudStatus('error');
      track.exportCloudFailed(msg);
    }
  }

  return (
    <Dialog onOpenChange={(open) => { if (open) track.exportDialogOpened(); }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          title="Export"
          className="h-7 px-3 text-[12px] font-medium bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-studio-panel border-studio-border-strong rounded-studio-xl p-0 gap-0 max-w-md">
        <DialogHeader className="px-5 py-4 border-b border-studio-border">
          <DialogTitle className="text-[14px] font-semibold text-studio-text">
            Export video · MP4
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-studio-border px-5">
          {(['browser', 'cloud'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); track.exportTabChanged(t); }}
              className={[
                'flex items-center gap-1.5 py-2.5 px-3 text-[11px] font-medium border-b-2 transition-colors -mb-px',
                tab === t
                  ? 'border-studio-accent text-studio-accent'
                  : 'border-transparent text-studio-text-muted hover:text-studio-text',
              ].join(' ')}
            >
              {t === 'browser' ? <MonitorDown className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
              {t === 'browser' ? 'Browser' : 'Cloud Render'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">

          {/* ── Browser tab ── */}
          {tab === 'browser' && (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-studio-text-muted uppercase tracking-wider">Resolution</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      disabled={exporting}
                      onClick={() => setResolutionId(r.id)}
                      className={[
                        'h-8 text-[11px] font-medium rounded-studio-md border transition-colors duration-120 disabled:opacity-40',
                        resolutionId === r.id
                          ? 'bg-studio-accent-subtle border-studio-accent-border text-studio-accent'
                          : 'bg-studio-surface border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong',
                      ].join(' ')}
                    >
                      {r.label} · {Math.round(dims.height * r.scale)}p
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-studio-text-muted uppercase tracking-wider">Quality</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {QUALITIES.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      disabled={exporting}
                      onClick={() => setQualityId(q.id)}
                      className={[
                        'h-8 text-[11px] font-medium rounded-studio-md border transition-colors duration-120 disabled:opacity-40',
                        qualityId === q.id
                          ? 'bg-studio-accent-subtle border-studio-accent-border text-studio-accent'
                          : 'bg-studio-surface border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong',
                      ].join(' ')}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-studio-text-faint">
                  {(QUALITIES.find((q) => q.id === qualityId)?.bps ?? 0) / 1_000_000} Mbps ·
                  frame-perfect offline encode — nothing is dropped or rushed.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleBrowserExport}
                disabled={exporting || !supported}
                className="h-9 text-[12px] font-medium bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md gap-1.5 disabled:opacity-70"
              >
                {exporting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Rendering… {progress}%</>
                ) : (
                  <><MonitorDown className="w-3.5 h-3.5" />Export & download</>
                )}
              </Button>

              {!supported && (
                <p className="text-[11px] text-studio-text-faint">Your browser doesn't support WebCodecs. Use Chrome or Edge.</p>
              )}
              {browserError && <p className="text-[11px] text-red-400">{browserError}</p>}
              <p className="text-[10px] text-studio-text-faint leading-relaxed">
                Renders in your browser — audio included. Requires Chrome or Edge.
              </p>
            </>
          )}

          {/* ── Cloud tab ── */}
          {tab === 'cloud' && (
            <>
              {authLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-studio-text-muted" />
                </div>

              ) : !user ? (
                // not signed in — show both options
                <div className="flex flex-col items-center gap-3 py-4">
                  <p className="text-[12px] text-studio-text-muted text-center leading-relaxed">
                    Rendered on AWS Lambda — full 1080p, no CPU usage, any browser.
                  </p>
                  <Button
                    type="button"
                    onClick={signInWithGoogle}
                    className="w-full h-9 text-[12px] font-medium bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign in with Google · 5 renders/month
                  </Button>
                  <Button
                    type="button"
                    onClick={signInAsGuest}
                    variant="outline"
                    className="w-full h-9 text-[12px] font-medium rounded-studio-md gap-1.5 border-studio-border text-studio-text-muted hover:text-studio-text"
                  >
                    <User2 className="w-3.5 h-3.5" />
                    Continue as guest · 1 free render
                  </Button>
                </div>

              ) : (
                // signed in
                <>
                  {/* User row */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      {isAnonymous ? (
                        <span className="text-[11px] text-studio-text">Guest user</span>
                      ) : (
                        <span className="text-[11px] text-studio-text">{user.email}</span>
                      )}
                      <span className="text-[10px] text-studio-text-faint">
                        {quota
                          ? `${quota.remaining} of ${quota.limit} render${quota.limit > 1 ? 's' : ''} remaining this month`
                          : 'Loading quota…'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={signOut}
                      className="text-studio-text-faint hover:text-studio-text"
                      title="Sign out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quota bar */}
                  {quota && (
                    <div className="h-1 bg-studio-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-studio-accent rounded-full transition-all"
                        style={{ width: `${Math.min((quota.used / quota.limit) * 100, 100)}%` }}
                      />
                    </div>
                  )}

                  {/* Guest upgrade nudge */}
                  {isAnonymous && (
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="text-[11px] text-studio-accent hover:underline text-left"
                    >
                      Sign in with Google for 5 renders/month →
                    </button>
                  )}

                  {/* Pending asset upload warning */}
                  {pendingAssets > 0 && cloudStatus === 'idle' && (
                    <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading {pendingAssets} asset{pendingAssets > 1 ? 's' : ''} to cloud… render will use the latest available.
                    </p>
                  )}

                  {/* Render button */}
                  <Button
                    type="button"
                    onClick={handleCloudRender}
                    disabled={cloudStatus === 'rendering' || (quota?.remaining ?? 1) <= 0}
                    className="h-9 text-[12px] font-medium bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md gap-1.5 disabled:opacity-70"
                  >
                    {cloudStatus === 'rendering' ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" />Rendering on cloud…</>
                    ) : (
                      <><Cloud className="w-3.5 h-3.5" />Render & download</>
                    )}
                  </Button>

                  {/* Download link */}
                  {cloudStatus === 'done' && downloadUrl && (
                    <a
                      href={downloadUrl}
                      download="motionstudio-export.mp4"
                      onClick={track.exportCloudDownloadClicked}
                      className="flex items-center justify-center gap-1.5 h-9 text-[12px] font-medium bg-green-600 hover:bg-green-700 text-white rounded-studio-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download MP4
                    </a>
                  )}

                  {cloudError && <p className="text-[11px] text-red-400">{cloudError}</p>}

                  {quota?.remaining === 0 && (
                    <p className="text-[11px] text-studio-text-faint">
                      {isAnonymous ? 'Guest limit reached. Sign in with Google for 5 renders/month.' : 'Monthly limit reached. Resets on the 1st.'}
                    </p>
                  )}

                  <p className="text-[10px] text-studio-text-faint leading-relaxed">
                    Rendered on AWS Lambda — full 1080p, any browser, no CPU usage.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

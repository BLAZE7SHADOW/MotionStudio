import posthog from 'posthog-js';

// Single source of truth for every event fired in the app.
// All calls go through here so event names never drift.
export const track = {

  // ── Auth ──────────────────────────────────────────────────────────────
  authGoogleClicked: () =>
    posthog.capture('auth_google_clicked'),

  authGuestClicked: () =>
    posthog.capture('auth_guest_clicked'),

  authEmailSubmitted: (mode: 'signin' | 'signup') =>
    posthog.capture('auth_email_submitted', { mode }),

  authSignupConfirmationSent: (email: string) =>
    posthog.capture('auth_signup_confirmation_sent', { email }),

  authCompleted: (method: 'google' | 'email' | 'guest') =>
    posthog.capture('auth_completed', { method }),

  authSignoutClicked: () =>
    posthog.capture('auth_signout_clicked'),

  authUpgradeClicked: () =>
    posthog.capture('auth_upgrade_to_google_clicked'),

  // ── Projects ──────────────────────────────────────────────────────────
  projectCreated: (props: { aspect_ratio: string; fps: number }) =>
    posthog.capture('project_created', props),

  projectOpened: (props: { aspect_ratio: string; fps: number }) =>
    posthog.capture('project_opened', props),

  // ── Editor ────────────────────────────────────────────────────────────
  editorTextAdded: () =>
    posthog.capture('editor_text_added'),

  editorPreviewToggled: (playing: boolean) =>
    posthog.capture('editor_preview_toggled', { playing }),

  editorUndo: () =>
    posthog.capture('editor_undo'),

  editorRedo: () =>
    posthog.capture('editor_redo'),

  // ── Export — browser ──────────────────────────────────────────────────
  exportDialogOpened: () =>
    posthog.capture('export_dialog_opened'),

  exportTabChanged: (tab: 'browser' | 'cloud') =>
    posthog.capture('export_tab_changed', { tab }),

  exportBrowserStarted: (props: { resolution: string; quality: string; bps: number }) =>
    posthog.capture('export_browser_started', props),

  exportBrowserCompleted: (duration_ms: number) =>
    posthog.capture('export_browser_completed', { duration_ms }),

  exportBrowserFailed: (error: string) =>
    posthog.capture('export_browser_failed', { error }),

  // ── Export — cloud ────────────────────────────────────────────────────
  exportCloudStarted: () =>
    posthog.capture('export_cloud_started'),

  exportCloudCompleted: () =>
    posthog.capture('export_cloud_completed'),

  exportCloudFailed: (error: string) =>
    posthog.capture('export_cloud_failed', { error }),

  exportCloudDownloadClicked: () =>
    posthog.capture('export_cloud_download_clicked'),
};

/// <reference types="vite/client" />

/** Injected at build time by vite.config.ts — identifies this exact deploy. */
declare const __APP_VERSION__: string;

/** Injected at build time by vite.config.ts from the server's S3_ASSETS_BUCKET.
    Empty string when the build had no value — see lib/assetUrl.ts. */
declare const __ASSETS_BUCKET__: string;

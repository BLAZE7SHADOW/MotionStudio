/**
 * MotionStudio design tokens — JS/TS mirror of CSS custom properties.
 * Use these where CSS classes can't reach: Framer Motion, canvas rendering,
 * inline styles, and programmatic calculations.
 *
 * All values here MUST stay in sync with :root in index.css.
 */

export const tokens = {
  color: {
    bg:             'var(--studio-bg)',
    panel:          'var(--studio-panel)',
    surface:        'var(--studio-surface)',
    surfaceHover:   'var(--studio-surface-hover)',
    overlay:        'var(--studio-overlay)',
    border:         'var(--studio-border)',
    borderStrong:   'var(--studio-border-strong)',
    text:           'var(--studio-text)',
    textSecondary:  'var(--studio-text-secondary)',
    textMuted:      'var(--studio-text-muted)',
    textFaint:      'var(--studio-text-faint)',
    accent:         'var(--studio-accent)',
    accentHover:    'var(--studio-accent-hover)',
    accentDeep:     'var(--studio-accent-deep)',
    accentSubtle:   'var(--studio-accent-subtle)',
    accentBorder:   'var(--studio-accent-border)',
    destructive:    'var(--studio-destructive)',
    success:        'var(--studio-success)',
    warning:        'var(--studio-warning)',
  },

  radius: {
    xs: 'var(--studio-radius-xs)',
    sm: 'var(--studio-radius-sm)',
    md: 'var(--studio-radius-md)',
    lg: 'var(--studio-radius-lg)',
    xl: 'var(--studio-radius-xl)',
  },

  shadow: {
    xs: 'var(--studio-shadow-xs)',
    sm: 'var(--studio-shadow-sm)',
    md: 'var(--studio-shadow-md)',
    lg: 'var(--studio-shadow-lg)',
  },

  /**
   * Animation durations in milliseconds.
   * fast   → micro interactions (button press, toggle)
   * base   → standard transitions (hover, fade)
   * slow   → panel entrance
   * exit   → always faster than enter
   */
  duration: {
    fast: 120,
    base: 180,
    slow: 260,
    exit: 150,
  },

  /**
   * Easing curves as Framer Motion bezier arrays [x1, y1, x2, y2].
   * spring → snappy, overshoots slightly (preferred for most UI)
   * smooth → natural ease-in-out
   * snappy → fast enter, gentle settle
   */
  ease: {
    spring: [0.16, 1, 0.3, 1] as [number, number, number, number],
    smooth: [0.4, 0, 0.2, 1]  as [number, number, number, number],
    snappy: [0.2, 0, 0, 1]    as [number, number, number, number],
  },
} as const;

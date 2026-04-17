
The user wants the social media icons in the footer to display in their brand colors instead of the current muted gray. Good call — brand colors make social icons more recognizable and inviting.

## Plan: Color the social icons with brand colors

### Approach
Update `src/components/Footer.tsx` so each social icon renders in its brand color, with a subtle hover effect (slight opacity change) instead of the current grayscale → foreground color transition.

### Brand colors
- Instagram → gradient (pink/orange/purple). Since a true Instagram gradient on an SVG stroke icon is tricky, use Instagram's signature pink `#E4405F` for a clean solid look. (Alternative: apply a CSS gradient background behind the icon — happy to do that if preferred.)
- Facebook → `#1877F2`
- TikTok → keep it black/white-aware, OR use its signature cyan + pink. Cleanest is solid `#000000` (light mode) / white (dark mode) since TikTok's brand is monochrome with accent. I'll use `currentColor` mapped to foreground so it adapts to theme.
- LinkedIn → `#0A66C3`

### Implementation
- Replace the shared `text-muted-foreground hover:text-foreground` class with a per-icon inline `style={{ color: brandColor }}` (or a `color` prop).
- Add `hover:opacity-80 transition-opacity` for a consistent hover feedback.
- Keep TikTok using `currentColor` and class `text-foreground` so it stays legible in both light/dark mode.

### Optional upgrade (ask user)
If they want a true Instagram gradient, I can wrap the Instagram icon in a `bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600` rounded square with the icon in white inside. Let me know if you'd prefer that look.

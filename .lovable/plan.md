
Add social media icons (Instagram, Facebook, TikTok, LinkedIn) to the Footer component, positioned in the bottom bar next to the copyright text.

## Plan: Add Social Media Links to Footer

### What to build
Add four social media icon links to `src/components/Footer.tsx` using Lucide React icons. TikTok isn't in Lucide, so I'll use a small inline SVG for it.

### Layout
Update the bottom bar (currently just the copyright line) into a flex row:
- Left: copyright text
- Right: row of 4 icon links (Instagram, Facebook, TikTok, LinkedIn)

On mobile, stack vertically and center.

### Icons & links
- Instagram → `Instagram` from lucide-react
- Facebook → `Facebook` from lucide-react
- LinkedIn → `Linkedin` from lucide-react
- TikTok → inline SVG (not available in lucide-react)

Each will be an `<a>` with `target="_blank"`, `rel="noopener noreferrer"`, an `aria-label`, and hover color transition matching existing footer link styles (`text-muted-foreground hover:text-foreground`).

### URLs
I'll use placeholder `#` URLs initially. The user should provide the actual profile URLs so I can wire them up — but I'll add the structure now so it's visible immediately.

### Question for the user
After approval, please share the actual profile URLs for each platform so I can replace the placeholders.

---
name: ui-ux-pro-max
description: "UI/UX design intelligence for sophisticated frontend web landing pages, specializing in Multigroup Companies, Conglomerates, and Holding Companies with multiple subsidiaries. Includes creative layouts for subsidiary showcases, premium aesthetics, advanced motion design (GSAP, Framer Motion), 3D visual integration, and high-conversion UX guidelines. Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor. Elements: mega-menus, bento grids, horizontal scroll sections, interactive maps, parallax heroes, magnetic buttons, and custom cursors. Styles: premium corporate, modern minimal, glassmorphism, dark mode, high-tech, luxury. Topics: corporate identity hierarchy, cross-subsidiary navigation, scroll-driven storytelling, fluid typography, web performance, and rich media optimization."
---

# UI/UX Pro Max - Sophisticated Multigroup Landing Pages

Comprehensive design guide for building premium, highly creative frontend web landing pages. Specifically tailored for **Multigroup Companies, Conglomerates, Holding Companies, and Enterprise Brands** that need to showcase multiple diverse subsidiaries while maintaining a cohesive, sophisticated parent brand identity.

## When to Apply

This Skill should be used when the task involves **frontend web landing page design, sophisticated corporate storytelling, interactive subsidiary showcases, or premium brand experience**.

### Must Use

This Skill must be invoked in the following situations:
- Designing landing pages for parent companies with multiple child brands or subsidiaries.
- Creating creative showcases, directories, or interactive sections to highlight different groups within a company.
- Building high-end corporate websites that require a "sophisticated, premium, and expensive" feel.
- Implementing complex scroll-driven animations, parallax effects, or 3D elements for marketing sites.
- Designing mega-menus or global navigation systems that connect parent and child entities.
- Selecting typography, color systems, and spacing for high-impact web presence.

### Recommended

This Skill is recommended in the following situations:
- The current corporate site looks "boring," "traditional," or "outdated."
- You need to unify distinct brands under a single visual ecosystem without losing their individual flair.
- Integrating Framer Motion, GSAP, or Three.js to elevate the visual experience.

### Skip

This Skill is not needed in the following situations:
- Pure backend or database design.
- Dashboard, internal admin panels, or complex SaaS application interfaces (unless it's the marketing landing page).
- Native mobile app development (iOS/Android).

**Decision criteria**: If the task is to build a **marketing site or landing page** that needs to WOW the user, feel extremely premium, and creatively structure complex corporate architectures, use this Skill.

---

## Rule Categories by Priority

| Priority | Category | Impact | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|----------|----------|--------|------------------------|------------------------|
| 1 | Corporate Hierarchy & Navigation | CRITICAL | Clear parent-child distinction, Mega-menus, Breadcrumbs, Global back-to-parent links | Confusing loops, identical branding for completely different sectors |
| 2 | Creative Subsidiary Showcases | CRITICAL | Bento grids, horizontal scroll sections, interactive maps, 3D rotating carousels | Boring bulleted lists, standard identical cards without personality |
| 3 | Sophisticated Aesthetics | HIGH | Fluid typography, oversized headings, premium spacing, subtle gradients, glassmorphism | Cluttered layouts, default browser fonts, generic stock photos, pure `#000`/`#FFF` |
| 4 | Motion & Micro-interactions | HIGH | Scroll-triggered reveals, magnetic buttons, custom cursors, smooth parallax | Jittery animations, scroll-jacking that breaks browser history, motion without purpose |
| 5 | Performance & Web Vitals | HIGH | Lazy loading rich media (videos/WebGL), optimized WebP/AVIF, LCP < 2.5s | Loading 50MB of video instantly, layout thrashing, severe CLS |
| 6 | Web Accessibility | MEDIUM | WCAG 4.5:1 contrast, screen-reader text for complex visuals, prefers-reduced-motion support | Relying purely on hover/color, trapping keyboard focus in 3D canvases |

---

## Quick Reference

### 1. Corporate Hierarchy & Navigation (CRITICAL)

- `mega-menu` - Use rich mega-menus to display subsidiaries. Include small logos, brief descriptions, and hover effects.
- `brand-cohesion` - Parent company sets the core design system (e.g., typography, grid), while subsidiaries can express variations (e.g., unique primary colors, distinct imagery styles).
- `global-nav-bar` - Implement a persistent, subtle top bar (often above the main header) linking back to the Holding Company from any subsidiary page.
- `cross-linking` - Create seamless pathways between sister companies using 'Related Groups' or 'Our Network' footers/sections.
- `breadcrumb-orientation` - Always provide clear context of where the user is within the corporate tree (e.g., Parent Group > Technology Division > DataSec Inc.).

### 2. Creative Subsidiary Showcases (CRITICAL)

- `bento-grid` - Use asymmetrical bento box layouts to display subsidiaries. Mix text cards, looping videos, and large imagery.
- `horizontal-scroll` - Implement GSAP ScrollTrigger to convert vertical scroll into horizontal movement for browsing through a timeline or a list of subsidiary brands.
- `interactive-globe/map` - If subsidiaries are geographically distributed, use an interactive WebGL globe or stylized map.
- `hover-expansion` - On desktop, use accordion or expanding cards (flex-grow transition) that reveal subsidiary details upon hover.
- `thematic-transitions` - When transitioning between sections dedicated to different subsidiaries, smoothly animate the background color to match the subsidiary's brand color.

### 3. Sophisticated Aesthetics (HIGH)

- `fluid-typography` - Use `clamp()` for font sizes so typography scales perfectly across all screen sizes without jarring breakpoint jumps.
- `premium-fonts` - Avoid system fonts for premium brands. Pair a geometric or modern sans-serif (e.g., Inter, Plus Jakarta Sans) with a sophisticated serif for headings (e.g., Playfair Display, PP Editorial New).
- `glassmorphism` - Use subtle background blur (`backdrop-filter`) for sticky headers and overlapping UI elements to create depth.
- `subtle-noise` - Apply a very faint noise/grain texture overlay to backgrounds to reduce banding and add a premium, tactile feel.
- `oversized-hero` - Use massive, bold typography in the hero section. Let the text interact with the background imagery (e.g., z-index layering).
- `dark-mode-elegance` - Corporate dark mode shouldn't be pure black (`#000000`). Use deep slate, midnight blue, or rich charcoal (`#0B0D17`, `#111111`) with high-contrast glowing accents.

### 4. Motion & Micro-interactions (HIGH)

- `scroll-reveals` - Elements should gently fade and translate up (e.g., `y: 40`, `opacity: 0`) as they enter the viewport. Stagger children elements for a cascading effect.
- `parallax-depth` - Foreground, midground, and background elements should scroll at slightly different speeds to create a 3D illusion.
- `magnetic-buttons` - CTAs and critical links should slightly attract the cursor when nearby, using mouse position calculations.
- `custom-cursors` - Consider a custom cursor (e.g., a simple inverted dot) that expands over clickable elements or images (showing "Drag" or "View"). Keep it performant by using `transform: translate`.
- `smooth-scrolling` - Use Lenis or a similar lightweight library for buttery-smooth scrolling, enhancing the feel of scroll-linked animations.
- `image-reveal` - Instead of just fading in, images can reveal via a clip-path sweeping across the container, or with a slight zoom-out effect (`scale: 1.1` to `1.0`).

### 5. Performance & Rich Media (HIGH)

- `video-backgrounds` - Compress looping background videos aggressively (under 5MB). Always provide a `poster` image for immediate loading.
- `canvas-lazy-load` - Three.js/WebGL scenes should only initialize when they are near the viewport.
- `next-image/opt` - Serve AVIF/WebP formats. Ensure `width` and `height` are set to prevent Cumulative Layout Shift (CLS).
- `split-code` - Dynamically import heavy animation libraries (GSAP, Framer Motion) or 3D libraries so the initial JS bundle remains small.

### 6. Web Accessibility (MEDIUM)

- `reduce-motion-fallback` - Respect `@media (prefers-reduced-motion: reduce)`. Disable parallax, smooth scrolling, and complex canvas animations for these users.
- `semantic-html` - Ensure `<section>`, `<article>`, and heading hierarchies (`h1` -> `h2` -> `h3`) represent the corporate structure accurately.
- `aria-hidden-decorations` - Hide purely decorative shapes, background videos, and abstract SVGs from screen readers.
- `keyboard-nav-mega-menus` - Mega-menus must be fully navigable via the `Tab` key, with clear `focus-visible` outlines.

---

## Pre-Delivery Checklist for Landing Pages

### Visual & Experience Quality
- [ ] Does the page feel expensive and sophisticated at first glance?
- [ ] Is the relationship between the Parent Company and Subsidiaries immediately clear?
- [ ] Are subsidiary showcases interactive and engaging (not just static cards)?
- [ ] Do animations run smoothly without dropping frames?
- [ ] Are typography scales fluid and readable on both ultra-wide monitors and small mobile screens?

### Technical Execution
- [ ] Is the primary CTA obvious and accessible?
- [ ] Are rich media elements (videos, 3D) optimized and lazy-loaded?
- [ ] Are hover effects (magnetic buttons, expanding cards) disabled or adapted gracefully for touch devices?
- [ ] Does the page respect `prefers-reduced-motion`?

---

## How to Apply This Skill

When prompted to build or refine a landing page for a multigroup company or premium corporate brand:

1. **Establish the Identity Hierarchy**: Determine the visual relationship between the parent and child brands. Will they share a UI framework but change accent colors? Or are they distinctly different?
2. **Define the Layout Strategy**: Choose creative showcase patterns (Bento grid, Horizontal Scroll, 3D Carousel).
3. **Draft the Structure**: Build the React/Next.js/HTML components. Prioritize semantic HTML and Tailwind/CSS structural classes.
4. **Apply Aesthetics & Motion**: Layer in glassmorphism, typography tweaks, GSAP/Framer Motion animations, and micro-interactions.
5. **Optimize & Polish**: Implement smooth scrolling, ensure accessibility, and verify performance metrics.
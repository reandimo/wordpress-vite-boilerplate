# Theme Development

## Asset Pipeline

The theme uses **Vite 5** for asset compilation with HMR (Hot Module Replacement).

### Entry Points

| Entry | Output | Description |
|-------|--------|-------------|
| `resources/scripts/frontend/main.ts` | `public/js/main.js` | Frontend JavaScript |
| `resources/styles/frontend/main.scss` | `public/css/style.css` | Frontend styles |

The TypeScript entry imports the SCSS entry, so a single Vite entry handles both.

### Commands

Run from the theme directory (`app/web/app/themes/<theme>/`):

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR on `localhost:5173` |
| `npm run build` | Build assets once |
| `npm run watch` | Build and watch for changes (no HMR) |
| `npm run production` | Optimized production build |

### How HMR Works

1. `npm run dev` starts Vite on `localhost:5173`
2. The `vite-plugin-hot-file.js` plugin creates `public/hot`
3. `ViteHelper.php` detects the hot file and loads assets from the dev server
4. CSS changes appear instantly, JS changes trigger minimal reloads
5. In Docker: `host.docker.internal` lets the PHP container reach Vite on the host

### ViteHelper.php

The `ViteHelper` class handles all asset loading:

- **Dev mode**: Loads `@vite/client` + entry from dev server as ES modules
- **Production**: Loads compiled CSS and JS from `public/`
- **Block Editor**: `enqueue_compiled_styles_only()` loads only CSS (no JS) to avoid breaking `window._` (Underscore.js) in wp-admin

**Important:** Never enqueue the Vite JS bundle in wp-admin. It will break ACF, Media Library, and TinyMCE.

## SCSS

### Structure

```
resources/styles/
├── base/
│   ├── _variables.scss        # Design tokens (colors, typography, spacing)
│   ├── _media-queries.scss    # Breakpoint mixins
│   └── _wp-override.scss      # WordPress default overrides
├── sections/                  # Block/section styles
├── components/                # Reusable component styles
├── templates/                 # Page-specific styles
└── frontend/
    └── main.scss              # Entry point (imports everything)
```

### Conventions

- **BEM naming**: `.block`, `.block__element`, `.block--modifier`
- **Max 3 nesting levels**
- **Mobile-first** approach
- **Media queries via mixins** (never use `@media` directly):

```scss
@use '../base/media-queries' as mq;

.my-block {
    padding: 1rem;

    @include mq.respond-above(sm) {
        padding: 2rem;
    }
}
```

### Breakpoints

| Name | Width |
|------|-------|
| xs | 576px |
| sm | 768px |
| md | 1200px |
| lg | 1440px |
| xl | 1600px |

### Adding Styles for a New Block

1. Create `resources/styles/sections/_my-block.scss`
2. Import in `resources/styles/frontend/main.scss`:
   ```scss
   @use "../sections/my-block";
   ```

## TypeScript

### Structure

```
resources/scripts/
├── components/          # Component classes (one per block)
└── frontend/
    └── main.ts          # Entry point
```

### Conventions

- **strict mode** enabled in `tsconfig.json`
- **Component pattern**: Classes with `static initializeAll()` method
- **Initialized** in `main.ts` on `DOMContentLoaded`
- **Path alias**: `@/` maps to `resources/`

### Example Component

```typescript
// resources/scripts/components/my-block.ts
export class MyBlock {
    private element: HTMLElement;

    constructor(element: HTMLElement) {
        this.element = element;
    }

    static initializeAll(): void {
        const elements = document.querySelectorAll<HTMLElement>('.my-block');
        elements.forEach(el => new MyBlock(el));
    }
}
```

```typescript
// resources/scripts/frontend/main.ts
import '../../styles/frontend/main.scss';
import { MyBlock } from '../components/my-block';

document.addEventListener('DOMContentLoaded', () => {
    MyBlock.initializeAll();
});
```

## Custom Fonts

1. Place font files in `resources/fonts/`
2. Vite copies them to `public/fonts/` via `vite-plugin-static-copy`
3. Register in `theme.json`:
   ```json
   {
     "fontFamily": "MyFont, sans-serif",
     "slug": "my-font",
     "fontFace": [{
       "fontFamily": "MyFont",
       "fontWeight": "400",
       "src": ["file:./public/fonts/MyFont-Regular.woff2"]
     }]
   }
   ```

## Design Tokens

Design tokens are defined in two places:

- **`theme.json`**: Colors, font families, font sizes, spacing (WordPress uses these in the block editor)
- **`resources/styles/base/_variables.scss`**: Same values as SCSS variables for use in custom styles

Keep them in sync when changing design tokens.

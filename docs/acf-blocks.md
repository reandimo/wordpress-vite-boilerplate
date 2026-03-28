# ACF Blocks v3

This boilerplate uses **ACF Blocks v3** with `block.json` for custom blocks.

## Block Anatomy

Each block lives in `blocks/<block-name>/` with 2 required files:

```
blocks/my-block/
├── block.json      # Block metadata and configuration
└── render.php      # PHP template for rendering
```

Plus supporting files:
- `includes/ACF/MyBlock.php` — Field group definition
- `resources/styles/sections/_my-block.scss` — Block styles

## Step-by-Step: Create a New Block

### 1. Create block.json

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "acf/my-block",
  "title": "My Block",
  "description": "What this block does",
  "category": "your-theme-slug",
  "icon": "admin-site",
  "keywords": ["keyword1", "keyword2"],
  "acf": {
    "mode": "preview",
    "blockVersion": 3,
    "autoInlineEditing": true,
    "renderTemplate": "render.php"
  },
  "supports": {
    "anchor": true,
    "align": ["wide", "full"],
    "jsx": true,
    "multiple": true
  },
  "textdomain": "your-theme-slug"
}
```

### 2. Create render.php

```php
<?php
declare(strict_types=1);
defined('ABSPATH') || exit;

/**
 * ACF Block v3: My Block
 *
 * @var array  $block
 * @var string $content
 * @var bool   $is_preview
 * @var int    $post_id
 */

$heading = get_field('my_block_heading') ?: 'Default Heading';
$text = get_field('my_block_text') ?: '';

$anchor = !empty($block['anchor']) ? ' id="' . esc_attr($block['anchor']) . '"' : '';
$align = !empty($block['align']) ? ' align' . esc_attr($block['align']) : '';
?>

<section class="my-block<?php echo $align; ?>"<?php echo $anchor; ?>>
    <h2 class="my-block__heading"><?php echo esc_html($heading); ?></h2>
    <?php if ($text): ?>
        <p class="my-block__text"><?php echo esc_html($text); ?></p>
    <?php endif; ?>
</section>
```

### 3. Create ACF Field Group

Create `includes/ACF/MyBlock.php`:

```php
<?php
declare(strict_types=1);
defined('ABSPATH') || exit;

if (!function_exists('acf_add_local_field_group')) {
    return;
}

acf_add_local_field_group([
    'key'    => 'group_my_block',
    'title'  => 'My Block',
    'fields' => [
        [
            'key'           => 'field_my_block_heading',
            'label'         => 'Heading',
            'name'          => 'my_block_heading',
            'type'          => 'text',
            'default_value' => 'Default Heading',
        ],
        [
            'key'   => 'field_my_block_text',
            'label' => 'Text',
            'name'  => 'my_block_text',
            'type'  => 'textarea',
            'rows'  => 3,
        ],
    ],
    'location' => [[
        ['param' => 'block', 'operator' => '==', 'value' => 'acf/my-block'],
    ]],
    'active' => true,
]);
```

### 4. Register the Block

In `functions.php`, add to the `$acf_files` array:

```php
$acf_files = [
    'ExampleCta',
    'MyBlock',    // <-- add here
];
```

In `includes/Theme/ThemeSetup.php`, add to the `$blocks` array:

```php
$blocks = [
    'example-cta',
    'my-block',    // <-- add here
];
```

### 5. Add Styles

Create `resources/styles/sections/_my-block.scss`:

```scss
@use '../base/variables' as *;
@use '../base/media-queries' as mq;

.my-block {
    padding: $gutter-large $gutter-regular;
    text-align: center;
}

.my-block__heading {
    font-size: $font-size-xxl;
    font-weight: $font-weight-bold;
    margin-bottom: 1rem;
}
```

Import in `resources/styles/frontend/main.scss`:

```scss
@use "../sections/my-block";
```

## Block Types

### Structural (unique, one per page)

```json
"supports": {
    "multiple": false,
    "reusable": false
}
```

### Content (reusable, multiple per page)

```json
"supports": {
    "anchor": true,
    "align": ["wide", "full"],
    "multiple": true,
    "reusable": true
}
```

## Common ACF Field Types

| Type | Use Case |
|------|----------|
| `text` | Single-line text |
| `textarea` | Multi-line text |
| `image` | Media picker (returns array with `url`, `alt`) |
| `url` | URL with validation |
| `select` | Dropdown choices |
| `repeater` | Array of sub-fields |
| `group` | Grouped sub-fields |

## Example Block

See `blocks/example-cta/` for a complete working example with heading, description, button text, and button URL.

## Best Practices

1. Always use `blockVersion: 3` and `autoInlineEditing: true`
2. Always escape output: `esc_html()`, `esc_attr()`, `esc_url()`
3. Provide default values with `get_field('name') ?: 'default'`
4. Use BEM naming for CSS classes
5. Use `"mode": "preview"` for better editor UX
6. Use semantic HTML (`<section>`, `<article>`, etc.)

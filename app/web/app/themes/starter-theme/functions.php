<?php

declare(strict_types=1);

/**
 * __THEME_NAME__ – block theme boilerplate
 *
 * @package __NAMESPACE__
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

if (!defined('THEME_DIR')) {
    define('THEME_DIR', get_template_directory());
}
if (!defined('THEME_URI')) {
    define('THEME_URI', get_template_directory_uri());
}
if (!defined('THEME_VERSION')) {
    define('THEME_VERSION', (string) wp_get_theme()->get('Version'));
}
if (!defined('THEME_SITENAME')) {
    define('THEME_SITENAME', '__THEME_NAME__');
}

if (file_exists(THEME_DIR . '/vendor/autoload.php')) {
    require_once THEME_DIR . '/vendor/autoload.php';
}

spl_autoload_register(function (string $class): void {
    $prefix = '__NAMESPACE__\\';
    $base   = THEME_DIR . '/includes/';
    $len    = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relative = substr($class, $len);
    $file     = $base . str_replace('\\', '/', $relative) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

if (class_exists('__NAMESPACE__\\Theme\\ThemeSetup')) {
    new \__NAMESPACE__\Theme\ThemeSetup();
}

/**
 * Load ACF field groups for registered blocks.
 * Add new field groups here as you create blocks.
 */
add_action('acf/init', function (): void {
    $acf_files = [
        'ExampleCta',
    ];

    foreach ($acf_files as $file) {
        $path = THEME_DIR . '/includes/ACF/' . $file . '.php';
        if (file_exists($path)) {
            require_once $path;
        }
    }
});

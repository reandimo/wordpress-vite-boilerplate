<?php

declare(strict_types=1);

namespace __NAMESPACE__\Theme;

use __NAMESPACE__\Helpers\ViteHelper;

defined('ABSPATH') || exit;

/**
 * Theme setup – block theme support, asset enqueue, ACF blocks.
 *
 * @package __NAMESPACE__
 */
final readonly class ThemeSetup
{
    public function __construct()
    {
        $this->init();
    }

    private function init(): void
    {
        add_action('after_setup_theme', $this->setup_theme_support(...));
        add_action('wp_enqueue_scripts', $this->enqueue_assets(...));
        add_action('enqueue_block_assets', $this->enqueue_editor_assets(...));
        add_action('acf/init', $this->register_acf_blocks(...));
        add_filter('block_categories_all', $this->register_block_categories(...), 10, 2);
        add_action('admin_bar_menu', $this->add_hmr_admin_bar_node(...), 999);
    }

    private function setup_theme_support(): void
    {
        add_theme_support('wp-block-styles');
        add_theme_support('editor-styles');
        add_editor_style('style.css');
        add_theme_support('responsive-embeds');

        add_theme_support('custom-logo', [
            'height'      => 100,
            'width'       => 350,
            'flex-height' => true,
            'flex-width'  => true,
        ]);

        add_theme_support('post-thumbnails');

        add_theme_support('html5', [
            'search-form',
            'comment-form',
            'comment-list',
            'gallery',
            'caption',
            'style',
            'script',
        ]);

        add_theme_support('title-tag');

        register_nav_menus([
            'primary' => __('Primary Menu', '__THEME_SLUG__'),
        ]);
    }

    private function enqueue_assets(): void
    {
        $version = (string) filemtime(get_stylesheet_directory() . '/style.css');

        wp_enqueue_style(
            '__THEME_SLUG__-style',
            get_stylesheet_directory_uri() . '/style.css',
            [],
            $version
        );

        ViteHelper::enqueue_asset(
            '__THEME_SLUG__-vite',
            'resources/scripts/frontend/main.ts',
            ['__THEME_SLUG__-style'],
            true
        );
    }

    private function enqueue_editor_assets(): void
    {
        if (!is_admin()) {
            return;
        }

        ViteHelper::enqueue_compiled_styles_only('__THEME_SLUG__-block-editor-styles', []);
    }

    private function register_acf_blocks(): void
    {
        if (!function_exists('acf') || !function_exists('register_block_type')) {
            return;
        }

        $blocks_dir = get_template_directory() . '/blocks';
        $blocks = [
            'example-cta',
        ];

        foreach ($blocks as $block) {
            $block_path = $blocks_dir . '/' . $block;
            if (file_exists($block_path . '/block.json')) {
                register_block_type($block_path);
            }
        }
    }

    /**
     * @param array $categories
     * @param \WP_Block_Editor_Context $context
     * @return array
     */
    private function register_block_categories(array $categories, $context): array
    {
        $categories[] = [
            'slug'  => '__THEME_SLUG__',
            'title' => __('__THEME_NAME__', '__THEME_SLUG__'),
            'icon'  => 'admin-site-alt3',
        ];

        return $categories;
    }

    private function add_hmr_admin_bar_node(\WP_Admin_Bar $wp_admin_bar): void
    {
        if (!ViteHelper::is_dev_server_running()) {
            return;
        }

        $wp_admin_bar->add_node([
            'id'     => '__THEME_SLUG__-hmr',
            'parent' => 'top-secondary',
            'title'  => '<span class="ab-icon dashicons dashicons-performance" aria-hidden="true"></span>'
                      . '<span class="ab-label">' . esc_html__('Vite HMR', '__THEME_SLUG__') . ' <em style="color:#46b450;">&#9679;</em></span>',
            'meta'   => [
                'title' => __('Vite dev server with Hot Module Replacement is active.', '__THEME_SLUG__'),
            ],
        ]);
    }
}

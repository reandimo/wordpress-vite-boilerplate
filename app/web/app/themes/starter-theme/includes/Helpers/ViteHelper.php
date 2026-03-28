<?php

declare(strict_types=1);

namespace __NAMESPACE__\Helpers;

defined('ABSPATH') || exit;

/**
 * Vite Helper - Detects and loads assets from Vite dev server with HMR.
 *
 * @package __NAMESPACE__
 */
final class ViteHelper
{
    private const VITE_DEV_SERVER = 'http://localhost:5173';
    private const VITE_CLIENT = '@vite/client';

    public static function is_dev_server_running(): bool
    {
        static $is_running = null;

        if ($is_running !== null) {
            return $is_running;
        }

        $theme_dir = get_template_directory();
        $hot_file = $theme_dir . '/public/hot';
        if (file_exists($hot_file)) {
            $is_running = true;
            return $is_running;
        }

        $hosts = ['localhost', '127.0.0.1', 'host.docker.internal'];
        foreach ($hosts as $host) {
            $fp = @fsockopen($host, 5173, $errno, $errstr, 1);
            if ($fp) {
                fclose($fp);
                $is_running = true;
                return $is_running;
            }
        }

        $is_running = false;
        return $is_running;
    }

    public static function enqueue_asset(
        string $handle,
        string $entry_path,
        array $deps = [],
        bool $in_footer = true
    ): void {
        if (self::is_dev_server_running()) {
            self::enqueue_dev_assets($handle, $entry_path, $deps, $in_footer);
        } else {
            self::enqueue_prod_assets($handle, $deps, $in_footer);
        }
    }

    /**
     * Enqueue only the compiled theme CSS from Vite (no JavaScript, no Vite client).
     *
     * Use in block editor / wp-admin contexts. Loading the frontend bundle in admin
     * can break the Media Library and ACF image fields: WordPress expects Underscore
     * at global `window._` for wp-backbone, mce-view, etc.
     */
    public static function enqueue_compiled_styles_only(string $handle, array $deps = []): void
    {
        $theme_dir = get_stylesheet_directory();
        $theme_uri = get_stylesheet_directory_uri();
        $vite_css = $theme_dir . '/public/css/style.css';
        if (!file_exists($vite_css)) {
            return;
        }

        wp_enqueue_style(
            $handle,
            $theme_uri . '/public/css/style.css',
            $deps,
            (string) filemtime($vite_css)
        );
    }

    private static function enqueue_dev_assets(
        string $handle,
        string $entry_path,
        array $deps,
        bool $in_footer
    ): void {
        wp_register_script(
            'vite-client',
            self::VITE_DEV_SERVER . '/' . self::VITE_CLIENT,
            [],
            null,
            false
        );
        wp_enqueue_script('vite-client');

        wp_register_script(
            $handle,
            self::VITE_DEV_SERVER . '/' . $entry_path,
            ['vite-client'],
            null,
            $in_footer
        );
        wp_enqueue_script($handle);

        add_filter('script_loader_tag', function ($tag, $script_handle, $src) use ($handle) {
            if ($script_handle === 'vite-client' || $script_handle === $handle) {
                $tag = str_replace('<script', '<script type="module" crossorigin', $tag);
            }
            return $tag;
        }, 10, 3);
    }

    private static function enqueue_prod_assets(
        string $handle,
        array $deps,
        bool $in_footer
    ): void {
        $theme_dir = get_stylesheet_directory();
        $theme_uri = get_stylesheet_directory_uri();

        $vite_css = $theme_dir . '/public/css/style.css';
        if (file_exists($vite_css)) {
            wp_enqueue_style(
                $handle . '-css',
                $theme_uri . '/public/css/style.css',
                $deps,
                (string) filemtime($vite_css)
            );
        }

        $vite_js = $theme_dir . '/public/js/main.js';
        if (file_exists($vite_js)) {
            wp_enqueue_script(
                $handle . '-js',
                $theme_uri . '/public/js/main.js',
                [],
                (string) filemtime($vite_js),
                $in_footer
            );
        }
    }
}

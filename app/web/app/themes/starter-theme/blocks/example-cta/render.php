<?php

declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * ACF Block v3: Example CTA
 *
 * A simple call-to-action block demonstrating the ACF Block pattern.
 * Duplicate this block and its ACF field group to create new blocks.
 *
 * @var array  $block      The block settings and attributes.
 * @var string $content    The block inner HTML (empty for ACF blocks).
 * @var bool   $is_preview True during backend preview render.
 * @var int    $post_id    The post ID this block renders against.
 */

$heading     = get_field('example_cta_heading') ?: 'Ready to get started?';
$description = get_field('example_cta_description') ?: 'This is an example ACF block. Edit the fields in the sidebar to customize it.';
$button_text = get_field('example_cta_button_text') ?: 'Get Started';
$button_url  = get_field('example_cta_button_url') ?: '#';

$anchor = !empty($block['anchor']) ? ' id="' . esc_attr($block['anchor']) . '"' : '';
$align  = !empty($block['align']) ? ' align' . esc_attr($block['align']) : '';
?>

<section class="example-cta<?php echo $align; ?>"<?php echo $anchor; ?>>
    <div class="example-cta__content">
        <h2 class="example-cta__heading"><?php echo esc_html($heading); ?></h2>
        <p class="example-cta__description"><?php echo esc_html($description); ?></p>
        <a href="<?php echo esc_url($button_url); ?>" class="example-cta__button">
            <?php echo esc_html($button_text); ?>
        </a>
    </div>
</section>

<?php

declare(strict_types=1);

namespace __NAMESPACE__\ACF;

defined('ABSPATH') || exit;

if (!function_exists('acf_add_local_field_group')) {
    return;
}

acf_add_local_field_group([
    'key'    => 'group_example_cta',
    'title'  => 'Example CTA Block',
    'fields' => [
        [
            'key'           => 'field_example_cta_heading',
            'label'         => 'Heading',
            'name'          => 'example_cta_heading',
            'type'          => 'text',
            'instructions'  => 'Main heading for the call-to-action.',
            'required'      => 0,
            'default_value' => 'Ready to get started?',
        ],
        [
            'key'           => 'field_example_cta_description',
            'label'         => 'Description',
            'name'          => 'example_cta_description',
            'type'          => 'textarea',
            'instructions'  => 'Supporting text below the heading.',
            'required'      => 0,
            'default_value' => 'This is an example ACF block. Edit the fields in the sidebar to customize it.',
            'rows'          => 3,
        ],
        [
            'key'           => 'field_example_cta_button_text',
            'label'         => 'Button Text',
            'name'          => 'example_cta_button_text',
            'type'          => 'text',
            'required'      => 0,
            'default_value' => 'Get Started',
        ],
        [
            'key'           => 'field_example_cta_button_url',
            'label'         => 'Button URL',
            'name'          => 'example_cta_button_url',
            'type'          => 'url',
            'required'      => 0,
            'default_value' => '#',
        ],
    ],
    'location' => [
        [
            [
                'param'    => 'block',
                'operator' => '==',
                'value'    => 'acf/example-cta',
            ],
        ],
    ],
    'menu_order'            => 0,
    'position'              => 'normal',
    'style'                 => 'default',
    'label_placement'       => 'top',
    'instruction_placement' => 'label',
    'active'                => true,
    'show_in_rest'          => 0,
]);

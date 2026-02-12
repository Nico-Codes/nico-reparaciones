<?php

namespace App\Support;

use App\Models\BusinessSetting;

class MailTemplateSettings
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public static function definitions(): array
    {
        return [
            'verify_email' => [
                'label' => 'Verificacion de cuenta',
                'fields' => [
                    'subject' => [
                        'label' => 'Asunto',
                        'default' => 'Verifica tu correo en NicoReparaciones',
                    ],
                    'greeting' => [
                        'label' => 'Saludo',
                        'default' => 'Hola, {name}.',
                    ],
                    'intro_line' => [
                        'label' => 'Linea principal',
                        'default' => 'Gracias por crear tu cuenta. Para activarla, confirma tu correo electronico.',
                    ],
                    'action_label' => [
                        'label' => 'Boton',
                        'default' => 'Verificar correo',
                    ],
                    'expiry_line' => [
                        'label' => 'Linea de vencimiento',
                        'default' => 'Este enlace vence en {expire_minutes} minutos.',
                    ],
                    'outro_line' => [
                        'label' => 'Linea final',
                        'default' => 'Si no creaste esta cuenta, puedes ignorar este mensaje.',
                    ],
                ],
            ],
            'reset_password' => [
                'label' => 'Recuperacion de contrasena',
                'fields' => [
                    'subject' => [
                        'label' => 'Asunto',
                        'default' => 'Recuperar contrasena - NicoReparaciones',
                    ],
                    'greeting' => [
                        'label' => 'Saludo',
                        'default' => 'Hola, {name}.',
                    ],
                    'intro_line' => [
                        'label' => 'Linea principal',
                        'default' => 'Recibimos una solicitud para restablecer tu contrasena.',
                    ],
                    'action_label' => [
                        'label' => 'Boton',
                        'default' => 'Restablecer contrasena',
                    ],
                    'expiry_line' => [
                        'label' => 'Linea de vencimiento',
                        'default' => 'Este enlace vence en {expire_minutes} minutos.',
                    ],
                    'outro_line' => [
                        'label' => 'Linea final',
                        'default' => 'Si no solicitaste este cambio, puedes ignorar este mensaje.',
                    ],
                ],
            ],
            'order_customer_confirmation' => [
                'label' => 'Confirmacion de pedido',
                'fields' => [
                    'subject' => [
                        'label' => 'Asunto',
                        'default' => 'Confirmacion de pedido #{order_id} - NicoReparaciones',
                    ],
                    'title' => [
                        'label' => 'Titulo principal',
                        'default' => 'Pedido confirmado #{order_id}',
                    ],
                    'intro_line' => [
                        'label' => 'Linea principal',
                        'default' => 'Hola {pickup_name}, recibimos tu compra correctamente.',
                    ],
                    'footer_line' => [
                        'label' => 'Linea final',
                        'default' => 'Gracias por comprar en NicoReparaciones.',
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function editableTemplates(): array
    {
        $settings = BusinessSetting::allValues();
        $templates = [];

        foreach (self::definitions() as $templateKey => $templateDef) {
            $fields = [];
            foreach ((array) ($templateDef['fields'] ?? []) as $fieldKey => $fieldDef) {
                $settingKey = self::settingKey($templateKey, $fieldKey);
                $storedValue = (string) ($settings->get($settingKey) ?? '');
                $defaultValue = (string) ($fieldDef['default'] ?? '');
                $fields[$fieldKey] = [
                    'key' => $settingKey,
                    'label' => (string) ($fieldDef['label'] ?? $fieldKey),
                    'default' => $defaultValue,
                    'value' => $storedValue !== '' ? $storedValue : $defaultValue,
                ];
            }

            $templates[$templateKey] = [
                'label' => (string) ($templateDef['label'] ?? $templateKey),
                'fields' => $fields,
            ];
        }

        return $templates;
    }

    public static function resolve(string $templateKey, string $fieldKey, array $tokens = []): string
    {
        $definitions = self::definitions();
        $default = (string) ($definitions[$templateKey]['fields'][$fieldKey]['default'] ?? '');
        $stored = trim(BusinessSetting::getValue(self::settingKey($templateKey, $fieldKey), ''));
        $value = $stored !== '' ? $stored : $default;

        return self::replaceTokens($value, $tokens);
    }

    public static function settingKey(string $templateKey, string $fieldKey): string
    {
        return 'mail_tpl_' . $templateKey . '_' . $fieldKey;
    }

    /**
     * @return array<string, string>
     */
    public static function orderCustomerTokens(int $orderId, string $pickupName): array
    {
        return [
            'order_id' => (string) $orderId,
            'pickup_name' => $pickupName,
        ];
    }

    private static function replaceTokens(string $value, array $tokens): string
    {
        foreach ($tokens as $key => $tokenValue) {
            $value = str_replace('{' . $key . '}', (string) $tokenValue, $value);
        }

        return $value;
    }
}

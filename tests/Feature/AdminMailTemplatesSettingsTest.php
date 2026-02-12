<?php

namespace Tests\Feature;

use App\Mail\OrderCustomerConfirmationMail;
use App\Models\BusinessSetting;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMailTemplatesSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_open_mail_templates_settings_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get(route('admin.settings.mail_templates.index'));

        $response->assertOk();
        $response->assertSee('Plantillas de correo');
        $response->assertSee('Verificacion de cuenta');
    }

    public function test_admin_can_update_mail_templates_from_settings(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.settings.mail_templates.update'), [
            'tpl_verify_email_subject' => 'Asunto custom verify',
            'tpl_verify_email_greeting' => 'Hola {name}, bienvenido.',
            'tpl_verify_email_intro_line' => 'Linea verify custom',
            'tpl_verify_email_action_label' => 'Confirmar correo',
            'tpl_verify_email_expiry_line' => 'Expira en {expire_minutes} minutos.',
            'tpl_verify_email_outro_line' => 'Si no fuiste vos, ignora.',

            'tpl_reset_password_subject' => 'Asunto reset custom',
            'tpl_reset_password_greeting' => 'Hola {name}, te ayudamos.',
            'tpl_reset_password_intro_line' => 'Linea reset custom',
            'tpl_reset_password_action_label' => 'Cambiar contrasena',
            'tpl_reset_password_expiry_line' => 'Este reset expira en {expire_minutes}.',
            'tpl_reset_password_outro_line' => 'Si no pediste reset, ignora.',

            'tpl_order_customer_confirmation_subject' => 'Pedido #{order_id} recibido',
            'tpl_order_customer_confirmation_title' => 'Confirmado #{order_id}',
            'tpl_order_customer_confirmation_intro_line' => 'Hola {pickup_name}, tomamos tu pedido.',
            'tpl_order_customer_confirmation_footer_line' => 'Gracias por elegirnos.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSame('Asunto custom verify', BusinessSetting::getValue('mail_tpl_verify_email_subject'));
        $this->assertSame('Asunto reset custom', BusinessSetting::getValue('mail_tpl_reset_password_subject'));
        $this->assertSame('Pedido #{order_id} recibido', BusinessSetting::getValue('mail_tpl_order_customer_confirmation_subject'));
    }

    public function test_verify_email_notification_uses_custom_template_values(): void
    {
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_verify_email_subject'], ['value' => 'Verifica ahora, {name}']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_verify_email_greeting'], ['value' => 'Hola {name}, este es tu acceso.']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_verify_email_intro_line'], ['value' => 'Texto intro verify']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_verify_email_action_label'], ['value' => 'Activar cuenta']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_verify_email_expiry_line'], ['value' => 'Caduca en {expire_minutes} minutos.']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_verify_email_outro_line'], ['value' => 'Fin verify']);

        $user = User::factory()->unverified()->create(['name' => 'Nico']);
        $mail = (new VerifyEmailNotification())->toMail($user);

        $this->assertSame('Verifica ahora, Nico', $mail->subject);
        $this->assertSame('Hola Nico, este es tu acceso.', $mail->greeting);
        $this->assertSame('Texto intro verify', $mail->introLines[0] ?? null);
        $this->assertSame('Activar cuenta', $mail->actionText);
        $this->assertSame('Fin verify', $mail->outroLines[1] ?? null);
    }

    public function test_admin_can_reset_single_mail_template_to_defaults(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_verify_email_subject'], ['value' => 'Custom verify subject']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_verify_email_intro_line'], ['value' => 'Custom verify intro']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_reset_password_subject'], ['value' => 'Custom reset subject']);

        $response = $this->actingAs($admin)->post(route('admin.settings.mail_templates.reset', [
            'templateKey' => 'verify_email',
        ]));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSame('', BusinessSetting::getValue('mail_tpl_verify_email_subject'));
        $this->assertSame('', BusinessSetting::getValue('mail_tpl_verify_email_intro_line'));
        $this->assertSame('Custom reset subject', BusinessSetting::getValue('mail_tpl_reset_password_subject'));
    }

    public function test_reset_password_notification_uses_custom_template_values(): void
    {
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_reset_password_subject'], ['value' => 'Reset para {name}']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_reset_password_greeting'], ['value' => 'Hola {name}, recupera tu clave.']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_reset_password_intro_line'], ['value' => 'Texto intro reset']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_reset_password_action_label'], ['value' => 'Recuperar ahora']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_reset_password_expiry_line'], ['value' => 'Caduca en {expire_minutes} min.']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_reset_password_outro_line'], ['value' => 'Fin reset']);

        $user = User::factory()->create(['name' => 'Nico']);
        $mail = (new ResetPasswordNotification('token-demo'))->toMail($user);

        $this->assertSame('Reset para Nico', $mail->subject);
        $this->assertSame('Hola Nico, recupera tu clave.', $mail->greeting);
        $this->assertSame('Texto intro reset', $mail->introLines[0] ?? null);
        $this->assertSame('Recuperar ahora', $mail->actionText);
        $this->assertSame('Fin reset', $mail->outroLines[1] ?? null);
    }

    public function test_order_confirmation_mail_uses_custom_template_values(): void
    {
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_order_customer_confirmation_subject'], ['value' => 'Recibimos tu pedido #{order_id}']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_order_customer_confirmation_title'], ['value' => 'Pedido #{order_id} en proceso']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_order_customer_confirmation_intro_line'], ['value' => 'Hola {pickup_name}, iniciamos tu pedido.']);
        BusinessSetting::updateOrCreate(['key' => 'mail_tpl_order_customer_confirmation_footer_line'], ['value' => 'Gracias por confiar en nosotros.']);

        $user = User::factory()->create();
        $category = Category::create(['name' => 'Accesorios', 'slug' => 'accesorios']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Cable USB',
            'slug' => 'cable-usb',
            'price' => 1000,
            'stock' => 10,
            'active' => true,
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 1000,
            'pickup_name' => 'Nico Cliente',
            'pickup_phone' => '3415550000',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'price' => 1000,
            'quantity' => 1,
            'subtotal' => 1000,
        ]);

        $mailable = new OrderCustomerConfirmationMail($order->fresh()->load('items'));
        $this->assertSame('Recibimos tu pedido #'.$order->id, $mailable->envelope()->subject);

        $html = $mailable->render();
        $this->assertStringContainsString('Pedido #'.$order->id.' en proceso', $html);
        $this->assertStringContainsString('Hola Nico Cliente, iniciamos tu pedido.', $html);
        $this->assertStringContainsString('Gracias por confiar en nosotros.', $html);
    }
}

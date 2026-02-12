<?php

namespace Tests\Feature;

use App\Models\HelpEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HelpCenterTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_help_shows_only_active_public_and_both_entries(): void
    {
        HelpEntry::create([
            'question' => 'Publica visible',
            'answer' => 'Respuesta publica',
            'audience' => HelpEntry::AUDIENCE_PUBLIC,
            'active' => true,
            'sort_order' => 10,
        ]);

        HelpEntry::create([
            'question' => 'Ambas visible',
            'answer' => 'Respuesta ambas',
            'audience' => HelpEntry::AUDIENCE_BOTH,
            'active' => true,
            'sort_order' => 9,
        ]);

        HelpEntry::create([
            'question' => 'Solo admin',
            'answer' => 'No deberia verse',
            'audience' => HelpEntry::AUDIENCE_ADMIN,
            'active' => true,
            'sort_order' => 8,
        ]);

        HelpEntry::create([
            'question' => 'Publica inactiva',
            'answer' => 'No deberia verse',
            'audience' => HelpEntry::AUDIENCE_PUBLIC,
            'active' => false,
            'sort_order' => 7,
        ]);

        $response = $this->get(route('help.index'));

        $response->assertOk();
        $response->assertSee('Publica visible');
        $response->assertSee('Ambas visible');
        $response->assertDontSee('Solo admin');
        $response->assertDontSee('Publica inactiva');
    }

    public function test_admin_can_manage_help_entries_from_settings(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $create = $this->actingAs($admin)->post(route('admin.settings.help.store'), [
            'question' => 'No me llega mail',
            'answer' => 'Revisa spam y vuelve a intentar.',
            'audience' => HelpEntry::AUDIENCE_PUBLIC,
            'sort_order' => 20,
            'active' => '1',
        ]);
        $create->assertRedirect(route('admin.settings.help.index'));

        $entry = HelpEntry::query()->first();
        $this->assertNotNull($entry);

        $update = $this->actingAs($admin)->put(route('admin.settings.help.update', $entry), [
            'question' => 'No me llega correo',
            'answer' => 'Revisa spam.',
            'audience' => HelpEntry::AUDIENCE_BOTH,
            'sort_order' => 30,
            'active' => '1',
        ]);
        $update->assertRedirect(route('admin.settings.help.index'));

        $this->assertDatabaseHas('help_entries', [
            'id' => $entry->id,
            'question' => 'No me llega correo',
            'audience' => HelpEntry::AUDIENCE_BOTH,
            'sort_order' => 30,
            'active' => 1,
        ]);

        $delete = $this->actingAs($admin)->delete(route('admin.settings.help.destroy', $entry));
        $delete->assertRedirect(route('admin.settings.help.index'));

        $this->assertDatabaseMissing('help_entries', ['id' => $entry->id]);
    }
}


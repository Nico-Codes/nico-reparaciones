<?php

namespace Tests\Feature;

use App\Models\BusinessSetting;
use App\Models\User;
use App\Support\BrandAssets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class AdminBrandAssetsManagementTest extends TestCase
{
    use RefreshDatabase;

    private array $createdFiles = [];

    public function test_admin_can_view_brand_assets_screen(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.settings.assets.index'))
            ->assertOk()
            ->assertSeeText('Identidad visual');
    }

    public function test_admin_can_upload_brand_asset_from_settings(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(
            route('admin.settings.assets.update', ['assetKey' => 'icon_store']),
            ['file' => UploadedFile::fake()->create('icon-store.png', 20, 'image/png')]
        );

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $relativePath = (string) BusinessSetting::query()
            ->where('key', 'brand_asset_icon_store')
            ->value('value');

        $this->assertNotSame('', $relativePath);
        $this->assertStringStartsWith('brand-assets/icon_store-', $relativePath);
        $this->assertTrue(is_file(public_path($relativePath)));

        $this->createdFiles[] = $relativePath;
    }

    public function test_admin_can_reset_brand_asset_to_default(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post(
            route('admin.settings.assets.update', ['assetKey' => 'icon_store']),
            ['file' => UploadedFile::fake()->create('icon-store.png', 20, 'image/png')]
        )->assertRedirect();

        $relativePath = (string) BusinessSetting::query()
            ->where('key', 'brand_asset_icon_store')
            ->value('value');

        $this->assertNotSame('', $relativePath);
        $this->assertTrue(is_file(public_path($relativePath)));

        $this->actingAs($admin)
            ->delete(route('admin.settings.assets.reset', ['assetKey' => 'icon_store']))
            ->assertRedirect();

        $this->assertDatabaseMissing('business_settings', [
            'key' => 'brand_asset_icon_store',
        ]);
        $this->assertFalse(is_file(public_path($relativePath)));
    }

    public function test_non_admin_cannot_upload_brand_asset(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)->post(
            route('admin.settings.assets.update', ['assetKey' => 'icon_store']),
            ['file' => UploadedFile::fake()->create('icon-store.png', 20, 'image/png')]
        );

        $response->assertForbidden();
    }

    public function test_manifest_route_uses_custom_android_icons_when_available(): void
    {
        File::ensureDirectoryExists(public_path('brand-assets'));

        $custom192 = 'brand-assets/manifest-192-test.png';
        $custom512 = 'brand-assets/manifest-512-test.png';

        file_put_contents(public_path($custom192), 'test192');
        file_put_contents(public_path($custom512), 'test512');

        $this->createdFiles[] = $custom192;
        $this->createdFiles[] = $custom512;

        BusinessSetting::updateOrCreate(
            ['key' => BrandAssets::settingKey('android_chrome_192')],
            ['value' => $custom192]
        );
        BusinessSetting::updateOrCreate(
            ['key' => BrandAssets::settingKey('android_chrome_512')],
            ['value' => $custom512]
        );

        BrandAssets::clearRuntimeCache();

        $response = $this->get(route('site.manifest'));
        $response->assertOk();

        $this->assertStringContainsString($custom192, (string) $response->json('icons.0.src'));
        $this->assertStringContainsString($custom512, (string) $response->json('icons.1.src'));
    }

    protected function tearDown(): void
    {
        foreach ($this->createdFiles as $relativePath) {
            $absolutePath = public_path((string) $relativePath);
            if (is_file($absolutePath)) {
                @unlink($absolutePath);
            }
        }

        parent::tearDown();
    }
}

<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RepairLookupViewRegressionTest extends TestCase
{
    public function test_lookup_result_view_without_repair_does_not_render_return_artifact(): void
    {
        Route::middleware('web')->get('/__test/repair-lookup-result-null', function () {
            return view('repairs.lookup_result', [
                'repair' => null,
                'statuses' => [],
            ]);
        });

        $response = $this->get('/__test/repair-lookup-result-null');

        $response->assertOk();
        $response->assertDontSee('@return');
        $response->assertSee('No encontramos una');
    }
}

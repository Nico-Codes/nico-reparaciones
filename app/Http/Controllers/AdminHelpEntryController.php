<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\HelpEntry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminHelpEntryController extends Controller
{
    public function index()
    {
        $entries = HelpEntry::query()
            ->orderByDesc('active')
            ->orderByDesc('sort_order')
            ->orderBy('id')
            ->get();

        return view('admin.settings.help', [
            'entries' => $entries,
            'audiences' => $this->audienceLabels(),
            'helpWhatsappMessage' => (string) BusinessSetting::getValue(
                'help_whatsapp_message',
                'Hola! Necesito ayuda con un problema de mi cuenta/compra/reparacion.'
            ),
        ]);
    }

    public function updateConfig(Request $request)
    {
        $data = $request->validate([
            'help_whatsapp_message' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        BusinessSetting::updateOrCreate(
            ['key' => 'help_whatsapp_message'],
            [
                'value' => trim((string) $data['help_whatsapp_message']),
                'updated_by' => auth()->id(),
            ]
        );

        return redirect()
            ->route('admin.settings.help.index')
            ->with('success', 'Configuracion de ayuda actualizada.');
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        HelpEntry::create($data);

        return redirect()
            ->route('admin.settings.help.index')
            ->with('success', 'Item de ayuda creado.');
    }

    public function update(Request $request, HelpEntry $helpEntry)
    {
        $data = $this->validated($request);
        $helpEntry->update($data);

        return redirect()
            ->route('admin.settings.help.index')
            ->with('success', 'Item de ayuda actualizado.');
    }

    public function destroy(HelpEntry $helpEntry)
    {
        $helpEntry->delete();

        return redirect()
            ->route('admin.settings.help.index')
            ->with('success', 'Item de ayuda eliminado.');
    }

    /**
     * @return array{question:string,answer:string,audience:string,sort_order:int,active:bool}
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'question' => ['required', 'string', 'max:200'],
            'answer' => ['required', 'string', 'max:5000'],
            'audience' => ['required', 'string', Rule::in(HelpEntry::AUDIENCES)],
            'sort_order' => ['nullable', 'integer', 'min:-9999', 'max:9999'],
            'active' => ['nullable'],
        ]);

        return [
            'question' => trim((string) $data['question']),
            'answer' => trim((string) $data['answer']),
            'audience' => (string) $data['audience'],
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'active' => (bool) ($data['active'] ?? false),
        ];
    }

    /**
     * @return array<string,string>
     */
    private function audienceLabels(): array
    {
        return [
            HelpEntry::AUDIENCE_PUBLIC => 'Publica (clientes)',
            HelpEntry::AUDIENCE_ADMIN => 'Interna (admin)',
            HelpEntry::AUDIENCE_BOTH => 'Ambas',
        ];
    }
}

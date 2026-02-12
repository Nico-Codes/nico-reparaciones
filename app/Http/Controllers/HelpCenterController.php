<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\HelpEntry;
use App\Support\WhatsApp;

class HelpCenterController extends Controller
{
    public function index()
    {
        $entries = HelpEntry::query()
            ->where('active', true)
            ->whereIn('audience', [HelpEntry::AUDIENCE_PUBLIC, HelpEntry::AUDIENCE_BOTH])
            ->orderByDesc('sort_order')
            ->orderBy('id')
            ->get();

        $shopPhoneRaw = (string) BusinessSetting::getValue('shop_phone', '');
        $helpMessage = (string) BusinessSetting::getValue(
            'help_whatsapp_message',
            'Hola! Necesito ayuda con un problema de mi cuenta/compra/reparacion.'
        );
        $helpWhatsappUrl = WhatsApp::waMeUrlFromRaw($shopPhoneRaw, $helpMessage);

        return view('help.index', [
            'entries' => $entries,
            'helpWhatsappUrl' => $helpWhatsappUrl,
        ]);
    }
}

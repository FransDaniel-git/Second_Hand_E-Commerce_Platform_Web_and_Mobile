<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        \App\Events\TransaksiPenjualanStatusChanged::class => [
            \App\Listeners\SendTransaksiPenjualanStatusNotification::class,
        ],
        \App\Events\BarangTitipanStatusChanged::class => [
            \App\Listeners\SendBarangTitipanStatusNotification::class,
        ],
        \App\Events\TransaksiPenjualanTanggalSiapSet::class => [
            \App\Listeners\SendTransaksiPenjualanTanggalSiapNotification::class,
        ],
        \App\Events\BarangTitipanExpiryReminder::class => [
            \App\Listeners\SendBarangTitipanExpiryReminderNotification::class,
        ],
    ];

    public function boot()
    {
        //
    }
}
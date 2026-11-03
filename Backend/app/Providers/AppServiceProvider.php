<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\RoleMiddleware;
use App\Models\TransaksiPenjualan;
use App\Models\BarangTitipan;
use App\Observers\TransaksiPenjualanObserver;
use App\Observers\BarangTitipanObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register()
    {
        $this->app->singleton(NotificationService::class, function ($app) {
            return new NotificationService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register the role middleware
        Route::aliasMiddleware('role', RoleMiddleware::class);
        TransaksiPenjualan::observe(TransaksiPenjualanObserver::class);
        BarangTitipan::observe(BarangTitipanObserver::class);
    }
}

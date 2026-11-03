<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class NotificationService
{
    protected $messaging;

    public function __construct()
{
    \Log::info('Firebase credentials: ' . json_encode(config('firebase.projects.app.credentials')));
    $this->messaging = (new Factory)
    ->withServiceAccount(storage_path('app/firebase/reusemart-e2733-firebase-adminsdk-fbsvc-bf3e700c13.json'))
        ->createMessaging();
}

public function sendNotification(string $fcmToken, string $title, string $body, array $data = [])
{
    try {
        $notification = Notification::create($title, $body);
        $message = CloudMessage::withTarget('token', $fcmToken)
            ->withNotification($notification)
            ->withData($data);
        \Log::info("Sending FCM notification to token: {$fcmToken}", ['title' => $title, 'body' => $body, 'data' => $data]);
        $this->messaging->send($message);
        \Log::info("Notification sent successfully to token: {$fcmToken}");
        return ['success' => true, 'message' => 'Notification sent successfully'];
    } catch (\Exception $e) {
        \Log::error("Failed to send notification to token: {$fcmToken}, Error: " . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to send notification: ' . $e->getMessage()];
    }
}


}
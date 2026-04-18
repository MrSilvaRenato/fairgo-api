<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * SMS abstraction layer.
 *
 * LOCAL:  logs the message to storage/logs/laravel.log  (MAIL_MAILER=log)
 * PROD:   set SMS_DRIVER=twilio in .env and add Twilio credentials.
 *         Swap the send() body to use the Twilio SDK — nothing else changes.
 *
 * .env keys needed for Twilio (production):
 *   SMS_DRIVER=twilio
 *   TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_TOKEN=your_auth_token
 *   TWILIO_FROM=+61400000000
 */
class SmsService
{
    public function send(string $to, string $message): void
    {
        $driver = config('services.sms.driver', 'log');

        if ($driver === 'twilio') {
            $this->sendViaTwilio($to, $message);
            return;
        }

        // Local / fallback — write to log so you can read the OTP during dev
        Log::channel('stack')->info('[SMS] To: ' . $to . ' | Message: ' . $message);
    }

    private function sendViaTwilio(string $to, string $message): void
    {
        // composer require twilio/sdk
        $client = new \Twilio\Rest\Client(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );

        $client->messages->create($to, [
            'from' => config('services.twilio.from'),
            'body' => $message,
        ]);
    }
}

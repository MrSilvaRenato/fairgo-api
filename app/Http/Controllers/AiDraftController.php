<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;

class AiDraftController extends Controller
{
    public function draft(Request $request)
    {
        $data = $request->validate([
            'prompt'       => 'required|string|max:500',
            'category'     => 'nullable|string|max:50',
            'consumer_name'=> 'nullable|string|max:100',
            'ref_number'   => 'nullable|string|max:120',
            'company_name' => 'nullable|string|max:255',
            'description'  => 'nullable|string|max:2000',
        ]);

        $user = $request->user();
        if ($user->role !== 'company_admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $systemPrompt = $this->buildSystemPrompt($data);

        return response()->stream(function () use ($systemPrompt, $data) {

            // Disable output buffering so chunks reach the browser immediately
            while (ob_get_level()) ob_end_clean();

            $client = new Client(['timeout' => 60]);

            try {
                $response = $client->request('POST', 'https://api.anthropic.com/v1/messages', [
                    'headers' => [
                        'x-api-key'         => config('services.anthropic.key'),
                        'anthropic-version' => '2023-06-01',
                        'content-type'      => 'application/json',
                    ],
                    'json' => [
                        'model'      => 'claude-3-5-haiku-20241022',
                        'max_tokens' => 800,
                        'stream'     => true,
                        'system'     => $systemPrompt,
                        'messages'   => [
                            ['role' => 'user', 'content' => $data['prompt']],
                        ],
                    ],
                    'stream' => true,
                ]);

                $body   = $response->getBody();
                $buffer = '';

                while (!$body->eof()) {
                    $buffer .= $body->read(256);

                    // Process every complete line in the buffer
                    while (($pos = strpos($buffer, "\n")) !== false) {
                        $line   = trim(substr($buffer, 0, $pos));
                        $buffer = substr($buffer, $pos + 1);

                        if (!str_starts_with($line, 'data: ')) continue;

                        $json  = substr($line, 6);
                        if ($json === '[DONE]') break 2;

                        $event = json_decode($json, true);
                        if (
                            isset($event['type']) &&
                            $event['type'] === 'content_block_delta' &&
                            isset($event['delta']['text'])
                        ) {
                            echo 'data: ' . json_encode(['text' => $event['delta']['text']]) . "\n\n";
                            flush();
                        }
                    }
                }

            } catch (\Throwable $e) {
                echo 'data: ' . json_encode(['error' => $e->getMessage()]) . "\n\n";
                flush();
            }

            echo "data: [DONE]\n\n";
            flush();

        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache, no-store',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function buildSystemPrompt(array $data): string
    {
        $category = $data['category'] ?? 'general';
        $consumer = $data['consumer_name'] ?? 'Valued Customer';
        $ref      = !empty($data['ref_number']) ? "\nComplaint reference: {$data['ref_number']}" : '';
        $company  = $data['company_name'] ?? 'Our Company';
        $desc     = !empty($data['description']) ? "\n\nComplaint filed by the consumer:\n" . substr($data['description'], 0, 1000) : '';

        return <<<PROMPT
You are a professional customer relations specialist writing an official response on behalf of {$company}.

You are responding to a {$category} complaint filed by {$consumer}.{$ref}{$desc}

Rules:
- Start the letter with: Dear {$consumer},
- Address the specific issue raised in the complaint
- Be professional, empathetic and concise
- Do NOT use placeholders like [X], [amount], [date] or [describe] — write a complete, ready-to-send response
- End with: Kind regards,\n{$company} Customer Relations
- Length: 150–280 words
- Output only the letter text, nothing else
PROMPT;
    }
}

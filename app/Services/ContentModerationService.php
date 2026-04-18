<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AI-powered complaint content moderation.
 *
 * Actions returned by the AI:
 *   approved  — content is fine, publish as-is
 *   edited    — AI censored profanity / personal info, publish the edited version
 *   flagged   — potentially defamatory, hold for admin review
 *   rejected  — spam, completely incoherent, or severe violation
 *
 * Flags (can be multiple):
 *   profanity       — swear words / offensive language
 *   defamation      — unverifiable damaging claims beyond normal complaint
 *   personal_info   — phone/address/ID numbers exposed
 *   threat          — threats of physical harm or illegal action
 *   spam            — repetitive, fake, or irrelevant content
 *   competitor_attack — appears to be a competitor posting fake complaints
 *
 * Drivers:
 *   anthropic (default, production) — Claude claude-3-haiku-20240307
 *   log (local dev)                 — logs the request, auto-approves
 */
class ContentModerationService
{
    private const ANTHROPIC_URL     = 'https://api.anthropic.com/v1/messages';
    private const ANTHROPIC_MODEL   = 'claude-3-haiku-20240307';
    private const ANTHROPIC_VERSION = '2023-06-01';

    private const SYSTEM_PROMPT = <<<PROMPT
You are a content moderation AI for Aus Fair Go, an Australian consumer complaint platform similar to Reclame Aqui in Brazil.

Your job is to review consumer complaints submitted against businesses and ensure the content is appropriate, factual, and does not violate platform rules.

PLATFORM RULES:
1. Complaints must describe a genuine consumer experience with a specific business
2. Profanity, swear words, and offensive language must be censored (replaced with [censored by Aus Fair Go])
3. Personal information (phone numbers, home addresses, government ID numbers like TFN or ABN of individuals, bank account numbers) must be removed
4. Threats of physical harm must result in rejection
5. Defamatory claims — i.e. unverifiable accusations of criminal activity beyond what would be a normal consumer complaint (e.g. "they are running a scam", "they are criminals") should be flagged for human review, not auto-edited
6. Spam, gibberish, or complaints with no actual substance must be rejected
7. Competitor attacks (complaints that appear written by a business rival rather than a genuine consumer) should be flagged

WHAT IS ACCEPTABLE (do NOT flag or edit):
- Strong but factual descriptions of poor service ("this was absolutely terrible service", "I am furious", "this is a disgrace")
- Emotional language expressing frustration as a consumer
- Claims of being deceived or misled if the consumer is describing their experience
- Demanding refunds, replacements, or accountability
- Mentioning being pregnant, elderly, disabled, or other personal context (this gives context, is fine)
- Accusations like "fraud" or "scam" IF the consumer is describing their specific experience (e.g. "I feel this is a scam because they charged me twice") — these should be FLAGGED not rejected

IMPORTANT: Be conservative. When in doubt, approve. Only edit or flag clear violations.

Respond ONLY with a valid JSON object, no other text:
{
  "action": "approved|edited|flagged|rejected",
  "edited_title": null,
  "edited_description": null,
  "edited_expected_resolution": null,
  "flags": [],
  "reason": "brief explanation in English",
  "edits_summary": []
}

- Set edited_title/description/expected_resolution to the cleaned version ONLY if you made changes, otherwise null
- flags is an array of: profanity, defamation, personal_info, threat, spam, competitor_attack
- edits_summary is an array of strings describing what was changed (e.g. "Removed profanity in first sentence")
- reason should be concise (1-2 sentences max)
PROMPT;

    public function moderate(string $title, string $description, ?string $expectedResolution = null): array
    {
        $driver = config('services.moderation.driver', 'log');

        if ($driver === 'log' || !config('services.anthropic.key')) {
            return $this->logDriver($title, $description, $expectedResolution);
        }

        return $this->anthropicDriver($title, $description, $expectedResolution);
    }

    /**
     * Profanity words — censored with [censored by Aus Fair Go] and flagged for review.
     * Complaint is held from public view until an admin approves it.
     */
    private const PROFANITY = [
        'fuck', 'fucking', 'fucker', 'fucked', 'fuckhead', 'fuk',
        'shit', 'shitty', 'shitter', 'bullshit',
        'cunt', 'cunts',
        'bitch', 'bitches',
        'asshole', 'arsehole', 'ass', 'arse',
        'bastard', 'bastards',
        'dick', 'dicks', 'dickhead',
        'cock', 'cocks', 'cockhead',
        'pussy', 'pussies',
        'motherfucker', 'motherfucking',
        'wanker', 'wankers', 'wank',
        'prick', 'pricks',
        'twat', 'twats',
        'tosser', 'tossers',
        'idiot', 'idiots',
        'imbecile', 'imbeciles',
        'moron', 'morons',
        'retard', 'retarded',
        'stupid', 'dumb', 'dumbass',
        'loser', 'losers',
        'liar', 'liars',
        'pig', 'pigs',
        'nazi', 'nazis',
    ];

    /**
     * Defamation / hate keywords — flag for human review without auto-censoring.
     * These may be legitimate consumer experiences that deserve nuance.
     */
    private const DEFAMATION = [
        'racist', 'racists', 'racism',
        'scammer', 'scammers',
        'criminal', 'criminals',
        'corrupt',
        'illegal',
        'fraud', 'fraudulent',
        'terrorist', 'terrorists',
        'pedophile', 'predator',
        'money laundering',
        'bribe', 'bribery',
    ];

    /**
     * Word-list scan — safety net when:
     *  - MODERATION_DRIVER=log (dev), OR
     *  - Anthropic API is unreachable / returns an error
     *
     * Policy:
     *  - Profanity   → words censored, action = flagged (held for admin review, NOT published)
     *  - Defamation  → action = flagged (held for admin review, NOT published)
     *  - Spam        → action = rejected (hidden immediately)
     *  - Clean       → action = approved
     */
    private function localScan(string $title, string $description, ?string $resolution): array
    {
        $text = strtolower($title . ' ' . $description . ' ' . ($resolution ?? ''));

        // ── Spam check ───────────────────────────────────────────────────────
        // Reject only when the DESCRIPTION is gibberish or meaningless.
        // A short title is fine — "Unknown charge", "No refund" are legitimate.
        // We require: description has at least 5 words AND is not just the title repeated.
        $descWords      = str_word_count(trim($description), 0);
        $descNorm       = strtolower(trim($description));
        $titleNorm      = strtolower(trim($title));
        $isRepeat       = $descNorm === $titleNorm || str_starts_with($descNorm, $titleNorm);
        $isGibberish    = $descWords <= 4 || ($isRepeat && $descWords <= 6);

        if ($isGibberish) {
            return [
                'action'                    => 'rejected',
                'edited_title'              => null,
                'edited_description'        => null,
                'edited_expected_resolution'=> null,
                'flags'                     => ['spam'],
                'reason'                    => 'Description is too short or does not describe a genuine consumer experience.',
                'edits_summary'             => [],
            ];
        }

        // ── Profanity check ──────────────────────────────────────────────────
        $foundProfanity = array_filter(
            self::PROFANITY,
            fn($w) => (bool) preg_match('/\b' . preg_quote($w, '/') . '\b/i', $text)
        );
        $foundProfanity = array_values($foundProfanity);

        // ── Defamation check ─────────────────────────────────────────────────
        $foundDefamation = array_filter(
            self::DEFAMATION,
            fn($w) => str_contains($text, strtolower($w))
        );
        $foundDefamation = array_values($foundDefamation);

        // ── Nothing found ────────────────────────────────────────────────────
        if (empty($foundProfanity) && empty($foundDefamation)) {
            return [
                'action'                    => 'approved',
                'edited_title'              => null,
                'edited_description'        => null,
                'edited_expected_resolution'=> null,
                'flags'                     => [],
                'reason'                    => 'No issues found.',
                'edits_summary'             => [],
            ];
        }

        // ── Build flags ──────────────────────────────────────────────────────
        $flags = [];
        if (!empty($foundProfanity))   $flags[] = 'profanity';
        if (!empty($foundDefamation))  $flags[] = 'defamation';

        // ── Censor profanity in content ──────────────────────────────────────
        $editedTitle      = $title;
        $editedDesc       = $description;
        $editedResolution = $resolution;
        $edits            = [];

        if (!empty($foundProfanity)) {
            $pattern = '/\b(' . implode('|', array_map(fn($w) => preg_quote($w, '/'), $foundProfanity)) . ')\b/i';
            $censor  = fn(string $s) => preg_replace($pattern, '[censored by Aus Fair Go]', $s);

            $editedTitle      = $censor($title);
            $editedDesc       = $censor($description);
            $editedResolution = $resolution ? $censor($resolution) : null;
            $edits[]          = 'Profanity replaced with [censored by Aus Fair Go]';
        }

        if (!empty($foundDefamation)) {
            $edits[] = 'Potential defamation detected — held for human review';
        }

        return [
            'action'                    => 'flagged',   // ALWAYS held — never auto-published
            'edited_title'              => $editedTitle !== $title             ? $editedTitle      : null,
            'edited_description'        => $editedDesc !== $description        ? $editedDesc       : null,
            'edited_expected_resolution'=> $editedResolution !== $resolution   ? $editedResolution : null,
            'flags'                     => $flags,
            'reason'                    => 'Content flagged for review: ' . implode(', ', $edits),
            'edits_summary'             => $edits,
        ];
    }

    private function anthropicDriver(string $title, string $description, ?string $resolution): array
    {
        $userMessage = "Please moderate this consumer complaint:\n\n"
            . "TITLE: {$title}\n\n"
            . "DESCRIPTION:\n{$description}"
            . ($resolution ? "\n\nEXPECTED RESOLUTION:\n{$resolution}" : '');

        try {
            $response = Http::withHeaders([
                'x-api-key'         => config('services.anthropic.key'),
                'anthropic-version' => self::ANTHROPIC_VERSION,
                'content-type'      => 'application/json',
            ])->timeout(30)->post(self::ANTHROPIC_URL, [
                'model'      => self::ANTHROPIC_MODEL,
                'max_tokens' => 1024,
                'system'     => self::SYSTEM_PROMPT,
                'messages'   => [
                    ['role' => 'user', 'content' => $userMessage],
                ],
            ]);

            if (!$response->successful()) {
                Log::error('Moderation API error: ' . $response->body());
                return $this->fallback($title, $description, $resolution);
            }

            $text = $response->json('content.0.text', '');
            $data = json_decode($text, true);

            if (!$data || !isset($data['action'])) {
                Log::warning('Moderation AI returned unparseable response: ' . $text);
                return $this->fallback($title, $description, $resolution);
            }

            return $this->normalise($data);

        } catch (\Throwable $e) {
            Log::error('Moderation exception: ' . $e->getMessage());
            return $this->fallback($title, $description, $resolution);
        }
    }

    /**
     * Local dev driver — runs the local word-list scan, then approves.
     * Catches obvious profanity/spam even without an API key.
     * Set MODERATION_DRIVER=log in .env to use.
     */
    private function logDriver(string $title, string $description, ?string $resolution): array
    {
        Log::info('[ContentModeration:log] Running local scan (dev mode)', [
            'title'       => $title,
            'description' => substr($description, 0, 100),
        ]);

        return $this->localScan($title, $description, $resolution);
    }

    /**
     * Failsafe: Anthropic API unreachable or returned an error.
     * Fall back to the local word-list scan — at minimum catches severe profanity/spam.
     * We never silently block a legitimate consumer complaint.
     */
    private function fallback(string $title = '', string $description = '', ?string $resolution = null): array
    {
        Log::warning('[ContentModeration] Falling back to local scan.');
        return $this->localScan($title, $description, $resolution);
    }

    private function normalise(array $data): array
    {
        $validActions = ['approved', 'edited', 'flagged', 'rejected'];
        $validFlags   = ['profanity', 'defamation', 'personal_info', 'threat', 'spam', 'competitor_attack'];

        return [
            'action'                    => in_array($data['action'] ?? '', $validActions) ? $data['action'] : 'approved',
            'edited_title'              => $data['edited_title'] ?? null,
            'edited_description'        => $data['edited_description'] ?? null,
            'edited_expected_resolution'=> $data['edited_expected_resolution'] ?? null,
            'flags'                     => array_values(array_intersect($data['flags'] ?? [], $validFlags)),
            'reason'                    => $data['reason'] ?? '',
            'edits_summary'             => $data['edits_summary'] ?? [],
        ];
    }
}

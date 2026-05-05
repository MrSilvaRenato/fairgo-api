<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GooglePlacesService
{
    private const FIND_URL    = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
    private const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

    private ?string $key;

    public function __construct()
    {
        $this->key = config('services.google.places_key');
    }

    public function isConfigured(): bool
    {
        return !empty($this->key);
    }

    /**
     * Find a company on Google Places and return structured snapshot data.
     * Returns null if not found or API is not configured.
     */
    public function fetchForCompany(string $name, ?string $website = null): ?array
    {
        if (!$this->isConfigured()) {
            return null;
        }

        $placeId = $this->findPlaceId($name, $website);
        if (!$placeId) {
            return ['place_id' => null]; // searched, not found
        }

        return $this->fetchDetails($placeId);
    }

    private function findPlaceId(string $name, ?string $website): ?string
    {
        $query = $name . ' Australia';

        $response = Http::get(self::FIND_URL, [
            'input'           => $query,
            'inputtype'       => 'textquery',
            'fields'          => 'place_id',
            'locationbias'    => 'country:AU',
            'key'             => $this->key,
        ]);

        if (!$response->successful()) {
            Log::warning('[GooglePlaces] findPlace failed', ['status' => $response->status(), 'name' => $name]);
            return null;
        }

        $candidates = $response->json('candidates', []);
        return $candidates[0]['place_id'] ?? null;
    }

    private function fetchDetails(string $placeId): ?array
    {
        $response = Http::get(self::DETAILS_URL, [
            'place_id' => $placeId,
            'fields'   => 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,url,reviews',
            'key'      => $this->key,
        ]);

        if (!$response->successful()) {
            Log::warning('[GooglePlaces] details failed', ['place_id' => $placeId]);
            return null;
        }

        $result = $response->json('result', []);
        if (empty($result)) {
            return null;
        }

        return [
            'place_id'           => $placeId,
            'google_name'        => $result['name'] ?? null,
            'rating'             => isset($result['rating']) ? round($result['rating'], 1) : null,
            'user_ratings_total' => $result['user_ratings_total'] ?? null,
            'address'            => $result['formatted_address'] ?? null,
            'phone'              => $result['formatted_phone_number'] ?? null,
            'website'            => $result['website'] ?? null,
            'maps_url'           => $result['url'] ?? null,
            'reviews'            => $this->normaliseReviews($result['reviews'] ?? []),
            'fetched_at'         => now(),
        ];
    }

    private function normaliseReviews(array $raw): array
    {
        return collect($raw)->take(5)->map(fn ($r) => [
            'author_name'              => $r['author_name'] ?? 'Anonymous',
            'author_url'               => $r['author_url'] ?? null,
            'profile_photo_url'        => $r['profile_photo_url'] ?? null,
            'rating'                   => $r['rating'] ?? null,
            'text'                     => $r['text'] ?? '',
            'relative_time_description'=> $r['relative_time_description'] ?? '',
        ])->values()->all();
    }
}

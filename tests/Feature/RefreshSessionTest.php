<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RefreshSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_refresh_token(): void
    {
        $user = User::factory()->create();
        $oldToken = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withToken($oldToken)->postJson('/api/auth/refresh');

        $response->assertOk()
            ->assertJsonStructure([
                'user'  => ['id', 'name', 'email'],
                'token',
            ]);

        $newToken = $response->json('token');
        $this->assertNotEquals($oldToken, $newToken);
    }

    public function test_old_token_is_revoked_after_refresh(): void
    {
        $user = User::factory()->create();
        $plainToken = $user->createToken('auth_token')->plainTextToken;

        // One token exists before refresh
        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withToken($plainToken)->postJson('/api/auth/refresh')->assertOk();

        // Refresh deletes the old token and creates a new one — net: still one token
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_new_token_grants_access_after_refresh(): void
    {
        $user = User::factory()->create();
        $oldToken = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withToken($oldToken)->postJson('/api/auth/refresh')->assertOk();
        $newToken = $response->json('token');

        $this->withToken($newToken)->getJson('/api/auth/me')->assertOk();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->postJson('/api/auth/refresh')->assertUnauthorized();
    }

    public function test_refresh_response_includes_user_fields(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/auth/refresh');

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonStructure(['user' => ['company_id', 'unread_replies']]);
    }
}

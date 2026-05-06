<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Services\MonetisationGateService;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;

class BillingController extends Controller
{
    private function stripe(): StripeClient
    {
        return new StripeClient(config('services.stripe.secret'));
    }

    // GET /billing/plans
    public function plans(MonetisationGateService $monetisationGate)
    {
        return response()->json([
            'monetisation' => $monetisationGate->status(),
            'plans' => [
                [
                    'id'          => 'standard',
                    'name'        => 'Standard',
                    'price'       => 149,
                    'price_id'    => config('services.stripe.prices.standard'),
                    'features'    => ['Analytics dashboard', 'Complaint trends', 'Response time analytics', 'Satisfaction scores'],
                    'rules'       => ['No pay-to-remove', 'No pay-to-suppress', 'No paid ranking manipulation'],
                ],
                [
                    'id'          => 'pro',
                    'name'        => 'Pro',
                    'price'       => 399,
                    'price_id'    => config('services.stripe.prices.pro'),
                    'features'    => ['Everything in Standard', 'Priority support', 'Trust badge widget', 'API access', 'Custom branding'],
                    'rules'       => ['No pay-to-remove', 'No pay-to-suppress', 'No paid ranking manipulation'],
                ],
            ],
        ]);
    }

    // POST /billing/checkout  { plan: 'standard'|'pro' }
    public function checkout(Request $request, MonetisationGateService $monetisationGate)
    {
        $gateStatus = $monetisationGate->status();

        if (!$gateStatus['launched']) {
            return response()->json([
                'message' => 'Paid business tools are not available until monetisation gates are met.',
                'monetisation' => $gateStatus,
            ], 403);
        }

        $request->validate(['plan' => 'required|in:standard,pro']);

        $company = $request->user()->company;
        if (!$company) {
            return response()->json(['message' => 'No company found.'], 404);
        }

        $priceId = $request->plan === 'pro'
            ? config('services.stripe.prices.pro')
            : config('services.stripe.prices.standard');

        $stripe = $this->stripe();

        $session = $stripe->checkout->sessions->create([
            'mode'                => 'subscription',
            'customer_email'      => $request->user()->email,
            'line_items'          => [['price' => $priceId, 'quantity' => 1]],
            'success_url'         => config('app.frontend_url') . '/company/billing?success=1',
            'cancel_url'          => config('app.frontend_url') . '/company/billing?cancelled=1',
            'metadata'            => [
                'company_id' => $company->id,
                'plan'       => $request->plan,
            ],
        ]);

        return response()->json(['url' => $session->url]);
    }

    // POST /billing/cancel
    public function cancel(Request $request)
    {
        $company = $request->user()->company;
        if (!$company) {
            return response()->json(['message' => 'No company found.'], 404);
        }

        $subscription = $company->subscription;
        if (!$subscription || $subscription->plan === 'free') {
            return response()->json(['message' => 'No active paid subscription.'], 422);
        }

        // Cancel in Stripe if we have a stripe_id
        if ($subscription->stripe_subscription_id) {
            $stripe = $this->stripe();
            $stripe->subscriptions->cancel($subscription->stripe_subscription_id);
        }

        $subscription->update(['plan' => 'free', 'stripe_subscription_id' => null]);

        return response()->json(['message' => 'Subscription cancelled.']);
    }

    // POST /billing/webhook  (no auth middleware)
    public function webhook(Request $request)
    {
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sigHeader,
                config('services.stripe.webhook_secret')
            );
        } catch (SignatureVerificationException $e) {
            return response()->json(['error' => 'Invalid signature.'], 400);
        }

        match ($event->type) {
            'checkout.session.completed' => $this->handleCheckoutCompleted($event->data->object),
            'customer.subscription.deleted' => $this->handleSubscriptionDeleted($event->data->object),
            default => null,
        };

        return response()->json(['ok' => true]);
    }

    private function handleCheckoutCompleted(object $session): void
    {
        $companyId = $session->metadata->company_id ?? null;
        $plan      = $session->metadata->plan ?? 'standard';
        $stripeSubId = $session->subscription ?? null;

        if (!$companyId) return;

        Subscription::updateOrCreate(
            ['company_id' => $companyId],
            ['plan' => $plan, 'stripe_subscription_id' => $stripeSubId]
        );
    }

    private function handleSubscriptionDeleted(object $stripeSub): void
    {
        Subscription::where('stripe_subscription_id', $stripeSub->id)
            ->update(['plan' => 'free', 'stripe_subscription_id' => null]);
    }
}

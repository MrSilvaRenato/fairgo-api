<x-mail::message>
# New complaint received

A new complaint has been submitted against **{{ $complaint->company->name }}**.

**Category:** {{ ucfirst($complaint->category) }}

**Description:**
{{ $complaint->description }}

<x-mail::button :url="config('app.frontend_url') . '/complaints/' . $complaint->id">
View Complaint
</x-mail::button>

Log in to your Aus Fair Go dashboard to respond within 5 business days.

Thanks,
{{ config('app.name') }}
</x-mail::message>

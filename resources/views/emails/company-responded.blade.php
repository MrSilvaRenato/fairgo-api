<x-mail::message>
# {{ $complaint->company->name }} has responded to your complaint

Your complaint has received a response on Aus Fair Go.

**Your complaint:** {{ Str::limit($complaint->description, 120) }}

**Response:**
{{ $complaint->response->message }}

<x-mail::button :url="config('app.frontend_url') . '/complaints/' . $complaint->id">
View & Close Complaint
</x-mail::button>

If you're satisfied with the resolution, you can mark it as resolved.

Thanks,
{{ config('app.name') }}
</x-mail::message>

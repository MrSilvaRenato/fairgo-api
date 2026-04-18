<x-mail::message>
# Complaint {{ $complaint->status === 'resolved' ? 'resolved' : 'marked unresolved' }}

A consumer has closed their complaint against **{{ $complaint->company->name }}**.

**Status:** {{ ucfirst(str_replace('_', ' ', $complaint->status)) }}

@if($complaint->feedback?->comment)
**Consumer comment:** {{ $complaint->feedback->comment }}
@endif

@if($complaint->feedback?->rating)
**Rating:** {{ $complaint->feedback->rating }}/5
@endif

<x-mail::button :url="config('app.frontend_url') . '/complaints/' . $complaint->id">
View Complaint
</x-mail::button>

Thanks,
{{ config('app.name') }}
</x-mail::message>

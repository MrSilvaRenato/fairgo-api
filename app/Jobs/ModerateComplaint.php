<?php

namespace App\Jobs;

use App\Models\Complaint;
use App\Services\ContentModerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ModerateComplaint implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public function __construct(private int $complaintId) {}

    public function handle(ContentModerationService $service): void
    {
        $complaint = Complaint::find($this->complaintId);

        if (!$complaint) {
            return;
        }

        $result = $service->moderate(
            $complaint->title,
            $complaint->description,
            $complaint->expected_resolution
        );

        $update = [
            'moderation_status' => $result['action'],
            'moderation_flags'  => $result['flags'],
            'moderation_note'   => $result['reason'],
            'moderation_edited' => false,
        ];

        // Apply AI edits to the complaint content
        if ($result['action'] === 'edited') {
            $update['moderation_edited'] = true;

            if ($result['edited_title']) {
                $update['title'] = $result['edited_title'];
            }
            if ($result['edited_description']) {
                $update['description'] = $result['edited_description'];
            }
            if ($result['edited_expected_resolution']) {
                $update['expected_resolution'] = $result['edited_expected_resolution'];
            }
        }

//         // Apply AI edits whenever edited fields are returned,
// // even if the complaint is still flagged for human review.
// $hasEdits =
//     !empty($result['edited_title']) ||
//     !empty($result['edited_description']) ||
//     !empty($result['edited_expected_resolution']);

// if ($hasEdits) {
//     $update['moderation_edited'] = true;

//     if (!empty($result['edited_title'])) {
//         $update['title'] = $result['edited_title'];
//     }

//     if (!empty($result['edited_description'])) {
//         $update['description'] = $result['edited_description'];
//     }

//     if (!empty($result['edited_expected_resolution'])) {
//         $update['expected_resolution'] = $result['edited_expected_resolution'];
//     }
// }

        // Flagged and rejected complaints are held from public view until admin reviews
        if (in_array($result['action'], ['flagged', 'rejected'])) {
            $update['is_public'] = false;
        }

        $complaint->update($update);

        Log::info('[ModerateComplaint] Complaint #' . $complaint->id . ' → ' . $result['action'], [
            'flags'        => $result['flags'],
            'edits_summary'=> $result['edits_summary'],
        ]);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('[ModerateComplaint] Job failed for complaint #' . $this->complaintId . ': ' . $e->getMessage());

        // Hold for manual admin review rather than auto-approving — prevents bypass via service outage
        Complaint::where('id', $this->complaintId)->update([
            'moderation_status' => 'pending',
            'moderation_note'   => 'Moderation job failed — held for manual review.',
        ]);
    }
}

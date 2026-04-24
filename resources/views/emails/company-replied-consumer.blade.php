<x-emails.layout>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding-bottom:24px;">
        <div style="width:56px;height:56px;background:#e8f0eb;border-radius:14px;display:inline-block;text-align:center;line-height:56px;font-size:26px;">💬</div>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:8px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a2e23;letter-spacing:-0.5px;">{{ $companyName }} has responded</h1>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <p style="margin:0;font-size:15px;color:#5a6b60;line-height:1.6;">
          Hi <strong style="color:#1a2e23;">{{ $name }}</strong>,<br/>
          the company has replied to your complaint.
        </p>
      </td>
    </tr>

    <!-- Complaint box -->
    <tr>
      <td style="background:#f5f0e8;border-radius:12px;padding:16px 20px;">
        <p style="margin:0;font-size:13px;color:#8a9690;padding-bottom:4px;">Your complaint</p>
        <p style="margin:0;font-size:14px;color:#1a2e23;font-weight:600;">{{ $title }}</p>
      </td>
    </tr>

    <tr><td style="padding-bottom:24px;"></td></tr>

    <!-- Button -->
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <a href="{{ $url }}" style="display:inline-block;background:#2d5a45;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;">
          Read their response
        </a>
      </td>
    </tr>

    <tr>
      <td style="border-top:1px solid #eee8dc;padding-top:20px;">
        <p style="margin:0;font-size:13px;color:#8a9690;text-align:center;">
          You can reply, continue the conversation, or mark it as resolved.
        </p>
      </td>
    </tr>
  </table>
</x-emails.layout>

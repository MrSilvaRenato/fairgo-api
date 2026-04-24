<x-emails.layout>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding-bottom:24px;">
        <div style="width:56px;height:56px;background:#e8f0eb;border-radius:14px;display:inline-block;text-align:center;line-height:56px;font-size:26px;">📋</div>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:8px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a2e23;letter-spacing:-0.5px;">Your complaint is live</h1>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <p style="margin:0;font-size:15px;color:#5a6b60;line-height:1.6;">
          Hi <strong style="color:#1a2e23;">{{ $name }}</strong>,<br/>
          your complaint against <strong style="color:#1a2e23;">{{ $companyName }}</strong> is now publicly visible.
        </p>
      </td>
    </tr>

    <!-- Info box -->
    <tr>
      <td style="background:#f5f0e8;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#5a6b60;padding-bottom:6px;">
              <strong style="color:#1a2e23;">Complaint:</strong> {{ $title }}
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#5a6b60;">
              ⏳ The company has <strong style="color:#1a2e23;">7 days</strong> to respond on the record.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr><td style="padding-bottom:24px;"></td></tr>

    <!-- Button -->
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <a href="{{ $url }}" style="display:inline-block;background:#2d5a45;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;">
          View your complaint
        </a>
      </td>
    </tr>

    <tr>
      <td style="border-top:1px solid #eee8dc;padding-top:20px;">
        <p style="margin:0;font-size:13px;color:#8a9690;text-align:center;line-height:1.6;">
          We'll notify you as soon as they respond.<br/>
          <a href="{{ $url }}" style="color:#2d5a45;word-break:break-all;font-size:12px;">{{ $url }}</a>
        </p>
      </td>
    </tr>
  </table>
</x-emails.layout>

@include('emails.partials.header', ['subject' => 'New complaint filed — Aus Fair Go'])

    <tr>
      <td align="center" style="padding-bottom:24px;">
        <div style="width:56px;height:56px;background:#fef3e2;border-radius:14px;display:inline-block;text-align:center;line-height:56px;font-size:26px;">⚠️</div>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:8px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a2e23;letter-spacing:-0.5px;">New complaint filed</h1>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <p style="margin:0;font-size:15px;color:#5a6b60;line-height:1.6;">
          Hi <strong style="color:#1a2e23;">{{ $name }}</strong>,<br/>
          a customer has filed a complaint against <strong style="color:#1a2e23;">{{ $companyName }}</strong>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#fef9f0;border:1px solid #f5e4c0;border-radius:12px;padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#5a6b60;padding-bottom:6px;">
              <strong style="color:#1a2e23;">Complaint:</strong> {{ $title }}
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#5a6b60;padding-bottom:6px;">
              <strong style="color:#1a2e23;">Filed by:</strong> {{ $consumer }}
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#c45c00;">
              ⏳ You have <strong>7 days</strong> to respond. Unanswered complaints impact your score.
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="padding-bottom:24px;"></td></tr>
    <tr>
      <td align="center" style="padding-bottom:16px;">
        <a href="{{ $complaintUrl }}" style="display:inline-block;background:#2d5a45;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;">
          Respond to complaint
        </a>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <a href="{{ $dashUrl }}" style="font-size:13px;color:#2d5a45;text-decoration:underline;">Go to your dashboard</a>
      </td>
    </tr>
    <tr>
      <td style="border-top:1px solid #eee8dc;padding-top:20px;">
        <p style="margin:0;font-size:12px;color:#aab5b0;text-align:center;">
          This complaint is publicly visible on your Aus Fair Go profile.
        </p>
      </td>
    </tr>

@include('emails.partials.footer')

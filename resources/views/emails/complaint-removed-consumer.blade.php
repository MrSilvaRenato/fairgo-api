@include('emails.partials.header', ['subject' => 'Complaint removed — Aus Fair Go'])

    <tr>
      <td align="center" style="padding-bottom:24px;">
        <div style="width:56px;height:56px;background:#fde8e8;border-radius:14px;display:inline-block;text-align:center;line-height:56px;font-size:26px;">🚫</div>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:8px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a2e23;letter-spacing:-0.5px;">Your complaint has been removed</h1>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <p style="margin:0;font-size:15px;color:#5a6b60;line-height:1.6;">
          Hi <strong style="color:#1a2e23;">{{ $name }}</strong>,<br/>
          after review, your complaint was found to breach our community guidelines.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#fdf0f0;border:1px solid #f5c6c6;border-radius:12px;padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#5a6b60;padding-bottom:6px;">
              <strong style="color:#1a2e23;">Complaint:</strong> {{ $title }}
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#5a6b60;padding-bottom:6px;">
              <strong style="color:#1a2e23;">Against:</strong> {{ $companyName }}
            </td>
          </tr>
          @if($reason)
          <tr>
            <td style="font-size:13px;color:#5a6b60;">
              <strong style="color:#1a2e23;">Reason:</strong> {{ $reason }}
            </td>
          </tr>
          @else
          <tr>
            <td style="font-size:13px;color:#5a6b60;">
              The complaint contained profanity, defamatory claims, or personal attacks.
            </td>
          </tr>
          @endif
        </table>
      </td>
    </tr>
    <tr><td style="padding-bottom:24px;"></td></tr>
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <a href="{{ $guidelinesUrl }}" style="display:inline-block;background:#2d5a45;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;">
          Review community guidelines
        </a>
      </td>
    </tr>
    <tr>
      <td style="border-top:1px solid #eee8dc;padding-top:20px;">
        <p style="margin:0;font-size:13px;color:#8a9690;text-align:center;line-height:1.6;">
          If you believe this was a mistake, contact us at<br/>
          <a href="mailto:hello@ausfairgo.com.au" style="color:#2d5a45;">hello@ausfairgo.com.au</a>
        </p>
      </td>
    </tr>

@include('emails.partials.footer')

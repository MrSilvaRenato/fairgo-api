<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{{ $subject ?? 'Aus Fair Go' }}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#2d5a45;border-radius:16px;width:44px;height:44px;text-align:center;vertical-align:middle;">
                    <span style="color:#c9a84c;font-size:22px;font-weight:900;font-family:Georgia,serif;line-height:44px;display:block;">F</span>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="font-size:18px;font-weight:700;color:#1a2e23;letter-spacing:-0.3px;">Aus Fair Go</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 40px 36px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              {{ $slot }}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9aaa9f;line-height:1.8;">
                © {{ date('Y') }} Aus Fair Go · Australia's consumer accountability platform<br/>
                <a href="{{ config('app.frontend_url') }}" style="color:#2d5a45;text-decoration:none;">ausfairgo.com.au</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>

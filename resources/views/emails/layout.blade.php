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
                  <td style="background:#2d5a45;border-radius:16px;width:48px;height:48px;text-align:center;vertical-align:middle;">
                    <svg width="28" height="28" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:10px auto;">
                      <circle cx="20" cy="20" r="19" fill="#2d5a45"/>
                      <path d="M12 26c2-2 10-6 14-14 1 9-5 14-14 14Z" fill="#c9a84c" opacity=".95"/>
                      <path d="M12 26c2-2 10-6 14-14 1 9-5 14-14 14Z" fill="#f5f0e8" opacity=".9" transform="translate(-2,-2)"/>
                      <path d="M8 30h24" stroke="#f5f0e8" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
                    </svg>
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

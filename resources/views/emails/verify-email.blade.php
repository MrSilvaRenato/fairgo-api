<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email — Aus Fair Go</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo / Header -->
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

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:56px;height:56px;background:#e8f0eb;border-radius:14px;display:inline-block;text-align:center;line-height:56px;font-size:26px;">✉️</div>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <h1 style="margin:0;font-size:24px;font-weight:700;color:#1a2e23;letter-spacing:-0.5px;">Verify your email address</h1>
                  </td>
                </tr>

                <!-- Subtext -->
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;color:#5a6b60;line-height:1.6;">
                      Hi <strong style="color:#1a2e23;">{{ $name }}</strong>, thanks for joining Aus Fair Go.<br/>
                      Click the button below to activate your account.
                    </p>
                  </td>
                </tr>

                <!-- Button -->
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="{{ $url }}"
                       style="display:inline-block;background:#2d5a45;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:-0.2px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="border-top:1px solid #eee8dc;padding-top:24px;">
                    <p style="margin:0;font-size:13px;color:#8a9690;line-height:1.6;text-align:center;">
                      This link expires in <strong>60 minutes</strong>. If you didn't create an account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Fallback URL -->
                <tr>
                  <td style="padding-top:16px;">
                    <p style="margin:0;font-size:12px;color:#aab5b0;text-align:center;line-height:1.6;">
                      Having trouble? Copy and paste this URL into your browser:<br/>
                      <a href="{{ $url }}" style="color:#2d5a45;word-break:break-all;">{{ $url }}</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9aaa9f;">
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

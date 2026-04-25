<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your account has been deactivated — Aus Fair Go</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding-bottom:28px;">
              <img src="https://ausfairgo.com.au/logo.png" alt="Aus Fair Go" width="56" height="56" style="display:block;border-radius:50%;" />
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 40px 36px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <table width="100%" cellpadding="0" cellspacing="0">

                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:56px;height:56px;background:#f5f0e8;border-radius:14px;display:inline-block;text-align:center;line-height:56px;font-size:26px;">👋</div>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <h1 style="margin:0;font-size:24px;font-weight:700;color:#1a2e23;letter-spacing:-0.5px;">Your account has been deactivated</h1>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <p style="margin:0;font-size:15px;color:#5a6b60;line-height:1.6;">
                      Hi <strong style="color:#1a2e23;">{{ $name }}</strong>,<br/>
                      Your Aus Fair Go account has been successfully deactivated as requested.
                      Your login credentials and contact details have been removed from our system.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f5f0e8;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#8a9690;text-transform:uppercase;letter-spacing:0.05em;">What this means</p>
                    <ul style="margin:0;padding:0 0 0 16px;font-size:13px;color:#4a6055;line-height:1.8;">
                      <li>You will no longer be able to log in to this account</li>
                      <li>Your personal contact information has been removed</li>
                      <li>Any complaints you filed remain on the platform as part of the public record</li>
                    </ul>
                  </td>
                </tr>

                <tr>
                  <td style="padding-top:24px;border-top:1px solid #eee8dc;">
                    <p style="margin:0;font-size:13px;color:#8a9690;line-height:1.6;text-align:center;">
                      If you did not request this deactivation, please contact us immediately at
                      <a href="mailto:support@ausfairgo.com.au" style="color:#2d5a45;">support@ausfairgo.com.au</a>.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

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

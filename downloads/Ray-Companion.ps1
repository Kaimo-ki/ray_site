Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "SilentlyContinue"
$appUrl = "https://kaimo-ki.github.io/ray_site/"
$appDir = Join-Path $env:LOCALAPPDATA "RayWeb"
$iconPath = Join-Path $appDir "ray.ico"
$configPath = Join-Path $appDir "companion.json"
$botUrl = ""

if (Test-Path $configPath) {
    try {
        $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
        if ($config.botUrl) { $botUrl = [string]$config.botUrl }
    } catch { }
}

function Open-RayWeb {
    $edge = Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe"
    $edge2 = Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe"
    $chrome = Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"
    $chrome2 = Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"
    $browser = @($edge, $edge2, $chrome, $chrome2) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($browser) {
        Start-Process $browser "--app=$appUrl --new-window"
    } else {
        Start-Process $appUrl
    }
}

function Open-RayBot {
    if ($botUrl -and $botUrl.Trim().Length -gt 0) {
        Start-Process $botUrl
    } else {
        Start-Process "tg://"
    }
}

function Show-ChatWindow {
    $chat = New-Object System.Windows.Forms.Form
    $chat.Text = "Ray"
    $chat.Size = New-Object System.Drawing.Size(420, 260)
    $chat.StartPosition = "CenterScreen"
    $chat.TopMost = $true
    $chat.BackColor = [System.Drawing.Color]::FromArgb(7, 17, 15)
    $chat.ForeColor = [System.Drawing.Color]::White
    $chat.Font = New-Object System.Drawing.Font("Segoe UI", 10)

    $label = New-Object System.Windows.Forms.Label
    $label.Text = "Write to Ray. I will copy the text and open Telegram."
    $label.AutoSize = $false
    $label.Location = New-Object System.Drawing.Point(16, 14)
    $label.Size = New-Object System.Drawing.Size(370, 38)

    $box = New-Object System.Windows.Forms.TextBox
    $box.Multiline = $true
    $box.Location = New-Object System.Drawing.Point(16, 58)
    $box.Size = New-Object System.Drawing.Size(370, 82)

    $send = New-Object System.Windows.Forms.Button
    $send.Text = "Write"
    $send.Location = New-Object System.Drawing.Point(16, 158)
    $send.Size = New-Object System.Drawing.Size(112, 34)
    $send.Add_Click({
        if ($box.Text.Trim().Length -gt 0) {
            [System.Windows.Forms.Clipboard]::SetText($box.Text.Trim())
        }
        Open-RayBot
        $chat.Close()
    })

    $voice = New-Object System.Windows.Forms.Button
    $voice.Text = "Voice"
    $voice.Location = New-Object System.Drawing.Point(140, 158)
    $voice.Size = New-Object System.Drawing.Size(112, 34)
    $voice.Add_Click({
        Open-RayBot
        $chat.Close()
    })

    $web = New-Object System.Windows.Forms.Button
    $web.Text = "Ray Web"
    $web.Location = New-Object System.Drawing.Point(264, 158)
    $web.Size = New-Object System.Drawing.Size(112, 34)
    $web.Add_Click({
        Open-RayWeb
        $chat.Close()
    })

    $hint = New-Object System.Windows.Forms.Label
    $hint.Text = "If Telegram opens without Ray chat, set the bot username during install."
    $hint.AutoSize = $false
    $hint.Location = New-Object System.Drawing.Point(16, 202)
    $hint.Size = New-Object System.Drawing.Size(370, 36)
    $hint.ForeColor = [System.Drawing.Color]::FromArgb(168, 182, 176)

    $chat.Controls.AddRange(@($label, $box, $send, $voice, $web, $hint))
    [void]$chat.ShowDialog()
}

$form = New-Object System.Windows.Forms.Form
$form.Text = "Ray Companion"
$form.FormBorderStyle = "None"
$form.StartPosition = "Manual"
$form.Size = New-Object System.Drawing.Size(82, 82)
$form.Location = New-Object System.Drawing.Point(40, 220)
$form.TopMost = $true
$form.ShowInTaskbar = $false
$form.BackColor = [System.Drawing.Color]::Magenta
$form.TransparencyKey = [System.Drawing.Color]::Magenta
$form.DoubleBuffered = $true

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, 82, 82)
$form.Region = New-Object System.Drawing.Region($path)

$form.Add_Paint({
    param($sender, $event)
    $g = $event.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $outer = New-Object System.Drawing.Rectangle(2, 2, 78, 78)
    $inner = New-Object System.Drawing.Rectangle(17, 17, 48, 48)
    $glow = New-Object System.Drawing.Drawing2D.PathGradientBrush(
        [System.Drawing.Point[]]@(
            (New-Object System.Drawing.Point(41, 2)),
            (New-Object System.Drawing.Point(80, 41)),
            (New-Object System.Drawing.Point(41, 80)),
            (New-Object System.Drawing.Point(2, 41))
        )
    )
    $glow.CenterColor = [System.Drawing.Color]::FromArgb(170, 50, 214, 176)
    $glow.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(0, 50, 214, 176))
    $g.FillEllipse($glow, $outer)
    $glow.Dispose()

    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 9, 24, 22))
    $g.FillEllipse($bg, 9, 9, 64, 64)
    $bg.Dispose()

    $core = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $inner,
        [System.Drawing.Color]::FromArgb(50, 214, 176),
        [System.Drawing.Color]::FromArgb(111, 183, 255),
        45
    )
    $g.FillEllipse($core, $inner)
    $core.Dispose()

    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 244, 247, 245), 2)
    $g.DrawEllipse($pen, 17, 17, 48, 48)
    $pen.Dispose()

    $font = New-Object System.Drawing.Font("Segoe UI", 19, [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString("R", $font, $brush, (New-Object System.Drawing.RectangleF(17, 14, 48, 52)), $format)
    $brush.Dispose()
    $font.Dispose()
    $format.Dispose()
})

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$openChat = $menu.Items.Add("Write to Ray")
$openChat.Add_Click({ Show-ChatWindow })
$openVoice = $menu.Items.Add("Voice in Telegram")
$openVoice.Add_Click({ Open-RayBot })
$openWeb = $menu.Items.Add("Open Ray Web")
$openWeb.Add_Click({ Open-RayWeb })
$menu.Items.Add("-") | Out-Null
$exit = $menu.Items.Add("Exit")
$exit.Add_Click({ $form.Close() })
$form.ContextMenuStrip = $menu

$dragging = $false
$dragOffset = New-Object System.Drawing.Point(0, 0)

$form.Add_MouseDown({
    if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $script:dragging = $true
        $script:dragOffset = $_.Location
    }
})

$form.Add_MouseMove({
    if ($script:dragging) {
        $screenPoint = [System.Windows.Forms.Control]::MousePosition
        $form.Location = New-Object System.Drawing.Point(
            ($screenPoint.X - $script:dragOffset.X),
            ($screenPoint.Y - $script:dragOffset.Y)
        )
    }
})

$form.Add_MouseUp({
    $script:dragging = $false
})

$form.Add_DoubleClick({
    Show-ChatWindow
})

[System.Windows.Forms.Application]::EnableVisualStyles()
[void][System.Windows.Forms.Application]::Run($form)

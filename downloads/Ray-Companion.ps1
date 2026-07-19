Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "SilentlyContinue"
$appUrl = "https://kaimo-ki.github.io/ray_site/"
$appDir = Join-Path $env:LOCALAPPDATA "RayWeb"
$iconPath = Join-Path $appDir "ray.ico"
$configPath = Join-Path $appDir "companion.json"
$botUrl = ""
$apiUrl = "https://ray-api-production.up.railway.app"
$sessionId = "windows-companion"

if (Test-Path $configPath) {
    try {
        $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
        if ($config.botUrl) { $botUrl = [string]$config.botUrl }
        if ($config.apiUrl) { $apiUrl = ([string]$config.apiUrl).TrimEnd("/") }
        if ($config.sessionId) { $sessionId = [string]$config.sessionId }
    } catch { }
}

function Save-RayConfig {
    try {
        if (-not (Test-Path $appDir)) { New-Item -ItemType Directory -Force -Path $appDir | Out-Null }
        $config = @{
            botUrl = $botUrl
            siteUrl = $appUrl
            apiUrl = $apiUrl
            sessionId = $sessionId
        } | ConvertTo-Json
        Set-Content -LiteralPath $configPath -Value $config -Encoding UTF8
    } catch { }
}

function Ask-RayApi([string]$text) {
    if (-not $apiUrl -or $apiUrl.Trim().Length -eq 0) {
        return "Ray API пока не подключён. Вставь Railway API в %LOCALAPPDATA%\RayWeb\companion.json."
    }

    try {
        $body = @{
            message = $text
            session_id = $sessionId
        } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$apiUrl/chat" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 45
        if ($response.session_id) {
            $script:sessionId = [string]$response.session_id
            Save-RayConfig
        }
        if ($response.reply) { return [string]$response.reply }
        return "Я рядом. Скажи чуть подробнее?"
    } catch {
        return "Не получилось достучаться до Ray API. Проверь Railway-ссылку и переменные окружения."
    }
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
    $chat.Size = New-Object System.Drawing.Size(460, 420)
    $chat.StartPosition = "CenterScreen"
    $chat.TopMost = $true
    $chat.BackColor = [System.Drawing.Color]::FromArgb(7, 17, 15)
    $chat.ForeColor = [System.Drawing.Color]::White
    $chat.Font = New-Object System.Drawing.Font("Segoe UI", 10)

    $label = New-Object System.Windows.Forms.Label
    $label.Text = "Напиши Рэю. Если Ray API доступен, он ответит прямо здесь."
    $label.AutoSize = $false
    $label.Location = New-Object System.Drawing.Point(16, 14)
    $label.Size = New-Object System.Drawing.Size(410, 38)

    $box = New-Object System.Windows.Forms.TextBox
    $box.Multiline = $true
    $box.Location = New-Object System.Drawing.Point(16, 58)
    $box.Size = New-Object System.Drawing.Size(410, 76)

    $answer = New-Object System.Windows.Forms.TextBox
    $answer.Multiline = $true
    $answer.ReadOnly = $true
    $answer.ScrollBars = "Vertical"
    $answer.Location = New-Object System.Drawing.Point(16, 146)
    $answer.Size = New-Object System.Drawing.Size(410, 128)
    $answer.BackColor = [System.Drawing.Color]::FromArgb(13, 26, 23)
    $answer.ForeColor = [System.Drawing.Color]::White
    $answer.BorderStyle = "FixedSingle"
    if ($apiUrl) {
        $answer.Text = "Ray API подключён. Можно писать сюда."
    } else {
        $answer.Text = "Ray API не подключён. Я могу открыть Ray Web или Telegram, но ответы здесь требуют Railway API."
    }

    $send = New-Object System.Windows.Forms.Button
    $send.Text = "Спросить"
    $send.Location = New-Object System.Drawing.Point(16, 292)
    $send.Size = New-Object System.Drawing.Size(92, 34)
    $send.Add_Click({
        $text = $box.Text.Trim()
        if ($text.Length -gt 0) {
            $answer.Text = "Thinking..."
            $chat.Refresh()
            $answer.Text = Ask-RayApi $text
        }
    })

    $voice = New-Object System.Windows.Forms.Button
    $voice.Text = "Голос"
    $voice.Location = New-Object System.Drawing.Point(118, 292)
    $voice.Size = New-Object System.Drawing.Size(92, 34)
    $voice.Add_Click({
        $answer.Text = "Голос в Windows companion требует отдельный native STT-шаг. Пока используй голос в Telegram или микрофон на сайте."
    })

    $web = New-Object System.Windows.Forms.Button
    $web.Text = "Ray Web"
    $web.Location = New-Object System.Drawing.Point(220, 292)
    $web.Size = New-Object System.Drawing.Size(92, 34)
    $web.Add_Click({
        Open-RayWeb
    })

    $telegram = New-Object System.Windows.Forms.Button
    $telegram.Text = "Telegram"
    $telegram.Location = New-Object System.Drawing.Point(322, 292)
    $telegram.Size = New-Object System.Drawing.Size(104, 34)
    $telegram.Add_Click({
        Open-RayBot
    })

    $hint = New-Object System.Windows.Forms.Label
    $hint.Text = "Если ответы не идут, проверь apiUrl в %LOCALAPPDATA%\RayWeb\companion.json."
    $hint.AutoSize = $false
    $hint.Location = New-Object System.Drawing.Point(16, 340)
    $hint.Size = New-Object System.Drawing.Size(410, 36)
    $hint.ForeColor = [System.Drawing.Color]::FromArgb(168, 182, 176)

    $chat.Controls.AddRange(@($label, $box, $answer, $send, $voice, $web, $telegram, $hint))
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
    $glow.CenterColor = [System.Drawing.Color]::FromArgb(190, 159, 186, 115)
    $glow.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(0, 159, 186, 115))
    $g.FillEllipse($glow, $outer)
    $glow.Dispose()

    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 9, 24, 22))
    $g.FillEllipse($bg, 9, 9, 64, 64)
    $bg.Dispose()

    $core = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $inner,
        [System.Drawing.Color]::FromArgb(159, 186, 115),
        [System.Drawing.Color]::FromArgb(199, 216, 163),
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
$openChat = $menu.Items.Add("Написать Рэю")
$openChat.Add_Click({ Show-ChatWindow })
$openVoice = $menu.Items.Add("Голос")
$openVoice.Add_Click({ Show-ChatWindow })
$openWeb = $menu.Items.Add("Открыть Ray Web")
$openWeb.Add_Click({ Open-RayWeb })
$openBot = $menu.Items.Add("Открыть Telegram")
$openBot.Add_Click({ Open-RayBot })
$menu.Items.Add("-") | Out-Null
$exit = $menu.Items.Add("Выход")
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

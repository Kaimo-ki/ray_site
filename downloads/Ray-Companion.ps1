Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "SilentlyContinue"
$appUrl = "https://kaimo-ki.github.io/ray_site/"
$botUrl = "https://t.me/RayPersonai_bot"
$appDir = Join-Path $env:LOCALAPPDATA "RayWeb"
$iconPath = Join-Path $appDir "ray.ico"

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
    Start-Process $botUrl
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
    $label.Text = "Write to Ray. I will copy the text and open the Telegram bot."
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
    $hint.Text = "Direct answers here need Ray API backend. For now Ray answers in Telegram."
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
$form.Size = New-Object System.Drawing.Size(68, 68)
$form.Location = New-Object System.Drawing.Point(40, 220)
$form.TopMost = $true
$form.ShowInTaskbar = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(7, 17, 15)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, 68, 68)
$form.Region = New-Object System.Drawing.Region($path)

$button = New-Object System.Windows.Forms.Label
$button.Text = "R"
$button.Dock = "Fill"
$button.TextAlign = "MiddleCenter"
$button.Font = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Bold)
$button.ForeColor = [System.Drawing.Color]::FromArgb(244, 247, 245)
$button.BackColor = [System.Drawing.Color]::FromArgb(50, 214, 176)
$form.Controls.Add($button)

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
$button.ContextMenuStrip = $menu

$dragging = $false
$dragOffset = New-Object System.Drawing.Point(0, 0)

$button.Add_MouseDown({
    if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $script:dragging = $true
        $script:dragOffset = $_.Location
    }
})

$button.Add_MouseMove({
    if ($script:dragging) {
        $screenPoint = [System.Windows.Forms.Control]::MousePosition
        $form.Location = New-Object System.Drawing.Point(
            ($screenPoint.X - $script:dragOffset.X),
            ($screenPoint.Y - $script:dragOffset.Y)
        )
    }
})

$button.Add_MouseUp({
    $script:dragging = $false
})

$button.Add_DoubleClick({
    Show-ChatWindow
})

[System.Windows.Forms.Application]::EnableVisualStyles()
[void][System.Windows.Forms.Application]::Run($form)

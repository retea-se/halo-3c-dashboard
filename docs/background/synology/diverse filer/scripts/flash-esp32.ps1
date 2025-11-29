<#
.SYNOPSIS
  Bygger och flashar ESP32-firmware i bakgrunden med avisering.

.DESCRIPTION
  Scriptet startar en separat PowerShell-process som kör PlatformIO
  (`pio run ...`). Det gör att din nuvarande terminal inte blockeras.
  När jobbet är klart visas en Windows-avisering och logg skrivs till
  `scripts/logs/`.

.EXAMPLE
  # Flashar standardprojektet (waveshare) mot COM3
  .\scripts\flash-esp32.ps1 -Action upload

.EXAMPLE
  # Endast build, ingen upload, och visa notis
  .\scripts\flash-esp32.ps1 -Action build -Notify

.EXAMPLE
  # Upload med custom projekt och port
  .\scripts\flash-esp32.ps1 -ProjectPath projects\homey\esp32\firmware -Port COM4
#>
[CmdletBinding()]
param(
    [ValidateSet("launch", "worker")]
    [string]$Mode = "launch",

    [ValidateSet("build", "upload", "uploadfs")]
    [string]$Action = "upload",

    [string]$ProjectPath = "projects\waveshare\firmware",

    [string]$Port = "COM3",

    [string]$LogFile,

    [string]$StatusFile,

    [switch]$Notify,

    [switch]$OpenMonitor
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$script:StatusPayload = @{}

function Test-ComPortFree {
    param([string]$Port)

    $serialPort = $null
    try {
        Add-Type -AssemblyName System.IO.Ports | Out-Null
        $serialPort = [System.IO.Ports.SerialPort]::new($Port, 9600, [System.IO.Ports.Parity]::None, 8, [System.IO.Ports.StopBits]::One)
        $serialPort.Open()
        return $true
    }
    catch [System.UnauthorizedAccessException] {
        return $false
    }
    catch [System.IO.IOException] {
        return $false
    }
    finally {
        if ($serialPort) {
            if ($serialPort.IsOpen) {
                $serialPort.Close()
            }
            $serialPort.Dispose()
        }
    }
}

function Force-FreeComPort {
    param(
        [string]$Port,
        [int]$MaxAttempts = 3
    )

    Add-Type -AssemblyName System.IO.Ports | Out-Null
    $availablePorts = [System.IO.Ports.SerialPort]::GetPortNames()
    if ($availablePorts -notcontains $Port) {
        Write-Warning "Port $Port hittas inte på systemet. Hoppar över frigöring."
        return
    }

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        if (Test-ComPortFree -Port $Port) {
            if ($attempt -gt 1) {
                Write-Host "Port $Port är nu ledig." -ForegroundColor Green
            }
            return
        }

        Write-Warning "Port $Port är upptagen (försök $attempt/$MaxAttempts). Försöker stänga handtag..."

        $portPattern = [regex]::Escape($Port)
        $lockingProcesses = @()
        try {
            $lockingProcesses = Get-CimInstance Win32_Process -ErrorAction Stop |
                Where-Object { $_.CommandLine -and $_.CommandLine -match $portPattern }
        }
        catch {
            Write-Warning "Kunde inte enumerera processer med CIM: $_"
        }

        if (-not $lockingProcesses -or $lockingProcesses.Count -eq 0) {
            Write-Warning "Hittade inga processer med kommandorad som matchar $Port. Försöker ändå öppna porten igen..."
        }
        else {
            foreach ($proc in $lockingProcesses) {
                try {
                    Write-Host ("Stoppar {0} (PID {1}) som håller {2}" -f $proc.Name, $proc.ProcessId, $Port) -ForegroundColor Yellow
                    Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
                }
                catch {
                    Write-Warning "Kunde inte stoppa PID $($proc.ProcessId): $_"
                }
            }
        }

        Start-Sleep -Milliseconds 500
    }

    if (-not (Test-ComPortFree -Port $Port)) {
        throw "Kunde inte frigöra $Port efter $MaxAttempts försök. Koppla ur/anslut ESP32 eller stäng portar manuellt."
    }
}

function Resolve-ProjectPath {
    param([string]$Path)
    $resolved = Resolve-Path -Path $Path -ErrorAction SilentlyContinue
    if (-not $resolved) {
        throw "Projektmapp hittades inte: $Path"
    }
    return $resolved.ProviderPath
}

function Ensure-LogPath {
    param([string]$ExistingLogFile)
    $logDir = Join-Path -Path $PSScriptRoot -ChildPath "logs"
    if (-not (Test-Path -Path $logDir)) {
        New-Item -Path $logDir -ItemType Directory | Out-Null
    }

    if ($ExistingLogFile) {
        return $ExistingLogFile
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    return Join-Path -Path $logDir -ChildPath "esp32-flash-$timestamp.log"
}

function Resolve-StatusFile {
    param([string]$ExistingStatusFile)
    $logDir = Join-Path -Path $PSScriptRoot -ChildPath "logs"
    if (-not (Test-Path -Path $logDir)) {
        New-Item -Path $logDir -ItemType Directory | Out-Null
    }

    if ($ExistingStatusFile) {
        $resolved = Resolve-Path -Path $ExistingStatusFile -ErrorAction SilentlyContinue
        if ($resolved) {
            return $resolved.ProviderPath
        }
        return (Join-Path -Path $PSScriptRoot -ChildPath $ExistingStatusFile)
    }

    return Join-Path -Path $logDir -ChildPath "flash-status.json"
}

function Update-StatusFile {
    param(
        [string]$StatusPath,
        [hashtable]$Payload
    )

    if (-not $StatusPath -or -not $Payload) { return }
    $Payload.updatedAt = (Get-Date).ToString("o")
    $json = $Payload | ConvertTo-Json -Depth 5
    Set-Content -Path $StatusPath -Value $json -Encoding UTF8
}

function Initialize-Status {
    param(
        [string]$StatusPath,
        [string]$Action,
        [string]$Project,
        [string]$Port,
        [string]$LogFile
    )

    if (-not $StatusPath) { return }

    $script:StatusPayload = @{
        state     = "running"
        action    = $Action
        project   = $Project
        port      = $Port
        logFile   = $LogFile
        startedAt = (Get-Date).ToString("o")
        updatedAt = (Get-Date).ToString("o")
        lastLine  = "Initierar..."
        exitCode  = $null
    }

    Update-StatusFile -StatusPath $StatusPath -Payload $script:StatusPayload
}

function Set-StatusMessage {
    param(
        [string]$StatusPath,
        [string]$Message
    )

    if (-not $StatusPath -or -not $script:StatusPayload) { return }
    $script:StatusPayload.lastLine = $Message
    Update-StatusFile -StatusPath $StatusPath -Payload $script:StatusPayload
}

function Set-StatusState {
    param(
        [string]$StatusPath,
        [string]$State,
        [int]$ExitCode = $null,
        [string]$Message = $null
    )

    if (-not $StatusPath -or -not $script:StatusPayload) { return }
    $script:StatusPayload.state = $State
    if ($PSBoundParameters.ContainsKey("ExitCode")) {
        $script:StatusPayload.exitCode = $ExitCode
    }
    if ($Message) {
        $script:StatusPayload.lastLine = $Message
    }
    Update-StatusFile -StatusPath $StatusPath -Payload $script:StatusPayload
}

function Start-SerialMonitor {
    param(
        [string]$ProjectPath,
        [string]$Port
    )

    if (-not (Get-Command pio -ErrorAction SilentlyContinue)) {
        Write-Warning "Kan inte starta serial monitor – PlatformIO saknas i PATH."
        return
    }

    $pwsh = (Get-Command pwsh).Source
    $command = "cd `"$ProjectPath`"; pio device monitor --port $Port"
    Start-Process -FilePath $pwsh -ArgumentList "-NoExit", "-NoProfile", "-Command", $command -WorkingDirectory $ProjectPath | Out-Null
    Write-Host "Öppnade ny PowerShell-flik med 'pio device monitor --port $Port'. Stäng den när du vill frigöra porten." -ForegroundColor Cyan
}

function Show-Notification {
    param(
        [string]$Title,
        [string]$Message,
        [ValidateSet("Info", "Error")]
        [string]$Type = "Info"
    )

    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
    } catch {
        Write-Warning "Kunde inte ladda Windows Forms för aviseringar: $_"
        return
    }

    $icon = if ($Type -eq "Error") {
        [System.Drawing.SystemIcons]::Error
    } else {
        [System.Drawing.SystemIcons]::Information
    }

    $notifyIcon = New-Object System.Windows.Forms.NotifyIcon
    $notifyIcon.Icon = $icon
    $notifyIcon.BalloonTipTitle = $Title
    $notifyIcon.BalloonTipText = $Message
    $notifyIcon.Visible = $true
    $notifyIcon.ShowBalloonTip(5000)
    Start-Sleep -Seconds 5
    $notifyIcon.Dispose()
}

function Start-WorkerProcess {
    param(
        [string]$Project,
        [string]$Action,
        [string]$Port,
        [string]$LogFile,
        [string]$StatusFile,
        [switch]$Notify,
        [switch]$OpenMonitor
    )

    $pwsh = (Get-Command pwsh).Source
    $args = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", "`"$PSCommandPath`"",
        "-Mode", "worker",
        "-Action", $Action,
        "-ProjectPath", "`"$Project`"",
        "-Port", $Port,
        "-LogFile", "`"$LogFile`"",
        "-StatusFile", "`"$StatusFile`""
    )

    if ($Notify) { $args += "-Notify" }
    if ($OpenMonitor) { $args += "-OpenMonitor" }

    $process = Start-Process -FilePath $pwsh -ArgumentList $args -WindowStyle Hidden -PassThru
    return $process
}

function Invoke-Worker {
    param(
        [string]$Project,
        [string]$Action,
        [string]$Port,
        [string]$LogFile,
        [string]$StatusFile,
        [switch]$Notify,
        [switch]$OpenMonitor
    )

    $projectPath = Resolve-ProjectPath -Path $Project
    $env:UPLOAD_PORT = $Port
    $env:MONITOR_PORT = $Port
    $env:PLATFORMIO_CALLER = "flash-esp32-script"

    if (-not (Get-Command pio -ErrorAction SilentlyContinue)) {
        throw "PlatformIO (pio) finns inte i PATH. Installera via 'pip install platformio'."
    }

    Force-FreeComPort -Port $Port

    Push-Location -Path $projectPath
    try {
        Initialize-Status -StatusPath $StatusFile -Action $Action -Project $projectPath -Port $Port -LogFile $LogFile

        $arguments = @("run")
        switch ($Action) {
            "upload"   { $arguments += @("--target", "upload") }
            "uploadfs" { $arguments += @("--target", "uploadfs") }
            default    { } # build = standard
        }

        Write-Host "[$(Get-Date -Format T)] Kör: pio $($arguments -join ' ')" -ForegroundColor Cyan
        Write-Host "Logg sparas i: $LogFile" -ForegroundColor Cyan
        if ($StatusFile) {
            Write-Host "Statusfil: $StatusFile" -ForegroundColor Cyan
        }

        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "pio"
        $psi.WorkingDirectory = $projectPath
        foreach ($arg in $arguments) {
            $null = $psi.ArgumentList.Add($arg)
        }
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true

        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $psi

        $logWriter = [System.IO.StreamWriter]::new($LogFile, $false, [System.Text.Encoding]::UTF8)
        $logWriter.AutoFlush = $true

        try {
            $null = $process.Start()

            while (-not $process.HasExited) {
                while (-not $process.StandardOutput.EndOfStream) {
                    $line = $process.StandardOutput.ReadLine()
                    if ($null -ne $line) {
                        $logWriter.WriteLine($line)
                        Set-StatusMessage -StatusPath $StatusFile -Message $line
                    }
                }
                while (-not $process.StandardError.EndOfStream) {
                    $errLine = $process.StandardError.ReadLine()
                    if ($null -ne $errLine) {
                        $logWriter.WriteLine($errLine)
                        Set-StatusMessage -StatusPath $StatusFile -Message $errLine
                    }
                }
                Start-Sleep -Milliseconds 100
            }

            while (-not $process.StandardOutput.EndOfStream) {
                $line = $process.StandardOutput.ReadLine()
                if ($null -ne $line) {
                    $logWriter.WriteLine($line)
                    Set-StatusMessage -StatusPath $StatusFile -Message $line
                }
            }
            while (-not $process.StandardError.EndOfStream) {
                $errLine = $process.StandardError.ReadLine()
                if ($null -ne $errLine) {
                    $logWriter.WriteLine($errLine)
                    Set-StatusMessage -StatusPath $StatusFile -Message $errLine
                }
            }

            $exitCode = $process.ExitCode
        }
        finally {
            $logWriter.Dispose()
            $process.Dispose()
        }

        if ($exitCode -ne 0) {
            $message = "Flash misslyckades (kod $exitCode). Se logg: $LogFile"
            Write-Error $message
            Set-StatusState -StatusPath $StatusFile -State "error" -ExitCode $exitCode -Message $message
            if ($Notify) {
                Show-Notification -Title "ESP32 flash misslyckades" -Message $message -Type Error
            }
            exit $exitCode
        }

        $successMsg = "ESP32 flash klar ($Action). Logg: $LogFile"
        Write-Host $successMsg -ForegroundColor Green
        Set-StatusState -StatusPath $StatusFile -State "success" -ExitCode 0 -Message $successMsg
        if ($Notify) {
            Show-Notification -Title "ESP32 flash klar" -Message $successMsg -Type Info
        }
        if ($OpenMonitor -and $Action -eq "upload") {
            Start-SerialMonitor -ProjectPath $projectPath -Port $Port
        }
    }
    finally {
        Pop-Location
    }
}

switch ($Mode) {
    "launch" {
        $logFilePath = Ensure-LogPath -ExistingLogFile $LogFile
        $statusPath = Resolve-StatusFile -ExistingStatusFile $StatusFile
        $process = Start-WorkerProcess -Project $ProjectPath -Action $Action -Port $Port -LogFile $logFilePath -StatusFile $statusPath -Notify:$Notify -OpenMonitor:$OpenMonitor
        Write-Host "Startade bakgrundsflash (PID $($process.Id))." -ForegroundColor Green
        Write-Host "Logg: $logFilePath" -ForegroundColor Yellow
        if ($statusPath) {
            Write-Host "Status: $statusPath" -ForegroundColor Yellow
        }
        Write-Host "Avisering skickas när jobbet är klart." -ForegroundColor Cyan
    }
    "worker" {
        if (-not $LogFile) {
            throw "Worker-läge kräver -LogFile."
        }
        Invoke-Worker -Project $ProjectPath -Action $Action -Port $Port -LogFile $LogFile -StatusFile $StatusFile -Notify:$Notify -OpenMonitor:$OpenMonitor
    }
    default {
        throw "Okänt Mode: $Mode"
    }
}


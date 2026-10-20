Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Dell\.gemini\antigravity\brain\c83c4253-f874-4be4-955b-0c243a866ecb\.user_uploaded\media_1792519097115_8c0c3f60.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

function Resize-Image($srcImg, $width, $height, $destPath) {
    $dest = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($dest)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($srcImg, 0, 0, $width, $height)
    $graphics.Dispose()
    
    $parent = Split-Path $destPath
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    if (Test-Path $destPath) { Remove-Item $destPath -Force }
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Created: $destPath ($width x $height)"
}

# Web Icons
Resize-Image $src 192 192 "public\icon-192.png"
Resize-Image $src 512 512 "public\icon-512.png"
Resize-Image $src 512 512 "public\logo.png"

# Android Launcher Icons (Legacy & Round)
Resize-Image $src 48 48 "android\app\src\main\res\mipmap-mdpi\ic_launcher.png"
Resize-Image $src 48 48 "android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png"

Resize-Image $src 72 72 "android\app\src\main\res\mipmap-hdpi\ic_launcher.png"
Resize-Image $src 72 72 "android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png"

Resize-Image $src 96 96 "android\app\src\main\res\mipmap-xhdpi\ic_launcher.png"
Resize-Image $src 96 96 "android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png"

Resize-Image $src 144 144 "android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png"
Resize-Image $src 144 144 "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png"

Resize-Image $src 192 192 "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"
Resize-Image $src 192 192 "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png"

# Android Adaptive Foreground Icons (108dp base grid: mdpi=108, hdpi=162, xhdpi=216, xxhdpi=324, xxxhdpi=432)
Resize-Image $src 108 108 "android\app\src\main\res\mipmap-mdpi\ic_launcher_foreground.png"
Resize-Image $src 162 162 "android\app\src\main\res\mipmap-hdpi\ic_launcher_foreground.png"
Resize-Image $src 216 216 "android\app\src\main\res\mipmap-xhdpi\ic_launcher_foreground.png"
Resize-Image $src 324 324 "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_foreground.png"
Resize-Image $src 432 432 "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_foreground.png"

# Android Splash screen
Resize-Image $src 480 800 "android\app\src\main\res\drawable-port-mdpi\splash.png"
Resize-Image $src 800 1280 "android\app\src\main\res\drawable-port-hdpi\splash.png"
Resize-Image $src 960 1600 "android\app\src\main\res\drawable-port-xhdpi\splash.png"
Resize-Image $src 1280 1920 "android\app\src\main\res\drawable-port-xxhdpi\splash.png"
Resize-Image $src 1440 2560 "android\app\src\main\res\drawable-port-xxxhdpi\splash.png"
Resize-Image $src 512 512 "android\app\src\main\res\drawable\splash.png"

$src.Dispose()
Write-Host "All icons generated successfully!"

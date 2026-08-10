Add-Type -AssemblyName System.Drawing
$width = 500
$height = 500
$bmp = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::White)

# 1. Dark Gray Circular Border
$penBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 110, 110, 110)), 14
$g.DrawEllipse($penBorder, 15, 15, 470, 470)

$brushMaroon = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 136, 16, 28))

# 2. Head (Tilted Ellipse)
$g.TranslateTransform(250, 140)
$g.RotateTransform(-8)
$g.FillEllipse($brushMaroon, -35, -22, 70, 44)
$g.ResetTransform()

# 3. Body Path (Outstretched Arms & Legs)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath

# Top Left Arm
$path.AddBezier(250, 185, 220, 180, 180, 140, 162, 105)
$path.AddBezier(162, 105, 168, 120, 195, 175, 230, 205)

# Bottom Left Leg
$path.AddBezier(230, 205, 195, 230, 165, 260, 146, 300)
$path.AddBezier(146, 300, 162, 285, 210, 235, 242, 218)

# Bottom Right Leg
$path.AddBezier(242, 218, 275, 235, 323, 285, 339, 300)
$path.AddBezier(339, 300, 320, 260, 290, 230, 255, 205)

# Top Right Arm
$path.AddBezier(255, 205, 290, 175, 317, 120, 323, 105)
$path.AddBezier(323, 105, 305, 140, 265, 180, 250, 185)

$g.FillPath($brushMaroon, $path)

# 4. Text Below Symbol
$fontHeader = New-Object System.Drawing.Font('Arial', 24, [System.Drawing.FontStyle]::Bold)
$fontSub = New-Object System.Drawing.Font('Arial', 18, [System.Drawing.FontStyle]::Regular)

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center

$g.DrawString("Rajiv Gandhi University", $fontHeader, $brushMaroon, 250, 315, $sf)
$g.DrawString("of Knowledge Technologies", $fontSub, $brushMaroon, 250, 360, $sf)

$outputPathPng = "C:\Users\Abhi\.gemini\antigravity\scratch\rgukt-academic-calculator\assets\rgukt-logo.png"
$bmp.Save($outputPathPng, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
Write-Host "PNG logo generated at $outputPathPng"

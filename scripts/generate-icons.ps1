Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\icons'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-RoundedRectPath {
  param([float]$x, [float]$y, [float]$w, [float]$h, [float]$r)
  $d = 2 * $r
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function New-MasterIcon {
  $S = 512
  $bmp = New-Object System.Drawing.Bitmap $S, $S
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  $bgPath = New-RoundedRectPath 4 4 504 504 116
  $bgRect = New-Object System.Drawing.RectangleF(0, 0, $S, $S)
  $c1 = [System.Drawing.ColorTranslator]::FromHtml('#7c3aed')
  $c2 = [System.Drawing.ColorTranslator]::FromHtml('#2563eb')
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, $c1, $c2, 45)
  $g.FillPath($brush, $bgPath)

  $glass = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(44, 255, 255, 255), 5)
  $g.DrawPath($glass, $bgPath)

  $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(26, 255, 255, 255))
  $g.FillEllipse($glowBrush, 238 - 85, 408 - 85, 170, 170)

  $tube = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 30)
  $tube.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $tube.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $tube.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $curve = New-Object System.Drawing.Drawing2D.GraphicsPath
  $curve.AddBezier(128, 148, 215, 150, 300, 215, 352, 258)
  $curve.AddBezier(352, 258, 405, 300, 330, 360, 238, 408)
  $g.DrawPath($tube, $curve)

  $spur = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 16)
  $spur.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $spur.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($spur, 352, 258, 452, 190)

  $nodeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $g.FillEllipse($nodeBrush, 128 - 30, 148 - 30, 60, 60)
  $g.FillEllipse($nodeBrush, 352 - 30, 258 - 30, 60, 60)
  $g.FillEllipse($nodeBrush, 452 - 15, 190 - 15, 30, 30)
  $g.FillEllipse($nodeBrush, 238 - 32, 408 - 32, 64, 64)

  $ring = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#f5cc57'), 9)
  $ringInner = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#f5cc57'), 7)
  $g.DrawEllipse($ring, 238 - 48, 408 - 48, 96, 96)
  $g.DrawEllipse($ringInner, 238 - 36, 408 - 36, 72, 72)

  $g.Dispose()
  $brush.Dispose()
  $glass.Dispose()
  $tube.Dispose()
  $spur.Dispose()
  $nodeBrush.Dispose()
  $glowBrush.Dispose()
  $ring.Dispose()
  $ringInner.Dispose()
  $curve.Dispose()
  $bgPath.Dispose()
  return $bmp
}

$master = New-MasterIcon
$sizes = @(16, 32, 48, 128)
foreach ($size in $sizes) {
  $out = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($master, 0, 0, $size, $size)
  $path = Join-Path $outDir ("icon{0}.png" -f $size)
  $out.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $out.Dispose()
  Write-Host "OK $path"
}
$master.Dispose()
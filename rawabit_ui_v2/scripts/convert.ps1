# Rawabit v2 - GeoJSON to SVG Path Data Converter (PowerShell)
# Converts Algeria wilaya boundaries to SVG path data ES module

$InputPath  = "C:\Users\WDAGUtilityAccount\Documents\RAWABIT-main\app\assets\wilayas-Bv3Ezlc4.geojson"
$OutputPath = "C:\Users\WDAGUtilityAccount\Documents\RAWABIT-main\rawabit_ui_v2\js\components\map-paths.js"

Write-Host "Reading GeoJSON..."
$raw = [System.IO.File]::ReadAllText($InputPath)
$geo = $raw | ConvertFrom-Json

$gMinX = [double]::MaxValue; $gMaxX = [double]::MinValue
$gMinY = [double]::MaxValue; $gMaxY = [double]::MinValue

function Round2([double]$n) { return [Math]::Round($n, 2) }

function Convert-RingToSVG($ring) {
    $sb = New-Object System.Text.StringBuilder
    for ($i = 0; $i -lt $ring.Count; $i++) {
        $lng = $ring[$i][0]
        $lat = $ring[$i][1]
        $x = Round2 $lng
        $y = Round2 (-$lat)
        if ($x -lt $script:gMinX) { $script:gMinX = $x }
        if ($x -gt $script:gMaxX) { $script:gMaxX = $x }
        if ($y -lt $script:gMinY) { $script:gMinY = $y }
        if ($y -gt $script:gMaxY) { $script:gMaxY = $y }
        if ($i -eq 0) { [void]$sb.Append("M$x,$y") }
        else          { [void]$sb.Append("L$x,$y") }
    }
    [void]$sb.Append("Z")
    return $sb.ToString()
}

Write-Host "Processing $($geo.features.Count) features..."

$results = New-Object System.Collections.ArrayList

foreach ($feature in $geo.features) {
    $props = $feature.properties
    $coords = $feature.geometry.coordinates

    # Build SVG path
    $pathSB = New-Object System.Text.StringBuilder
    $sumX = 0.0; $sumY = 0.0; $count = 0
    $bx1 = [double]::MaxValue; $bx2 = [double]::MinValue
    $by1 = [double]::MaxValue; $by2 = [double]::MinValue

    foreach ($polygon in $coords) {
        foreach ($ring in $polygon) {
            $segment = Convert-RingToSVG $ring
            [void]$pathSB.Append($segment)
        }
        # Centroid + bbox from exterior ring
        $exterior = $polygon[0]
        foreach ($pt in $exterior) {
            $sumX += $pt[0]
            $sumY += (-$pt[1])
            $count++
            if ($pt[0] -lt $bx1) { $bx1 = $pt[0] }
            if ($pt[0] -gt $bx2) { $bx2 = $pt[0] }
            $yval = -$pt[1]
            if ($yval -lt $by1) { $by1 = $yval }
            if ($yval -gt $by2) { $by2 = $yval }
        }
    }

    $d = $pathSB.ToString()
    $cx = Round2 ($sumX / $count)
    $cy = Round2 ($sumY / $count)
    $w = Round2 ($bx2 - $bx1)
    $h = Round2 ($by2 - $by1)
    $area = Round2 ($w * $h)
    $rawLS = [Math]::Sqrt($w * $h) * 0.15
    $labelSize = Round2 ([Math]::Max(0.18, [Math]::Min(1.0, $rawLS)))

    $code  = if ($props.code)   { $props.code }   else { "" }
    $name  = if ($props.name)   { $props.name }   elseif ($props.NAME_1) { $props.NAME_1 } else { "" }
    $nameAr = if ($props.nameAr) { $props.nameAr } else { "" }

    # Escape for JSON
    $nameEsc = $name -replace '\\', '\\\\' -replace '"', '\"'
    $nameArEsc = $nameAr -replace '\\', '\\\\' -replace '"', '\"'
    $dEsc = $d -replace '\\', '\\\\' -replace '"', '\"'

    $json = "{`"code`":`"$code`",`"name`":`"$nameEsc`",`"nameAr`":`"$nameArEsc`",`"cx`":$cx,`"cy`":$cy,`"labelSize`":$labelSize,`"area`":$area,`"d`":`"$dEsc`"}"
    [void]$results.Add($json)
}

# ViewBox
$pad = 0.5
$vbX = Round2 ($gMinX - $pad)
$vbY = Round2 ($gMinY - $pad)
$vbW = Round2 ($gMaxX - $gMinX + $pad * 2)
$vbH = Round2 ($gMaxY - $gMinY + $pad * 2)
$viewBox = "$vbX $vbY $vbW $vbH"

# Build output
$outSB = New-Object System.Text.StringBuilder
[void]$outSB.AppendLine("// Auto-generated from wilayas GeoJSON - do not edit manually")
[void]$outSB.AppendLine("export const MAP_VIEWBOX = '$viewBox';")
[void]$outSB.AppendLine("")
[void]$outSB.AppendLine("export const WILAYAS = [")
for ($i = 0; $i -lt $results.Count; $i++) {
    $comma = if ($i -lt $results.Count - 1) { "," } else { "" }
    [void]$outSB.AppendLine("  $($results[$i])$comma")
}
[void]$outSB.AppendLine("];")

# Write
$outDir = [System.IO.Path]::GetDirectoryName($OutputPath)
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
[System.IO.File]::WriteAllText($OutputPath, $outSB.ToString(), [System.Text.UTF8Encoding]::new($false))

$sizeKB = [Math]::Round($outSB.Length / 1024, 1)
Write-Host "Done: $($results.Count) wilayas -> $sizeKB KB"
Write-Host "ViewBox: $viewBox"
Write-Host "Output: $OutputPath"

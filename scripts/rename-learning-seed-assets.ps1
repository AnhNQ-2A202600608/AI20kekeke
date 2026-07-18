param(
  [string]$AssetDir = "frontend/public/learning-seeds"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$targetDir = Resolve-Path (Join-Path $repoRoot $AssetDir)

if (-not $targetDir.Path.StartsWith($repoRoot.Path, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to rename outside repo root: $($targetDir.Path)"
}

$renameMap = @{
  "soil-locked" = "seed-locked"
  "soil-empty" = "seed-empty"
  "soil-early" = "seed-early"
  "soil-learning" = "seed-learning"
  "soil-growing" = "seed-growing"
  "soil-strong" = "seed-strong"
  "soil-mastered" = "seed-mastered"
  "soil-review" = "seed-review"
}

foreach ($entry in $renameMap.GetEnumerator()) {
  foreach ($extension in @(".png", ".webp")) {
    $source = Join-Path $targetDir.Path "$($entry.Key)$extension"
    $destination = Join-Path $targetDir.Path "$($entry.Value)$extension"

    if ((Test-Path -LiteralPath $source) -and (Test-Path -LiteralPath $destination)) {
      throw "Destination already exists: $destination"
    }

    if (Test-Path -LiteralPath $source) {
      Move-Item -LiteralPath $source -Destination $destination
      Write-Host "Renamed $($entry.Key)$extension -> $($entry.Value)$extension"
    }
  }
}

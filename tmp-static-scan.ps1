$ErrorActionPreference = 'Stop'

$root = Join-Path $PWD 'src'
$files = Get-ChildItem -Path $root -Recurse -File | Where-Object { $_.Extension -in '.ts', '.tsx', '.json' }
$codeFiles = $files | Where-Object { $_.Extension -in '.ts', '.tsx' }

$inbound = @{}
foreach ($f in $codeFiles) {
  $rel = $f.FullName.Substring($PWD.Path.Length + 1) -replace '\\', '/'
  if (-not $inbound.ContainsKey($rel)) { $inbound[$rel] = New-Object System.Collections.Generic.List[string] }
}

function Resolve-Spec {
  param(
    [string]$fromPath,
    [string]$spec
  )

  if ($spec.StartsWith('.')) {
    $baseDir = Split-Path $fromPath -Parent
    $joined = [System.IO.Path]::GetFullPath((Join-Path $baseDir $spec))
    $cands = @(
      $joined,
      "$joined.ts",
      "$joined.tsx",
      "$joined.json",
      (Join-Path $joined 'index.ts'),
      (Join-Path $joined 'index.tsx')
    )
    foreach ($c in $cands) {
      if (Test-Path $c) { return $c }
    }
  }

  return $null
}

$importRegex = [regex]"(?m)^\s*(?:import\s+.+?from\s+['\"]([^'\"]+)['\"]|import\s*['\"]([^'\"]+)['\"]|export\s+.+?from\s+['\"]([^'\"]+)['\"])"
foreach ($f in $codeFiles) {
  $content = Get-Content -Raw -Path $f.FullName
  $matches = $importRegex.Matches($content)
  foreach ($m in $matches) {
    $spec = $m.Groups[1].Value
    if (-not $spec) { $spec = $m.Groups[2].Value }
    if (-not $spec) { $spec = $m.Groups[3].Value }
    if (-not $spec) { continue }

    $targetAbs = Resolve-Spec -fromPath $f.FullName -spec $spec
    if ($targetAbs -and $targetAbs.StartsWith($root)) {
      $targetRel = $targetAbs.Substring($PWD.Path.Length + 1) -replace '\\', '/'
      if (-not $inbound.ContainsKey($targetRel)) { $inbound[$targetRel] = New-Object System.Collections.Generic.List[string] }

      $srcRel = $f.FullName.Substring($PWD.Path.Length + 1) -replace '\\', '/'
      if (-not $inbound[$targetRel].Contains($srcRel)) { $inbound[$targetRel].Add($srcRel) }
    }
  }
}

$exclude = @('src/main.tsx', 'src/App.tsx', 'src/i18n.ts')
$unref = @()
foreach ($f in $codeFiles) {
  $rel = $f.FullName.Substring($PWD.Path.Length + 1) -replace '\\', '/'
  if ($exclude -contains $rel) { continue }
  if ($rel -like 'src/types/*') { continue }
  if (-not $inbound.ContainsKey($rel) -or $inbound[$rel].Count -eq 0) {
    $unref += [pscustomobject]@{ file = $rel; inbound = @() }
  }
}

$exports = @()
$exportRegex = [regex]'(?m)^\s*export\s+(?:const|let|var|function)\s+([A-Za-z_][A-Za-z0-9_]*)'
foreach ($f in $codeFiles) {
  $rel = $f.FullName.Substring($PWD.Path.Length + 1) -replace '\\', '/'
  $content = Get-Content -Raw -Path $f.FullName
  foreach ($m in $exportRegex.Matches($content)) {
    $exports += [pscustomobject]@{ file = $rel; symbol = $m.Groups[1].Value }
  }
}

$unusedExports = @()
foreach ($e in $exports) {
  $refs = New-Object System.Collections.Generic.List[string]
  $pattern = "\b" + [regex]::Escape($e.symbol) + "\b"
  foreach ($f in $codeFiles) {
    $rel = $f.FullName.Substring($PWD.Path.Length + 1) -replace '\\', '/'
    if ($rel -eq $e.file) { continue }

    $content = Get-Content -Raw -Path $f.FullName
    if ([regex]::IsMatch($content, $pattern)) {
      $refs.Add($rel)
    }
  }

  if ($refs.Count -eq 0) {
    $unusedExports += [pscustomobject]@{ file = $e.file; symbol = $e.symbol; refs = @() }
  }
}

$jsonInbound = @()
foreach ($jf in ($files | Where-Object { $_.Extension -eq '.json' })) {
  $rel = $jf.FullName.Substring($PWD.Path.Length + 1) -replace '\\', '/'
  $refs = @()
  if ($inbound.ContainsKey($rel)) { $refs = $inbound[$rel] }
  $jsonInbound += [pscustomobject]@{ file = $rel; inbound = $refs }
}

$result = [pscustomobject]@{
  unreferencedFiles = $unref | Sort-Object file
  unusedExports = $unusedExports | Sort-Object file, symbol
  jsonInbound = $jsonInbound | Sort-Object file
}

$result | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $PWD 'tmp-static-scan-result.json') -Encoding UTF8
Write-Output 'SCAN_DONE'

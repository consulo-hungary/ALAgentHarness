<#
.SYNOPSIS
  Local, free replacement for object-ID services: indexes every AL object and field of a workspace.

.DESCRIPTION
  Parses all .al files and app.json files under -WorkspaceRoot (no network, no subscription) and
  writes one master JSON (default docs/knowledge/object-index.json): apps with idRanges, objects,
  fields, enum values, ID usage per app/type and detected issues. One object per line, so the file
  is cheap to grep and to diff.

  Modes:
    (default)               refresh the index
    -Report                 also write a markdown object-ID report to docs/generated/reviews/
    -NextId <type> [-Count] print free object IDs of that type inside the app's idRanges
    -NextMemberId <name>    print free field (or -MemberKind value) IDs for a table/enum or its extensions

  Printed IDs are NOT reserved: write the object first, or request -Count IDs in one call.
  Works on Windows PowerShell 5.1 and PowerShell 7.

.EXAMPLE
  powershell -NoProfile -File Get-ALObjectIndex.ps1 -WorkspaceRoot C:\repo
  powershell -NoProfile -File Get-ALObjectIndex.ps1 -WorkspaceRoot C:\repo -NextId codeunit -Count 2
  powershell -NoProfile -File Get-ALObjectIndex.ps1 -WorkspaceRoot C:\repo -NextMemberId Customer
#>
[CmdletBinding()]
param(
    [string]$WorkspaceRoot = (Get-Location).Path,
    [string]$OutFile,
    [switch]$Report,
    [string]$NextId,
    [string]$NextMemberId,
    [ValidateSet('field', 'value')][string]$MemberKind = 'field',
    [int]$Count = 1,
    [string]$App
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $WorkspaceRoot).Path.TrimEnd('\', '/')
if (-not $OutFile) { $OutFile = Join-Path $root 'docs/knowledge/object-index.json' }
$skipDirs = @('.alpackages', '.snapshots', '.alcache', 'node_modules', '.git', 'docs', 'rules')
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Get-Rel([string]$full) {
    if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { return $full }
    return ($full.Substring($root.Length).TrimStart('\', '/') -replace '\\', '/')
}

function Find-Files([string]$dir, [System.Collections.Generic.List[string]]$found) {
    foreach ($d in [System.IO.Directory]::GetDirectories($dir)) {
        if ($skipDirs -contains ([System.IO.Path]::GetFileName($d)).ToLowerInvariant()) { continue }
        Find-Files $d $found
    }
    foreach ($f in [System.IO.Directory]::GetFiles($dir)) {
        $name = [System.IO.Path]::GetFileName($f)
        if ($name -ieq 'app.json' -or $name.EndsWith('.al', [StringComparison]::OrdinalIgnoreCase)) { $found.Add($f) }
    }
}

function Read-Json([string]$file) {
    try { return (([System.IO.File]::ReadAllText($file)).TrimStart([char]0xFEFF) | ConvertFrom-Json) } catch { return $null }
}

# ---- apps ---------------------------------------------------------------------------------
$files = New-Object 'System.Collections.Generic.List[string]'
Find-Files $root $files
$apps = @()
foreach ($f in ($files | Where-Object { [System.IO.Path]::GetFileName($_) -ieq 'app.json' })) {
    $j = Read-Json $f
    if (-not $j) { Write-Warning "Unreadable app.json: $(Get-Rel $f)"; continue }
    $dir = [System.IO.Path]::GetDirectoryName($f)
    $ranges = @()
    if ($j.idRanges) { foreach ($r in $j.idRanges) { $ranges += [ordered]@{ from = [int]$r.from; to = [int]$r.to } } }
    elseif ($j.idRange) { $ranges += [ordered]@{ from = [int]$j.idRange.from; to = [int]$j.idRange.to } }
    $cop = Read-Json (Join-Path $dir 'AppSourceCop.json')
    $affixes = @()
    if ($cop) {
        foreach ($p in 'mandatoryAffixes') { if ($cop.$p) { $affixes += @($cop.$p) } }
        foreach ($p in 'mandatoryPrefix', 'mandatorySuffix') { if ($cop.$p) { $affixes += [string]$cop.$p } }
    }
    $rel = Get-Rel $dir
    $apps += [pscustomobject]@{
        Dir = $dir; Rel = $(if ($rel) { $rel } else { '.' }); Id = $j.id; Name = $j.name; Publisher = $j.publisher
        Version = $j.version; Application = $j.application; Runtime = $j.runtime; Ranges = $ranges
        Affixes = @($affixes | Where-Object { $_ }); Dependencies = @($j.dependencies | ForEach-Object { $_.name } | Where-Object { $_ })
    }
}
if (-not $apps) { throw "No app.json found under $root" }
$apps = @($apps | Sort-Object { $_.Rel })

function Get-OwnerApp([string]$file) {
    $best = $null
    foreach ($a in $apps) {
        $prefix = $a.Dir.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
        if ($file.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
            if (-not $best -or $a.Dir.Length -gt $best.Dir.Length) { $best = $a }
        }
    }
    return $best
}

# ---- parse AL -----------------------------------------------------------------------------
$noise = New-Object System.Text.RegularExpressions.Regex(
    "'(?:[^'\r\n]|'')*'|`"[^`"\r\n]*`"|//[^\r\n]*|/\*[\s\S]*?\*/", 'Compiled')
$blank = [System.Text.RegularExpressions.MatchEvaluator] {
    param($m)
    $v = $m.Value
    if ($v.StartsWith('//') -or $v.StartsWith('/*')) { return [regex]::Replace($v, '[^\r\n]', ' ') }
    return $v
}
$name = '("[^"\r\n]+"|[A-Za-z_][A-Za-z0-9_]*)'
$idDecl = [regex]('(?im)^[ \t]*(table|tableextension|page|pageextension|codeunit|report|reportextension|query|xmlport|enum|enumextension|permissionset|permissionsetextension|entitlement)[ \t]+(\d+)[ \t]+' + $name + '(?:[ \t]+(extends|implements)[ \t]+' + $name + ')?')
$noIdDecl = [regex]('(?im)^[ \t]*(interface|controladdin|profile|pagecustomization)[ \t]+' + $name)
$fieldRx = [regex]('(?i)(?<![\w.])field\(\s*(\d+)\s*;\s*' + $name + '\s*;\s*([^;\)]+?)\s*[;\)]')
$valueRx = [regex]('(?i)(?<![\w.])value\(\s*(\d+)\s*;\s*' + $name + '\s*[;\)]')

function Get-LineAt([string]$text, [int]$from, [int]$to, [int]$line) {
    $i = $text.IndexOf("`n", $from)
    while ($i -ge 0 -and $i -lt $to) { $line++; $i = $text.IndexOf("`n", $i + 1) }
    return $line
}

$objects = New-Object System.Collections.Generic.List[object]
$fileObjectCount = @{}
foreach ($f in ($files | Where-Object { $_.EndsWith('.al', [StringComparison]::OrdinalIgnoreCase) })) {
    $owner = Get-OwnerApp $f
    if (-not $owner) { continue }
    $text = $noise.Replace(([System.IO.File]::ReadAllText($f)), $blank)
    $decls = New-Object System.Collections.Generic.List[object]
    foreach ($m in $idDecl.Matches($text)) {
        $decls.Add([pscustomobject]@{ Index = $m.Index; Type = $m.Groups[1].Value.ToLowerInvariant(); Id = [int]$m.Groups[2].Value
            Name = $m.Groups[3].Value.Trim('"'); Extends = $(if ($m.Groups[4].Value -ieq 'extends') { $m.Groups[5].Value.Trim('"') } else { $null }) })
    }
    foreach ($m in $noIdDecl.Matches($text)) {
        $decls.Add([pscustomobject]@{ Index = $m.Index; Type = $m.Groups[1].Value.ToLowerInvariant(); Id = $null
            Name = $m.Groups[2].Value.Trim('"'); Extends = $null })
    }
    $sorted = @($decls | Sort-Object Index)
    $fileObjectCount[$f] = $sorted.Count
    $line = 1; $pos = 0
    for ($i = 0; $i -lt $sorted.Count; $i++) {
        $d = $sorted[$i]
        $end = if ($i + 1 -lt $sorted.Count) { $sorted[$i + 1].Index } else { $text.Length }
        $line = Get-LineAt $text $pos $d.Index $line; $pos = $d.Index
        $members = @(); $values = @()
        if ($d.Type -in 'table', 'tableextension') {
            foreach ($m in $fieldRx.Matches($text.Substring($d.Index, $end - $d.Index))) {
                $members += [ordered]@{ id = [int]$m.Groups[1].Value; name = $m.Groups[2].Value.Trim('"'); type = ($m.Groups[3].Value -replace '\s+', ' ').Trim() }
            }
        }
        if ($d.Type -in 'enum', 'enumextension') {
            foreach ($m in $valueRx.Matches($text.Substring($d.Index, $end - $d.Index))) {
                $values += [ordered]@{ id = [int]$m.Groups[1].Value; name = $m.Groups[2].Value.Trim('"') }
            }
        }
        $objects.Add([pscustomobject]@{ Type = $d.Type; Id = $d.Id; Name = $d.Name; App = $owner.Rel; File = (Get-Rel $f); Line = $line
            Extends = $d.Extends; Fields = $members; Values = $values; FilePath = $f })
    }
}

# ---- ID usage and issues ------------------------------------------------------------------
$issues = New-Object System.Collections.Generic.List[object]
function Add-Issue($severity, $code, $message, $o) {
    $issues.Add([ordered]@{ severity = $severity; code = $code; message = $message; app = $o.App; type = $o.Type; id = $o.Id; file = $o.File; line = $o.Line })
}
function In-Ranges($ranges, [int]$id) { foreach ($r in $ranges) { if ($id -ge $r.from -and $id -le $r.to) { return $true } }; return $false }
function Compress-Ids($ids) {
    $out = @(); $sorted = @($ids | Sort-Object); $i = 0
    while ($i -lt $sorted.Count) {
        $j = $i
        while ($j + 1 -lt $sorted.Count -and $sorted[$j + 1] -eq $sorted[$j] + 1) { $j++ }
        $out += $(if ($j -gt $i) { "$($sorted[$i])-$($sorted[$j])" } else { "$($sorted[$i])" })
        $i = $j + 1
    }
    return $out
}
function Get-FreeBlocks($ranges, $usedSet) {
    $blocks = @()
    foreach ($r in $ranges) {
        $start = $null
        for ($id = $r.from; $id -le $r.to; $id++) {
            if ($usedSet.Contains($id)) { if ($null -ne $start) { $blocks += [ordered]@{ from = $start; to = $id - 1 }; $start = $null } }
            elseif ($null -eq $start) { $start = $id }
        }
        if ($null -ne $start) { $blocks += [ordered]@{ from = $start; to = $r.to } }
    }
    return $blocks
}

foreach ($g in ($objects | Where-Object { $null -ne $_.Id } | Group-Object { "$($_.Type)|$($_.Id)" } | Where-Object { $_.Count -gt 1 })) {
    foreach ($o in $g.Group) { Add-Issue 'error' 'duplicate-id' "$($o.Type) $($o.Id) is declared $($g.Count) times" $o }
}
foreach ($g in ($objects | Group-Object { "$($_.App)|$($_.Type)|$($_.Name.ToLowerInvariant())" } | Where-Object { $_.Count -gt 1 })) {
    foreach ($o in $g.Group) { Add-Issue 'warning' 'duplicate-name' "$($o.Type) name '$($o.Name)' is used $($g.Count) times in the app" $o }
}
foreach ($o in $objects) {
    $a = $apps | Where-Object { $_.Rel -eq $o.App } | Select-Object -First 1
    if ($null -ne $o.Id -and $a.Ranges.Count -gt 0 -and -not (In-Ranges $a.Ranges $o.Id)) {
        Add-Issue 'error' 'out-of-range' "$($o.Type) $($o.Id) is outside the idRanges of app.json" $o
    }
    foreach ($m in @($o.Fields) + @($o.Values)) {
        if ($o.Type -in 'tableextension', 'enumextension' -and $a.Ranges.Count -gt 0 -and -not (In-Ranges $a.Ranges $m.id)) {
            Add-Issue 'error' 'member-out-of-range' "$($o.Type) '$($o.Name)': member $($m.id) '$($m.name)' is outside the idRanges" $o
        }
        if ($a.Affixes.Count -gt 0 -and $o.Type -eq 'tableextension') {
            $hit = $false; foreach ($x in $a.Affixes) { if ($m.name.StartsWith($x, 'OrdinalIgnoreCase') -or $m.name.EndsWith($x, 'OrdinalIgnoreCase')) { $hit = $true } }
            if (-not $hit) { Add-Issue 'warning' 'missing-affix' "Field '$($m.name)' of tableextension '$($o.Name)' lacks the mandatory affix ($($a.Affixes -join ', '))" $o }
        }
    }
    foreach ($g in (@($o.Fields) + @($o.Values) | Group-Object { $_.id } | Where-Object { $_.Count -gt 1 })) {
        Add-Issue 'error' 'duplicate-member-id' "$($o.Type) '$($o.Name)': member ID $($g.Name) is used $($g.Count) times" $o
    }
    if ($a.Affixes.Count -gt 0) {
        $hit = $false; foreach ($x in $a.Affixes) { if ($o.Name.StartsWith($x, 'OrdinalIgnoreCase') -or $o.Name.EndsWith($x, 'OrdinalIgnoreCase')) { $hit = $true } }
        if (-not $hit) { Add-Issue 'warning' 'missing-affix' "$($o.Type) '$($o.Name)' lacks the mandatory affix ($($a.Affixes -join ', '))" $o }
    }
}
foreach ($k in $fileObjectCount.Keys) {
    if ($fileObjectCount[$k] -gt 1) {
        $first = $objects | Where-Object { $_.FilePath -eq $k } | Select-Object -First 1
        Add-Issue 'warning' 'multi-object-file' "$($fileObjectCount[$k]) objects in one file (single-object-per-file rule)" $first
    }
}
$extGroups = $objects | Where-Object { $_.Type -in 'tableextension', 'enumextension' -and $_.Extends } | Group-Object { "$($_.Type)|$($_.Extends.ToLowerInvariant())" }
foreach ($g in $extGroups) {
    $ids = @{}
    foreach ($o in $g.Group) { foreach ($m in @($o.Fields) + @($o.Values)) { if (-not $ids.ContainsKey($m.id)) { $ids[$m.id] = @() }; $ids[$m.id] += $o } }
    foreach ($id in $ids.Keys) {
        $owners = @($ids[$id] | Select-Object -Unique)
        if ($owners.Count -gt 1) { Add-Issue 'error' 'duplicate-member-across-extensions' "Member ID $id is used by $($owners.Count) extensions of '$($owners[0].Extends)': $(($owners | ForEach-Object { $_.Name }) -join ', ')" $owners[0] }
    }
}

$usage = @()
foreach ($a in $apps) {
    foreach ($tg in ($objects | Where-Object { $_.App -eq $a.Rel -and $null -ne $_.Id } | Group-Object Type | Sort-Object Name)) {
        $ids = @($tg.Group | ForEach-Object { $_.Id } | Sort-Object)
        $all = New-Object 'System.Collections.Generic.HashSet[int]'
        foreach ($x in ($objects | Where-Object { $_.Type -eq $tg.Name -and $null -ne $_.Id })) { [void]$all.Add([int]$x.Id) }
        $free = @(Get-FreeBlocks $a.Ranges $all)
        $usage += [ordered]@{ app = $a.Rel; type = $tg.Name; count = $ids.Count; used = @(Compress-Ids $ids)
            nextFree = $(if ($free.Count) { $free[0].from } else { $null }); freeBlocks = @($free | Select-Object -First 12) }
    }
}

# ---- query modes --------------------------------------------------------------------------
function Select-App {
    if ($App) {
        $hit = @($apps | Where-Object { $_.Rel -ieq $App -or $_.Name -ieq $App })
        if ($hit.Count -ne 1) { throw "-App '$App' does not match exactly one app: $(($apps | ForEach-Object { $_.Rel }) -join ', ')" }
        return $hit[0]
    }
    if ($apps.Count -eq 1) { return $apps[0] }
    $main = @($apps | Where-Object { $_.Rel -ieq 'app' })
    if ($main.Count -eq 1) { return $main[0] }
    throw "Several apps found; pass -App <folder or name>: $(($apps | ForEach-Object { $_.Rel }) -join ', ')"
}
function Get-FreeIds($ranges, $used, [int]$n) {
    $out = @()
    foreach ($r in $ranges) {
        for ($id = $r.from; $id -le $r.to -and $out.Count -lt $n; $id++) { if (-not $used.Contains($id)) { $out += $id } }
    }
    if ($out.Count -lt $n) { throw "Only $($out.Count) free ID(s) left in the idRanges; $n requested." }
    return $out
}

if ($NextId) {
    $target = Select-App
    $type = $NextId.ToLowerInvariant()
    $used = New-Object 'System.Collections.Generic.HashSet[int]'
    foreach ($o in ($objects | Where-Object { $_.Type -eq $type -and $null -ne $_.Id })) { [void]$used.Add([int]$o.Id) }
    Get-FreeIds $target.Ranges $used $Count
    return
}
if ($NextMemberId) {
    $baseKinds = if ($MemberKind -eq 'field') { @('table', 'tableextension') } else { @('enum', 'enumextension') }
    $named = @($objects | Where-Object { $_.Type -in $baseKinds -and $_.Name -ieq $NextMemberId })
    $baseName = $NextMemberId
    $ownBase = @($named | Where-Object { $_.Type -eq $baseKinds[0] })
    if (-not $ownBase.Count -and $named.Count -and $named[0].Extends) { $baseName = $named[0].Extends }
    $related = @($objects | Where-Object { $_.Type -in $baseKinds -and ($_.Name -ieq $baseName -or $_.Extends -ieq $baseName) })
    $used = New-Object 'System.Collections.Generic.HashSet[int]'
    foreach ($o in $related) { foreach ($m in @($o.Fields) + @($o.Values)) { [void]$used.Add([int]$m.id) } }
    if ($ownBase.Count -eq 1) {
        $max = 0; foreach ($u in $used) { if ($u -gt $max) { $max = $u } }
        1..$Count | ForEach-Object { $max + $_ }
    }
    else {
        $target = Select-App
        Get-FreeIds $target.Ranges $used $Count
    }
    return
}

# ---- write index --------------------------------------------------------------------------
function Json($x) { return (ConvertTo-Json -InputObject $x -Compress -Depth 6) }
$today = Get-Date -Format 'yyyy-MM-dd'
$appRows = $apps | ForEach-Object {
    $a = $_
    [ordered]@{ path = $a.Rel; id = $a.Id; name = $a.Name; publisher = $a.Publisher; version = $a.Version; application = $a.Application
        runtime = $a.Runtime; idRanges = @($a.Ranges); affixes = @($a.Affixes); dependencies = @($a.Dependencies)
        objectCount = @($objects | Where-Object { $_.App -eq $a.Rel }).Count }
}
$objectRows = $objects | Sort-Object App, Type, @{ Expression = { if ($null -eq $_.Id) { [int]::MaxValue } else { $_.Id } } }, Name | ForEach-Object {
    $row = [ordered]@{ type = $_.Type; id = $_.Id; name = $_.Name; app = $_.App; file = $_.File; line = $_.Line }
    if ($_.Extends) { $row.extends = $_.Extends }
    if ($_.Fields.Count) { $row.fields = @($_.Fields) }
    if ($_.Values.Count) { $row.values = @($_.Values) }
    $row
}
function Json-Lines($rows) { return (($rows | ForEach-Object { '    ' + (Json $_) }) -join ",`n") }
$sb = New-Object System.Text.StringBuilder
[void]$sb.Append("{`n  `"schema`": 1,`n  `"generated`": `"$today`",`n  `"note`": `"Generated by Get-ALObjectIndex.ps1; do not edit. Re-run to refresh.`",`n")
[void]$sb.Append("  `"apps`": [`n$(Json-Lines $appRows)`n  ],`n")
[void]$sb.Append("  `"idUsage`": [`n$(Json-Lines $usage)`n  ],`n")
[void]$sb.Append("  `"issues`": [`n$(Json-Lines $issues)`n  ],`n")
[void]$sb.Append("  `"objects`": [`n$(Json-Lines $objectRows)`n  ]`n}`n")
New-Item -ItemType Directory -Force -Path ([System.IO.Path]::GetDirectoryName($OutFile)) | Out-Null
[System.IO.File]::WriteAllText($OutFile, $sb.ToString(), $utf8)

# ---- markdown report ----------------------------------------------------------------------
if ($Report) {
    $reportFile = Join-Path $root "docs/generated/reviews/$today-object-ids.md"
    New-Item -ItemType Directory -Force -Path ([System.IO.Path]::GetDirectoryName($reportFile)) | Out-Null
    $md = New-Object System.Text.StringBuilder
    [void]$md.AppendLine("# Object ID report ($today)")
    [void]$md.AppendLine()
    [void]$md.AppendLine('Generated by `Get-ALObjectIndex.ps1` from the .al files and app.json. Source of truth: `docs/knowledge/object-index.json`.')
    foreach ($a in $apps) {
        [void]$md.AppendLine(); [void]$md.AppendLine("## App ``$($a.Rel)`` - $($a.Name) $($a.Version)"); [void]$md.AppendLine()
        [void]$md.AppendLine("- idRanges: $(if ($a.Ranges.Count) { ($a.Ranges | ForEach-Object { "$($_.from)-$($_.to)" }) -join ', ' } else { 'none' })")
        [void]$md.AppendLine("- Mandatory affix: $(if ($a.Affixes.Count) { $a.Affixes -join ', ' } else { 'none' }); application $($a.Application), runtime $($a.Runtime)")
        [void]$md.AppendLine(); [void]$md.AppendLine('| Type | ID | Name | Extends | Fields / values | File |'); [void]$md.AppendLine('|------|----|------|---------|-----------------|------|')
        foreach ($o in ($objects | Where-Object { $_.App -eq $a.Rel } | Sort-Object Type, @{ Expression = { if ($null -eq $_.Id) { [int]::MaxValue } else { $_.Id } } }, Name)) {
            $m = @($o.Fields) + @($o.Values) | ForEach-Object { "$($_.id) $($_.name)" }
            [void]$md.AppendLine("| $($o.Type) | $(if ($null -eq $o.Id) { '-' } else { $o.Id }) | $($o.Name) | $($o.Extends) | $($m -join '; ') | $($o.File):$($o.Line) |")
        }
        [void]$md.AppendLine(); [void]$md.AppendLine('### ID usage'); [void]$md.AppendLine()
        [void]$md.AppendLine('| Type | Used | Next free | Free blocks |'); [void]$md.AppendLine('|------|------|-----------|-------------|')
        foreach ($u in ($usage | Where-Object { $_.app -eq $a.Rel })) {
            [void]$md.AppendLine("| $($u.type) | $($u.used -join ', ') | $($u.nextFree) | $(($u.freeBlocks | ForEach-Object { "$($_.from)-$($_.to)" }) -join ', ') |")
        }
    }
    [void]$md.AppendLine(); [void]$md.AppendLine('## Detected issues'); [void]$md.AppendLine()
    if ($issues.Count) {
        [void]$md.AppendLine('| Severity | Code | Message | Location |'); [void]$md.AppendLine('|----------|------|---------|----------|')
        foreach ($i in ($issues | Sort-Object { $_.severity }, { $_.code })) { [void]$md.AppendLine("| $($i.severity) | $($i.code) | $($i.message) | $($i.file):$($i.line) |") }
    }
    else { [void]$md.AppendLine('None.') }
    [System.IO.File]::WriteAllText($reportFile, $md.ToString(), $utf8)
    Write-Output "Report: $(Get-Rel $reportFile)"
}

$errors = @($issues | Where-Object { $_.severity -eq 'error' }).Count
Write-Output "Index: $(Get-Rel $OutFile) - $($apps.Count) app(s), $($objects.Count) object(s), $errors error(s), $($issues.Count - $errors) warning(s)"

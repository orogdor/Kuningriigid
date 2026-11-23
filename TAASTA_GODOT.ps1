$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$branch = 'godot-vaheversioon-2026-11-23'
$expected = '0fa0717485b1e2be649e4ab9a6a55fafcbbc31f15c613b5b19901c319d950f1c'
$destination = Join-Path (Get-Location) 'Kuningriigid-Godot'
if (Test-Path -LiteralPath $destination) { throw "Kaust $destination on juba olemas. Käivita skript tühjas kaustas." }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git puudub. Paigalda Git for Windows ja proovi uuesti.' }
$temp = Join-Path ([IO.Path]::GetTempPath()) ('kuningriigid-godot-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null
$bundle = Join-Path $temp 'mang.bundle'
try {
  $out = [IO.File]::Create($bundle)
  try {
    for ($i = 1; $i -le 38; $i++) {
      $name = 'osa-{0:D2}.bin' -f $i
      $url = "https://raw.githubusercontent.com/orogdor/Kuningriigid/$branch/pakiosad/$name"
      $part = Join-Path $temp $name
      Write-Host "Laen alla $i / 38..."
      Invoke-WebRequest -Uri $url -OutFile $part -UseBasicParsing
      $inputStream = [IO.File]::OpenRead($part)
      try { $inputStream.CopyTo($out) } finally { $inputStream.Dispose() }
      Remove-Item -LiteralPath $part
    }
  } finally { $out.Dispose() }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $bundle).Hash.ToLowerInvariant() -ne $expected) { throw 'Allalaaditud paki kontrollsumma ei sobi.' }
  & git clone --branch $branch -- $bundle $destination
  if ($LASTEXITCODE -ne 0) { throw 'Projekti taastamine ebaõnnestus.' }
  Write-Host "Valmis: $destination"
} finally {
  if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
}

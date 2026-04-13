$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$outputDir = Join-Path $root 'output'
$sharedDir = Join-Path $root 'docs\_shared'
$referenceDoc = Join-Path $sharedDir 'reference.docx'

$documents = @(
  @{ Source = 'docs/01-technical-design.md'; BaseName = '01-technical-design' }
  @{ Source = 'docs/02-functionele-analyse.md'; BaseName = '02-functionele-analyse' }
  @{ Source = 'docs/03-gebruikershandleiding.md'; BaseName = '03-gebruikershandleiding' }
)

if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

foreach ($document in $documents) {
  $source = Join-Path $root $document.Source
  $pdfTarget = Join-Path $outputDir ($document.BaseName + '.pdf')
  $docxTarget = Join-Path $outputDir ($document.BaseName + '.docx')

  & pandoc --defaults (Join-Path $sharedDir 'pandoc-defaults-pdf.yaml') $source -o $pdfTarget

  if (Test-Path $referenceDoc) {
    & pandoc --defaults (Join-Path $sharedDir 'pandoc-defaults-docx.yaml') --reference-doc $referenceDoc $source -o $docxTarget
  }
  else {
    & pandoc --defaults (Join-Path $sharedDir 'pandoc-defaults-docx.yaml') $source -o $docxTarget
  }
}

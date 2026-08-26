param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'staging', 'pro')]
  [string]$Environment
)

$ErrorActionPreference = 'Stop'

$projects = @{
  dev = 'camerohealth-dev'
  staging = 'camerohealth-staging'
  pro = 'camerohealth-pro'
}

$projectId = $projects[$Environment]
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$frontendDirectory = Join-Path $repositoryRoot 'frontend'
$firebaseConfig = Join-Path $repositoryRoot 'firebase.json'

Write-Host "Verifying Firebase access for $projectId..."
$projectsJson = & npx.cmd firebase-tools projects:list --json 2>$null
try {
  $projectsResponse = $projectsJson | Out-String | ConvertFrom-Json
}
catch {
  throw "Firebase authentication check failed. Run 'npx firebase-tools login' and retry."
}
if ($projectsResponse.status -ne 'success') {
  throw "Firebase authentication check failed. Run 'npx firebase-tools login' and retry."
}

$accessibleProjects = $projectsResponse.result.projectId
if ($projectId -notin $accessibleProjects) {
  throw "The active Firebase account cannot access '$projectId'. Add this account to the project before deploying."
}

$requiredVariables = @(
  'API_URL',
  'VUE_APP_GOOGLE_MAPS_API_KEY',
  'CLIENT_ID'
)
$supabaseAuthEnabled = [Environment]::GetEnvironmentVariable('ENABLE_SUPABASE_AUTH') -match '^(1|true|yes|on)$'
if ($supabaseAuthEnabled) {
  $requiredVariables += @('SUPABASE_URL', 'SUPABASE_KEY')
}
$missingVariables = $requiredVariables | Where-Object { -not [Environment]::GetEnvironmentVariable($_) }
if ($missingVariables.Count -gt 0) {
  throw "Missing frontend build variables: $($missingVariables -join ', ')."
}

Write-Host "Generating CameroHealth frontend for $Environment..."
Push-Location $frontendDirectory
try {
  & npm.cmd run generate
  if ($LASTEXITCODE -ne 0) {
    throw "Frontend generation failed with exit code $LASTEXITCODE."
  }
}
finally {
  Pop-Location
}

Write-Host "Deploying Hosting only to $projectId..."
Push-Location $repositoryRoot
try {
  & npx.cmd firebase-tools deploy --only hosting --project $projectId --config $firebaseConfig --non-interactive
  if ($LASTEXITCODE -ne 0) {
    throw "Firebase Hosting deployment failed with exit code $LASTEXITCODE."
  }
}
finally {
  Pop-Location
}

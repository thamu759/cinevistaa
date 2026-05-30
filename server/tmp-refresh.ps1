$base = 'http://localhost:5000/api'

function DumpResponse($response) {
    if ($null -ne $response) {
        $response | ConvertTo-Json -Depth 10
    }
}

try {
    $loginBody = @{ username = 'admin'; password = 'password' } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body $loginBody -ContentType 'application/json'
    Write-Host 'LOGIN:'
    DumpResponse $login
    $token = $login.token
} catch {
    Write-Host 'LOGIN FAILED'
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd()
    }
    $token = $null
}

if (-not $token) {
    try {
        $regBody = @{ username = 'admin'; email = 'admin@example.com'; password = 'password' } | ConvertTo-Json
        $reg = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Body $regBody -ContentType 'application/json'
        Write-Host 'REGISTER:'
        DumpResponse $reg
        $token = $reg.token
    } catch {
        Write-Host 'REGISTER FAILED'
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host $reader.ReadToEnd()
        }
        exit 1
    }
}

if ($token) {
    try {
        $refresh = Invoke-RestMethod -Uri "$base/admin/refresh-posters" -Method Post -Headers @{ Authorization = "Bearer $token" }
        Write-Host 'REFRESH:'
        DumpResponse $refresh
    } catch {
        Write-Host 'REFRESH FAILED'
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host $reader.ReadToEnd()
        }
        exit 1
    }
}

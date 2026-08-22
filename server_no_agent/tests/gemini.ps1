$body = @{
  provider = "gemini"
  prompt = "Find active wells operated by Acme"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5050/api/query" `
  -ContentType "application/json" `
  -Body $body

$response | ConvertTo-Json -Depth 20
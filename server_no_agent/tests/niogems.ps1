$body = @{
  provider = "mock"
  prompt = "Show active wells for operator Acme on page 1 page size 25"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5050/api/query" `
  -ContentType "application/json" `
  -Body $body

$response | ConvertTo-Json -Depth 20
$body = @{
  provider = "mock"
  prompt = "Show wind turbines in CO over 3 MW limit 20"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5050/api/query" `
  -ContentType "application/json" `
  -Body $body

$response | ConvertTo-Json -Depth 20
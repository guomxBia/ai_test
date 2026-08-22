$tools = Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:5050/api/tools"

$tools | ConvertTo-Json -Depth 20
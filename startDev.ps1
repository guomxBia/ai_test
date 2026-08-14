# startDev.ps1 - Open tabs in current Windows Terminal

$BaseProjectPath = "C:\Users\Mingxin.Guo\Projects\test\ai_test"

# Check if running in Windows Terminal
if ($env:WT_SESSION) {
    Write-Host "Opening tabs in current Windows Terminal session..."

    # client tab
    wt.exe -w 0 nt -d "$BaseProjectPath\client" --title "client" -- powershell -NoExit -Command "npm run dev"

    # server tab
    wt.exe -w 0 nt -d "$BaseProjectPath\server" --title "server" -- powershell -NoExit -Command "npm run dev"

    # mcp_server tab
    wt.exe -w 0 nt -d "$BaseProjectPath\mcp_server" --title "mcp_server" -- powershell -NoExit -Command "npm run dev"

    Write-Host "All tabs created in current window."
} else {
    Write-Host "Opening new Windows Terminal window with tabs..."

    # Start new Windows Terminal with all tabs
    wt.exe -d "$BaseProjectPath\client" --title "client" -- powershell -NoExit -Command "npm run dev" `; nt -d "$BaseProjectPath\server" --title "server" -- powershell -NoExit -Command "npm run dev" `; nt -d "$BaseProjectPath\mcp_server" --title "mcp_server" -- powershell -NoExit -Command "npm run dev"

    Write-Host "New Windows Terminal window opened with all tabs."
}
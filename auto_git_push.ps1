# git_auto_push.ps1
# This script automates the process of adding, committing, and pushing changes to a Git repository.
# It assumes you are running it from within your Git repository or you specify the correct path.

# --- Configuration ---
# Set the path to your Git repository.
# If you run this script from within your repository, you can leave this empty or comment it out.
# Otherwise, uncomment and set the full path to your repository directory.
#$repoPath = "C:\path\to\your\local\myproject" # e.g., "C:\Users\YourUser\Documents\GitHub\myproject"

# Set the commit message. You can modify this or make it dynamic if needed.
$commitMessage = "Automated commit: temporary saving"

# --- Script Logic ---

# Check if a repository path is specified and navigate to it
if (-not [string]::IsNullOrEmpty($repoPath)) {
    Write-Host "Navigating to repository path: $repoPath"
    try {
        Set-Location -Path $repoPath
    } catch {
        Write-Error "Failed to navigate to $repoPath. Please ensure the path is correct."
        exit 1
    }
} else {
    Write-Host "Assuming current directory is the Git repository."
}

# 1. Add all changes to the staging area
Write-Host "Running 'git add .'"
try {
    git add .
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "git add . command might have encountered issues. Last exit code: $LASTEXITCODE"
    }
} catch {
    Write-Error "Error during 'git add .': $($_.Exception.Message)"
    exit 1
}

# 2. Commit the changes
Write-Host "Running 'git commit -m `"$commitMessage`"'"
try {
    # Check if there are any changes to commit
    $statusOutput = git status --porcelain
    if ($statusOutput -eq "") {
        Write-Host "No changes to commit. Working tree clean."
    } else {
        git commit -m $commitMessage
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "git commit command might have encountered issues. Last exit code: $LASTEXITCODE"
        }
    }
} catch {
    Write-Error "Error during 'git commit': $($_.Exception.Message)"
    exit 1
}

# 3. Push the changes to the remote repository
Write-Host "Running 'git push'"
try {
    git push
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "git push command might have encountered issues. Last exit code: $LASTEXITCODE"
    } else {
        Write-Host "Git push completed successfully." -ForegroundColor Green
    }
} catch {
    Write-Error "Error during 'git push': $($_.Exception.Message)"
    exit 1
}

Write-Host "`nScript finished."

# Publishing Draft Version 26 as Active Preview Build

## Overview
This document describes the process to publish Draft Version 26 and make it the currently running preview build accessible at the standard preview URL.

## Prerequisites
- Access to the Caffeine.ai platform deployment interface
- Draft Version 26 must exist in the version history
- Appropriate permissions to publish/deploy versions

## Steps to Publish Draft Version 26

### 1. Access Version History
- Navigate to the project's version management interface
- Locate the version history panel showing all draft versions
- Find "Draft Version 26" in the list

### 2. Select Draft Version 26
- Click on Draft Version 26 to view its details
- Review the version metadata to confirm it's the correct version
- Check the timestamp and any associated commit messages

### 3. Publish the Draft
- Click the "Publish" or "Deploy" button for Draft Version 26
- Confirm the deployment action when prompted
- Wait for the build and deployment process to complete

### 4. Verify Deployment
- Once deployment completes, navigate to the standard preview URL:
  - **Preview URL**: `https://caffeine.icp.xyz/preview`
- Verify that the application loads correctly
- Check that the version indicator (if present) shows "Version 26"
- Test key functionality to ensure the deployment was successful

## Expected Outcome
After completing these steps:
- Draft Version 26 becomes the active preview build
- The standard preview URL serves the Version 26 application
- Previous versions remain in history but are no longer active
- Users accessing the preview URL will see Version 26

## Rollback Process
If issues are discovered after publishing Version 26:
1. Return to the version history interface
2. Select a different stable version (e.g., Version 27 or Version 25)
3. Follow the same publish process to revert to that version

## Notes
- This is a deployment action only - no code changes are made
- The backend canister remains unchanged during version switching
- Frontend assets are updated to match the selected version
- Browser caching may require a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) to see changes immediately

## Troubleshooting
- **Version not appearing**: Ensure Draft Version 26 was successfully created and saved
- **Deployment fails**: Check build logs for errors and verify all dependencies are available
- **Preview URL shows old version**: Clear browser cache and perform a hard refresh
- **Functionality broken**: Verify backend compatibility and consider rolling back to a stable version

## Contact
For deployment issues or questions, contact the platform administrator or refer to the Caffeine.ai deployment documentation.

# GitHub Pages Deployment Instructions

## Simple Steps:

1. **Create a GitHub Repository:**
   - Go to GitHub and create a new repository
   - Name it whatever you want (e.g., `mystery-generator`)

2. **Upload Files:**
   - Upload all files from the `public` folder to your repository
   - You can drag and drop or use Git commands

3. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Choose **main** (or **master**) branch and **/ (root)** folder
   - Click **Save**

4. **Done!**
   - Your site will be live at: `https://yourusername.github.io/repository-name/`
   - It may take a few minutes to deploy

## That's it!

No serverless functions, no environment variables, no complex setup. Just upload and go!

**Note:** The API key is in the client-side code. For a production app, consider using a backend service, but for a simple project, this works fine.


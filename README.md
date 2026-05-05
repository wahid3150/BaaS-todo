# BaaS Todo

A React todo application powered by Appwrite Backend-as-a-Service. The app includes email/password authentication, user-specific todos, profile photo upload, protected database records, and Appwrite Storage integration.

This project demonstrates how a modern frontend can use a hosted backend for authentication, database reads/writes, file storage, and permission-based access control without building a custom server.

## Features

- User registration and login with Appwrite Account
- Authenticated dashboard route
- Create, read, update, and delete personal todos
- Per-user todo filtering with Appwrite database queries
- Profile section with name, email, and profile photo
- Profile photo upload to Appwrite Storage
- Upload progress feedback
- Profile photo delete flow
- Appwrite document and file permissions
- Responsive React UI styled with Tailwind CSS

## Tech Stack

- React 19
- Vite
- React Router
- Appwrite Web SDK
- Tailwind CSS
- Lucide React icons
- ESLint

## Appwrite Architecture

The app uses three Appwrite services:

- **Account** for authentication and session management
- **Databases** for todos and user profile metadata
- **Storage** for profile image files

The file itself is stored in Appwrite Storage. The database stores only the file ID and other structured metadata.

## Appwrite Setup

Create an Appwrite project, then configure the following resources.

### Database

Create one database and two collections.

#### `todos` Collection

Recommended attributes:

| Attribute | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | String | Yes | Todo text |
| `completed` | Boolean | Yes | Completion state |
| `userId` | String | Yes | Appwrite account ID |

Recommended index:

| Attribute | Type |
| --- | --- |
| `userId` | Key index |

The app queries todos by `userId`, so the index keeps the dashboard query fast and reliable.

#### `users` Collection

Recommended attributes:

| Attribute | Type | Required | Notes |
| --- | --- | --- | --- |
| `userId` | String | Yes | Appwrite account ID |
| `displayName` | String | No | User display name |
| `profilePhotoFileId` | String | No | Storage file ID for the profile photo |

Recommended index:

| Attribute | Type |
| --- | --- |
| `userId` | Key index |

### Storage Bucket

Create a bucket for profile photos.

Recommended settings:

- Enable **File Security**
- Allow authenticated users to create files
- Allow image file extensions such as `jpg`, `jpeg`, `png`, and `webp`
- Set a reasonable max file size, for example `5MB`

The code assigns file-level permissions when uploading:

- Public read permission for image display
- Current-user update permission
- Current-user delete permission

Public read is used because a normal `<img>` element loads the file URL directly from the browser. If the file is private, the browser image request may be blocked unless you implement signed tokens or a different authenticated file delivery flow.

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_APPWRITE_ENDPOINT="https://fra.cloud.appwrite.io/v1"
VITE_APPWRITE_PROJECT_ID="your-project-id"
VITE_APPWRITE_DB_ID="your-database-id"
VITE_APPWRITE_TODOS_COLLECTION_ID="todos"
VITE_APPWRITE_STORAGE_BUCKET_ID="your-storage-bucket-id"
```

The `users` collection ID is currently hardcoded as `users` in `Dashboard.jsx`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run linting:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

On Windows PowerShell, if `npm` is blocked by script execution policy, use:

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

## Project Structure

```txt
src/
  appwrite/
    config.js        Appwrite client, account, database, and storage setup
  pages/
    Home.jsx         Landing page
    Register.jsx     Account registration
    Login.jsx        Email/password login
    Dashboard.jsx    Todos, profile photo upload, and authenticated app UI
  App.jsx            Route definitions
  main.jsx           React entry point
```

## Current Data Flow

1. User registers or logs in through Appwrite Account.
2. Dashboard calls `account.get()` to verify the active session.
3. Dashboard fetches or creates the user's profile document.
4. Dashboard fetches todos where `userId` matches the authenticated user.
5. New todos are saved as Appwrite database documents.
6. Profile photos are uploaded to Appwrite Storage.
7. The profile document stores the uploaded file ID.
8. The UI renders the profile photo with `storage.getFileView(...)`.

## Extending Todo Attachments

The current app supports profile image upload. To add files to todos, use the same Appwrite pattern:

- Upload the file to Appwrite Storage
- Save the file metadata on the todo document
- Render the file based on its MIME type

Recommended extra todo fields:

| Attribute | Type | Required | Notes |
| --- | --- | --- | --- |
| `fileId` | String | No | Appwrite Storage file ID |
| `fileName` | String | No | Original uploaded file name |
| `fileMimeType` | String | No | Example: `image/png`, `video/mp4`, `application/pdf` |
| `fileSize` | Integer | No | File size in bytes |

Display strategy:

- Use `<img>` for image files
- Use `<video controls>` for video files
- Use a link or iframe for PDFs
- Use a download/open link for unsupported file types

When deleting a todo with an attached file, delete the storage file first, then delete the todo document. That keeps the bucket clean.

## Notes for Reviewers

This project is intentionally focused on BaaS integration rather than a custom backend. It shows practical Appwrite usage in a frontend application:

- Session-based authentication
- Protected database queries
- User-scoped documents
- Storage upload and deletion
- File preview/display in React
- Client-side handling of Appwrite permission errors

## Future Improvements

- Add todo file attachments for images, videos, and PDFs
- Move Appwrite collection IDs into environment variables
- Add loading skeletons for dashboard content
- Add optimistic updates for todo actions
- Add stronger form validation
- Add route guards for authenticated pages
- Add tests for auth and dashboard workflows

# manga2kindle

A Dockerized app that syncs with your mobile device to access downloaded manga, converts them to a Kindle-friendly format, sends the files to your Kindle, cleans up both devices, and continuously monitors for new downloads.

![App Screenshot Placeholder]

## Features

- 🔄 Syncthing integration for automatic file syncing
- 📚 Automatic CBZ to EPUB conversion
- 📧 Direct delivery to Kindle via email
- 🔒 Secure user authentication
- ⏱️ Customizable processing intervals
- 📊 Conversion history tracking

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. Create a `.env` file with the following variables:

   ```
   JWT_SECRET=your_secret_key
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_email@example.com
   SMTP_PASS=your_email_password
   KINDLE_EMAIL=your_kindle_address@kindle.com
   ```

2. Run the container:

   ```bash
   docker-compose up -d
   ```

3. Access the web interface at `http://localhost:3000`

### Option 2: Using Docker

```bash
docker run -d \
  -p 3000:3000 -p 8384:8384 \
  -v ./volumes/sync:/sync:rw \
  -v syncthing_config:/config \
  -v app_temp:/app/.temp \
  -v user_data:/app/data \
  -v ./data:/data \
  -e JWT_SECRET=your_secret_key \
  -e SMTP_HOST=your_smtp_host \
  -e SMTP_PORT=587 \
  -e SMTP_USER=your_email@example.com \
  -e SMTP_PASS=your_email_password \
  -e KINDLE_EMAIL=your_kindle_address@kindle.com \
  --restart unless-stopped \
  yourusername/cbz-kindle-converter:latest
```

## First-time Setup

1. When you first access the application, you'll be prompted to create an admin user
2. Enter your desired username and password
3. After logging in, configure your settings:
   - Email configuration for Kindle delivery
   - Processing interval
   - File format preferences

## Setting Up Syncthing

### Linking Your Phone with Syncthing

1. **Access Syncthing Web UI**:

   - Open `http://your-server-ip:8384` in your browser
   - You'll see the Syncthing admin interface

2. **Install Syncthing on Your Phone**:

   - Android: [Download from Google Play](https://play.google.com/store/apps/details?id=com.nutomic.syncthingandroid)
   - iOS: Use [Möbius Sync](https://apps.apple.com/us/app/möbius-sync/id1539203216)

3. **Link Your Devices**:

   - In the Syncthing web UI, click "Add Remote Device"
   - Scan the QR code shown in your mobile app
   - Give the device a name (e.g., "My Phone")
   - Click "Save"

4. **Create a Shared Folder**:

   - In the web UI, click "Add Folder"
   - Set Folder Path to where your manga/comics are stored on your phone
   - Give it an ID and Label (e.g., "manga")
   - Under Sharing, select your server
   - Click "Save"

5. **Accept the Share on Your Phone**:
   - Your phone will receive a notification about the new shared folder
   - Accept it and choose where to store the files

Now any manga/comics placed in this folder will automatically sync to the server and be processed for your Kindle!

## Environment Variables

sample .env in root directory, settings can later be changed in the user interface.

## Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/cbz-kindle-converter.git
   cd cbz-kindle-converter
   ```

2. Install dependencies:

   ```bash
   npm install
   cd src/frontend && npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## License

MIT License

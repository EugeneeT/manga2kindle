# Manga2Kindle

A comprehensive Docker solution that automatically syncs with your mobile manga reading apps, converts downloaded manga to Kindle-optimized formats, and delivers them directly to your device - creating a seamless reading experience.

![Manga2Kindle Workflow](https://via.placeholder.com/800x400?text=Manga2Kindle+Workflow)

## 🌟 Features

- **Seamless Integration**: Synchronizes with Tachiyomi, Mihon, Yokai, and other popular manga apps via Syncthing
- **Automatic Processing**: Detects and converts CBZ manga files to Kindle-optimized EPUB format
- **Direct Delivery**: Sends converted files directly to your Kindle device via email
- **Intelligent Management**: Implements cleanup routines on both source and target devices
- **Real-time Monitoring**: Continuously checks for new downloads to keep your library up-to-date
- **User-friendly Web Interface**:
  - Manual processing controls
  - Image quality adjustment (via ImageMagick)
  - Conversion history and status tracking
  - Email configuration management

## 🚀 Quick Start

### Option 1: Simple Deployment

Run the container with default settings:

```bash
docker run -p 32023:32023 -p 8384:8384 \
  -v manga_sync:/sync:rw \
  -v app_data:/app/data:rw \
  unn0rm4luser/manga2kindle:latest
```

This includes preset variables with Gmail SMTP configuration. Access the web interface at `http://localhost:32023` to configure:

- Your Gmail sender email
- Gmail App Password
- Kindle email address

### Option 2: Create a local .env file

1. Create a `.env` file with your preferred settings:

```
# Authentication
JWT_SECRET=your_super_secret_key_change_this

# Email Configuration
SMTP_HOST=smtp.your_provider.com
SMTP_PORT=your_provider_smpt_port
SMTP_USER=your_email@your_provider.com
SMTP_PASS=your_app_password
KINDLE_EMAIL=your_kindle_address@kindle.com

# Optional Configuration
# ALLOWED_ORIGINS=specific_origins_separated_by_commas
# PORT=set_your_port_here
```

2. Run the container with your custom environment file:

```bash
docker run --env-file .env -p 32023:32023 -p 8384:8384 \
  -v manga_sync:/sync:rw \
  -v app_data:/app/data:rw \
  unn0rm4luser/manga2kindle:latest
```

### Option 3: Manual Installation with Docker Compose

For full control over the deployment:

1. Clone the repository:

```bash
git clone https://github.com/EugeneeT/manga2kindle
cd manga2kindle
```

2. Install dependencies and build:

```bash
# Install backend dependencies
npm install

# Build frontend
cd src/frontend
npm install
npm run build
cd ../..
```

3. Create your .env file based on the sample above

4. Use the following docker-compose.yml:

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "${PORT:-32023}:${PORT:-32023}" # Settings App Web UI
      - "8384:8384" # Syncthing Web UI
    volumes:
      - manga_sync:/sync:rw # Syncthing data - managed by Docker
      - app_data:/app/data:rw # App settings and config - managed by Docker
    environment:
      - NODE_ENV=production
      - DATA_DIR=/app/data
      - ST_HOME=/app/data/syncthing
      # Import variables from .env file
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - KINDLE_EMAIL=${KINDLE_EMAIL}
      - PORT=${PORT:-32023}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    restart: unless-stopped

volumes:
  manga_sync: # Docker-managed volume for synced files
  app_data: # Docker-managed volume for app data and settings
```

3. Deploy:

```bash
docker-compose up --build
```

4. Access the web interface at `http://localhost:32023`

## 🔧 Technical Details

### Architecture

Manga2Kindle is built with:

- **Backend**: Node.js with Express.js
- **Frontend**: React with Tailwind CSS
- **File Synchronization**: Syncthing
- **Image Processing**: ImageMagick
- **Container**: Docker multi-stage build

### Dependencies

#### Backend Dependencies:

- express - Web server framework
- nodemailer - Email sending functionality
- epub-gen - EPUB creation
- archiver/unzipper - Archive management
- bcrypt/jsonwebtoken - Authentication
- node-cron - Scheduled tasks

#### Frontend Dependencies:

- react/react-dom - UI framework
- react-router-dom - Navigation
- lucide-react - Icons
- tailwindcss - Styling

## 📱 Setting Up Syncthing

### Connecting Your Mobile Device

1. **Access Syncthing Interface**:

   - Open `http://your-server-ip:8384` in your browser

2. **Install Syncthing on Your Mobile Device**:

   - Android: [Syncthing on Google Play](https://play.google.com/store/apps/details?id=com.nutomic.syncthingandroid)
   - iOS: [Möbius Sync on App Store](https://apps.apple.com/us/app/möbius-sync/id1539203216)

3. **Link Your Devices**:

   - In the Syncthing web UI, click "Add Remote Device"
   - Scan the QR code displayed in your mobile app
   - Name your device and save

4. **Configure Shared Folder**:

   - In the web UI, click "Add Folder"
   - Set the folder path to `/sync`
   - Give it an ID and label (e.g., "manga")
   - Share it with your mobile device
   - Click "Save"

5. **Accept on Your Mobile Device**:
   - Accept the folder sharing invitation on your device
   - Select a location where your manga app saves downloads

### Manga App Configuration

Configure your manga app (Tachiyomi, Mihon, Yokai, etc.) to save downloads to the Syncthing-monitored folder:

1. **Tachiyomi/Mihon**:

   - Go to Settings > Downloads
   - Set download directory to your Syncthing shared folder

2. **Other Apps**:
   - Consult your app's documentation for setting download locations

## ⚙️ Configuration Options

### Environment Variables

| Variable          | Description                   | Default              |
| ----------------- | ----------------------------- | -------------------- |
| `JWT_SECRET`      | Secret key for authentication | weaksecret1234567890 |
| `SMTP_HOST`       | SMTP server address           | smtp.gmail.com       |
| `SMTP_PORT`       | SMTP server port              | 587                  |
| `SMTP_USER`       | SMTP username/email           | _Required_           |
| `SMTP_PASS`       | SMTP password/app password    | _Required_           |
| `KINDLE_EMAIL`    | Your Kindle email address     | _Required_           |
| `PORT`            | Web interface port            | 32023                |
| `ALLOWED_ORIGINS` | CORS allowed origins          | \*                   |
| `DATA_DIR`        | Directory for app data        | /app/data            |
| `ST_HOME`         | Syncthing home directory      | /app/data/syncthing  |

### Web Interface Settings

The web interface allows you to configure:

- Processing schedule and intervals
- Image quality and conversion parameters
- Email preferences
- View processing history

## 📚 Usage Tips

- **Optimal Content**: Works best with black and white manga for Kindle display
- **Processing Schedule**: Configure conversion to run once daily (e.g., evening)
- **File Management**: The system automatically cleans up processed files
- **Email Whitelisting**: Add your sender email to your Kindle's approved list

## 🐳 Docker Build Information

The Docker image uses a multi-stage build process:

1. **Frontend Build Stage**: Compiles the React application
2. **Backend Build Stage**: Prepares the Node.js backend
3. **Final Runtime Stage**: Alpine-based image with only necessary components:
   - Node.js runtime
   - ImageMagick for image processing
   - Syncthing for file synchronization
   - Minimal dependencies for optimal performance

## 🛠️ Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Local Setup

1. Clone the repository:

```bash
git clone https://github.com/EugeneeT/manga2kindle
cd manga2kindle
```

2. Install dependencies:

```bash
# Backend
npm install

# Frontend
cd src/frontend
npm install
```

3. Start development servers:

```bash
# In frontend directory
npm start

# In project root (separate terminal)
npm run dev
```

The backend will run on port 32023 and the frontend development server will proxy API requests to it.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Syncthing](https://syncthing.net/) for the robust file synchronization
- [Tachiyomi](https://tachiyomi.org/) and related apps for manga collection
- [ImageMagick](https://imagemagick.org/) for image processing capabilities
- The open-source community for various tools and libraries

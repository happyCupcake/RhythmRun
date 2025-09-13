# 🏃‍♂️🎵 RhythmRun - AI-Powered Running Playlists

RhythmRun generates personalized running playlists based on your actual running data from Strava or custom training plans. Using AI music generation, we create songs that match your pace, elevation, and running style for the perfect workout soundtrack.

**📖 Suno API Documentation:** [suno.com/hackmit](https://suno.com/hackmit)

## 🚀 Quick Start

### 0. Clone This Repository

```bash
git clone <your-repo-url>
cd RhythmRun
```

### 1. Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Create the environment file
touch .env.local
```

Add your API keys:

```env
# .env.local
# Suno API Configuration
SUNO_API_KEY=your_suno_api_key_here

# Strava API Configuration
STRAVAID=your_strava_client_id_here
STRAVASECRET=your_strava_client_secret_here
STRAVA_ACCESS_TOKEN=your_strava_access_token_here

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**🚨 Important:** 
- Get your Suno API key from the Suno booth at HackMIT 2025
- Register your app at [Strava API](https://www.strava.com/settings/api) to get client credentials

### 2. Install and Run

Your project already has all the necessary dependencies. Simply run:

```bash
# Install dependencies
yarn install

# Start the development server
yarn dev
```

### 3. Test RhythmRun

1. **Open your browser** to `http://localhost:3000`
2. **Choose your runner type:**
   - **Strava Runner**: Connect your Strava account to analyze your actual runs
   - **Custom Runner**: Create playlists based on planned distance or duration
3. **For Strava users**: Select one of your recent runs to analyze
4. **For custom runners**: Enter distance (km) or duration (minutes) and choose from 3 interval options
5. **Generate your playlist** and enjoy AI-generated songs that match your running style!

## 🎯 Features Implemented

### For Strava Runners
- **Strava Integration**: Connect your Strava account to access your running data
- **Run Analysis**: Analyze your past 5 runs with detailed pace, elevation, and heart rate data
- **Smart Playlist Generation**: Create playlists based on your actual running patterns
- **1-Minute Intervals**: Break down your run into 1-minute segments with matching music

### For Custom Runners
- **Distance/Duration Input**: Enter your planned run distance or duration
- **3 Training Options**: Choose from Progressive, Fartlek, or Hill training plans
- **Interval-Based Playlists**: Get songs that match each segment of your workout

### Music Generation
- **AI-Powered**: Uses Suno API to generate custom songs for each interval
- **Pace-Matched Tempo**: BPM automatically adjusted based on your running pace
- **Genre Selection**: Music genres chosen based on pace, elevation, and workout intensity
- **Real-time Streaming**: Start listening to songs as they generate
- **Download Support**: Download your complete playlist as MP3 files

### Technical Features
- **Responsive Design**: Works on desktop and mobile devices
- **Audio Controls**: Built-in play/pause, scrubbing, and volume controls
- **Error Handling**: Comprehensive error handling and user feedback
- **Environment Security**: Secure API key management

## 🔍 API Endpoints

### Music Generation
- `POST /api/generate-music` - Start song generation with Suno API
- `POST /api/check-status` - Check generation status and get audio URLs

### Strava Integration
- `GET /api/strava/activities` - Get user's recent running activities
- `POST /api/analyze-run` - Analyze a specific run and generate music recommendations

### Custom Training
- `POST /api/generate-intervals` - Generate interval training options for non-Strava users

### Strava OAuth
- `GET /api/strava/exchange-token` - Handle Strava OAuth callback

## 🐛 Troubleshooting

### API Configuration Issues
- Make sure `.env.local` exists in your project root
- Verify all API keys are correctly set (Suno, Strava)
- Restart your development server after adding environment variables

### Strava Authentication Issues
- Ensure your Strava app is configured with the correct redirect URI
- Check that your Strava app has the required scopes (read, activity:read_all)
- Verify your Strava client ID and secret are correct

### Music Generation Issues
- Song generation typically takes 1-2 minutes per song
- The app polls every 5 seconds automatically
- Check the status updates in the progress section
- Ensure you have sufficient Suno API credits

### Audio Playback Issues
- Some browsers require user interaction before playing audio
- Try clicking play again, or check browser console for errors
- Verify that the audio URL is accessible
- Check your internet connection for streaming issues

## 📝 Main Code Structure

```
/app
  /api
    /generate-music/route.ts        # Suno music generation
    /check-status/route.ts          # Check generation status
    /analyze-run/route.ts           # Analyze Strava runs
    /generate-intervals/route.ts    # Generate training intervals
    /strava/
      /activities/route.ts          # Get Strava activities
      /exchange-token/page.tsx      # Strava OAuth callback
  page.tsx                          # Main RhythmRun UI

/lib
  suno-service.ts                   # Suno API service
  strava-service.ts                 # Strava API service

.env.local                          # Environment variables (create this!)
```

## 🎉 You're All Set!

Your RhythmRun app is ready to create personalized running playlists! 🏃‍♂️🎵

Make sure to:

1. Get your Suno API key from the Suno booth at HackMIT
2. Set up your Strava app and get client credentials
3. Add all API keys to `.env.local`
4. Start the dev server with `yarn dev`
5. Create amazing running playlists! 🎵

---

Built with ❤️ for HackMIT 2025 • Powered by [Suno](https://suno.com) & [Strava](https://strava.com)

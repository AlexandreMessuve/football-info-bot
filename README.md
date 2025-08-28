# FOOTBALL INFO BOT 
A Discord bot that provides football (soccer) information features.
## Features
- Live scores
- Match schedules
- League standings (soon)
- Player statistics (soon)
- Team information (soon)

## Specifications
MongoDB: Used for storing user preferences and settings.
Discord.js: Library for interacting with the Discord API.
api-football.com API: Source for football data.
Node.js: Runtime environment for executing the bot.
## Setup Instructions
1. Clone the repository:
2. Install dependencies:
   ```bash
   npm install
   ```
3. Rename a `.env.exemple` file in the root directory and add environment variables:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_discord_client_id
   MONGODB_URI=your_mongodb_connection_string
   API_FOOTBALL_KEY=your_api_football_key
   ```
4. Run the bot:
   ```bash
   npm run start
   ```
## Commands
- `/configure`: Configure channels for live score updates.
- `/add-league`: Add a league to track.
- `/remove-league`: Remove a league from tracking.
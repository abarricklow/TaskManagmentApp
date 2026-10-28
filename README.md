# Instructions for Grader

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).To create this app, I followed the tutorial here: https://docs.expo.dev/tutorial/create-your-first-app/. In this README, I will describe the commands for installing packages and running the app as a website locally. These instructions are for Mac OSX. I used Visual Studio Code. 

## Running Instructions
Open a terminal in the app root directory. Run the commands below. 
1. Install dependencies
Use Node.js 26.13.0 (the version pinned in `.nvmrc`) with npm 11. If you use nvm:

   ```bash
   nvm install
   nvm use
   npm install
   ```

If nvm is not already installed, install it first, then run the commands above.

2. Start the app

   ```bash
   npx expo start
   ```

In the output, Expo prints a QR code for Expo Go and reports a URL such as `exp://192.168.0.127:8081`. Scan that QR code with the Camera app and open the link in Expo Go. Keep the phone and Mac on the same Wi-Fi network. Do not scan the `http://localhost:8081` web address. Expo automatically advertises the Mac's current LAN address.

## Running the front end and back end

Quick add saves a task name, optional due date, and selected category to the local SQLite database. Personal, Work, School, and Other categories are available by default; custom categories can also be created.

Brain dump uses the Express API in `server/index.ts`. The API sends requests to a free model served locally by Ollama; no API key is needed. Keep Ollama and the API running while using brain dump.

### One-time setup

Install dependencies and configure the local environment from the app root:

```bash
npm install
cp .env.example .env
```

Install Ollama on macOS and download the configured model:

```bash
brew install ollama
ollama pull llama3.2:1b
```

Start Ollama in its own terminal and leave it running:

```bash
ollama serve
```

`OLLAMA_HOST` defaults to `http://127.0.0.1:11434`, and `OLLAMA_MODEL` selects the downloaded model. The API limits brain dumps to 4,000 characters.

### Start the back end

In a new terminal at the app root, start the API:

```bash
npm run api
```

The API listens on `http://localhost:3001` by default. You can check that it is running by opening `http://localhost:3001/api/health`; it should return `{"status":"ok"}`.

### Start the front end

In another terminal at the app root, run the web app:

```bash
npm run web
```

Open the URL printed by Expo, usually `http://localhost:8081`. The web app uses `EXPO_PUBLIC_API_URL` from `.env` to connect to the API; the example value is `http://localhost:3001`. If you change the web app's origin or host the API elsewhere, update `ALLOWED_WEB_ORIGIN` and `EXPO_PUBLIC_API_URL` in `.env` to match.

To run on a phone with Expo Go instead of the browser, start Expo with `npx expo start` and scan its QR code with the Camera app. Keep the phone and Mac on the same Wi-Fi network. The mobile app derives the API host from the Expo development connection. For native simulator/device builds, use `npx expo run:ios` or `npx expo run:android`. The native runtime requires iOS 17 or later or Android 13 or later.

The app is configured for the React Native New Architecture and includes the required Worklets Babel plugin. Ollama hosts and caches the model on the server, so phones and browsers do not need to download or run it. Model output may vary and should be reviewed before saving.

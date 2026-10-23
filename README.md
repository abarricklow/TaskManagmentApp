# Instructions for Grader

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).To create this app, I followed the tutorial here: https://docs.expo.dev/tutorial/create-your-first-app/. In this README, I will describe the commands for installing packages and running the app as a website locally. These instructions are for Mac OSX. I used Visual Studio Code. 

## Running Instructions
Open a terminal in the app root directory. Run the commands below. 
1. Install dependencies
You will need npm on your machine. If you have homebrew, you can run
   ```bash
   brew install node
   ```
   Otherwise, you can follow the instructions to install npm here: https://www.youtube.com/watch?v=Ue6g4udgbdI

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in on localhost (mine says "http://localhost:8081", but it's possible you may see a different port.)

## Quick add and on-device brain dump
Quick add saves a task name, optional due date, and selected category to the local SQLite database. Personal, Work, School, and Other categories are available by default; custom categories can also be created. Saved tasks appear on the Home tab. Brain dump uses a quantized language model through React Native ExecuTorch. The brain-dump text is processed on the device and is not sent to an AI server. The model files are downloaded from the model registry on first use and cached on the device; the first setup requires internet access and several hundred megabytes of free storage.

This native module does not run in Expo Go or on web. Use a physical iOS/Android development build (or a compatible simulator):

```bash
npx expo run:ios
# or
npx expo run:android
```

The native runtime requires iOS 17 or later or Android 13 or later. The app is configured for the React Native New Architecture and includes the required Worklets Babel plugin. The first model load may take a while; later launches use the cached model. On-device model output may vary by device and should be reviewed before saving.

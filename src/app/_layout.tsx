import { Stack } from "expo-router";
import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '../db/initialize';
import { Colors } from '../styles/theme';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="taskmanager.db" onInit={initializeDatabase}>
      <Stack
        screenOptions={{
          // Solid header so screen content starts below it, not underneath
          headerStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SQLiteProvider>
  );
}
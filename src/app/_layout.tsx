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
          headerStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="plant/[plantId]"
          options={{
            title: 'Plant Information',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </SQLiteProvider>
  );
}

import { Stack } from "expo-router";
import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '../db/initialize';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="taskmanager.db" onInit={initializeDatabase}>
      <Stack />;
    </SQLiteProvider>
  );
}

import { useEffect, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import type { AudioSource } from 'expo-audio';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  BorderWidths,
  Colors,
  FontSizes,
  FontWeights,
  IconSizes,
  Opacity,
  Radius,
  Spacing,
} from '../styles/theme';

type Meditation = {
  id: string;
  title: string;
  description: string;
  length: string; // shown before the audio has loaded
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  source: AudioSource;
};

const MEDITATIONS: Meditation[] = [
  {
    id: 'rain',
    title: 'Gentle Rain',
    description: 'Relax to the sound of falling rain',
    length: 'Continuous',
    icon: 'weather-rainy',
    source: require('../../assets/audio/rain.mp3'),
  },
  {
    id: 'ocean',
    title: 'Ocean Waves',
    description: 'Peaceful waves washing ashore',
    length: 'Continuous',
    icon: 'waves',
    source: require('../../assets/audio/ocean-waves.mp3'),
  },
  {
    id: 'white-noise',
    title: 'White Noise',
    description: 'Consistent background noise for focus',
    length: 'Continuous',
    icon: 'radio',
    source: require('../../assets/audio/white-noise.mp3'),
  },
  {
    id: 'forest',
    title: 'Forest Ambience',
    description: 'Birds singing and nature sounds',
    length: 'Continuous',
    icon: 'forest',
    source: require('../../assets/audio/forest.mp3'),
  },
  {
    id: 'fireplace',
    title: 'Fireplace',
    description: 'Soft and comforting crackling sounds',
    length: 'Continuous',
    icon: 'fire',
    source: require('../../assets/audio/fireplace.mp3'),
  },
  {
    id: 'wind',
    title: 'Gentle Wind',
    description: 'Calming sounds of the breeze',
    length: 'Continuous',
    icon: 'weather-windy',
    source: require('../../assets/audio/wind.mp3'),
  },
];

const SKIP_SECONDS = 15;

export default function MeditationScreen() {
  const [selected, setSelected] = useState<Meditation | null>(null);
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [barWidth, setBarWidth] = useState(0);

  // Play even when the phone is on silent (iOS)
  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // When a track ends, go back to the start so Play restarts it
  useEffect(() => {
    if (status.didJustFinish) {
      player.pause();
      void player.seekTo(0);
    }
  }, [status.didJustFinish, player]);

  function chooseMeditation(meditation: Meditation) {
  if (selected?.id === meditation.id) {
    togglePlayback();
    return;
  }

  setSelected(meditation);
  player.replace(meditation.source);
  player.loop = true;
  player.play();
}

  function togglePlayback() {
    if (!selected) return;
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }

  function skip(seconds: number) {
    const target = Math.min(
      Math.max(status.currentTime + seconds, 0),
      status.duration || 0
    );
    void player.seekTo(target);
  }

  // Tap anywhere on the progress bar to jump to that point
  function seekFromBar(event: GestureResponderEvent) {
    if (!barWidth || !status.duration) return;
    const ratio = event.nativeEvent.locationX / barWidth;
    void player.seekTo(Math.min(Math.max(ratio, 0), 1) * status.duration);
  }

  const progress = status.duration ? status.currentTime / status.duration : 0;
  const isLoading = selected !== null && !status.isLoaded;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'White Noise', headerBackTitle: 'Wellness' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>White Noise</Text>
        <Text style={styles.description}>Choose a sound and relax.</Text>

        <View style={styles.list}>
          {MEDITATIONS.map((meditation) => {
            const isSelected = selected?.id === meditation.id;
            const isPlaying = isSelected && status.playing;
            return (
              <Pressable
                accessibilityHint={isPlaying ? 'Pauses this meditation' : 'Plays this meditation'}
                accessibilityLabel={`${meditation.title}, ${meditation.length}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={meditation.id}
                onPress={() => chooseMeditation(meditation)}
                style={({ pressed }) => [
                  styles.trackCard,
                  isSelected && styles.trackCardSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.trackIcon}>
                  <MaterialCommunityIcons
                    color={Colors.primary}
                    name={meditation.icon}
                    size={IconSizes.medium}
                  />
                </View>
                <View style={styles.trackText}>
                  <Text style={styles.trackTitle}>{meditation.title}</Text>
                  <Text style={styles.trackDescription}>{meditation.description}</Text>
                  <Text style={styles.trackLength}>{meditation.length}</Text>
                </View>
                <MaterialCommunityIcons
                  color={isSelected ? Colors.primary : Colors.textSecondary}
                  name={isPlaying ? 'pause-circle' : 'play-circle-outline'}
                  size={IconSizes.large}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Player stays at the bottom while a meditation is chosen */}
      {selected && (
        <View style={styles.player}>
          <Text numberOfLines={1} style={styles.playerTitle}>
            {selected.title}
          </Text>

          <Pressable
            accessibilityLabel="Playback position"
            accessibilityRole="adjustable"
            accessibilityValue={{
              min: 0,
              max: Math.round(status.duration || 0),
              now: Math.round(status.currentTime),
              text: `${formatTime(status.currentTime)} of ${formatTime(status.duration)}`,
            }}
            hitSlop={Spacing.sm}
            onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
            onPress={seekFromBar}
            style={styles.progressTrack}
          >
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </Pressable>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>{formatTime(status.currentTime)}</Text>
            <Text style={styles.timeLabel}>{formatTime(status.duration)}</Text>
          </View>

          <View style={styles.controls}>
            <Pressable
              accessibilityLabel={`Back ${SKIP_SECONDS} seconds`}
              accessibilityRole="button"
              disabled={isLoading}
              hitSlop={Spacing.sm}
              onPress={() => skip(-SKIP_SECONDS)}
              style={({ pressed }) => (pressed || isLoading) && styles.pressed}
            >
              <MaterialCommunityIcons
                color={Colors.primary}
                name="rewind-15"
                size={IconSizes.large}
              />
            </Pressable>
            <Pressable
              accessibilityLabel={status.playing ? 'Pause' : 'Play'}
              accessibilityRole="button"
              disabled={isLoading}
              onPress={togglePlayback}
              style={({ pressed }) => [
                styles.playButton,
                (pressed || isLoading) && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                color={Colors.onPrimary}
                name={status.playing ? 'pause' : 'play'}
                size={IconSizes.large}
              />
            </Pressable>
            <Pressable
              accessibilityLabel={`Forward ${SKIP_SECONDS} seconds`}
              accessibilityRole="button"
              disabled={isLoading}
              hitSlop={Spacing.sm}
              onPress={() => skip(SKIP_SECONDS)}
              style={({ pressed }) => (pressed || isLoading) && styles.pressed}
            >
              <MaterialCommunityIcons
                color={Colors.primary}
                name="fast-forward-15"
                size={IconSizes.large}
              />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// 125 -> "2:05"
function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  heading: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
  list: {
    gap: Spacing.sm,
  },
  trackCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: BorderWidths.thin,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  trackCardSelected: {
    backgroundColor: Colors.surfaceTint,
    borderColor: Colors.primary,
    borderWidth: BorderWidths.thick,
    // Keep the card the same size when the border gets thicker
    padding: Spacing.md - (BorderWidths.thick - BorderWidths.thin),
  },
  trackIcon: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.xl,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  trackText: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    color: Colors.text,
    fontSize: FontSizes.subtitle,
    fontWeight: FontWeights.semibold,
  },
  trackDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
  trackLength: {
    color: Colors.primary,
    fontSize: FontSizes.small,
    fontWeight: FontWeights.semibold,
  },
  pressed: {
    opacity: Opacity.pressed,
  },
  player: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: BorderWidths.thin,
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  playerTitle: {
    color: Colors.text,
    fontSize: FontSizes.subtitle,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
  },
  progressTrack: {
    backgroundColor: Colors.surfaceTint,
    borderRadius: Radius.sm,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: Colors.primary,
    height: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xl,
    justifyContent: 'center',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
});
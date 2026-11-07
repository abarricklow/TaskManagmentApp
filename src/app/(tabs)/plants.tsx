
import { useCallback, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Colors, FontSizes, Spacing, GlobalStyles } from '../../styles/theme';

// Shelf image
import shelf from '../../../assets/art/shelf.png';

// Plant collection images
import plant1 from '../../../assets/art/plant1.png';
import plant2 from '../../../assets/art/plant2.png';
import plant3 from '../../../assets/art/plant3.png';
import plant4 from '../../../assets/art/plant4.png';
import plant5 from '../../../assets/art/plant5.png';
import plant6 from '../../../assets/art/plant6.png';
import plant7 from '../../../assets/art/plant7.png';
import plant8 from '../../../assets/art/plant8.png';
import plant9 from '../../../assets/art/plant9.png';
import plant10 from '../../../assets/art/plant10.png';
import plant11 from '../../../assets/art/plant11.png';
import plant12 from '../../../assets/art/plant12.png';
import plant13 from '../../../assets/art/plant13.png';
import plant14 from '../../../assets/art/plant14.png';
import plant15 from '../../../assets/art/plant15.png';
import plant16 from '../../../assets/art/plant16.png';
import plant17 from '../../../assets/art/plant17.png';

const plantImages = [
  plant1, plant2, plant3, plant4, plant5,
  plant6, plant7, plant8, plant9, plant10,
  plant11, plant12, plant13, plant14, plant15,
  plant16, plant17,
];

// Four floors, five positions per floor.
// Each plant is assigned a permanent position.
const plantFloors = [
  [16, 17],
  [11, 12, 13, 14, 15],
  [6, 7, 8, 9, 10],
  [1, 2, 3, 4, 5],
];

const floorPositions = [
  0.045,
  0.26,
  0.484,
  0.70,
];

type Plant = {
  id: number;
  plant_name: string;
};

export default function PlantScreen() {
  const db = useSQLiteContext();
  const { width } = useWindowDimensions();

  const [collectedPlants, setCollectedPlants] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const shelfSize = Math.min(width - Spacing.md * 2, 380);
  const plantSize = shelfSize * 0.24;

  // Load collected plants from SQLite
  const loadPlants = useCallback(async () => {
    setIsLoading(true);

    try {
      const rows = await db.getAllAsync<Plant>(
        'SELECT id, plant_name FROM Plants'
      );

      const collected = rows
        .map((row) => {
          const match = row.plant_name.match(/^plant(\d+)$/);
          return match ? Number(match[1]) : null;
        })
        .filter(
          (number): number is number =>
            number !== null && number >= 1 && number <= 17
        );

      setCollectedPlants([...new Set(collected)]);
    } catch (error) {
      console.error('Unable to load plant collection:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void loadPlants();
    }, [loadPlants])
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>
        My Plant Collection
      </Text>

      <Text style={styles.description}>
        {collectedPlants.length} / 17 plants collected
      </Text>

      <View style={[styles.shelfContainer, {
        width: shelfSize,
        height: shelfSize,
      }]}>
        <Image
          source={shelf}
          style={styles.shelfImage}
          resizeMode="contain"
        />

        {plantFloors.map((floor, floorIndex) => (
          <View
            key={floorIndex}
            style={[
              styles.floor,
              {
                top: shelfSize * floorPositions[floorIndex],
                height: shelfSize * 0.18,
              },
            ]}
          >
            {floor.map((plantNumber, positionIndex) => {
              if (!collectedPlants.includes(plantNumber)) {
                return (
                  <View
                    key={plantNumber}
                    style={[
                      styles.plantSlot,
                      {
                        width: plantSize,
                        height: plantSize,
                      },
                    ]}
                  />
                );
              }

              return (
                <Image
                  key={plantNumber}
                  source={plantImages[plantNumber - 1]}
                  style={[
                    styles.plantImage,
                    {
                      width: plantSize,
                      height: plantSize,
                      marginLeft: -20,
                    },
                  ]}
                  resizeMode="contain"
                  accessibilityLabel={`Collected plant ${plantNumber}`}
                />
              );
            })}
          </View>
        ))}
      </View>

      {isLoading && (
        <ActivityIndicator color={Colors.primary} />
      )}

      <Text style={styles.footer}>
        Keep completing tasks to grow your collection!
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    gap: Spacing.sm,
  },

  heading: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: 'bold',
  },

  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },

  shelfContainer: {
    position: 'relative',
    alignSelf: 'center',
  },

  shelfImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  floor: {
    position: 'absolute',
    left: '5%',
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    columnGap: .3,
    alignItems: 'flex-end',
  },

  plantImage: {
    alignSelf: 'center',
  },

  plantSlot: {
    opacity: 0,
  },

  footer: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});

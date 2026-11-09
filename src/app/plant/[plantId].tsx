
import { useLocalSearchParams, router } from 'expo-router';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';

import { Colors, FontSizes, Spacing } from '../../styles/theme';

// Plant images
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

// Plant information
const plantInformation = [
  {
    name: 'Plant 1',
    description: 'Information about plant 1 goes here.',
    care: 'Care instructions for plant 1 go here.',
  },
  {
    name: 'Plant 2',
    description: 'Information about plant 2 goes here.',
    care: 'Care instructions for plant 2 go here.',
  },
  {
    name: 'Plant 3',
    description: 'Information about plant 3 goes here.',
    care: 'Care instructions for plant 3 go here.',
  },
  {
    name: 'Plant 4',
    description: 'Information about plant 4 goes here.',
    care: 'Care instructions for plant 4 go here.',
  },
  {
    name: 'Plant 5',
    description: 'Information about plant 5 goes here.',
    care: 'Care instructions for plant 5 go here.',
  },
  {
    name: 'Plant 6',
    description: 'Information about plant 6 goes here.',
    care: 'Care instructions for plant 6 go here.',
  },
  {
    name: 'Plant 7',
    description: 'Information about plant 7 goes here.',
    care: 'Care instructions for plant 7 go here.',
  },
  {
    name: 'Plant 8',
    description: 'Information about plant 8 goes here.',
    care: 'Care instructions for plant 8 go here.',
  },
  {
    name: 'Plant 9',
    description: 'Information about plant 9 goes here.',
    care: 'Care instructions for plant 9 go here.',
  },
  {
    name: 'Plant 10',
    description: 'Information about plant 10 goes here.',
    care: 'Care instructions for plant 10 go here.',
  },
  {
    name: 'Plant 11',
    description: 'Information about plant 11 goes here.',
    care: 'Care instructions for plant 11 go here.',
  },
  {
    name: 'Plant 12',
    description: 'Information about plant 12 goes here.',
    care: 'Care instructions for plant 12 go here.',
  },
  {
    name: 'Plant 13',
    description: 'Information about plant 13 goes here.',
    care: 'Care instructions for plant 13 go here.',
  },
  {
    name: 'Plant 14',
    description: 'Information about plant 14 goes here.',
    care: 'Care instructions for plant 14 go here.',
  },
  {
    name: 'Plant 15',
    description: 'Information about plant 15 goes here.',
    care: 'Care instructions for plant 15 go here.',
  },
  {
    name: 'Plant 16',
    description: 'Information about plant 16 goes here.',
    care: 'Care instructions for plant 16 go here.',
  },
  {
    name: 'Plant 17',
    description: 'Information about plant 17 goes here.',
    care: 'Care instructions for plant 17 go here.',
  },
];

export default function PlantDetailsScreen() {
  const { plantId } = useLocalSearchParams<{
    plantId: string;
  }>();

  const plantNumber = Number(plantId);

  if (
    !Number.isInteger(plantNumber) ||
    plantNumber < 1 ||
    plantNumber > 17
  ) {
    return (
      <View style={styles.container}>
        <Text>Plant not found.</Text>
      </View>
    );
  }

  const plant = plantInformation[plantNumber - 1];
  const plantImage = plantImages[plantNumber - 1];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>
        {plant.name}
      </Text>

      <Image
        source={plantImage}
        style={styles.plantImage}
        resizeMode="contain"
      />

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>
          About this plant
        </Text>

        <Text style={styles.description}>
          {plant.description}
        </Text>

        <Text style={styles.sectionTitle}>
          Plant care
        </Text>

        <Text style={styles.description}>
          {plant.care}
        </Text>
      </View>

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>
          Back to collection
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },

  content: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    gap: Spacing.md,
  },

  heading: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: 'bold',
  },

  plantImage: {
    width: 220,
    height: 220,
  },

  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.sm,
  },

  sectionTitle: {
    color: Colors.primary,
    fontSize: FontSizes.subtitle,
    fontWeight: 'bold',
  },

  description: {
    color: Colors.text,
    fontSize: FontSizes.body,
    lineHeight: 24,
  },

  backButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: 'bold',
  },
});


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
    name: 'String of Pearls',
    description: 'Scientific Name: Senecio rowleyanus.    This succulent has spherical leaves that resemble small peas. Its round shape minimizes water loss through evaporation, making it well adapted to desert climates. This plant has translucent “windows” in its round leaves that allow light to enter. The string of pearls thrives in bright, indirect light and produces white flowers throughout the spring.',
  },
  {
    name: 'Aloe Vera',
    description: 'Scientific Name: Aloe Vera.    Aloe is a cactus-like plant that grows in hot, dry climates. It is grown in subtropical regions around the world, including the southern border areas of Texas, New Mexico, Arizona, and California. The gel in those thick, succulent, spiky leaves has been used by people for medicine and beauty for thousands of years. In fact, the ancient Egyptians called aloe vera ‘the plant of immortality’.',
  },
  {
    name: 'Zebra Plant',
    description: 'Scientific Name: Haworthia attenuata.    This plant is small, stemless, and has a clumping habit that forms into compact star-shaped rosettes that may spread out creating a carpet. It measures up to 4 to 12 inches tall and 6 inches to 2 feet wide. The leaves are stiff, linear, pointed, dark green and have horizontal white bumpy stripes or tubercles. The flowers are tubular, pale to dark pink, and bloom in clusters on long slender stems.',
  },
  {
    name: 'Blue Chalksticks',
    description: 'Scientific Name: Curio repens.    The narrow leaves remain powder blue in color throughout the year. It features dainty clusters of white flowers held on top of the stems in mid-summer. This is a relatively low-maintenance plant and usually looks its best without pruning.',
  },
  {
    name: 'Old Lady Cactus',
    description: 'Scientific Name: Mammillaria hahniana.    Their low-maintenance needs make them great for beginners and plant lovers of all kinds. As an added bonus, most of them bloom well, even when you keep them indoors. This cactus type starts off globular and grows taller over time into a cylindrical shape. The stems reach up to 12 inches tall and four inches wide. They can be solitary or form clumps over time.',
  },
  {
    name: 'Flapjack',
    description: 'Scientific Name: Kalanchoe luciae.    Flapjacks is a drought tolerant succulent. The basal rosette of the plant generally grows 12 to 18 inches tall and 6 to 8 inches wide. The opposite leaves do not have petioles and are held upright like clam shells, positioning only their narrow edges to the midday sun. The smooth, grayish-green, obovate leaves are 4 to 6 inches long, with blunt rounded tips and covered with a white to grey powdery bloom that helps protect the leaves from sunburn.',
  },
  {
    name: 'Firestick Plant',
    description: 'Scientific Name: Euphorbia tirucalli.    This endangered species is recognized for its light green, pencil-thin, bush-like branches with miniature leaflets. It is fast-growing reaching heights of eight to ten feet or more in the southwest desert. In its native habitat it can reach thirty feet with a ten-foot spread. The color in its stems will fade to a greenish-yellow as summer approaches. This plant becomes redder during the winter months and does best when grown in full sun.',
  },
  {
    name: 'Fairy Washboard',
    description: 'Scientific Name: Haworthia limifolia.    A succulent plant forming a spiralling rosette of stiff, pointed triangular leaves, each leaf bears numerous irregular ridges. In summer tubular green and white flowers are produced on 40cm tall flower stalks. Fairy Washboard is native to South Africa, where it was first cultivated at the beginning of the 20th century. A characteristic feature of the plant is that it can adapt to different climates and survive in low-light conditions.',
  },
  {
    name: 'Jade Plant',
    description: 'Scientific Name: Crassula ovata.    It is a succulent subshrub or shrub native to an area extending from southeastern Mozambique to the southeastern Cape Province. A jade plant has the look of a bonsai without the demanding care: over the years, its stem thickens into a small trunk and its branches form a crown. Fun fact: A single leaf laid on dry growing medium can produce a new plant.',
  },
  {
    name: 'Blotched Philodendron',
    description: 'Scientific Name: Philodendron mamei.    This is an evergreen perennial known for its creeping habit. It spreads across the ground with its large leaves held aloft on sturdy but short stems. Its main appeal are its large, heart-shaped, velvety leaves that display "blotches" and patterns between its veins.',
  },
  {
    name: 'Dumb Cane or Camille',
    description: 'Scientific Name: Dieffenbachia seguine Camille.    One of the most popular dieffenbachias, ‘Camille’ has ivory-yellow leaves with dark green edges. It grows 2 to 3 feet tall and 2 feet wide. It does best in medium-bright, filtered light. Depending on how much light the plant gets, the central veins of the leaves take on a white or green hue and the yellow sections of the leaves fade to a creamy white color.',
  },
  {
    name: 'Chinese Money Plant',
    description: 'Scientific Name: Pilea peperomioides.    You can recognise this plant by its small, flat, round leaves that are reminiscent of coins or pancakes. The leaves are glossy, leathery, thick and dark green and balance on long, thin stalks. The Chinese money plant can grow small flowers that bloom for several weeks, but this is very rare. Chinese money plant is an air-purifyer, contributing to cleaner and healthier indoor air.',
  },
  {
    name: 'Elephant Foot or Ponytail Palm',
    description: 'Scientific Name: Beaucarnea recurvata.    Ponytail palm is an evergreen perennial in the asparagus family (Asparagaceae). It is native to Mexico and is commonly grown as a houseplant. It is slow growing, drought tolerant and hardy to 50 degrees F. Even though it is called ponytail palm, it is not a true palm,  it has a thick swollen stem (caudex) that stores water and narrow dark green strappy leaves that gently curl toward the ends.  The plant almost looks like a plume from a water fountain.',
  },
  {
    name: 'Rubber Plant',
    description: 'Scientific Name: Ficus elastica.    The rubber plant has a latex-like white sap in the stem and leaves, giving it its characteristic look. It was identified by the NASA Clean Air Study as an effective plant to remove toxins like formaldehyde from the air. Rubber plants represent abundance, happiness and wealth. According to the teachings of feng shui the rubber plant’s round leaves make it an ideal candidate to be placed in a corner in order to soften the sharp angles.',
  },
  {
    name: 'Monstera Aurea',
    description: 'Scientific Name: Monstera Marmorata.    The term “Aurea” simply refers to yellow variegation on a Monstera Deliciosa regardless of whether it’s a small form or large form.  Young leaves start heart-shaped and solid, while mature climbing plants develop large, glossy, split, and fenestrated (holed) leaves.  Like other members of the Araceae family, it is toxic to pets and children if ingested due to insoluble calcium oxalate crystals.',
  },
  {
    name: 'Bamboo',
    description: 'Scientific Name: Bambusoideae.    Bamboos include some of the fastest-growing plants in the world, due to a unique rhizome-dependent system. Certain species of bamboo can grow 36 inches within a 24-hour period, at a rate of almost 40 millimeters per hour. With its unlikely shape, bamboo is not a tree! It is considered grass; witht hat said, bamboo is an extremely invasive plant species because, like short grass, it propagates. All continents have native species, except for Europe and Antartica, where non-native species still grow.',
  },
  {
    name: 'Petra Croton',
    description: 'Scientific Name: Codiaeum variegatum Petra.    This plant is native to Malaysia, Indonesia, the Philippines, and northern Australia/Pacific islands. This plant can be identified by its large, glossy, leathery, oval-shaped leaves with brightly colored veins in shades of red, orange, yellow, pink, and green. Although it has a beutiful appearance, this Croton plant contains a milky sap that can cause skin/contact dermatitis, and the plant is toxic if ingested.',
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

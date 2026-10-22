import { Text, View} from 'react-native';
import { Colors, GlobalStyles } from '../styles/theme';

export default function PlantScreen() {
  return (
    <View style={GlobalStyles.container}>
      <Text style={GlobalStyles.heading}>Plant screen</Text>
    </View>
  );
}
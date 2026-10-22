import { Text, View} from 'react-native';
import { Colors, GlobalStyles } from '../styles/theme';

export default function WellnessScreen() {
  return (
    <View style={GlobalStyles.container}>
      <Text style={GlobalStyles.heading}>Mental Wellness Hub</Text>
    </View>
  );
}
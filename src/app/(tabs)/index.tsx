import { Text, View} from 'react-native';
import { Colors, GlobalStyles } from '../styles/theme';

export default function Index() {
  return (
    <View style={GlobalStyles.container}>
      <Text style={GlobalStyles.heading}>Home screen</Text>
    </View>
  );
}

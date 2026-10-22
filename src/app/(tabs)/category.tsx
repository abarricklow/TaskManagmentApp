import { Text, View} from 'react-native';
import { Colors, GlobalStyles } from '../styles/theme';

export default function CategoryScreen() {
  return (
    <View style={GlobalStyles.container}>
      <Text style={GlobalStyles.heading}>Category</Text>
    </View>
  );
}

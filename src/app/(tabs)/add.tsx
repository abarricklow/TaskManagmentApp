import { Text, View} from 'react-native';
import { Colors, GlobalStyles } from '../styles/theme';

export default function AddScreen() {
  return (
    <View style={GlobalStyles.container}>
      <Text style={GlobalStyles.heading}>Add Task</Text>
    </View>
  );
}

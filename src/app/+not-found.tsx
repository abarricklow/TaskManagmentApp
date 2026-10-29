import { View, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Colors, GlobalStyles } from '../styles/theme';


export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View style={GlobalStyles.container}>
        <Link href="/" style={GlobalStyles.button}>
          Go back to Home screen!
        </Link>
      </View>
    </>
  );
}

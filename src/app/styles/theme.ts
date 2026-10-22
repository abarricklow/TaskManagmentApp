import { StyleSheet } from 'react-native';

// Lots of these values were default
// We can change as we go
export const Colors = {
  background: '#FAF3DD',
  primary: '#4A7C59',
  secondary: '#A5B4FC',
  accent: '68B0AB',
  text: '#27292a',
  textSecondary: '#2f4f7f',
  border: '#8FC0A9',
  error: '#DC2626',
};


export const FontSizes = {
  small: 12,
  body: 16,
  subtitle: 18,
  heading: 24,
  title: 32,
};

export const IconSizes = {
  small: 12,
  medium: 24,
  large: 36,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Also can change as we go
export const GlobalStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: Spacing.md,
    },

    heading: {
        fontSize: FontSizes.heading,
        fontWeight: 'bold',
        color: Colors.text,
    },

    bodyText: {
        fontSize: FontSizes.body,
        color: Colors.text,
    },

    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },

    button: {
        fontSize: 20,
        textDecorationLine: 'underline',
        color: '#fff',
    },
});
import { StyleSheet } from 'react-native';

export const Colors = {
  // Brand
  primary: '#4A7C59',
  secondary: '#A5B4FC',
  accent: '#68B0AB',

  // Surfaces
  background: '#FAF3DD',
  surface: '#FFFFFF',       // cards, modals, dropdown lists
  surfaceMuted: '#F4F7F2',  // dropdown / date buttons
  surfaceTint: '#E8F3E5',   // plant pet area, pressed checkbox
  overlay: 'rgba(0, 0, 0, 0.45)',

  // Text
  text: '#27292a',
  textSecondary: '#2f4f7f',
  onPrimary: '#FFFFFF',     // text on primary-colored buttons

  // Lines & states
  border: '#8FC0A9',
  error: '#DC2626',
};

export const FontSizes = {
  small: 12,
  body: 16,
  subtitle: 18,
  large: 20,
  heading: 24,
  title: 32,
};

export const FontWeights = {
  regular: '400',
  semibold: '600',
  bold: 'bold',
} as const;

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

export const Radius = {
  sm: 5,   // checkbox
  md: 8,   // inputs, buttons
  lg: 12,  // cards, modals
  xl: 16,  // feature panels
};

export const BorderWidths = {
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  thick: 2,
};

export const Opacity = {
  pressed: 0.7,
  disabled: 0.5,
};

export const Layout = {
  modalMaxWidth: 420,
};

// ─── Repeated Bits ────────────────────────────────────────────────────────

const bordered = {
  borderColor: Colors.border,
  borderWidth: BorderWidths.thin,
};

const surfaceCard = {
  ...bordered,
  backgroundColor: Colors.surface,
  borderRadius: Radius.lg,
  gap: Spacing.md,
  padding: Spacing.md,
};

const fieldButton = {
  ...bordered,
  backgroundColor: Colors.surfaceMuted,
  borderRadius: Radius.md,
  paddingHorizontal: Spacing.md,
  paddingVertical: Spacing.sm,
};

const bodyText = {
  color: Colors.text,
  fontSize: FontSizes.body,
};

// ─── Global styles ───────────────────────────────────────────────────────────

export const GlobalStyles = StyleSheet.create({
  // Layout
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  content: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: surfaceCard,

  // Text
  heading: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
  },
  bodyText,
  fieldLabel: {
    ...bodyText,
    fontWeight: FontWeights.semibold,
  },
  valueLabel: bodyText,
  error: {
    color: Colors.error,
    fontSize: FontSizes.body,
  },

  // Inputs
  input: {
    ...bodyText,
    ...bordered,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  dropdownButton: {
    ...fieldButton,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropdownChevron: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  dropdownOptions: {
    ...bordered,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  dropdownOption: {
    borderBottomColor: Colors.border,
    borderBottomWidth: BorderWidths.hairline,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addCategoryLabel: {
    color: Colors.primary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
  },
  dateButton: {
    ...fieldButton,
    alignSelf: 'flex-start',
  },

  // Buttons
  button: {
    fontSize: FontSizes.large,
    textDecorationLine: 'underline',
    color: Colors.onPrimary,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  submitLabel: {
    color: Colors.onPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  cancelLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
  pressed: {
    opacity: Opacity.pressed,
  },
  status: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  actionTitle: {
    color: Colors.primary,
    fontSize: FontSizes.subtitle,
    fontWeight: 'bold',
  },
  actionDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },

  // Modals
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    ...surfaceCard,
    maxWidth: Layout.modalMaxWidth,
    width: '100%',
  },
  modalActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
});
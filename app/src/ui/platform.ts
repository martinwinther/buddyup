import { Platform, ViewStyle } from 'react-native';

export type PointerEventsValue = 'auto' | 'none' | 'box-none' | 'box-only';

/** Cross-platform pointer events: RN native uses prop, RN-web uses style */
export function pe(value: PointerEventsValue) {
  if (Platform.OS === 'web') {
    return { style: { pointerEvents: value } as ViewStyle };
  }
  return { pointerEvents: value };
}

/** Simple platform shadow: iOS shadow*, Android elevation */
export function cardShadow(style: ViewStyle = {}): ViewStyle {
  if (Platform.OS === 'android') return { ...style, elevation: 4 };
  return {
    ...style,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  };
}

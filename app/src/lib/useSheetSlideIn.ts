import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Slides a bottom sheet up from below the screen with a plain transform.
 *
 * Layout animations (SlideInDown) animate the sheet's layout position, which
 * can make it overshoot and snap when its content height settles inside a
 * modal. Animating translateY keeps the sheet anchored to the bottom.
 */
export function useSheetSlideIn(visible: boolean) {
  const translateY = useSharedValue(Dimensions.get('window').height);

  useEffect(() => {
    if (visible) {
      translateY.value = Dimensions.get('window').height;
      translateY.value = withTiming(0, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      translateY.value = Dimensions.get('window').height;
    }
  }, [visible, translateY]);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
}

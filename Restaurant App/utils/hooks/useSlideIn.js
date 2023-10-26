import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSelector, } from 'react-redux';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


export default function useSlideIn(closeCallback) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShow(true)
  }, [])

  const animateClose = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut, closeCallback);
    setShow(false)
  }, [])

  return [show, animateClose]
}
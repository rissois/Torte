
import { useEffect, useState } from 'react';
import { Keyboard, } from 'react-native';

export default function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const onKeyboardDidShow = e => {
    setKeyboardHeight(e.endCoordinates.height);
  }

  const onKeyboardDidHide = () => {
    setKeyboardHeight(0);
  }

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', onKeyboardDidShow);
    const hide = Keyboard.addListener('keyboardDidHide', onKeyboardDidHide);
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return keyboardHeight;
};
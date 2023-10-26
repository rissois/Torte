import React, { useCallback, } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, SuperLargeText } from '../../utils/components/NewStyledText';
import firebase from 'firebase';
// import { selectIsTableWithMultipleBills } from '../../redux/selectors/selectorsTableStatus';

// See https://reactnative.dev/docs/layoutanimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


export const TypeButton = ({ pressType, type, setPressType, color, setAdd }) => {
  const onPress = useCallback(() => {
    if (type === 'add') {
      setPressType('add')
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setAdd(prev => [...prev, (firebase.firestore().collection('fake').doc()).id])
      setTimeout(() => {
        setPressType('')
      }, LayoutAnimation.Presets.easeInEaseOut.duration)
    }
    else setPressType(prev => prev === type ? '' : type)
  }, [pressType])
  return <TouchableOpacity
    disabled={pressType === 'unvoid'}
    style={[styles.box, styles.pressType, { backgroundColor: pressType === type ? color : undefined }]}
    onPress={onPress}
  >
    <SuperLargeText style={{ letterSpacing: 2 }} center bold >{(type === 'remove' ? 'void/del' : type).toUpperCase()}</SuperLargeText>
  </TouchableOpacity>
}

export const SelectAll = ({ onPress, text }) => {
  return <TouchableOpacity
    style={[styles.box, styles.otherBox,]}
    onPress={onPress}
  >
    <ExtraLargeText style={{ letterSpacing: 2, }} center>{text}</ExtraLargeText>
  </TouchableOpacity>
}

const styles = StyleSheet.create({
  box: {
    borderColor: Colors.white,
    borderWidth: 2,
    marginTop: 12,
  },
  pressType: {
    width: '30%',
    paddingVertical: 8,
  },
  otherBox: {
    width: '62%',
    paddingVertical: 8,
    alignSelf: 'center',
  }

});


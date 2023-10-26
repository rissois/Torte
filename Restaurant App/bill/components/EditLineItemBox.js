import React, { } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  UIManager,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { DefaultText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import Layout from '../../utils/constants/Layout';
import centsToDollar from '../../utils/functions/centsToDollar';

// import { selectIsTableWithMultipleBills } from '../../redux/selectors/selectorsTableStatus';

// See https://reactnative.dev/docs/layoutanimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const QUARTER_WIDTH = (Layout.window.width - (2 * Layout.marHor)) / 4
const FIFTH_WIDTH = (Layout.window.width - (2 * Layout.marHor)) / 5


export const EditLineItemBox = ({ isPurple, isRed, text, onPress, isFifth, isDisabled, subtext, isAlways, isNever, price }) => {
  return <View style={[styles.editBoxContainer, { width: isFifth ? '20%' : '25%', }]}>
    <TouchableOpacity disabled={isDisabled || isAlways || isNever} style={[styles.editBox, { backgroundColor: isDisabled || isAlways || isNever ? Colors.background : isPurple ? Colors.purple : isRed ? Colors.red : Colors.darkgrey, borderColor: isDisabled || isAlways || isNever ? Colors.darkgrey : Colors.white }]} onPress={onPress}>
      {!!isAlways && <LargeText center bold style={{ color: Colors.green }}>ALWAYS</LargeText>}
      {!!isNever && <LargeText center bold red >NEVER</LargeText>}
      <LargeText numberOfLines={2} ellipsizeMode='tail' center style={{ fontWeight: isFifth ? 'bold' : 'normal', color: isDisabled ? Colors.darkgrey : Colors.white }}>{text}</LargeText>
      {!!subtext && <DefaultText ellipsizeMode='tail' center style={{ color: isDisabled ? Colors.darkgrey : Colors.white }}>{subtext}</DefaultText>}
      {/* {!!price && <MediumText style={{ position: 'absolute', top: 2, right: 4 }}>{price}</MediumText>} */}
    </TouchableOpacity>
  </View>
}

const styles = StyleSheet.create({
  editBoxContainer: {
    marginTop: 12,
  },
  editBox: {
    justifyContent: 'center',
    borderWidth: 2,
    padding: 8,
    minHeight: 90,
    marginHorizontal: 8,
  },
  editText: {

  }
});


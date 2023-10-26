
import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import Layout from '../constants/Layout'
import { MediumText } from '../utils/components/NewStyledText';
import TorteGradientLogo from './TorteGradientLogo';


export default function MenuHeader(props) {
  let { leftText, leftFn, rightText, rightFn, logoSize = Layout.window.height * 0.09, showLogo = false } = props

  return (
    <View style={{ flexDirection: 'row', }}>
      <View style={{ flex: 1 }}>
        {!!leftText && <TouchableOpacity style={styles.button} disabled={!leftFn} onPress={() => { leftFn() }}>
          <MediumText>{leftText}</MediumText>
        </TouchableOpacity>}
      </View>
      {showLogo && <TorteGradientLogo size={logoSize} />}
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        {!!rightText && <TouchableOpacity style={styles.button} disabled={!rightFn} onPress={() => { rightFn() }}>
          <MediumText>{rightText}</MediumText>
        </TouchableOpacity>}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 4
  }
});

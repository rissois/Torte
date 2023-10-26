import React from 'react';
import {
  StyleSheet,
  Linking,
  View,
  Text,
} from 'react-native';
// import { useSelector } from 'react-redux';
// import { selectIsEULANeeded } from '../../redux/selectors/selectorsApp';
import { SmallText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';

export default function TermsAndConditions({ navigation, route }) {
  // const isEULANeeded = useSelector(selectIsEULANeeded)

  // if (!isEULANeeded) return null

  return <View style={styles.spacing}>
    <SmallText center>I agree to Torte's</SmallText>
    <SmallText center><Text style={{ color: Colors.green }} onPress={() => Linking.openURL('https://tortepay.com/eula')}>End User License Agreement</Text></SmallText>
    <SmallText center >and <Text style={{ color: Colors.green }} onPress={() => Linking.openURL('https://tortepay.com/privacy')}>Privacy Policy</Text></SmallText>
  </View>
}


const styles = StyleSheet.create({
  spacing: { marginVertical: 8, paddingVertical: 4 },
});
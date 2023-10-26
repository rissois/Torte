import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { MediumText } from '../../utils/components/NewStyledText';
import { MaterialIcons, } from '@expo/vector-icons';

export default function SettingsRow(props) {

  let { text, iconName, iconSize, IconSource = MaterialIcons, onTouch } = props

  return (
    <TouchableOpacity onPress={() => onTouch()}>
      <View style={styles.settingRow}>
        <View style={styles.settingIcon}>
          <IconSource
            name={iconName}
            size={iconSize}
            color={Colors.white}
          />
        </View>
        <MediumText maxScale={1.4} style={styles.settingText}>{text}</MediumText>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'center',
  },
  settingIcon: {
    width: 62,
    alignItems: 'center',
  },
});


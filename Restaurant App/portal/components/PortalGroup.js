import React from 'react';
import {
  StyleSheet,
  View,

} from 'react-native';
import { ExtraLargeText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../utils/constants/Colors';


export default function PortalGroup({ text, isDrag, children, isDelta }) {
  return (
    <View style={styles.groupSpacing}>
      <View style={styles.titleBorder}>
        <ExtraLargeText>{text}</ExtraLargeText>
        {isDrag && <>
          <ExtraLargeText>   (hold and drag </ExtraLargeText>
          <MaterialCommunityIcons
            name='drag'
            size={30}
            color={Colors.white}
          />
          <ExtraLargeText> to reorder {text.toLowerCase()})</ExtraLargeText>
        </>}
        {isDelta && <MaterialCommunityIcons
          name='delta'
          size={30}
          color={Colors.yellow}
          style={{ marginLeft: 10 }}
        />}
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  groupSpacing: {
    marginBottom: 40
  },
  titleBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: Colors.white,
    borderBottomWidth: 1,
    marginBottom: 8,
    paddingBottom: 2,
  },
});


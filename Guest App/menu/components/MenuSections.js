import React, { } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { DefaultText, SmallText } from '../../utils/components/NewStyledText';

// https://react-redux.js.org/api/hooks#useselector-examples

export default function MenuSections({ name = 'Missing section', description }) {
  return <View style={styles.sectionHeaders}>
    <DefaultText bold style={styles.sectionTitle}>{name}</DefaultText>
    {!!description && <SmallText numberOfLines={2} ellipsizeMode='tail'>{description}</SmallText>}
  </View>
}

const styles = StyleSheet.create({
  sectionHeaders: {
    backgroundColor: Colors.darkgrey,
    paddingLeft: 15,
    paddingVertical: 12,

    //iOS shadow
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,

    // Android shadow
    elevation: 4,
  },
  sectionTitle: {
    textTransform: 'uppercase',
  },
});


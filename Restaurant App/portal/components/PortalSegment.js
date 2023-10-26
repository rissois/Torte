import React, { useState, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import capitalize from '../../utils/functions/capitalize';
import { MediumText } from '../../utils/components/NewStyledText';


export default function PortalSegment({ segments = [], values = [], segment, setSegment }) {

  return <View style={styles.segmentContainer}>
    {
      segments.map((text, index) => <TouchableOpacity key={text + index} onPress={() => { setSegment(segments[index]) }}
        style={[styles.segmentView, {
          ...segments.indexOf(segment) === index && {
            backgroundColor: Colors.purple,
            ...index === 0 && { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
            ...index === segments.length - 1 && { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
          },
          ...index !== 0 && {
            borderLeftColor: Colors.lightgrey,
            borderLeftWidth: StyleSheet.hairlineWidth
          }
        }]}>
        <MediumText style={styles.segmentText}>{capitalize(values[index] || text)}</MediumText>
      </TouchableOpacity>)
    }
  </View>
}

const styles = StyleSheet.create({
  segmentContainer: {
    width: '60%',
    alignSelf: 'center',
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: Colors.darkgrey,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.20,
    shadowRadius: 3.30,

    elevation: 4,
  },
  segmentView: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // height: '100%'
  },
  segmentText: {
    paddingVertical: 8,
    color: Colors.white,
    fontSize: 18,
  },
});


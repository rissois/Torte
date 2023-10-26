import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import BackIcon from './BackIcon';


export default function Header({ back, left, right, children, offcenter, backFn }) {
  const [minWidth, setMinWidth] = useState(null)

  return <View style={styles.headerView}>
    <View
      style={[styles.alignedRow, { ...!offcenter && { minWidth } }]}
      onLayout={({ nativeEvent }) => setMinWidth(prev => {
        if (prev < nativeEvent.layout.width) {
          return nativeEvent.layout.width
        }
        return prev
      })}>
      {back && <BackIcon backFn={backFn} />}
      {left}
    </View>
    <View style={{ flex: 1, }}>
      {children}
    </View>
    <View
      onLayout={({ nativeEvent }) => setMinWidth(prev => {
        if (prev < nativeEvent.layout.width) {
          return nativeEvent.layout.width
        }
        return prev
      })}
      style={[styles.alignedRow, { justifyContent: 'flex-end', ...!offcenter && { minWidth } }]}>
      {right}
    </View>
  </View>
}

const styles = StyleSheet.create({
  headerView: {
    zIndex: 10,
    minHeight: 44,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alignedRow: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 16,
  },
});


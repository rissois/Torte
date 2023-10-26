import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import BackIcon from './BackIcon';


export default function Header({ style = {}, back, left, right, children, close, offcenter, backFn, alignStart }) {
  const [minWidth, setMinWidth] = useState(null)

  return <View style={[styles.headerView, { alignItems: alignStart ? 'flex-start' : 'center', ...style }]}>
    <View
      style={[styles.alignedRow, { ...!offcenter && { minWidth } }]}
      onLayout={({ nativeEvent }) => setMinWidth(prev => {
        if (prev < nativeEvent.layout.width) {
          return nativeEvent.layout.width
        }
        return prev
      })}>
      {(back || !!backFn) && <BackIcon {...close && { name: 'close' }} backFn={backFn} />}
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
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
  },
  alignedRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
});


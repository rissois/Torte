import React from 'react';
import {
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '../constants/Colors';


// REMINDER: SAFEAREAVIEW IS JUST PADDING

// To allow for a different color behind the status bar, use unsafeColor
// To allow content beneath the bottom, use noBottom

export default function SafeView(props) {
  return <SafeAreaView
    style={{
      flex: 1,
      backgroundColor: props.unsafeColor || Colors.background,
      // ...props.noBottom && { paddingBottom: insets.bottom }
    }}
    edges={[
      'right',
      'left',
      'top',
      ...(props.noBottom || props.unsafeColor) ? [] : ['bottom'],
    ]}
    {...props}
  />
}
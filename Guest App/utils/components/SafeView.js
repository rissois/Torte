import React from 'react';
import {
  Platform,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Layout from '../constants/Layout';
import Colors from '../constants/Colors';


/*
  WEB
    Resize content to fit screen (e.g. Home): <SafeView>
      * Be careful with Acccessibility font sizes...
    Allow for scroll: <SafeView scroll>
    Scroll with position bottom: Component should be position: 'fixed', bottom: 0

    backgroundColor is unlikely... set the header color on web
*/

export default function SafeView({ backgroundColor = Colors.background, ...rest }) {
  if (Platform.OS === 'web') {
    return <View style={{ height: Layout.window.height, backgroundColor }} {...rest} />
    // return <View style={{ ...scroll ? { height: Layout.window.height } : { flex: 1 }, backgroundColor }} {...rest} />
  }
  return null
  // return <SafeAreaView
  //   style={{
  //     backgroundColor: props.unsafeColor || Colors.background,
  //     // ...props.noBottom && { paddingBottom: insets.bottom }
  //   }}
  //   edges={[
  //     'right',
  //     'left',
  //     'top',
  //     ...(props.noBottom || props.unsafeColor) ? [] : ['bottom'],
  //   ]}
  //   {...props}
  // />
}
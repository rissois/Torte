import React, { useState, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, } from '../../utils/components/NewStyledText';
import BoxGenerator from '../../components/BoxGenerator';
import { DISPLAY_TYPES, SELECTION_BORDER_WIDTH } from '../constants/panel';

export default function PanelDisplay({ displayType, setDisplayType }) {
  const [labelWidth, setLabelWidth] = useState(null)
  return <View>
    <TouchableOpacity onPress={() => setDisplayType(DISPLAY_TYPES.single)}>
      <View style={{ borderWidth: SELECTION_BORDER_WIDTH, borderColor: displayType === DISPLAY_TYPES.single ? Colors.purple : Colors.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 20, }}>
        <View onLayout={({ nativeEvent }) => setLabelWidth(nativeEvent.layout.width)} style={{ width: labelWidth }}>
          <ExtraLargeText center>Single row</ExtraLargeText>
        </View>

        <BoxGenerator top={[1, 1, 1]} />
        <BoxGenerator top={[1, 2]} />
      </View>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => setDisplayType(DISPLAY_TYPES.double)}>
      <View style={{ borderWidth: SELECTION_BORDER_WIDTH, borderColor: displayType === DISPLAY_TYPES.double ? Colors.purple : Colors.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 20, }}>
        <View style={{ width: labelWidth }}>
          <ExtraLargeText center>Double</ExtraLargeText>
          <ExtraLargeText center>row</ExtraLargeText>
        </View>
        <BoxGenerator top={[1, 1, 1]} bottom={[1, 1, 1]} />
        <BoxGenerator top={[2, 1]} bottom={[1, 2]} />
      </View>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => setDisplayType(DISPLAY_TYPES.large)}>
      <View style={{ borderWidth: SELECTION_BORDER_WIDTH, borderColor: displayType === DISPLAY_TYPES.large ? Colors.purple : Colors.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 20, }}>
        <View style={{ width: labelWidth }}>
          <ExtraLargeText center>Large</ExtraLargeText>
        </View>
        <BoxGenerator left bottom={[1]} top={[1]} />
        <BoxGenerator large />
      </View>
    </TouchableOpacity>
  </View>
}

const styles = StyleSheet.create({
  failsFilters: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background + 'DA',
  }
});


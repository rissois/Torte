import { FontAwesome, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Button,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { TextInput, ScrollView, } from 'react-native-web';
import { DefaultText, ExtraLargeText, LargeText, MediumText, SerifText, SuperLargeText, } from '../utils/components/NewStyledText';
import SafeView from '../utils/components/SafeView';
import Colors from '../utils/constants/Colors';
import Layout from '../utils/constants/Layout';
import StyledButton from '../utils/components/StyledButton';
import { longString, testScreenNames, TestScreenNavigator } from './TestScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INDEX = 1

export default function TestScreen2({ navigation, route }) {
  const [height, setHeight] = useState(null)
  const insets = useSafeAreaInsets()

  const array = useMemo(() => longString.split(' '), [])
  return (
    <SafeView scroll>
      <TestScreenNavigator index={INDEX}
        title='Flex'
      />
      <View style={{ flex: 1 }}>
        <LargeText>longString {insets.bottom}</LargeText>
      </View>
      <View style={{ paddingVertical: 20, marginBottom: insets.bottom, backgroundColor: 'purple', }}>
        <LargeText>Bottom element</LargeText>
      </View>
    </SafeView>
  );
}


const styles = StyleSheet.create({

});
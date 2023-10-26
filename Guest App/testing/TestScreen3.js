import { FontAwesome, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Dimensions,
  Button,
  TouchableOpacity,
} from 'react-native';
import { TextInput, ScrollView, } from 'react-native-web';
import { DefaultText, ExtraLargeText, LargeText, MediumText, SerifText, SuperLargeText, } from '../utils/components/NewStyledText';
import SafeView from '../utils/components/SafeView';
import Colors from '../utils/constants/Colors';
import Layout from '../utils/constants/Layout';
import StyledButton from '../utils/components/StyledButton';
import { longString, testScreenNames, TestScreenNavigator } from './TestScreen';

const INDEX = 2
export default function TestScreen3({ navigation, route }) {
  const [height, setHeight] = useState(null)

  const array = useMemo(() => longString.split(' '), [])
  return (
    <SafeView unsafeColor={Colors.black}>
      <TestScreenNavigator index={INDEX}
        title='flex map'
      />
      {
        array.map(item => <LargeText>{item}</LargeText>)
      }
      <View style={{
        paddingVertical: 10, backgroundColor: 'purple', position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
      }}>
        <LargeText>Bottom element</LargeText>
      </View>
    </SafeView>
  );
}


const styles = StyleSheet.create({

});
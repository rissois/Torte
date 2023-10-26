import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import SafeView from '../../utils/components/SafeView';
import { DefaultText, ExtraLargeText, LargeText, MediumText, SuperLargeText } from '../../utils/components/NewStyledText';
import Header from '../../utils/components/Header';
import capitalize from '../../utils/functions/capitalize';
import { useNavigation } from '@react-navigation/native';

export default function FoodScreen({ navigation, route }) {
  const [headerHeight, setHeaderHeight] = useState(null)
  return (
    <SafeView>
      <View onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)}>
        <Header back>
          <ExtraLargeText center>MENU EDITOR</ExtraLargeText>
        </Header>
      </View>
      <View style={{ flex: 1, justifyContent: 'space-evenly', marginBottom: headerHeight }}>
        <Category category='periods' subtext='Connect meals to your hours of operation' example='Periods are required!' />
        <Category category='meals' subtext='Create meals and say when your menus are available' example='Meals are required!' />
        <Category category='menus' />
        <Category category='sections' />
        <Category category='items' />
        <Category category='modifiers' subtext='Let guests customize their items' example='e.g. spice levels, sauces, type of protein' />
        <Category category='options' subtext='Mini-items used for modifiers and upsells' example='e.g. side of fries, wine pairings' />
        <Category category='panels' subtext='Highlight great photos on your menus' />
      </View>
    </SafeView>
  )
}


const Category = ({ category, subtext, example }) => {
  const navigation = useNavigation()

  return <TouchableOpacity onPress={() => navigation.navigate('Category', { category })}>
    <View>
      <SuperLargeText center>{capitalize(category)}</SuperLargeText>
      {!!subtext && <MediumText center>{subtext}</MediumText>}
      {!!example && <DefaultText center>{example}</DefaultText>}

    </View>
  </TouchableOpacity>
}


const styles = StyleSheet.create({

});


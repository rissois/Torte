import React, { useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import SafeView from '../../utils/components/SafeView';
import { ExtraLargeText, MediumText, } from '../../utils/components/NewStyledText';
import Header from '../../utils/components/Header';
import PortalList from '../components/PortalList';
import Layout from '../../utils/constants/Layout';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../utils/constants/Colors';
import StyledButton from '../../utils/components/StyledButton';
import singularize from '../../utils/functions/singularize';
import capitalize from '../../utils/functions/capitalize';


export default function CategoryScreen({ navigation, route }) {
  const category = route.params.category
  const [buttonHeight, setButtonHeight] = useState(0)


  return (
    <SafeView>
      <Header back>
        <ExtraLargeText center>All {category}</ExtraLargeText>
      </Header>

      <View style={{ flex: 1, marginHorizontal: Layout.marHor }}>
        <PortalList
          category={category}
          style={{ paddingTop: buttonHeight }}
        />

        <LinearGradient
          onLayout={({ nativeEvent }) => setButtonHeight(nativeEvent.layout.height)}
          colors={[Colors.background, Colors.background + 'DA', Colors.background + '00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.9, 1]}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingBottom: 20,
          }}>
          {category === ''
            ? <StyledButton center color={Colors.purple} text="Edit periods (hours of operation)" onPress={() => navigation.navigate('Hours')} />
            : <StyledButton center color={Colors.purple} text={`Create a new ${singularize(category)}`} onPress={() => navigation.navigate(capitalize(category))} />}
        </LinearGradient>
      </View>
    </SafeView>
  )
}


const styles = StyleSheet.create({

});


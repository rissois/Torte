import React, { useMemo, } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  Linking,
  FlatList,
  Text,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialIcons, } from '@expo/vector-icons';
import { useNavigation, useLinkTo, } from '@react-navigation/native';

import { BUTTON_SCALE } from '../constants/homeButtons';

import SafeView from '../../utils/components/SafeView';
import { DefaultText, SerifText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import Header from '../../utils/components/Header';
import CodeRestaurantInput from '../components/CodeRestaurantInput.web';

const torteLogoDevTest = async (navigation) => {
  // User ON
  // navigation.navigate('Link', { url: 'https://links.tortepay.com/?link=https%3A%2F%2Ftortepay.com?r=K00IXKl5xiNmsTBYro0dRSK8gtA3&b=UIMMhbbkUpL6aKBHEGW6&apn=com.torte.pay&isi=1491684037&ibi=com.Torte.TortePay&efr=1' })
  // User NOT ON
  // navigation.navigate('Link', { url: 'https://links.tortepay.com/?link=https%3A%2F%2Ftortepay.com?r=K00IXKl5xiNmsTBYro0dRSK8gtA3&b=3GPQogQLf5MUOrL9HlGk&apn=com.torte.pay&isi=1491684037&ibi=com.Torte.TortePay&efr=1' })
  // non-existent
  // navigation.navigate('Link', { url: 'https://links.tortepay.com/?link=https%3A%2F%2Ftortepay.com?r=K00IXKl5xiNmsTBYro0dRSK8gtA3&b=3GPQogQLf5MUOrL9HlGkaw3&apn=com.torte.pay&isi=1491684037&ibi=com.Torte.TortePay&efr=1' })
  //
  // User ON
  navigation.navigate('Link', { url: 'https://links.tortepay.com/?link=https%3A%2F%2Ftortepay.com?r=K00IXKl5xiNmsTBYro0dRSK8gtA3&t=09&apn=com.torte.pay&isi=1491684037&ibi=com.Torte.TortePay&efr=1' })
  // User NOT ON
  // navigation.navigate('Link', { url: 'https://links.tortepay.com/?link=https%3A%2F%2Ftortepay.com?r=K00IXKl5xiNmsTBYro0dRSK8gtA3&t=02&apn=com.torte.pay&isi=1491684037&ibi=com.Torte.TortePay&efr=1' })
  // EMPTY
  // navigation.navigate('Link', { url: 'https://links.tortepay.com/?link=https%3A%2F%2Ftortepay.com?r=K00IXKl5xiNmsTBYro0dRSK8gtA3&t=03&apn=com.torte.pay&isi=1491684037&ibi=com.Torte.TortePay&efr=1' })
  // Non0existent
  // navigation.navigate('Link', { url: 'https://links.tortepay.com/?link=https%3A%2F%2Ftortepay.com?r=K00IXKl5xiNmsTBYro0dRSK8gtA3&t=04awer&apn=com.torte.pay&isi=1491684037&ibi=com.Torte.TortePay&efr=1' })
}

const lorem =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
const List = () => {
  const array = Array(150).fill(lorem);

  return (
    <FlatList
      data={array}
      keyExtractor={text => text}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 50, }}>
          <Text style={{ color: 'white' }}>{item}</Text>
        </View>
      )}
    />
  );
};

export default function HomeScreen({ navigation, route }) {
  const linkTo = useLinkTo()

  return <SafeView>
    <Header >
      <TouchableOpacity disabled={!__DEV__} containerStyle={{ flex: 1 }} onPress={() => torteLogoDevTest(navigation)}>
        <SerifText center>Torte</SerifText>
      </TouchableOpacity>
    </Header>

    <View style={{ flexGrow: 4, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
      <CodeRestaurantInput />
    </View>

    <View style={styles.buttonContainer}>
      <MinorButton
        onPress={() => navigation.navigate('Locations')}
        iconBackgroundColor={Colors.red + 'E9'}
        iconName='location-on'
        text='Restaurants'
        subtext='Explore our restaurants'
      />

      <MinorButton
        onPress={async () => {
          await Linking.openURL('https://www.tortepay.com/about')
        }}
        iconBackgroundColor={Colors.white + 'D9'}
        iconName='language'
        iconColor={Colors.background}
        text='Website'
        subtext='More about Torte'
      />
    </View>
  </SafeView >
}

const MinorButton = ({ iconColor = Colors.white, iconBackgroundColor, iconName, iconStyle = {}, text, subtext, onPress }) => {
  const navigation = useNavigation()
  return (
    <TouchableOpacity style={{ marginVertical: BUTTON_SCALE * 80 }} onPress={onPress}>
      <View style={styles.buttonRow}>
        <View style={[styles.buttonCircle, { backgroundColor: iconBackgroundColor }]}>
          <MaterialIcons
            name={iconName}
            size={Layout.window.height * BUTTON_SCALE * 0.548}
            color={iconColor}
            style={iconStyle}
          />
        </View>

        <View style={styles.buttonTextContainer}>
          <View style={{ flex: 5 }} />
          <DefaultText maxScale={1.2} style={styles.buttonTitle}>{text}</DefaultText>
          <DefaultText maxScale={1.2} lightgrey maxFontSizeMultiplier={1.3} style={styles.buttonDescription}>{subtext}</DefaultText>
          <View style={{ flex: 8 }} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexGrow: 1,
    marginHorizontal: Layout.window.width * 0.1,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
  },
  largeButtonCircle: {
    height: Layout.window.height * BUTTON_SCALE * 2,
    width: Layout.window.height * BUTTON_SCALE * 2,
    borderRadius: Layout.window.height * BUTTON_SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  buttonCircle: {
    marginRight: 20,
    height: Layout.window.height * BUTTON_SCALE * 0.8,
    width: Layout.window.height * BUTTON_SCALE * 0.8,
    borderRadius: Layout.window.height * BUTTON_SCALE * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextContainer: {
  },
  buttonTitle: {
    fontSize: 248 * BUTTON_SCALE,
  },
  buttonDescription: {
    marginTop: 1,
    fontSize: 160 * BUTTON_SCALE,
  },
  largeButtonTitle: {
    fontSize: 280 * BUTTON_SCALE,
  },
  largeButtonDescription: {
    marginTop: 1,
    color: Colors.lightgrey,
    fontSize: 200 * BUTTON_SCALE,
    textAlign: 'center'
  },
});
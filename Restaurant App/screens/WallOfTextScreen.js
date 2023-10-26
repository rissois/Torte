import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, } from 'react-redux';

const pages = {
  menu: {
    header: 'A word on menus',
    body: [
      'Think of Torte menus in the same way you print your current menus.',
      'You may have a lunch menu and a separate dinner menu',
      'You may have a weekday specials menu or a Happy Hour menu',
      'Whenever you would print a separate menu for your restaurant, you’ll likely want to create a new menu.',
      'Do not create unnecessary menus. It becomes confusing for your customers to switch between multiple menus. If you currently only have one menu, we suggest you keep it that way.'
    ]
  },
  item: {
    header: 'A word on items',
    body: [
      'There are three customizable components to each item.',
      [<Text key='specs' style={{ fontWeight: 'bold' }}>Specifications</Text>, ' are questions with multiple answers. For example: choose a spice level or select up to two flavors.'],
      [<Text key='diets' style={{ fontWeight: 'bold' }}>Dietary needs</Text>, ' are highly recommended. Diners consistently request to filter items by need.'],
      [<Text key='add-ons' style={{ fontWeight: 'bold' }}>Add-ons</Text>, ' are a list of options with no minimum or maximum required. You have more flexibility when re-using add-ons than you do specifications.']
    ]
  },
  meal: {
    header: 'A word on meals',
    body: [
      'You may offer different menus at different times of the day. That’s where meals come in.',
      'Meals let you group menus together and define when each menu is available.',
      'You will give each meal an official start and end time, but you can show those menus to your customers a few minutes earlier or later if you prefer.'
    ]
    // skipping customer request item not available on current meals, add to order via Torte POS
    // Skipping table sitting between two meals
  },
  intro: {
    header: 'There are two sections to Torte:\nthe Manager Portal and the Dashboard',
    body: [
      'The Manager Portal let\'s you build your menus and edit the restaurant details.',
      'The Dashboard shows you everything that is going on during service.',

      'Only owners and managers can access the Manager Portal. You will find it on the Dashboard, under the top-left Manage button.',
      'We\'ll quickly set you up as an owner and then introduce you to our Manager Portal. When you are ready, you can explore the Dashboard and set up your tables and employees.',
    ]
    // header: 'Now let\'s look at our \n manager portal',
    // body: [
    //   'We recommend doing this on a computer.\nYou can log in at portal.tortepay.com',
    //   'You will be able to exit and return to finish your menu at any time.'
    // ]
  },
  registered: {
    header: ' is now part of Torte!',
    body: [
      'You will soon receive an email from Torte to set up your payment account.',
      'If you ever want to change this information, you can do so in the Manager Portal'
    ]
  },
  photoAd: {
    header: 'A word on photo ads',
    body: [
      'Photo ads allow you to highlight items with attractive photos between sections.',
      'Start by adding photos your items, then add the photo ad to your menus.',
      'Photo ads really help to break up a large menu, but we don\'t recommend using too many!'
    ]
  },
}


export default function WallOfTextScreen({ navigation, route }) {
  const { name } = useSelector(state => state.restaurant)
  let { page = 'intro', center = false, terminal = false, item_redirect = false } = route?.params ?? {}
  const [headerHeight, setHeaderHeight] = useState(0)

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)} >
          <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} {...false && { rightText: 'Exit', rightFn: () => { } }} />
        </View>
        <DisablingScrollView center={center}>
          <View>
            <HeaderText style={{ textAlign: 'center', marginVertical: Layout.spacer.large }}>{page === 'registered' ? name : ''}{pages[page].header}</HeaderText>
            <View
              style={styles.body}>
              {pages[page].body.map((text, index) => <View key={index} style={{
                ...index && { marginTop: Layout.spacer.medium }
              }}>
                <MainText style={{ textAlign: 'center' }}>{text}</MainText>
              </View>)}
            </View>
            {!terminal && <MenuButton style={{ marginVertical: Layout.spacer.large }} text='Next' buttonFn={() => {
              switch (page) {
                case 'registered':
                  navigation.replace('WallOfText')
                  break;
                case 'intro':
                  navigation.replace('MainStack')
                  break;
                case 'photoAd':
                  navigation.replace('PhotoAd1')
                  break;
                default:
                  // if (item_redirect) {
                  //   navigation.replace('Item')
                  // }
                  // else {
                  navigation.replace('Create', { category: page })
                  // }
                  break;
              }
            }} />}
            {center && <View style={{ height: headerHeight }} />}
          </View>
        </DisablingScrollView>
      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
  body: {
    width: Layout.window.width * 0.7,
    alignSelf: 'center'
  }
});

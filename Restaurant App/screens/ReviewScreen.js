import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { ClarifyingText, HeaderText, LargeText, MainText, } from '../components/PortalText'
import MenuButton from '../components/MenuButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { threeLetterDays } from '../constants/DOTW';
import { useSelector } from 'react-redux';
import { formatPhoneNumber } from './PhoneScreen';
import { TouchableOpacity } from 'react-native-gesture-handler';
import DisablingScrollView from '../components/DisablingScrollview';
import firebase from '../config/Firebase';
import MenuHeader from '../components/MenuHeader';
import useRestaurant from '../hooks/useRestaurant';
//
// const days = {
//   [0]: { text: 'Closed' },
//   [1]: { text: 'Closed' },
//   [2]: { text: ['10:30AM - 2:30PM', '5:30PM - 10:30PM'] },
//   [3]: { text: ['10:30AM - 2:30PM', '5:30PM - 10:30PM'] },
//   [4]: { text: ['5:30PM - Fri'] },
//   [5]: { text: '24 hours' },
//   [6]: { text: ['Fri - 10:30PM'] },
// }

const logoDisplaySize = Layout.window.width * 0.4

export default function InfoReviewScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  const { name, days, address, phone_number = '', taxRates = {} } = useSelector(state => state.restaurant)
  const { private: p = {} } = useSelector(state => state.privateDocs)
  const { private_phone_number = '' } = p
  const { logo = {} } = useSelector(state => state.photos)
  let { uri } = logo

  const [imageHeight, setImageHeight] = useState(null)

  const [widest, setWidest] = useState(null)

  useEffect(() => {
    if (uri) {
      Image.getSize(uri, (width, height) => {
        if (width > height) {
          setImageHeight(height / (width / logoDisplaySize))
        }
        else {
          setImageHeight(null)
        }
      })
    }
    else {
      setImageHeight(null)
    }
  }, [uri])

  const generateHours = () => {
    let rows = []

    for (let i = 0; i < 7; i++) {
      let { text } = days[i]
      if (typeof text === 'string') {
        text = [text]
      }
      rows.push(<View key={i} style={{ flexDirection: 'row', marginBottom: 10 }}>
        <View onLayout={({ nativeEvent }) => {
          setWidest(curr => {
            if (curr < nativeEvent.layout.width) {
              return nativeEvent.layout.width
            }
            return curr
          })
        }} style={{ width: widest }}>
          <LargeText>{threeLetterDays[i]}:</LargeText>
        </View>
        <View style={{ marginLeft: Layout.spacer.small }}>
          {text.map(service => <LargeText key={service}>{service}</LargeText>)}
        </View>

      </View>)
    }

    return rows
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        {route?.params?.back ? <MenuHeader leftText='Back' leftFn={() => { navigation.navigate('Portal') }} /> : <View style={{
          marginBottom: Layout.spacer.medium,
          marginTop: route?.params?.back ? Layout.spacer.small : Layout.spacer.medium
        }}>
          <HeaderText style={{ textAlign: 'center', }}>How does this look?</HeaderText>
        </View>}

        <DisablingScrollView>
          <View style={{ width: Layout.window.width * 0.8, alignSelf: 'center', marginVertical: Layout.spacer.medium }}>
            <View style={{ flexDirection: 'row', marginBottom: Layout.spacer.medium }}>
              <View style={{ marginRight: 40 }}>
                <HeaderText>{name}</HeaderText>
              </View>
              {/* <TouchableOpacity onPress={() => { navigation.push('RestaurantName', { review: true }) }}>
                <ClarifyingText style={{ color: Colors.lightgrey }}>(edit)</ClarifyingText>
              </TouchableOpacity> */}
            </View>

            <View style={{ flexDirection: 'row', marginBottom: Layout.spacer.medium }}>
              <View style={{ marginRight: 40 }}>
                <LargeText>{address.line1}</LargeText>
                {!!address.line2 && <LargeText>{address.line2}</LargeText>}
                <LargeText>{address.city}, {address.state} {address.zip}</LargeText>
              </View>
              <TouchableOpacity onPress={() => { navigation.push('Address', { review: true }) }}>
                <ClarifyingText style={{ color: Colors.lightgrey }}>(edit)</ClarifyingText>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', marginBottom: Layout.spacer.medium }}>
              <View style={{ marginRight: 40 }}>
                <LargeText>Guest contact number: {formatPhoneNumber(phone_number)}</LargeText>
                <LargeText>Torte contact number: {formatPhoneNumber(private_phone_number)}</LargeText>
              </View>
              <TouchableOpacity onPress={() => { navigation.push('Phone', { review: true }) }}>
                <ClarifyingText style={{ color: Colors.lightgrey }}>(edit)</ClarifyingText>
              </TouchableOpacity>
            </View>

            {uri ? <View style={{ flexDirection: 'row', marginBottom: Layout.spacer.medium }}>
              <View style={{ marginRight: 40 }}>
                <Image
                  style={{ width: logoDisplaySize, height: imageHeight ?? logoDisplaySize, }}
                  source={{ uri }}
                  resizeMode='contain'
                />
              </View>
              <TouchableOpacity onPress={() => { navigation.push('Logo', { review: true }) }}>
                <ClarifyingText style={{ color: Colors.lightgrey }}>(edit)</ClarifyingText>
              </TouchableOpacity>
            </View> : <View style={{ flexDirection: 'row', marginBottom: Layout.spacer.medium }}>
              <View style={{ marginRight: 40 }}>
                <LargeText>No logo</LargeText>
              </View>
              <TouchableOpacity onPress={() => { navigation.push('Logo', { review: true }) }}>
                <ClarifyingText style={{ color: Colors.lightgrey }}>(edit)</ClarifyingText>
              </TouchableOpacity>
            </View>}

            <View style={{ flexDirection: 'row', marginBottom: Layout.spacer.medium }}>
              <View style={{ marginRight: 40 }}>
                {generateHours()}
              </View>
              <TouchableOpacity onPress={() => { navigation.push('Hours', { review: true }) }}>
                <ClarifyingText style={{ color: Colors.lightgrey }}>(edit)</ClarifyingText>
              </TouchableOpacity>
            </View>

            {/* <View style={{ flexDirection: 'row', marginBottom: Layout.spacer.medium }}>
              <View style={{ marginRight: 40 }}>
                <HeaderText>Local tax rates</HeaderText>
                <View style={{ marginLeft: 40 }}>
                  {
                    Object.keys(taxRates).length ? Object.keys(taxRates).map(key => <LargeText key={key}>{taxRates[key].name}: {taxRates[key].percent}%</LargeText>) :
                      <LargeText>No tax rates</LargeText>
                  }
                </View>
              </View>
              <TouchableOpacity onPress={() => { navigation.push('Taxes', { review: true }) }}>
                <ClarifyingText style={{ color: Colors.lightgrey }}>(edit)</ClarifyingText>
              </TouchableOpacity>
            </View> */}
          </View>

        </DisablingScrollView>

        {!route?.params?.back && <View style={{ marginTop: Layout.spacer.small, marginBottom: Layout.spacer.medium }}>
          <MenuButton text='Looks good' buttonFn={() => {

            if (restaurant_id === firebase.auth().currentUser?.uid && name !== firebase.auth().currentUser.displayName) {
              firebase.auth().currentUser.updateProfile({
                displayName: name
              })
            }

            navigation.navigate('WallOfText', { page: 'registered' })


          }} />
        </View>}





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


import React, { useState, useEffect, } from 'react';
import {
  View,
  Text,
  Linking,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import Colors from '../../utils/constants/Colors';

import { FlatList, ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { LargeText, DefaultText, MediumText, } from '../../utils/components/NewStyledText';
import { useDispatch } from 'react-redux';
import { fullDays, threeLetterDays } from '../../utils/constants/DOTW';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
// import * as Location from 'expo-location';
import { dateToMilitary, militaryToClock } from '../../utils/functions/dateAndTime';
import { useNavigation } from '@react-navigation/native';
import BackIcon from '../../utils/components/BackIcon';
import Layout from '../../utils/constants/Layout';
import { MaterialIcons } from '@expo/vector-icons';
import useModalCloser from '../../utils/hooks/useModalCloser';
import { useIsMyAccountAdmin } from '../../utils/hooks/useUser';
import { collection, query, getFirestore, getDocs, where } from 'firebase/firestore'
import firebaseApp from '../../firebase/firebase';

const firestore = getFirestore(firebaseApp)

const dateDay = (new Date()).getDay()

export default function LocationsScreen({ navigation }) {
  const isAdmin = useIsMyAccountAdmin()
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [isFetchLocationError, setIsFetchLocationError] = useState(false)

  // useEffect(() => {
  //   (async () => {
  //     let { status } = await Location.requestForegroundPermissionsAsync()
  //     let { status2 } = await Location.requestBackgroundPermissionsAsync()
  //     if (status !== 'granted') {
  //       return
  //     }

  //     let location = await Location.getCurrentPositionAsync({})
  //   })();
  // }, []);


  // Not a useFocusEffect because you cannot join a bill in the background, so the listener is OK to maintain
  useEffect(() => {
    let q = query(collection(firestore, 'Restaurants'))
    if (!isAdmin) q = query(q, where('is_hidden', '==', false))

    getDocs(q).then(querySnapshot => {
      if (!querySnapshot.size) {
        console.log('NO RESTAURANTS')
        setIsFetchLocationError(true)
      }
      else {
        let r = []
        querySnapshot.forEach(doc => {
          r.push({
            ...doc.data()
          })
        })
        r.sort(a => a.is_live)
        setRestaurants(r)
      }

      setLoading(false)
    }).catch(error => {
      setIsFetchLocationError(true)
      console.log('Locations error: ', error)
    })
  }, [])

  useModalCloser('Locations', () => setRestaurant(null))


  return <SafeView >
    <Header back center>
      <LargeText center>Restaurants</LargeText>
      {/* FUTURE SEARCH BAR */}
    </Header>

    <Modal
      visible={!!restaurant}
      animationType='slide'
      transparent={true}
    >
      <RestaurantModal
        restaurant={restaurant}
        close={() => setRestaurant(null)}
      />
    </Modal>

    <FlatList
      data={restaurants}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <Restaurant
        restaurant={item}
        setRestaurant={setRestaurant}
      />}
      ListEmptyComponent={() => (
        <LargeText center style={{ marginVertical: 30 }}>{loading ? 'Loading...' : 'Error getting locations'}</LargeText>
      )}
      ListFooterComponent={() => {
        if (isFetchLocationError) return <DefaultText maxScale={1.7} center bold red style={{ marginVertical: 30 }}>Error fetching restaurants</DefaultText>
        return null
        // if (!paginatedLocations.length) return null
        // if (isEndOfRestaurants) return <DefaultText maxScale={1.7} center>No further restaurants to show</DefaultText>
        // if (isFetchingLocations) return <IndicatorOverlay horizontal text={'Loading more restaurants...'} />
        // return <DefaultText maxScale={1.7} center>Scroll to load more</DefaultText>
      }}
    />
  </SafeView>
}

const openMaps = ({ line1, city, state, zip_code }) => {
  // https://stackoverflow.com/questions/43214062/open-maps-google-maps-in-react-native

  const address = `${line1}, ${city}, ${state} ${zip_code}`
  const root = Platform.select({
    ios: 'maps:0,0?address=',
    android: 'geo:0,0?address=',
  })

  Linking.openURL(root + address)
}

const Restaurant = ({ restaurant, setRestaurant, }) => {
  const { name, description, is_live, meals, address, cuisine, days, price_range, website } = restaurant
  const navigation = useNavigation()

  const has_torte_menus = Object.keys(meals).some(meal_id => meals[meal_id]?.menus?.length)

  return <TouchableOpacity onPress={() => setRestaurant(restaurant)}>
    <View style={styles.restaurantView}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <MediumText bold>{name}</MediumText>
        <DefaultText>{cuisine}   <PriceRange price_range={price_range} /></DefaultText>
        <View style={{ flexDirection: 'row' }}>
          <DefaultText >Today's hours: </DefaultText>
          <Hours days={days} dayIndex={dateDay} isTomorrowRelevant />
        </View>
      </View>

      {
        is_live
          ? <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8 }}
          >
            <QuickButton
              name={has_torte_menus ? 'Menus' : 'no menus'}
              onPress={() => navigation.navigate('Link', { restaurant_id: restaurant.id })}
              disabled={!has_torte_menus}
            />

            <QuickButton
              name='Directions'
              onPress={() => openMaps(address)}
            />

            <QuickButton
              name={`Hours & more`}
              onPress={() => setRestaurant(restaurant)}
            />
          </ScrollView>
          : <MediumText style={{ marginLeft: 16 }} bold>COMING SOON!</MediumText>
      }
    </View>
  </TouchableOpacity>
}

const PriceRange = ({ price_range }) => {
  return <Text>
    {
      ([1, 2, 3, 4]).map(a => <Text key={a.toString()} style={{ color: price_range >= a ? Colors.white : Colors.midgrey }}>$</Text>)
    }
  </Text>
}

const isAllDay = day => day.earliest === '0000' && day.latest === '2400' && day.hours.length === 1

const getHours = (days, dayIndex, is_tomorrow_relevant) => {
  const today = days[dayIndex]
  const tomorrow = days[(dayIndex + 1) % 7]

  if (today.is_closed) return 'Closed' // empty array for closed
  if (is_tomorrow_relevant && today.latest < dateToMilitary(new Date())) {
    for (let i = dayIndex + 1; i < dayIndex + 8; i++) {
      if (!days[i % 7].is_closed) return `Closed now (opens ${militaryToClock(days[i % 7].earliest)} ${threeLetterDays[i % 7]})`
    }
    return 'Closed'
  }

  const firstEndTomorrow = is_tomorrow_relevant && today.is_overnight ? isAllDay(tomorrow) ? `all day ${threeLetterDays[(dayIndex + 1) % 7]}` : militaryToClock(tomorrow.hours[0].end) : null
  if (isAllDay(today)) {
    if (is_tomorrow_relevant) return ['All day - ' + firstEndTomorrow]
    return ['All day']
  }

  let array = []
  today.hours.forEach((hour, index) => array.push(militaryToClock(hour.start) + ' - ' +
    (is_tomorrow_relevant && today.is_overnight && index === today.hours.length - 1 ? firstEndTomorrow : militaryToClock(hour.end, undefined, true))
  ))
  return array
}

const RestaurantModal = ({ restaurant, close }) => {
  const [dayWidth, setDayWidth] = useState(null)

  if (!restaurant) return null

  const { name, days, website: { url }, description, phone, address: { line1, line2, city, state, zip_code }, cuisine, price_range } = restaurant


  return <SafeView >
    <Header left={<BackIcon name='close' backFn={close} />} />

    <ScrollView style={{ marginHorizontal: Layout.marHor, paddingBottom: Layout.scrollViewPadBot }}>
      <View style={styles.modalSegment}>
        <LargeText>{name}</LargeText>
        <DefaultText>{cuisine}   <PriceRange price_range={price_range} /></DefaultText>
        {!!description && <DefaultText>{description}</DefaultText>}

      </View>

      <View style={styles.modalSegment}>
        <DefaultText>{line1}</DefaultText>
        {!!line2 && <DefaultText>{line2}</DefaultText>}
        <DefaultText>{city}, {state} {zip_code}</DefaultText>
      </View>

      <View style={styles.modalSegment}>
        {fullDays.map((fullDay, index) => (
          <View key={fullDay} style={{ flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 2, ...index === dateDay && {} }}>
            <View style={{ minWidth: dayWidth }} onLayout={({ nativeEvent }) => setDayWidth(prev => Math.max(prev, nativeEvent.layout.width))}>
              <DefaultText>{fullDay}   </DefaultText>
            </View>
            <Hours days={days} dayIndex={index} />
          </View>
        ))}
      </View>

      <View style={styles.modalSegment}>
        {!!phone && <ModalButton
          icon='phone'
          color={Colors.green}
          name='Call'
          onPress={() => Linking.openURL(`tel:${phone}`)}
        />}


        {!!url && <ModalButton
          icon='language'
          color={Colors.lightgrey}
          name='Website'
          onPress={() => Linking.openURL(`https://${url}`)}
        />}


        {!!line1 && <ModalButton
          icon='location-on'
          color={Colors.purple}
          name='Directions'
          onPress={() => openMaps({ line1, city, state, zip_code })}
        />}
      </View>
    </ScrollView>
  </SafeView>
}

const Hours = ({ days, dayIndex, isTomorrowRelevant }) => {
  const hours = getHours(days, dayIndex, isTomorrowRelevant)

  if (typeof hours === 'string') return <DefaultText red>{hours}</DefaultText>
  return <View>
    {hours.map(hour => <DefaultText key={hour}>{hour}</DefaultText>)}
  </View>

}

/*
PHONE
Accepts order
accepts pay
HOURS
website
*/



const QuickButton = ({ onPress, name, disabled }) => <TouchableOpacity disabled={disabled} onPress={onPress}>
  <View style={[styles.quickButtons, { backgroundColor: disabled ? null : Colors.darkgrey, }]}>
    <DefaultText>{name}</DefaultText>
  </View>
</TouchableOpacity>

const ModalButton = ({ onPress, name, icon, color }) => (
  <TouchableOpacity onPress={onPress} style={{ marginVertical: 6 }}>
    <View style={[styles.modalButton, { borderColor: color }]}>
      <View style={{ flex: 1, marginRight: 12, alignItems: 'flex-end' }}>
        <MaterialIcons
          name={icon}
          color={color}
          size={26}
        />
      </View>
      <MediumText bold style={{ color, letterSpacing: 2, }}>{name}</MediumText>
      <View style={{ flex: 1 }} />
    </View>
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  restaurantView: {
    borderBottomColor: Colors.lightgrey,
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  quickButtons: {
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 40,
  },
  modalSegment: {
    marginBottom: 15,
    paddingBottom: 14,
    borderBottomColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: Layout.marHor,
    borderWidth: 2,
    borderRadius: 8
  }
});
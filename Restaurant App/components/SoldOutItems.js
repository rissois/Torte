import React, { useEffect, useState, } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity
} from 'react-native';

import firebase from '../config/Firebase';
import { HeaderText, MainText, ClarifyingText, } from '../components/PortalText'
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { useSelector, } from 'react-redux';
import useRestaurant from '../hooks/useRestaurant';

const toggleSoldOut = async (restaurant_id, item_id, prev) => {
  try {
    firebase.firestore().collection('restaurants').doc(restaurant_id)
      .collection('restaurantItems').doc(item_id)
      .update({
        sold_out: !prev
      })
  }
  catch (error) {
    console.log('itemScreen switch error: ', error)
    Alert.alert(`Could not ${prev ? 'unmark' : 'mark'}`, 'Please try again. Contact Torte support if the issue persists.')
  }
}


export default function SoldOutItems({ isManager, closeModal }) {
  let { items = {} } = useSelector(state => state)


  const [itemsByName, setItemsByName] = useState([])
  const [soldOutItems, setSoldOutItems] = useState([])

  useEffect(() => {
    let ibn = Object.keys(items).sort((a, b) => items[a].name > items[b].name)
    setItemsByName(ibn)
    setSoldOutItems(ibn.filter(item_id => items[item_id].sold_out))
  }, [items])


  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
    <View style={{ flexDirection: 'row', padding: 12, }}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={closeModal}>
          <MaterialIcons
            name='arrow-back'
            size={38}
            color={Colors.softwhite}
          />
        </TouchableOpacity>
      </View>
      <HeaderText>Sold out items</HeaderText>
      <View style={{ flex: 1 }}></View>
    </View>
    <ScrollView contentContainerStyle={{}} style={{ backgroundColor: Colors.background, }} >
      <View style={{ paddingVertical: 30, }}>
        {
          soldOutItems.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {soldOutItems.map(item_id => {
              if (!items[item_id]) {
                return null
              }
              return <Item key={item_id} item={items[item_id]} item_id={item_id} />
            })}
          </View> :
            <HeaderText center>All items are available</HeaderText>
        }
      </View>
      <View
        style={{
          marginHorizontal: Layout.window.width * 0.15,
          height: 1,
          backgroundColor: Colors.lightgrey
        }}
      />
      <View style={{
        flexDirection: 'row', flexWrap: 'wrap',
        paddingTop: 30
      }}>
        {
          itemsByName.map(item_id => {
            return <Item key={item_id} item={items[item_id]} item_id={item_id} />
          })
        }
      </View>
    </ScrollView>
  </SafeAreaView>
}




const styles = StyleSheet.create({


});

function Item(props) {
  const restaurant_id = useRestaurant()
  let { item: { name, internal_name, sold_out }, item_id } = props
  return <View style={{
    width: Layout.window.width * 0.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  }}>
    <TouchableOpacity onPress={() => { toggleSoldOut(restaurant_id, item_id, sold_out); }}>
      <View style={{
        backgroundColor: sold_out ? Colors.red : Colors.darkgrey,
        paddingHorizontal: 12,
        paddingVertical: 16,
        borderRadius: 12,
      }}>
        <MainText>{name}</MainText>
        {!!internal_name && <ClarifyingText>{internal_name}</ClarifyingText>}
      </View>
    </TouchableOpacity>
  </View>;
}


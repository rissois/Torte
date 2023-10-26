import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Alert,
  FlatList
} from 'react-native';
import filterTitles from '../constants/filterTitles';

import firebase from '../config/Firebase';

import { useFocusEffect, } from '@react-navigation/native';

import Colors from '../constants/Colors';
import { useSelector, } from 'react-redux';
import { HeaderText, MainText } from './PortalText';

import { MaterialIcons, } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import BillItemOrder from './BillItemOrder';
import capitalize from '../functions/capitalize';
import commaList from '../functions/commaList';
import centsToDollar from '../functions/centsToDollar';
import transactEditBill from '../transactions/transactEditBill';
import useRestaurant from '../hooks/useRestaurant';

export default function EditItems({ bill_id, closeModal, valid, invalidAlert }) {
  let { bills } = useSelector(state => state)
  const restaurant_id = useRestaurant()

  let bill = bills[bill_id] ?? {}

  let {
    pay: {
      format_locked,
      seats,
    },

  } = bill
  let paid = !!bill.paid
  const [billItems, setBillItems] = useState({})
  const [selectedItem, setSelectedItem] = useState('')

  // MUST ALSO CHECK THE SEATS!!!

  useEffect(() => {
    if (!valid) {
      invalidAlert()
    }
  }, [valid])

  useFocusEffect(useCallback(() => {
    firebase.firestore().collection('restaurants').doc(restaurant_id)
      .collection('bills').doc(bill_id)
      .collection('billItems').onSnapshot(snapshot => {
        setBillItems(prev => {
          let next = { ...prev }
          snapshot.docChanges().forEach(function (change) {
            let item_id = change.doc.id
            if (change.type === "added" || change.type === "modified") {
              next = { ...next, [item_id]: change.doc.data() }
            }
            if (change.type === "removed") {
              delete next[item_id]
            }
          });

          return next
        })
      })
  }, [bill_id]))

  const alreadyPaidItem = useCallback((item) => {
    if ((format_locked.user_all || format_locked.num_splits) && paid) {
      return true
    }
    return Object.keys(item?.seats?.paidUnits ?? {}).length || Object.keys(item?.users?.paidUnits ?? {}).length
  }, [format_locked, paid])

  const alreadyTakenItem = (item) => {
    if (Object.keys(item?.users?.takenUnits ?? {}).length) {
      return 'item'
    }

    if (Object.keys(item?.seats?.takenUnits ?? {}).some(seat_id => seats[seat_id]?.billUser.id)) {
      return 'seat'
    }
    return ''
  }

  if (selectedItem) {
    return <BillItemOrder
      bill_id={bill_id}
      existing_id={selectedItem}
      billItem={billItems[selectedItem]}
      {...billItems[selectedItem].menu_reference}
      full_item_position={billItems[selectedItem].position}
      close={() => setSelectedItem('')}
      invalidAlert={invalidAlert}
      valid={valid}
      validSeat={alreadyTakenItem(billItems[selectedItem]) !== 'seat'}
    />
  }

  return <View style={{ flex: 1, backgroundColor: Colors.background }}>
    <SafeAreaView style={{ flex: 1, }}>
      <View style={{ flexDirection: 'row', margin: 16, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => {
            if (selectedItem) {
              setSelectedItem(false)
            }
            else {
              closeModal()
            }
          }}>
            <MaterialIcons
              name='arrow-back'
              size={36}
              color={Colors.softwhite}
            />
          </TouchableOpacity>
        </View>
        <HeaderText>Edit / delete item</HeaderText>
        <View style={{ flex: 1 }} />
      </View>

      <MainText center>Items in red are already paid and must be voided to change</MainText>

      <View style={{ flex: 1, marginVertical: 20 }}>

        <FlatList
          contentContainerStyle={styles.flatlist}
          data={Object.keys(billItems).sort((a, b) => billItems[a].name.toLowerCase() > billItems[b].name.toLowerCase())}
          keyExtractor={item_id => item_id}
          renderItem={({ item: item_id }) => {
            return <RenderItem
              item={billItems[item_id]}
              paid={alreadyPaidItem(billItems[item_id])}
              taken={alreadyTakenItem(billItems[item_id])}
              selectItem={() => { setSelectedItem(item_id) }}
              bill_id={bill_id}
              item_id={item_id}
              restaurant_id={restaurant_id}
              valid={valid}
              invalidAlert={invalidAlert}
            />

          }}
        />
      </View>


    </SafeAreaView>
  </View >
}

const RenderItem = ({ item = {}, paid, taken, selectItem, bill_id, item_id, restaurant_id, valid, invalidAlert }) => {
  // YOU HAVE A LOT OF SPACE
  return <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, }}>

    <TouchableOpacity containerStyle={{ flex: 1 }} onPress={() => {
      if (taken) {
        Alert.alert('This item has already been selected by a diner' + (taken === 'seat' ? ' as part of a seat.' : '.'), `Please ask the table to unselect the ${taken} to make a change.`)
      }
      else if (paid) {
        Alert.alert('This item has already been paid for.', 'You cannot make changes to an item that has already been paid') //`You must void the payment(s) if you want to make changes.`)
      }
      else if (!valid) {
        invalidAlert()
      }
      else {
        selectItem()
      }
    }}>
      <View style={[styles.item, { backgroundColor: paid ? Colors.red : taken || !valid ? null : Colors.darkgrey }]}>
        <View style={{ flexDirection: 'row' }}>
          <MainText numberOfLines={1} ellipsis_mode='tail' style={{ flex: 1 }}>{item.name.toUpperCase()}</MainText>
          <MainText numberOfLines={1} ellipsis_mode='tail'>{centsToDollar(item.total)}</MainText>
        </View>
        {
          // Each filter gets it's own line
          !!item.filters && Object.keys(item.filters).map(filter => <Text key={filter} style={styles.ticketItemText}>{filterTitles[filter]}</Text>)
        }
        {
          !!item.specifications && Object.keys(item.specifications).map(spec_id => <Text key={spec_id} style={styles.ticketItemText}>{capitalize(item.specifications[spec_id].name)}: {commaList(item.specifications[spec_id].options.map(option => (option.quantity > 1 ? option.quantity + 'X ' : '') + option.name))}</Text>)
        }
        {
          !!item.modifications && Object.keys(item.modifications).map(mod_id => <Text key={mod_id} style={styles.ticketItemText}>{(item.modifications[mod_id].quantity > 1 ? item.modifications[mod_id].quantity + 'X ' : '') + item.modifications[mod_id].name}</Text>)
        }
        {
          !!item.comment && <Text key={'comment'} style={styles.ticketItemText}>{item.comment}</Text>
        }

      </View>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => {
      if (taken) {
        Alert.alert('This item has already been selected by a diner' + (taken === 'seat' ? ' as part of a seat.' : '.'), `Please ask the table to unselect the ${taken} to make a change.`)
      }
      else if (paid) {
        Alert.alert('This item has already been paid for.', 'You cannot make changes to an item that has already been paid') //`You must void the payment(s) if you want to make changes.`)
      }
      else if (!valid) {
        invalidAlert()
      }
      else {
        Alert.alert('Delete this item?', 'Users will no longer be asked to pay for this item.', [
          {
            text: 'Yes',
            onPress: async () => {
              try {
                await transactEditBill(restaurant_id, bill_id, undefined, item_id)
              }
              catch (error) {
                console.log('transactEditBill error: ', error)
                Alert.alert('Failed to delete item')
              }
            }
          },
          {
            text: 'No, cancel',
            style: 'cancel',
          },

        ])
      }
    }}>
      <MaterialIcons
        name='remove-circle'
        color={paid || taken || !valid ? Colors.darkgrey : Colors.red}
        size={50}
        style={{ paddingHorizontal: 15, marginHorizontal: 15 }}
      />
    </TouchableOpacity>
  </View>
}


const styles = StyleSheet.create({
  flatlist: {
    marginHorizontal: 40,
  },
  item: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 80,
  },
  ticketItemText: {
    marginLeft: 20,
    color: Colors.softwhite,
    fontSize: 22,
  },

});


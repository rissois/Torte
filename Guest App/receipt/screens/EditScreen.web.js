import React, { useState, useEffect, useRef, useMemo, useCallback, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { getFirestore, collection, doc, runTransaction, arrayRemove, increment, arrayUnion, serverTimestamp } from 'firebase/firestore'
import firebaseApp from '../../firebase/firebase';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { selectReceiptCreatedAsDate, selectReceiptEditSummary, selectReceiptID, selectReceiptIsApproved, selectRestaurantName } from '../../redux/selectors/selectorsReceipt';
import { DefaultText, ExtraLargeText, LargeText, MediumText, SmallText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Colors from '../../utils/constants/Colors';
import centsToDollar from '../../utils/functions/centsToDollar';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import Layout from '../../utils/constants/Layout';
import { selectReceiptGroups, selectReceiptSubtotal } from '../../redux/selectors/selectorsReceiptGroups';
import useModalCloser from '../../utils/hooks/useModalCloser';

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import StyledButton from '../../utils/components/StyledButton';
import { dateToCalendar, dateToClock } from '../../utils/functions/dateAndTime';
import Cursor from '../../utils/components/Cursor';
import MainAlert from '../../utils/components/MainAlert';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import ReceiptHeader from '../components/ReceiptHeader';
import { doReceiptIsEditing } from '../../redux/actions/actionsReceipt.web';
import plurarize from '../../utils/functions/plurarize';

const firestore = getFirestore(firebaseApp)

const identicalGroups = (g1, g2) => g1.name === g2.name
  && g1.subtotal === g2.subtotal
  && g1.position === g2.position
  && g1.captions.length === g2.captions.length
  && g1.captions.every((t, i) => t === g2.captions[i])

export default function EditScreen({ navigation, route }) {
  const closeAllModals = useCallback(() => {
    setIsEditRestaurant(false)
    setEditGroupID('')
    setIsEditSummary(false)
  }, [])
  useModalCloser('Edit', closeAllModals)

  const tabBarHeight = useBottomTabBarHeight();
  const dispatch = useDispatch()

  const receiptID = useSelector(selectReceiptID)
  const isApproved = useSelector(selectReceiptIsApproved)
  const [isSaving, setIsSaving] = useState(false)

  const detectedRestaurantName = useSelector(selectRestaurantName)
  const [restaurantName, setRestaurantName] = useState(detectedRestaurantName)
  const [isEditRestaurant, setIsEditRestaurant] = useState(false)

  // Must build changing date of receipt at some point
  const receiptCreatedAsDate = useSelector(selectReceiptCreatedAsDate)

  const receiptGroups = useSelector(selectReceiptGroups)
  const [quantityWidth, setQuantityWidth] = useState(null)
  const [priceWidth, setPriceWidth] = useState(null)
  const [groupEdits, setGroupEdits] = useState({})
  const groupIDs = useMemo(() => Object.keys(groupEdits).sort((a, b) => groupEdits[a].position - groupEdits[b].position), [groupEdits])
  const lastPosition = useMemo(() => Object.values(groupEdits).reduce((max, { position }) => max > position ? max : position, 0), [groupEdits])
  const [editGroupID, setEditGroupID] = useState('')

  const {
    subtotal: detectedSubtotal,
    tax: detectedTax,
    total: detectedTotal,
    gratuity: detectedGratuity
  } = useSelector(selectReceiptEditSummary, shallowEqual)
  const currentSubtotal = useSelector(selectReceiptSubtotal)
  const subtotal = useMemo(() => {
    return Object.values(groupEdits).reduce((sum, { subtotal, quantity }) => quantity ? sum + subtotal : sum, 0)
  }, [groupEdits])
  const [tax, setTax] = useState(detectedTax)
  const [gratuity, setGratuity] = useState(detectedGratuity)
  const [isEditSummary, setIsEditSummary] = useState(false)

  useEffect(() => {
    setGroupEdits(prev => {
      let copy = { ...prev }

      Object.keys(receiptGroups).forEach(id => {
        const group = receiptGroups[id]

        // Add group
        if (!copy[id]) return copy[id] = group

        // Determine if the "old" is incorrect
        if (copy[id].old) {
          // Old is correct, do not change
          if (identicalGroups(copy[id].old, group)) return
          // New edit is correct, overwrite the old
          else if (identicalGroups(copy[id], group)) return copy[id] = { ...copy[id], old: null }
          // Old is incorrect, replace
          return copy[id] = { ...copy[id], old: group }
        }

        // Current is correct, do not change
        if (identicalGroups(copy[id], group)) return
        // Old is incorrect, replace
        return copy[id] = { ...copy[id], old: group }
      })

      return copy
    })
  }, [receiptGroups])


  const isAltered = useMemo(() =>
    restaurantName !== detectedRestaurantName
    || tax !== detectedTax
    || gratuity !== detectedGratuity
    // Altered if !unclaimed (e.g. new items) or if old
    || Object.values(groupEdits).some(({ old, unclaimed }) => !unclaimed || old)
    , [restaurantName, detectedRestaurantName, tax, detectedTax, gratuity, detectedGratuity, groupEdits])

  useEffect(() => {
    dispatch(doReceiptIsEditing(isAltered))
  }, [isAltered])

  const isSubtotalWarning = useMemo(() => !isApproved && detectedSubtotal !== currentSubtotal, [isApproved, detectedSubtotal, currentSubtotal])
  const isTotalWarning = useMemo(() => !isApproved && (detectedTotal !== detectedSubtotal + detectedTax), [isApproved, detectedTotal, detectedSubtotal, detectedTax])

  const save = async (skipWarning) => {
    if (isApproved && !isAltered) return navigation.navigate('Divide')
    if (!restaurantName) return dispatch(doAlertAdd('Please add a restaurant name'))
    if (!skipWarning) if (isSubtotalWarning || isTotalWarning) return dispatch(doAlertAdd(
      'WARNING does everything look right?',
      [
        'Sorry, our text detection was not perfect. Please check that the following are correct:',
        ...isSubtotalWarning && [`We expected all items to add up to ${detectedSubtotal} but only found ${currentSubtotal}. You currently have ${subtotal}.`],
        ...isTotalWarning && [`We expected all items to add up to ${detectedTotal} but only found ${currentSubtotal + detectedTax}. You current have ${subtotal + tax}.`],
      ],
      [
        {
          text: 'Everything is correct',
          onPress: () => save(true)
        },
        {
          text: 'Go back and edit'
        }
      ]
    ))

    try {
      setIsSaving(true)
      // NOTE: Could also remove unitGroups, and just delete then add
      await runTransaction(firestore, async transaction => {
        const receiptRef = doc(firestore, 'Receipts', receiptID)

        const receipt = (await transaction.get(receiptRef)).data()
        const { summary: { tips }, } = receipt

        let addGroups = {}
        let silentGroups = {} // i.e. does not change the subtotal of the item
        let unitGroups = {}
        let deleteItemIDs = []
        let unitItemIDs = []

        for (let i = 0, keys = Object.keys(groupEdits); i < keys.length; i++) {
          const group_id = keys[i]
          const group = groupEdits[group_id]

          // All new (otherwise type of unclaimed is array)
          if (!group.unclaimed) addGroups[group_id] = group;

          // No edits
          else if (!group.old) { } // No edits

          // Silent change
          else if (group.subtotal === group.old.subtotal && group.quantity === group.old.quantity) silentGroups[group_id] = group

          // Price per is actually unchanged, just silent + add or delete
          else if ((group.subtotal / group.quantity) === (group.old.subtotal / group.old.quantity) && !(group.subtotal % group.quantity)) {
            if (group.quantity > group.old.quantity) {
              silentGroups[group_id] = { ...group, quantity: group.old.quantity } // No need to adjust subtotal (unused)
              const addQuantity = group.quantity - group.old.quantity
              const each = group.subtotal / group.quantity
              addGroups[group_id] = { ...group, quantity: addQuantity, subtotal: each * addQuantity }
            }
            else {
              // Try to delete only the unclaimed by starting with claimed items
              const receipt_item_ids = [...group.claimed, ...group.unclaimed]
              silentGroups[group_id] = { ...group, combined: receipt_item_ids.slice(0, group.quantity) }
              deleteItemIDs.push(...receipt_item_ids.slice(group.quantity))
            }
          }
          // Price per changes, perhaps with quantity change
          else {
            if (group.quantity > group.old.quantity) {
              const editQuantity = group.old.quantity
              const addQuantity = group.quantity - editQuantity

              let editSubtotal = 0
              let addSubtotal = 0
              // Pluck off each add item from the editSubtotal
              for (let i = group.quantity, sub = group.subtotal; i > 0; i--) {
                if (i > addQuantity) editSubtotal += Math.round(sub / i)
                else addSubtotal += Math.round(sub / i)
                sub -= Math.round(sub / i)
              }

              unitGroups[group_id] = { ...group, quantity: editQuantity, subtotal: editSubtotal }
              unitItemIDs.push(...group.unclaimed, ...group.claimed)
              addGroups[group_id] = { ...group, quantity: addQuantity, subtotal: addSubtotal }
            }
            else if (group.quantity === group.old.quantity) {
              unitGroups[group_id] = { ...group }
              unitItemIDs.push(...group.unclaimed, ...group.claimed)
            }
            else {
              // Again, try to preserve the claimed items
              const receipt_item_ids = [...group.unclaimed, ...group.claimed]
              unitGroups[group_id] = { ...group, }
              unitItemIDs.push(...receipt_item_ids.slice(0, group.quantity))
              deleteItemIDs.push(...receipt_item_ids.slice(group.quantity))
            }
          }
        }

        const deleteSnapshots = await Promise.all(deleteItemIDs.map(receipt_item_id => transaction.get(doc(receiptRef, 'ReceiptItems', receipt_item_id))))
        const unitSnapshots = await Promise.all(unitItemIDs.map(receipt_item_id => transaction.get(doc(receiptRef, 'ReceiptItems', receipt_item_id))))

        deleteSnapshots.forEach(snapshot => {
          const { units, } = snapshot.data()

          Object.keys(units.claimed).forEach(user_id => {
            let userSubtotal = 0
            let userOverage = 0
            for (let i = 0, userUnits = units.claimed[user_id]; i < userUnits.length; i++) {
              userSubtotal += userUnits[i].subtotal
              userOverage += userUnits[i].overage
            }
            transaction.set(receiptRef, {
              user_status: { [user_id]: { subtotal: increment(-userSubtotal) } }
            }, { merge: true })

            transaction.set(doc(receiptRef, 'ReceiptUsers', user_id), {
              claim_summary: { subtotal: increment(-userSubtotal), overage: increment(-userOverage), receipt_item_ids: arrayRemove(snapshot.id) }
            }, { merge: true })
          })

          transaction.delete(snapshot.ref)

          transaction.set(receiptRef, {
            // Do not worry about the summary, that is handled separately!
            receipt_item_status: { claimed: arrayRemove(snapshot.id), ordered: arrayRemove(snapshot.id) }
          }, { merge: true })

        })

        unitSnapshots.forEach(snapshot => {
          const { units, group_id } = snapshot.data()
          const group = unitGroups[group_id]
          const newSubtotal = Math.round(group.subtotal / group.quantity)

          // Adjust the group's subtotal and quantity, just in case sub%qty !== 0 (i.e. price per is not equal across all entire group)
          group.subtotal -= newSubtotal
          group.quantity -= 1

          // Largely duplicated from delete above
          Object.keys(units.claimed).forEach(user_id => {
            let userSubtotal = 0
            let userOverage = 0
            for (let i = 0, userUnits = units.claimed[user_id]; i < userUnits.length; i++) {
              userSubtotal += userUnits[i].subtotal
              userOverage += userUnits[i].overage
            }
            transaction.set(receiptRef, {
              user_status: { [user_id]: { subtotal: increment(-userSubtotal) } }
            }, { merge: true })

            transaction.set(doc(receiptRef, 'ReceiptUsers', user_id), {
              claim_summary: { subtotal: increment(-userSubtotal), overage: increment(-userOverage), receipt_item_ids: arrayRemove(snapshot.id) }
            }, { merge: true })
          })

          transaction.set(snapshot.ref, {
            units: {
              denom: 1,
              available: [{ subtotal: newSubtotal, overage: 0 }],
              claimed: {},
            },
            name: group.name,
            captions: group.captions,
            position: group.position,
            summary: { subtotal: newSubtotal },
          }, { merge: true })

          transaction.set(receiptRef, {
            // Do not worry about the summary, that is handled separately!
            receipt_item_status: { claimed: arrayRemove(snapshot.id), ordered: arrayUnion(snapshot.id) }
          }, { merge: true })
        })

        Object.keys(silentGroups).forEach(group_id => {
          const group = silentGroups[group_id]
          let silentIds = group.combined ?? [...group.unclaimed, ...group.claimed]
          silentIds.forEach(receipt_item_id => {
            transaction.set(doc(receiptRef, 'ReceiptItems', receipt_item_id), {
              name: group.name,
              captions: group.captions
            }, { merge: true })
          })
        })

        Object.keys(addGroups).forEach(group_id => {
          const group = addGroups[group_id]

          // Alternative approach is round with subtotal-= and quantity-=1
          // const floor = Math.floor(group.subtotal / group.quantity)
          // let remainder = group.subtotal % group.quantity
          // const individualSubtotal = remainder > 0 ? floor + 1 : floor

          for (let i = group.quantity; i > 0; i--) {
            const individualSubtotal = Math.round(group.subtotal / i)
            group.subtotal -= individualSubtotal

            const receiptItemRef = doc(collection(receiptRef, 'ReceiptItems'))

            transaction.set(receiptItemRef, {
              id: receiptItemRef.id,
              receipt_id: receiptID,
              units: {
                denom: 1,
                available: [{ subtotal: individualSubtotal, overage: 0 }],
                claimed: {},
              },
              timestamps: { created: serverTimestamp() },
              name: group.name,
              captions: group.captions,
              position: group.position,
              summary: { subtotal: individualSubtotal },
              detected: null,
              group_id,
            }, { merge: true })

            transaction.set(receiptRef, {
              receipt_item_status: { ordered: arrayUnion(receiptItemRef.id) }
            }, { merge: true })
          }
        })

        // Can test against receipt
        transaction.set(receiptRef, {
          restaurant: { name: restaurantName },
          summary: { subtotal, tax, total: subtotal + tax, gratuity, final: subtotal + tax + gratuity + tips },
          is_approved: true
        }, { merge: true })
      })

      setIsSaving(false)
      navigation.navigate('Divide', { isFirst: !isApproved })
    }
    catch (error) {
      console.log(`EditScreen save error: ${error}`)
      dispatch(doAlertAdd('Error saving changes', error.message))
      setIsSaving(false)
    }
  }

  return (
    <SafeView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditRestaurant}
      >
        <EditRestaurant {...{ restaurantName, setRestaurantName, setIsEditRestaurant }} />
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!editGroupID}
      >
        <EditGroup
          group={groupEdits[editGroupID]}
          receiptGroupID={editGroupID}
          numClaimed={receiptGroups[editGroupID]?.claimed?.length || 0}
          {...{ setGroupEdits, setEditGroupID }} />
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditSummary}
      >
        <EditSummary {...{ tax, setTax, gratuity, setGratuity, subtotal, setIsEditSummary }} warnSubtotal={isSubtotalWarning && centsToDollar(detectedSubtotal)} warnTotal={isTotalWarning && centsToDollar(detectedTotal)} />
      </Modal>

      <ReceiptHeader qr={isApproved} />

      <FlatList
        style={{ flex: 1 }}
        data={groupIDs}
        keyExtractor={item => item}
        contentContainerStyle={{ marginHorizontal: 20, paddingBottom: Layout.scrollViewPadBot }}
        indicatorStyle='white'
        ListHeaderComponent={() => {
          return <View>
            <View style={{ paddingVertical: 12 }}>
              <TouchableOpacity style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }} onPress={() => setIsEditRestaurant(true)}>
                <AntDesign name="edit" color={Colors.green} size={20} style={{ marginRight: 8 }} />
                <LargeText style={{ marginHorizontal: 8 }}>{restaurantName}</LargeText>
                <AntDesign name="edit" size={20} style={{ opacity: 0 }} />
              </TouchableOpacity>
              {/* <TouchableOpacity style={{ alignSelf: 'center', marginTop: 4 }}>
              <MediumText>{dateToCalendar(receiptCreatedAsDate)}   {dateToClock(receiptCreatedAsDate)}</MediumText>
            </TouchableOpacity> */}
            </View>

            <View style={{ flexDirection: 'row' }}>
              <View onLayout={({ nativeEvent }) => setQuantityWidth(prev => Math.max(prev, nativeEvent.layout.width))}>
                <View style={[styles.columnHeaders, { minWidth: quantityWidth, alignSelf: 'center' }]}>
                  <SmallText>Qty</SmallText>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <View style={[styles.columnHeaders, { alignSelf: 'flex-start', marginHorizontal: 10 }]}>
                  <SmallText>Name (and descriptions)</SmallText>
                </View>
              </View>
              <View onLayout={({ nativeEvent }) => setPriceWidth(prev => Math.max(prev, nativeEvent.layout.width))}>
                <View style={[styles.columnHeaders, { minWidth: priceWidth, alignSelf: 'flex-end' }]}>
                  <SmallText>Grp price</SmallText>
                </View>
              </View>
            </View>
          </View>
        }}
        renderItem={({ item: receiptGroupID }) => (
          <ReceiptGroup
            group={groupEdits[receiptGroupID]}
            numClaimed={receiptGroups[receiptGroupID]?.claimed?.length || 0}
            {...{ receiptGroupID, quantityWidth, setQuantityWidth, priceWidth, setPriceWidth, setEditGroupID }}
          />
        )}
        ListFooterComponent={() => {
          return <View style={{ alignItems: 'center', marginTop: 20 }}>
            {/* !isApproved && detectedSubtotal !== subtotal && (section to add item that makes the difference) */}
            <TouchableOpacity onPress={() => {
              const id = doc(collection(firestore, 'fake')).id
              setGroupEdits(prev => ({ ...prev, [id]: { name: '', captions: [], position: lastPosition + 1, subtotal: 0, quantity: 1, } }))
              setEditGroupID(id)
            }}>
              <View style={{ flexDirection: 'row', padding: 10 }}>
                <MaterialIcons name='add-circle-outline' color={Colors.green} size={24} />
                <LargeText style={{ marginHorizontal: 30 }}>ADD AN ITEM</LargeText>
                <MaterialIcons name='add-circle-outline' color={Colors.green} size={24} />
              </View>
            </TouchableOpacity>
          </View>
          // BIG section to add + - if detected subtotal !==  detected total
        }}
      />

      <View style={{ marginHorizontal: 30, marginBottom: tabBarHeight, paddingVertical: 8, borderTopColor: Colors.white, borderTopWidth: 1, paddingHorizontal: 20, marginTop: 8 }}>
        {/* WARN detected subtotal !== subtotal */}
        <TouchableOpacity onPress={() => setIsEditSummary(true)}>
          <SummaryItem title='Subtotal' value={subtotal} warning={isSubtotalWarning && centsToDollar(detectedSubtotal)} />
          <SummaryItem title='Tax' value={tax} />
          {/* WARN detected total !== total */}
          <SummaryItem title='Total' value={subtotal + tax} warning={isTotalWarning && centsToDollar(detectedTotal)} />
          <SummaryItem title='Gratuity' value={gratuity} />
        </TouchableOpacity>

        <TouchableOpacity style={{ alignSelf: 'center', width: '70%', marginVertical: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: isAltered || !isApproved ? Colors.purple : Colors.darkgrey, borderRadius: 100 }} onPress={save}>
          <LargeText center>{!isApproved ? 'Confirm receipt' : isAltered ? 'Save changes' : 'Return to split'}</LargeText>
        </TouchableOpacity>
      </View>

      {isSaving && <IndicatorOverlay text='Saving edits...' />}
    </SafeView>
  )
}

const SummaryItem = ({ title, value, warning }) => <View style={{ paddingTop: 4 }}>
  <View style={{ flexDirection: 'row' }}>
    <MediumText style={{ flex: 1 }} bold>{title}</MediumText>
    {/* {!!setValue && <AntDesign name="edit" color={Colors.green} size={20} style={{ marginLeft: 8 }} />} */}
    <MediumText bold>{centsToDollar(value)}</MediumText>
  </View>
  {!!warning && <DefaultText>Our initial guess for {title.toLowerCase()} was {warning}</DefaultText>}
  {/* {title === 'Gratuity' && <ExtraSmallText>Only add automatic gratuity that needs to be split evenly with the table here. You can calculate individual tips in Summaries.</ExtraSmallText>} */}
</View>

const ReceiptGroup = ({ group, receiptGroupID, quantityWidth, setQuantityWidth, priceWidth, setPriceWidth, setEditGroupID, numClaimed }) => {
  return <TouchableOpacity onPress={() => setEditGroupID(receiptGroupID)}><View style={{ marginVertical: 8, opacity: group.quantity === 0 ? 0.2 : 1 }}>
    <View style={{ flexDirection: 'row', }}>
      <View style={{ minWidth: quantityWidth, }} onLayout={({ nativeEvent }) => setQuantityWidth(prev => Math.max(prev, nativeEvent.layout.width))}>
        <MediumText center>{group.quantity}</MediumText>
      </View>
      <MediumText style={{ flex: 1, marginHorizontal: 10 }}>{group.name}</MediumText>
      <View style={{ minWidth: priceWidth, alignItems: 'flex-end' }} onLayout={({ nativeEvent }) => setPriceWidth(prev => Math.max(prev, nativeEvent.layout.width))}>
        <MediumText>{centsToDollar(group.subtotal)}</MediumText>
      </View>
    </View>
    {!!(numClaimed && group.old && (group.old.subtotal / group.old.quantity) !== (group.subtotal / group.quantity)) && <MediumText style={{ marginLeft: quantityWidth + 10, marginRight: priceWidth + 10 }} bold red>Splitting for {numClaimed} items will be reset</MediumText>}
    {
      group.captions.map(text => <MediumText key={text} style={{ marginLeft: quantityWidth + 10, marginRight: priceWidth + 10 }}>{text}</MediumText>)
    }
  </View>
  </TouchableOpacity>
}

const EditRestaurant = ({ restaurantName, setRestaurantName, setIsEditRestaurant }) => {
  const [name, setName] = useState(restaurantName)

  const isAltered = restaurantName !== name

  const save = useCallback(() => {
    setRestaurantName(name)
    setIsEditRestaurant(false)
  }, [name])

  return <View style={styles.overlay}>
    <TouchableOpacity onPress={() => setIsEditRestaurant(false)} style={{ padding: 20 }}>
      <MaterialIcons name='close' size={30} color={Colors.white} />
    </TouchableOpacity>

    <View style={{ flex: 1, paddingTop: 30, }}>
      <View style={{ backgroundColor: Colors.background, alignSelf: 'center', marginHorizontal: Layout.window.width * 0.1, padding: 20 }}>
        <ExtraLargeText style={{ marginBottom: 20 }} center>Restaurant name</ExtraLargeText>
        <View style={{ paddingBottom: 4, borderBottomColor: Colors.white, borderBottomWidth: 1 }}>
          <TextInput value={name} style={styles.textInputText} onChangeText={setName} />
        </View>
      </View>

      <StyledButton
        disabled={!name}
        center
        text={!name ? 'Missing name' : !isAltered ? 'Close' : 'Save name'}
        onPress={save}
        style={{ marginVertical: 50 }} />
    </View>
  </View >
}

const REGEX_IS_NUMBER = /^-?[0-9]*$/
const editPrice = setValue => text => {
  let stripped = text.replace(/\D/g, '')
  // Not sure if check is necessary...
  if (REGEX_IS_NUMBER.test(stripped)) setValue(prev => typeof prev === 'number' ? Number(stripped) : ({ ...prev, value: Number(stripped) }))
}
const useSelection = () => {
  const [selection, setSelection] = useState({})

  // TextInput in Modal will autofocus with selection despite autofocus={false}
  const [isFocused, setIsFocused] = useState(false)
  if (!isFocused) return { onFocus: () => setIsFocused(true) }

  return {
    selection,
    onSelectionChange: ({ nativeEvent: { text } }) => setSelection({ start: text.length }),
  }
}

const priceFromObject = ({ value, isNegative }) => isNegative ? -value : value
const priceToObject = price => ({ value: Math.abs(price), isNegative: price < 0 })

const EditGroup = ({ group = {}, setGroupEdits, receiptGroupID, setEditGroupID, numClaimed }) => {
  const dispatch = useDispatch()
  const isExistingItem = !!group.name
  const [name, setName] = useState(group.name)
  const [quantity, setQuantity] = useState(group.quantity)
  const [subtotal, setSubtotal] = useState(priceToObject(group.subtotal))
  const [captions, setCaptions] = useState(group.captions)
  const [quantityWidth, setQuantityWidth] = useState(null)

  const isCaptionsValid = useMemo(() => captions.every(cap => cap.length), [captions])

  const isAltered = useMemo(() => {
    return group.name !== name
      || group.quantity !== quantity
      || group.subtotal !== priceFromObject(subtotal)
      || group.captions.length !== captions.length
      || !captions.every((text, index) => text === group.captions[index])
  }, [name, quantity, subtotal, captions, group])

  const claimedItemsAffected = useMemo(() => (subtotal / quantity) !== (group.subtotal / group.quantity) && numClaimed, [subtotal, quantity, group])

  const subtotalValue = centsToDollar(priceFromObject(subtotal))
  const onChangeSubtotal = useCallback(editPrice(setSubtotal), [])
  const subtotalSelection = useSelection()


  const remove = useCallback(() => {
    dispatch(doAlertAdd(`Delete item?`, undefined, [
      {
        text: 'Yes, delete',
        onPress: () => {
          setGroupEdits(prev => {
            let copy = { ...prev }

            // 0 quantity, maintain old if it already exists
            if (isExistingItem) {
              copy[receiptGroupID] = {
                ...prev[receiptGroupID],
                quantity: 0,
                old: prev[receiptGroupID].old || prev[receiptGroupID]
              }
            }
            // delete newly added items
            else {
              delete copy[receiptGroupID]
            }

            return copy
          })
          setEditGroupID('')
        }
      },
      {
        text: 'No, cancel'
      }
    ]))
  }, [group])

  const reset = useCallback(() => {
    dispatch(doAlertAdd(`Reset item?`, undefined, [
      {
        text: 'Yes, reset',
        onPress: () => {
          setName(group.name)
          setQuantity(group.quantity)
          setSubtotal(priceToObject(group.subtotal))
          setCaptions(group.captions)
        }
      },
      {
        text: 'No, cancel'
      }
    ]))
  }, [group])

  const save = useCallback(() => {
    setGroupEdits(prev => ({
      ...prev,
      [receiptGroupID]: {
        ...prev[receiptGroupID],
        name,
        quantity,
        subtotal: priceFromObject(subtotal),
        captions,
        old: prev[receiptGroupID].old || prev[receiptGroupID]
      }
    }))
    setEditGroupID('')
  }, [name, quantity, subtotal, captions, group,])

  return <View style={styles.overlay}>
    <TouchableOpacity onPress={() => {
      if (!isExistingItem) setGroupEdits(prev => {
        let copy = { ...prev }
        delete copy[receiptGroupID]
        return copy
      })
      setEditGroupID('')
    }} style={{ paddingLeft: 20, paddingTop: 20 }}>
      <MaterialIcons name='close' size={30} color={Colors.white} />
    </TouchableOpacity>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 30 }}>
        <TouchableOpacity disabled={!group.quantity} onPress={remove}>
          <MediumText style={{ color: group.quantity ? Colors.red : Colors.darkgrey }}>DELETE</MediumText>
        </TouchableOpacity>
        <TouchableOpacity disabled={!isAltered} onPress={reset}><MediumText style={{ color: isAltered ? Colors.red : Colors.darkgrey }}>RESET</MediumText></TouchableOpacity>
      </View>

      <View style={{ backgroundColor: Colors.background, marginHorizontal: Layout.window.width * 0.1, padding: 20 }}>
        <View style={[styles.inputRow, styles.rowMargin]}>
          <MediumText style={{ minWidth: quantityWidth }}>Name:</MediumText>
          <View style={[styles.textInput, { flex: 1, backgroundColor: name ? Colors.darkgrey : Colors.red }]}>
            <TextInput value={name} style={[styles.textInputText,]} onChangeText={setName} selectTextOnFocus />
          </View>
        </View>

        <View style={[styles.inputRow, styles.rowMargin]}>
          <View onLayout={({ nativeEvent }) => setQuantityWidth(nativeEvent.layout.width)}>
            <MediumText>Quantity:</MediumText>
          </View>
          <View style={[styles.textInput, { flex: 1, backgroundColor: quantity.toString().length ? Colors.darkgrey : Colors.red }]}>
            <TextInput value={quantity} style={styles.textInputText} onChangeText={setQuantity} keyboardType='number-pad' />
          </View>
        </View>

        <View style={styles.rowMargin}>
          <View style={styles.inputRow}>
            <MediumText style={{ minWidth: quantityWidth }}>Price:</MediumText>
            <View style={[styles.textInput, { flex: 1 }]}>
              <TextInput
                value={subtotalValue}
                style={styles.textInputText}
                onChangeText={onChangeSubtotal}
                keyboardType='number-pad'
                autoFocus={false}
                {...subtotalSelection}
              />
            </View>
          </View>

          <TouchableOpacity style={{ marginTop: 2, paddingVertical: 2, marginLeft: quantityWidth + 20 }} onPress={() => setSubtotal(prev => ({ ...prev, isNegative: !prev.isNegative }))}>
            <View style={styles.inputRow}>
              <MaterialIcons name={subtotal.isNegative ? 'check-box' : 'check-box-outline-blank'} size={25} color={subtotal.isNegative ? Colors.purple : Colors.lightgrey} />
              <SmallText style={{ marginLeft: 8 }}>Negative price? (e.g. discounts)</SmallText>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ marginVertical: 8 }}>
          <MediumText center bold>({subtotal.value % quantity ? '~' : ''}{centsToDollar(quantity ? Math.round(subtotal.value / quantity) : 0)} each)</MediumText>
          {!!claimedItemsAffected && isAltered && <MediumText bold red style={{ marginTop: 8 }}>WARNING: This will reset splits on {plurarize(claimedItemsAffected, 'item', 'items')}</MediumText>}
        </View>

        <View style={[styles.inputRow, styles.rowMargin]}>
          <LargeText>Descriptions:</LargeText>
        </View>
        <ScrollView style={{ flex: 1 }}>
          {
            captions.map((text, index) => <View key={index.toString()} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4, }}>
              <TouchableOpacity onPress={() => setCaptions(prev => [...prev.slice(0, index), ...prev.slice(index + 1)])}>
                <MaterialIcons name='remove-circle-outline' color={Colors.red} size={24} />
              </TouchableOpacity>
              <View style={[styles.textInput, { flex: 1, backgroundColor: text ? Colors.darkgrey : Colors.red }]}>
                <TextInput value={text} style={styles.textInputText} onChangeText={t => setCaptions(prev => [...prev.slice(0, index), t, ...prev.slice(index + 1)])} />
              </View>
            </View>)
          }

          <TouchableOpacity onPress={() => setCaptions(prev => [...prev, ''])}>
            <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginVertical: 10 }}>
              <MaterialIcons name='add-circle-outline' color={Colors.green} size={24} />
              <LargeText style={{ marginLeft: 20, }}>ADD CAPTION</LargeText>
            </View>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </View>
    <StyledButton
      disabled={!name || !quantity.toString().length || !isCaptionsValid}
      center
      onPress={isAltered ? save : () => setEditGroupID(false)}
      text={!name ? 'Missing name' : !quantity.toString().length ? 'Missing quantity' : !isCaptionsValid ? 'Invalid captions' : !isAltered ? 'Close' : 'Finished editing'}
      style={{ marginVertical: 50 }} />
    <MainAlert />
  </View >
}

const EditSummary = ({ tax, setTax, gratuity, setGratuity, setIsEditSummary, subtotal, warnSubtotal, warnTotal }) => {
  const [tempTax, setTempTax] = useState(tax)
  const [tempGratuity, setTempGratuity] = useState(gratuity)
  const [gratuityWidth, setGratuityWidth] = useState(null)

  const isAltered = tax !== tempTax || gratuity !== tempGratuity

  const onChangeTax = useCallback(editPrice(setTempTax), [])
  const taxSelection = useSelection()

  const onChangeGratuity = useCallback(editPrice(setTempGratuity), [])
  const gratuitySelection = useSelection()

  const save = useCallback(() => {
    setTax(tempTax)
    setGratuity(tempGratuity)
    setIsEditSummary(false)
  }, [tempTax, tempGratuity])

  return <View style={styles.overlay}>
    <TouchableOpacity onPress={() => setIsEditSummary(false)} style={{ padding: 20 }}>
      <MaterialIcons name='close' size={30} color={Colors.white} />
    </TouchableOpacity>

    <View style={{ backgroundColor: Colors.background, alignSelf: 'center', width: Layout.window.width * 0.7, padding: 20 }}>
      <View style={{ marginVertical: 6 }}>
        <View style={styles.inputRow}>
          <LargeText style={{ minWidth: gratuityWidth }}>Subtotal:</LargeText>
          <View style={[styles.textInput, { flexDirection: 'row', flex: 1, backgroundColor: undefined }]}>
            <ExtraLargeText bold>{centsToDollar(subtotal)}</ExtraLargeText>
          </View>
        </View>
        <SmallText>(automatically calculated as sum of items)</SmallText>
        {!!warnSubtotal && <SmallText>We expected the subtotal to be {warnSubtotal}</SmallText>}
      </View>

      <View style={{ marginVertical: 6 }}>
        <View style={styles.inputRow}>
          <LargeText style={{ minWidth: gratuityWidth }}>Tax:</LargeText>
          <View style={[styles.textInput, { flex: 1 }]}>
            <TextInput
              value={centsToDollar(tempTax)}
              style={styles.textInputText}
              onChangeText={onChangeTax}
              keyboardType='number-pad'
              autoFocus={false}
              {...taxSelection}
            />
          </View>
        </View>
      </View>

      <View style={{ marginVertical: 6 }}>
        <View style={styles.inputRow}>
          <LargeText style={{ minWidth: gratuityWidth }}>Total:</LargeText>
          <View style={[styles.textInput, { flexDirection: 'row', flex: 1, backgroundColor: undefined }]}>
            <ExtraLargeText bold>{centsToDollar(subtotal + tempTax)}</ExtraLargeText>
          </View>
        </View>
        <SmallText>(automatically calculated as subtotal + tax)</SmallText>
        {!!warnTotal && <SmallText>We expected the total to be {warnTotal}</SmallText>}
      </View>

      <View style={{ marginVertical: 6 }}>
        <View style={styles.inputRow}>
          <View onLayout={({ nativeEvent }) => setGratuityWidth(nativeEvent.layout.width)}>
            <LargeText style={{ minWidth: gratuityWidth }}>Gratuity:</LargeText>
          </View>

          <View style={[styles.textInput, { flex: 1 }]}>
            <TextInput
              value={centsToDollar(tempGratuity)}
              style={styles.textInputText}
              onChangeText={onChangeGratuity}
              keyboardType='number-pad'
              autoFocus={false}
              {...gratuitySelection}
            />
          </View>
        </View>
        <SmallText style={{ paddingTop: 4 }}>Only add gratuity that needs to be split evenly with the table here. You can calculate individual tips in Summaries.</SmallText>
      </View>
    </View>

    <StyledButton
      center
      text={!isAltered ? 'Close' : 'Save summary'}
      onPress={save}
      style={{ marginVertical: 50 }} />
  </View >
}


const EditPrice = ({ value, setValue, isNegative }) => {
  const isObject = typeof isNegative === 'boolean'
  const ref = useRef(null)
  const [isFocused, setIsFocused] = useState(false)

  const onChangeText = useCallback(text => {
    if (REGEX_IS_NUMBER.test(text)) setValue(prev => isObject ? ({ ...prev, value: Number(text) }) : Number(text))
  }, [])

  return <View>
    <TouchableWithoutFeedback onPress={() => ref?.current?.focus()}>
      <View style={[styles.textInput, { flexDirection: 'row', flex: 1, }]}>
        <ExtraLargeText bold>{centsToDollar(isNegative ? -value : value)}</ExtraLargeText>
        <View>
          <Cursor cursorOn={isFocused} />
        </View>
      </View>
    </TouchableWithoutFeedback>
    <TextInput
      ref={ref}
      keyboardType='number-pad'
      value={value.toString()}
      style={{ width: 0, height: 0 }}
      onChangeText={onChangeText}
      multiline
      numberOfLines={1}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      // On focus otherwise starts from beginning, not sure why
      selection={{ start: value.toString().length }}
    />

  </View>
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.black + 'F1'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowMargin: {
    marginVertical: 4,
  },
  textInput: {
    marginLeft: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.darkgrey,
    borderRadius: 8,
  },
  textInputText: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: 'bold',
  },
  columnHeaders: {
    borderBottomColor: Colors.white,
    borderBottomWidth: 1
  },
});
import React, { useMemo, useState, useCallback, } from 'react';
import {
  LayoutAnimation,
  StyleSheet,
  TouchableOpacity,
  View,
  UIManager,
  Platform,
} from 'react-native';
import { ExtraLargeText, LargeText, MediumText } from '../../utils/components/NewStyledText';
import { useDispatch, useSelector } from 'react-redux';
import { selectAlphabeticalItemIDs, } from '../../redux/selectors/selectorsItems';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import Header from '../../utils/components/Header';
import BackIcon from '../../utils/components/BackIcon';
import { FlatList } from 'react-native-gesture-handler';
import { useItem } from '../../utils/hooks/useItem';
import { selectNumberSoldOutItems, selectNumberSoldOutOptions, selectSoldOutItems } from '../../redux/selectors/selectorsSoldOut';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import firebase from 'firebase';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SoldOut({ isSoldOutOpen, setIsSoldOutOpen }) {
  const itemIDs = useSelector(selectAlphabeticalItemIDs)
  const [category, setCategory] = useState('items')
  const soldOutItems = useSelector(selectSoldOutItems)
  const numberSoldOutItems = useSelector(selectNumberSoldOutItems)
  const numberSoldOutOptions = useSelector(selectNumberSoldOutOptions)

  const headerLeft = useMemo(() => (
    <BackIcon name='close' backFn={() => setIsSoldOutOpen(false)} />
  ), [])

  if (!isSoldOutOpen) return null

  return (
    <View style={[StyleSheet.absoluteFill, styles.absolute]}>
      <View style={styles.popup}>
        <Header style={{ marginTop: 20 }} left={headerLeft}>
          <ExtraLargeText center>SOLD OUT ITEMS</ExtraLargeText>
          {/* <PortalSegment segments={['items', 'options']} values={[`Items (${numberSoldOutItems})`, `Options (${numberSoldOutOptions})`]} segment={category} setSegment={setCategory} /> */}
        </Header>

        <FlatList
          ListHeaderComponent={() => <FlatList
            contentContainerStyle={{ paddingTop: 10 }}
            columnWrapperStyle={{ justifyContent: 'space-evenly' }}
            data={soldOutItems}
            keyExtractor={item => item}
            ListEmptyComponent={() => <LargeText center >NO SOLD OUT ITEMS</LargeText>}
            ListFooterComponent={() => <View style={{ marginVertical: 20, marginHorizontal: Layout.marHor, borderColor: Colors.white, borderTopWidth: 1 }} />}
            renderItem={({ item: item_id, }) => <SoldOutItem item_id={item_id} />}
            numColumns={2}
          />}
          contentContainerStyle={{ paddingTop: 10 }}
          columnWrapperStyle={{ justifyContent: 'space-evenly' }}
          data={itemIDs}
          keyExtractor={item => item}
          renderItem={({ item: item_id, }) => <SoldOutItem item_id={item_id} />}
          numColumns={2}
        />
      </View>
    </View>
  )
}

const SoldOutItem = ({ item_id }) => {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()
  const { is_sold_out, variants = {}, name } = useItem(item_id)

  const [showVariants, setShowVariants] = useState(false)
  const [isEditingItem, setIsEditingItem] = useState(false)

  // const [variantIDs, setVariantsIDs] = useState([])
  // useEffect(() => {
  //   const next = Object.keys(variants)
  //   setVariantsIDs(prev => equalArrays(prev, next) ? prev : next)
  // },[variants])

  const numberOfSoldOutVariants = useMemo(() => is_sold_out + Object.values(variants).filter(variant => variant.is_sold_out).length, [is_sold_out, variants])
  const numberOfVariants = useMemo(() => 1 + Object.values(variants).length, [variants])

  const toggleSoldOutStatus = useCallback(async (variant_id, markAllAs) => {
    try {
      await firebase.firestore().runTransaction(async transaction => {
        const itemRef = restaurantRef.collection('Items').doc(item_id)
        const item = (await transaction.get(itemRef)).data()

        if (variant_id && item.variants[variant_id]) {
          transaction.set(itemRef, {
            variants: {
              [variant_id]: { is_sold_out: !item.variants[variant_id].is_sold_out }
            }
          }, { merge: true })
        }
        else if (typeof markAllAs === 'boolean') {
          transaction.set(itemRef, {
            is_sold_out: markAllAs
          }, { merge: true })

          if (typeof markAllAs === 'boolean') {
            Object.keys(item.variants).forEach(v_id => transaction.set(itemRef, {
              variants: {
                [v_id]: { is_sold_out: markAllAs }
              }
            }, { merge: true }))
          }
        }
        else {
          transaction.set(itemRef, {
            is_sold_out: !item.is_sold_out
          }, { merge: true })
        }
      })
    }
    catch (error) {
      dispatch(doAlertAdd(`Error changing ${name} sold out status`, 'Please try again and let Torte know if you see this error multiple times'))
    }
    finally {
      setIsEditingItem(false)
    }
  }, [item_id, name,])

  const toggleShowVariant = useCallback(() => {
    LayoutAnimation.configureNext({ ...LayoutAnimation.Presets.easeInEaseOut, duration: 100 });
    setShowVariants(prev => !prev)
  }, [])

  return (
    <View style={styles.itemGroup}>
      <TouchableOpacity onPress={() => {
        if (numberOfVariants > 1) toggleShowVariant()
        else toggleSoldOutStatus()
      }}>
        <View style={[styles.item, { backgroundColor: numberOfSoldOutVariants ? Colors.red : Colors.darkgrey, ...!showVariants && { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 } }]}>
          <MediumText style={{ flex: 1 }}>{name}</MediumText>
          {numberOfVariants > 1 && <MediumText>({numberOfSoldOutVariants}/{numberOfVariants})</MediumText>}
        </View>
      </TouchableOpacity>
      {
        showVariants && <View>
          <TouchableOpacity onPress={() => toggleSoldOutStatus()}>
            <View style={[styles.item, styles.variant, { backgroundColor: is_sold_out ? Colors.red : Colors.darkgrey }]}>
              <MediumText>ROOT ONLY</MediumText>
            </View>
          </TouchableOpacity>
          {
            Object.keys(variants).map(variant_id => <TouchableOpacity key={variant_id} onPress={() => toggleSoldOutStatus(variant_id)}>
              <View style={[styles.item, styles.variant, { backgroundColor: variants[variant_id].is_sold_out ? Colors.red : Colors.darkgrey }]}>
                <MediumText>{variants[variant_id].internal_name}</MediumText>
              </View>
            </TouchableOpacity>)
          }
          <View style={[styles.item, styles.variant, { flexDirection: 'row', backgroundColor: Colors.background, borderWidth: 1, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }]}>
            <TouchableOpacity style={{ flex: 1, borderRightColor: Colors.white, borderRightWidth: 1 }} onPress={() => toggleSoldOutStatus(undefined, true)}>
              <MediumText center>ALL OUT</MediumText>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleSoldOutStatus(undefined, false)}>
              <MediumText center>ALL OK</MediumText>
            </TouchableOpacity>
          </View>
        </View>

      }
      {isEditingItem && <IndicatorOverlay text='Changing...' small />}
    </View>
  )
}

const styles = StyleSheet.create({
  absolute: {
    flex: 1,
    backgroundColor: Colors.black + 'F1',
    zIndex: 100,
  },
  popup: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  itemGroup: {
    width: '45%',
    marginBottom: 10,
  },
  item: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    minHeight: 46,
  },
  variant: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderColor: Colors.white,
    borderTopWidth: 1,
  }
});


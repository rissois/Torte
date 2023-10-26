import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  Modal,
  LayoutAnimation,
  TouchableOpacity,
  PixelRatio,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons, Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import HeaderShadow from '../../utils/components/HeaderShadow';
import { DefaultText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';

import Menu from '../components/Menu';
import Item from '../components/Item';

import MenuChanger from '../components/MenuChanger';
import MenuChangerDrawer from '../components/MenuChangerDrawer';
import MenuSectionScroller from '../components/MenuSectionScroller';
import MenuFilterDrawer from '../components/MenuFilterDrawer';
import BottomButton from '../../utils/components/BottomButton';

import { doTrackersClearItem } from '../../redux/actions/actionsTrackers';
import { doBillEnd } from '../../redux/actions/actionsBill';

import { selectNumberOfItemsInCart } from '../../redux/selectors/selectorsBillGroups';
import { selectIsOrderWithUser } from '../../redux/selectors/selectorsBillOrders';
import { selectActiveFilterNames } from '../../redux/selectors/selectorsFilters';
import { useTableName, useBillCode, useIsMenuOnly } from '../../utils/hooks/useBill';
import useModalCloser from '../../utils/hooks/useModalCloser';
import { useRestaurantName } from '../../utils/hooks/useRestaurant';
import { selectTrackedMenuName } from '../../redux/selectors/selectorsMenus';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { selectIsMissingMenu } from '../../redux/selectors/selectorsTrackers';
import { doTempCopyRestaurant } from '../../redux/actions/actionsTemp';
import { selectIsBillOrderEnabled } from '../../redux/selectors/selectorsBill';


if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animationConfiguration = {
  duration: 250,
  create:
  {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update:
  {
    type: LayoutAnimation.Types.easeInEaseOut,
  }
}

export default function MenuScreen({ navigation, route }) {
  useModalCloser('Menu', () => dispatch(doTrackersClearItem()))
  const selectedItemID = useSelector(state => state.trackers.item_id)

  const dispatch = useDispatch()

  const restaurantName = useRestaurantName()
  const tableName = useTableName()
  const billCode = useBillCode()
  const menuName = useSelector(selectTrackedMenuName)
  const isOrderEnabled = useSelector(selectIsBillOrderEnabled)

  const isMenuOnly = useIsMenuOnly()
  const isOrderWithUser = useSelector(selectIsOrderWithUser)
  const numberOfItemsInCart = useSelector(selectNumberOfItemsInCart)

  /*-----------
     FILTERS
  ------------*/
  const filteredNames = useSelector(selectActiveFilterNames)
  const [isFilterOpen, setIsFilterOpen] = useState(false)


  const toggleFilterDrawer = useCallback(() => {
    setIsFilterOpen(prev => !prev)
    LayoutAnimation.configureNext(animationConfiguration)
  }, [])


  /*-----------
     CHANGERS
  ------------*/

  const [isChangerOpen, setIsChangerOpen] = useState(false)

  const closeChangerDrawer = useCallback(() => {
    setIsChangerOpen(false)
  }, [])

  const openChangerDrawer = useCallback(() => {
    setIsChangerOpen(true)
    LayoutAnimation.configureNext(animationConfiguration)
  }, [])

  const isMissingMenu = useSelector(selectIsMissingMenu)

  useEffect(() => {
    if (isMissingMenu) {
      openChangerDrawer(true)
    }
  }, [isMissingMenu])

  useEffect(() => {
    if (!isMenuOnly) {
      openChangerDrawer()
    }
  }, [isMenuOnly])

  /*-----------
     ITEMS
  ------------*/

  const sectionListRef = useRef(null)
  const [viewableSection, setViewableSection] = useState('')

  const headerLeft = useMemo(() => (
    <TouchableOpacity onPress={() => {
      if (isChangerOpen) {
        if (isMenuOnly) {
          dispatch(doAlertAdd('Leave menu?', undefined, [
            {
              text: 'Yes, exit',
              onPress: () => {
                dispatch(doBillEnd())
                navigation.goBack()
              }
            },
            {
              text: 'No, cancel',
            }
          ]))

        }
        else navigation.goBack()
      }
      else openChangerDrawer()
    }}>
      {
        isChangerOpen ?
          <MaterialIcons name='arrow-back' size={28} color={Colors.white} /> :
          <MediumText>{menuName}</MediumText>
      }
    </TouchableOpacity>
  ), [menuName, isChangerOpen])

  const headerRight = useMemo(() => (
    <TouchableOpacity onPress={toggleFilterDrawer}>
      <Feather
        name='filter'
        size={26}
        color={Colors.white}
      />
      {!!filteredNames && <View style={{ position: 'absolute', right: 0, backgroundColor: Colors.white, borderRadius: 24, }}>
        <MaterialCommunityIcons
          name='plus-circle'
          size={18}
          color={Colors.red}
          style={{ margin: -5 }}
        />
      </View>
      }
    </TouchableOpacity>
  ), [filteredNames])

  const bottomButtonWithIcon = useMemo(() => (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      <FontAwesome
        name='reply'
        color={Colors.white}
        size={24 * PixelRatio.getFontScale()}
      />
      <LargeText bold style={{ marginLeft: 12 }}>Pending order...</LargeText>
    </View>
  ), [])

  const requestBill = useCallback(() => {
    dispatch(doTempCopyRestaurant())
    navigation.navigate('CodeTable')
  }, [])

  return (
    <SafeView unsafeColor={Colors.black}>
      <Modal
        visible={!!selectedItemID}
        animationType='slide'
        transparent={true}
      >
        <Item requestBill={requestBill} />
      </Modal>

      <Header
        left={headerLeft}
        right={headerRight}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <LargeText center numberOfLines={1} ellipsizeMode='tail'>{isMenuOnly ? restaurantName : `#${billCode} - ${tableName}`}</LargeText>
        </TouchableOpacity>
      </Header>

      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1 }}>
          {/* <MenuChanger isChangerOpen={isChangerOpen} closeChangerDrawer={closeChangerDrawer} openChangerDrawer={openChangerDrawer} /> */}
          <View style={{ flex: 1 }}>
            <MenuSectionScroller sectionListRef={sectionListRef} viewableSection={viewableSection} />
            {!!filteredNames && <TouchableOpacity onPress={toggleFilterDrawer}><View style={styles.filterNotice}>
              <DefaultText center>Only showing {filteredNames} items</DefaultText>
            </View></TouchableOpacity>}
            <Menu sectionListRef={sectionListRef} setViewableSection={setViewableSection} />
            <MenuChangerDrawer sectionListRef={sectionListRef} isChangerOpen={isChangerOpen} closeChangerDrawer={closeChangerDrawer} />
          </View>

        </View>

        {isOrderEnabled && <BottomButton
          backgroundColor={isOrderWithUser ? Colors.red : Colors.purple}
          onPress={() => {
            if (isMenuOnly) requestBill()
            else if (isOrderWithUser) navigation.navigate('Order')
            else navigation.navigate('Cart')
          }}
          text={isOrderWithUser ? bottomButtonWithIcon : isMenuOnly ? 'Start / join a bill' : `Review cart (${numberOfItemsInCart})`}
          isOfflineVisible
        />}

        <MenuFilterDrawer isFilterOpen={isFilterOpen} toggleFilterDrawer={toggleFilterDrawer} />

        <HeaderShadow />
      </View>
    </SafeView>
  )
}





const styles = StyleSheet.create({
  filterNotice: {
    backgroundColor: Colors.red,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
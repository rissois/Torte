import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Layout from '../../utils/constants/Layout';
import { ExtraLargeText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import { shallowEqual, useSelector } from 'react-redux';
import useCategoryChild from '../../portal/hooks/useCategoryChild';
import { selectAlphabeticalMenuIDs } from '../../redux/selectors/selectorsMenus';
import { Pages } from '../../utils/components/Pages';
import { EditLineItemBox } from '../components/EditLineItemBox';
import { useRestaurant } from '../../utils/hooks/useRestaurant';
import { dateToMilitary } from '../../functions/dateAndTime';
import { indexesToPosition } from '../../utils/functions/indexesToPosition';


/*
Do you need variants here?
Are the variants side-by-side then?

easy enough to grab variants...
alphavetically
*/

const Menu = ({ id, selected, setSelected }) => {
  const { name, internal_name } = useCategoryChild('menus', id)
  return <EditLineItemBox isPurple={selected === id} text={name} subtext={internal_name} onPress={() => setSelected(prev => prev === id ? null : id)} />
}

const Section = ({ id, selected, setSelected }) => {
  const { name, internal_name } = useCategoryChild('sections', id)
  return <EditLineItemBox isPurple={selected === id} text={name} subtext={internal_name} onPress={() => setSelected(prev => prev === id ? null : id)} />
}

const isItemSelected = (i1, i2) => i1?.item_id === i2?.item_id && i1.variant_id === i2.variant_id
const Item = ({ id: item, selected, setSelected }) => {
  const { name, internal_name } = useCategoryChild('items', item.item_id, item.variant_id)
  return <EditLineItemBox isPurple={isItemSelected(selected, item)} text={name} subtext={internal_name} onPress={() => setSelected(prev => isItemSelected(prev, item) ? null : item)} />
}

const UNKNOWN_MENU_POSITION = '9999999'


export default function AddScreen({ }) {
  const restaurant = useRestaurant()
  const [menuID, setMenuID] = useState(null)
  const [sectionID, setSectionID] = useState(null)
  const [itemID, setItemID] = useState(null)


  const menuIDs = useSelector(selectAlphabeticalMenuIDs, shallowEqual)
  const { section_order } = useCategoryChild('menus', menuID)
  const { item_order } = useCategoryChild('sections', sectionID)

  const menuPosition = useMemo(() => {
    if (!menuID || !restaurant.days) return ''
    const now = new Date()
    const nowMilitary = dateToMilitary(now)
    const dayIndex = now.getDay()
    const periods = restaurant.days[dayIndex].hours
    const periodIndex = periods.findIndex(period => period.start <= nowMilitary && nowMilitary <= period.end)
    if (!~periodIndex) return UNKNOWN_MENU_POSITION
    const { meal_order } = periods[periodIndex]
    const { meals } = restaurant
    let mealIndex = -1
    let menuIndex = -1
    for (let i = 0; i < meal_order.length && !~menuIndex; i++) {
      menuIndex = meals[meal_order[i]].menus.findIndex(menu => menu.id === menuID)
      if (~menuIndex) mealIndex = i
    }
    if (!~menuIndex) return UNKNOWN_MENU_POSITION
    return dayIndex + indexesToPosition(periodIndex, mealIndex, menuIndex)
  }, [menuID, restaurant])


  const sectionPosition = useMemo(() => sectionID ? indexesToPosition(section_order.indexOf(sectionID)) : '', [section_order, sectionID])
  const itemPosition = useMemo(() => itemID ? indexesToPosition(item_order.findIndex(item => item.item_id === itemID.item_id && item.variant_id === itemID.variant_id)) : '', [item_order, itemID])

  useEffect(() => {
    if (!menuID) setSectionID(null)
  }, [menuID])

  useEffect(() => {
    if (!sectionID) setItemID(null)
  }, [sectionID])

  const menu = useMemo(() => <Menu setSelected={setMenuID} />, [])
  const section = useMemo(() => <Section setSelected={setSectionID} />, [])
  const item = useMemo(() => <Item setSelected={setItemID} />, [])


  return <SafeView >
    <Header back>
      <ExtraLargeText center>Temp add items</ExtraLargeText>
      {/* Replace text with segment (by menu / by item) and right with edit button */}
    </Header>

    <View style={{ marginHorizontal: Layout.marHor, flex: 1, }}>
      {/* Not sure if best to pass props until last second, or create a useMemo... */}
      <Pages ids={menuIDs} isCollapsible selected={menuID} child={menu} />
      {!!menuID && <Pages ids={section_order} isCollapsible selected={sectionID} child={section} />}
      {!!sectionID && <Pages ids={item_order} selected={itemID} child={item} />}
    </View>

  </SafeView >
}

const styles = StyleSheet.create({

});

/*
const AllItemVariants = () => {
  const itemVariants = useSelector(selectAlphaveticalItemVariants)

  return <FlatList
    keyExtractor={item => item.item_id + item.variant_id}
    data={itemVariants}
    renderItem={({ item: { item_id, variant_id } }) => <Render id={item_id} variant_id={variant_id} category='items' />}
    numColumns={4}
    contentContainerStyle={{ paddingBottom: Layout.scrollViewPadBot }}
  />
}
*/
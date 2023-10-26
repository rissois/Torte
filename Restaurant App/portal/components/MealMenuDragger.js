import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity
} from 'react-native';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { LargeText, MediumText, } from '../../utils/components/NewStyledText';
import { dateToMilitary, } from '../../utils/functions/dateAndTime';
import DraggableFlatList from 'react-native-draggable-flatlist';
import Layout from '../../utils/constants/Layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../utils/constants/Colors';
import MealStartEndPicker from './MealStartEndPicker';
import useCategoryChild from '../hooks/useCategoryChild';
import { useNavigation } from '@react-navigation/native';


export default function MealMenuDragger({ menus, setMenus }) {

  const [remeasure, setRemeasure] = useState((Date.now()).toString())
  useEffect(() => {
    setRemeasure((Date.now()).toString())
  }, [menus])


  const renderItem = useCallback(({ item: { start, end, menu_id }, index, drag, isActive }) => {
    return <MealMenu start={start} end={end} menu_id={menu_id} drag={drag} isActive={isActive} setMenus={setMenus} />
  }, [])

  return <DraggableFlatList
    data={menus}
    keyExtractor={item => item.menu_id}
    renderItem={renderItem}
    onDragEnd={({ data }) => setMenus(prev => prev.every((menu, index) => menu.menu_id === data[index].menu_id) ? prev : data)}
    layoutInvalidationKey={remeasure} // Ensures onDrag position starts at new location when child_ids altered externally (e.g. reset)
    ListEmptyComponent={() => <View style={{ marginVertical: 30 }}><LargeText center>NO MENUS</LargeText></View>}
  />
}

const MealMenu = ({ start, end, menu_id, drag, isActive, setMenus }) => {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const {
    name,
    internal_name
  } = useCategoryChild('menus', menu_id)

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: isActive ? 0 : Layout.marHor, marginVertical: 10 }}>
      <TouchableOpacity
        style={{ flex: 1, }}
        onLongPress={drag}
        delayLongPress={5}
      // onPress={() => navigation.navigate('Menus', { id: menu_id })}
      >
        <View style={{
          flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 0,
          backgroundColor: Colors.background,
          borderColor: Colors.lightgrey,
          borderWidth: 1,
          shadowColor: "#000",
          shadowOffset: {
            width: 5,
            height: 5
          },
          shadowOpacity: isActive ? 0.5 : 0.11,
          shadowRadius: isActive ? 13 : 5.16,

          elevation: 8,
        }}>
          <MaterialCommunityIcons
            name='drag'
            size={30}
            color={Colors.white}
            style={{ marginHorizontal: 30 }}
          />
          <View style={{ width: '20%', paddingRight: 10, }}>
            <TouchableOpacity style={{ justifyContent: 'center' }} onPress={() => navigation.navigate('Menus', { id: menu_id })}>
              <LargeText>{name}</LargeText>
              {!!internal_name && <MediumText>{internal_name}</MediumText>}
            </TouchableOpacity>
          </View>
          <MealStartEndPicker start={start} end={end} setTime={isStart => (event, date) => {
            const dateAsMilitary = dateToMilitary(date)
            if (!isStart && dateAsMilitary === '0000') dateAsMilitary = '2400'
            setMenus(prev => {
              const copy = [...prev]
              const index = copy.findIndex(menu => menu.menu_id === menu_id)
              if (!~index) return prev
              copy[index] = { ...copy[index], [isStart ? 'start' : 'end']: dateAsMilitary }
              return copy
            })
          }} isCompact />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => dispatch(doAlertAdd(`Remove ${name} from meal?`, undefined, [
        {
          text: 'Yes',
          onPress: () => setMenus(prev => prev.filter(menu => menu.menu_id !== menu_id))
        },
        {
          text: 'No, cancel',
        }
      ]))}>
        <MaterialCommunityIcons
          name='delete-forever'
          size={32}
          color={Colors.red}
          style={{ paddingLeft: 30 }}
        />
      </TouchableOpacity>
    </View>
  )
}


const styles = StyleSheet.create({

});


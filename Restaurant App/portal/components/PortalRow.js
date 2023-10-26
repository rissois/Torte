import React, { useCallback, useState, useMemo } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LargeText, } from '../../utils/components/NewStyledText';
import { useDispatch, } from 'react-redux';
import Colors from '../../utils/constants/Colors';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import capitalize from '../../utils/functions/capitalize';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { useNavigation } from '@react-navigation/native';
import useCategoryChild from '../hooks/useCategoryChild';
import Layout from '../../utils/constants/Layout';
import singularize from '../../utils/functions/singularize';
import { PortalPhoto } from './PortalPhoto';
import { PanelByID } from './Panel';
import { fullDays } from '../../constants/DOTW';
import { militaryToClock } from '../../utils/functions/dateAndTime';
import { doDeleteChild } from '../../redux/actions/actionsDelete';

const Visibility = ({ is_visible, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <MaterialIcons
      name={is_visible ? 'visibility' : 'visibility-off'}
      size={32}
      color={is_visible ? Colors.white : Colors.midgrey}
      style={{ paddingLeft: 30 }}
    />
  </TouchableOpacity>
)

const Trash = ({ onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <MaterialCommunityIcons
      name='delete-forever'
      size={32}
      color={Colors.red}
      style={{ paddingLeft: 30 }}
    />
  </TouchableOpacity>
)

export function PortalRowList({ id, category, }) {
  const isPeriod = category === 'periods'
  const isMeal = category === 'meals'

  const restaurantRef = useRestaurantRef()
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const {
    name, internal_name, is_visible,
    start, end, dotw_id, variants = {}
  } = useCategoryChild(category, id)

  const internalName = Object.keys(variants).length ? '(ALL)' : isPeriod ? `  ${militaryToClock(start, undefined)} - ${militaryToClock(end, undefined, true)}` : internal_name ? ` (${internal_name})` : ''

  const toggleVisibility = useCallback(() => isPeriod ? null : dispatch(doAlertAdd(
    `${is_visible ? 'Hide' : 'Show'} ${name} ${internalName} from ${category}?`,
    is_visible
      ? `Your guests will no longer see this ${singularize(category)}.`
      : `This ${singularize(category)} will immediately be visible `,
    [
      {
        text: `Yes, ${is_visible ? 'hide' : 'show'}`,
        onPress: () => restaurantRef.collection(capitalize(category)).doc(id).update({ is_visible: !is_visible })
          .then(() => dispatch(doSuccessAdd()))
          .catch(error => {
            console.log('CategoryScreen visible error: ', error)
            dispatch(doAlertAdd(`Failed to ${is_visible ? 'hide' : 'show'} ${name} ${internalName}`, 'Please try again and contact Torte if the issue persists.'))
          })
      },
      {
        text: 'No, cancel',
      },
    ]
  )), [name, internalName, is_visible])

  const trash = useCallback(() => isPeriod ? null : dispatch(doDeleteChild(category, id,)), [category, id,])


  return <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10, marginHorizontal: Layout.marHor }}>
    <TouchableOpacity
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
      onPress={() => {
        navigation.navigate(capitalize(category), { id })
      }}>
      <RowMain name={isPeriod ? fullDays[dotw_id] : name} internalName={internalName} />
    </TouchableOpacity>

    {!isPeriod && !isMeal && <Visibility is_visible={is_visible} onPress={toggleVisibility} />}

    {!isPeriod && <Trash onPress={trash} />}
  </View>
}

export function PortalRowDraggable({ id, variant_id, category, drag, isActive, remove, setDragIndicatorWidth, isMuted, isPhoto, isAltered }) {
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const [height, setHeight] = useState(null)

  const { name, internal_name, photo } = useCategoryChild(category, id, variant_id)

  const internalName = internal_name ? ` (${internal_name})` : ''

  const askRemove = useCallback(() => dispatch(doAlertAdd(
    `Remove ${name}${internalName} from ${isPhoto ? 'photos' : category}?`,
    undefined,
    [
      {
        text: 'Yes, remove',
        onPress: remove
      },
      {
        text: 'No, cancel',
      },
    ]
  )), [name, internalName, isPhoto])

  return <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10, marginHorizontal: isActive ? 0 : Layout.marHor }}>
    <TouchableOpacity
      onLongPress={drag}
      delayLongPress={5}
    >
      {/* You can override the opacity for the drag... */}
      <View style={[isMuted ? styles.shadowlessView : styles.shadowedView, { height: height, marginRight: 20, paddingHorizontal: 20, justifyContent: 'center', }]}
        onLayout={({ nativeEvent }) => setDragIndicatorWidth(nativeEvent.layout.width)}
      >
        <MaterialCommunityIcons
          name='drag'
          size={30}
          color={Colors.white}
        />
      </View>
    </TouchableOpacity>

    <TouchableOpacity
      style={{ flex: 1, }}
      onLayout={({ nativeEvent }) => setHeight(nativeEvent.layout.height)}
      onPress={() => {
        if (isAltered) dispatch(doAlertAdd('You have unsaved changes', 'You must save or discard all changed before switching.'))
        else navigation.push(capitalize(category), { id, variant_id })
      }}>
      <RowMain name={name} internalName={internalName} photo_id={isPhoto && photo?.id} isMuted={isMuted} />
    </TouchableOpacity>

    <Trash onPress={askRemove} />
  </View>
}

export function PortalRowSelectable({ id, category, checkIsSelected, setSelected, isPhoto }) {
  const { name, internal_name, photo, variants = {} } = useCategoryChild(category, id)

  const variantIDs = useMemo(() => Object.keys(variants), [variants])

  if (isPhoto && !photo?.id) return null

  return <View style={{ marginHorizontal: Layout.marHor }}>
    <RowSelectable
      name={name}
      internal_name={internal_name}
      photo_id={isPhoto && photo?.id}
      panel_id={category === 'panels' && id}
      isSelected={checkIsSelected()}
      setSelected={() => setSelected()}
    />
    {
      variantIDs.map(variant_id => <RowSelectable
        key={variant_id}
        name={variants[variant_id].name || name}
        internal_name={variants[variant_id].internal_name}
        photo_id={isPhoto && photo?.id}
        isSelected={checkIsSelected(variant_id)}
        setSelected={() => setSelected(variant_id)}
      />)
    }
  </View >
}

export const RowSelectable = ({ name, internal_name, isSelected, photo_id, panel_id, setSelected }) => {
  return <View style={{ marginVertical: 10 }}>
    <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={setSelected}>
      <MaterialCommunityIcons
        name={'checkbox-marked-circle-outline'}
        size={40}
        color={isSelected ? Colors.green : Colors.darkgrey + '55'}
        style={{ paddingRight: 30 }}
      />
      <RowMain name={name} internalName={internal_name ? ` (${internal_name})` : ''} photo_id={photo_id} panel_id={panel_id} />
    </TouchableOpacity>
  </View>
}

export function PortalVariants({ isAltered, id, variant_id = '', category, currentVariantID = '', internal_name, isRoot, replaceVariant, }) {
  const dispatch = useDispatch()

  const trash = useCallback(() => isAltered
    ? dispatch(doAlertAdd('You have unsaved changes', 'You must save or discard all changed before switching.'))
    : dispatch(doDeleteChild(category, id, variant_id)), [isAltered, category, id, variant_id])

  return <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10, marginHorizontal: Layout.marHor }}>
    <TouchableOpacity
      disabled={variant_id === currentVariantID}
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
      onPress={() => {
        replaceVariant(variant_id)
      }}>
      <RowMain isGreen={variant_id === currentVariantID} isMuted={isAltered} name={(isRoot ? 'ROOT: ' : 'VARIANT: ') + internal_name} />
    </TouchableOpacity>

    {!isRoot && <Trash onPress={trash} />}
  </View>
}

export const RowMain = ({ name, internalName, isMuted, photo_id, panel_id, isGreen = false }) => (

  <View style={[isMuted ? styles.shadowlessView : styles.shadowedView, {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    ...isGreen && { backgroundColor: Colors.darkgreen }
  }]}>
    <View style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 10, }}>
      <LargeText >{name}  {internalName}</LargeText>
    </View>
    {!!photo_id && <PortalPhoto photo_id={photo_id} height={100} width={100} />}
    {!!panel_id && <View style={{ width: 200 }}>
      <PanelByID panel_id={panel_id} />
    </View>}
  </View>
)


const styles = StyleSheet.create({
  shadowedView: {
    backgroundColor: Colors.darkgrey,

    shadowColor: "#000",
    shadowOffset: {
      width: 5,
      height: 5
    },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,

    elevation: 20,
  },
  shadowlessView: {
    opacity: 0.3,
    backgroundColor: Colors.background,

    shadowColor: "#000",
    shadowOffset: {
      width: 5,
      height: 5
    },
    shadowOpacity: 0,
    shadowRadius: 13.16,

    elevation: 20,
  }
});


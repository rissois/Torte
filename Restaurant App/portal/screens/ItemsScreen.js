import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, } from 'react-redux';
import equalArrays from '../../utils/functions/equalArrays';
import firebase from 'firebase';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import PortalForm from '../components/PortalForm';
import { PortalCheckField, PortalDropdownField, PortalEnumField, PortalTextField } from '../components/PortalFields';
import PortalGroup from '../components/PortalGroup';
import PortalDragger from '../components/PortalDragger';
import StyledButton from '../../utils/components/StyledButton';
import Colors from '../../utils/constants/Colors';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { useFocusEffect, } from '@react-navigation/native';
import PortalAddOrCreate from '../components/PortalAddOrCreate';
import centsToDollar from '../../utils/functions/centsToDollar';
import { Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';



import PortalSelector from '../components/PortalSelector';
import PortalDelete from '../components/PortalDelete';
import useRestaurantNestedFields from '../../hooks/useRestaurantNestedField';
import { ExtraLargeText, LargeText, MediumText } from '../../utils/components/NewStyledText';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { initialFilters as filterNames } from '../../redux/selectors/selectorsBillItems';
import ItemFilters from '../components/ItemFilters';
import useCategoryChild from '../hooks/useCategoryChild';
import { PortalPhoto } from '../components/PortalPhoto';
import Layout from '../../utils/constants/Layout';
import * as ImageManipulator from 'expo-image-manipulator';
import { PortalVariants, } from '../components/PortalRow';
import usePrivateNestedField from '../../hooks/usePrivateNestedField';

const COURSE_OPTIONS = ['ASAP', 'starter', 'main', 'dessert']

const initialFilters = Object.keys(filterNames).reduce((acc, filter) => ({ ...acc, [filter]: false }), {})

const initialPhoto = { id: '', modified: null, name: '' }
const initialSizes = [{ name: '', code: '', price: 0 }]

const PHOTO_DISPLAY_SIZE = Layout.window.width * 0.5
const PHOTO_SAVE_SIZE = 600

const equalFilters = (f1 = {}, f2 = {}) => Object.keys(f1).every(filter => f1[filter] === f2[filter])
const equalUpsells = (u1 = [], u2 = []) => u1.length === u2.length && u1.every((upsell, index) => upsell.item_id === u2[index].item_id && upsell.option_id === u2[index].option_id && upsell.variant_id === u2[index].variant_id)
const equalSizes = (s1 = [], s2 = []) => s1.length === s2.length && s1.every((size, index) => size.name === s2[index].name && size.code === s2[index].code && size.price === s2[index].price)

const formatTaxRates = taxRate => taxRate ? `${taxRate?.name} (${taxRate?.percent}%)` : 'MISSING'
const formatPrinters = printer => printer?.station || 'MISSING'
const formatCourses = course => course?.toUpperCase() ?? ''

export default function ItemsScreen({ navigation, route }) {

  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()
  const { id, section_id, variant_id, section_name, item_id: upsell_item_id, item_name: upsell_item_name, modifier_id, modifier_name } = route.params ?? {}

  const tax_rates = useRestaurantNestedFields('tax_rates')
  const printers = usePrivateNestedField('Printers', 'printers')

  const item = useCategoryChild('items', id)

  const {
    is_deleted = false,
    name: currentName = '',
    internal_name: currentInternalName = '',
    description: currentDescription = '',
    is_visible: currentIsVisible = false,
    is_option: currentIsOption = false,


    allow_comments: currentAllowComments = true,
    comment_placeholder: currentCommentPlaceholder = '',
    course: currentCourse = '',
    filters: currentFilters = initialFilters,
    is_filter_list_approved: currentIsFilterListApproved = false,
    is_raw: currentIsRaw = true,
    is_sold_out: currentIsSoldOut = false,
    modifier_ids: currentModifierIDs = [],
    // option_variants: currentOptionVariants = [],
    photo: currentPhoto = initialPhoto,
    is_printed: currentIsPrinted = !!Object.keys(printers).length,
    printer_id: currentPrinterID = '',
    sizes: currentSizes = initialSizes,
    // tags: currentTags = [],
    tax_rate_id: currentTaxRateID = '',
    upsells: currentUpsells = [],
    variants = {}
  } = { ...item, ...item.variants?.[variant_id] }


  const [name, setName] = useState(currentName)
  const [internal_name, setInternalName] = useState(variant_id && !variants[variant_id]?.internal_name ? '' : currentInternalName)
  const [description, setDescription] = useState(currentDescription)
  const [is_visible, setIsVisible] = useState(currentIsVisible)
  const [is_option, setIsOption] = useState(currentIsOption)

  const [allow_comments, setAllowComments] = useState(currentAllowComments)
  const [comment_placeholder, setCommentPlaceholder] = useState(currentCommentPlaceholder)
  const [course, setCourse] = useState(currentCourse)
  const [filters, setFilters] = useState(currentFilters)
  const [is_filter_list_approved, setIsFilterListApproved] = useState(currentIsFilterListApproved)
  const [is_raw, setIsRaw] = useState(currentIsRaw)
  const [is_sold_out, setIsSoldOut] = useState(currentIsSoldOut)
  const [modifier_ids, setModifierIDs] = useState(currentModifierIDs)
  const [photo_id, setPhotoID] = useState(currentPhoto.id)
  const [localPhoto, setLocalPhoto] = useState(null)
  // const [photo_name, setPhotoName] = useState(currentPhoto.name || '')
  const [sizes, setSizes] = useState(currentSizes)
  const [tax_rate_id, setTaxRateID] = useState(currentTaxRateID)
  const [is_printed, setIsPrinted] = useState(currentIsPrinted)
  const [printer_id, setPrinterID] = useState(currentPrinterID)
  const [upsells, setUpsells] = useState(currentUpsells)

  const [showUpsellSelector, setShowUpsellSelector] = useState(false)
  const [showModifierSelector, setShowModifierSelector] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)


  useFocusEffect(useCallback(() => {
    setUpsells(prev => equalUpsells(prev, currentUpsells) ? prev : currentUpsells)
    setModifierIDs(prev => equalArrays(prev, currentModifierIDs) ? prev : currentModifierIDs)
  }, [currentModifierIDs, currentUpsells,]))

  const isAltered = name !== currentName
    || (internal_name !== currentInternalName && (!variant_id || !!variants[variant_id]))
    || (internal_name && variant_id && !variants[variant_id])
    || description !== currentDescription
    || is_visible !== currentIsVisible
    || is_option !== currentIsOption
    || allow_comments !== currentAllowComments
    || comment_placeholder !== currentCommentPlaceholder
    || course !== currentCourse
    || is_filter_list_approved !== currentIsFilterListApproved
    || (is_filter_list_approved && !equalFilters(filters, currentFilters))
    || is_raw !== currentIsRaw
    || is_sold_out !== currentIsSoldOut
    || !equalArrays(modifier_ids, currentModifierIDs, true)
    || photo_id !== currentPhoto.id
    || !!localPhoto
    || !equalSizes(sizes, currentSizes)
    || tax_rate_id !== currentTaxRateID
    || is_printed !== currentIsPrinted
    || (is_printed && printer_id !== currentPrinterID)
    || !equalUpsells(upsells, currentUpsells)

  const reset = () => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => {
          setName(currentName)
          setInternalName(currentInternalName)
          setDescription(currentDescription)
          setIsVisible(currentIsVisible)
          setIsOption(currentIsOption)

          setAllowComments(currentAllowComments)
          setCommentPlaceholder(currentCommentPlaceholder)
          setCourse(currentCourse)
          setFilters(currentFilters)
          setIsFilterListApproved(currentIsFilterListApproved)
          setIsRaw(currentIsRaw)
          setSizes(currentSizes)
          setTaxRateID(currentTaxRateID)
          setIsPrinted(currentIsPrinted)
          setPrinterID(currentPrinterID)
          setIsSoldOut(currentIsSoldOut)

          setModifierIDs(currentModifierIDs)
          setPhotoID(currentPhoto.id)
          setLocalPhoto('')
          setUpsells(currentUpsells)
        }
      },
      {
        text: 'No'
      }
    ]))
  }

  // Not sure if this closure is effective since on each render getting pickImage()
  const pickImage = useCallback(() => {
    let isPermitted = false

    return async () => {
      if (!isPermitted) {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status === 'granted') isPermitted = true
        else return dispatch(doAlertAdd('We need access to your camera roll', undefined, [
          {
            text: 'Go to settings',
            onPress: () => Linking.openSettings()
          },
        ], true))
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.cancelled) {
        setLocalPhoto(result);
      }
    }
  })

  const isDuplicateInternalName = useMemo(() => {
    if (variant_id && internal_name === item.internal_name) return true
    if (Object.keys(variants).some(v_id => v_id !== variant_id && variants[v_id].internal_name === internal_name)) return true
    return false
  }, [variants, variant_id, internal_name])

  const isVariantModifierOrderChanged = useMemo(() => {
    return !equalArrays(item.modifier_ids, modifier_ids)
  }, [item, modifier_ids])

  const isVariantUpsellsChanged = useMemo(() => {
    return !equalUpsells(item.upsells, upsells)
  }, [item, upsells])

  const save = async () => {
    let failed = []
    if (!name) failed.push('Missing name')
    if (!course) failed.push('Missing course')
    if (!tax_rate_id) failed.push('Missing tax rate')
    if (is_printed && !printer_id) failed.push('Missing printer')
    if (variant_id && !internal_name) failed.push('Missing internal name')
    if (isDuplicateInternalName) failed.push('All internal names must be different between variants')
    if (failed.length) {
      dispatch(doAlertAdd('Incorrect fields', [...failed]))
    }
    else {
      let packet = {}
      if (!id || name !== currentName) packet.name = name
      if (!id || internal_name !== currentInternalName) packet.internal_name = internal_name
      if (!id || is_visible !== currentIsVisible) packet.is_visible = is_visible
      if (variant_id && is_option !== currentIsOption) packet.is_option = is_option
      if (!id || description !== currentDescription) packet.description = description
      if (!id || allow_comments !== currentAllowComments) packet.allow_comments = allow_comments
      if (!id || comment_placeholder !== currentCommentPlaceholder) packet.comment_placeholder = comment_placeholder
      if (!id || course !== currentCourse) packet.course = course
      if (!id || is_filter_list_approved !== currentIsFilterListApproved) packet.is_filter_list_approved = is_filter_list_approved
      if (!id || !equalFilters(filters, currentFilters)) packet.filters = filters // gate by is_filter_list_approved?
      if (!id || is_raw !== currentIsRaw) packet.is_raw = is_raw
      if (!id || is_sold_out !== currentIsSoldOut) packet.is_sold_out = is_sold_out
      if (!id || !equalArrays(modifier_ids, currentModifierIDs, true)) packet.modifier_ids = modifier_ids
      if (!id || !equalUpsells(upsells, currentUpsells)) packet.upsells = upsells
      if (!id || !equalSizes(sizes, currentSizes)) packet.sizes = sizes
      if (!id || tax_rate_id !== currentTaxRateID) packet.tax_rate_id = tax_rate_id
      if (!id || is_printed !== currentIsPrinted) packet.is_printed = is_printed
      if (!id || printer_id !== currentPrinterID) packet.printer_id = printer_id
      if (!id || (!photo_id && currentPhoto.id)) {
        packet.photo = { ...initialPhoto }
        // delete photo if it was removed, but NOT if it was just replaced (if replace fails, keep old photo)
        if (currentPhoto.id && !localPhoto) deletePhoto(currentPhoto.id)
      }

      try {
        if (localPhoto) {
          const new_photo_id = (restaurantRef.collection('fake').doc()).id
          const { width, height, uri } = localPhoto
          const resized_width = width > height ? PHOTO_SAVE_SIZE : width / (height / PHOTO_SAVE_SIZE)
          const resized_height = height > width ? PHOTO_SAVE_SIZE : height / (width / PHOTO_SAVE_SIZE)

          const resized = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: resized_width, height: resized_height } }],
            {
              compress: 0.5,
              format: uri.substr(uri.lastIndexOf('.') + 1) === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG
            }
          )

          const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
              resolve(xhr.response);
            };
            xhr.onerror = function (e) {
              console.log(e);
              reject(new TypeError('Network request failed'));
            };
            xhr.responseType = 'blob';
            xhr.open('GET', resized.uri, true);
            xhr.send(null);
          });

          const storagePath = `restaurants/${restaurantRef.id}/${new_photo_id}`
          const storageRef = firebase.storage().ref(storagePath)

          const upload_task = storageRef.put(blob)

          upload_task.on(firebase.storage.TaskEvent.STATE_CHANGED,
            function (next) {
              setUploadProgress((next.bytesTransferred / next.totalBytes) * 100)
            },
          )

          return upload_task.then(async completed => {
            if (currentPhoto.id) {
              deletePhoto(currentPhoto.id)
            }
            console.log('PHOTO UPLOAD SUCCESS!: ')
            packet.photo = { ...initialPhoto, id: new_photo_id, modified: firebase.firestore.FieldValue.serverTimestamp() }
            return await batchSave(packet)
          }).catch(async error => {
            console.log('ItemsScreen failed image upload: ', error)
            return await batchSave(packet)
          })
        }

        return await batchSave(packet)
      }
      catch (error) {
        console.log('ItemsScreen save error: ', error)
        dispatch(doAlertAdd('Error saving item', 'Try again and please contact Torte if the error persists'))
      }
    }
  }

  const deletePhoto = async (old_photo_id) => {
    const storagePath = 'restaurants/' + restaurantRef.id + '/' + old_photo_id
    try {
      await firebase.storage().ref(storagePath).delete()
    }
    catch (error) {
      console.log('ItemsScreen deletePhoto error: ', error)
      dispatch(doAlertAdd('Error removing old photo from system'))
    }
  }

  const batchSave = async (packet) => {
    const batch = firebase.firestore().batch()

    const itemRef = id ? restaurantRef.collection('Items').doc(id) : restaurantRef.collection('Items').doc()
    const true_variant_id = variant_id === 'new' ? (restaurantRef.collection('fake').doc()).id : variant_id

    batch.set(itemRef, {
      ...true_variant_id ? { variants: { [true_variant_id]: { ...packet } } } : { ...packet },
      ...!id && {
        id: itemRef.id,
        is_deleted: false,
        restaurant_id: restaurantRef.id,
        variants: {},
      },
    }, { merge: true })

    if (!id) {
      if (section_id) {
        batch.set(restaurantRef.collection('Sections').doc(section_id), {
          item_order: firebase.firestore.FieldValue.arrayUnion({ item_id: itemRef.id, variant_id: '' })
        }, { merge: true })
      }
      if (upsell_item_id) {
        batch.set(restaurantRef.collection('Items').doc(upsell_item_id), {
          upsells: firebase.firestore.FieldValue.arrayUnion({ item_id: itemRef.id, variant_id: '', option_id: '' })
        }, { merge: true })
      }
      if (modifier_id) {
        batch.set(restaurantRef.collection('Modifiers').doc(modifier_id), {
          mods: firebase.firestore.FieldValue.arrayUnion({ item_id: itemRef.id, variant_id: '', option_id: '', preselected: 0, })
        }, { merge: true })
      }
    }


    return batch.commit().then(() => {
      if (packet.photo) {
        setPhotoID(packet.photo.id)
        setLocalPhoto('')
      }
      dispatch(doSuccessAdd())
      // if (menu_id) navigation.goBack()
      // you need to swap the local photo for the currentPhoto
      if (!id) navigation.setParams({ id: itemRef.id })
      if (variant_id === 'new') navigation.setParams({ variant_id: true_variant_id })
      if (variant_id && section_id) dispatch(doAlertAdd('Section already given root item', `If you want ${section_name} to have this variant (${internal_name}), please go back and edit the section directly.`))
      if (variant_id && upsell_item_id) dispatch(doAlertAdd('Upsell already given root item', `If you want ${upsell_item_name} to have this variant (${internal_name}), please go back and edit the item's upsells directly.`))
      if (variant_id && modifier_id) dispatch(doAlertAdd('Modifier already given root item', `If you want ${modifier_name} to have this variant (${internal_name}), please go back and edit the modifier directly.`))
    }).catch(error => {
      console.log('ItemsScreen save error: ', error)
      dispatch(doAlertAdd('Unable to save new details', [error.message, 'Please contact Torte if the error persists']))
    })
  }

  const setSizePrice = useCallback(text => {
    setSizes(prev => [{ ...prev[0], price: Number(text) }])
  }, [])

  const replaceVariant = useCallback(variant_id => {
    navigation.replace('Items', { id, section_id, section_name, variant_id, item_id: upsell_item_id, item_name: upsell_item_name, modifier_id, modifier_name })
  }, [id, section_id, section_name, upsell_item_id, upsell_item_name, modifier_id, modifier_name])

  const isVariantDeleted = useMemo(() => !!variant_id && variant_id !== 'new' && !variants[variant_id], [variant_id, variants])

  useEffect(() => {
    if (is_deleted) navigation.goBack()
    else if (isVariantDeleted) replaceVariant('')
  }, [is_deleted, isVariantDeleted, replaceVariant])

  const orderedTaxRateIDs = useMemo(() => Object.keys(tax_rates).sort((a, b) => {
    return tax_rates[a].percent - tax_rates[b].percent || (tax_rates[a].name.toLowerCase() < tax_rates[b].name.toLowerCase() ? -1 : 1)
  }), [tax_rates])

  const orderedPrinters = useMemo(() => Object.keys(printers).sort((a, b) => printers[a].station - printers[b].station), [printers])

  return (
    <>
      <PortalForm
        headerText={variant_id ? `Variant: ${internal_name || '(no name yet)'}` : id ? `Edit ${name}` : 'Create item'}
        save={save}
        reset={reset}
        isAltered={isAltered}
        saveText='Save item'
        uploadProgress={uploadProgress}
      >
        {!!variant_id && <PortalEnumField
          text='Is this variant an option?'
          subtext={'Variants can be used as mods or upsells' + '\n' + "We'll hide information not required for options"}
          value={is_option ? 'YES' : 'NO'}
          options={[true, false]}
          setValue={() => {
            setIsOption(prev => !prev)
            setSizes(prev => prev.slice(0, 1))
          }}
        />}

        <PortalEnumField
          text={variant_id ? 'Is this variant visible?' : 'Is this item visible?'}
          subtext='You can hide items while you work on them'
          isRed={!is_visible}
          value={is_visible ? 'YES' : 'HIDDEN'}
          options={[true, false]}
          setValue={setIsVisible}
          isDelta={!!variant_id && is_visible !== item.is_visible}
        />

        <PortalEnumField
          text={variant_id ? 'Is this variant sold out?' : 'Is this item sold out?'}
          isRed={is_sold_out}
          value={is_sold_out ? 'YES' : 'NO'}
          options={[true, false]}
          setValue={setIsSoldOut}
          isDelta={!!variant_id && is_sold_out !== item.is_sold_out}

        />

        {/* IS SOLD OUT??? */}


        <PortalGroup text='Basic info'>
          <PortalTextField
            text='Name'
            value={name}
            onChangeText={setName}
            isRequired
            placeholder='(required)'
            isDelta={!!variant_id && name !== item.name}
          />
          <PortalTextField
            text='Internal name'
            value={internal_name}
            onChangeText={setInternalName}
            placeholder={variant_id ? '(required)' : '(recommended)'}
            subtext={'Used to distinguish between two items with similar names' + '\n' + 'Must be different for all variants'}
            isRequired={!!variant_id}
            isDelta={!!variant_id && !!internal_name && internal_name !== item.internal_name}
            isRed={isDuplicateInternalName}
          />
          {(!variant_id || !is_option) && <PortalTextField
            text='Description'
            value={description}
            onChangeText={setDescription}
            placeholder='(recommended)'
            isDelta={!!variant_id && description !== item.description}
          />}
        </PortalGroup>

        <PortalGroup text='Essential helpers'>
          <PortalDropdownField
            text='Tax rate'
            subtext='You can edit these back in the MANAGE drawer'
            value={tax_rate_id}
            placeholder='(required)'
            options={tax_rates}
            orderedKeys={orderedTaxRateIDs}
            setValue={setTaxRateID}
            format={formatTaxRates}
            isRequired
            isDelta={!!variant_id && tax_rate_id !== item.tax_rate_id}
          // isLocked={!!variant_id}
          />

          {(!variant_id || !is_option) && <PortalDropdownField
            text='Course'
            subtext='ASAP, starter, main, or dessert'
            value={course.toUpperCase()}
            placeholder='(required)'
            options={COURSE_OPTIONS}
            setValue={setCourse}
            format={formatCourses}
            isRequired
            isDelta={!!variant_id && course !== item.course}
          />}

          <PortalCheckField value={is_printed} text='Print this item?' onPress={() => setIsPrinted(prev => !prev)} isDelta={!!variant_id && is_printed !== item.is_printed} />

          {is_printed && <PortalDropdownField
            text='Printer'
            value={printer_id}
            options={printers}
            orderedKeys={orderedPrinters}
            setValue={setPrinterID}
            format={formatPrinters}
            isRequired
            isDelta={!!variant_id && printer_id !== item.printer_id}
            placeholder='Select a printer'
          />}
        </PortalGroup>

        <PortalGroup text='Prices and sizes'>
          {
            sizes.length === 1
              ? <View>
                <PortalTextField
                  text='Price'
                  value={sizes[0].price}
                  onChangeText={setSizePrice}
                  isNumber
                  isNegativeAllowed
                  format={centsToDollar}
                  isDelta={!!variant_id && sizes[0]?.price !== item.sizes?.[0]?.price}
                />
                {(!variant_id || !is_option) && <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View>
                    <MediumText>Need a few price or size options?</MediumText>
                    <MediumText>E.g. Large or small, glass or bottle?</MediumText>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 40 }}>
                    <StyledButton text='Use multiple sizes' onPress={() => setSizes(prev => [...prev, ...initialSizes])} />
                  </View>
                </View>}
              </View>
              : <View style={{ marginBottom: 40 }}>
                <LargeText center>Guests will see the 3-letter code when browsing the menu</LargeText>
                <LargeText center>They will see the full name when looking at the item</LargeText>
                <MediumText center >Example codes: Bot for bottle; L for large</MediumText>
                <View style={{ marginVertical: 10 }}>
                  {
                    sizes.map((size, index) => <Size key={index} {...size} setSizes={setSizes} index={index} rootSize={item.sizes[index]} isVariant={!!variant_id} />)
                  }
                </View>
                <StyledButton text='Add another size' color={Colors.purple} style={{ alignSelf: 'flex-start' }} onPress={() => setSizes(prev => [...prev, ...initialSizes])} />
              </View>
          }

        </PortalGroup>


        <PortalGroup text='Dietary, nutrition, and health information'>
          {(!variant_id || !is_option) && <PortalEnumField
            text='Show raw warning?'
            isRed={!is_raw}
            value={is_raw ? 'YES' : 'NO'}
            options={[true, false]}
            setValue={setIsRaw}
            isDelta={!!variant_id && is_raw !== item.is_raw}
          />}

          <View style={{ marginVertical: 20, }}>
            <LargeText center>Nearly 1/3 of diners follow some special diet.</LargeText>
            <LargeText center>Dietary filters are a favorite feature of Torte users,</LargeText>
            <LargeText center>and we highly recommend you use them.</LargeText>
            <View style={{ marginVertical: 10 }}>
              <MediumText center bold>YOU ARE RESPONSIBLE FOR THIS CONTENT.</MediumText>
              <MediumText center bold>Please remember to update this information regularly.</MediumText>
            </View>
          </View>

          <PortalEnumField
            text='Show dietary filters?'
            isRed={!is_filter_list_approved}
            value={is_filter_list_approved ? 'YES' : 'NO'}
            subtext={!is_filter_list_approved && 'Guests with dietary restrictions will not see this item'}
            options={[true, false]}
            setValue={setIsFilterListApproved}
            isDelta={!!variant_id && is_filter_list_approved !== item.is_filter_list_approved}
          />

          <ItemFilters filters={filters} setFilters={setFilters} isVariant={!!variant_id} rootFilters={item.filters} />

        </PortalGroup>
        {(!variant_id || !is_option) && <PortalGroup text='Modifiers - request extra input from your guests' isDelta={!!variant_id && isVariantModifierOrderChanged}>
          <PortalDragger
            category='modifiers'
            child_ids={modifier_ids}
            setChildIDs={setModifierIDs}
            isAltered={isAltered}
          />
          <PortalAddOrCreate
            category='modifiers'
            navigationParams={id ? { item_id: id } : null}
            isAltered={isAltered}
            addExisting={() => setShowModifierSelector(true)}
          />
        </PortalGroup>}

        {(!variant_id || !is_option) && <PortalGroup text='Upsells - drive another purchase' isDelta={!!variant_id && isVariantUpsellsChanged}>
          <PortalDragger
            category='upsells'
            child_ids={upsells}
            setChildIDs={setUpsells}
            isAltered={isAltered}
          />
          <PortalAddOrCreate
            category='upsells'
            navigationParams={id ? { item_id: id, } : null}
            isAltered={isAltered}
            createNew={() => dispatch(doAlertAdd('What type of upsell?', 'Most upsells are OPTIONS, but you can use an ITEM as an upsell.', [
              {
                text: 'Option',
                onPress: () => navigation.navigate('Options', { item_id: id, item_name: name, })
              },
              {
                text: 'Item',
                onPress: () => navigation.push('Items', { item_id: id, item_name: name, })
              },
              {
                text: 'Cancel',
              }
            ]))}
            addExisting={() => setShowUpsellSelector(true)}
          />
        </PortalGroup>}

        {(!variant_id || !is_option) && <PortalGroup text='Guest comments'>
          <PortalEnumField
            text='Are guest comments allowed?'
            subtext='Guests can type extra requests'
            isRed={!allow_comments}
            value={allow_comments ? 'YES' : 'NO'}
            options={[true, false]}
            setValue={setAllowComments}
            isDelta={!!variant_id && allow_comments !== item.allow_comments}
          />
          <PortalTextField
            text='Comment placeholder'
            subtext='Message for your guests before they start typing'
            value={comment_placeholder}
            onChangeText={setCommentPlaceholder}
            placeholder='(optional)'
            isDelta={!!variant_id && comment_placeholder !== item.comment_placeholder}
          />
        </PortalGroup>}

        <PortalGroup text='Photo'>
          {
            variant_id ?
              <LargeText>At this time, we can only support one photo for all variants</LargeText> :
              <View>
                {
                  !!photo_id || !!localPhoto
                    ? <PortalPhoto photo_id={photo_id} uri={localPhoto?.uri} height={PHOTO_DISPLAY_SIZE} width={PHOTO_DISPLAY_SIZE} />
                    : <View style={{ alignItems: 'center', }}>
                      <TouchableOpacity onPress={pickImage()}>
                        <View style={{ alignItems: 'center', justifyContent: 'center', width: PHOTO_DISPLAY_SIZE, height: PHOTO_DISPLAY_SIZE, backgroundColor: Colors.darkgrey }}>
                          <MaterialIcons
                            name='photo'
                            size={PHOTO_DISPLAY_SIZE / 4}
                            color={Colors.white}
                            style={{ marginBottom: 10 }}
                          />
                          <LargeText>No photo</LargeText>
                        </View>
                      </TouchableOpacity>
                    </View>
                }
                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 30 }}>
                  <StyledButton onPress={pickImage()} text={photo_id ? 'Change photo' : 'Select photo'} center color={Colors.purple} />
                  <StyledButton onPress={() => {
                    setPhotoID('')
                    setLocalPhoto(null)
                  }} color={Colors.red} disabled={!photo_id && !localPhoto} text='Remove photo' center />
                </View>
                {
                  !!currentPhoto.id && (currentPhoto.id !== photo_id || !!localPhoto) &&
                  <StyledButton onPress={() => {
                    setPhotoID(currentPhoto.id)
                    setLocalPhoto(null)
                  }} text='Reset photo only' center color={Colors.midgrey} />
                }
              </View>
          }
        </PortalGroup>

        <PortalGroup text='Variants'>
          <View style={{ marginBottom: 10 }}>
            <MediumText>Do you have an almost identical listing of this item, with only a few changes?</MediumText>
            <MediumText>For example: a lunch price and a dinner price?</MediumText>
            <LargeText bold>Create a variant!</LargeText>
            <MediumText>Variants can also be used as mods or upsells.</MediumText>
          </View>
          {(!!variant_id || !!Object.keys(variants)?.length) && <PortalVariants key={'root'} isAltered={isAltered} id={id} replaceVariant={replaceVariant} category='items' currentVariantID={variant_id} internal_name={item.internal_name || '(no internal name)'} isRoot />}
          {Object.keys(variants).map(v_id => <PortalVariants key={v_id} isAltered={isAltered} id={id} variant_id={v_id} replaceVariant={replaceVariant} category='items' currentVariantID={variant_id} internal_name={variants[v_id].internal_name} />)}
          <StyledButton text='Add a variant' onPress={() => {
            if (!id) {
              dispatch(doAlertAdd('No item for variants', 'Finish creating the root item before starting a variant.'))
            }
            else if (isAltered) {
              dispatch(doAlertAdd('You have unsaved changes', 'You must save or discard all changed before creating a new variant.'))
            }
            else {
              replaceVariant('new')
            }
          }} style={{ alignSelf: Object.keys(variants).length ? 'center' : 'flex-start', marginVertical: 10 }} color={!id || isAltered ? Colors.darkgrey : Colors.purple} />
        </PortalGroup>



        {!!id && <PortalDelete category='items' id={id} isWithVariants={!!Object.keys(variants).length} />}
      </PortalForm>

      {!!showModifierSelector && <PortalSelector
        category={'modifiers'}
        selected={modifier_ids}
        setSelected={setModifierIDs}
        parent='items'
        close={() => setShowModifierSelector(false)}
      />}

      {!!showUpsellSelector && <PortalSelector
        category={'upsells'}
        selected={upsells}
        setSelected={setUpsells}
        parent='items'
        close={() => setShowUpsellSelector(false)}
      />}
    </>
  )
}

const Size = ({ index, name = '', code = '', price, setSizes, rootSize, isVariant }) => {
  const dispatch = useDispatch()
  const setField = useCallback(field => text => {
    setSizes(prev => {
      let copy = [...prev]
      copy[index] = { ...copy[index], [field]: field === price ? Number(text) : text }
      return copy
    })
  }, [index])

  return <View style={{
    flexDirection: 'row',
    marginVertical: 10,
    paddingBottom: 10,
    borderBottomColor: Colors.lightgrey,
    borderBottomWidth: StyleSheet.hairlineWidth,
  }}>
    <View>
      <ExtraLargeText style={{ marginTop: 8, }}>Size {index + 1}:</ExtraLargeText>

      <TouchableOpacity style={{ marginTop: 20, alignSelf: 'center' }} onPress={() => dispatch(doAlertAdd(
        name ? `Delete size ${name}` : 'Delete unnamed size?',
        undefined,
        [
          {
            text: 'Yes, delete',
            onPress: () => setSizes(prev => [...prev.slice(0, index), ...prev.slice(index + 1)])
          },
          {
            text: 'No, cancel',
          }
        ]
      ))}>
        <MaterialCommunityIcons
          name='delete-forever'
          size={32}
          color={Colors.red}

        />
      </TouchableOpacity>
    </View>
    <View style={{ flex: 1, marginLeft: 50 }}>

      <PortalTextField
        text='3-letter code'
        // subtext='e.g. Bot for bottle or L for large'
        value={code}
        limit={3}
        onChangeText={setField('code')}
        placeholder='(required)'
        isRequired
        autoCorrect={false}
        isDelta={isVariant && code !== rootSize?.code}
      />
      <PortalTextField
        text='Longer name'
        value={name}
        onChangeText={setField('name')}
        placeholder='(required)'
        isRequired
        isDelta={isVariant && name !== rootSize?.name}
      />

      <PortalTextField
        text='Price'
        value={price}
        onChangeText={setField('price')}
        isNumber
        format={centsToDollar}
        isDelta={isVariant && price !== rootSize?.price}
      />
    </View>
  </View>
}


const styles = StyleSheet.create({

});


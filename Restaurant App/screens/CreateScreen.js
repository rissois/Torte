import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  Platform,
  Keyboard,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import firebase from '../config/Firebase';
import categories from '../constants/categories';
import { setTracker } from '../redux/actionsTracker';
import RenderOverlay from '../components/RenderOverlay';
import useRestaurant from '../hooks/useRestaurant';

const prompts = {
  loading: {
    top_main: ' ',
    top_placeholder: ' ',
    bottom_main: ' ',
    bottom_placeholder: ' ',
  },
  meal: {
    top_main: 'Give a descriptor for this meal',
    top_clarify: 'Try to keep this under 12 characters. If you only have one meal for the entire day, you can call this Menu or Menus',
    top_placeholder: 'e.g. ‘Dinner’ or ‘Brunch’',
    top_example: (input) => `Example appearance: Thursday ${input ? input : '[descriptor]'}`,
    bottom_main: 'Give an internal name for the meal (recommended)',
    bottom_clarify: 'This is for your records, and will not be shown to guests',
    bottom_placeholder: 'e.g. Weekday dinners - Spring',
  },
  menu: {
    top_main: 'Give a descriptor for this menu',
    top_clarify: 'Try to keep this under 12 characters',
    top_placeholder: 'e.g. ‘Food’, ‘Drinks’, ‘Happy hour’',
    top_example: (input) => `Guests see: ${input ? input : '[descriptor]'} menu`,
    bottom_main: 'Give an internal name for the menu (recommended)',
    bottom_clarify: 'This is for your records, and will not be shown to guests',
    bottom_placeholder: 'e.g. Sunday brunch menu - Spring',
  },
  section: {
    top_main: 'Give a title for this section',
    top_clarify: 'Try to keep this under 30 characters',
    top_placeholder: 'e.g. Appetizers, Pizzas, Beer',
    bottom_main: 'Give an internal name for the section (optional)',
    bottom_clarify: 'This is for your records, and will not be shown to guests',
    bottom_placeholder: 'e.g. Entrees - Standard',
  },
  item: {
    top_main: 'Give a name for this item',
    top_clarify: 'Try to keep this under 30 characters',
    top_placeholder: 'e.g. Barbacoa tacos',
    bottom_main: 'Give an internal name for the item (optional)',
    bottom_clarify: 'This is for your records, and will not be shown to guests',
    bottom_placeholder: '[item name]',
  }
}

export default function CreateScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()
  let { category = 'loading' } = route?.params
  const { tracker: { [category]: doc_id }, tracker } = useSelector(state => state)
  // Not actually necessary... you could just do a param and if no param then you know it's new
  const [topInput, setTopInput] = useState(route?.params?.name ?? '')
  const [bottomInput, setBottomInput] = useState(route?.params?.internal_name ?? '')
  const [bottomInputFocused, setBottomInputFocused] = useState(false)
  const bottomRef = useRef(null)
  const [submitError, setSubmitError] = useState(null)
  const [greyBottom, setGreyBottom] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setGreyBottom((!topInput && !bottomInput && !bottomInputFocused))
  }, [topInput, bottomInput, bottomInputFocused])

  const updateOrCreate = async (nav) => {
    if (doc_id) {
      /*
      Rather than update the name or internal name here 
      This is passed back to the doc's main page
      And is saved tehre
      */

      // if (topInput !== route?.params?.name || bottomInput !== route?.params?.internal_name) {
      //   try {
      //     setIsSaving(true)
      //     await firebase.firestore().collection('restaurants').doc(restaurant_id)
      //       .collection(categories[category].collection).doc(doc_id)
      //       .update({
      //         name: topInput,
      //         internal_name: bottomInput
      //       })
      //     setIsSaving(false)
      //     navigation.navigate(categories[category].screen, { name: topInput, internal_name: bottomInput })
      //   }
      //   catch (error) {
      //     setIsSaving(true)
      //     console.log('Create screen update error: ', error)
      //   }
      // }
      // else {
      navigation.navigate(categories[category].screen, { name: topInput, internal_name: bottomInput })
      // }
    }
    else if (category === 'meal') {
      // Meal is created on the MealHours screen
      if (nav) { // Handles either Back or Exit
        nav()
      }
      else {
        navigation.navigate('MealHours', { name: topInput, internal_name: bottomInput })
      }
    }
    else { // Create a new doc
      try {
        setIsSaving(true)
        var batch = firebase.firestore().batch()

        let collectionRef = firebase.firestore().collection('restaurants').doc(restaurant_id).collection(categories[category].collection)
        let docRef = collectionRef.doc()

        // If this creation comes form within a parent doc (i.e. a new section is being added directly to a menu, via the tracker)
        // add this new document to the parent section/itemOrder
        let parent_category = categories[category].parent
        let parent_doc_id = tracker[parent_category]
        if (parent_doc_id) {
          let parentRef = firebase.firestore().collection('restaurants').doc(restaurant_id).collection(categories[parent_category].collection).doc(parent_doc_id)
          batch.update(parentRef, {
            [categories[parent_category].childOrder]: firebase.firestore.FieldValue.arrayUnion(docRef.id)
          })
        }

        switch (category) {
          case 'menu':
            batch.set(docRef, {
              name: topInput,
              internal_name: bottomInput,
              // menu_id: docRef.id,
              sectionOrder: [],
              live: !parent_doc_id,
            })
            break;
          case 'section':
            batch.set(docRef, {
              name: topInput,
              internal_name: bottomInput,
              // menu_ids: parent_doc_id ? [parent_doc_id] : [],
              itemOrder: [],
              photoAd: '',
              live: !parent_doc_id,
              description: '',
            })
            break;
          case 'item':
            batch.set(docRef, {
              name: topInput,
              taxRate: '',
              internal_name: bottomInput,
              price: 0,
              description: '',
              // section_ids: parent_doc_id ? [parent_doc_id] : [],
              // menu_ids: parent_doc_id ? sections[parent_doc_id].menu_ids : [],
              specOrder: [],
              modOrder: [],
              commentsAllowed: true,
              commentNote: '',
              filtersAllowed: true,
              filters: {
                vegan: false,
                vegetarian: false,
                pescatarian: false,
                glutenFree: false,
                peanutFree: false,
                treenutFree: false,
                dairyFree: false,
                shellfishFree: false,
                eggFree: false,
              },
              raw: true,
              live: !parent_doc_id,
              sold_out: false,
              photo: {
                name: '',
                date_modified: null
              }
            })
        }

        // can await
        await batch.commit()
        setIsSaving(false)

        if (nav) { // Handles either Back or Exit
          nav()
        }
        else {
          dispatch(setTracker({ [category]: docRef.id }))
          navigation.replace(categories[category].screen)
        }
      }
      catch (error) {
        setIsSaving(true)
        console.log('updateOrCreate errro: ', error)
        Alert.alert(`Could not save ${categories[category].singular}`, 'Please try again. Contact Torte support if the issue persists.')
        setSubmitError(true)
      }
    }
  }

  const goBack = (home) => {
    let nav = home ? () => navigation.navigate('Dashboard') : () => navigation.goBack()

    if ((!doc_id && category !== 'meal' && topInput) ||
      (doc_id && route.params.name !== topInput && route.params.internal_name !== bottomInput)) {
      Alert.alert('Unsaved ' + (doc_id ? 'changes' : category), 'Do you want to ' + (doc_id ? 'keep these changes' : 'save this ' + category) + '?', [
        {
          text: 'Yes',
          onPress: () => {
            updateOrCreate(nav)
          }
        },
        {
          text: 'No, ' + (home ? 'exit' : 'go back'),
          onPress: () => nav(),
        },
        {
          text: 'Cancel',
          style: "cancel"
        },

      ])
    }
    else {
      nav()
    }
  }

  // useEffect(() => {
  //   setIsSaving(false)
  // }, [])


  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <MenuHeader leftText='Back' leftFn={() => { goBack() }}
        // {...!doc_id && {
        //   rightText: 'Exit',
        //   rightFn: () => { goBack(true) }
        // }}
        // rightText='Exit' 
        // rightFn={() => { goBack(true) }} 
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', width: Layout.window.width * 0.8, alignSelf: 'center' }}>
          <DisablingScrollView center keyboardShouldPersistTaps='always'>
            <View style={{}}>
              {!!submitError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
                <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>ERROR WITH SUBMISSION</LargeText>
              </View>}
              <LargeText style={{ textAlign: 'center' }}>{prompts[category].top_main}</LargeText>
              {!!prompts[category].top_clarify && <ClarifyingText style={{ textAlign: 'center' }}>{prompts[category].top_clarify}</ClarifyingText>}
              <View style={{
                width: Layout.window.width * 0.7,
                alignSelf: 'center',
                marginTop: Layout.spacer.small,
                borderBottomColor: topInput ? Colors.softwhite : Colors.lightgrey,
                borderBottomWidth: 2,
                paddingBottom: 3,
              }}>
                <TextInput
                  style={{
                    fontSize: 28,
                    paddingHorizontal: 4,
                    color: Colors.softwhite,
                    textAlign: 'center',
                  }}
                  autoCapitalize={'sentences'}
                  autoCompleteType={'off'}
                  autoCorrect={false}
                  autoFocus
                  blurOnSubmit={false}
                  enablesReturnKeyAutomatically
                  onChangeText={text => setTopInput(text)}
                  onSubmitEditing={() => {
                    bottomRef.current.focus()
                  }}
                  placeholder={prompts[category].top_placeholder}
                  placeholderTextColor={Colors.lightgrey}
                  returnKeyType='next'
                  selectTextOnFocus
                  value={topInput}
                />
              </View>
              {!!prompts[category].top_example && <MainText style={{ textAlign: 'center', marginTop: 8 }}>{prompts[category].top_example(topInput)}</MainText>}

            </View>

            <View style={{ minHeight: Layout.spacer.large }} />

            <View style={{}}>
              <LargeText style={{ textAlign: 'center', ...greyBottom && { color: Colors.darkgrey } }}>{prompts[category].bottom_main}</LargeText>
              <ClarifyingText {...greyBottom} style={{ textAlign: 'center', ...greyBottom && { color: Colors.darkgrey } }}>{prompts[category].bottom_clarify}</ClarifyingText>
              <View style={{
                width: Layout.window.width * 0.7,
                alignItems: 'center',
                alignSelf: 'center',
                marginTop: Layout.spacer.small,
                borderBottomColor: greyBottom ? Colors.darkgrey : bottomInput ? Colors.softwhite : Colors.lightgrey,
                borderBottomWidth: 2,
                paddingBottom: 3,

              }}>
                <TextInput
                  style={{
                    fontSize: 28,
                    paddingHorizontal: 4,
                    color: greyBottom ? Colors.darkgrey : Colors.softwhite,
                  }}
                  autoCapitalize={'sentences'}
                  autoCompleteType={'off'}
                  // autoCorrect={true}
                  blurOnSubmit={false}
                  editable={!greyBottom}
                  enablesReturnKeyAutomatically
                  onChangeText={text => setBottomInput(text)}
                  onSubmitEditing={() => Keyboard.dismiss()}
                  placeholder={prompts[category].bottom_placeholder}
                  placeholderTextColor={greyBottom ? Colors.darkgrey : Colors.lightgrey}
                  ref={bottomRef}
                  // returnKeyType='done'
                  selectTextOnFocus
                  value={bottomInput}
                  onFocus={() => setBottomInputFocused(true)}
                  onBlur={() => setBottomInputFocused(false)}
                />
              </View>
            </View>

            <View style={{ marginTop: Layout.spacer.medium }}>
              <MenuButton text={doc_id ? 'Confirm' : 'Next'} color={topInput ? Colors.purple : Colors.darkgrey} minWidth buttonFn={updateOrCreate} disabled={!topInput} />
            </View>

          </DisablingScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {isSaving && <RenderOverlay text='Saving changes' opacity={0.9} />}
    </View >
  );
}

const styles = StyleSheet.create({
  body: {
    width: Layout.window.width * 0.7,
    alignSelf: 'center'
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,

    elevation: 10,
  },
  rectPadding: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  }
});
import React from 'react';
import {
  StyleSheet,
  View,
  Alert,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import categories from '../constants/categories';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector, useDispatch } from 'react-redux';
import firebase from '../config/Firebase';
import { StaticList } from '../components/PortalRow';
import objectToArray from '../functions/objectToArray';
import { setTracker } from '../redux/actionsTracker';
import { deletePhoto } from '../redux/actionsPhotos';
import commaList from '../functions/commaList';
import { MaterialIcons, } from '@expo/vector-icons';



export default function CategoryListScreen({ navigation, route }) {
  let { category = 'unk' } = route?.params
  const { [categories[category].redux]: categoryData = {}, restaurant } = useSelector(state => state)
  const state = useSelector(state => state)

  const dispatch = useDispatch()

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} />
        <HeaderText center>All {categories[category].plural}</HeaderText>
        {category === 'modification' && <MainText center>"Modification" is another term for Add-On</MainText>}
        {(category === 'item' || category === 'meal' || category === 'menu') && <TouchableOpacity onPress={() => navigation.navigate('WallOfText', { page: category, terminal: true })}>
          <MainText center style={{ marginTop: Layout.spacer.small }}>Read our advice on {categories[category].plural}</MainText>
        </TouchableOpacity>}

        <View style={{ width: Layout.window.width * 0.8, alignSelf: 'center', flex: 1 }}>
          <TouchableOpacity onPress={() => {
            if (category === 'photoAd') {
              navigation.navigate('PhotoAd1')
            }
            else if (category === 'specification') {
              navigation.navigate('Spec')
            }
            else if (category === 'modification') {
              navigation.navigate('Mod')
            }
            else {
              navigation.navigate('Create', { category })
            }
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: Layout.spacer.small, borderWidth: 2, borderColor: Colors.darkgreen, alignSelf: 'center', paddingVertical: 12, borderRadius: 20 }}>
              <MaterialIcons name='add-circle' size={32} color={Colors.green} style={{ marginHorizontal: 20, }} />
              <LargeText center>Create new {categories[category].singular}</LargeText>
              <MaterialIcons name='add-circle' size={32} color={Colors.green} style={{ marginHorizontal: 20, }} />
            </View>
          </TouchableOpacity>
          <LargeText style={{ marginBottom: Layout.spacer.small }}>Select a {categories[category].singular} to edit or delete</LargeText>
          <StaticList
            // data={test.sort()}
            data={objectToArray(categoryData).sort((a, b) => a.name > b.name)}
            mainTextKey='name'
            rightTextKey={category === 'modification' ? 'price' : 'internal_name'}
            docIdKey='key'
            onPress={(doc_id) => {
              dispatch(setTracker({ [category]: doc_id }))
              navigation.navigate(categories[category].screen)
            }}
            del={(doc_id, rightText) => {
              let parent = categories[categories[category].parent]
              Alert.alert(`Delete ${rightText || category}?`, `This will remove the ${category} from your entire system${category !== 'menu' ? category === 'item' ? ', including all sections, photo ads, and photos' : `, including all ${parent.plural}` : ''}. This action cannot be undone.`, [
                {
                  text: 'Yes', onPress: async () => {
                    try {
                      const photoAdsWithItem = []
                      var batch = firebase.firestore().batch()
                      console.log('DELETING ' + categories[category].singular + ': ', doc_id, ' FROM ', restaurant.restaurant_id)

                      // Remove references in "parent" collection
                      if (category === categories.photoAd.singular) { // Photoad removes from section.photoAd
                        let sections = state.sections
                        Object.keys(sections).forEach(section_id => {
                          if (sections[section_id].photoAd === doc_id) {
                            let parentRef = firebase.firestore().collection('restaurants').doc(restaurant.restaurant_id).collection(categories.section.collection).doc(section_id)
                            batch.update(parentRef, {
                              photoAd: null
                            })
                          }
                        })
                      }
                      else if (category !== categories.menu.singular) {  // Remove from parent item/sectionOrder
                        let parentData = state[parent.redux]
                        let catOrder = categories[category].order

                        Object.keys(parentData).forEach(parent_id => {
                          if (parentData[parent_id][catOrder]?.includes(doc_id)) {
                            let parentRef = firebase.firestore().collection('restaurants').doc(restaurant.restaurant_id).collection(parent.collection).doc(parent_id)
                            batch.update(parentRef, {
                              [catOrder]: firebase.firestore.FieldValue.arrayRemove(doc_id)
                            })
                          }
                        })

                        // Items must also remove from any photoAds
                        if (category === categories.item.singular) {
                          let photoAds = state[categories.photoAd.singular] ?? {}
                          Object.keys(photoAds).forEach(ad_id => {
                            if (photoAds[ad_id].topOrder?.includes(doc_id) || photoAds[ad_id].bottomOrder?.includes(doc_id) || photoAds[ad_id].largeOrder?.includes(doc_id)) {
                              photoAdsWithItem.push(photoAds[ad_id].name)
                              let adRef = firebase.firestore().collection('restaurants').doc(restaurant.restaurant_id).collection(categories.photoAd.collection).doc(ad_id)
                              batch.update(adRef, {
                                topOrder: firebase.firestore.FieldValue.arrayRemove(doc_id),
                                bottomOrder: firebase.firestore.FieldValue.arrayRemove(doc_id),
                                largeOrder: firebase.firestore.FieldValue.arrayRemove(doc_id),
                              })
                            }
                          })
                        }
                      }

                      let docRef = firebase.firestore().collection('restaurants').doc(restaurant.restaurant_id).collection(categories[category].collection).doc(doc_id)
                      batch.delete(docRef)



                      await batch.commit()

                      if (category === categories.item.singular) {
                        dispatch(deletePhoto(doc_id))

                        if (photoAdsWithItem.length) {
                          Alert.alert(photoAdsWithItem.length + (photoAdsWithItem.length > 1 ? ' photo ads ' : ' photo ad ') + 'affected', 'Please remember to edit any photo ads that contained this item: ' + commaList(photoAdsWithItem))
                        }
                      }
                    }
                    catch (error) {
                      console.log('categoryListScreen delete error: ', error)
                      Alert.alert(`Could not delete ${categories[category].singular}`, 'Please try again. Contact Torte support if the issue persists.')
                    }
                  }
                },
                {
                  text: 'No, cancel',
                  style: 'cancel'
                },
              ])
            }}
            addNew={() => {
              if (category === 'photoAd') {
                navigation.navigate('PhotoAd1')
              }
              else if (category === 'specification') {
                navigation.navigate('Spec')
              }
              else if (category === 'modification') {
                navigation.navigate('Mod')
              }
              else {
                navigation.navigate('Create', { category })
              }
            }}
            category={category}
          />
        </View>


      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
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
  },
  portalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center'
  }
});

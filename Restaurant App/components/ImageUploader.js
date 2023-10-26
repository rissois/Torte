
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Alert,
  ImageBackground,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { MainText, ClarifyingText, LargeText } from './PortalText'
import * as ImagePicker from 'expo-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import { deletePhoto, uploadPhoto } from '../redux/actionsPhotos';
import { MaterialIcons, } from '@expo/vector-icons';
import { CircleShadow } from '../components/TorteGradientLogo';
import commaList from '../functions/commaList';


const photoErrors = {
  upload: 'u',
  download: 'd',
  delete: 'x',
  cancel: 'c'
}

export default function ImageUploader(props) {
  /*
  REMINDER: FOR IMAGE DISPLAYER, ADD A ACTIVITY INDICATOR WHILE LOADING
  (see FileSystem createDownloadResumable)
  */
  const { photoAds = {} } = useSelector(state => state)
  const dispatch = useDispatch()
  let { item_id, name, upload = {}, fetch = {}, del = {}, uri, iconSize = 200 } = props
  let isLogo = item_id === 'logo'
  const [photoError, setPhotoError] = useState(null)
  const [imageHeight, setImageHeight] = useState(null)

  const checkPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        // REQUEST PHOTO ACCESS VIA LINKING
        Alert.alert('Requires access to photos', 'This must be changed in Settings',
          [
            { text: 'Go to settings', onPress: () => Linking.openSettings() },
            {
              text: 'Cancel',
              style: 'cancel'
            },
          ])
        return false
      }
    }
    return true
  }

  const selectPhoto = async () => {
    return await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    })
  }

  useEffect(() => {
    // const getImageSize = async () => {
    //   try {
    // let { exists = false } = uri ? await FileSystem.getInfoAsync(uri) : {}
    if (uri && !isLogo) {
      Image.getSize(uri, (width, height) => {
        if (width > height) {
          setImageHeight(height / (width / (iconSize * 2)))
        }
        else {
          setImageHeight(null)
        }
      })
    }
    else {
      setImageHeight(null)
    }
    //   }
    //   catch (error) {
    //     console.log('getImageSize error: ', error)
    //     setImageHeight(null)
    //   }
    // }

    // getImageSize()

  }, [uri, iconSize, isLogo])

  useEffect(() => {
    setPhotoError(null)
    if (upload?.upload_fail) {
      setTimeout(() => {
        setPhotoError(photoErrors.upload)
      }, photoError ? 100 : 0)
    }
    else if (upload?.upload_cancel) {
      setTimeout(() => {
        setPhotoError(photoErrors.cancel)
      }, photoError ? 100 : 0)
    }
    else if (fetch?.fetch_fail) {
      setTimeout(() => {
        setPhotoError(photoErrors.download)
      }, photoError ? 100 : 0)
    }
    else if (del?.delete_fail) {
      setTimeout(() => {
        setPhotoError(photoErrors.delete)
      }, photoError ? 100 : 0)
    }
  }, [upload, fetch, del])

  if (upload.upload_progress) {
    return <View style={{ alignItems: 'center' }}>
      <LargeText style={{ textAlign: 'center' }}>Uploading photo</LargeText>
      <ClarifyingText style={{ textAlign: 'center' }}>{Math.round(upload.upload_progress)}% complete</ClarifyingText>
      <ImageBackground
        style={{ height: imageHeight ?? iconSize * 2, width: iconSize * 2, justifyContent: 'center', alignItems: 'center', marginVertical: isLogo ? 0 : Layout.spacer.small }}
        source={{ uri }}
        resizeMode='contain'
      >
        <View style={[styles.progressBar, {}]}>
          <View style={{ flex: 1, width: upload.upload_progress + '%', backgroundColor: Colors.purple, borderRadius: Layout.spacer.small, }} />
        </View>
      </ImageBackground>
      <TouchableOpacity onPress={() => {
        upload.upload_task.cancel()
      }}>
        <MainText>Cancel upload</MainText>
      </TouchableOpacity>
    </View>
  }

  if (uri) {
    return <View style={{ alignItems: 'center' }}>
      <LargeText style={{ textAlign: 'center' }}>{isLogo ? 'Your logo' : 'Item photo'}:</LargeText>
      <Image
        style={{ height: imageHeight ?? iconSize * 2, width: iconSize * 2, marginVertical: isLogo ? 0 : Layout.spacer.small }}
        source={{ uri }}
        resizeMode='contain'
      />

      <TouchableOpacity onPress={async () => {
        let has_permission = await checkPermission()
        if (has_permission) {
          let photo = await selectPhoto()
          if (photo.uri) {
            Alert.alert('Are you sure you want to replace this photo?', undefined, [
              { text: 'Yes', onPress: () => dispatch(uploadPhoto(item_id, isLogo ? 'logo' : name, photo)) },
              {
                text: 'Cancel',
                style: 'cancel'
              },
            ])
          }
        }
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Layout.spacer.small }}>
          <MaterialIcons name='add-circle' size={30} color={Colors.lightgrey} />
          <LargeText style={{ textAlign: 'center', marginHorizontal: Layout.spacer.small, }}>Replace photo</LargeText>
          <MaterialIcons name='add-circle' size={30} color={Colors.lightgrey} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => {
        const photoAdsWithItem = Object.keys(photoAds).reduce((acc, ad_id) => {
          if (photoAds[ad_id].topOrder?.includes(item_id) || photoAds[ad_id].bottomOrder?.includes(item_id) || photoAds[ad_id].largeOrder?.includes(item_id)) {
            return acc.concat(photoAds[ad_id].name)
          }
          return acc
        }, [])

        Alert.alert('Are you sure you want to delete this photo?', photoAdsWithItem.length ? `This will affect the photo ${photoAdsWithItem.length > 1 ? 'ads' : 'ad'}: ${commaList(photoAdsWithItem)}.You'll want to correct this after deletion.` : undefined, [
          {
            text: 'Yes', onPress: () => {
              dispatch(deletePhoto(item_id))
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          },
        ])
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name='remove-circle' size={30} color={Colors.red} />
          <LargeText style={{ textAlign: 'center', marginHorizontal: Layout.spacer.small }}>Delete photo</LargeText>
          <MaterialIcons name='remove-circle' size={30} color={Colors.red} />
        </View>
      </TouchableOpacity>

      {!!photoError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
        <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>{photoError === photoErrors.upload ? 'UNABLE TO UPLOAD PHOTO' : photoError === photoErrors.cancel ? 'UPLOAD CANCELLED' : photoError === photoErrors.download ? 'UNABLE TO RETRIEVE UPLOAD' : photoError === photoErrors.delete ? 'UNABLE TO DELETE PHOTO' : 'ERROR WITH PHOTO'}</LargeText>
      </View>}
    </View>
  }

  return <View style={{ alignItems: 'center' }}>
    <LargeText style={{ textAlign: 'center' }}>Do you have a {isLogo ? 'logo' : 'photo of this item'}?</LargeText>
    <ClarifyingText style={{ textAlign: 'center' }}>Upload a jpeg, png, or tiff (max 20MB)</ClarifyingText>

    <CircleShadow borderRadius={iconSize * 0.6} style={{ marginTop: Layout.spacer.large }}>
      <TouchableOpacity style={{
        alignSelf: 'center',
        backgroundColor: Colors.purple,
        paddingHorizontal: iconSize * 0.1,
        paddingTop: iconSize * 0.075,
        paddingBottom: iconSize * 0.125,
        borderRadius: iconSize * 0.6
      }} onPress={async () => {
        let has_permission = await checkPermission()
        if (has_permission) {
          let photo = await selectPhoto()
          if (photo.uri) {
            // let { size } = await FileSystem.getInfoAsync(uri, { size: true })
            // if (size > 20000000) {
            //   Alert.alert('Image is too large', `Please keep image below 20MB. This image was ${Math.round(size / 100000) / 10}MB`)
            // }
            // else {
            dispatch(uploadPhoto(item_id, isLogo ? 'logo' : name, photo))
            // }
          }
        }
      }}>
        <MaterialIcons name='cloud-upload' size={iconSize} color={Colors.softwhite} />
      </TouchableOpacity>
    </CircleShadow>

    {!!photoError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
      <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>{photoError === photoErrors.upload ? 'UNABLE TO UPLOAD PHOTO' : photoError === photoErrors.cancel ? 'UPLOAD CANCELLED' : photoError === photoErrors.download ? 'UNABLE TO RETRIEVE UPLOAD' : photoError === photoErrors.delete ? 'UNABLE TO DELETE PHOTO' : 'ERROR WITH PHOTO'}</LargeText>
    </View>}
  </View>
}

const styles = StyleSheet.create({
  progressBar: {
    width: Layout.window.width * 0.5,
    alignSelf: 'center',
    height: Layout.spacer.small,
    borderColor: Colors.softwhite,
    backgroundColor: Colors.darkgrey + 'AA',
    borderWidth: 3,
    borderRadius: Layout.spacer.small,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,

    elevation: 6,

  }
});

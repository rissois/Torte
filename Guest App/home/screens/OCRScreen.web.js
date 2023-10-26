import React, { useState, useEffect, useRef, useCallback, } from 'react';

import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';

import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, MaterialCommunityIcons, } from '@expo/vector-icons';

import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';

import SafeView from '../../utils/components/SafeView';
import { DefaultText, LargeText, MediumText, SmallText } from '../../utils/components/NewStyledText';
import { getFirestore, collection, doc, } from 'firebase/firestore'
import { getStorage, ref, uploadBytesResumable, } from 'firebase/storage'
import firebaseApp from '../../firebase/firebase';
import { useMyID, useMyName } from '../../utils/hooks/useUser';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { getFunctions, httpsCallable } from 'firebase/functions';
import StyledButton from '../../utils/components/StyledButton';
import * as ImageManipulator from 'expo-image-manipulator';

const firestore = getFirestore(firebaseApp)
const functions = getFunctions(firebaseApp)
const storage = getStorage(firebaseApp)

const TIMING = {
  delay: 300,
  duration: 2000
}

// https://cloud.google.com/vision/docs/supported-files#image_sizing
const VISION_DIMENSIONS = {
  height: 1024,
  width: 768,
}

const OVERLAY_COLOR = Colors.black + '44'

const SHUTTER_SIZE = 46
const PROGRESS_SIZE = 20

export default function OCRScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const cameraRef = useRef(null);
  const myID = useMyID()
  const myName = useMyName()
  const isNamed = route.params?.isNamed

  const [cameraPermission, setCameraPermission] = useState(null)
  const [isTorchOn, setIsTorchOn] = useState(false)
  const [isFrontCamera, setIsFrontCamera] = useState(false)
  const [isFlashOn, setIsFlashOn] = useState(false)
  const breathAnim = useRef(new Animated.Value(0)).current
  const [summaryWidth, setSummaryWidth] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadTask, setUploadTask] = useState(false)
  const [isOCR, setIsOCR] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [preview, setPreview] = useState(null)
  const [isCameraReady, setIsCameraReady] = useState(false)

  useEffect(() => {
    if (cameraPermission) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            breathAnim,
            {
              toValue: 1,
              duration: TIMING.duration,
              delay: TIMING.delay,
              useNativeDriver: false
            },
          ),
          Animated.timing(
            breathAnim,
            {
              toValue: 0,
              duration: TIMING.duration,
              delay: TIMING.delay,
              useNativeDriver: false
            },
          ),
        ])).start()
    }
  }, [cameraPermission])

  // Request for camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = useCallback(() => {
    /*
    The exif data returned on web is a partial representation of the MediaTrackSettings, if available.
    */
    const snap = async () => {
      if (isCameraReady) {
        try {
          const photo = await cameraRef.current.takePictureAsync()
          setPreview(photo)
        }
        catch (error) {
          console.log('ReceiptScreen snap error: ', error)
        }
      }
    }

    snap()
  }, [isCameraReady])

  const pickPhoto = useCallback(async () => {
    // No permissions request is necessary for launching the image library
    const photo = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!photo.cancelled) {
      setPreview(photo);
    }
  }, [])

  const uploadPhoto = useCallback(async () => {
    try {
      setIsUploading(true)

      let resized = null

      // Resize items to smallest recommended
      const isPortrait = preview.height > preview.width
      const rotatedDimensions = { height: VISION_DIMENSIONS[isPortrait ? 'height' : 'width'], width: VISION_DIMENSIONS[isPortrait ? 'width' : 'height'] }
      const heightScale = preview.height / rotatedDimensions.height
      const widthScale = preview.width / rotatedDimensions.width
      if (heightScale > 1 || widthScale > 1) {
        if (heightScale > widthScale) {
          // width must still match VISION_DIMENSIONS
          resized = await ImageManipulator.manipulateAsync(preview.uri, [{ resize: { height: preview.height / widthScale, width: rotatedDimensions.width } }])
        }
        else {
          // height must still match VISION_DIMENSIONS
          resized = await ImageManipulator.manipulateAsync(preview.uri, [{ resize: { height: rotatedDimensions.height, width: preview.width / heightScale } }])
        }
      }
      else resized = preview

      const receipt_id = doc(collection(firestore, "Receipt")).id
      const storagePath = `receipts/${myID}/${receipt_id}`
      const storageRef = ref(storage, storagePath)

      // https://github.com/expo/examples/blob/master/with-firebase-storage-upload/App.js
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.log(e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", resized.uri, true);
        xhr.send(null);
      });

      const uploadTask2 = uploadBytesResumable(storageRef, blob)

      setUploadTask(uploadTask2)

      uploadTask2.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          setUploadProgress(progress)
        },
        (error) => {
          // Handle unsuccessful uploads
          setIsUploading(false)

          setUploadTask(null)
          switch (error.code) {
            case 'storage/unauthorized':
              // User doesn't have permission to access the object
              dispatch(doAlertAdd('Error occurred', 'Please try again'))
              break;
            case 'storage/canceled':
              // User canceled the upload
              dispatch(doAlertAdd('Upload cancelled'))
              break;
            case 'storage/unknown':
              // Unknown error occurred, inspect error.serverResponse
              dispatch(doAlertAdd('An unknown error occurred', 'Please try again'))
              break;
          }
        },
        async () => {
          // Handle successful uploads on complete
          // For instance, get the download URL: https://firebasestorage.googleapis.com/...

          setIsOCR(true)

          try {
            await httpsCallable(functions, 'scanReceipt-scanReceipt')({ receipt_id })
            setIsUploading(false)
            setUploadTask(null)
            setIsOCR(false)
            navigation.navigate('Link', { receipt_id })
          }
          catch (error) {
            dispatch(doAlertAdd('Text detecting failed', 'Please try again with a different photo'))
            setIsUploading(false)
            setUploadTask(null)
            setIsOCR(false)
          }

          // getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          //   console.log('File available at', downloadURL);
          // });
        }
      )


    }
    catch (error) {
      console.log(`ReceiptScreen uploadPhoto error: ${error}`)
      dispatch(doAlertAdd('Upload failed', 'Please try again'))
      setIsUploading(false)
      setUploadTask(null)
    }


  }, [preview, myID])

  useEffect(() => {
    if (isNamed) uploadPhoto()
  }, [uploadPhoto, isNamed])

  if (!cameraPermission) {
    return <SafeView backgroundColor={Colors.black}>
      <TouchableOpacity style={styles.iconPadding} onPress={() => {
        navigation.goBack()
      }}>
        <MaterialIcons
          name={"arrow-back"}
          size={30}
          color={Colors.white}
        />
      </TouchableOpacity>

      <View style={styles.missingPermissionView}>
        <LargeText maxScale={1.5} style={{ marginBottom: 12 }} center>We need access to your camera for this feature</LargeText>
        <LargeText maxScale={1.5} style={{ marginBottom: 12 }} center>You can grant permission in your phone's settings for this browser</LargeText>
      </View>

      <ShutterBar  {...{ isCameraReady, pickPhoto, setIsFlashOn, isFlashOn, setIsFrontCamera, setIsTorchOn, isTorchOn, isCameraReady, takePhoto }} />
    </SafeView>
  }


  return <SafeView backgroundColor={Colors.black}>
    <Camera style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      type={isFrontCamera ? Camera.Constants.Type.front : Camera.Constants.Type.back}
      ref={cameraRef}
      autoFocus={Camera.Constants.AutoFocus.on}
      flashMode={isTorchOn ? Camera.Constants.FlashMode.torch : isFlashOn ? Camera.Constants.FlashMode.on : Camera.Constants.FlashMode.off}
      onCameraReady={() => {
        setIsCameraReady(true)
      }}
    />

    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={[styles.box, styles.boxOutline, { width: summaryWidth, }]}>
        <DefaultText center >RESTAURANT NAME</DefaultText>
        <SmallText center >(if written on receipt)</SmallText>
      </View>

      <View style={{ flex: 1 }} />

      <View style={[styles.box, styles.boxOutline]} onLayout={({ nativeEvent }) => setSummaryWidth(nativeEvent.layout.width)}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name='chevron-double-down' size={30} color={Colors.white} />
          <View style={{ paddingHorizontal: 16 }}>
            <DefaultText center>SUMMARY AT BOTTOM</DefaultText>
            <SmallText center>(subtotal, tax, total)</SmallText>
          </View>
          <MaterialCommunityIcons name='chevron-double-down' size={30} color={Colors.white} />
        </View>
      </View>


      <Animated.View style={[styles.animatedLines, {
        marginHorizontal: breathAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, (Layout.window.width - summaryWidth) / 2 - 10]
        })
      }]} />

      <View style={{ position: 'absolute', top: 0, left: 0, zIndex: 100 }}>
        <TouchableOpacity style={{ padding: 6, backgroundColor: OVERLAY_COLOR }} onPress={() => navigation.goBack()}>
          <MaterialIcons
            name={"arrow-back"}
            size={30}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>

      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={[styles.box, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }]}>
            <MaterialCommunityIcons name='chevron-double-left' size={30} color={Colors.white} />
            <View style={{ paddingHorizontal: 16 }}>
              <DefaultText center>MAKE SURE SIDES OF</DefaultText>
              <DefaultText center >BILL ARE STRAIGHT!</DefaultText>
            </View>
            <MaterialCommunityIcons name='chevron-double-right' size={30} color={Colors.white} />
          </View>
        </View>
      </View>

    </View>

    <ShutterBar {...{ pickPhoto, setIsFlashOn, isFlashOn, setIsFrontCamera, setIsTorchOn, isTorchOn, isCameraReady, takePhoto }} />

    {
      !!preview && <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: Colors.black }}>
        <Image
          style={{ height: Layout.window.height, width: Layout.window.width }}
          source={{ uri: preview.uri }}
          resizeMode='contain'
        />
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.black + '44' }]}>
          <View style={{ backgroundColor: OVERLAY_COLOR, paddingHorizontal: 20, paddingVertical: 8 }}>
            <LargeText center>Use this photo?</LargeText>
          </View>
          <TouchableOpacity style={styles.previewBox} onPress={myName ? uploadPhoto : () => navigation.navigate('Name', { isNewReceipt: true })}>
            <MediumText center bold>Yes</MediumText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.previewBox} onPress={() => setPreview(null)}>
            <MediumText center bold>No</MediumText>
          </TouchableOpacity>
        </View>
        {isUploading && <ProgressScreen {...{ isOCR, uploadProgress, uploadTask }} />}
      </View>
    }
  </SafeView>
}

const ProgressScreen = ({ uploadProgress, uploadTask, isOCR }) => {
  return <View style={[StyleSheet.absoluteFill, {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black + 'DA'
  }]}>
    <ActivityIndicator size='large' color={Colors.white} />
    <LargeText center style={{ marginVertical: 40 }}>{isOCR ? 'Detecting text...' : uploadProgress < 100 ? 'Uploading...' : 'Saving...'}</LargeText>

    {!!uploadTask && !isOCR && <View>
      <View style={[styles.progressBar]}>
        <View style={{ flex: 1, width: uploadProgress + '%', backgroundColor: Colors.purple, borderRadius: PROGRESS_SIZE, }} />
      </View>
      <StyledButton style={{ marginVertical: 40 }} text='Cancel upload' onPress={() => uploadTask.cancel()} />
    </View>
    }
  </View>
}

const ShutterBar = ({ pickPhoto, setIsFlashOn, isFlashOn, setIsFrontCamera, setIsTorchOn, isTorchOn, isCameraReady, takePhoto }) => {
  return <View style={styles.controls}>
    <TouchableOpacity disabled={!isCameraReady} style={{ padding: 8 }} onPress={() => setIsFlashOn(prev => !prev)}>
      <MaterialCommunityIcons
        name={isFlashOn && isCameraReady ? "flash" : "flash-off"}
        size={24}
        color={isFlashOn && isCameraReady ? Colors.white : Colors.lightgrey}
      />
    </TouchableOpacity>

    <TouchableOpacity disabled={!isCameraReady} style={{ padding: 8 }} onPress={() => setIsTorchOn(prev => !prev)}>
      <MaterialCommunityIcons
        name={isTorchOn && isCameraReady ? "lightbulb-on" : "lightbulb-on-outline"}
        size={24}
        color={isTorchOn && isCameraReady ? Colors.white : Colors.lightgrey}
      />
    </TouchableOpacity>

    <TouchableOpacity disabled={!isCameraReady} onPress={takePhoto}>
      <View style={[styles.shutterOutline, { borderColor: isCameraReady ? Colors.white : Colors.lightgrey }]}>
        <View style={[styles.shutter, { backgroundColor: isCameraReady ? Colors.white : Colors.lightgrey }]} />
      </View>
    </TouchableOpacity>

    <TouchableOpacity disabled={!isCameraReady} style={{ padding: 8 }} onPress={() => setIsFrontCamera(prev => !prev)}>
      <MaterialIcons
        name='switch-camera'
        size={24}
        color={isCameraReady ? Colors.white : Colors.lightgrey}
      />
    </TouchableOpacity>

    <TouchableOpacity style={{ padding: 8 }} onPress={pickPhoto}>
      <MaterialIcons
        name='photo-library'
        size={24}
        color={Colors.white}
      />
    </TouchableOpacity>
  </View>
}


const styles = StyleSheet.create({
  missingPermissionView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40
  },
  overlayShadow: {
    textShadowColor: Colors.black,
    textShadowRadius: 5,
  },
  animatedLines: {
    borderColor: Colors.white,
    borderRightWidth: 2,
    borderLeftWidth: 2,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  box: {
    backgroundColor: OVERLAY_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 12
  },
  boxOutline: {
    borderColor: Colors.white + 'CC',
    borderWidth: 2,
  },
  controls: {
    backgroundColor: Colors.darkgrey + 'AA',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  shutterOutline: {
    padding: 5,
    borderWidth: 2,
    borderRadius: SHUTTER_SIZE
  },
  shutter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE
  },
  previewBox: {
    backgroundColor: OVERLAY_COLOR,
    width: Layout.window.width * 0.3,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: Colors.white,
    marginTop: 20,
  },
  progressBar: {
    width: Layout.window.width * 0.5,
    alignSelf: 'center',
    height: PROGRESS_SIZE,
    borderColor: Colors.white,
    backgroundColor: Colors.darkgrey + 'AA',
    borderWidth: 3,
    borderRadius: PROGRESS_SIZE,
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

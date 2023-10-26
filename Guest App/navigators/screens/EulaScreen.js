import React, { useState, useMemo } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Animated,
} from "react-native";
import { useSelector, } from 'react-redux';
import Colors from '../../utils/constants/Colors';
import { WebView } from 'react-native-webview'
import confirmEULA from '../../transactions/confirmEULA';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import { MediumText, DefaultText, ExtraLargeText, LargeText, } from '../../utils/components/NewStyledText';
import StyledButton from '../../utils/components/StyledButton';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import BackIcon from '../../utils/components/BackIcon';
import Layout from '../../utils/constants/Layout';
import { selectIsEULANeeded, selectIsEULARepeated } from '../../redux/selectors/selectorsApp';


export default function EulaScreen({ navigation, route }) {
    const isEULARequested = useSelector(selectIsEULANeeded)
    const isEULARepeated = useSelector(selectIsEULARepeated)

    const reviewEULA = !!route?.params?.eula
    const reviewPrivacy = !!route?.params?.privacy

    const [eulaSubmitted, setEulaSubmitted] = useState(false)
    const [showEULA, setShowEULA] = useState(false)
    const [showPrivacy, setShowPrivacy] = useState(false)
    const [eulaAgreed, setEulaAgreed] = useState(false)
    const [privacyAgreed, setPrivacyAgreed] = useState(false)
    const [submitError, setSubmitError] = useState(false)

    const [warn] = useState(new Animated.Value(0))

    const warnAnimation = () => {
        Animated.sequence([
            Animated.timing(
                warn,
                {
                    toValue: 1,
                    delay: 0,
                    duration: 0,
                    useNativeDriver: false,
                }
            ),
            Animated.timing(
                warn,
                {
                    toValue: 0,
                    delay: 700,
                    duration: 1000,
                    useNativeDriver: false
                }
            )
        ]).start()
    }

    const backButton = useMemo(() => <BackIcon name='close' backFn={() => {
        setShowEULA(false)
        setShowPrivacy(false)
    }} />, [])

    if (showEULA || reviewEULA) {
        return <SafeView>
            {/* <View style={{ flex: 1 }}> */}
            <Header left={backButton}>
                <ExtraLargeText center>END USER LICENSE AGREEMENT (“EULA”)</ExtraLargeText>
            </Header>
            <WebView startInLoadingState renderLoading={() => {
                return <View style={styles.webView}>
                    <IndicatorOverlay text='Loading...' black />
                </View>
            }} source={{ uri: 'https://tortepay.com/eulaWebView' }} />
            {/* </View> */}
        </SafeView>
    }

    if (showPrivacy || reviewPrivacy) {
        return <SafeView>
            <Header left={backButton}>
                <ExtraLargeText center>PRIVACY POLICY</ExtraLargeText>
            </Header>
            <WebView startInLoadingState renderLoading={() => {
                return <View style={styles.webView}>
                    <IndicatorOverlay text='Loading...' black />
                </View>
            }} source={{ uri: 'https://tortepay.com/privacyWebView' }} />
        </SafeView>
    }

    return <SafeView>
        {isEULARequested ? <View style={{ flex: 1, marginHorizontal: 20, }}>
            <View style={{ flex: 1, justifyContent: 'center', marginHorizontal: Layout.marHor }}>
                {submitError && <View>
                    <LargeText red bold center>ERROR SAVING RESPONSE</LargeText>
                    <MediumText red center>Check your internet connection and try again</MediumText>
                </View>}
            </View>
            {isEULARepeated && <MediumText>We've changed our policies.</MediumText>}
            <MediumText>Do you agree to Torte's:</MediumText>
            <View style={{ borderRadius: 12, backgroundColor: Colors.darkgrey, padding: 14, marginTop: 14 }}>
                <MediumText bold>End-User License Agreement?</MediumText>
                <DefaultText>Our rules for the use of Torte.</DefaultText>
                <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => { setShowEULA(true) }}><View style={{ paddingHorizontal: 12, paddingVertical: 3, borderRadius: 30, backgroundColor: Colors.keygrey }}><MediumText>View</MediumText></View></TouchableOpacity>
                    <TouchableOpacity onPress={() => { setEulaAgreed(prev => !prev) }}><Animated.View style={{
                        paddingHorizontal: 12, paddingVertical: 3, borderRadius: 30, backgroundColor: eulaAgreed ? Colors.darkgreen : warn.interpolate({
                            inputRange: [0, 1],
                            outputRange: [Colors.background, Colors.red]
                        })
                    }}><MediumText>I agree</MediumText></Animated.View></TouchableOpacity>
                </View>
            </View>
            <View style={{ borderRadius: 12, backgroundColor: Colors.darkgrey, padding: 14, marginTop: 14 }}>
                <MediumText bold>Privacy Policy?</MediumText>
                <DefaultText>Discloses how we treat your data.</DefaultText>
                <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => { setShowPrivacy(true) }}><View style={{ paddingHorizontal: 12, paddingVertical: 3, borderRadius: 30, backgroundColor: Colors.keygrey }}><MediumText>View</MediumText></View></TouchableOpacity>
                    <TouchableOpacity onPress={() => { setPrivacyAgreed(prev => !prev) }}><Animated.View style={{
                        paddingHorizontal: 12, paddingVertical: 3, borderRadius: 30, backgroundColor: privacyAgreed ? Colors.darkgreen : warn.interpolate({
                            inputRange: [0, 1],
                            outputRange: [Colors.background, Colors.red]
                        })
                    }}><MediumText>I agree</MediumText></Animated.View></TouchableOpacity>
                </View>
            </View>
            <View style={{ flex: 2, flexShrink: 0, justifyContent: 'flex-end' }}>
                {(!eulaAgreed || !privacyAgreed) && <MediumText center>Please press "I agree" for each policy above</MediumText>}
                {isEULARequested && <StyledButton
                    style={{ marginTop: 15, marginHorizontal: 50, ...(!eulaAgreed || !privacyAgreed) && { backgroundColor: Colors.darkgrey } }}
                    text='Continue'
                    onPress={async () => {
                        if (eulaAgreed && privacyAgreed) {
                            setSubmitError(false)
                            setEulaSubmitted(true)
                            try {
                                await confirmEULA()
                                navigation.goBack()
                            }
                            catch (error) {
                                setSubmitError(true)
                                setEulaSubmitted(false)
                                console.log('ConnectScreen agreed error', error)
                            }
                        }
                        else {
                            warnAnimation()
                        }
                    }}

                />}
            </View>
        </View> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <StyledButton
                onPress={() => navigation.navigate('Home')}
                text='Go home'
            />
        </View>}

        {eulaSubmitted && <IndicatorOverlay text='Saving response' black />}
    </SafeView>
}

const styles = StyleSheet.create({
    webView: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },

});
import {
    StyleSheet,
} from 'react-native';
import Colors from '../../utils/constants/Colors';

export const codeTextInputs = StyleSheet.create({

    textInput: {
        marginVertical: 20,
        paddingBottom: 4,
        borderBottomColor: Colors.white,
        borderBottomWidth: 1,
        width: '50%',
        alignSelf: 'center',
        textAlign: 'center',
        color: Colors.white,
        fontSize: 24,
    },
    fakeTextInput: {
        height: 0,
        width: 0,
        color: 'rgba(43,52,69,0)'
    },
});
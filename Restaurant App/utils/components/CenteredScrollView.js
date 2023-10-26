import React, { useState, useMemo } from 'react';
import {
  View,
} from 'react-native';
import {
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native-gesture-handler';

export default CenteredScrollView = ({ main, secondary }) => {
  const [pageHeight, setPageHeight] = useState(null)
  const [mainHeight, setMainHeight] = useState(null)
  const [secondaryHeight, setSecondaryHeight] = useState(null)

  const measuredContent = useMemo(() => (<TouchableWithoutFeedback disabled>
    <View onLayout={({ nativeEvent }) => setMainHeight(nativeEvent.layout.height)}>
      {main}
    </View>
  </TouchableWithoutFeedback>), [main])

  return (

    <View style={{ flex: 1, justifyContent: 'center' }} onLayout={({ nativeEvent }) => setPageHeight(nativeEvent.layout.height)}>
      {
        mainHeight >= pageHeight - secondaryHeight ?
          <ScrollView
            indicatorStyle='white'
            style={{}}
            contentContainerStyle={{}}
          >
            {measuredContent}
          </ScrollView> :
          measuredContent
      }

      <TouchableWithoutFeedback disabled>
        <View onLayout={({ nativeEvent }) => setSecondaryHeight(nativeEvent.layout.height)}>
          {secondary}
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
}

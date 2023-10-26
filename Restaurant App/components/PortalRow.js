import React, { useState, } from 'react';
import {
  StyleSheet,
  View,
  PixelRatio,
  Alert,
  Image
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { MainText, LargeText } from './PortalText'
import { TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialIcons, MaterialCommunityIcons, } from '@expo/vector-icons';
import DraggableFlatList from "react-native-draggable-flatlist";
import DisablingScrollView from '../components/DisablingScrollview';
import categories from '../constants/categories';
import centsToDollar from '../functions/centsToDollar';
import { useSelector, } from 'react-redux';
import { militaryToClock } from '../functions/dateAndTime';


/*
  <StaticList
    // data={test.sort()}
    data={test}
    dataReference={ref}
    labelReference={threeLetterDays}
    // labelTextKey
    mainTextKey='name'
    rightTextKey='right'
    onPress={() => console.log('pressed')}
    del={() => console.log('delete')}
    add={() => console.log('add')}
    category='menu'
  />
*/

/*
  <DraggableList
    data={test}
    setData={setTest}
    dataReference={ref}
    mainTextKey='name'
    rightTextKey='right'
    onPress={() => console.log('pressed')}
    del={() => console.log('delete')}
    add={() => console.log('add')}
    category='menu'
  />
*/

function brokenCategory(category, doc_id) {
  if (!category) {
    return false
  }
  const { [categories[category].redux]: categoryData = {}, } = useSelector(state => state)
  let { [doc_id]: docData } = categoryData
  const state = useSelector(state => state)

  switch (category) {
    case 'meal': {
      let mealData = state.restaurant.meals[doc_id]
      let menus = state.menus
      return !mealData || !mealData.live || !mealData.menus.length || !~mealData.menus.findIndex(menu => menus[menu.menu_id]?.live)
    }
    case 'menu': {
      let sections = state.sections
      // Any live section = OK
      return !docData || !docData.live || !docData.sectionOrder.length || !~docData.sectionOrder.findIndex(section_id => {
        return sections[section_id]?.live
      })
    }
    case 'section': {
      let items = state.items
      // Any live item = OK
      return !docData || !docData.live || !docData.itemOrder.length || !~docData.itemOrder.findIndex(item_id => {
        return items[item_id]?.live
      })
    }
    case 'item': {
      return !docData || !docData.live || !docData.taxRate
    }
    case 'specification': {
      return !docData || !docData.options?.length
    }
    case 'modification': {
      return !docData || !docData.name || typeof docData.price !== 'number'
    }
    case 'photoAd': {
      let photos = state.photos
      return !docData || !docData.live || !!~docData.topOrder.findIndex(item_id => {
        return !photos[item_id]?.uri
      }) ||
        !!~docData.bottomOrder.findIndex(item_id => {
          return !photos[item_id]?.uri
        }) ||
        !!~docData.largeOrder.findIndex(item_id => {
          return !photos[item_id]?.uri
        })
    }
    case 'photo':
    case 'option':
    case 'employee':
      return false
    default:
      return true
  }
}


export const StaticList = (props) => {
  let { data, dataReference, docIdKey, labelReference, labelTextKey, mainTextKey, rightTextKey, onPress, del, addNew, addExisting, category = '', selected, showTime } = props
  const [leftWidth, setLeftWidth] = useState(null)

  return <DisablingScrollView contentContainerStyle={{ width: Layout.window.width * 0.8, alignSelf: 'center', paddingBottom: 40 }}>
    {data.map((item, index) => {
      // DataReference means the data itself is a document id
      let doc_id = dataReference ? item : item[docIdKey]
      let isBroken = dataReference && !dataReference[item]

      return <PortalRow
        key={doc_id}
        doc_id={doc_id}
        showTime={showTime}
        label={labelReference ? labelTextKey ? (labelReference[item]?.[labelTextKey] ?? 'UNK') : (labelReference[index] ?? 'UNK') : undefined}
        leftWidth={leftWidth}
        setLeftWidth={setLeftWidth}
        mainText={isBroken ? `Missing ${category === 'photoAd' ? 'photo ad' : categories[category].singular}` : dataReference ? (dataReference[item][mainTextKey] ?? `Missing ${mainTextKey}`) : item[mainTextKey]}
        rightText={isBroken ? undefined : rightTextKey === 'price' ? centsToDollar(dataReference?.[item]?.price ?? item.price) : rightTextKey ? dataReference ? (dataReference[item][rightTextKey] ?? `Missing ${rightTextKey}`) : item[rightTextKey] : undefined}
        onPress={isBroken ? () => Alert.alert(`Missing ${category === 'photoAd' ? 'photo ad' : categories[category].singular}`, `This may be a ${category === 'photoAd' ? 'photo ad' : categories[category].singular} you already deleted. If you are missing a ${category === 'photoAd' ? 'photo ad' : categories[category].singular}, please contact Torte Support`) : onPress}
        del={del}
        category={category}
        selected={selected}
        {...showTime && {
          time: {
            start: dataReference ? dataReference[item].start : item.start,
            end: dataReference ? dataReference[item].end : item.end
          }
        }}
      />
    })}
    {!data.length && <View style={[styles.rectPadding, { alignItems: 'flex-start' }]}><LargeText style={{ color: Colors.red }}>No {categories[category].plural} available{category === 'photo' ? ', add photos to your items to see them here.' : ''}</LargeText></View>}
    <View style={{ alignItems: 'flex-start' }}>
      {addNew && <AddRow text={`Create a new ${category === 'photoAd' ? 'photo ad' : categories[category].singular}`} onPress={addNew} marginLeft={leftWidth ?? 0} paddingVertical={16} />}
      {addExisting && <AddRow text={`Add an existing ${category === 'photoAd' ? 'photo ad' : categories[category].singular}`} onPress={addExisting} marginLeft={leftWidth ?? 0} paddingVertical={16} />}
    </View>
  </DisablingScrollView>
}

export const DraggableList = (props) => {
  let { data, dataReference, docIdKey, mainTextKey, rightTextKey, onPress, del, addNew, addExisting, category = '', allowDrag = true, showTime } = props
  const [leftWidth, setLeftWidth] = useState(null)


  return <DraggableFlatList
    scrollEnabled={false}
    contentContainerStyle={{ width: Layout.window.width * 0.8, alignSelf: 'center', }}
    data={data}
    dragHitSlop={{ top: 0, bottom: 0, left: 0, right: -(Layout.window.width * 0.8 - leftWidth - 16) }}
    keyExtractor={(item) => {
      if (typeof item === 'string') {
        return item
      }
      else {
        return item.name
      }
    }}
    onDragEnd={({ data }) => {
      props.setData(data)
    }}
    ListEmptyComponent={() => <View style={[styles.rectPadding, { alignItems: 'flex-start' }]}><LargeText style={{ color: Colors.red }}>No {category === 'photoAd' ? 'photo ad' : categories[category].singular} selected</LargeText></View>}
    renderItem={({ item, drag, isActive, index }) => {
      // DataReference means the data itself is a document id
      let doc_id = dataReference ? item : item[docIdKey]
      let isBroken = dataReference && !dataReference[item]

      return <PortalRow
        // key={item}
        doc_id={doc_id}
        drag={allowDrag ? drag : null}
        isActive={isActive}
        leftWidth={leftWidth}
        setLeftWidth={setLeftWidth}
        mainText={isBroken ? `Missing ${category === 'photoAd' ? 'photo ad' : categories[category].singular}` : dataReference ? (dataReference[item][mainTextKey] ?? `Missing ${mainTextKey}`) : item[mainTextKey]}
        rightText={isBroken ? undefined : rightTextKey === 'price' ? centsToDollar(dataReference?.[item]?.price ?? item.price) : rightTextKey ? dataReference ? (dataReference[item][rightTextKey] ?? `Missing ${rightTextKey}`) : item[rightTextKey] : undefined}
        onPress={isBroken ? () => Alert.alert(`Missing ${category === 'photoAd' ? 'photo ad' : categories[category].singular}`, `This may be a ${category === 'photoAd' ? 'photo ad' : categories[category].singular} you already deleted. If you are missing a ${category === 'photoAd' ? 'photo ad' : categories[category].singular}, please contact Torte Support`) : onPress}
        del={del}
        category={category}
        index={index}
        {...showTime && {
          time: {
            start: dataReference ? dataReference[item].start : item.start,
            end: dataReference ? dataReference[item].end : item.end
          }
        }}
      />
    }}
    ListFooterComponent={() => <View style={{ alignItems: 'flex-start' }}>
      {addNew && <AddRow text={`Create a new ${category === 'photoAd' ? 'photo ad' : categories[category].singular}`} onPress={addNew} marginLeft={leftWidth ?? 0} paddingVertical={16} />}
      {addExisting && <AddRow text={`Add an existing ${category === 'photoAd' ? 'photo ad' : categories[category].singular}`} onPress={addExisting} marginLeft={leftWidth ?? 0} paddingVertical={16} />}
    </View>
    }
  />
}

export const AddRow = (props) => {
  let { text, onPress, marginLeft, paddingVertical } = props

  return <TouchableOpacity onPress={onPress} style={[styles.shadow, { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginLeft }]}>
    <MaterialIcons name='add-circle' size={40} color={Colors.green} style={{ marginHorizontal: 20, }} />
    <View style={{ paddingVertical: props.paddingVertical }}>
      <LargeText>{text}</LargeText>
    </View>
  </TouchableOpacity>
}

export const PortalRow = (props) => {
  let { doc_id, drag, isActive, label, leftWidth, setLeftWidth, isRed = false, onPress, mainText, rightText, del, category, selected, time, index } = props
  const broken = brokenCategory(category, doc_id)
  const [checkWidth, setCheckWidth] = useState(null)
  const layoutLeft = ({ nativeEvent }) => {
    setLeftWidth(prev => {
      if (nativeEvent.layout.width > prev) {
        return nativeEvent.layout.width
      }
      return prev
    })
  }

  const layoutCheck = ({ nativeEvent }) => setCheckWidth(nativeEvent.layout.width)

  return <View style={[styles.container, styles.shadow, { width: isActive ? Layout.window.width * 0.9 : Layout.window.width * 0.8, }]}>
    {!!drag && <TouchableOpacity onLayout={layoutLeft} onPressIn={drag} style={[styles.drag, { backgroundColor: isRed || broken ? Colors.red : Colors.darkgrey, }]}>
      <View >
        <MaterialIcons name='unfold-more' size={PixelRatio.getFontScale() * 36} color={Colors.softwhite} />
      </View>
    </TouchableOpacity>}
    <TouchableOpacity onPress={() => onPress(doc_id, index)} containerStyle={{ flex: 1 }} style={{ flexDirection: 'row' }}>
      {!!label && <View onLayout={layoutLeft} style={[styles.rectPadding, styles.label, { width: leftWidth, backgroundColor: isRed || broken ? Colors.red : Colors.darkgrey, }]}>
        <LargeText>{label}</LargeText>
      </View>}
      <View style={[styles.rectPadding, { backgroundColor: isRed || broken ? Colors.red : Colors.darkgrey, ...category === 'photo' && { paddingVertical: 8, } }]}>
        <View style={styles.main}>
          {!!selected && <View onLayout={layoutCheck}>
            <MaterialCommunityIcons
              name='checkbox-marked-circle-outline'
              color={selected?.includes(doc_id) ? broken ? Colors.softwhite : Colors.green : broken ? Colors.red : Colors.darkgrey}
              size={34}
              style={{ marginHorizontal: Layout.spacer.small, }}
            />
          </View>}

          <LargeText style={{ flex: 1, }} numberOfLines={1} ellipsizeMode={'tail'}>{mainText}</LargeText>
          {category === 'photo' ? <Image style={{ height: 120, width: 120 }} source={{ uri: rightText }} /> : <LargeText style={{ maxWidth: selected ? '40%' : '60%' }}>{rightText}</LargeText>}
        </View>
        {!!time && <MainText style={{ marginLeft: checkWidth }}>{militaryToClock(time.start)}-{militaryToClock(time.end)}</MainText>}
      </View>
    </TouchableOpacity>
    {!!del && <TouchableOpacity onPress={() => { del(doc_id, category === 'modification' ? mainText : rightText || mainText, index) }}><MaterialIcons name='remove-circle' size={40} color={Colors.red} style={{ marginLeft: 20, }} /></TouchableOpacity>}
  </View>
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
    width: '100%'
  },
  container: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  drag: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: {
    marginRight: 16,
    alignItems: 'center',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

});
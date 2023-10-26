import React, { useCallback, useMemo, } from 'react';
import {
  StyleSheet,
  View,
  PixelRatio,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector, } from 'react-redux';
import { DefaultText } from '../../utils/components/NewStyledText';
import { TouchableOpacity } from 'react-native-gesture-handler';
import centsToDollar from '../../utils/functions/centsToDollar';
import { doTrackersSet } from '../../redux/actions/actionsTrackers';
import { useItemVariant } from '../../utils/hooks/useItems';
import arrayToCommaList from '../../utils/functions/arrayToCommaList';
import { initialFilters } from '../../redux/reducers/reducerFilters';
import { useActiveFilterKeys } from '../../utils/hooks/useFilters';

// https://react-redux.js.org/api/hooks#useselector-examples

export default function MenuItems({ variant_id, item_id, section_id, }) {
  const dispatch = useDispatch()
  const {
    name = '',
    description = '',
    sizes = [{ price: 0 }],
    is_raw,
    is_sold_out,
    is_filter_list_approved,
    filters,
    photo
  } = useItemVariant(item_id, variant_id)

  const activeFilterKeys = useActiveFilterKeys()

  const canBeFilters = useMemo(() => arrayToCommaList(activeFilterKeys.filter(key => typeof filters[key] === 'number').map(key => initialFilters[key].name.toLowerCase())), [filters, activeFilterKeys])

  const onPress = useCallback(() => {
    dispatch(doTrackersSet({
      section_id,
      item_id,
      variant_id
    }))
  }, [section_id, item_id, variant_id])


  const isRed = !is_filter_list_approved && !!activeFilterKeys.length
  const subtextColor = isRed ? Colors.white : Colors.lightgrey

  return <TouchableOpacity onPress={onPress}>
    <View style={[styles.border, { ...isRed && { backgroundColor: Colors.red } }]}>
      <View style={{ opacity: is_sold_out ? 0.3 : 1 }}>
        <View style={{ flex: 1, flexDirection: 'row', }}>
          <View style={{ flex: 1, }}>
            <View style={styles.textView}>
              {!!photo.id && <MaterialIcons
                name="photo-camera"
                size={Math.min(17 * PixelRatio.getFontScale(), 30)}
                color={subtextColor}
                style={styles.icon}
              />}
              <DefaultText style={styles.name}>{name}{is_raw ? ' *' : ''}</DefaultText>
            </View>
            <DefaultText numberOfLines={3} ellipsizeMode={'tail'} style={{ color: subtextColor }}>{description}</DefaultText>
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: 8, }}>
            {
              sizes.map(({ code, price }) => <DefaultText key={code + price}>{code ? '(' + code + ') ' : ''}{centsToDollar(price)}</DefaultText>)
            }
          </View>
        </View>




        {isRed ? <DefaultText style={{ paddingTop: 8 }}>This restaurant has not provided dietary information for this item.</DefaultText> :
          !!canBeFilters && <DefaultText red style={{ paddingTop: 8 }}>Can be made {canBeFilters}</DefaultText>}

      </View>

      {is_sold_out && <DefaultText red>Item is sold out</DefaultText>}
    </View>
  </TouchableOpacity>
}

const styles = StyleSheet.create({
  border: {
    padding: 15,
    borderBottomColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    marginRight: 8,
    marginTop: -1
  },
  textView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  name: {
    flex: 1,
    textTransform: 'uppercase',
  },
});


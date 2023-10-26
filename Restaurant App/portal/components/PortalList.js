import React from 'react';
import {
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import Layout from '../../utils/constants/Layout';
import useCategoryLiveAlphatical from '../hooks/useCategoryLiveAlphatical';
import { PortalRowList } from './PortalRow';


export default function PortalList({ category, style, }) {
  /*
  MAY WANT TO CREATE A PORTALSELECTABLELIST
  */

  const child_ids = useCategoryLiveAlphatical(category)

  return <FlatList
    style={style}
    contentContainerStyle={{ marginHorizontal: Layout.marHor, paddingBottom: Layout.scrollViewPadBot }}
    indicatorStyle='white'
    data={child_ids}
    keyExtractor={item => item}
    renderItem={({ item }) => <PortalRowList id={item} category={category} />}
  />
}

const styles = StyleSheet.create({

});


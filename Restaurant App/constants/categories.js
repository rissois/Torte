

const categories = {
  meal: {
    plural: 'meals',
    singular: 'meal',
    redux: 'meals',
    collection: 'restaurantMeals',
    list: 'Meals',
    screen: 'Meal',
  },
  menu: {
    plural: 'menus',
    singular: 'menu',
    redux: 'menus',
    collection: 'restaurantMenus',
    list: 'CategoryList',
    screen: 'Menu',
    child: 'section',
    childOrder: 'sectionOrder',
  },
  section: {
    plural: 'sections',
    singular: 'section',
    redux: 'sections',
    collection: 'restaurantSections',
    list: 'CategoryList',
    screen: 'Section',
    child: 'item',
    parent: 'menu',
    order: 'sectionOrder',
    childOrder: 'itemOrder',
  },
  item: {
    plural: 'items',
    singular: 'item',
    redux: 'items',
    collection: 'restaurantItems',
    list: 'CategoryList',
    screen: 'Item',
    order: 'itemOrder',
    parent: 'section',
  },
  photoAd: {
    plural: 'photo ads',
    singular: 'photoAd',
    redux: 'photoAds',
    collection: 'restaurantPhotoAds',
    list: 'PhotoAds',
    screen: 'PhotoAd2',
    parent: 'section'
  },
  photo: {
    plural: 'photos',
    singular: 'photo',
    // collection: 'restaurantPhotoAds',
    // screen: 'PhotoAds',
  },
  specification: {
    plural: 'specifications',
    singular: 'specification',
    redux: 'specifications',
    collection: 'restaurantSpecifications',
    list: 'CategoryList',
    screen: 'Spec',
    order: 'specOrder',
    parent: 'item',
  },
  modification: {
    plural: 'modifications',
    singular: 'modification',
    redux: 'modifications',
    collection: 'restaurantModifications',
    list: 'CategoryList',
    screen: 'Mod',
    order: 'modOrder',
    parent: 'item',
  },
  option: {
    plural: 'options',
    singular: 'option',
    parent: 'specification',
  },
  employee: {
    redux: 'employees',
  }
}

export default categories
// https://reactnavigation.org/docs/navigating-without-navigation-prop/
import { createNavigationContainerRef, CommonActions, StackActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef()

export function navigationNavigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function navigationReplace(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      StackActions.replace(name, params)
    )
  }
}

export function navigationReset(routes, index) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        routes,
        index: index || routes.length - 1
      }))
  }
}
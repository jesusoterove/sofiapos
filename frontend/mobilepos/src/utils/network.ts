import NetInfo, { NetInfoState } from '@react-native-community/netinfo'

let currentState: NetInfoState | null = null

export function initNetworkListener() {
  return NetInfo.addEventListener((state) => {
    currentState = state
  })
}

export async function isOnline(): Promise<boolean> {
  if (currentState !== null) {
    return currentState.isConnected === true && currentState.isInternetReachable !== false
  }
  const state = await NetInfo.fetch()
  return state.isConnected === true && state.isInternetReachable !== false
}

export function subscribeToNetwork(
  callback: (connected: boolean) => void
): () => void {
  return NetInfo.addEventListener((state) => {
    callback(state.isConnected === true && state.isInternetReachable !== false)
  })
}

import { createContext, useContext } from 'react'

type LoadingContextObject = {
  isLoading: boolean
}

export const LoadingContext = createContext<LoadingContextObject>({
  isLoading: false,
})

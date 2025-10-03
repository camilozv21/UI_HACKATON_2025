import { combineReducers, configureStore } from '@reduxjs/toolkit'
import filtersSlice from './features/filters';

export const makeStore = () => {
  return configureStore({
    reducer: combineReducers({
      filters: filtersSlice,
    }),
    devTools: true
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
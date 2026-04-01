import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { api } from './api';
import authReducer from './features/authSlice';
import './features/authApi';
import './features/userApi';
import './features/settingsApi';
import './features/analyticsApi';

const authPersistConfig = {
  key: 'auth',
  storage,
};

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: persistReducer(authPersistConfig, authReducer),
});

export const makeStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }).concat(api.middleware),
  });
  const persistor = persistStore(store);
  return { store, persistor };
};

export type AppStore = ReturnType<typeof makeStore>['store'];
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

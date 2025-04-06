import React from 'react';
import { registerRootComponent } from 'expo';
import AppNavigator from './AppNavigator';

export default function App() {
  return <AppNavigator />;
}

// Register the root component
registerRootComponent(App);
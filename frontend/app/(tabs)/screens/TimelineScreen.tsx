import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TimelineScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Timeline Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 18,
    color: '#4b5563',
  },
});

export default TimelineScreen;

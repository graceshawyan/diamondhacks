import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../AppNavigator';

type AboutMeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'AboutMe'>;
};

const AboutMeScreen = ({ navigation }: AboutMeScreenProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>About Me Screen</Text>
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

export default AboutMeScreen;

import React from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Entry = {
  id: string;
  type: 'milestone' | 'symptom' | 'medication' | 'note';
  content: string;
  date: string;
};

const mockEntries: Entry[] = [
  {
    id: '1',
    type: 'milestone',
    content: 'Started new medication',
    date: '2025-04-01',
  },
  {
    id: '2',
    type: 'symptom',
    content: 'Feeling less pain today',
    date: '2025-04-03',
  },
  {
    id: '3',
    type: 'medication',
    content: 'Took all medications on schedule',
    date: '2025-04-05',
  },
  {
    id: '4',
    type: 'note',
    content: 'Doctor appointment scheduled for next week',
    date: '2025-04-05',
  },
];

type EntryCardProps = {
  entry: Entry;
};

const EntryCard = ({ entry }: EntryCardProps) => {
  const getIconName = () => {
    switch (entry.type) {
      case 'milestone':
        return 'trophy';
      case 'symptom':
        return 'medkit';
      case 'medication':
        return 'medical';
      case 'note':
        return 'document-text';
      default:
        return 'document';
    }
  };

  const getCardColor = () => {
    switch (entry.type) {
      case 'milestone':
        return '#e9f5f8';
      case 'symptom':
        return '#f8f1e9';
      case 'medication':
        return '#f0e9f8';
      case 'note':
        return '#e9f8ea';
      default:
        return '#f5f5f5';
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: getCardColor() }]}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIconName()} size={24} color="#0d9488" />
        </View>
        <Text style={styles.cardType}>
          {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
        </Text>
        <Text style={styles.cardDate}>{entry.date}</Text>
      </View>
      <Text style={styles.cardContent}>{entry.content}</Text>
    </View>
  );
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Timeline</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.entriesContainer}>
          {mockEntries.map(entry => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#0d9488',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entriesContainer: {
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  cardType: {
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  cardDate: {
    color: '#6b7280',
    fontSize: 14,
  },
  cardContent: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
});

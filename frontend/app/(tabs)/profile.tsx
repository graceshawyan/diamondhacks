import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const mockUser = {
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  avatar: "https://randomuser.me/api/portraits/women/32.jpg",
  joinDate: "Member since April 2025",
  condition: "Rheumatoid Arthritis",
  pronouns: "She/Her",
  bio: "Living with RA for 3 years. Passionate about raising awareness and connecting with others on similar journeys.",
  stats: {
    posts: 24,
    comments: 47,
    connections: 18
  }
};

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <Image source={{ uri: mockUser.avatar }} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{mockUser.name}</Text>
              <Text style={styles.condition}>{mockUser.condition}</Text>
              <Text style={styles.joinDate}>{mockUser.joinDate}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockUser.stats.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockUser.stats.comments}</Text>
            <Text style={styles.statLabel}>Comments</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockUser.stats.connections}</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <View style={styles.card}>
            <View style={styles.bioRow}>
              <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.bioIcon} />
              <Text style={styles.bioText}>{mockUser.pronouns}</Text>
            </View>
            <View style={styles.bioRow}>
              <Ionicons name="medical-outline" size={20} color="#6b7280" style={styles.bioIcon} />
              <Text style={styles.bioText}>{mockUser.condition}</Text>
            </View>
            <View style={styles.bioRow}>
              <Ionicons name="document-text-outline" size={20} color="#6b7280" style={styles.bioIcon} />
              <Text style={styles.bioText}>{mockUser.bio}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingRow}>
              <Ionicons name="notifications-outline" size={22} color="#6b7280" style={styles.settingIcon} />
              <Text style={styles.settingText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingRow}>
              <Ionicons name="lock-closed-outline" size={22} color="#6b7280" style={styles.settingIcon} />
              <Text style={styles.settingText}>Privacy</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingRow}>
              <Ionicons name="help-circle-outline" size={22} color="#6b7280" style={styles.settingIcon} />
              <Text style={styles.settingText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.settingRow, styles.lastRow]}>
              <Ionicons name="log-out-outline" size={22} color="#ef4444" style={styles.settingIcon} />
              <Text style={[styles.settingText, { color: '#ef4444' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  condition: {
    fontSize: 16,
    color: '#0d9488',
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  editButton: {
    backgroundColor: '#0d9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    height: '80%',
    alignSelf: 'center',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bioRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bioIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  bioText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
});

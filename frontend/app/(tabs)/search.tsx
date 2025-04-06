import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

// Get base URL based on platform
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://172.20.10.6:5000';
    } else if (Platform.OS === 'ios') {
      return 'http://172.20.10.6:5000';
    } else {
      return 'http://localhost:5000';
    }
  }
  return 'https://your-production-server.com';
};

// Mock data for demonstration
const mockUsers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    username: 'sarahj',
    pfp: 'https://randomuser.me/api/portraits/women/44.jpg',
    condition: 'Rheumatoid Arthritis',
  },
  {
    id: '2',
    name: 'Michael Lee',
    username: 'mikelee',
    pfp: 'https://randomuser.me/api/portraits/men/32.jpg',
    condition: 'Fibromyalgia',
  },
  {
    id: '3',
    name: 'Emma Wilson',
    username: 'emmaw',
    pfp: 'https://randomuser.me/api/portraits/women/63.jpg',
    condition: 'Multiple Sclerosis',
  }
];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState(mockUsers); // Start with mock data
  const router = useRouter();

  // Function to fetch all users
  const fetchAllUsers = async () => {
    try {
      // This would be the actual API call in a real implementation
      // For now, we're using mock data
      setAllUsers(mockUsers);
      
      // Actual API implementation would look like this:
      /*
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users);
      } else {
        console.error('Failed to fetch users');
      }
      */
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  // Effect to fetch all users when component mounts
  useEffect(() => {
    fetchAllUsers();
  }, []);
  
  // Filter users as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    
    // Use a small timeout to prevent too many renders while typing
    const timer = setTimeout(() => {
      const filtered = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.condition.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, allUsers]);

  // Handle navigation to user profile
  const navigateToUserProfile = (userId) => {
    console.log('Navigating to user profile:', userId);
    // Navigate to the user profile page
    router.push(`/user-profile/${userId}`);
  };

  // Handle follow user action
  const handleFollowUser = async (userId) => {
    console.log('Following user:', userId);
    // In a real app, you would make an API call to follow the user
    // For now, we'll just show a success message
    alert('Successfully followed user!');
  };
  
  // Render user item in search results
  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem} 
      onPress={() => navigateToUserProfile(item.id)}
    >
      <Image 
        source={{ uri: item.pfp }} 
        style={styles.userImage} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
        <Text style={styles.userCondition}>{item.condition}</Text>
      </View>
      <TouchableOpacity 
        style={styles.followButton}
        onPress={(e) => {
          e.stopPropagation(); // Prevent triggering the parent TouchableOpacity
          handleFollowUser(item.id);
        }}
      >
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for people..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          style={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {searchQuery.length > 0 ? (
                <>
                  <Ionicons name="search-outline" size={60} color="#d1d5db" />
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.emptySubText}>Try a different search term</Text>
                </>
              ) : (
                <>
                  <Ionicons name="search" size={60} color="#d1d5db" />
                  <Text style={styles.emptyText}>Search for people</Text>
                  <Text style={styles.emptySubText}>Find others with similar conditions</Text>
                </>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 50,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingVertical: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#0d9488',
  },
  resultsList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userUsername: {
    fontSize: 14,
    color: '#6b7280',
  },
  userCondition: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
});

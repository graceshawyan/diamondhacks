import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCard, type Post as BasePost } from '../../components/PostCard';

type Post = BasePost & {
  community?: string;
  isFriend?: boolean;
};

const mockPosts: Post[] = [
  // Cancer community posts

  {
    id: '1',
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://randomuser.me/api/portraits/men/48.jpg',
    },
    content: 'I\'M GONNA BEAT CANCER YEAHHH #Cancer',
    media: [
      {
        type: 'video',
        url: 'https://example.com/yoga-routine-video.mp4',
        thumbnail: require('../../assets/images/running.jpg'),
        aspectRatio: 16/9
      }
    ],
    timestamp: '2 hours ago',
    likes: 45,
    comments: 12,
    isLiked: false,
    community: 'Cancer',
    isFriend: true,
  },
  {
    id: '2',
    author: {
      name: 'Michael Chen',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    content: 'Progress update! Here\'s my mobility improvement over the last 3 months. Consistency is key! 💪',
    media: [
      {
        type: 'image',
        url: require('../../assets/images/running.jpg'),
        aspectRatio: 4/3
      },
      {
        type: 'image',
        url: require('../../assets/images/icon.png'),
        aspectRatio: 4/3
      }
    ],
    timestamp: '5 hours ago',
    likes: 89,
    comments: 23,
    isLiked: true,
    community: 'Cancer',
    isFriend: false,
  },
  {
    id: '3',
    author: {
      name: 'Aisha Patel',
      avatar: 'https://randomuser.me/api/portraits/women/63.jpg',
    },
    content: 'Check out this quick tutorial on using resistance bands for gentle strength training. Perfect for days when you\'re dealing with flare-ups! 🎥',
    media: [
      {
        type: 'video',
        url: 'https://example.com/resistance-band-tutorial.mp4',
        thumbnail: require('../../assets/images/splash-icon.png'),
        aspectRatio: 9/16
      }
    ],
    timestamp: '1 day ago',
    likes: 156,
    comments: 34,
    isLiked: false,
    community: 'Cancer',
    isFriend: true,
  },
];

type PostFilter = 'Community' | 'Friends' | 'All';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [filter, setFilter] = useState<PostFilter>('Community');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  const handleLike = (id: string) => {
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'All') return true;
    if (filter === 'Friends') return post.isFriend;
    if (filter === 'Community') return post.community === 'Cancer';
    return false;
  });
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Text style={styles.filterText}>{filter}</Text>
            <Ionicons name={showFilterDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {showFilterDropdown && (
          <View style={styles.filterDropdown}>
            {['Community', 'Friends', 'All'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.filterOption, filter === option && styles.filterOptionSelected]}
                onPress={() => {
                  setFilter(option as PostFilter);
                  setShowFilterDropdown(false);
                }}
              >
                <Text style={[styles.filterOptionText, filter === option && styles.filterOptionTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <View style={styles.postsContainer}>
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  filterText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginRight: 4,
  },
  filterDropdown: {
    position: 'absolute',
    top: 70,
    left: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  filterOptionSelected: {
    backgroundColor: '#f3f4f6',
  },
  filterOptionText: {
    fontSize: 15,
    color: '#374151',
  },
  filterOptionTextSelected: {
    fontWeight: '500',
    color: '#0d9488',
  },
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
  postsContainer: {
    gap: 12,
  },
});

import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCard, type Post as BasePost } from '../../components/PostCard';
import * as ImagePicker from 'expo-image-picker';

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

type PostFilter = 'All' | 'Friends' | 'Community';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [filter, setFilter] = useState<PostFilter>('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{type: 'image' | 'video', uri: string, aspectRatio?: number}[]>([]);
  
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
    if (filter === 'Community') return post.community === 'Cancer';
    if (filter === 'Friends') return post.isFriend;
   
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
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddPostModal(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {showFilterDropdown && (
          <View style={styles.filterDropdown}>
            {['All', 'Friends', 'Community'].map((option) => (
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

      {/* Add Post Modal */}
      <Modal
        visible={showAddPostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddPostModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => setShowAddPostModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              <TextInput
                style={styles.captionInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#6b7280"
                multiline
                value={newPostCaption}
                onChangeText={setNewPostCaption}
              />

              {/* Selected Media Preview */}
              {selectedMedia.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.mediaPreviewContainer}
                >
                  {selectedMedia.map((media, index) => (
                    <View key={index} style={styles.mediaPreviewItem}>
                      <Image 
                        source={{ uri: media.uri }}
                        style={[styles.mediaPreview, { aspectRatio: media.aspectRatio || 1 }]}
                      />
                      <TouchableOpacity 
                        style={styles.removeMediaButton}
                        onPress={() => {
                          const updatedMedia = [...selectedMedia];
                          updatedMedia.splice(index, 1);
                          setSelectedMedia(updatedMedia);
                        }}
                      >
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Media Upload Options */}
              <View style={styles.uploadOptions}>
                <TouchableOpacity 
                  style={styles.uploadOption}
                  onPress={async () => {
                    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    
                    if (permissionResult.granted === false) {
                      Alert.alert("Permission Required", "You need to allow access to your photos to upload images.");
                      return;
                    }

                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: true,
                      quality: 0.8,
                    });

                    if (!result.canceled) {
                      const asset = result.assets[0];
                      setSelectedMedia([...selectedMedia, {
                        type: 'image',
                        uri: asset.uri,
                        aspectRatio: asset.width / asset.height
                      }]);
                    }
                  }}
                >
                  <Ionicons name="image" size={24} color="#0d9488" />
                  <Text style={styles.uploadOptionText}>Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.uploadOption}
                  onPress={async () => {
                    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    
                    if (permissionResult.granted === false) {
                      Alert.alert("Permission Required", "You need to allow access to your videos to upload them.");
                      return;
                    }

                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                      allowsEditing: true,
                      quality: 0.8,
                    });

                    if (!result.canceled) {
                      const asset = result.assets[0];
                      setSelectedMedia([...selectedMedia, {
                        type: 'video',
                        uri: asset.uri,
                        aspectRatio: asset.width / asset.height
                      }]);
                    }
                  }}
                >
                  <Ionicons name="videocam" size={24} color="#0d9488" />
                  <Text style={styles.uploadOptionText}>Video</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.postButton, (!newPostCaption && selectedMedia.length === 0) && styles.disabledButton]}
              disabled={!newPostCaption && selectedMedia.length === 0}
              onPress={() => {
                // Here you would usually send the data to your backend
                // For now, we'll just add it locally
                const newPost: Post = {
                  id: `${Date.now()}`,
                  author: {
                    name: "You",
                    avatar: "https://randomuser.me/api/portraits/men/1.jpg"
                  },
                  content: newPostCaption,
                  media: selectedMedia.map(media => ({
                    type: media.type,
                    url: media.type === 'image' ? media.uri : media.uri,
                    thumbnail: media.type === 'video' ? media.uri : undefined,
                    aspectRatio: media.aspectRatio || 1
                  })),
                  timestamp: "Just now",
                  likes: 0,
                  comments: 0,
                  isLiked: false,
                  community: "Cancer",
                  isFriend: true
                };
                
                setPosts([newPost, ...posts]);
                setNewPostCaption('');
                setSelectedMedia([]);
                setShowAddPostModal(false);
              }}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  
  /* Add Post Modal Styles */
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalScrollContent: {
    padding: 16,
    maxHeight: '70%',
  },
  captionInput: {
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  mediaPreviewItem: {
    marginRight: 12,
    position: 'relative',
  },
  mediaPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  uploadOptions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  uploadOptionText: {
    marginLeft: 8,
    color: '#0d9488',
    fontWeight: '500',
  },
  postButton: {
    backgroundColor: '#0d9488',
    borderRadius: 8,
    padding: 14,
    margin: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
  },
  postButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { ArrowLeft, MessageCircle, Clock, Globe, Plus, ThumbsUp, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  description: string;
  topics: string[];
  languages: string[];
  availability: string;
  createdAt: Date;
  likes: number;
  comments: number;
  hasLiked?: boolean;
}

interface Props {
  onBack: () => void;
}

const samplePosts: Post[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Yael Cohen',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    title: 'Looking for English-Hebrew exchange partner',
    description: 'Native Hebrew speaker looking to practice English. Happy to help with Hebrew in return!',
    topics: ['Daily Conversation', 'Culture'],
    languages: ['Hebrew', 'English'],
    availability: 'Evenings GMT+2',
    createdAt: new Date(),
    likes: 5,
    comments: 2
  },
  {
    id: '2',
    userId: '2',
    userName: 'David Levi',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    title: 'Hebrew practice group forming',
    description: 'Starting a small group for Hebrew conversation practice. All levels welcome!',
    topics: ['Group Practice', 'Beginner Friendly'],
    languages: ['Hebrew'],
    availability: 'Weekends',
    createdAt: new Date(),
    likes: 8,
    comments: 4
  }
];

export function ConversationPractice({ onBack }: Props) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    topics: [] as string[],
    languages: [] as string[],
    availability: ''
  });

  const handleCreatePost = () => {
    const post: Post = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'Current User',
      userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      title: newPost.title,
      description: newPost.description,
      topics: newPost.topics,
      languages: newPost.languages,
      availability: newPost.availability,
      createdAt: new Date(),
      likes: 0,
      comments: 0
    };

    setPosts([post, ...posts]);
    setShowNewPostForm(false);
    setNewPost({
      title: '',
      description: '',
      topics: [],
      languages: [],
      availability: ''
    });
    
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.hasLiked ? post.likes - 1 : post.likes + 1,
          hasLiked: !post.hasLiked
        };
      }
      return post;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {showConfetti && <Confetti width={width} height={height} />}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Button variant="ghost" onClick={onBack} className="mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-bold">Language Exchange</h2>
            </div>
            <Button onClick={() => setShowNewPostForm(true)} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>

          {showNewPostForm ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 border-2 border-brand-100 rounded-xl"
            >
              <h3 className="text-xl font-semibold mb-4">Create New Post</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newPost.description}
                    onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Availability
                  </label>
                  <input
                    type="text"
                    value={newPost.availability}
                    onChange={(e) => setNewPost({ ...newPost, availability: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                    placeholder="e.g., Evenings GMT+2, Weekends"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setShowNewPostForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePost}>
                    Post
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : null}

          <div className="space-y-6">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <img
                      src={post.userAvatar}
                      alt={post.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <h3 className="font-semibold">{post.userName}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Connect
                  </Button>
                </div>

                <div className="mt-4">
                  <h4 className="text-lg font-semibold">{post.title}</h4>
                  <p className="mt-2 text-gray-600">{post.description}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {post.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <Globe className="h-4 w-4 mr-1" />
                  {post.languages.join(', ')}
                  <Clock className="h-4 w-4 ml-4 mr-1" />
                  {post.availability}
                </div>

                <div className="mt-4 flex items-center gap-4 pt-4 border-t">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 text-sm ${
                      post.hasLiked ? 'text-brand-600' : 'text-gray-500'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-500">
                    <MessageSquare className="h-4 w-4" />
                    {post.comments}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
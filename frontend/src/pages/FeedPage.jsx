import { useState, useContext } from 'react';
import Feed from '../components/Feed';
import CreatePost from '../components/CreatePost';
import UserContext from '../contexts/current-user-context';
import '../styles/feed-page.css';

export default function FeedPage() {
  const { currentUser } = useContext(UserContext);
  const [refreshFeed, setRefreshFeed] = useState(0);

  const handlePostCreated = () => {
    // Refresh the feed when a new post is created
    setRefreshFeed(prev => prev + 1);
  };

  return (
    <div className="feed-page">
      <div className="feed-layout">
        {/* Left Column - Create Post */}
        <div className="create-post-section">
          <CreatePost onPostCreated={handlePostCreated} />
        </div>
        
        {/* Right Column - Community Feed */}
        <div className="community-feed-section">
          <h2>Community Posts</h2>
          <Feed key={refreshFeed} />
        </div>
      </div>
    </div>
  );
} 
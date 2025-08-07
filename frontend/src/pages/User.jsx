import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CurrentUserContext from "../contexts/current-user-context";
import { getUser } from "../adapters/user-adapter";
import { logUserOut } from "../adapters/auth-adapter";
import UpdateUsernameForm from "../components/UpdateUsernameForm";
import UserScores from "../components/UserScores";

export default function UserPage() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useContext(CurrentUserContext);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const isCurrentUserProfile = currentUser && currentUser.id === Number(id);

  useEffect(() => {
    const loadUser = async () => {
      const [user, error] = await getUser(id);
      if (error) return setError(error);
      setUserProfile(user);
    };

    loadUser();
  }, [id]);

  const handleLogout = async () => {
    logUserOut();
    setCurrentUser(null);
    navigate('/');
  };

  if (error) return <p>Sorry, there was a problem loading user. Please try again later.</p>;

  if (!userProfile) return null;

  // When we update the username, the userProfile state won't change but the currentUser state will.
  const profileUsername = isCurrentUserProfile ? currentUser.username : userProfile.username;

  return <>
    <h1>{profileUsername}</h1>
    
    <div className="user-profile-layout">
      {/* Left side - User Scores */}
      <div className="user-scores-section">
        <UserScores userId={Number(id)} username={profileUsername} wins={userProfile.wins || 0} />
      </div>
      
      {/* Right side - Update form and logout (only for current user) */}
      {isCurrentUserProfile && (
        <div className="user-actions-section">
          <UpdateUsernameForm currentUser={currentUser} setCurrentUser={setCurrentUser} />
          <button onClick={handleLogout} className="logout-btn">Log Out</button>
        </div>
      )}
    </div>
  </>;
}

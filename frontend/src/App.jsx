import { useContext, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import GamePage from './pages/Home';
import WelcomingPage from './pages/WelcomingPage';
import SignUpPage from './pages/SignUp';
import LoginPage from './pages/Login';
import SiteHeadingAndNav from './components/SiteHeadingAndNav';
import NotFoundPage from './pages/NotFound';
import UserContext from './contexts/current-user-context';
import { checkForLoggedInUser } from './adapters/auth-adapter';
import UsersPage from './pages/Users';
import UserPage from './pages/User';
import LeaderboardPage from './pages/LeaderboardPage';
import FeedPage from './pages/FeedPage';
import CompetitionsPage from './pages/CompetitionsPage';

export default function App() {
  const { setCurrentUser } = useContext(UserContext);
  useEffect(() => {
    const loadCurrentUser = async () => {
      // we aren't concerned about an error happening here
      const [data] = await checkForLoggedInUser();
      if (data) setCurrentUser(data)
    }
    loadCurrentUser();
  }, [setCurrentUser]);

  return <>
    <SiteHeadingAndNav />
    <main>
      <Routes>
        <Route path='/' element={<WelcomingPage />} />
        <Route path='/play' element={<GamePage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/sign-up' element={<SignUpPage />} />
        <Route path='/users' element={<UsersPage />} />
        <Route path='/users/:id' element={<UserPage />} />
        <Route path='/leaderboard' element={<LeaderboardPage />} />
        <Route path='/feed' element={<FeedPage />} />
        <Route path='/competitions' element={<CompetitionsPage />} />
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </main>
  </>;
}

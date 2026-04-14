import { HashRouter, Routes, Route } from 'react-router-dom';
import { Home }        from '@/pages/Home';
import { Game }        from '@/pages/Game';
import { Tutorial }    from '@/pages/Tutorial';
import { Leaderboard } from '@/pages/Leaderboard';
import { Profile }     from '@/pages/Profile';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"                    element={<Home />} />
        <Route path="/game"                element={<Game />} />
        <Route path="/tutorial"            element={<Tutorial />} />
        <Route path="/leaderboard"         element={<Leaderboard />} />
        <Route path="/profile/:username"   element={<Profile />} />
      </Routes>
    </HashRouter>
  );
}

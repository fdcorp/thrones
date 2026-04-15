import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home }        from '@/pages/Home';
import { Game }        from '@/pages/Game';
import { Tutorial }    from '@/pages/Tutorial';
import { Leaderboard } from '@/pages/Leaderboard';
import { Players }     from '@/pages/Players';
import { Profile }     from '@/pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<Home />} />
        <Route path="/game"                element={<Game />} />
        <Route path="/tutorial"            element={<Tutorial />} />
        <Route path="/leaderboard"         element={<Leaderboard />} />
        <Route path="/players"             element={<Players />} />
        <Route path="/profile/:username"   element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

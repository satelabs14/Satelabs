import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../context/AuthContext';
import './Leaderboard.css';

const RankBadge = ({ rank }) => {
  const rankColors = {
    'Recruit': '#00d4ff',
    'Analyst': '#4ade80',
    'Hunter': '#fb923c',
    'Specialist': '#a855f7',
    'Elite': '#f59e0b'
  };

  return (
    <span 
      className="rank-badge"
      style={{ 
        color: rankColors[rank] || '#00d4ff',
        textShadow: `0 0 8px ${rankColors[rank] || '#00d4ff'}`
      }}
    >
      {rank}
    </span>
  );
};

const LeaderboardEntry = ({ entry, isCurrentUser }) => (
  <div className={`leaderboard-entry ${isCurrentUser ? 'current-user' : ''}`}>
    <div className="entry-rank">
      <span className="rank-number mono">{entry.rank}</span>
      {entry.rank === 1 && <span className="rank-medal">🥇</span>}
      {entry.rank === 2 && <span className="rank-medal">🥈</span>}
      {entry.rank === 3 && <span className="rank-medal">🥉</span>}
    </div>

    <div className="entry-info">
      <h3 className="entry-username">{entry.username}</h3>
      <p className="entry-rank-badge">
        <RankBadge rank={entry.user_rank} />
      </p>
    </div>

    <div className="entry-xp">
      <span className="xp-value mono">{entry.points}</span>
      <span className="xp-label">Points</span>
    </div>
  </div>
);

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await axios.get(`${API_BASE}/dashboard/leaderboard?limit=100`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('satelabs_token')}`
        }
      });
      setLeaderboard(res.data || []);
      
      // Find current user's rank
      const currentUserRank = res.data.find(entry => entry.username === user?.username);
      setUserRank(currentUserRank);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const topPlayers = leaderboard.slice(0, 3);
  const otherPlayers = leaderboard.slice(3);

  if (loading) {
    return (
      <div className="page leaderboard-page">
        <div className="loading-spinner">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="page leaderboard-page cyber-grid">
      <div className="page-header">
        <p className="page-eyebrow">// RANKINGS</p>
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">Global rankings based on Points earned</p>
      </div>

      {/* Top 3 Players */}
      {topPlayers.length > 0 && (
        <div className="top-players">
          <h2 className="section-title">Top Performers</h2>
          <div className="podium">
            {topPlayers[1] && (
              <div className="podium-place second">
                <div className="podium-rank">2</div>
                <div className="podium-medal">🥈</div>
                <h3>{topPlayers[1].username}</h3>
                <p className="podium-xp">{topPlayers[1].points} Points</p>
                <RankBadge rank={topPlayers[1].user_rank} />
              </div>
            )}
            
            {topPlayers[0] && (
              <div className="podium-place first">
                <div className="podium-rank">1</div>
                <div className="podium-medal">🥇</div>
                <h3>{topPlayers[0].username}</h3>
                <p className="podium-xp">{topPlayers[0].points} Points</p>
                <RankBadge rank={topPlayers[0].user_rank} />
              </div>
            )}
            
            {topPlayers[2] && (
              <div className="podium-place third">
                <div className="podium-rank">3</div>
                <div className="podium-medal">🥉</div>
                <h3>{topPlayers[2].username}</h3>
                <p className="podium-xp">{topPlayers[2].points} Points</p>
                <RankBadge rank={topPlayers[2].user_rank} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Your Rank */}
      {userRank && (
        <div className="your-rank">
          <h2 className="section-title">Your Position</h2>
          <div className="your-rank-card">
            <div className="your-rank-content">
              <span className="your-rank-number mono">#{userRank.rank}</span>
              <div className="your-rank-info">
                <h3>{userRank.username}</h3>
                <RankBadge rank={userRank.user_rank} />
              </div>
              <div className="your-rank-xp">
                <span className="xp-value mono">{userRank.points}</span>
                <span className="xp-label">Points</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="full-leaderboard">
        <h2 className="section-title">All Players</h2>
        <div className="leaderboard-list">
          {leaderboard.map(entry => (
            <LeaderboardEntry 
              key={entry.username}
              entry={entry}
              isCurrentUser={entry.username === user?.username}
            />
          ))}
        </div>
      </div>

      {leaderboard.length === 0 && (
        <div className="empty-state">
          <p>No leaderboard data available yet.</p>
        </div>
      )}
    </div>
  );
}

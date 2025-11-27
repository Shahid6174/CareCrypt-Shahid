import React, { useState, useEffect } from 'react';
import { FiTrophy, FiUsers, FiFilter } from 'react-icons/fi';
import api from '../services/api';

/**
 * Leaderboard Component
 * Displays top users ranked by total coins
 */
const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, patient, doctor, insurance
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    loadLeaderboard();
  }, [filter, limit]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const roleParam = filter !== 'all' ? `role=${filter}&` : '';
      const response = await api.get(`/rewards/leaderboard?${roleParam}limit=${limit}`);
      setLeaderboard(response.data.data.leaderboard);
      setError(null);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (badge) => {
    const colors = {
      'Beginner': 'bg-gray-100 text-gray-800',
      'Bronze': 'bg-orange-100 text-orange-800',
      'Silver': 'bg-gray-200 text-gray-800',
      'Gold': 'bg-yellow-100 text-yellow-800',
      'Platinum': 'bg-purple-100 text-purple-800',
      'Diamond': 'bg-blue-100 text-blue-800',
      'Legend': 'bg-red-100 text-red-800'
    };
    return colors[badge] || colors['Beginner'];
  };

  const getBadgeIcon = (badge) => {
    const icons = {
      'Bronze': '🥉',
      'Silver': '🥈',
      'Gold': '🥇',
      'Platinum': '💎',
      'Diamond': '💎',
      'Legend': '👑'
    };
    return icons[badge] || '🎖️';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-600 font-bold text-2xl';
    if (rank === 2) return 'text-gray-500 font-bold text-xl';
    if (rank === 3) return 'text-orange-600 font-bold text-xl';
    return 'text-gray-400 font-semibold text-lg';
  };

  const getRoleColor = (role) => {
    const colors = {
      'patient': 'bg-blue-100 text-blue-800',
      'doctor': 'bg-green-100 text-green-800',
      'insurance': 'bg-purple-100 text-purple-800',
      'insuranceAgent': 'bg-purple-100 text-purple-800',
      'systemAdmin': 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatRole = (role) => {
    const roleNames = {
      'patient': 'Patient',
      'doctor': 'Doctor',
      'insurance': 'Insurance Agent',
      'insuranceAgent': 'Insurance Agent',
      'systemAdmin': 'Admin'
    };
    return roleNames[role] || role;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FiTrophy className="mr-2 text-yellow-500" />
          Leaderboard
        </h2>
        <FiUsers className="text-gray-400 w-6 h-6" />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <FiFilter className="text-gray-500" />
          <span className="text-sm text-gray-600">Filter:</span>
        </div>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => setFilter('patient')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'patient' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Patients
        </button>
        <button
          onClick={() => setFilter('doctor')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'doctor' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Doctors
        </button>
        <button
          onClick={() => setFilter('insurance')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'insurance' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Insurance
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-3">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          leaderboard.map((user) => (
            <div 
              key={user.userId}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                user.rank <= 3 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Left Side: Rank & User Info */}
              <div className="flex items-center space-x-4 flex-1">
                <div className={`w-12 text-center ${getRankColor(user.rank)}`}>
                  {getRankIcon(user.rank)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-base font-semibold text-gray-900">{user.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {formatRole(user.role)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">ID: {user.userId}</p>
                </div>
              </div>

              {/* Right Side: Stats */}
              <div className="flex items-center space-x-4">
                {/* Badge */}
                <div className="text-center hidden md:block">
                  <span className="text-xl">{getBadgeIcon(user.badge)}</span>
                  <span className={`block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getBadgeColor(user.badge)}`}>
                    {user.badge}
                  </span>
                </div>

                {/* Level */}
                <div className="text-center bg-blue-100 px-3 py-2 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Level</p>
                  <p className="text-lg font-bold text-blue-600">{user.level}</p>
                </div>

                {/* Coins */}
                <div className="text-center bg-yellow-100 px-3 py-2 rounded-lg min-w-[80px]">
                  <p className="text-xs text-yellow-600 font-medium">Coins</p>
                  <p className="text-lg font-bold text-yellow-600">🪙 {user.totalCoins}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {leaderboard.length >= limit && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setLimit(limit + 10)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;


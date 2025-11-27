import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiAward, FiTarget } from 'react-icons/fi';
import api from '../services/api';

/**
 * Rewards Summary Component
 * Displays user's coins, level, badge, and progress
 */
const RewardsSummary = () => {
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rewards/summary');
      setRewards(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error loading rewards:', err);
      setError('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (badge) => {
    const colors = {
      'Beginner': 'bg-gray-100 text-gray-800 border-gray-300',
      'Bronze': 'bg-orange-100 text-orange-800 border-orange-300',
      'Silver': 'bg-gray-200 text-gray-800 border-gray-400',
      'Gold': 'bg-yellow-100 text-yellow-800 border-yellow-400',
      'Platinum': 'bg-purple-100 text-purple-800 border-purple-400',
      'Diamond': 'bg-blue-100 text-blue-800 border-blue-400',
      'Legend': 'bg-red-100 text-red-800 border-red-400'
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

  const calculateProgress = (current, total) => {
    if (total <= 0) return 100;
    const progress = ((current / total) * 100);
    return Math.min(progress, 100);
  };

  const calculateBadgeProgress = () => {
    if (!rewards?.nextBadge) return 100;
    const currentBadgeCoins = {
      'Beginner': 0,
      'Bronze': 100,
      'Silver': 500,
      'Gold': 1500,
      'Platinum': 3000,
      'Diamond': 6000,
      'Legend': 10000
    };
    const nextBadgeCoins = {
      'Bronze': 100,
      'Silver': 500,
      'Gold': 1500,
      'Platinum': 3000,
      'Diamond': 6000,
      'Legend': 10000
    };
    
    const currentThreshold = currentBadgeCoins[rewards.badge] || 0;
    const nextThreshold = nextBadgeCoins[rewards.nextBadge] || 10000;
    const coinsInCurrentRange = rewards.totalCoins - currentThreshold;
    const coinsNeededForNextBadge = nextThreshold - currentThreshold;
    
    return (coinsInCurrentRange / coinsNeededForNextBadge) * 100;
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
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <FiAward className="mr-2 text-yellow-500" />
        Your Rewards
      </h2>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Coins */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Coins</p>
              <p className="text-3xl font-bold text-yellow-600">
                🪙 {rewards?.totalCoins || 0}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Level */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Level</p>
              <p className="text-3xl font-bold text-blue-600">
                {rewards?.level || 1}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FiTarget className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Badge</p>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getBadgeIcon(rewards?.badge)}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getBadgeColor(rewards?.badge)}`}>
                  {rewards?.badge || 'Beginner'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Streak</p>
            <p className="text-2xl font-bold text-orange-600">
              🔥 {rewards?.streak?.currentStreak || 0} days
            </p>
            {rewards?.streak?.longestStreak > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Longest: {rewards.streak.longestStreak} days
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Keep going!</p>
            <p className="text-sm font-medium text-orange-600">+15 coins/day</p>
          </div>
        </div>
      </div>

      {/* Progress to Next Badge */}
      {rewards?.nextBadge && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Progress to {rewards.nextBadge} {getBadgeIcon(rewards.nextBadge)}
            </p>
            <p className="text-sm font-bold text-blue-600">
              {rewards.coinsToNextBadge} coins to go
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${calculateBadgeProgress()}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {rewards?.statistics && Object.keys(rewards.statistics).length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Your Statistics</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {rewards.statistics.claimsSubmitted > 0 && (
              <div className="text-center p-2 bg-blue-50 rounded">
                <p className="text-xs text-gray-600">Claims</p>
                <p className="text-lg font-bold text-blue-600">{rewards.statistics.claimsSubmitted}</p>
              </div>
            )}
            {rewards.statistics.genuineClaims > 0 && (
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-xs text-gray-600">Genuine</p>
                <p className="text-lg font-bold text-green-600">{rewards.statistics.genuineClaims}</p>
              </div>
            )}
            {rewards.statistics.documentsUploaded > 0 && (
              <div className="text-center p-2 bg-purple-50 rounded">
                <p className="text-xs text-gray-600">Documents</p>
                <p className="text-lg font-bold text-purple-600">{rewards.statistics.documentsUploaded}</p>
              </div>
            )}
            {rewards.statistics.recordsAdded > 0 && (
              <div className="text-center p-2 bg-indigo-50 rounded">
                <p className="text-xs text-gray-600">Records</p>
                <p className="text-lg font-bold text-indigo-600">{rewards.statistics.recordsAdded}</p>
              </div>
            )}
            {rewards.statistics.claimsVerified > 0 && (
              <div className="text-center p-2 bg-teal-50 rounded">
                <p className="text-xs text-gray-600">Verified</p>
                <p className="text-lg font-bold text-teal-600">{rewards.statistics.claimsVerified}</p>
              </div>
            )}
            {rewards.statistics.accurateDecisions > 0 && (
              <div className="text-center p-2 bg-yellow-50 rounded">
                <p className="text-xs text-gray-600">Accurate</p>
                <p className="text-lg font-bold text-yellow-600">{rewards.statistics.accurateDecisions}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsSummary;


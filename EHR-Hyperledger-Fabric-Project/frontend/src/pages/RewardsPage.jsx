import React, { useState } from 'react';
import { FiAward, FiTrophy, FiClock, FiStar } from 'react-icons/fi';
import Layout from '../components/Layout';
import RewardsSummary from '../components/RewardsSummary';
import Leaderboard from '../components/Leaderboard';
import Achievements from '../components/Achievements';
import RewardsHistory from '../components/RewardsHistory';

/**
 * Rewards Page
 * Central hub for all rewards and gamification features
 */
const RewardsPage = () => {
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = [
    { id: 'summary', label: 'Summary', icon: <FiAward /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <FiTrophy /> },
    { id: 'achievements', label: 'Achievements', icon: <FiStar /> },
    { id: 'history', label: 'History', icon: <FiClock /> }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return <RewardsSummary />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'achievements':
        return <Achievements />;
      case 'history':
        return <RewardsHistory />;
      default:
        return <RewardsSummary />;
    }
  };

  return (
    <Layout title="Rewards & Gamification">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">🎮 Rewards & Gamification</h1>
          <p className="text-purple-100">
            Earn coins, unlock achievements, and climb the leaderboard!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-2">
          <div className="flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">🪙 Earn Coins</h3>
            <p className="text-xs text-blue-700">
              Submit claims, verify records, and complete tasks to earn coins and level up!
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-sm font-semibold text-purple-900 mb-2">🏆 Unlock Achievements</h3>
            <p className="text-xs text-purple-700">
              Complete milestones and special challenges to unlock exclusive achievements.
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">🔥 Build Streaks</h3>
            <p className="text-xs text-yellow-700">
              Use the platform daily to build your streak and earn bonus coins!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RewardsPage;


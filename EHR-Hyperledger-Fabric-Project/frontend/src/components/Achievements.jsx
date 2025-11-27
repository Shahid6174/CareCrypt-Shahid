import React, { useState, useEffect } from 'react';
import { FiAward, FiStar, FiZap, FiTarget } from 'react-icons/fi';
import api from '../services/api';

/**
 * Achievements Component
 * Displays unlocked achievements and milestones
 */
const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rewards/achievements');
      setAchievements(response.data.data.achievements);
      setError(null);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'milestone': 'bg-blue-100 text-blue-800 border-blue-300',
      'excellence': 'bg-purple-100 text-purple-800 border-purple-300',
      'streak': 'bg-orange-100 text-orange-800 border-orange-300',
      'special': 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'milestone': <FiTarget className="w-6 h-6" />,
      'excellence': <FiStar className="w-6 h-6" />,
      'streak': <FiZap className="w-6 h-6" />,
      'special': <FiAward className="w-6 h-6" />
    };
    return icons[category] || <FiAward className="w-6 h-6" />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCategory = (category) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category || 'special';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {});

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
          <FiAward className="mr-2 text-purple-500" />
          Achievements
        </h2>
        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
          {achievements.length} Unlocked
        </span>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-12">
          <FiAward className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No achievements yet</p>
          <p className="text-gray-400 text-sm">
            Keep using the platform to unlock achievements!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <div key={category}>
              {/* Category Header */}
              <div className="flex items-center space-x-2 mb-3">
                <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                  {getCategoryIcon(category)}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {formatCategory(category)} Achievements
                </h3>
                <span className="text-sm text-gray-500">
                  ({categoryAchievements.length})
                </span>
              </div>

              {/* Achievement Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {categoryAchievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${getCategoryColor(achievement.category)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-base font-bold text-gray-900">
                            🏆 {achievement.name}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-yellow-600 font-bold text-sm">
                              🪙 +{achievement.coinsEarned} coins
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(achievement.earnedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Achievements (Mock) */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FiTarget className="mr-2 text-gray-400" />
          Upcoming Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Locked achievements preview */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 opacity-60">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔒</div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Half Century</h4>
                <p className="text-xs text-gray-600 mb-2">Submit 50 claims</p>
                <span className="text-xs text-yellow-600 font-medium">+100 coins</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 opacity-60">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔒</div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Golden Touch</h4>
                <p className="text-xs text-gray-600 mb-2">50 accurate verifications</p>
                <span className="text-xs text-yellow-600 font-medium">+250 coins</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 opacity-60">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔒</div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Monthly Master</h4>
                <p className="text-xs text-gray-600 mb-2">Maintain 30 day streak</p>
                <span className="text-xs text-yellow-600 font-medium">+300 coins</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 opacity-60">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔒</div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Fraud Fighter</h4>
                <p className="text-xs text-gray-600 mb-2">Detect 10 fraudulent claims</p>
                <span className="text-xs text-yellow-600 font-medium">+300 coins</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;


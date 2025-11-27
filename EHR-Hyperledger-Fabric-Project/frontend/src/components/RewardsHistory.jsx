import React, { useState, useEffect } from 'react';
import { FiClock, FiTrendingUp, FiFilter } from 'react-icons/fi';
import api from '../services/api';

/**
 * Rewards History Component
 * Displays user's coin earning history
 */
const RewardsHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    loadHistory();
  }, [limit]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rewards/history?limit=${limit}`);
      setHistory(response.data.data.history);
      setError(null);
    } catch (err) {
      console.error('Error loading rewards history:', err);
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      'CLAIM_SUBMITTED': 'bg-blue-100 text-blue-800',
      'CLAIM_VERIFIED': 'bg-green-100 text-green-800',
      'CLAIM_REVIEWED': 'bg-purple-100 text-purple-800',
      'DOCUMENT_UPLOADED': 'bg-indigo-100 text-indigo-800',
      'RECORD_ADDED': 'bg-teal-100 text-teal-800',
      'USER_APPROVED': 'bg-yellow-100 text-yellow-800',
      'FRAUD_MANAGED': 'bg-red-100 text-red-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getActionIcon = (action) => {
    const icons = {
      'CLAIM_SUBMITTED': '📝',
      'CLAIM_VERIFIED': '✅',
      'CLAIM_REVIEWED': '👁️',
      'DOCUMENT_UPLOADED': '📄',
      'RECORD_ADDED': '🏥',
      'USER_APPROVED': '👤',
      'FRAUD_MANAGED': '🚨'
    };
    return icons[action] || '💰';
  };

  const formatAction = (action) => {
    return action
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <FiClock className="mr-2 text-blue-500" />
          Rewards History
        </h2>
        <FiTrendingUp className="text-gray-400 w-6 h-6" />
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <FiClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No activity yet</p>
          <p className="text-gray-400 text-sm">
            Start earning coins by using the platform!
          </p>
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={index} className="relative flex items-start space-x-4 group">
                {/* Timeline line */}
                {index < history.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
                )}

                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 border-white shadow-sm ${getActionColor(entry.action)}`}>
                  {getActionIcon(entry.action)}
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getActionColor(entry.action)}`}>
                          {formatAction(entry.action)}
                        </span>
                        <span className="text-lg font-bold text-yellow-600">
                          🪙 +{entry.coins}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{entry.description}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <FiClock className="w-3 h-3 mr-1" />
                          {formatDate(entry.timestamp)}
                        </span>
                        <span>{formatTime(entry.timestamp)}</span>
                        {entry.relatedId && (
                          <span className="text-blue-600">
                            ID: {entry.relatedId.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {history.length >= limit && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setLimit(limit + 25)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Load More
              </button>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium mb-1">Total Activities</p>
                <p className="text-2xl font-bold text-blue-600">{history.length}</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-600 font-medium mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-yellow-600">
                  🪙 {history.reduce((sum, entry) => sum + entry.coins, 0)}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 font-medium mb-1">Avg per Action</p>
                <p className="text-2xl font-bold text-green-600">
                  {history.length > 0 
                    ? Math.round(history.reduce((sum, entry) => sum + entry.coins, 0) / history.length)
                    : 0}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 font-medium mb-1">Last Activity</p>
                <p className="text-sm font-bold text-purple-600">
                  {history.length > 0 ? formatDate(history[0].timestamp) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RewardsHistory;


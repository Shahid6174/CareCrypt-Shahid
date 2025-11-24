import React from 'react';
import { 
  FiTrendingUp, FiDollarSign, FiAward, FiActivity, 
  FiCheckCircle, FiXCircle, FiAlertTriangle, FiUser 
} from 'react-icons/fi';

/**
 * Analytics Dashboard Component
 * Displays role-specific analytics and metrics
 */
const AnalyticsDashboard = ({ analytics, role }) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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

  const StatCard = ({ icon: Icon, label, value, color = 'blue', trend }) => (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`bg-${color}-100 p-3 rounded-lg`}>
          <Icon className={`w-8 h-8 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {role === 'patient' && (
          <>
            <StatCard icon={FiActivity} label="Total Claims" value={analytics.overview.totalClaims} color="blue" />
            <StatCard icon={FiCheckCircle} label="Genuine Claims" value={analytics.overview.genuineClaims} color="green" />
            <StatCard icon={FiDollarSign} label="Total Coins" value={analytics.overview.totalCoins} color="yellow" />
            <StatCard icon={FiAward} label="Current Level" value={analytics.overview.level} color="purple" />
          </>
        )}

        {role === 'doctor' && (
          <>
            <StatCard icon={FiActivity} label="Records Added" value={analytics.overview.recordsAdded} color="blue" />
            <StatCard icon={FiCheckCircle} label="Claims Verified" value={analytics.overview.claimsVerified} color="green" />
            <StatCard icon={FiDollarSign} label="Total Coins" value={analytics.overview.totalCoins} color="yellow" />
            <StatCard icon={FiAward} label="Current Level" value={analytics.overview.level} color="purple" />
          </>
        )}

        {role === 'insurance' && (
          <>
            <StatCard icon={FiActivity} label="Claims Reviewed" value={analytics.overview.claimsReviewed} color="blue" />
            <StatCard icon={FiCheckCircle} label="Accurate Decisions" value={analytics.overview.accurateDecisions} color="green" />
            <StatCard icon={FiAlertTriangle} label="Frauds Detected" value={analytics.overview.fraudsDetected} color="red" />
            <StatCard icon={FiDollarSign} label="Total Coins" value={analytics.overview.totalCoins} color="yellow" />
          </>
        )}

        {role === 'admin' && (
          <>
            <StatCard icon={FiUser} label="Total Users" value={analytics.overview.totalUsers} color="blue" />
            <StatCard icon={FiCheckCircle} label="Recent Registrations" value={analytics.overview.recentRegistrations} color="green" />
            <StatCard icon={FiAlertTriangle} label="Blocked Users" value={analytics.fraudMetrics.blockedUsers} color="red" />
            <StatCard icon={FiActivity} label="Active Users" value={analytics.engagementMetrics.activeUsers} color="purple" />
          </>
        )}
      </div>

      {/* Badge & Streak */}
      {role !== 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Badge</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(analytics.overview.badge)}`}>
                  {analytics.overview.badge}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Streak</span>
                <span className="text-lg font-bold text-orange-600">
                  🔥 {analytics.overview.streak} days
                </span>
              </div>
              {analytics.activityMetrics?.longestStreak > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Longest Streak</span>
                  <span className="text-lg font-bold text-purple-600">
                    {analytics.activityMetrics.longestStreak} days
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
            <div className="space-y-4">
              {role === 'patient' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Approval Rate</span>
                    <span className="text-lg font-bold text-green-600">{analytics.claimMetrics.approvalRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Documents</span>
                    <span className="text-lg font-bold text-blue-600">{analytics.overview.documentsUploaded}</span>
                  </div>
                </>
              )}
              {role === 'doctor' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Accuracy Rate</span>
                    <span className="text-lg font-bold text-green-600">{analytics.performanceMetrics.accuracyRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">This Month</span>
                    <span className="text-lg font-bold text-blue-600">{analytics.performanceMetrics.recordsThisMonth} records</span>
                  </div>
                </>
              )}
              {role === 'insurance' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Accuracy Rate</span>
                    <span className="text-lg font-bold text-green-600">{analytics.performanceMetrics.accuracyRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Detection Rate</span>
                    <span className="text-lg font-bold text-red-600">{analytics.fraudMetrics.detectionAccuracy}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Specific Charts */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Patients</span>
                <span className="text-lg font-bold text-blue-600">{analytics.overview.patientCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Doctors</span>
                <span className="text-lg font-bold text-green-600">{analytics.overview.doctorCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Agents</span>
                <span className="text-lg font-bold text-purple-600">{analytics.overview.agentCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  analytics.fraudMetrics.systemHealth === 'Healthy' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {analytics.fraudMetrics.systemHealth}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Fraud Rate</span>
                <span className="text-lg font-bold text-red-600">{analytics.fraudMetrics.fraudRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Coins/User</span>
                <span className="text-lg font-bold text-yellow-600">{analytics.engagementMetrics.averageCoinsPerUser}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {analytics.recentActivity && analytics.recentActivity.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-yellow-600">+{activity.coins} coins</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Users (Admin Only) */}
      {role === 'admin' && analytics.engagementMetrics?.topUsers && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Users</h3>
          <div className="space-y-3">
            {analytics.engagementMetrics.topUsers.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(user.badge)}`}>
                    {user.badge}
                  </span>
                  <p className="text-sm font-bold text-yellow-600 mt-1">{user.coins} coins</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;


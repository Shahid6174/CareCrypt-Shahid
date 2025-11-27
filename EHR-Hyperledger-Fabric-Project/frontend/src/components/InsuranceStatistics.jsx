import React from 'react';
import { 
  FiFileText, FiCheckCircle, FiXCircle, FiClock, 
  FiDollarSign, FiTrendingUp, FiActivity, FiAlertCircle 
} from 'react-icons/fi';

const InsuranceStatistics = ({ statistics, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading statistics...</p>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
        <FiActivity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 font-semibold text-lg">No statistics available</p>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      red: "from-red-500 to-red-600",
      yellow: "from-yellow-500 to-yellow-600",
      purple: "from-purple-500 to-purple-600",
      indigo: "from-indigo-500 to-indigo-600"
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
            )}
          </div>
          <div className={`bg-gradient-to-r ${colors[color]} p-3 rounded-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Your Statistics</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiFileText}
          title="Total Claims"
          value={statistics.totalClaims}
          subtitle={`${statistics.claimsThisMonth} this month`}
          color="blue"
        />
        <StatCard
          icon={FiCheckCircle}
          title="Approved"
          value={statistics.approved}
          subtitle={`${((statistics.approved / statistics.totalClaims) * 100 || 0).toFixed(1)}% approval rate`}
          color="green"
        />
        <StatCard
          icon={FiXCircle}
          title="Rejected"
          value={statistics.rejected}
          subtitle={`${((statistics.rejected / statistics.totalClaims) * 100 || 0).toFixed(1)}% rejection rate`}
          color="red"
        />
        <StatCard
          icon={FiClock}
          title="Pending"
          value={statistics.pendingReview + statistics.pendingApproval}
          subtitle="Needs your attention"
          color="yellow"
        />
      </div>

      {/* Financial Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FiDollarSign className="w-6 h-6 mr-2 text-green-500" />
          Financial Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Approved Amount</p>
            <p className="text-2xl font-bold text-green-600">
              ${statistics.totalApprovedAmount?.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Average Processing Time</p>
            <p className="text-2xl font-bold text-blue-600">
              {statistics.averageProcessingTime?.toFixed(1) || 0}h
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">High Value Claims</p>
            <p className="text-2xl font-bold text-purple-600">
              {statistics.highValueClaims || 0}
            </p>
            <p className="text-xs text-gray-500">Above $10,000</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FiActivity className="w-5 h-5 mr-2 text-blue-500" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Week</span>
              <span className="font-bold text-gray-900">{statistics.claimsThisWeek} claims</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Month</span>
              <span className="font-bold text-gray-900">{statistics.claimsThisMonth} claims</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Auto-Approved</span>
              <span className="font-bold text-green-600">{statistics.autoApprovedClaims || 0} claims</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2 text-red-500" />
            Fraud Detection
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fraudulent Attempts</span>
              <span className="font-bold text-red-600">{statistics.fraudulentAttempts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Detection Rate</span>
              <span className="font-bold text-gray-900">
                {((statistics.fraudulentAttempts / statistics.totalClaims) * 100 || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FiTrendingUp className="w-6 h-6 mr-2 text-indigo-500" />
          Claims Status Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600 mb-1">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">{statistics.pendingReview}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
            <p className="text-2xl font-bold text-blue-600">{statistics.pendingApproval}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-600">{statistics.approved}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{statistics.rejected}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceStatistics;


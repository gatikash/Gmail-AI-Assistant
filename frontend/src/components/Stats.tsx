import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  total_moved_to_gator: number;
  total_emails_processed: number;
  email: string;
}

const Stats: React.FC = () => {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('http://localhost:8000/stats', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchStats();
    }
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Email Stats</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="text-4xl font-bold text-blue-600">
            {stats.total_moved_to_gator}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Emails in Lator Gator
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
          <div className="text-4xl font-bold text-purple-600">
            {stats.total_emails_processed}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Total Emails Processed
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Connected Account: <span className="font-medium">{stats.email}</span>
      </div>
    </div>
  );
};

export default Stats; 
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { apiService, EmailAnalysis } from '../services/api';
import { logger } from '../utils/logger';

interface EmailDetail {
  subject: string;
  from_address: string;
  date: string;
  content: string;
}

const EmailDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMovingToTrash, setIsMovingToTrash] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !accessToken) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch email details
        const emailData = await apiService.getEmail(id, accessToken);
        setEmail(emailData);

        // Fetch analysis
        const analysisData = await apiService.getEmailAnalysis(id, accessToken);
        setAnalysis(analysisData);

      } catch (err) {
        console.error('Error loading email:', err);
        setError('Failed to load email details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, accessToken]);

  const handleMoveToTrash = async () => {
    if (!id) return;

    try {
      setIsMovingToTrash(true);
      await apiService.moveToTrash(id);
      logger.debug('Email moved to trash successfully');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to move email to trash');
      logger.error('Error moving email to trash:', err);
    } finally {
      setIsMovingToTrash(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {email?.subject}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            <strong>From:</strong> {email?.from_address}
          </Typography>
          <Typography variant="body1">
            <strong>Date:</strong> {email?.date && new Date(email.date).toLocaleString()}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {email?.content}
        </Typography>

        {analysis && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              AI Analysis
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>Category:</strong> {analysis.category}
              </Typography>
              <Typography variant="body1">
                <strong>Topic:</strong> {analysis.topic}
              </Typography>
              <Typography variant="body1">
                <strong>Sentiment:</strong> {analysis.sentiment}
              </Typography>
              <Typography variant="body1">
                <strong>Priority:</strong> {analysis.priority}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Key Points
              </Typography>
              <ul>
                {analysis.key_points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                Action Items
              </Typography>
              <ul>
                {analysis.action_items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </Box>
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← Back to emails
        </button>
      </Box>

      {analysis && analysis.should_trash && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleMoveToTrash}
            disabled={isMovingToTrash}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isMovingToTrash ? 'Moving to Trash...' : 'Move to Trash'}
          </button>
        </Box>
      )}
    </Container>
  );
};

export default EmailDetail; 
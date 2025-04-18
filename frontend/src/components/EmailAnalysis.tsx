import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { Email, EmailAnalysis as EmailAnalysisType } from '../services/api';
import { apiService } from '../services/api';

interface EmailAnalysisProps {
  email: Email;
}

export default function EmailAnalysis({ email }: EmailAnalysisProps) {
  const [analysis, setAnalysis] = useState<EmailAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getEmailAnalysis(email.message_id);
      setAnalysis(response);
    } catch (err) {
      setError('Failed to analyze email. Please try again.');
      console.error('Error analyzing email:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [email.message_id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={fetchAnalysis}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Email Analysis</Typography>
        <Typography
          variant="body2"
          sx={{
            px: 2,
            py: 1,
            borderRadius: 1,
            bgcolor: analysis.category === 'important' ? 'success.light' :
                     analysis.category === 'promotional' ? 'warning.light' :
                     analysis.category === 'social' ? 'info.light' :
                     'grey.200',
            color: analysis.category === 'important' ? 'success.contrastText' :
                   analysis.category === 'promotional' ? 'warning.contrastText' :
                   analysis.category === 'social' ? 'info.contrastText' :
                   'text.primary'
          }}
        >
          {analysis.category.charAt(0).toUpperCase() + analysis.category.slice(1)}
        </Typography>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2} mb={3}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Topic</Typography>
          <Typography>{analysis.topic}</Typography>
        </Box>
        
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Sentiment</Typography>
          <Typography color={
            analysis.sentiment === 'positive' ? 'success.main' :
            analysis.sentiment === 'negative' ? 'error.main' :
            'text.primary'
          }>
            {analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
          <Typography color={
            analysis.priority === 'high' ? 'error.main' :
            analysis.priority === 'medium' ? 'warning.main' :
            'success.main'
          }>
            {analysis.priority.charAt(0).toUpperCase() + analysis.priority.slice(1)}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Recommendation</Typography>
          <Typography color={analysis.should_trash ? 'error.main' : 'success.main'}>
            {analysis.should_trash ? 'Move to Trash' : 'Keep in Inbox'}
          </Typography>
        </Box>
      </Box>

      <Box mb={3}>
        <Typography variant="subtitle1" gutterBottom>Key Points</Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          {analysis.key_points.map((point, index) => (
            <Typography component="li" key={index} gutterBottom>
              {point}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle1" gutterBottom>Action Items</Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          {analysis.action_items.map((item, index) => (
            <Typography component="li" key={index} gutterBottom>
              {item}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
} 
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Email, Stats } from '../services/api';
import { Box, Container, Typography, Card, CardContent, Grid, CircularProgress, Alert, Button } from '@mui/material';
import EmailCard from '../components/EmailCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('Access Token in dashboard:', accessToken);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching data with token:', accessToken);

      // Fetch both emails and stats
      const [emailsResponse, statsResponse] = await Promise.all([
        apiService.getEmails(accessToken),
        apiService.getStats(accessToken)
      ]);

      console.log('Emails response:', emailsResponse);
      console.log('Stats response:', statsResponse);

      // Handle emails response
      if (emailsResponse) {
        setEmails(emailsResponse);
      } else {
        setEmails([]);
      }

      // Handle stats response
      if (statsResponse) {
        setStats(statsResponse);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setError('Failed to fetch data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      console.log('No access token found, redirecting to login');
      navigate('/login');
      return;
    }

    fetchData();
  }, [accessToken, navigate, logout]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchData}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Stats Section */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Moved to Lator Gator
                </Typography>
                <Typography variant="h3">
                  {stats.total_moved_to_gator}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Emails Processed
                </Typography>
                <Typography variant="h3">
                  {stats.total_emails_processed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Emails Section */}
      <Typography variant="h4" gutterBottom>
        Your Inbox
      </Typography>
      
      {emails.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No emails found in your inbox.
          </Typography>
          <Button 
            variant="contained" 
            onClick={fetchData}
            sx={{ mt: 2 }}
          >
            Refresh Inbox
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {emails.map((email) => (
            <Grid item xs={12} key={email.message_id}>
              <EmailCard email={email} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
} 
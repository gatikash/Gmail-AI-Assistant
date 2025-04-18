import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton, Collapse, CircularProgress } from '@mui/material';
import { Email } from '../services/api';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface EmailCardProps {
  email: Email;
}

const EmailCard: React.FC<EmailCardProps> = ({ email }) => {
  const [expanded, setExpanded] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useAuth();

  const handleExpandClick = async () => {
    if (!expanded) {
      setExpanded(true);
      setLoading(true);
      try {
        const analysisData = await apiService.analyzeEmail(email.message_id, accessToken);
        setAnalysis(analysisData);
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setExpanded(false);
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 3,
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
        },
        background: 'linear-gradient(to right, #ffffff, #f8f9fa)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1, mr: 2 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                color: '#1a237e',
                mb: 1.5
              }}
            >
              {email.subject || 'No Subject'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#546e7a',
                  fontWeight: 500,
                  mr: 2
                }}
              >
                From: {email.from_address}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#78909c',
                  fontSize: '0.875rem'
                }}
              >
                {new Date(email.date).toLocaleString()}
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#455a64',
                lineHeight: 1.6,
                mt: 1.5
              }}
            >
              {email.snippet}
            </Typography>
          </Box>
          <IconButton 
            onClick={handleExpandClick}
            sx={{ 
              color: '#1a237e',
              '&:hover': {
                backgroundColor: 'rgba(26, 35, 126, 0.08)'
              }
            }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {email.labels?.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {email.labels.map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                sx={{ 
                  backgroundColor: label === 'INBOX' ? 'rgba(26, 35, 126, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  color: label === 'INBOX' ? '#1a237e' : '#546e7a',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: label === 'INBOX' ? 'rgba(26, 35, 126, 0.15)' : 'rgba(0, 0, 0, 0.12)'
                  }
                }}
              />
            ))}
          </Box>
        )}

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box 
            sx={{ 
              mt: 3, 
              pt: 3, 
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              background: 'linear-gradient(to right, rgba(26, 35, 126, 0.02), rgba(26, 35, 126, 0.05))',
              borderRadius: 1,
              p: 2,
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {loading ? (
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center"
                sx={{ 
                  width: '100%',
                  height: '100%'
                }}
              >
                <CircularProgress 
                  size={40} 
                  sx={{ 
                    color: '#1a237e',
                    mb: 2
                  }} 
                />
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#546e7a',
                    fontWeight: 500,
                    textAlign: 'center'
                  }}
                >
                  Analyzing your email...
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#78909c',
                    mt: 1,
                    textAlign: 'center'
                  }}
                >
                  This may take a few moments
                </Typography>
              </Box>
            ) : analysis ? (
              <Box sx={{ width: '100%' }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    color: '#1a237e',
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  AI Analysis
                </Typography>
                <Box 
                  sx={{ 
                    mb: 3,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 2
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#546e7a', mb: 0.5 }}>
                      Category
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {analysis.category}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#546e7a', mb: 0.5 }}>
                      Topic
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {analysis.topic}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#546e7a', mb: 0.5 }}>
                      Sentiment
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {analysis.sentiment}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#546e7a', mb: 0.5 }}>
                      Priority
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {analysis.priority}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: '#1a237e',
                      fontWeight: 600,
                      mb: 1.5
                    }}
                  >
                    Key Points
                  </Typography>
                  <Box 
                    component="ul" 
                    sx={{ 
                      m: 0, 
                      pl: 2,
                      '& li': {
                        mb: 1,
                        color: '#455a64',
                        '&::marker': {
                          color: '#1a237e'
                        }
                      }
                    }}
                  >
                    {analysis.key_points.map((point: string, index: number) => (
                      <li key={index}>
                        <Typography variant="body2">{point}</Typography>
                      </li>
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: '#1a237e',
                      fontWeight: 600,
                      mb: 1.5
                    }}
                  >
                    Action Items
                  </Typography>
                  <Box 
                    component="ul" 
                    sx={{ 
                      m: 0, 
                      pl: 2,
                      '& li': {
                        mb: 1,
                        color: '#455a64',
                        '&::marker': {
                          color: '#1a237e'
                        }
                      }
                    }}
                  >
                    {analysis.action_items.map((item: string, index: number) => (
                      <li key={index}>
                        <Typography variant="body2">{item}</Typography>
                      </li>
                    ))}
                  </Box>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default EmailCard; 
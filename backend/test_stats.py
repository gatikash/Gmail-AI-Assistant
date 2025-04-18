import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_stats():
    # Use the provided token
    token = "your gmail token here"
    
    try:
        # Make request to stats endpoint
        logger.info("Testing stats endpoint...")
        response = requests.get(
            "http://localhost:8000/stats",
            headers={"Authorization": f"Bearer {token}"}
        )

        if response.status_code == 200:
            logger.info("Stats endpoint test successful!")
            stats = response.json()
            logger.info("\nYour Email Statistics:")
            logger.info(f"- Emails in Lator Gator: {stats.get('total_moved_to_gator', 0)}")
            logger.info(f"- Total Emails Processed: {stats.get('total_emails_processed', 0)}")
            logger.info(f"- Email Account: {stats.get('email', 'Not found')}")
        else:
            logger.error(f"Error status code: {response.status_code}")
            logger.error(f"Error response: {response.text}")

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise

if __name__ == "__main__":
    test_stats() 
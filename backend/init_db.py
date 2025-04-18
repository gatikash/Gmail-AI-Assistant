import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from database import engine, Base
from models import User, EmailLog
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    try:
        logger.info("Dropping existing tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("Existing tables dropped successfully!")

        logger.info("Creating database tables...")
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
        
        # Log the tables that were created
        tables = Base.metadata.tables.keys()
        logger.info(f"Created tables: {', '.join(tables)}")
        
    except Exception as e:
        logger.error(f"Error managing database tables: {str(e)}")
        raise

if __name__ == "__main__":
    init_database() 
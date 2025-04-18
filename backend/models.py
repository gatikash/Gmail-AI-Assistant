from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # User fields
    email = Column(String, unique=True, index=True)
    total_moved_to_gator = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    email_logs = relationship("EmailLog", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email}>"

class EmailLog(Base):
    __tablename__ = "email_logs"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Email fields
    message_id = Column(String)
    moved_to_gator = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="email_logs")
    
    def __repr__(self):
        return f"<EmailLog {self.message_id}>"

# Create all tables
def init_db(engine):
    Base.metadata.create_all(bind=engine) 
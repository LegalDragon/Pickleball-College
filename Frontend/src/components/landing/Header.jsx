import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <h1>Play Better Pickleball Now</h1>
          <p className="subtitle">
            Join the premier platform for pickleball education. Access world-class training materials, 
            schedule sessions with certified coaches, and transform your game.
          </p>
          <div className="btn-group">
            <button className="btn btn-primary">Start Learning Free</button>
            <button className="btn btn-outline">Browse Courses</button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
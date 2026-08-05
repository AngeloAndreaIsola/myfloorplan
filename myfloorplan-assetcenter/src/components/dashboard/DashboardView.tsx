import React from 'react';

export const DashboardView: React.FC = () => (
  <div className="p-6 space-y-6">
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="stats shadow bg-base-200">
        <div className="stat">
          <div className="stat-title">Total Assets</div>
          <div className="stat-value text-primary">124</div>
          <div className="stat-desc">21% more than last month</div>
        </div>
      </div>
      <div className="stats shadow bg-base-200">
        <div className="stat">
          <div className="stat-title">Finalized Items</div>
          <div className="stat-value text-secondary">58</div>
          <div className="stat-desc">8 pending review</div>
        </div>
      </div>
      <div className="stats shadow bg-base-200">
        <div className="stat">
          <div className="stat-title">Active Jobs</div>
          <div className="stat-value text-accent">2</div>
          <div className="stat-desc">Collecting from SweetHome3D</div>
        </div>
      </div>
      <div className="stats shadow bg-base-200">
        <div className="stat">
          <div className="stat-title">Storage Used</div>
          <div className="stat-value">4.2 GB</div>
          <div className="stat-desc">of 10 GB limit</div>
        </div>
      </div>
    </div>
  </div>
);

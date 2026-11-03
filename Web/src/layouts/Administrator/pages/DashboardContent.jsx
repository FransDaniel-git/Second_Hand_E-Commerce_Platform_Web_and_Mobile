import React from 'react';
import StatCard from '../components/StatCard';
import ActivityItem from '../components/ActivityItem';
import TaskItem from '../components/TaskItem';
import UserRow from '../components/UserRow';

const DashboardContent = () => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 w-full min-w-0">
        <StatCard title="Users" value="3,456" change="+12.5%" positive={true} />
        <StatCard title="Revenue" value="$23,456" change="+8.2%" positive={true} />
        <StatCard title="Bounce Rate" value="42%" change="-3.5%" positive={false} />
        <StatCard title="Sessions" value="9,456" change="-1.2%" positive={false} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 w-full min-w-0">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
          <ActivityItem title="New user registered" description="John Doe registered" time="2 min ago" />
          <ActivityItem title="New order placed" description="Sarah ordered $150" time="45 min ago" />
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Upcoming Tasks</h2>
          <TaskItem title="Review new designs" deadline="Today" priority="high" />
          <TaskItem title="Team meeting" deadline="Tomorrow, 10:00 AM" priority="medium" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6 w-full overflow-x-auto">
        <h2 className="text-lg font-medium mb-4">Recent Users</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <tbody>
            <UserRow name="John Doe" email="john@example.com" role="Admin" status="Active" />
            <UserRow name="Jane Smith" email="jane@example.com" role="Editor" status="Active" />
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DashboardContent;
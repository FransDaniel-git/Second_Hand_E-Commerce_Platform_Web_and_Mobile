import React from 'react';

const ActivityItem = () => {
  return (
    <div className="bg-white p-4 shadow-md rounded-lg mt-4">
      <h3 className="text-lg font-semibold">Recent Activities</h3>
      <ul className="mt-2">
        <li className="text-gray-700">✔ User John Doe updated a task</li>
        <li className="text-gray-700">✔ New project added by Admin</li>
        <li className="text-gray-700">✔ Task "Design UI" marked as completed</li>
      </ul>
    </div>
  );
};

export default ActivityItem;

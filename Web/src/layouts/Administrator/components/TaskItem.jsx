import React from 'react';

const TaskItem = () => {
  return (
    <div className="bg-white p-4 shadow-md rounded-lg mt-4">
      <h3 className="text-lg font-semibold">Pending Tasks</h3>
      <ul className="mt-2">
        <li className="text-gray-700">📌 Fix bugs in login page</li>
        <li className="text-gray-700">📌 Update API documentation</li>
        <li className="text-gray-700">📌 Design dashboard layout</li>
      </ul>
    </div>
  );
};

export default TaskItem;

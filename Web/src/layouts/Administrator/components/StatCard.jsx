import React from 'react';

const StatCard = ({ title, value, change, positive }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 min-w-auto">
      <p className="text-sm text-yellow-500 sm:text-teal-400">{title}</p>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">{value}</h3>
        <span className={`text-sm ${positive ? 'text-green-500' : 'text-red-500'}`}>{change}</span>
      </div>
    </div>
  );
};

export default StatCard;

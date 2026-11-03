import React from 'react';

const UserRow = ({ name, email, role, status }) => {
  return (
    <tr>
      <td className="px-6 py-4">{name}</td>
      <td className="px-6 py-4">{email}</td>
      <td className="px-6 py-4">{role}</td>
      <td className="px-6 py-4">{status}</td>
    </tr>
  );
};

export default UserRow;

import { useEffect, useState } from 'react';
import supabase, { getUsers } from '../services/supabase';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        const rows = await getUsers();

        if (isMounted) {
          setUsers(rows);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      {error && <p>{error}</p>}
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name || user.email || user.id}</li>
        ))}
      </ul>
    </div>
  );
}

export default UsersPage;

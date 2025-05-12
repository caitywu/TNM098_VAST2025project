// Layout.jsx --> for the top menu bar
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div>
      <header style={{ backgroundColor: '#f4f4f4', padding: '1rem 2rem' }}>
        <h1>Musical Network</h1>
        <nav style={{ marginTop: '0.5rem' }}>
          <Link to="/" style={{ marginRight: '1rem' }}>Network Graph</Link>
          <Link to="/task2">Task 2</Link>
        </nav>
      </header>
      <main style={{ padding: '1rem 2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

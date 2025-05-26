import { Link, Outlet } from 'react-router-dom';

/**
 * A layout that renders a header with links to the pages.
 * 
 * @returns {JSX.Element} The rendered header.
 */
export default function Layout() {
  const headerHeight = 80; 

  return (
    <div>
      {/* Fixed Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          backgroundColor: '#f4f4f4',
          padding: '0.25rem 0.25rem',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header content --> Links to the pages */}
        <h2 style={{ margin: 0 }}>Musical Network</h2>
        <nav style={{ marginTop: '0.5rem' }}>
          <Link to="/" style={{ marginRight: '2rem' }}>Network Graph</Link>
          <Link to="/task2" style={{ marginRight: '2rem' }}>Genre Analysis</Link>
          <Link to="/matrix">Genre Matrices</Link>
        </nav>
      </header>

      {/* Main Content - with padding top to offset fixed header */}
      <main style={{ padding: '1rem 2rem', marginTop: `${headerHeight}px` }}>
        <Outlet />
      </main>
    </div>
  );
}

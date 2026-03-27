import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="badge">Athlete Career Management Platform</span>
            <h1>Build careers beyond sport.</h1>
            <p>
              Mentoria is a subscription-based platform for athletes, mentors, and administrators to manage learning,
              career planning, content, advisory, and long-term development in one secure digital workspace.
            </p>
            <div className="button-row">
              <Link href="/register" className="button">Create Account</Link>
              <Link href="/login" className="button button-secondary">Member Login</Link>
            </div>
          </div>
          <div className="card">
            <h3>Included in this MVP</h3>
            <ul className="clean">
              <li>Email/password registration with role selection</li>
              <li>Supabase-ready user profiles and role-based access</li>
              <li>Admin, mentor, and user dashboard scaffolds</li>
              <li>Internal registration notification API route</li>
              <li>Starter SQL schema for subscriptions and content</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cards">
            <div className="card">
              <h3>Admin Dashboard</h3>
              <p>Manage users, mentor approvals, materials, quizzes, and subscription status.</p>
            </div>
            <div className="card">
              <h3>Mentor Dashboard</h3>
              <p>Review assigned users, publish resources, track progress, and manage sessions.</p>
            </div>
            <div className="card">
              <h3>User Dashboard</h3>
              <p>Access learning materials, quizzes, career plans, and subscription settings.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

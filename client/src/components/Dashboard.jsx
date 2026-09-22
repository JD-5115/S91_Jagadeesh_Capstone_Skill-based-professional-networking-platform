function Dashboard({ username, onLogout }) {
	const displayName = username?.split('@')[0] || 'there'

	return (
		<main className="dashboard-page">
			<header className="dashboard-header">
				<div className="brand"><span className="brand-mark">s</span><span>skill<span>link</span></span></div>
				<button className="dashboard-logout" type="button" onClick={onLogout}>Log out</button>
			</header>
			<section className="dashboard-content">
				<div className="dashboard-intro">
					<p className="eyebrow">YOUR NETWORK, IN MOTION</p>
					<h1>Good to see you, <em>{displayName}.</em></h1>
					<p>Keep building meaningful connections around the things you do best.</p>
				</div>
				<div className="dashboard-grid">
					<article className="dashboard-card dashboard-card-featured">
						<span className="card-kicker">DISCOVER</span>
						<h2>Find your next useful conversation.</h2>
						<p>Explore people whose skills and ideas complement your own.</p>
						<button type="button" className="dashboard-action">Explore network <span>→</span></button>
					</article>
					<article className="dashboard-card">
						<span className="card-kicker">YOUR PROFILE</span>
						<h2>Make your skills easy to find.</h2>
						<p>Add your experience, interests, and what you are looking for.</p>
						<button type="button" className="dashboard-link">Complete profile <span>→</span></button>
					</article>
					<article className="dashboard-card dashboard-card-stats">
						<span className="card-kicker">AT A GLANCE</span>
						<strong>0</strong>
						<p>connections waiting to be made</p>
					</article>
				</div>
			</section>
		</main>
	)
}

export default Dashboard

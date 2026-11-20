import { useEffect, useState } from 'react'
import { API_URL } from '../api.js'

const showcaseMembers = [
	{
		id: 'maya-chen',
		name: 'Maya Chen',
		role: 'Product designer',
		initials: 'MC',
		bio: 'I turn complex workflows into calm, useful product experiences. Always happy to talk research and design systems.',
		skills: ['Product design', 'UX research', 'Figma'],
		title: 'A better product starts with a better question',
		excerpt: 'The most useful discovery sessions begin before anyone opens a design tool.',
		story: 'I used to begin every project by sketching screens. Now I begin by writing down what we still do not understand. A short conversation with the people who use a product often reveals that the original request is only a symptom. That shift has helped my teams spend less time polishing assumptions and more time solving the right problem.',
		readTime: '4 min read',
	},
	{
		id: 'arjun-patel',
		name: 'Arjun Patel',
		role: 'Full-stack developer',
		initials: 'AP',
		bio: 'Building dependable web apps with thoughtful APIs. I enjoy mentoring early-career developers and learning in public.',
		skills: ['React', 'Node.js', 'API design'],
		title: 'Small, steady steps to a more reliable API',
		excerpt: 'A few lightweight habits that make backend changes easier to trust.',
		story: 'Reliability is rarely one dramatic improvement. I start with clear request and response shapes, make failures visible, and add one focused test for the behavior a change is meant to protect. That rhythm keeps reviews smaller and gives the next person a clearer path through the code.',
		readTime: '3 min read',
	},
	{
		id: 'leila-hassan',
		name: 'Leila Hassan',
		role: 'Data storyteller',
		initials: 'LH',
		bio: 'Making data easier to understand and act on. Interested in analytics, accessible charts, and community projects.',
		skills: ['Data analysis', 'Storytelling', 'Accessibility'],
		title: 'The chart is not the insight',
		excerpt: 'Good data stories help people decide what to do next, not just what happened.',
		story: 'A chart can be accurate and still leave its audience unsure what matters. I try to pair every visualization with a clear question, a useful comparison, and a sentence about the decision it supports. When the audience can explain the takeaway in their own words, the story is doing its job.',
		readTime: '5 min read',
	},
]

const fetchUsers = async () => {
	const response = await fetch(`${API_URL}/users`)
	const result = await response.json()
	if (!response.ok) throw new Error(result.message || 'Unable to load members.')
	return result
}

const fetchProfile = async (username) => {
	const response = await fetch(`${API_URL}/users/${encodeURIComponent(username)}`)
	const result = await response.json()
	if (!response.ok) throw new Error(result.message || 'Unable to load your network.')
	return result
}

const getUserId = (user) => String(user?._id || user?.id || user)

function Discover({ username, token, onLogout }) {
	const [users, setUsers] = useState([])
	const [profile, setProfile] = useState(null)
	const [memberSearch, setMemberSearch] = useState('')
	const [membersLoading, setMembersLoading] = useState(true)
	const [membersError, setMembersError] = useState('')
	const [connectingUsername, setConnectingUsername] = useState('')
	const [connectionNotice, setConnectionNotice] = useState('')
	const [expandedStory, setExpandedStory] = useState('')

	useEffect(() => {
		let isCurrent = true
		Promise.all([fetchUsers(), fetchProfile(username)]).then(([members, ownProfile]) => {
			if (!isCurrent) return
			setUsers(members)
			setProfile(ownProfile)
			setMembersLoading(false)
		}).catch((error) => {
			if (!isCurrent) return
			setMembersError(error.message)
			setMembersLoading(false)
		})
		return () => { isCurrent = false }
	}, [username])

	const connectedIds = new Set((profile?.connections || []).map(getUserId))
	const visibleUsers = users.filter((user) => {
		if (user.username?.toLowerCase() === username?.toLowerCase()) return false
		const searchText = `${user.username || ''} ${user.bio || ''} ${(user.skills || []).join(' ')}`.toLowerCase()
		return searchText.includes(memberSearch.trim().toLowerCase())
	})

	const connectWith = async (targetUser) => {
		setConnectingUsername(targetUser.username)
		setConnectionNotice('')
		try {
			const response = await fetch(`${API_URL}/users/${encodeURIComponent(username)}/connections`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ targetUsername: targetUser.username }),
			})
			const result = await response.json()
			if (!response.ok) throw new Error(result.message || 'Unable to connect right now.')
			setUsers((currentUsers) => currentUsers.map((user) => user._id === targetUser._id
				? { ...user, connections: [...(user.connections || []), profile?._id] }
				: user))
			setProfile((currentProfile) => ({
				...currentProfile,
				connections: [...(currentProfile?.connections || []), targetUser],
			}))
			setConnectionNotice(`You and ${targetUser.username} are now connected.`)
		} catch (error) {
			setConnectionNotice(error.message)
		} finally {
			setConnectingUsername('')
		}
	}

	const scrollToStory = (storyId) => {
		document.getElementById(`story-${storyId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
	}

	return (
		<main className="dashboard-page discover-page">
			<header className="dashboard-header">
				<div className="brand"><span className="brand-mark">s</span><span>skill<span>link</span></span></div>
				<div className="dashboard-header-actions">
					<nav className="dashboard-nav" aria-label="Main navigation">
						<a href="#/dashboard">Dashboard</a>
						<a href="#/discover" aria-current="page">Discover</a>
					</nav>
					<button className="dashboard-logout" type="button" onClick={onLogout}>Log out</button>
				</div>
			</header>
			<section className="dashboard-content">
				<div className="dashboard-intro discover-intro">
					<p className="eyebrow">PEOPLE, IDEAS, AND WHAT COMES NEXT</p>
					<h1>Find your next <em>good conversation.</em></h1>
					<p>Meet thoughtful people, learn from their work, and find new perspectives to bring to your own.</p>
				</div>

				<section className="showcase-section" aria-labelledby="showcase-heading">
					<div className="discover-heading">
						<div><p className="card-kicker">COMMUNITY SPOTLIGHTS</p><h2 id="showcase-heading">People making things happen</h2></div>
						<span>Showcase profiles</span>
					</div>
					<div className="showcase-profile-grid">
						{showcaseMembers.map((member) => (
							<article className="showcase-profile-card" key={member.id}>
								<div className={`showcase-avatar avatar-${member.id}`} aria-hidden="true">{member.initials}</div>
								<p className="showcase-role">{member.role}</p>
								<h3>{member.name}</h3>
								<p className="showcase-bio">{member.bio}</p>
								<ul className="member-skills" aria-label={`${member.name}'s skills`}>
									{member.skills.map((skill) => <li key={skill}>{skill}</li>)}
								</ul>
								<button className="story-jump" type="button" onClick={() => scrollToStory(member.id)}>Read {member.name.split(' ')[0]}'s blog <span aria-hidden="true">↓</span></button>
							</article>
						))}
					</div>
				</section>

				<section className="showcase-section stories-section" id="stories" aria-labelledby="stories-heading">
					<div className="discover-heading">
						<div><p className="card-kicker">IDEAS FROM THE COMMUNITY</p><h2 id="stories-heading">Latest from their blogs</h2></div>
						<span>Featured writing</span>
					</div>
					<div className="story-grid">
						{showcaseMembers.map((member) => {
							const isExpanded = expandedStory === member.id
							return <article className="story-card" id={`story-${member.id}`} key={member.id}>
								<div className="story-byline"><span className={`story-avatar avatar-${member.id}`}>{member.initials}</span><span>{member.name} <i>·</i> {member.readTime}</span></div>
								<h3>{member.title}</h3>
								<p>{member.excerpt}</p>
								{isExpanded && <p className="story-body">{member.story}</p>}
								<button className="story-read-button" type="button" aria-expanded={isExpanded} onClick={() => setExpandedStory(isExpanded ? '' : member.id)}>
									{isExpanded ? 'Show less' : 'Read story'} <span aria-hidden="true">{isExpanded ? '↑' : '→'}</span>
								</button>
							</article>
						})}
					</div>
				</section>

				<section className="showcase-section member-discovery" aria-labelledby="members-heading">
					<div className="discover-heading">
						<div><p className="card-kicker">YOUR NEXT CONNECTION</p><h2 id="members-heading">Meet SkillLink members</h2></div>
						<span>{connectedIds.size} {connectedIds.size === 1 ? 'connection' : 'connections'}</span>
					</div>
					<label className="member-search">Find people by name or skill
						<input type="search" value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Try design, JavaScript, or a name" />
					</label>
					{membersLoading && <p className="posts-status" role="status">Finding people to connect with...</p>}
					{membersError && <p className="posts-status" role="alert">{membersError}</p>}
					{connectionNotice && <p className="connection-notice" role="status">{connectionNotice}</p>}
					{!membersLoading && !membersError && visibleUsers.length === 0 && <p className="posts-status">{memberSearch ? 'No people match that search. Try another name or skill.' : 'No other members yet. Invite someone to join SkillLink.'}</p>}
					<div className="member-grid">
						{visibleUsers.map((user) => {
							const isConnected = connectedIds.has(getUserId(user))
							return <article className="member-card" key={user._id}>
								<div className="member-card-heading">
									<div className="member-avatar" aria-hidden="true">{(user.username || '?').slice(0, 1).toUpperCase()}</div>
									<div><h3>{user.username}</h3><span>{isConnected ? 'In your network' : 'SkillLink member'}</span></div>
								</div>
								<p className="member-bio">{user.bio || 'This member is ready to make meaningful connections.'}</p>
								{user.skills?.length > 0 && <ul className="member-skills" aria-label="Skills">{user.skills.slice(0, 4).map((skill) => <li key={skill}>{skill}</li>)}</ul>}
								<button className={`connect-button${isConnected ? ' connected' : ''}`} type="button" disabled={isConnected || connectingUsername === user.username} onClick={() => connectWith(user)}>
									{isConnected ? 'Connected' : connectingUsername === user.username ? 'Connecting...' : 'Connect'}{!isConnected && <span aria-hidden="true">+</span>}
								</button>
							</article>
						})}
					</div>
				</section>
			</section>
		</main>
	)
}

export default Discover

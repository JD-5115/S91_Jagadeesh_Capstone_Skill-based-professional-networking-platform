import { useEffect, useState } from 'react'
import { API_BASE_URL, API_URL } from '../api.js'

const fetchPosts = async () => {
	const response = await fetch(`${API_URL}/posts`)
	const result = await response.json()
	if (!response.ok) throw new Error(result.message || 'Unable to load posts.')
	return result
}

const fetchProfile = async (username) => {
	const response = await fetch(`${API_URL}/users/${encodeURIComponent(username)}`)
	const result = await response.json()
	if (!response.ok) throw new Error(result.message || 'Unable to load your profile.')
	return result
}

function Dashboard({ username, token, onLogout }) {
	const [posts, setPosts] = useState([])
	const [profile, setProfile] = useState(null)
	const [profileForm, setProfileForm] = useState({ bio: '', skills: '' })
	const [profileLoading, setProfileLoading] = useState(true)
	const [isEditingProfile, setIsEditingProfile] = useState(false)
	const [profileStatus, setProfileStatus] = useState('')
	const [editingPostId, setEditingPostId] = useState(null)
	const [editForm, setEditForm] = useState({ title: '', description: '' })
	const [newPost, setNewPost] = useState({ title: '', description: '', file: null })
	const [status, setStatus] = useState('Loading posts...')

	useEffect(() => {
		let isCurrent = true
		fetchPosts().then((result) => {
			if (!isCurrent) return
			setPosts(result)
			setStatus(result.length ? '' : 'No conversations yet. Share an idea and start one.')
		}).catch((error) => {
			if (isCurrent) setStatus(error.message)
		})
		return () => { isCurrent = false }
	}, [])

	useEffect(() => {
		let isCurrent = true
		fetchProfile(username).then((result) => {
			if (!isCurrent) return
			setProfile(result)
			setProfileForm({ bio: result.bio || '', skills: (result.skills || []).join(', ') })
			setProfileLoading(false)
		}).catch((error) => {
			if (isCurrent) {
				setProfileStatus(error.message)
				setProfileLoading(false)
			}
		})
		return () => { isCurrent = false }
	}, [username])

	const saveProfile = async (event) => {
		event.preventDefault()
		setProfileStatus('')
		try {
			const response = await fetch(`${API_URL}/users/${encodeURIComponent(username)}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					bio: profileForm.bio,
					skills: profileForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
				}),
			})
			const result = await response.json()
			if (!response.ok) throw new Error(result.message || 'Unable to save your profile.')
			setProfile((currentProfile) => ({ ...currentProfile, ...result }))
			setProfileForm({ bio: result.bio || '', skills: (result.skills || []).join(', ') })
			setIsEditingProfile(false)
			setProfileStatus('Profile updated.')
		} catch (error) {
			setProfileStatus(error.message)
		}
	}

	const startEditing = (post) => {
		setEditingPostId(post._id)
		setEditForm({ title: post.title, description: post.description })
		setStatus('')
	}

	const savePost = async (event) => {
		event.preventDefault()
		try {
			const response = await fetch(`${API_URL}/posts/${editingPostId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify(editForm),
			})
			const result = await response.json()
			if (!response.ok) throw new Error(result.message || 'Unable to update post.')
			setPosts((currentPosts) => currentPosts.map((post) => post._id === result._id ? result : post))
			setEditingPostId(null)
			setStatus('Post updated successfully.')
		} catch (error) {
			setStatus(error.message)
		}
	}

	const createPost = async (event) => {
		event.preventDefault()
		const formData = new FormData()
		formData.append('title', newPost.title)
		formData.append('description', newPost.description)
		formData.append('username', username)
		if (newPost.file) formData.append('file', newPost.file)
		try {
			const response = await fetch(`${API_URL}/posts`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
			const result = await response.json()
			if (!response.ok) throw new Error(result.message || 'Unable to create post.')
			setPosts((currentPosts) => [result, ...currentPosts])
			setNewPost({ title: '', description: '', file: null })
			event.currentTarget.reset()
			setStatus('Post shared successfully.')
		} catch (error) {
			setStatus(error.message)
		}
	}

	const deletePost = async (postId) => {
		if (!window.confirm('Delete this post?')) return
		try {
						const response = await fetch(`${API_URL}/posts/${postId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
			if (!response.ok) {
				const result = await response.json()
				throw new Error(result.message || 'Unable to delete post.')
			}
			setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId))
			setStatus('Post deleted successfully.')
		} catch (error) {
			setStatus(error.message)
		}
	}

	const displayName = username || 'there'
	const connectionCount = profile?.connections?.length || 0
	const skillCount = profile?.skills?.length || 0
	const profileCompletion = Math.round(([profile?.bio?.trim(), skillCount > 0, connectionCount > 0].filter(Boolean).length / 3) * 100)

	return (
		<main className="dashboard-page">
			<header className="dashboard-header">
				<div className="brand"><span className="brand-mark">s</span><span>skill<span>link</span></span></div>
				<div className="dashboard-header-actions">
					<nav className="dashboard-nav" aria-label="Main navigation">
						<a href="#/dashboard" aria-current="page">Dashboard</a>
						<a href="#/discover">Discover</a>
					</nav>
					<button className="dashboard-logout" type="button" onClick={onLogout}>Log out</button>
				</div>
			</header>
			<section className="dashboard-content">
				<div className="dashboard-hero">
					<div className="dashboard-intro">
						<p className="eyebrow">YOUR NETWORK, IN MOTION</p>
						<h1>Good to see you, <em>{displayName}.</em></h1>
						<p>One good conversation can lead somewhere great. Catch up with your community or share what you’re working on.</p>
					</div>
					<aside className="dashboard-hero-aside">
						<span className="hero-aside-mark" aria-hidden="true">s</span>
						<p className="card-kicker">MAKE YOUR NEXT MOVE</p>
						<h2>Your next collaborator is out there.</h2>
						<a href="#/discover">Explore your community <span aria-hidden="true">→</span></a>
					</aside>
				</div>
				<section className="dashboard-stats" aria-label="Your SkillLink overview">
					<article className="dashboard-stat"><span className="stat-label">COMMUNITY POSTS</span><strong>{posts.length}</strong><span className="stat-detail">Ideas in the feed</span></article>
					<article className="dashboard-stat"><span className="stat-label">CONNECTIONS</span><strong>{connectionCount}</strong><span className="stat-detail">People in your circle</span></article>
					<article className="dashboard-stat"><span className="stat-label">YOUR SKILLS</span><strong>{skillCount}</strong><span className="stat-detail">Skills on your profile</span></article>
					<article className="dashboard-stat dashboard-stat-progress"><span className="stat-label">PROFILE STRENGTH</span><strong>{profile ? `${profileCompletion}%` : profileLoading ? '—' : '0%'}</strong><div className="progress-track" aria-label={`Profile strength ${profileCompletion}%`}><span style={{ width: `${profileCompletion}%` }} /></div><span className="stat-detail">Add a bio, skills, and connections</span></article>
				</section>
				<div className="dashboard-main-grid">
					<section className="posts-section dashboard-feed" aria-labelledby="posts-heading">
						<div className="posts-heading"><div><p className="card-kicker">IDEAS FROM YOUR COMMUNITY</p><h2 id="posts-heading">Recent conversations</h2></div><a href="#create-post">Share an idea <span aria-hidden="true">↑</span></a></div>
						<form className="post-composer" id="create-post" onSubmit={createPost}>
							<div className="composer-heading"><p className="card-kicker">START A CONVERSATION</p><h3>What are you working on?</h3></div>
							<label>Give your post a title<input value={newPost.title} onChange={(event) => setNewPost({ ...newPost, title: event.target.value })} placeholder="A question, idea, or project update" required /></label>
							<label>Add a little context<textarea value={newPost.description} onChange={(event) => setNewPost({ ...newPost, description: event.target.value })} placeholder="Share what you’ve learned or what kind of feedback would help..." required /></label>
							<div className="composer-footer"><label className="file-picker">Attach a file<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" onChange={(event) => setNewPost({ ...newPost, file: event.target.files[0] || null })} /></label><span>{newPost.file?.name || 'Optional, up to 10 MB'}</span><button className="dashboard-action" type="submit">Share post <span aria-hidden="true">→</span></button></div>
						</form>
						{status && <p className="posts-status" role="status">{status}</p>}
						<div className="posts-list">
							{posts.map((post) => {
								const isOwner = post.author?.username === username
								return <article className="post-item" key={post._id}>
									{editingPostId === post._id ? <form className="post-edit-form" onSubmit={savePost}>
										<label>Title<input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} required /></label>
										<label>Description<textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} required /></label>
										<div className="post-actions"><button type="submit" className="dashboard-action">Save changes</button><button type="button" className="dashboard-link" onClick={() => setEditingPostId(null)}>Cancel</button></div>
									</form> : <div className="post-item-content"><p className="card-kicker">{post.author?.username || 'SKILLLINK MEMBER'}</p><h3>{post.title}</h3><p>{post.description}</p>{post.attachment && <a className="post-attachment" href={`${API_BASE_URL}${post.attachment.url}`} target="_blank" rel="noreferrer">{post.attachment.originalName} <span>{Math.ceil(post.attachment.size / 1024)} KB</span></a>}</div>}
									{isOwner && editingPostId !== post._id && <div className="post-actions"><button type="button" className="dashboard-link" onClick={() => startEditing(post)}>Edit</button><button type="button" className="dashboard-danger" onClick={() => deletePost(post._id)}>Delete</button></div>}
								</article>
							})}
						</div>
					</section>
					<aside className="dashboard-sidebar">
						<section className="profile-summary" aria-labelledby="profile-heading">
							<div className="profile-summary-heading">
								<div className="profile-avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</div>
								<div><p className="card-kicker">YOUR PROFILE</p><h2 id="profile-heading">{profile?.username || displayName}</h2></div>
							</div>
							{isEditingProfile ? <form className="profile-edit-form" onSubmit={saveProfile}>
								<label>About you<textarea value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} placeholder="A short introduction about what you do and what you enjoy." maxLength="300" /></label>
								<label>Skills, separated by commas<input value={profileForm.skills} onChange={(event) => setProfileForm({ ...profileForm, skills: event.target.value })} placeholder="Design, React, mentoring" /></label>
								<div className="profile-form-actions"><button className="profile-save-button" type="submit">Save profile</button><button className="profile-cancel-button" type="button" onClick={() => { setProfileForm({ bio: profile?.bio || '', skills: (profile?.skills || []).join(', ') }); setIsEditingProfile(false) }}>Cancel</button></div>
							</form> : <>
								<p className="profile-bio">{profile?.bio || 'Add a short introduction to help people understand what you do and what you are looking for.'}</p>
								{profile?.skills?.length > 0 ? <ul className="profile-skills">{profile.skills.slice(0, 6).map((skill) => <li key={skill}>{skill}</li>)}</ul> : <p className="profile-empty">Add your skills so the right people can find you.</p>}
								<button className="profile-edit-button" type="button" onClick={() => { setProfileStatus(''); setIsEditingProfile(true) }}>Edit profile <span aria-hidden="true">→</span></button>
							</>}
							{profileStatus && <p className="profile-status" role="status">{profileStatus}</p>}
							<div className="profile-completion"><div><span>Profile strength</span><strong>{profile ? `${profileCompletion}%` : profileLoading ? 'Loading' : 'Start now'}</strong></div><div className="progress-track"><span style={{ width: `${profileCompletion}%` }} /></div></div>
						</section>
						<section className="dashboard-quick-links" aria-labelledby="quick-links-heading">
							<p className="card-kicker">KEEP YOUR MOMENTUM</p><h2 id="quick-links-heading">What’s next?</h2>
							<a href="#/discover"><span><strong>Find your people</strong><small>Meet members with shared interests</small></span><b aria-hidden="true">↗</b></a>
							<a href="#create-post"><span><strong>Share an update</strong><small>Start a new conversation</small></span><b aria-hidden="true">↗</b></a>
						</section>
					</aside>
				</div>
			</section>
		</main>
	)
}

export default Dashboard

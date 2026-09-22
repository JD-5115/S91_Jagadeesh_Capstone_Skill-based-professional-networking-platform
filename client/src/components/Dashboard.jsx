import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000/api'

const fetchPosts = async () => {
	const response = await fetch(`${API_URL}/posts`)
	const result = await response.json()
	if (!response.ok) throw new Error(result.message || 'Unable to load posts.')
	return result
}

function Dashboard({ username, token, onLogout }) {
	const [posts, setPosts] = useState([])
	const [editingPostId, setEditingPostId] = useState(null)
	const [editForm, setEditForm] = useState({ title: '', description: '' })
	const [newPost, setNewPost] = useState({ title: '', description: '', file: null })
	const [status, setStatus] = useState('Loading posts...')

	useEffect(() => {
		let isCurrent = true
		fetchPosts().then((result) => {
			if (!isCurrent) return
			setPosts(result)
			setStatus(result.length ? '' : 'No posts yet. Create one from the API to see it here.')
		}).catch((error) => {
			if (isCurrent) setStatus(error.message)
		})
		return () => { isCurrent = false }
	}, [])

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
				<section className="posts-section" aria-labelledby="posts-heading">
					<div className="posts-heading"><div><p className="card-kicker">YOUR CONVERSATIONS</p><h2 id="posts-heading">Posts you have shared</h2></div><strong>{posts.length}</strong></div>
					<form className="post-composer" onSubmit={createPost}>
						<div className="composer-heading"><p className="card-kicker">SHARE SOMETHING USEFUL</p><h3>Create a post</h3></div>
						<label>Title<input value={newPost.title} onChange={(event) => setNewPost({ ...newPost, title: event.target.value })} required /></label>
						<label>Description<textarea value={newPost.description} onChange={(event) => setNewPost({ ...newPost, description: event.target.value })} required /></label>
						<div className="composer-footer"><label className="file-picker">Attach a file<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" onChange={(event) => setNewPost({ ...newPost, file: event.target.files[0] || null })} /></label><span>{newPost.file?.name || 'Optional, up to 10 MB'}</span><button className="dashboard-action" type="submit">Share post</button></div>
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
								</form> : <><div><p className="card-kicker">{post.author?.username || 'SKILLLink MEMBER'}</p><h3>{post.title}</h3><p>{post.description}</p></div>{isOwner && <div className="post-actions"><button type="button" className="dashboard-link" onClick={() => startEditing(post)}>Edit</button><button type="button" className="dashboard-danger" onClick={() => deletePost(post._id)}>Delete</button></div>}</>}
								{post.attachment && <a className="post-attachment" href={`http://localhost:5000${post.attachment.url}`} target="_blank" rel="noreferrer">{post.attachment.originalName} <span>{Math.ceil(post.attachment.size / 1024)} KB</span></a>}</article>
						})}
					</div>
				</section>
			</section>
		</main>
	)
}

export default Dashboard

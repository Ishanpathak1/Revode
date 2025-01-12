import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from "../firebaseConfig";
import { useRole } from '../hooks/useRole';
import { ROLES } from '../utils/roles';
import { signOut } from "firebase/auth";
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc,
    updateDoc,
    doc, 
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import "./Blog.css";
import Navbar from "./Navbar";

const INITIAL_POST_STATE = {
    title: "",
    content: "",
    category: "Tutorial",
    tags: []
};

const Blog = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const { role, loading: roleLoading } = useRole(user);
    const userCanManagePosts = role === 'admin';
    
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [newPost, setNewPost] = useState(INITIAL_POST_STATE);
    const [editingPost, setEditingPost] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            if (user) {
                fetchPosts();
            } else {
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [role, userCanManagePosts, navigate]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const postsRef = collection(db, 'blog_posts');
            const q = query(postsRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            const postsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setPosts(postsList);
        } catch (error) {
            setError("Error fetching blog posts: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPost = async () => {
        if (!auth.currentUser) {
            setError("Please log in to create a post");
            return;
        }
    
        if (!userCanManagePosts) {
            setError("You don't have permission to add posts");
            return;
        }
    
        try {
            if (!newPost.title || !newPost.content) {
                setError("Please fill in all required fields");
                return;
            }
    
            setLoading(true);
            
            const tags = Array.isArray(newPost.tags) 
                ? newPost.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0)
                : typeof newPost.tags === 'string'
                    ? newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                    : [];
    
            const postData = {
                title: String(newPost.title).trim(),
                content: String(newPost.content).trim(),
                category: String(newPost.category || 'Tutorial'),
                tags: tags,
                author: {
                    id: String(auth.currentUser.uid),
                    name: String(auth.currentUser.displayName || auth.currentUser.email || 'Anonymous')
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                likes: 0,
                views: 0,
                status: 'published',
                isPublished: true
            };
            
            const docRef = await addDoc(collection(db, 'blog_posts'), postData);
            setNewPost(INITIAL_POST_STATE);
            await fetchPosts();
            setError(null);
    
        } catch (error) {
            setError(`Error adding blog post: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (e, postId) => {
        e.stopPropagation(); // Prevent post click event
        if (!userCanManagePosts) {
            setError("You don't have permission to delete posts");
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'blog_posts', postId));
            await fetchPosts();
            setError(null);
        } catch (error) {
            setError("Error deleting blog post: " + error.message);
        }
    };

    const handleUpdatePost = async (postId) => {
        if (!userCanManagePosts || !editingPost) {
            setError("You don't have permission to update posts");
            return;
        }

        try {
            setLoading(true);
            const postRef = doc(db, 'blog_posts', postId);
            
            const tags = Array.isArray(editingPost.tags)
                ? editingPost.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0)
                : editingPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            
            const updateData = {
                title: String(editingPost.title).trim(),
                content: String(editingPost.content).trim(),
                category: String(editingPost.category),
                tags: tags,
                updatedAt: serverTimestamp(),
                status: 'published',
                isPublished: true
            };
            
            await updateDoc(postRef, updateData);
            setEditingPost(null);
            await fetchPosts();
            setError(null);
        } catch (error) {
            setError("Error updating blog post: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            setError("Error logging out: " + error.message);
        }
    };

    const handleEditClick = (e, post) => {
        e.stopPropagation(); // Prevent post click event
        setEditingPost(post);
    };

    const handlePostClick = (postId) => {
        navigate(`/blog/${postId}`);
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (roleLoading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="blog-container">
            <Navbar user={user} onLogout={handleLogout} />
            
            {error && (
                <div className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                </div>
            )}

            <div className="blog-grid">
                {userCanManagePosts && (
                    <div className="blog-card">
                        <h2 className="card-title">
                            {editingPost ? "Edit Post" : "Create New Post"}
                        </h2>
                        <div className="form-container">
                            <input
                                type="text"
                                placeholder="Post Title"
                                value={editingPost ? editingPost.title : newPost.title}
                                onChange={(e) => editingPost 
                                    ? setEditingPost({...editingPost, title: e.target.value})
                                    : setNewPost({...newPost, title: e.target.value})
                                }
                                className="form-input"
                            />
                            <textarea
                                placeholder="Post Content"
                                value={editingPost ? editingPost.content : newPost.content}
                                onChange={(e) => editingPost
                                    ? setEditingPost({...editingPost, content: e.target.value})
                                    : setNewPost({...newPost, content: e.target.value})
                                }
                                className="form-input form-textarea"
                                rows="6"
                            />
                            <select
                                value={editingPost ? editingPost.category : newPost.category}
                                onChange={(e) => editingPost
                                    ? setEditingPost({...editingPost, category: e.target.value})
                                    : setNewPost({...newPost, category: e.target.value})
                                }
                                className="form-select"
                            >
                                <option value="Tutorial">Tutorial</option>
                                <option value="News">News</option>
                                <option value="Guide">Guide</option>
                                <option value="Interview Experience">Interview Experience</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Tags (comma-separated)"
                                value={editingPost 
                                    ? (Array.isArray(editingPost.tags) ? editingPost.tags.join(', ') : '')
                                    : (Array.isArray(newPost.tags) ? newPost.tags.join(', ') : '')
                                }
                                onChange={(e) => {
                                    const tags = e.target.value.split(',').map(tag => tag.trim());
                                    editingPost
                                        ? setEditingPost({...editingPost, tags})
                                        : setNewPost({...newPost, tags});
                                }}
                                className="form-input"
                            />
                            <button
                                onClick={editingPost 
                                    ? () => handleUpdatePost(editingPost.id)
                                    : handleAddPost
                                }
                                disabled={loading}
                                className="primary-btn"
                            >
                                {loading 
                                    ? "Processing..." 
                                    : editingPost 
                                        ? "Update Post"
                                        : "Create Post"
                                }
                            </button>
                            {editingPost && (
                                <button
                                    onClick={() => setEditingPost(null)}
                                    className="secondary-btn"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="blog-card">
                    <h2 className="card-title">Blog Posts</h2>
                    
                    <div className="blog-filters">
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    {loading ? (
                        <div className="loading">Loading posts...</div>
                    ) : (
                        <div className="blog-posts-list">
                            {filteredPosts.length > 0 ? (
                                filteredPosts.map((post) => (
                                    <div 
                                        key={post.id} 
                                        className="post-card"
                                        onClick={() => handlePostClick(post.id)}
                                    >
                                        <div className="post-header">
                                            <h3 className="post-title">{post.title}</h3>
                                            <span className="post-category">{post.category}</span>
                                        </div>
                                        
                                        <div className="post-meta">
                                            <span className="post-author">
                                                By {post.author?.name || 'Anonymous'}
                                            </span>
                                            <span className="post-date">
                                                {post.createdAt?.toDate?.()
                                                    ? post.createdAt.toDate().toLocaleDateString()
                                                    : new Date(post.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <p className="post-content">{post.content}</p>
                                        
                                        <div className="post-tags">
                                            {Array.isArray(post.tags) && post.tags.map((tag, index) => (
                                                <span key={index} className="tag">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>

                                        {userCanManagePosts && (
                                            <div className="post-actions">
                                                <button
                                                    onClick={(e) => handleEditClick(e, post)}
                                                    className="secondary-btn"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeletePost(e, post.id)}
                                                    className="danger-btn"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="no-posts">
                                    {searchQuery 
                                        ? "No posts found matching your search."
                                        : "No blog posts available yet."}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Blog;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from "../firebaseConfig";
import { useRole } from '../hooks/useRole';
import { signOut } from "firebase/auth";
import Navbar from './Navbar';
import DynamicMeta from './DynamicMeta';
import "./Blog.css";
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
    const [showEditor, setShowEditor] = useState(false);

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

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

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
        if (!auth.currentUser || !userCanManagePosts) {
            setError("Unauthorized action");
            return;
        }

        try {
            if (!newPost.title || !newPost.content) {
                setError("Please fill in all required fields");
                return;
            }

            setLoading(true);
            
            const postData = {
                title: newPost.title.trim(),
                content: newPost.content.trim(),
                category: newPost.category,
                tags: Array.isArray(newPost.tags) 
                    ? newPost.tags.filter(tag => tag.trim().length > 0)
                    : newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
                author: {
                    id: auth.currentUser.uid,
                    name: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous',
                    photo: auth.currentUser.photoURL
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                readTime: calculateReadTime(newPost.content),
                preview: generatePreview(newPost.content)
            };
            
            await addDoc(collection(db, 'blog_posts'), postData);
            setNewPost(INITIAL_POST_STATE);
            setShowEditor(false);
            await fetchPosts();
            
        } catch (error) {
            setError(`Error adding blog post: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePost = async (postId) => {
        if (!userCanManagePosts || !editingPost) {
            setError("Unauthorized action");
            return;
        }

        try {
            setLoading(true);
            const postRef = doc(db, 'blog_posts', postId);
            
            const updateData = {
                title: editingPost.title.trim(),
                content: editingPost.content.trim(),
                category: editingPost.category,
                tags: Array.isArray(editingPost.tags)
                    ? editingPost.tags.filter(tag => tag.trim().length > 0)
                    : editingPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
                updatedAt: serverTimestamp(),
                readTime: calculateReadTime(editingPost.content),
                preview: generatePreview(editingPost.content)
            };
            
            await updateDoc(postRef, updateData);
            setEditingPost(null);
            setShowEditor(false);
            await fetchPosts();
            
        } catch (error) {
            setError("Error updating blog post: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!userCanManagePosts) {
            setError("Unauthorized action");
            return;
        }
        
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await deleteDoc(doc(db, 'blog_posts', postId));
                await fetchPosts();
            } catch (error) {
                setError("Error deleting blog post: " + error.message);
            }
        }
    };

    const calculateReadTime = (content) => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    };

    const generatePreview = (content) => {
        return content.slice(0, 200) + (content.length > 200 ? '...' : '');
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    return (
        <> <DynamicMeta/>
        <div className="min-h-screen">
            
            {/* Header */}
            <header>
            <nav className="navbar">
    <div className="nav-container">
        <a href="/blog" className="nav-logo">Revode</a>
        <div className="nav-links">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <a href="/streakPage" className="nav-link">Profile</a>
            <a href="/blog" className="nav-link">Blog</a>
            <a href="/rank" className="nav-link">Rank</a>
            {userCanManagePosts && (
                <button
                    onClick={() => setShowEditor(true)}
                    className="write-story-btn"
                >
                    Write a story
                </button>
            )}
            <button 
                onClick={async () => {
                    try {
                        await signOut(auth);
                        navigate('/login');
                    } catch (error) {
                        setError("Error logging out: " + error.message);
                    }
                }} 
                className="sign-out-btn"
            >
                Sign out
            </button>
        </div>
    </div>
</nav>
            </header>

            {/* Main Content */}
            <main className="main-content">
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Editor */}
                {showEditor && (
                    <div className="editor-overlay">
                        <div className="editor-container">
                            <div className="editor-header">
                                <h2>{editingPost ? "Edit Story" : "Write a Story"}</h2>
                                <button
                                    onClick={() => {
                                        setShowEditor(false);
                                        setEditingPost(null);
                                        setNewPost(INITIAL_POST_STATE);
                                    }}
                                    className="btn btn-secondary"
                                >
                                    Close
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="Title"
                                value={editingPost ? editingPost.title : newPost.title}
                                onChange={(e) => editingPost 
                                    ? setEditingPost({...editingPost, title: e.target.value})
                                    : setNewPost({...newPost, title: e.target.value})
                                }
                                className="title-input"
                            />

                            <textarea
                                placeholder="Tell your story..."
                                value={editingPost ? editingPost.content : newPost.content}
                                onChange={(e) => editingPost
                                    ? setEditingPost({...editingPost, content: e.target.value})
                                    : setNewPost({...newPost, content: e.target.value})
                                }
                                className="content-input"
                            />

                            <div className="editor-footer">
                                <select
                                    value={editingPost ? editingPost.category : newPost.category}
                                    onChange={(e) => editingPost
                                        ? setEditingPost({...editingPost, category: e.target.value})
                                        : setNewPost({...newPost, category: e.target.value})
                                    }
                                    className="category-select"
                                >
                                    <option value="Tutorial">Tutorial</option>
                                    <option value="News">News</option>
                                    <option value="Guide">Guide</option>
                                    <option value="Interview Experience">Interview Experience</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Add tags (comma-separated)"
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
                                    className="tags-input"
                                />

                                <button
                                    onClick={editingPost 
                                        ? () => handleUpdatePost(editingPost.id)
                                        : handleAddPost
                                    }
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading ? "Publishing..." : "Publish"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search stories"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {/* Posts List */}
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="articles-container">
                        {posts
                            .filter(post => 
                                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                            )
                            .map((post) => (
                                <article 
                                    key={post.id}
                                    className="article"
                                    onClick={() => navigate(`/blog/${post.id}`)}
                                >
                                    <div className="article-meta">
                                        <div className="author-avatar">
                                            {post.author?.photo ? (
                                                <img 
                                                    src={post.author.photo} 
                                                    alt={post.author.name} 
                                                />
                                            ) : (
                                                post.author?.name?.[0] || 'A'
                                            )}
                                        </div>
                                        <span className="author-name">{post.author?.name}</span>
                                        <span className="meta-dot">·</span>
                                        <span className="article-date">{formatDate(post.createdAt)}</span>
                                        <span className="meta-dot">·</span>
                                        <span className="read-time">{post.readTime} min read</span>
                                    </div>

                                    <h2 className="article-title">
                                        {post.title}
                                    </h2>

                                    <p className="article-preview">
                                        {post.preview}
                                    </p>

                                    <div className="tags-container">
                                        {post.tags.map((tag, index) => (
                                            <span 
                                                key={index}
                                                className="tag"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSearchQuery(tag);
                                                }}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    {userCanManagePosts && (
                                        <div className="article-actions">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingPost(post);
                                                    setShowEditor(true);
                                                }}
                                                className="btn btn-secondary"
                                            >
                                                <span className="button-content">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                    Edit
                                                </span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeletePost(post.id);
                                                }}
                                                className="btn btn-danger"
                                            >
                                                <span className="button-content">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Delete
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </article>
                            ))}

                        {posts.length === 0 && !loading && (
                            <div className="no-posts">
                                <h3>No stories found</h3>
                                <p>
                                    {searchQuery 
                                        ? "No posts match your search criteria." 
                                        : userCanManagePosts 
                                            ? "Start writing your first story!" 
                                            : "Check back later for new stories."}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
        </>
    );
};

export default Blog;
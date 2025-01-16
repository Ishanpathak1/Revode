// BlogDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './BlogDetail.css';
import DynamicMeta from './DynamicMeta';

const BlogDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const postRef = doc(db, 'blog_posts', postId);
                const postDoc = await getDoc(postRef);
                
                if (postDoc.exists()) {
                    setPost({ id: postDoc.id, ...postDoc.data() });
                } else {
                    setError('Post not found');
                }
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
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

    if (loading) {
        return (
            <div className="blog-content-wrapper">
                <div className="blog-detail">
                    <div className="loading-state">
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="blog-content-wrapper">
                <div className="blog-detail">
                    <div className="navigation-area">
                        <button onClick={() => navigate('/blog')} className="back-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
                            Back to posts
                        </button>
                    </div>
                    <div className="error-state">
                        <h2>Error</h2>
                        <p>{error || 'Post not found'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
        <DynamicMeta/>
        <nav className="navbar">
                    <div className="nav-container">
                        <a href="/blog" className="nav-logo">Revode</a>
                        <div className="nav-links">
                            <a href="/dashboard" className="nav-link">Dashboard</a>
                            <a href="/profile" className="nav-link">Profile</a>
                            <a href="/blog" className="nav-link">Blog</a>
                            <a href="/rank" className="nav-link">Rank</a>
                            <button onClick={handleSignOut} className="sign-out-btn">Sign out</button>
                        </div>
                    </div>
                </nav>
        <div className="blog-content-wrapper">
            <article className="blog-detail">
                <div className="navigation-area">
                    <button onClick={() => navigate('/blog')} className="back-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                        </svg>
                        Back to posts
                    </button>
                </div>

                <div className="article-header">
                    {post.category && (
                        <div className="category-tag">{post.category}</div>
                    )}

                    <h1 className="article-title">{post.title}</h1>

                    <div className="author-meta">
                        <div className="author-info">
                            <div className="author-avatar">
                                {post.author?.photo ? (
                                    <img 
                                        src={post.author.photo} 
                                        alt={post.author.name}
                                    />
                                ) : (
                                    <span>{post.author?.name?.[0] || 'A'}</span>
                                )}
                            </div>
                            <div className="meta-details">
                                <div className="author-name">{post.author?.name}</div>
                                <div className="post-meta">
                                    <span className="post-date">{formatDate(post.createdAt)}</span>
                                    <span className="meta-dot">·</span>
                                    <span className="read-time">{post.readTime} min read</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="article-content">
                    {post.content.split('\n').map((paragraph, index) => (
                        paragraph.trim() && (
                            <p key={index}>{paragraph}</p>
                        )
                    ))}
                </div>

                {post.tags && post.tags.length > 0 && (
                    <div className="article-tags">
                        {post.tags.map((tag, index) => (
                            <span key={index} className="tag">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="author-bio-section">
                    <div className="author-profile">
                        <div className="author-avatar large">
                            {post.author?.photo ? (
                                <img 
                                    src={post.author.photo} 
                                    alt={post.author.name}
                                />
                            ) : (
                                <span>{post.author?.name?.[0] || 'A'}</span>
                            )}
                        </div>
                        <div className="author-details">
                            <h3>Written by {post.author?.name}</h3>
                            <p>{post.author?.bio || `Author of this blog post on ${formatDate(post.createdAt)}`}</p>
                        </div>
                    </div>
                </div>
            </article>
        </div>
        </>
    );
};

export default BlogDetail;
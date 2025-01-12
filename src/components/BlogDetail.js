// BlogDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Navbar from './Navbar';

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

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!post) return <div className="not-found">Post not found</div>;

    return (
        <div className="blog-container">
            <Navbar />
            <div className="blog-detail">
                <button onClick={() => navigate('/blog')} className="back-button">
                    ← Back to Posts
                </button>
                <div className="post-header">
                    <h1 className="post-title">{post.title}</h1>
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

                <div className="post-content">
                    {post.content}
                </div>
                
                <div className="post-tags">
                    {Array.isArray(post.tags) && post.tags.map((tag, index) => (
                        <span key={index} className="tag">#{tag}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogDetail;
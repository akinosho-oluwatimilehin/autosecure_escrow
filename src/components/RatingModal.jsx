import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { ratingService } from '../services/apiServices';

export default function RatingModal({ targetUser, escrowId, onClose, onRatingSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUser || !targetUser.id) return;
    setSubmitting(true);
    setError('');

    try {
      await ratingService.submitRating({
        reviewee: targetUser.id,
        escrow: escrowId || null,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      if (onRatingSubmitted) onRatingSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="panel" style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <h2 className="panel-title" style={{ marginTop: 0 }}>
          Rate Performance: {targetUser?.company_name || targetUser?.username || 'Partner'}
        </h2>
        <p className="meta" style={{ marginTop: '-8px', marginBottom: '16px' }}>
          Your honest rating shapes the trust score of automotive merchants and service providers.
        </p>

        {error && <div style={{ color: '#ef4444', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field" style={{ textAlign: 'center', margin: '8px 0 16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>HOW WOULD YOU RATE YOUR EXPERIENCE?</label>
            <div className="star-rating-row" style={{ justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${(hoverRating || rating) >= star ? 'active' : ''}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    size={28}
                    fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'}
                    color={(hoverRating || rating) >= star ? '#f59e0b' : '#94a3b8'}
                  />
                </button>
              ))}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, marginTop: '6px', display: 'inline-block' }}>
              {rating === 5 ? '5.0 - Exceptional & Verified' :
               rating === 4 ? '4.0 - Very Good' :
               rating === 3 ? '3.0 - Satisfactory' :
               rating === 2 ? '2.0 - Poor' : '1.0 - Unacceptable'}
            </span>
          </div>

          <div className="field">
            <label htmlFor="review_title">HEADLINE (OPTIONAL)</label>
            <input
              id="review_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Prompt delivery, pristine vehicle condition"
            />
          </div>

          <div className="field">
            <label htmlFor="review_comment">DETAILED REVIEW</label>
            <textarea
              id="review_comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about punctuality, transparency, and vehicle fidelity..."
            />
          </div>

          <div className="actions" style={{ marginTop: '8px' }}>
            <button className="button primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
            <button className="button secondary" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

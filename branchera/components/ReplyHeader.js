'use client';

import Image from 'next/image';
import SearchHighlight from './SearchHighlight';
import PointsStatusIndicator from './PointsStatusIndicator';

export default function ReplyHeader({ 
  reply, 
  searchQuery = '', 
  onToggle = null, 
  hasChildren = false, 
  isExpanded = false, 
  canReply = false, 
  onReplyTo = null, 
  onEdit = null, 
  onDelete = null, 
  user = null 
}) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="flex items-center gap-3 mb-2">
      {reply.authorPhoto ? (
        <Image
          src={reply.authorPhoto}
          alt={reply.authorName}
          width={20}
          height={20}
          className="w-5 h-5 rounded-full object-cover"
        />
      ) : (
        <div className="w-5 h-5 rounded-full border border-black/40 flex items-center justify-center">
          <span className="text-[10px] text-gray-900 font-medium">
            {reply.authorName?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
      )}
      
      <div className="flex-1">
        <div className="text-xs text-gray-700 flex items-center gap-2 flex-wrap">
          <SearchHighlight text={reply.authorName} searchQuery={searchQuery} />
          <span>·</span>
          <span>{formatDate(reply.createdAt)}</span>
          
          {reply.isEdited && reply.editedAt && (
            <>
              <span>·</span>
              <span className="text-gray-500 italic">
                edited {formatDate(reply.editedAt)}
              </span>
            </>
          )}
          
          {/* Visual indicator for points earned */}
          {reply.pointsEarnedByUser && (
            <PointsStatusIndicator
              pointsEarned={reply.pointsEarned || 1}
              qualityScore={reply.qualityScore}
              isCollected={true}
              size="small"
              variant="inline"
            />
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {hasChildren && (
          <button
            onClick={onToggle}
            className="p-1 text-gray-800 hover:text-black"
            title={`${isExpanded ? 'Hide' : 'Show'} ${reply.children?.length || 0} replies`}
          >
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-xs ml-1">{reply.children?.length || 0}</span>
          </button>
        )}
        
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {reply.views || 0}
        </div>
        
        {canReply && (
          <button
            onClick={onReplyTo}
            className="p-1 text-gray-800 hover:text-black"
            title="Reply to this"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        )}
        
        {user && reply.authorId === user.uid && (
          <>
            <button
              onClick={onEdit}
              className="p-1 text-gray-800 hover:text-black"
              title="Edit reply"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-800 hover:text-black"
              title="Delete reply"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
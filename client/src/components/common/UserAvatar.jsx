import React, { useState } from 'react';
import Avatar from 'boring-avatars';

export function UserAvatar({ user, size = 32, style = {} }) {
  const [imgFailed, setImgFailed] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const name = user?.email || user?.id || 'Together User';

  const avatarColors = ['#8E5745', '#758956', '#2F3D20', '#1A2113', '#C4CBAF'];

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl}
        alt="User Avatar"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          ...style
        }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, ...style }}>
      <Avatar
        size={size}
        name={name}
        variant="beam"
        colors={avatarColors}
      />
    </div>
  );
}

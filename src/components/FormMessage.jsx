import React from 'react';

export default function FormMessage({ error, success }) {
  if (!error && !success) return null;

  return (
    <div className={`notice ${error ? 'error' : 'success'}`}>
      {error || success}
    </div>
  );
}

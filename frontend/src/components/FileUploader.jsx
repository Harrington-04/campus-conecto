import React, { useRef } from 'react';

/**
 * Simple, presentational file uploader.
 * Delegates upload logic to parent via onFileSelected.
 */
const FileUploader = ({ onFileSelected, accept = 'image/*', disabled = false, children }) => {
  const inputRef = useRef(null);

  const handlePick = () => !disabled && inputRef.current && inputRef.current.click();
  const handleChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file && onFileSelected) onFileSelected(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div onClick={handlePick} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
};

export default FileUploader;



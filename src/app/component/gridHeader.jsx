import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import '../common.css'
const GridHeader = ({ children, ...props }) => {
  const [content, setContent] = useState(children);

  const handleInput = (event) => {
    setContent(event.target.innerText);
  };

  return (
    <div
      onInput={handleInput}
      style={{
        color: '#13213c', // Custom blue color
        fontFamily: 'Arial, sans-serif', // Custom font family
        fontWeight: 'bold', // Custom font weight
        fontSize: '1.25rem', // Adjust font size as needed
        outline: 'none', // Remove default outline when focused
        ...props.style, // Allow additional styles to be passed
      }}
      {...props}
    >
      {content}
    </div>
  );
};

export default GridHeader;

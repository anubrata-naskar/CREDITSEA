// App.js
import React from 'react';
import './App.css';
import FileUpload from './FileUpload';   // Default import
import DisplayData from './DisplayData'; // Default import

function App() {
  return (
    <div className="App">
      <h1>XML File Upload</h1>
      <FileUpload />
      <DisplayData />
    </div>
  );
}

export default App;

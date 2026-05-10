import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AdProvider } from './contexts/AdContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdProvider>
        <App />
      </AdProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

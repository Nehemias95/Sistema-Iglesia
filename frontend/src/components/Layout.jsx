import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light')
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  return (
    <div className="wrapper">
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="content-wrapper">
        {children}
      </div>
    </div>
  )
}

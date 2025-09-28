import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("⚡ main.tsx loaded")
console.log("⚡ ENV VARS:", import.meta.env)

createRoot(document.getElementById('root')!).render(<App />)


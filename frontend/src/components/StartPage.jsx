import React from 'react'
import { useNavigate } from 'react-router-dom'

const StartPage = () => {
  const navigate = useNavigate()

  return (
    <div className="start-page">
      <div className="container">
        <div className="header">
          <h1 className="title">
            <span className="kl">KL</span>
            <span className="reg">RegWriter</span>
            <span className="pro">Pro V3</span>
          </h1>
          <p className="subtitle">Master regulatory newsflash writing</p>
        </div>

        <div className="mode-selection">
          <button 
            className="mode-btn trainer-btn"
            onClick={() => navigate('/trainer')}
          >
            Trainer Mode
          </button>
          
          <button 
            className="mode-btn student-btn"
            onClick={() => navigate('/student')}
          >
            Student Mode
          </button>
        </div>
      </div>
    </div>
  )
}

export default StartPage

// components/MarketCard.js
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Market {
    id: string;
    title: string;
    iconUrl: string;
    url: string;
    type: 'multi-option' | 'binary';
    volume: string;  // e.g. "15m", "507k"
    
    // For multi-option markets (like NCAA Tournament)
    options?: Array<{
      id: string;
      name: string;
      probability: string;  // e.g. "27%"
      url: string;
    }>;
    
    // For binary markets (like yes/no questions)
    probability?: number;  // e.g. 18 (for 18%)
    yesPrice?: string;
    noPrice?: string;
  }

// Market card with multiple options (like NCAA Tournament Winner)
export const MarketCardWithOptions = ({ market }: {market: Market}) => {
  return (
    <div className="market-card">
      <div className="market-header">
        <div className="market-icon-container">
          <Image
            src={market.iconUrl}
            alt={`${market.title} card icon`}
            layout="fill"
            objectFit="cover"
            className="market-icon"
          />
        </div>
        
        <div className="market-title-container">
          <Link href={market.url}>
            <a className="market-title-link">
              <p className="market-title">{market.title}</p>
            </a>
          </Link>
        </div>
      </div>
      
      <div className="market-content">
        <div className="market-options">
          {market.options && market.options.map((option) => (
            <div key={option.id} className="market-option">
              <div className="option-name">
                <Link href={option.url}>
                  <a className="option-link">{option.name}</a>
                </Link>
              </div>
              
              <div className="option-actions">
                <p className="option-probability">{option.probability}</p>
                <button className="option-button yes-button">Yes</button>
                <button className="option-button no-button">No</button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="market-footer">
          <div className="market-stats">
            <div className="market-volume">
              <span className="volume-text">${market.volume} Vol.</span>
            </div>
          </div>
          
          <div className="market-actions">
            <div className="action-buttons">
              <div className="gift-button">
                <svg className="gift-icon" viewBox="0 0 24 24" height="16" width="16">
                  <path d="M20,7h-1.209C18.922,6.589,19,6.096,19,5.5C19,3.57,17.43,2,15.5,2c-1.622,0-2.705,1.482-3.404,3.085 C11.407,3.57,10.269,2,8.5,2C6.57,2,5,3.57,5,5.5C5,6.096,5.079,6.589,5.209,7H4C2.897,7,2,7.897,2,9v2c0,1.103,0.897,2,2,2v7 c0,1.103,0.897,2,2,2h5h2h5c1.103,0,2-0.897,2-2v-7c1.103,0,2-0.897,2-2V9C22,7.897,21.103,7,20,7z M15.5,4 C16.327,4,17,4.673,17,5.5C17,7,16.374,7,16,7h-2.478C14.033,5.424,14.775,4,15.5,4z M7,5.5C7,4.673,7.673,4,8.5,4 c0.888,0,1.714,1.525,2.198,3H8C7.626,7,7,7,7,5.5z M4,9h7v2H4V9z M6,20v-7h5v7H6z M18,20h-5v-7h5V20z M13,11V9.085 C13.005,9.057,13.011,9.028,13.017,9H20l0.001,2H13z"></path>
                </svg>
              </div>
              
              <button className="bookmark-button">
                <svg className="bookmark-icon" viewBox="0 0 384 512" height="1em" width="1em">
                  <path d="M336 0H48C21.49 0 0 21.49 0 48v464l192-112 192 112V48c0-26.51-21.49-48-48-48zm0 428.43l-144-84-144 84V54a6 6 0 0 1 6-6h276c3.314 0 6 2.683 6 5.996V428.43z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Market card with Yes/No buttons and probability chart (like "Will Trump end Department of Education")
export const MarketCardWithProbability = ({ market }: {market: Market}) => {
  return (
    <div className="market-card">
      <div className="market-header">
        <div className="market-icon-container">
          <Image
            src={market.iconUrl}
            alt={`${market.title} card icon`}
            layout="fill"
            objectFit="cover"
            className="market-icon"
          />
        </div>
        
        <div className="market-title-container">
          <Link href={market.url}>
            <a className="market-title-link">
              <p className="market-title">{market.title}</p>
            </a>
          </Link>
          
          <div className="probability-indicator">
            <div className="probability-chart">
              <svg viewBox="-29 -29 58 29" className="probability-svg" style={{ width: '58px', maxWidth: '58px', overflow: 'visible' }}>
                <path 
                  d="M -29.001 3.5514757175273244e-15 A 29 29 0 1 1 29 -7.102951435054649e-15" 
                  fill="none" 
                  stroke="#858D92" 
                  strokeWidth="4" 
                  strokeLinecap="butt"
                />
                <path 
                  d={`M -29.001 3.5514757175273244e-15 A 29 29 0 0 1 -24.593394788536354 -15.367658662762938`} 
                  fill="none" 
                  stroke="#E64800" 
                  strokeOpacity="0.8425" 
                  strokeWidth="4" 
                  strokeLinecap="butt"
                />
              </svg>
            </div>
            
            <div className="probability-text">
              <p className="probability-percentage">{market.probability}%</p>
              <p className="probability-label">chance</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="market-content">
        <div className="market-buy-buttons">
          <button className="buy-button yes-button">
            <div className="button-content">
              <span>Buy Yes</span>
              <div className="arrow-container">
                <span className="arrow up-arrow">
                  <svg viewBox="0 0 24 24" height="18px" width="18px">
                    <path d="M16.293 9.293L12 13.586 7.707 9.293 6.293 10.707 12 16.414 17.707 10.707z" transform="rotate(180, 12, 12)"></path>
                  </svg>
                </span>
              </div>
            </div>
          </button>
          
          <button className="buy-button no-button">
            <div className="button-content">
              <span>Buy No</span>
              <div className="arrow-container">
                <span className="arrow down-arrow">
                  <svg viewBox="0 0 24 24" height="18px" width="18px">
                    <path d="M16.293 9.293L12 13.586 7.707 9.293 6.293 10.707 12 16.414 17.707 10.707z"></path>
                  </svg>
                </span>
              </div>
            </div>
          </button>
        </div>
        
        <div className="market-footer">
          <div className="market-stats">
            <div className="market-volume">
              <span className="volume-text">${market.volume} Vol.</span>
            </div>
          </div>
          
          <div className="market-actions">
            <div className="action-buttons">
              <div className="gift-button">
                <svg className="gift-icon" viewBox="0 0 24 24" height="16" width="16">
                  <path d="M20,7h-1.209C18.922,6.589,19,6.096,19,5.5C19,3.57,17.43,2,15.5,2c-1.622,0-2.705,1.482-3.404,3.085 C11.407,3.57,10.269,2,8.5,2C6.57,2,5,3.57,5,5.5C5,6.096,5.079,6.589,5.209,7H4C2.897,7,2,7.897,2,9v2c0,1.103,0.897,2,2,2v7 c0,1.103,0.897,2,2,2h5h2h5c1.103,0,2-0.897,2-2v-7c1.103,0,2-0.897,2-2V9C22,7.897,21.103,7,20,7z M15.5,4 C16.327,4,17,4.673,17,5.5C17,7,16.374,7,16,7h-2.478C14.033,5.424,14.775,4,15.5,4z M7,5.5C7,4.673,7.673,4,8.5,4 c0.888,0,1.714,1.525,2.198,3H8C7.626,7,7,7,7,5.5z M4,9h7v2H4V9z M6,20v-7h5v7H6z M18,20h-5v-7h5V20z M13,11V9.085 C13.005,9.057,13.011,9.028,13.017,9H20l0.001,2H13z"></path>
                </svg>
              </div>
              
              <button className="bookmark-button">
                <svg className="bookmark-icon" viewBox="0 0 384 512" height="1em" width="1em">
                  <path d="M336 0H48C21.49 0 0 21.49 0 48v464l192-112 192 112V48c0-26.51-21.49-48-48-48zm0 428.43l-144-84-144 84V54a6 6 0 0 1 6-6h276c3.314 0 6 2.683 6 5.996V428.43z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Example usage
export const MarketCardExamples = () => {
  const marketWithOptions: Market = {
    id: 'ncaa-tournament',
    title: '2025 NCAA Tournament Winner',
    iconUrl: '/images/ncaa-tournament.png',
    url: '/event/2025-ncaa-tournament-winner',
    volume: '15m',
    type: "multi-option",
    options: [
      {
        id: 'duke',
        name: 'Duke',
        probability: '27%',
        url: '/event/2025-ncaa-tournament-winner/will-duke-win-the-2025-ncaa-tournament'
      },
      {
        id: 'florida',
        name: 'Florida',
        probability: '20%',
        url: '/event/2025-ncaa-tournament-winner/will-florida-win-the-2025-ncaa-tournament'
      },
      {
        id: 'auburn',
        name: 'Auburn',
        probability: '15%',
        url: '/event/2025-ncaa-tournament-winner/will-auburn-win-the-2025-ncaa-tournament'
      }
    ]
  };

  const marketWithProbability: Market = {
    id: 'trump-education',
    title: 'Will Trump end Department of Education in 2025?',
    iconUrl: '/images/dept-education.png',
    url: '/event/will-trump-end-department-of-education-in-2025',
    probability: 18,
    volume: '507k',
    type: "binary"
  };

  return (
    <div className="market-examples">
      <h2>Example Market Cards</h2>
      <div className="market-grid">
        <MarketCardWithOptions market={marketWithOptions} />
        <MarketCardWithProbability market={marketWithProbability} />
      </div>
    </div>
  );
};

export default MarketCardWithOptions;
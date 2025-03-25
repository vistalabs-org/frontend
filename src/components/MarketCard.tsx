// components/MarketCard.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type MarketCardProps = {
  title: string;
  url: string;
  iconSrc?: string;
  probability?: number;
  optionName?: string;
  optionProbability?: string;
  optionUrl?: string;
  volume?: string;
};

const MarketCard: React.FC<MarketCardProps> = ({
  title,
  url,
  iconSrc,
  probability = 50,
  optionName = "Option Name",
  optionProbability = "25%",
  optionUrl = "/option-link",
  volume = "$15m Vol."
}) => {
  return (
    <div className="market-card">
      <div className="market-header">
        <div className="market-icon-container">
          {iconSrc ? (
            <Image
              src={iconSrc}
              alt="Market icon"
              layout="fill"
              className="market-icon"
            />
          ) : (
            <div className="placeholder-icon" style={{ backgroundColor: 'var(--border-light)', width: '100%', height: '100%' }}></div>
          )}
        </div>
        <div className="market-title-container">
          <Link href={url} className="market-title-link">
            <p className="market-title">{title}</p>
          </Link>
          
          <div className="probability-indicator">
            <div className="probability-chart">
              <svg viewBox="-29 -29 58 29" className="probability-svg" style={{ width: '58px', height: '29px' }}>
                <path 
                  d="M-24.5 -24.5 A24.5 24.5 0 1 1 24.5 -24.5"
                  stroke="var(--border-color)"
                  strokeWidth="2"
                  fill="none"
                />
                <path 
                  d={`M-24.5 -24.5 A24.5 24.5 0 ${probability <= 50 ? '0' : '1'} 1 ${getArcEndCoordinates(probability)}`}
                  stroke={probability >= 50 ? 'var(--green)' : 'var(--red)'}
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
            <div className="probability-text">
              <p className="probability-percentage">{probability}%</p>
              <p className="probability-label">chance</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="market-content">
        <div className="market-options">
          <div className="market-option">
            <div className="option-name">
              <Link href={optionUrl} className="option-link">
                {optionName}
              </Link>
            </div>
            <div className="option-actions">
              <p className="option-probability">{optionProbability}</p>
              <button className="option-button yes-button">Yes</button>
              <button className="option-button no-button">No</button>
            </div>
          </div>
        </div>
        
        <div className="market-buy-buttons">
          <button className="buy-button yes-button">
            <span>Buy Yes</span>
            <div className="arrow-container">
              <span className="arrow">↑</span>
            </div>
          </button>
          <button className="buy-button no-button">
            <span>Buy No</span>
            <div className="arrow-container">
              <span className="arrow">↓</span>
            </div>
          </button>
        </div>
        
        <div className="market-footer">
          <div className="market-stats">
            <div className="market-volume">
              <span className="volume-text">{volume}</span>
            </div>
          </div>
          <div className="market-actions">
            <div className="action-buttons">
              <div className="gift-button">
                <svg className="gift-icon" viewBox="0 0 24 24" height="16" width="16" fill="var(--text-tertiary)">
                  <path d="M19 13v6H5v-6h14zm1-1H4v8h16v-8z"></path>
                  <path d="M13 13v6h-2v-6h2zm-1-9c.9 0 1.64.27 2.12.75.48.49.63 1.1.63 1.5 0 .4-.15 1.02-.63 1.5-.48.49-1.22.75-2.12.75s-1.64-.27-2.12-.75C9.4 6.27 9.25 5.65 9.25 5.25c0-.4.15-1.02.63-1.5.48-.49 1.22-.75 2.12-.75zM3 8h18v2.08H3V8zm6 0v1h6V8H9zm10-1a1 1 0 100-2 1 1 0 000 2zM5 7a1 1 0 100-2 1 1 0 000 2z"></path>
                </svg>
              </div>
              <button className="bookmark-button">
                <svg className="bookmark-icon" viewBox="0 0 384 512" height="1em" width="1em" fill="var(--text-tertiary)">
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

// Helper function to calculate the end coordinates for the arc
function getArcEndCoordinates(probability: number): string {
  const percentage = probability / 100;
  const angle = percentage * Math.PI;
  const x = -24.5 * Math.cos(angle);
  const y = -24.5 * Math.sin(angle);
  return `${x} ${y}`;
}

export default MarketCard;
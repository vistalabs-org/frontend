// components/MarketCard.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

type MarketCardProps = {
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
            <div className="placeholder-icon"></div>
          )}
        </div>
        <div className="market-title-container">
          <Link href={url} className="market-title-link">
            <p className="market-title">{title}</p>
          </Link>
          
          <div className="probability-indicator">
            <div className="probability-chart">
              <svg viewBox="-29 -29 58 29" className="probability-svg">
                {/* SVG path elements for the probability chart */}
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
              <span className="arrow up-arrow">↑</span>
            </div>
          </button>
          <button className="buy-button no-button">
            <span>Buy No</span>
            <div className="arrow-container">
              <span className="arrow down-arrow">↓</span>
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
                <svg className="gift-icon" viewBox="0 0 24 24" height="16" width="16">
                  {/* Gift icon path */}
                </svg>
              </div>
              <button className="bookmark-button">
                <svg className="bookmark-icon" viewBox="0 0 384 512" height="1em" width="1em">
                  {/* Bookmark icon path */}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;
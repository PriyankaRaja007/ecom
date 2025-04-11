import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const handleColorClick = (color) => {
    // Navigate to the other project with product and color information
    window.open(`http://localhost:5173/?productId=${product.id}&color=${encodeURIComponent(color)}`, '_blank');
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-link">
        <div className="product-image-container">
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="product-image"
          />
          <div className="product-discount">{product.discount}</div>
        </div>
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <div className="product-price-container">
            <span className="product-price">₹{product.price}</span>
            <span className="product-mrp">₹{Math.round(product.price / (1 - parseFloat(product.discount) / 100))}</span>
          </div>
          <div className="product-rating">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`star ${i < product.rating ? 'filled' : ''}`}>
                ★
              </span>
            ))}
          </div>
        </div>
      </Link>
      <div className="product-colors">
        {product.colors && product.colors.map((color, index) => (
          <div 
            key={index} 
            className="color-circle"
            style={{ backgroundColor: color }}
            title={color}
            onClick={() => handleColorClick(color)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductCard;

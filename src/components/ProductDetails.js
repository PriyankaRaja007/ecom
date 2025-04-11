import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../firebaseConfig"; // Import Firebase
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import womenProducts from "../data/womenProducts";
import menProducts from "../data/menProducts";
import kidsProducts from "../data/kidsProducts";
import "../components/ProductDetails.css"; // Ensure correct import

const ProductDetails = ({ updateAverageRating }) => {
  const { id } = useParams(); // Get product ID from URL
  const productId = Number(id); // Convert string ID to number

  // Combine all products into a single list
  const allProducts = [...womenProducts, ...menProducts, ...kidsProducts];

  // Find the product by ID
  const product = allProducts.find((p) => p.id === productId);

  // Handle missing product
  if (!product) {
    return <h2 className="error-message">⚠️ Product not found! Please check the URL.</h2>;
  }

  // State for images, reviews, and ratings
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [reviews, setReviews] = useState([]); // Store reviews
  const [newReview, setNewReview] = useState(""); // User input review
  const [selectedRating, setSelectedRating] = useState(0); // User-selected rating
  const [averageRating, setAverageRating] = useState(product.rating); // Default product rating
  const [user, setUser] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  useEffect(() => {
    // Fetch existing reviews from Firebase
    const fetchReviews = async () => {
      const reviewsRef = doc(db, "reviews", String(productId));
      const reviewsSnap = await getDoc(reviewsRef);
      if (reviewsSnap.exists()) {
        const data = reviewsSnap.data();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || product.rating);
      }
    };

    fetchReviews();

    // Track user login state
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [productId, product.rating]);

  // Function to handle review submission
  const handleReviewSubmit = async () => {
    if (!user) {
      alert("Please log in to submit a review.");
      return;
    }

    if (newReview.trim() === "" || selectedRating === 0) {
      alert("Please enter a review and select a rating before submitting.");
      return;
    }

    const newReviewData = {
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      review: newReview,
      rating: selectedRating,
      timestamp: new Date(),
    };

    try {
      const reviewsRef = doc(db, "reviews", String(productId));
      const reviewsSnap = await getDoc(reviewsRef);
      let updatedReviews = [];

      if (reviewsSnap.exists()) {
        updatedReviews = [...reviewsSnap.data().reviews, newReviewData];
        await updateDoc(reviewsRef, {
          reviews: arrayUnion(newReviewData),
        });
      } else {
        updatedReviews = [newReviewData];
        await setDoc(reviewsRef, {
          reviews: updatedReviews,
        });
      }

      // Calculate new average rating
      const newAverageRating = (
        updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length
      ).toFixed(1);

      // Update Firestore with the new average rating
      await updateDoc(reviewsRef, { averageRating: newAverageRating });

      // Update state
      setReviews(updatedReviews);
      setAverageRating(newAverageRating);
      setNewReview(""); // Clear input field
      setSelectedRating(0); // Reset selected rating

      if (typeof updateAverageRating === "function") {
        updateAverageRating(product.id, newAverageRating);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPosition({ x, y });
  };

  const handleColorClick = () => {
    // Navigate to the other project with product information
    window.open(`http://localhost:5173/?productId=${product.id}`, '_blank');
  };

  return (
    <div className="product-details">
      {/* Images Section */}
      <div className="images-section">
        <div 
          className="main-image-container"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
          ref={imageRef}
        >
          <img 
            src={selectedImage} 
            alt={product.name} 
            className="main-image"
          />
          {isZoomed && (
            <div 
              className="zoom-lens"
              style={{
                left: `${zoomPosition.x}%`,
                top: `${zoomPosition.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          )}
        </div>
        {isZoomed && (
          <div className="zoomed-image-container">
            <img 
              src={selectedImage} 
              alt="zoomed" 
              className="zoomed-image"
              style={{
                transform: `translate(-${zoomPosition.x}%, -${zoomPosition.y}%)`
              }}
            />
          </div>
        )}
        <div className="thumbnail-images">
          {product.images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt="product"
              className={`thumbnail ${selectedImage === img ? 'active' : ''}`}
              onClick={() => setSelectedImage(img)}
            />
          ))}
        </div>
      </div>

      {/* Product Info Section */}
      <div className="info-section">
        <h1 className="product-title">{product.name}</h1>
        <div className="price-section">
          <span className="current-price">₹{product.price}</span>
          <span className="discount">{product.discount}</span>
        </div>
        <div className="brand-rating">
          <span className="brand">Brand: {product.brand}</span>
          <span className="rating">Rating: {averageRating} ⭐</span>
        </div>
        <p className="description">{product.description}</p>

        {/* Choose Color Button */}
        <button className="choose-color-btn" onClick={handleColorClick}>
          Choose Color
        </button>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h3>Customer Reviews</h3>
          <div className="reviews">
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet</p>
            ) : (
              reviews.map((review, index) => (
                <div key={index} className="review-item">
                  <div className="review-header">
                    <span className="reviewer">{review.userName}</span>
                    <span className="review-rating">{"⭐".repeat(review.rating)}</span>
                  </div>
                  <p className="review-text">{review.review}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Star Rating Selection */}
        <div className="review-form">
          <h3>Rate this product:</h3>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= selectedRating ? "selected" : ""}`}
                onClick={() => setSelectedRating(star)}
              >
                ★
              </span>
            ))}
          </div>

          {/* Review Input */}
          {user ? (
            <>
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Write your review..."
                className="review-textarea"
              ></textarea>
              <button onClick={handleReviewSubmit} className="submit-review-btn">
                Submit Review
              </button>
            </>
          ) : (
            <p className="login-prompt">
              Please <a href="/login">log in</a> to submit a review.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

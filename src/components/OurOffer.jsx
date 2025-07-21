import React, { useEffect, useState } from "react";
import axios from "axios";

const OurOffer = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch games/offers from backend
    axios.get("http://localhost:5000/api/games")
      .then(res => setOffers(res.data))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="our-offer-page">
      <h2>Our Offers</h2>
      {loading ? (
        <p>Loading...</p>
      ) : offers.length === 0 ? (
        <p>No offers found.</p>
      ) : (
        <div className="offer-list">
          {offers.map(offer => (
            <div key={offer.id} className="offer-card">
              <img src={offer.image} alt={offer.title} style={{ width: 120, height: 80, objectFit: "cover" }} />
              <h3>{offer.title}</h3>
              <p>Genre: {offer.genre}</p>
              <p>Rating: {offer.rating}</p>
              <a href={`/go/${offer.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Go to Offer
              </a>
              <br />
              <a href={offer.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Original Link
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OurOffer;

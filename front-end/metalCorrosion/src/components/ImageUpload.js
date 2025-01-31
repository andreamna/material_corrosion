import React, { useState } from "react";
import axios from "axios";

const ImageUpload = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    setSelectedImage(e.target.files[0]); 
    setPrediction(null); 
    setError(null); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      setError("Please select an image before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const response = await axios.post("http://127.0.0.1:5000/predict", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setPrediction(response.data["predicted corrosion level"]);
    } catch (err) {
      setError("An error occurred while making the prediction. Try again.");
      console.error(err);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Corrosion Classification</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mb-4 block"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Upload and Classify
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {prediction && (
        <p className="mt-4 text-green-500">
          Predicted Corrosion Level: {prediction}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;

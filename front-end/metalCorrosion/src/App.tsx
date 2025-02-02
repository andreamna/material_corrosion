import { useState } from 'react';
import './App.css';
import { ClipLoader } from 'react-spinners';
import { useDropzone } from 'react-dropzone';

const corrosionDescriptions: Record<string, string> = {
  '5': 'Severe corrosion with extensive rust formation and material degradation. Large, heavily corroded areas with deep rust penetration. Scribe marks are almost fully covered. Immediate intervention required to prevent structural failure.',
  '6': 'Significant corrosion with widespread rust and partial obscuring of scribe marks. Protective measures recommended to slow further degradation.',
  '7': 'Moderate corrosion with noticeable rusting but no severe material loss. Rust around scribe marks is visible but not fully covering. Some rust streaks or discoloration visible. Maintenance is necessary to prevent further deterioration.',
  '8': 'Light corrosion with minimal surface rust and little to no penetration. Scribe marks are mostly visible with slight corrosion around edges. The overall surface is relatively intact. Regular inspection is advised to monitor potential corrosion spread.',
  '9': 'Minimal corrosion with only faint rust spots visible. Surface remains in good condition with almost no degradation or corrosion spreading. Preventative coatings or treatments can ensure long-term protection.',
};

function CorrosionRatingGuide({ rating }: { rating: string }) {
  return (
    <div className="mt-4 p-4 bg-gray-800 text-white rounded-md">
      <p className="mt-2">{corrosionDescriptions[rating] || 'No description available.'}</p>
    </div>
  );
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [classificationResult, setClassificationResult] = useState<string | null>(null);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const onDrop = (acceptedFiles: File[]) => {
    setSelectedFile(acceptedFiles[0]);
  };

  // Move this hook outside of onDrop function
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.png'],
    },
    maxFiles: 1,
    multiple: false,
    onDrop,
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select an image to upload.');
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please upload a valid image (JPEG, PNG).');
      return;
    }

    setLoading(true);
    setHeatmapUrl(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('https://huggingface.co/spaces/andreamena/material_corrosion_backend', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 2sQmqAJ0IMAPb0Cfz6NBPhCbTcw_5sdEaQe4sMjJ58pg6aceB',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload and classify the image.');
      }

      const data = await response.json();
      console.log('Backend Response:', data);
      setClassificationResult(String(data.predicted_corrosion_level));
      console.log('Classification Result:', data['predicted corrosion level']);
      setHeatmapUrl(`${data.heatmap_url}`);
      console.log('Selected File:', selectedFile);
      console.log('Classification Result:', classificationResult);
      console.log('Heatmap URL:', heatmapUrl);


    } catch (error) {
      alert('An error occurred while processing your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-2xl font-bold mb-4 text-center">Corrosion Classifier</h1>
        <br />

        <div className="mb-4">
          <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">
            Upload an Image (Drag & Drop or Click to Select)
          </label>
          <br />
          <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} id="image-upload" type="file" />
          </div>
        </div>
        <br />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full mt-4 p-2 bg-blue-500 text-white rounded-md"
        >
          {loading ? 'Processing...' : 'Upload and Classify'}
        </button>

        {loading && (
          <div className="mt-4">
            <ClipLoader size={50} color="#36d7b7" />
          </div>
        )}

        {classificationResult && (
                <div className="mt-6">
                  <h3 className="mt-2">Predicted Corrosion Level: {classificationResult}</h3>

                  {corrosionDescriptions[classificationResult] && (
                    <CorrosionRatingGuide rating={String(classificationResult)} />
                  )}

                  {heatmapUrl ? (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold">Grad-CAM Heatmap</h3>
                      <img
                        key={`${heatmapUrl}?t=${new Date().getTime()}`}
                        src={heatmapUrl}
                        alt="Grad-CAM Heatmap"
                        className="heatmap-image"
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </header>
          </div>
        );
}

export default App;
